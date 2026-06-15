import './Manual.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Manual() {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('');
  const [isInputStarted, setIsInputStarted] = useState(false);
  const [answerCode, setAnswerCode] = useState('');
  const [applyOnEnter, setApplyOnEnter] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [responses, setResponses] = useState({});
  const [hideRules, setHideRules] = useState({});
  const [transitionRules, setTransitionRules] = useState({});
  const [contradictionRules, setContradictionRules] = useState({});
  const [completedQuestions, setCompletedQuestions] = useState(new Set());

  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  let notificationTimeout = null;

  // Функция проверки условия для открытого вопроса
  const isConditionMetForOpen = (selectedValues, condition) => {
    const inputText = selectedValues && selectedValues.length > 0 ? selectedValues[0].trim() : '';
    const hasText = inputText !== '';

    // Если в условии указаны конкретные ответы (не пустые строки)
    const hasSpecificAnswers = condition.answers && condition.answers.some(a => a && a.trim() !== '');

    if (!hasSpecificAnswers) {
      // Старая логика: проверяем только наличие текста
      if (condition.type === 'selected') return hasText;
      if (condition.type === 'not_selected') return !hasText;
      return false;
    }

    // Логика с проверкой совпадения с заданными ответами
    const matchesAnyAnswer = condition.answers.some(answer =>
      answer && answer.trim() !== '' && inputText === answer.trim()
    );

    if (condition.type === 'selected') {
      return matchesAnyAnswer;
    } else if (condition.type === 'not_selected') {
      // Не выбран – значит, либо текст пуст, либо не совпадает ни с одним из ответов
      return !hasText || !matchesAnyAnswer;
    }
    return false;
  };

  // Проверяет, есть ли хотя бы одно активное противоречие среди всех видимых вопросов
  const hasAnyActiveContradiction = () => {
    for (const question of questions) {
      if (isQuestionHidden(question.id)) continue;
      if (hasContradiction(question.id)) return true;
    }
    return false;
  };

  // Обновлённая основная функция isConditionMet
  const isConditionMet = (question, selectedValues, condition) => {
    // Для открытых вопросов используем специальную логику
    if (question.type === 'open') {
      const hasText = selectedValues && selectedValues.length > 0 && selectedValues[0].trim() !== '';
      if (condition.type === 'selected') return hasText;
      if (condition.type === 'not_selected') return !hasText;
      return false;
    }

    // Для закрытых вопросов оставляем прежнюю логику
    if (!selectedValues || selectedValues.length === 0) return false;
    const values = selectedValues;

    if (condition.type === 'selected') {
      return condition.answers.some(answerValue =>
        values.some(v => v === answerValue)
      );
    } else if (condition.type === 'not_selected') {
      return !condition.answers.some(answerValue =>
        values.some(v => v === answerValue)
      );
    }
    return false;
  };

  const showNotification = (message, type = 'error') => {
    if (notificationTimeout) clearTimeout(notificationTimeout);
    setNotification({ show: true, message, type });
    notificationTimeout = setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 15000);
  };

  useEffect(() => {
    // Проверяем все вопросы на наличие активного противоречия
    const hasActiveContradiction = questions.some(q => {
      if (isQuestionHidden(q.id)) return false;
      return hasContradiction(q.id);
    });

    if (hasActiveContradiction) {
      showNotification('Внимание! Обнаружено противоречие, проверьте правильность введенных данных', 'error');
    }
  }, [selectedAnswers, questions]);

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  const fetchQuestionnaires = async () => {
    try {
      const response = await axios.get('/api/questionnaires');
      setQuestionnaires(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Ошибка загрузки анкет:', err);
    }
  };

  const handleStartInput = async () => {
    if (!selectedQuestionnaire) {
      alert('Пожалуйста, выберите анкету');
      return;
    }
    try {
      const response = await axios.get(`/api/questionnaire/${selectedQuestionnaire}/full`);
      const questionnaire = response.data;
      const allQuestions = questionnaire.questions || [];
      const sortedQuestions = [...allQuestions].sort((a, b) => {
        const getPriority = (blockType) => {
          if (blockType === 'passport') return 1;
          if (blockType === 'main') return 2;
          return 3;
        };
        const aPriority = getPriority(a.block_type);
        const bPriority = getPriority(b.block_type);
        if (aPriority !== bPriority) return aPriority - bPriority;
        return (a.order_index || 0) - (b.order_index || 0);
      });
      setQuestions(sortedQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setResponses({});
      setIsInputStarted(true);
      setCompletedQuestions(new Set());

      const rules = { hide: {}, transition: {}, contradiction: {} };
      sortedQuestions.forEach(q => {
        if (q.hide_rules) {
          try { rules.hide[q.id] = JSON.parse(q.hide_rules); } catch (e) { }
        }
        if (q.transition_rules) {
          try { rules.transition[q.id] = JSON.parse(q.transition_rules); } catch (e) { }
        }
        if (q.contradiction_rules) {
          try { rules.contradiction[q.id] = JSON.parse(q.contradiction_rules); } catch (e) { }
        }
      });
      setHideRules(rules.hide);
      setTransitionRules(rules.transition);
      setContradictionRules(rules.contradiction);
    } catch (err) {
      console.error('Ошибка загрузки анкеты:', err);
      alert('Ошибка загрузки анкеты');
    }
  };

  const isQuestionHidden = (questionId) => {
    const rule = hideRules[questionId];
    if (!rule || !rule.conditions) return false;
    return rule.conditions.some(condition => {
      const conditionQuestion = questions.find(q => q.id === condition.questionId);
      if (!conditionQuestion) return false;
      const selectedForQuestion = selectedAnswers[condition.questionId];
      if (!selectedForQuestion) return false;
      // Используем новую функцию
      return isConditionMet(conditionQuestion, selectedForQuestion, condition);
    });
  };

  const hasContradiction = (questionId) => {
    const rule = contradictionRules[questionId];
    if (!rule) return false;

    const currentAnswers = selectedAnswers[questionId];
    if (!currentAnswers || currentAnswers.length === 0) return false;

    const currentQuestion = questions.find(q => q.id === questionId);
    if (!currentQuestion) return false;

    // Проверяем условие на текущем вопросе
    const conditionMet = isConditionMet(currentQuestion, currentAnswers, { type: rule.type, answers: rule.answers });
    if (!conditionMet) return false;

    const contradictId = rule.contradictQuestionId;
    if (!contradictId) return false;

    const contradictAnswersSelected = selectedAnswers[contradictId];
    if (!contradictAnswersSelected || contradictAnswersSelected.length === 0) return false;
    const contradictQuestion = questions.find(q => q.id === contradictId);
    if (!contradictQuestion) return false;

    // Проверяем, выбран ли один из противоречащих ответов
    const contradictMet = isConditionMet(contradictQuestion, contradictAnswersSelected, {
      type: 'selected',
      answers: rule.contradictAnswers
    });
    return contradictMet;
  };

  const markQuestionCompleted = (questionId) => {
    setCompletedQuestions(prev => new Set(prev).add(questionId));
  };

  const unmarkQuestionCompleted = (questionId) => {
    setCompletedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
  };

  const getNextQuestionIndex = () => {
    const currentQ = questions[currentQuestionIndex];
    const rule = transitionRules[currentQ.id];
    let nextIndex = currentQuestionIndex + 1;

    if (rule && rule.conditions) {
      const conditionsMet = rule.conditions.every(condition => {
        const selected = selectedAnswers[currentQ.id];
        if (!selected) return false;
        return isConditionMet(currentQ, selected, condition);
      });
      if (conditionsMet) {
        if (rule.action === 'question') {
          const targetIndex = questions.findIndex(q => q.id === rule.targetQuestionId);
          if (targetIndex !== -1) nextIndex = targetIndex;
        }
        else if (rule.action === 'block') {
          const targetBlockId = rule.targetBlockId;
          if (targetBlockId) {
            // Ищем первый вопрос, у которого block_type совпадает с целевым блоком
            const targetIndex = questions.findIndex(q => q.block_type === targetBlockId);
            if (targetIndex !== -1) nextIndex = targetIndex;
          }
        }
        else if (rule.action === 'end') {
          return questions.length;
        }
      }
    }
    return getNextVisibleIndex(nextIndex);
  };

  const handleAnswerCodeInput = (e) => {
    const code = e.target.value;
    setAnswerCode(code);
    if (e.key === 'Enter') {
      e.preventDefault();
      if (applyOnEnter) {
        handleApplyAnswerCode(code);
      }
    }
  };

  const handleApplyAnswerCode = (code) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    if (currentQ.type === 'open') return;
    const answer = currentQ.answers.find(a => a.answer_code === code);
    if (!answer) {
      alert('Ответ с таким кодом не найден');
      return;
    }
    const newSelected = [answer.text];
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: newSelected }));
    unmarkQuestionCompleted(currentQ.id);
    setResponses(prev => ({ ...prev, [currentQ.id]: newSelected }));
    setAnswerCode('');
  };

  const handleAnswerSelect = (answer) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    const isMultiple = currentQ.max_answers !== 1;
    let newSelected;
    if (isMultiple) {
      newSelected = selectedAnswers[currentQ.id] || [];
      if (newSelected.includes(answer.text)) {
        newSelected = newSelected.filter(a => a !== answer.text);
      } else {
        newSelected = [...newSelected, answer.text];
      }
    } else {
      newSelected = [answer.text];
    }
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: newSelected }));
    setResponses(prev => ({ ...prev, [currentQ.id]: newSelected }));
  };

  const handleOpenQuestionInput = (e) => {
    const value = e.target.value;
    const currentQ = questions[currentQuestionIndex];
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: [value] }));
    unmarkQuestionCompleted(currentQ.id);
    unmarkQuestionCompleted(currentQ.id);
    setResponses(prev => ({ ...prev, [currentQ.id]: [value] }));
  };

  const handleNext = () => {
    const currentQ = questions[currentQuestionIndex];

    // Если текущий вопрос скрыт – переходим к следующему видимому
    if (isQuestionHidden(currentQ.id)) {
      const nextIndex = getNextVisibleIndex(currentQuestionIndex + 1);
      if (nextIndex >= questions.length) {
        handleFinish();
      } else {
        setCurrentQuestionIndex(nextIndex);
        setAnswerCode('');
      }
      return;
    }

    // Проверка наличия ответа
    if (!selectedAnswers[currentQ.id] || selectedAnswers[currentQ.id][0] === '') {
      alert('Пожалуйста, введите ответ');
      return;
    }

    // Проверка противоречия
    if (hasContradiction(currentQ.id)) {
      alert('Невозможно перейти к следующему вопросу: обнаружено противоречие в ответах');
      showNotification('Невозможно перейти к следующему вопросу: обнаружено противоречие в ответах', 'error');
      return;
    }

    // Помечаем текущий вопрос как завершённый
    markQuestionCompleted(currentQ.id);

    const nextIndex = getNextQuestionIndex();
    if (nextIndex >= questions.length) {
      handleFinish();
    } else {
      setCurrentQuestionIndex(nextIndex);
      setAnswerCode('');
    }
  };

  const handleCancel = () => {
    if (confirm('Вы уверены, что хотите отменить интервью?')) {
      setIsInputStarted(false);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setResponses({});
      setAnswerCode('');
    }
  };

  const handleFinish = async () => {
    // Проверяем наличие противоречий
    if (hasAnyActiveContradiction()) {
      showNotification('В интервью обнаружено противоречие! Пожалуйста, исправьте ответы.', 'error');
      return;
    }

    try {
      const responseData = {
        questionnaire_id: selectedQuestionnaire,
        responses: responses,
        completed_at: new Date().toISOString()
      };
      console.log('Интервью завершено:', responseData);
      alert('Интервью успешно завершено');
      setIsInputStarted(false);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setResponses({});
      setAnswerCode('');
    } catch (err) {
      console.error('Ошибка завершения интервью:', err);
      alert('Ошибка при завершении интервью');
    }
  };

  // Возвращает индекс следующего видимого (не скрытого) вопроса, начиная с startIndex
  const getNextVisibleIndex = (startIndex) => {
    for (let i = startIndex; i < questions.length; i++) {
      if (!isQuestionHidden(questions[i].id)) {
        return i;
      }
    }
    return questions.length; // все оставшиеся вопросы скрыты → завершение
  };

  if (!isInputStarted) {
    return (
      <div className="manual-container">
        <h2>Ручной ввод данных</h2>
        <div className="manual-select-section">
          <label>Выберите анкету:</label>
          <select
            value={selectedQuestionnaire}
            onChange={(e) => setSelectedQuestionnaire(e.target.value)}
            className="manual-select"
          >
            <option value="">-- Выберите анкету --</option>
            {questionnaires.map(q => (
              <option key={q.id} value={q.id}>
                {q.name} (Код: {q.code})
              </option>
            ))}
          </select>
          <button onClick={handleStartInput} className="manual-start-btn">
            Начать ввод данных
          </button>
        </div>
      </div>
    );
  }

  if (currentQuestionIndex >= questions.length) {
    return (
      <div className="manual-container">
        <h2>Интервью завершено</h2>
        <p>Спасибо за заполнение анкеты!</p>
        <button onClick={handleCancel} className="manual-cancel-btn">
          Вернуться
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="manual-container manual-input-container">
      <div className="manual-header">
        <div className="manual-top-buttons">
          <button onClick={handleCancel} className="manual-cancel-btn">Отменить</button>
          <button onClick={handleFinish} className="manual-finish-btn">Завершить интервью</button>
        </div>
      </div>

      <div className="manual-answer-code-section">
        <div className="manual-code-input-group">
          <label>Код ответа</label>
          <input
            type="text"
            value={answerCode}
            onChange={handleAnswerCodeInput}
            onKeyDown={handleAnswerCodeInput}
            placeholder="Введите код ответа"
            className="manual-code-input"
            disabled={currentQuestion.type === 'open'}
          />
        </div>
        <div className="switcher-container">
          <p>Применять по Enter</p>
          <input type="checkbox" id="checkbox-switcher" className="options-switcher" checked={applyOnEnter}
            onChange={(e) => setApplyOnEnter(e.target.checked)} />
          <label htmlFor="checkbox-switcher" className="options-switcher-label"></label>
        </div>
      </div>

      <div className="manual-questions-numbers">
        {questions.map((question, idx) => {
          const hidden = isQuestionHidden(question.id);
          const contradiction = !hidden && hasContradiction(question.id);
          const answered = !hidden && !contradiction && completedQuestions.has(question.id);
          return (
            <button
              key={question.id}
              className={`manual-question-number ${question.id === currentQuestion.id ? 'active' : ''} ${hidden ? 'hidden' : ''} ${contradiction ? 'contradiction' : ''} ${answered ? 'answered' : ''}`}
              onClick={() => {
                if (hidden || contradiction) return;
                const index = questions.findIndex(q => q.id === question.id);
                setCurrentQuestionIndex(index);
                setAnswerCode('');
              }}
              disabled={hidden || contradiction}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
      <div className="manual-question-section">
        <h3 className="manual-question-text">
          {currentQuestionIndex + 1}. {currentQuestion.text}
        </h3>
        {currentQuestion.explanation && (
          <p className="manual-question-explanation">{currentQuestion.explanation}</p>
        )}

        <div className="manual-answers">
          {currentQuestion.type === 'open' ? (
            <div className="manual-open-answer-input">
              <label className="manual-open-answer-label">
                {currentQuestion.answers?.[0]?.text || 'Введите ваш ответ'}
              </label>
              <input
                type="text"
                value={selectedAnswers[currentQuestion.id]?.[0] || ''}
                onChange={handleOpenQuestionInput}
                placeholder={'Введите ваш ответ'}
                className="manual-open-answer-input-field"
              />
            </div>
          ) : (
            currentQuestion.answers.map((answer) => (
              <label key={answer.id} className="manual-answer-item">
                <input
                  type={currentQuestion.max_answers === 1 ? 'radio' : 'checkbox'}
                  name={`question-${currentQuestion.id}`}
                  checked={selectedAnswers[currentQuestion.id]?.includes(answer.text) || false}
                  onChange={() => handleAnswerSelect(answer)}
                />
                <span className="manual-answer-code">{answer.answer_code}</span>
                <span className="manual-answer-text">{answer.text || answer.type}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="manual-footer">
        <button onClick={handleNext} className="manual-next-btn">Следующий</button>
      </div>
      {notification.show && (
        <div className={`manual-notification manual-notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
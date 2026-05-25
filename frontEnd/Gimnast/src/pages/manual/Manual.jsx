import './Manual.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Manual() {
  // Состояния для выбора анкеты
  const [questionnaires, setQuestionnaires] = useState([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('');
  
  // Состояния для интервью
  const [isInputStarted, setIsInputStarted] = useState(false);
  const [answerCode, setAnswerCode] = useState('');
  const [applyOnEnter, setApplyOnEnter] = useState(true);
  
  // Состояния для вопросов и ответов
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [responses, setResponses] = useState({});
  
  // Состояния для правил
  const [hideRules, setHideRules] = useState({});
  const [transitionRules, setTransitionRules] = useState({});
  const [contradictionRules, setContradictionRules] = useState({});
  
  // Загрузка анкет при монтировании
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
      const response = await axios.get(
        `/api/questionnaire/${selectedQuestionnaire}/full`
      );
      const questionnaire = response.data;
      
      // Загружаем вопросы из всех блоков
      const allQuestions = questionnaire.questions || [];
      setQuestions(allQuestions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setResponses({});
      setIsInputStarted(true);

      // Загружаем правила
      const rules = { hide: {}, transition: {}, contradiction: {} };
      allQuestions.forEach(q => {
        if (q.hide_rules) {
          try {
            rules.hide[q.id] = JSON.parse(q.hide_rules);
          } catch (e) {
            console.error('Ошибка парсинга правил скрытия:', e);
          }
        }
        if (q.transition_rules) {
          try {
            rules.transition[q.id] = JSON.parse(q.transition_rules);
          } catch (e) {
            console.error('Ошибка парсинга правил перехода:', e);
          }
        }
        if (q.contradiction_rules) {
          try {
            rules.contradiction[q.id] = JSON.parse(q.contradiction_rules);
          } catch (e) {
            console.error('Ошибка парсинга правил противоречия:', e);
          }
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

    // Проверяем выполнение всех условий
    return rule.conditions.some(condition => {
      const conditionQuestion = questions.find(q => q.id === condition.questionId);
      if (!conditionQuestion) return false;

      const selectedForQuestion = selectedAnswers[condition.questionId];
      if (!selectedForQuestion) return false;

      if (condition.type === 'selected') {
        return condition.answers.some(ans => selectedForQuestion.includes(ans));
      } else if (condition.type === 'not_selected') {
        return !condition.answers.some(ans => selectedForQuestion.includes(ans));
      }
      return false;
    });
  };

  const getNextQuestionIndex = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const rule = transitionRules[currentQuestion.id];

    if (rule && rule.conditions) {
      const conditionsMet = rule.conditions.every(condition => {
        const selected = selectedAnswers[currentQuestion.id];
        if (!selected) return false;

        if (condition.type === 'selected') {
          return condition.answers.some(ans => selected.includes(ans));
        } else if (condition.type === 'not_selected') {
          return !condition.answers.some(ans => selected.includes(ans));
        }
        return false;
      });

      if (conditionsMet) {
        if (rule.action === 'question') {
          const targetIndex = questions.findIndex(q => q.id === rule.targetQuestionId);
          if (targetIndex !== -1) return targetIndex;
        } else if (rule.action === 'end') {
          return questions.length;
        }
      }
    }

    return currentQuestionIndex + 1;
  };

  const handleAnswerCodeInput = (e) => {
    const code = e.target.value;
    setAnswerCode(code);

    if (applyOnEnter && e.key === 'Enter') {
      handleApplyAnswerCode(code);
    }
  };

  const handleApplyAnswerCode = (code) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const answer = currentQuestion.answers.find(a => a.answer_code === code);
    if (!answer) {
      alert('Ответ с таким кодом не найден');
      return;
    }

    const newSelected = [answer.text];
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: newSelected
    }));

    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: newSelected
    }));

    setAnswerCode('');
  };

  const handleAnswerSelect = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const isMultiple = currentQuestion.max_answers !== 1;
    let newSelected;

    if (isMultiple) {
      newSelected = selectedAnswers[currentQuestion.id] || [];
      if (newSelected.includes(answer.text)) {
        newSelected = newSelected.filter(a => a !== answer.text);
      } else {
        newSelected = [...newSelected, answer.text];
      }
    } else {
      newSelected = [answer.text];
    }

    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: newSelected
    }));

    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: newSelected
    }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!selectedAnswers[currentQuestion.id]) {
      alert('Пожалуйста, выберите ответ');
      return;
    }

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
          <button
            onClick={handleStartInput}
            className="manual-start-btn"
          >
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
  const visibleQuestions = questions.filter(q => !isQuestionHidden(q.id));

  return (
    <div className="manual-container manual-input-container">
      <div className="manual-header">
        <div className="manual-top-buttons">
          <button onClick={handleCancel} className="manual-cancel-btn">
            Отменить
          </button>
          <button onClick={handleFinish} className="manual-finish-btn">
            Завершить интервью
          </button>
        </div>
      </div>

      <div className="manual-answer-code-section">
        <div className="manual-code-input-group">
          <label>Код ответа</label>
          <input
            type="text"
            value={answerCode}
            onChange={handleAnswerCodeInput}
            onKeyPress={handleAnswerCodeInput}
            placeholder="Введите код ответа"
            className="manual-code-input"
          />
        </div>

        <div className="manual-apply-enter">
          <label>Применять по Enter</label>
          <div className="manual-switch">
            <input
              type="checkbox"
              checked={applyOnEnter}
              onChange={(e) => setApplyOnEnter(e.target.checked)}
              className="manual-switch-input"
            />
            <span className="manual-switch-slider"></span>
          </div>
        </div>
      </div>

      <div className="manual-questions-numbers">
        {visibleQuestions.map((q, idx) => (
          <button
            key={q.id}
            className={`manual-question-number ${
              q.id === currentQuestion.id ? 'active' : ''
            }`}
            onClick={() => {
              const index = questions.findIndex(qu => qu.id === q.id);
              setCurrentQuestionIndex(index);
              setAnswerCode('');
            }}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <div className="manual-question-section">
        <h3 className="manual-question-text">
          {currentQuestionIndex + 1}. {currentQuestion.text}
        </h3>

        {currentQuestion.explanation && (
          <p className="manual-question-explanation">
            {currentQuestion.explanation}
          </p>
        )}

        <div className="manual-answers">
          {currentQuestion.answers.map((answer) => (
            <label key={answer.id} className="manual-answer-item">
              <input
                type={currentQuestion.max_answers === 1 ? 'radio' : 'checkbox'}
                name={`question-${currentQuestion.id}`}
                checked={
                  selectedAnswers[currentQuestion.id]?.includes(answer.text) ||
                  false
                }
                onChange={() => handleAnswerSelect(answer)}
              />
              <span className="manual-answer-code">
                {answer.answer_code}
              </span>
              <span className="manual-answer-text">
                {answer.text || answer.type}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="manual-footer">
        <button onClick={handleNext} className="manual-next-btn">
          Следующий
        </button>
      </div>
    </div>
  );
}

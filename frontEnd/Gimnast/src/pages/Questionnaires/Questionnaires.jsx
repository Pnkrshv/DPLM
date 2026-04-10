import "./Questionnaires.css";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export default function Questionnaires() {
  const [scope, setScope] = useState("regions");
  const [isModalopen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeBlock, setActiveBlock] = useState('questions');
  const [selectedQuestionBlock, setSelectedQuestionBlock] = useState('main'); // 'main', 'passport', или 'additional_N'
  const [expandedDistricts, setExpandedDistricts] = useState({});
  const [selectedCities, setSelectedCities] = useState({});
  const [questionMenuOpen, setQuestionMenuOpen] = useState(false);
  const [questionMenuPosition, setQuestionMenuPosition] = useState({ x: 0, y: 0 });
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedBlockForMenu, setSelectedBlockForMenu] = useState(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [settingsMenuPosition, setSettingsMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedQuestionForSettings, setSelectedQuestionForSettings] = useState(null);
  const [questionSettings, setQuestionSettings] = useState({}); // {questionId: {allow_adaptation: bool, allow_answer_adaptation: bool, required: bool, no_contradictions: bool, audio_recording: bool}}
  const [hideRules, setHideRules] = useState({}); // {questionId: {conditions: [{questionId, type, answers: []}]}}
  const [transitionRules, setTransitionRules] = useState({}); // {questionId: {conditions, action, targetQuestionId, targetBlockId}}
  const [contradictionRules, setContradictionRules] = useState({}); // {questionId: {type, answers, contradictQuestionId, contradictAnswers, forbidContradictions}}
  const [isHideRuleModalOpen, setIsHideRuleModalOpen] = useState(false);
  const [hideRuleData, setHideRuleData] = useState({
    questionId: null,
    conditions: [] // [{questionId, type: 'selected'|'not_selected', answers: []}]
  });
  const [isTransitionRuleModalOpen, setIsTransitionRuleModalOpen] = useState(false);
  const [transitionRuleData, setTransitionRuleData] = useState({
    questionId: null,
    conditions: [], // [{type: 'selected'|'not_selected', answers: []}]
    action: 'end', // 'question', 'block', 'end'
    targetQuestionId: null,
    targetBlockId: null
  });
  const [isContradictionModalOpen, setIsContradictionModalOpen] = useState(false);
  const [contradictionData, setContradictionData] = useState({
    questionId: null,
    type: 'selected', // 'selected' | 'not_selected'
    answers: [''],
    contradictQuestionId: null,
    contradictAnswers: [],
    forbidContradictions: false
  });
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [currentQuestionType, setCurrentQuestionType] = useState(null);
  const [questionData, setQuestionData] = useState({ text: '', explanation: '', answers: [] });
  const [questionProperties, setQuestionProperties] = useState({
    maxAnswers: '',
    shuffleAnswers: false,
    regionScope: 'all'
  });
  const [answerMenuOpen, setAnswerMenuOpen] = useState(false);
  const [answerMenuPosition, setAnswerMenuPosition] = useState({ x: 0, y: 0 });
  const [questions, setQuestions] = useState([]);
  const [passportQuestions, setPassportQuestions] = useState([]); // Вопросы паспортички
  const [additionalBlocks, setAdditionalBlocks] = useState([]); // Дополнительные блоки [{id, name, questions}]
  const [currentQuestionnaire, setCurrentQuestionnaire] = useState(null);
  const [questionnaireName, setQuestionnaireName] = useState('');
  const [questionnaireDescription, setQuestionnaireDescription] = useState('');
  const [questionnaireCode, setQuestionnaireCode] = useState('');
  const districtRefs = useRef({});

  // Пагинация для таблицы анкет
  const [questionnaireList, setQuestionnaireList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(questionnaireList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentQuestionnaires = questionnaireList.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (cities && Object.keys(cities).length > 0) {
      setSelectedCities({});
      setExpandedDistricts({});
    }
  }, [cities]);

  useEffect(() => {
    if (!cities) return;
    Object.keys(cities).forEach(district => {
      const citiesList = Object.values(cities[district]).flat();
      const total = citiesList.length;
      const selectedCount = citiesList.filter(city => selectedCities[district]?.[city]).length;
      const checkbox = districtRefs.current[district];
      if (checkbox) {
        checkbox.checked = selectedCount > 0 && selectedCount === total;
        checkbox.indeterminate = selectedCount > 0 && selectedCount < total;
      }
    });
  }, [selectedCities, cities]);

  const handleDistrictChange = (district, checked) => {
    const citiesList = Object.values(cities[district]).flat();
    const updateDistrict = {};
    citiesList.forEach(city => { updateDistrict[city] = checked; });
    setSelectedCities(prev => ({
      ...prev,
      [district]: updateDistrict
    }))
  }

  const handleCityChange = (district, city, checked) => {
    setSelectedCities(prev => ({
      ...prev,
      [district]: {
        ...(prev[district] || {}),
        [city]: checked
      }
    }));
  };

  const toggleExpand = (district) => {
    setExpandedDistricts(prev => ({
      ...prev,
      [district]: !prev[district]
    }));
  };

  const fetchCities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:8080/cities");
      setCities(response.data);
    } catch (err) {
      console.error("Ошибка при загрузке городов", err);

      if (axios.isAxiosError(err)) {
        if (err.response) {
          //Сервер ответил с кодом ошибки
          setError(
            `Ошибка сервера: ${err.response.status} - ${err.response.data.error}`,
          );
        } else if (err.request) {
          //Запрос сделан, но ответ не получен
          setError(`Ошибка подключения к серверу: ${err.message}`);
        } else {
          //Ошибка запроса
          setError(`Ошибка запроса: ${err.message}`);
        }
      } else {
        setError("Неизвестная ошибка...");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isModalopen && scope === "cities") {
      if (cities.length === 0 && !loading) {
        fetchCities();
      }
    }
  }, [isModalopen, scope, cities.length, loading]);

  const handleSaveQuestionnaire = async () => {
    if (!questionnaireName.trim()) {
      alert('Введите название анкеты');
      return;
    }

    try {
      // Собираем данные анкеты
      const questionnaireData = {
        name: questionnaireName,
        code: questionnaireCode,
        description: questionnaireDescription,
        scope: scope,
        cities: scope === 'cities' ? selectedCities : null
      };

      // Отправляем запрос на создание анкеты
      const response = await axios.post('http://localhost:8080/questionnaire', questionnaireData);

      // Сохраняем ID созданной анкеты
      const questionnaireId = response.data.id;
      setCurrentQuestionnaire({ id: questionnaireId, ...questionnaireData });

      // Очищаем форму
      setQuestionnaireName('');
      setQuestionnaireCode('');
      setQuestionnaireDescription('');
      setQuestions([]);
      setPassportQuestions([]);
      setAdditionalBlocks([]);
      setSelectedCities({});

      // Закрываем модальное окно
      setIsModalOpen(false);

      // Открываем окно настроек и загружаем вопросы
      setIsSettingsOpen(true);
      fetchQuestions(questionnaireId);

      // Обновляем список анкет
      fetchQuestionnaires();
    } catch (err) {
      console.error('Ошибка при сохранении анкеты:', err);
      alert('Ошибка при сохранении анкеты: ' + (err.response?.data?.error || err.message));
    }
  };

  const openQuestionnaireModal = () => {
    setQuestionnaireName('');
    setQuestionnaireCode('');
    setQuestionnaireDescription('');
    setScope('regions');
    setSelectedCities({});
    setQuestions([]);
    setPassportQuestions([]);
    setAdditionalBlocks([]);
    setIsModalOpen(true);
  };

  // Загрузка вопросов для текущей анкеты
  const fetchQuestions = async (questionnaireId) => {
    try {
      const response = await axios.get(`http://localhost:8080/questionnaire/${questionnaireId}/questions`);
      const allQuestions = response.data;

      // Разделяем вопросы на основные, паспортичку и дополнительные блоки
      const mainQ = allQuestions.filter(q => q.block_type === 'main');
      const passportQ = allQuestions.filter(q => q.block_type === 'passport');

      // Группируем дополнительные блоки
      const additionalBlocksMap = {};
      allQuestions.forEach(q => {
        if (q.block_type && q.block_type.startsWith('additional_')) {
          if (!additionalBlocksMap[q.block_type]) {
            additionalBlocksMap[q.block_type] = [];
          }
          additionalBlocksMap[q.block_type].push(q);
        }
      });

      // Создаем массив дополнительных блоков
      const additionalBlocksArr = Object.keys(additionalBlocksMap).map((blockId, index) => ({
        id: blockId,
        name: `Дополнительный блок ${index + 1}`,
        questions: additionalBlocksMap[blockId]
      }));

      // Загружаем правила скрытия для каждого вопроса
      const hideRulesData = {};
      // Загружаем правила перехода для каждого вопроса
      const transitionRulesData = {};
      // Загружаем правила противоречий для каждого вопроса
      const contradictionRulesData = {};
      allQuestions.forEach(q => {
        if (q.hide_rules && q.hide_rules.trim()) {
          try {
            const parsed = JSON.parse(q.hide_rules);
            if (parsed && parsed.conditions) {
              hideRulesData[q.id] = parsed;
            }
          } catch (e) {
            console.error('Ошибка парсинга правил скрытия:', e);
          }
        }
        if (q.transition_rules && q.transition_rules.trim()) {
          try {
            const parsed = JSON.parse(q.transition_rules);
            if (parsed && parsed.conditions) {
              transitionRulesData[q.id] = parsed;
            }
          } catch (e) {
            console.error('Ошибка парсинга правил перехода:', e);
          }
        }
        if (q.contradiction_rules && q.contradiction_rules.trim()) {
          try {
            const parsed = JSON.parse(q.contradiction_rules);
            if (parsed) {
              contradictionRulesData[q.id] = parsed;
            }
          } catch (e) {
            console.error('Ошибка парсинга правил противоречий:', e);
          }
        }
      });
      setHideRules(hideRulesData);
      setTransitionRules(transitionRulesData);
      setContradictionRules(contradictionRulesData);

      setQuestions(mainQ);
      setPassportQuestions(passportQ);
      setAdditionalBlocks(additionalBlocksArr);
    } catch (err) {
      console.error('Ошибка при загрузке вопросов:', err);
      setQuestions([]);
      setPassportQuestions([]);
      setAdditionalBlocks([]);
    }
  };

  // Экспорт анкеты в Word
  const exportToWord = async () => {
    if (!currentQuestionnaire || !currentQuestionnaire.id) {
      alert('Анкета не выбрана');
      return;
    }

    try {
      // Загружаем полную анкету с вопросами и ответами
      const response = await axios.get(`http://localhost:8080/questionnaire/${currentQuestionnaire.id}/full`);
      const questionnaire = response.data;

      // Создаем документ Word
      const docChildren = [];

      // Заголовок анкеты
      docChildren.push(
        new Paragraph({
          text: questionnaire.name || 'Анкета',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      );

      // Код анкеты
      if (questionnaire.code) {
        docChildren.push(
          new Paragraph({
            text: `Код: ${questionnaire.code}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          })
        );
      }

      // Описание
      if (questionnaire.description) {
        docChildren.push(
          new Paragraph({
            text: questionnaire.description,
            italics: true,
            spacing: { after: 300 }
          })
        );
      }

      // Функция для добавления вопроса в документ
      const addQuestionToDoc = (question, index) => {
        // Номер и текст вопроса
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. ${question.text}`,
                bold: true,
                size: 24
              })
            ],
            spacing: { before: 200, after: 100 }
          })
        );

        // Пояснение к вопросу (если есть)
        if (question.explanation) {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: question.explanation,
                  italics: true,
                  size: 20
                })
              ],
              spacing: { after: 100 }
            })
          );
        }

        // Варианты ответов
        if (question.answers && question.answers.length > 0) {
          question.answers.forEach((answer, ansIndex) => {
            const answerText = answer.text || answer.type;
            if (answerText) {
              docChildren.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${String.fromCharCode(1072 + ansIndex)}) ${answerText}`,
                      size: 22,
                    })
                  ],
                  spacing: { after: 50 }
                })
              );
            }
          });
        }

        // Добавляем пустую строку после вопроса
        docChildren.push(
          new Paragraph({
            text: '',
            spacing: { after: 200 }
          })
        );
      };

      // Сначала добавляем вопросы паспортички
      const passportQuestions = (questionnaire.questions || []).filter(q => q.block_type === 'passport');
      const mainQuestions = (questionnaire.questions || []).filter(q => q.block_type === 'main');
      const additionalQuestions = (questionnaire.questions || []).filter(q => q.block_type && q.block_type.startsWith('additional_'));

      // Группируем дополнительные блоки для экспорта
      const additionalBlocksMap = {};
      additionalQuestions.forEach(q => {
        if (!additionalBlocksMap[q.block_type]) {
          additionalBlocksMap[q.block_type] = [];
        }
        additionalBlocksMap[q.block_type].push(q);
      });

      // Вопросы о респонденте (паспортичка) - идут первыми
      if (passportQuestions.length > 0) {
        passportQuestions.forEach((question, index) => {
          addQuestionToDoc(question, index);
        });
      }

      // Основные вопросы - идут после паспортички
      let questionCounter = passportQuestions.length;
      if (mainQuestions.length > 0) {
        mainQuestions.forEach((question, index) => {
          addQuestionToDoc(question, questionCounter + index);
        });
        questionCounter += mainQuestions.length;
      }

      // Дополнительные блоки - идут после основных вопросов
      Object.keys(additionalBlocksMap).forEach((blockId) => {
        const blockQuestions = additionalBlocksMap[blockId];
        if (blockQuestions.length > 0) {
          blockQuestions.forEach((question, index) => {
            addQuestionToDoc(question, questionCounter + index);
          });
          questionCounter += blockQuestions.length;
        }
      });

      // Создаем документ
      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren
        }]
      });

      // Генерируем и скачиваем файл
      const blob = await Packer.toBlob(doc);
      const fileName = `${questionnaire.name || questionnaire.code || 'anketa'}.docx`;
      saveAs(blob, fileName);

    } catch (err) {
      console.error('Ошибка при экспорте в Word:', err);
      alert('Ошибка при экспорте: ' + (err.response?.data?.error || err.message));
    }
  };

  // Открытие анкеты для редактирования
  const openQuestionnaire = async (questionnaireId) => {
    try {
      const response = await axios.get(`http://localhost:8080/questionnaire/${questionnaireId}`);
      const questionnaire = response.data;

      setCurrentQuestionnaire(questionnaire);
      setQuestionnaireName(questionnaire.name || '');
      setQuestionnaireCode(questionnaire.code || '');
      setQuestionnaireDescription(questionnaire.description || '');
      setScope(questionnaire.scope || 'regions');

      // Загружаем вопросы
      await fetchQuestions(questionnaireId);

      // Открываем окно настроек
      setIsSettingsOpen(true);
      setActiveBlock('questions');
    } catch (err) {
      console.error('Ошибка при загрузке анкеты:', err);
      alert('Ошибка при загрузке данных анкеты: ' + (err.response?.data?.error || err.message));
    }
  };

  // Удаление анкеты
  const deleteQuestionnaire = async (questionnaireId) => {
    if (!confirm('Вы уверены, что хотите удалить эту анкету?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8080/questionnaire/${questionnaireId}`);
      fetchQuestionnaires();
    } catch (err) {
      console.error('Ошибка при удалении анкеты:', err);
      alert('Ошибка при удалении анкеты: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAddQuestionClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    setQuestionMenuPosition({
      x: rect.left,
      y: rect.bottom + 5
    });
    setQuestionMenuOpen(true);
  };

  const handleBlockClick = (blockName) => {
    setSelectedQuestionBlock(blockName);
  };

  const handleAddBlock = () => {
    const newBlockId = `additional_${additionalBlocks.length}`;
    const newBlock = {
      id: newBlockId,
      name: `Дополнительный блок ${additionalBlocks.length + 1}`,
      questions: []
    };
    setAdditionalBlocks(prev => [...prev, newBlock]);
    setSelectedQuestionBlock(newBlockId);
  };

  const handleQuestionTypeSelect = (type) => {
    setCurrentQuestionType(type);
    setQuestionData({ text: '', explanation: '', answers: [] });
    setQuestionProperties({
      maxAnswers: '',
      shuffleAnswers: false,
      regionScope: 'all'
    });
    setQuestionMenuOpen(false);
    setIsQuestionFormOpen(true);
  };

  const handleAddAnswerClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    setAnswerMenuPosition({
      x: rect.left,
      y: rect.bottom + 5
    });
    setAnswerMenuOpen(true);
  };

  const handleAnswerTypeSelect = (answerType) => {
    let newAnswers = [];
    if (answerType === 'agree_disagree') {
      newAnswers = [
        { id: Date.now() + 1, type: answerType, text: 'Согласен' },
        { id: Date.now() + 2, type: answerType, text: 'Не согласен' }
      ];
    } else if (answerType === 'like_dislike') {
      newAnswers = [
        { id: Date.now() + 1, type: answerType, text: 'Нравится' },
        { id: Date.now() + 2, type: answerType, text: 'Не нравится' }
      ];
    } else {
      const newAnswer = {
        id: Date.now(),
        type: answerType,
        text: answerType === 'text' || answerType === 'other' ? '' : getAnswerLabel(answerType)
      };
      newAnswers = [newAnswer];
    }
    setQuestionData(prev => ({
      ...prev,
      answers: [...prev.answers, ...newAnswers]
    }));
    setAnswerMenuOpen(false);
  };

  const getAnswerLabel = (type) => {
    const labels = {
      'text': '',
      'other': '',
      'no_answer': 'Затрудняюсь ответить',
      'refuse': 'Отказываюсь отвечать',
      'agree_disagree': 'Согласен;Не согласен',
      'like_dislike': 'Нравится;Не нравится'
    };
    return labels[type] || type;
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      'open': 'Открытый',
      'closed': 'Закрытый',
      'mixed': 'Смешанный',
      'scale': 'Шкальный',
      'dichotomous': 'Дихотомический'
    };
    return labels[type] || type;
  };

  const getRegionLabel = (scope) => {
    const labels = {
      'all': 'Все регионы',
      'central': 'Центральный',
      'northwest': 'Северо-Западный',
      'south': 'Южный',
      'northcaucasus': 'Северо-Кавказский',
      'volga': 'Приволжский',
      'ural': 'Уральский',
      'siberia': 'Сибирский',
      'fareast': 'Дальневосточный'
    };
    return labels[scope] || scope;
  };

  const handleAnswerTextChange = (answerId, newText) => {
    setQuestionData(prev => ({
      ...prev,
      answers: prev.answers.map(answer =>
        answer.id === answerId ? { ...answer, text: newText } : answer
      )
    }));
  };

  const handleRemoveAnswer = (answerId) => {
    setQuestionData(prev => ({
      ...prev,
      answers: prev.answers.filter(answer => answer.id !== answerId)
    }));
  };

  const handleSaveQuestion = async () => {
    if (!questionData.text.trim()) {
      alert('Введите текст вопроса');
      return;
    }

    if (!currentQuestionnaire || !currentQuestionnaire.id) {
      alert('Анкета не создана. Сначала сохраните анкету.');
      return;
    }

    try {
      // Определяем order_index в зависимости от выбранного блока
      let orderIndex;
      if (selectedQuestionBlock === 'passport') {
        orderIndex = passportQuestions.length;
      } else if (selectedQuestionBlock === 'main') {
        orderIndex = questions.length;
      } else {
        // Дополнительный блок
        const blockIndex = additionalBlocks.findIndex(b => b.id === selectedQuestionBlock);
        orderIndex = blockIndex !== -1 ? additionalBlocks[blockIndex].questions.length : 0;
      }

      // Подготавливаем данные вопроса
      const questionPayload = {
        type: currentQuestionType,
        text: questionData.text,
        explanation: questionData.explanation,
        order_index: orderIndex,
        block_type: selectedQuestionBlock,
        max_answers: questionProperties.maxAnswers ? parseInt(questionProperties.maxAnswers) : null,
        shuffle_answers: questionProperties.shuffleAnswers,
        region_scope: questionProperties.regionScope,
        answers: questionData.answers.map((answer, index) => ({
          type: answer.type,
          text: answer.text,
          order_index: index
        }))
      };

      // Отправляем вопрос на сервер
      const response = await axios.post(
        `http://localhost:8080/questionnaire/${currentQuestionnaire.id}/questions`,
        questionPayload
      );

      // Добавляем сохраненный вопрос в соответствующий блок
      if (selectedQuestionBlock === 'passport') {
        setPassportQuestions(prev => [...prev, response.data]);
      } else if (selectedQuestionBlock === 'main') {
        setQuestions(prev => [...prev, response.data]);
      } else {
        // Дополнительный блок
        setAdditionalBlocks(prev => prev.map(block =>
          block.id === selectedQuestionBlock
            ? { ...block, questions: [...block.questions, response.data] }
            : block
        ));
      }
      setIsQuestionFormOpen(false);
      setQuestionData({ text: '', explanation: '', answers: [] });
      setQuestionProperties({
        maxAnswers: '',
        shuffleAnswers: false,
        regionScope: 'all'
      });
    } catch (err) {
      console.error('Ошибка при сохранении вопроса:', err);
      alert('Ошибка при сохранении вопроса: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRemoveQuestion = async (questionId) => {
    if (!currentQuestionnaire || !currentQuestionnaire.id) {
      alert('Анкета не найдена');
      return;
    }

    if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:8080/questionnaire/${currentQuestionnaire.id}/questions/${questionId}`
      );
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (err) {
      console.error('Ошибка при удалении вопроса:', err);
      alert('Ошибка при удалении вопроса: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRemovePassportQuestion = async (questionId) => {
    if (!currentQuestionnaire || !currentQuestionnaire.id) {
      alert('Анкета не найдена');
      return;
    }

    if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:8080/questionnaire/${currentQuestionnaire.id}/questions/${questionId}`
      );
      setPassportQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (err) {
      console.error('Ошибка при удалении вопроса:', err);
      alert('Ошибка при удалении вопроса: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRemoveAdditionalBlockQuestion = async (blockId, questionId) => {
    if (!currentQuestionnaire || !currentQuestionnaire.id) {
      alert('Анкета не найдена');
      return;
    }

    if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:8080/questionnaire/${currentQuestionnaire.id}/questions/${questionId}`
      );
      setAdditionalBlocks(prev => prev.map(block =>
        block.id === blockId
          ? { ...block, questions: block.questions.filter(q => q.id !== questionId) }
          : block
      ));
    } catch (err) {
      console.error('Ошибка при удалении вопроса:', err);
      alert('Ошибка при удалении вопроса: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRemoveBlock = async (blockId) => {
    if (!confirm('Вы уверены, что хотите удалить этот блок и все его вопросы?')) {
      return;
    }

    try {
      // Удаляем все вопросы блока с сервера
      const block = additionalBlocks.find(b => b.id === blockId);
      if (block && block.questions) {
        for (const question of block.questions) {
          await axios.delete(
            `http://localhost:8080/questionnaire/${currentQuestionnaire.id}/questions/${question.id}`
          );
        }
      }

      // Удаляем блок из состояния
      setAdditionalBlocks(prev => prev.filter(b => b.id !== blockId));

      // Если удаленный блок был выбран, сбрасываем выбор
      if (selectedQuestionBlock === blockId) {
        setSelectedQuestionBlock('main');
      }
    } catch (err) {
      console.error('Ошибка при удалении блока:', err);
      alert('Ошибка при удалении блока: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleBlockMenuClick = (e, blockId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setBlockMenuPosition({
      x: rect.left - 80,
      y: rect.bottom + 5
    });
    setSelectedBlockForMenu(blockId);
    setBlockMenuOpen(true);
  };

  const handleBlockDelete = () => {
    setBlockMenuOpen(false);
    if (selectedBlockForMenu) {
      handleRemoveBlock(selectedBlockForMenu);
    }
  };

  const handleSettingsMenuClick = (e, questionId) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setSettingsMenuPosition({
      x: rect.left,
      y: rect.bottom + 5
    });
    setSelectedQuestionForSettings(questionId);
    setSettingsMenuOpen(true);
  };

  const handleQuestionSettingChange = (questionId, setting, value) => {
    setQuestionSettings(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {
          allow_adaptation: false,
          allow_answer_adaptation: false,
          required: false,
          no_contradictions: false,
          audio_recording: false
        }),
        [setting]: value
      }
    }));
  };

  const getQuestionSettings = (questionId) => {
    return questionSettings[questionId] || {
      allow_adaptation: false,
      allow_answer_adaptation: false,
      required: false,
      no_contradictions: false,
      audio_recording: false
    };
  };

  const openHideRuleModal = (questionId) => {
    // Загружаем сохраненные правила для этого вопроса, если они есть
    const savedRules = hideRules[questionId];
    const conditions = savedRules && savedRules.conditions && savedRules.conditions.length > 0
      ? savedRules.conditions
      : [{ questionId: null, type: 'selected', answers: [''] }];

    setHideRuleData({
      questionId: questionId,
      conditions: conditions
    });
    setSettingsMenuOpen(false);
    setIsHideRuleModalOpen(true);
  };

  const closeHideRuleModal = () => {
    setIsHideRuleModalOpen(false);
    // Не сбрасываем hideRuleData полностью, просто закрываем окно
  };

  // Функции для правил перехода
  const openTransitionRuleModal = (questionId) => {
    // Загружаем сохраненные правила для этого вопроса, если они есть
    const savedRules = transitionRules[questionId];
    const conditions = savedRules && savedRules.conditions && savedRules.conditions.length > 0
      ? savedRules.conditions
      : [{ type: 'selected', answers: [''] }];

    setTransitionRuleData({
      questionId: questionId,
      conditions: conditions,
      action: savedRules?.action || 'end',
      targetQuestionId: savedRules?.targetQuestionId || null,
      targetBlockId: savedRules?.targetBlockId || null
    });
    setSettingsMenuOpen(false);
    setIsTransitionRuleModalOpen(true);
  };

  const closeTransitionRuleModal = () => {
    setIsTransitionRuleModalOpen(false);
    // Не сбрасываем transitionRuleData полностью, просто закрываем окно
  };

  // Функции для противоречий
  const openContradictionModal = (questionId) => {
    const savedRules = contradictionRules[questionId];
    setContradictionData({
      questionId: questionId,
      type: savedRules?.type || 'selected',
      answers: [''],
      contradictQuestionId: savedRules?.contradictQuestionId || null,
      contradictAnswers: savedRules?.contradictAnswers && savedRules.contradictAnswers.length > 0 ? savedRules.contradictAnswers : [],
      forbidContradictions: savedRules?.forbidContradictions || false
    });
    setSettingsMenuOpen(false);
    setIsContradictionModalOpen(true);
  };

  const closeContradictionModal = () => {
    setIsContradictionModalOpen(false);
  };

  const addContradictionAnswer = () => {
    setContradictionData(prev => ({
      ...prev,
      contradictAnswers: [...prev.contradictAnswers, '']
    }));
  };

  const removeContradictionAnswer = (index) => {
    setContradictionData(prev => ({
      ...prev,
      contradictAnswers: prev.contradictAnswers.filter((_, i) => i !== index)
    }));
  };

  const updateContradictionAnswer = (index, value) => {
    setContradictionData(prev => ({
      ...prev,
      contradictAnswers: prev.contradictAnswers.map((a, i) => i === index ? value : a)
    }));
  };

  const addTransitionCondition = () => {
    setTransitionRuleData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { type: 'selected', answers: [''] }]
    }));
  };

  const removeTransitionCondition = (index) => {
    setTransitionRuleData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateTransitionCondition = (index, field, value) => {
    setTransitionRuleData(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) =>
        i === index ? { ...cond, [field]: value } : cond
      )
    }));
  };

  const addAnswerToTransitionCondition = (index) => {
    setTransitionRuleData(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) =>
        i === index ? { ...cond, answers: [...cond.answers, ''] } : cond
      )
    }));
  };

  const updateTransitionConditionAnswer = (conditionIndex, answerIndex, value) => {
    setTransitionRuleData(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) =>
        i === conditionIndex ? {
          ...cond,
          answers: cond.answers.map((a, j) => j === answerIndex ? value : a)
        } : cond
      )
    }));
  };

  const addCondition = () => {
    setHideRuleData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { questionId: null, type: 'selected', answers: [''] }]
    }));
  };

  const removeCondition = (index) => {
    setHideRuleData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index, field, value) => {
    setHideRuleData(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) =>
        i === index ? { ...cond, [field]: value } : cond
      )
    }));
  };

  const addAnswerToCondition = (index) => {
    setHideRuleData(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) =>
        i === index ? { ...cond, answers: [...cond.answers, ''] } : cond
      )
    }));
  };

  const updateConditionAnswer = (conditionIndex, answerIndex, value) => {
    setHideRuleData(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) =>
        i === conditionIndex ? {
          ...cond,
          answers: cond.answers.map((a, j) => j === answerIndex ? value : a)
        } : cond
      )
    }));
  };

  const questionTypes = [
    { id: 'open', label: 'Открытый' },
    { id: 'closed', label: 'Закрытый' },
    { id: 'mixed', label: 'Смешанный' },
    { id: 'scale', label: 'Шкальный' },
    { id: 'dichotomous', label: 'Дихотомический' }
  ];

  const answerTypes = [
    { id: 'text', label: 'Текст' },
    { id: 'no_answer', label: 'Затрудняюсь ответить' },
    { id: 'refuse', label: 'Отказываюсь отвечать' },
    { id: 'other', label: 'Другое' },
    { id: 'agree_disagree', label: 'Согласен;Не согласен' },
    { id: 'like_dislike', label: 'Нравится;Не нравится' }
  ];

  // Загрузка анкет из БД
  const fetchQuestionnaires = async () => {
    try {
      const response = await axios.get('http://localhost:8080/questionnaires');
      const data = Array.isArray(response.data) ? response.data : [];
      setQuestionnaireList(data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Ошибка при загрузке анкет:', err);
      setQuestionnaireList([]);
    }
  };

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  // Сброс страницы при изменении списка анкет
  useEffect(() => {
    setCurrentPage(1);
  }, [questionnaireList]);

  return (
    <>
      {isModalopen && (
        <>
          <div
            className="modal-bg" onClick={() => {
              setIsModalOpen(false);
            }}></div>
          <div className="create-window">
            <div className="win-title">
              <h4>Создание анкеты</h4>
              <div
                className="close-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setIsModalOpen(false);
                }}
              >
                <svg
                  width="32px"
                  height="32px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <g clip-path="url(#clip0_429_11083)">
                      {" "}
                      <path
                        d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006"
                        stroke="#292929"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>{" "}
                    </g>{" "}
                    <defs>
                      {" "}
                      <clipPath id="clip0_429_11083">
                        {" "}
                        <rect width="24" height="24" fill="white"></rect>{" "}
                      </clipPath>{" "}
                    </defs>{" "}
                  </g>
                </svg>{" "}
              </div>
            </div>

            <form
              method="post"
              className="create-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveQuestionnaire();
              }}
            >
              <label>
                <span>*</span>Название анкеты
              </label>
              <input
                className="input-create"
                type="text"
                value={questionnaireName}
                onChange={(e) => setQuestionnaireName(e.target.value)}
                placeholder="Введите название анкеты"
              />

              <label>Код анкеты</label>
              <input
                className="input-create"
                type="text"
                value={questionnaireCode}
                onChange={(e) => setQuestionnaireCode(e.target.value)}
                placeholder="Введите код анкеты (необязательно)"
              />

              <label>Инструкция по проведению интервью</label>
              <textarea
                value={questionnaireDescription}
                onChange={(e) => setQuestionnaireDescription(e.target.value)}
                placeholder="Введите инструкцию"
              ></textarea>

              <div className="region">
                <label>Анкета актуальна для</label>
                <div className="scope-switch">
                  <button
                    type="button"
                    className={`switch-btn ${scope === "regions" ? "activ" : ""
                      }`} //if scope === regions{className = 'regions'}
                    onClick={() => setScope("regions")}
                  >
                    Регионов
                  </button>
                  <button
                    type="button"
                    className={`switch-btn ${scope === "cities" ? "activ" : ""
                      }`}
                    onClick={() => setScope("cities")}
                  >
                    Городов
                  </button>
                </div>
              </div>

              <div className="region-list">
                {scope === "regions" ? (
                  <>
                    <div className="region-element1">
                      <input type="checkbox" name="" id="" />
                      <p>СЕВЕРО-КАВКАЗСКИЙ</p>
                    </div>
                    <div className="region-element1">
                      <input type="checkbox" name="" id="" />
                      <p>ЦЕНТРАЛЬНЫЙ</p>
                    </div>
                    <div className="region-element1">
                      <input type="checkbox" name="" id="" />
                      <p>СИБИРСКИЙ</p>
                    </div>
                    <div className="region-element1">
                      <input type="checkbox" name="" id="" />
                      <p>СЕВЕРО-ЗАПАДНЫЙ</p>
                    </div>
                    <div className="region-element1">
                      <input type="checkbox" name="" id="" />
                      <p>УРАЛЬСКИЙ</p>
                    </div>
                    <div className="region-element1">
                      <input type="checkbox" name="" id="" />
                      <p>ЮЖНЫЙ</p>
                    </div>
                    <div className="region-element1">
                      <input type="checkbox" name="" id="" />
                      <p>ДАЛЬНЕВОСТОЧНЫЙ</p>
                    </div>
                    <div className="region-element1">
                      <input type="checkbox" name="" id="" />
                      <p>ПРИВОЛЖСКИЙ</p>
                    </div>
                  </>
                ) : (
                  ""
                )}
                {scope === "cities" ? (
                  <>
                    <div className="cities-container">
                      {loading && <p>Загрузка городов...</p>}
                      {error && <p className="error">{error}</p>}
                      {!loading && !error && cities && Object.keys(cities).map(district => {
                        const citiesList = Object.values(cities[district]).flat();
                        const isExpanded = expandedDistricts[district];
                        const anySelected = citiesList.some(city => selectedCities[district]?.[city]);
                        const allSelected = citiesList.length > 0 && citiesList.every(city => selectedCities[district]?.[city]);

                        return (
                          <div key={district} className="district-item">
                            <div className="district-header">
                              <p className="expand-icon" onClick={() => toggleExpand(district)}>
                                {isExpanded ? <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="#000000"></path> </g></svg> :
                                  <svg fill="#000000" width="16px" height="16px" viewBox="-8.5 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>right</title> <path d="M7.75 16.063l-7.688-7.688 3.719-3.594 11.063 11.094-11.344 11.313-3.5-3.469z"></path> </g></svg>}
                              </p>
                              <input
                                type="checkbox"
                                ref={el => districtRefs.current[district] = el}
                                onChange={(e) => handleDistrictChange(district, e.target.checked)}
                                checked={allSelected}
                              />
                              <p className="district-name" onClick={() => toggleExpand(district)}>
                                {district}
                              </p>
                            </div>
                            {isExpanded && (
                              <div className="cities-list">
                                {citiesList.map(city => (
                                  <div key={city} className="city-item">
                                    <input
                                      type="checkbox"
                                      checked={selectedCities[district]?.[city] || false}
                                      onChange={(e) => handleCityChange(district, city, e.target.checked)}
                                    />
                                    <p>{city}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  ""
                )}
              </div>

              <div className="submit-form">
                <button
                  className="cancel-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsModalOpen(false);
                  }}
                >
                  Отменить
                </button>
                <button
                  type="submit"
                  className="save-btn"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {isSettingsOpen && (
        <>
          <div className="window-bg" onClick={() => {
            setIsSettingsOpen(false);
          }}></div>
          <div className="settings-window">
            <ul className="settings-nav">
              <li className={`nav-element2 ${activeBlock === 'attr' ? 'activate' : ''}`}
                onClick={() => {
                  setActiveBlock('attr');
                }}><p>Атрибуты</p></li>
              <li className={`nav-element2 ${activeBlock === 'questions' ? 'activate' : ''}`}
                onClick={() => {
                  setActiveBlock('questions');
                }}><p>Вопросы</p></li>
              <li className={`nav-element2 ${activeBlock === 'settings' ? 'activate' : ''}`}
                onClick={() => {
                  setActiveBlock('settings')
                }}><p>Настройка</p></li>
            </ul>

            {activeBlock === 'questions' && (
              <>
                <div className="block-2">
                  <div className="block-2-left">

                    <div className="buttons-group">

                      <div className="btn-gr-1">
                        <button className="export-word" onClick={exportToWord}>Выгрузить в Word</button>
                        <button className="export-is">Экспорт в ИС Полог</button>
                      </div>

                      <div className="btn-gr-2">
                        <button className="add-question" onClick={handleAddQuestionClick}>+ Вопрос</button>
                        <button className="add-block" onClick={handleAddBlock}>Добавить блок вопросов</button>
                      </div>

                    </div>

                    <div className={`create-question-block ${selectedQuestionBlock === 'main' ? 'question-block-selected' : ''}`}>
                      <div
                        className={`question-block-header ${selectedQuestionBlock === 'main' ? 'selected' : ''}`}
                        onClick={() => handleBlockClick('main')}
                      >
                        <div className="block-title"><h5>Основной блок</h5></div>
                        <div className="nav-buttons">
                          <div className="posled-button"><button><svg fill="#000000" width="64px" height="64px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M7.293,7.707a1,1,0,0,1,0-1.414l4-4a1,1,0,0,1,1.414,0l4,4a1,1,0,1,1-1.414,1.414L12,4.414,8.707,7.707A1,1,0,0,1,7.293,7.707Zm0,10,4,4a1,1,0,0,0,1.414,0l4-4a1,1,0,0,0-1.414-1.414L12,19.586,8.707,16.293a1,1,0,1,0-1.414,1.414Z"></path></g></svg></button></div>
                          <div className="dop-button"><button><svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle cx="18" cy="12" r="1.5" transform="rotate(90 18 12)" fill="#080341"></circle> <circle cx="12" cy="12" r="1.5" transform="rotate(90 12 12)" fill="#080341"></circle> <circle cx="6" cy="12" r="1.5" transform="rotate(90 6 12)" fill="#080341"></circle> </g></svg></button></div>
                        </div>
                      </div>

                      {questions.length === 0 ? (
                        <div className="block-empty-placeholder">Добавьте вопросы</div>
                      ) : (
                        <div className="questions-list">
                          {questions.map((question) => (
                            <div key={question.id} className="question-item">
                              <div className="question-item-header">
                                <span className="question-type-badge">{getQuestionTypeLabel(question.type)}</span>
                                <div className="question-properties">
                                  {question.max_answers > 0 && (
                                    <span className="property-badge">Макс: {question.max_answers}</span>
                                  )}
                                  {question.is_randomized && (
                                    <span className="property-badge property-badge-random">Перемешивание</span>
                                  )}
                                  {question.region_scope && question.region_scope !== 'all' && (
                                    <span className="property-badge property-badge-region">
                                      {getRegionLabel(question.region_scope)}
                                    </span>
                                  )}
                                </div>
                                <button
                                  className="remove-question-btn"
                                  onClick={() => handleRemoveQuestion(question.id)}
                                >
                                  <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                              </div>
                              <div className="question-item-text">{question.text}</div>
                              {question.explanation && (
                                <div className="question-item-explanation">
                                  <em>{question.explanation}</em>
                                </div>
                              )}
                              {question.answers && question.answers.length > 0 && (
                                <div className="question-item-answers">
                                  <span className="answers-label">Ответы:</span>
                                  <ul className="answers-ul">
                                    {question.answers.map((answer, idx) => (
                                      <li key={answer.id || idx} className="answer-li">
                                        {answer.text || answer.type}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`passport-block ${selectedQuestionBlock === 'passport' ? 'question-block-selected' : ''}`}>
                      <div
                        className={`question-block-header ${selectedQuestionBlock === 'passport' ? 'selected' : ''}`}
                        onClick={() => handleBlockClick('passport')}
                      >
                        <div className="block-title"><h5>Вопросы о респонденте (паспортичка)</h5></div>
                        <div className="nav-buttons">
                          <div className="posled-button"><button><svg fill="#000000" width="64px" height="64px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M7.293,7.707a1,1,0,0,1,0-1.414l4-4a1,1,0,0,1,1.414,0l4,4a1,1,0,1,1-1.414,1.414L12,4.414,8.707,7.707A1,1,0,0,1,7.293,7.707Zm0,10,4,4a1,1,0,0,0,1.414,0l4-4a1,1,0,0,0-1.414-1.414L12,19.586,8.707,16.293a1,1,0,1,0-1.414,1.414Z"></path></g></svg></button></div>
                          <div className="dop-button"><button><svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle cx="18" cy="12" r="1.5" transform="rotate(90 18 12)" fill="#080341"></circle> <circle cx="12" cy="12" r="1.5" transform="rotate(90 12 12)" fill="#080341"></circle> <circle cx="6" cy="12" r="1.5" transform="rotate(90 6 12)" fill="#080341"></circle> </g></svg></button></div>
                        </div>
                      </div>
                      {passportQuestions.length === 0 ? (
                        <div className="block-empty-placeholder">Добавьте вопросы</div>
                      ) : (
                        <div className="questions-list">
                          {passportQuestions.map((question) => (
                            <div key={question.id} className="question-item">
                              <div className="question-item-header">
                                <span className="question-type-badge">{getQuestionTypeLabel(question.type)}</span>
                                <button
                                  className="remove-question-btn"
                                  onClick={() => handleRemovePassportQuestion(question.id)}
                                >
                                  <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                              </div>
                              <div className="question-item-text">{question.text}</div>
                              {question.explanation && (
                                <div className="question-item-explanation">
                                  <em>{question.explanation}</em>
                                </div>
                              )}
                              {question.answers && question.answers.length > 0 && (
                                <div className="question-item-answers">
                                  <span className="answers-label">Ответы:</span>
                                  <ul className="answers-ul">
                                    {question.answers.map((answer, idx) => (
                                      <li key={answer.id || idx} className="answer-li">
                                        {answer.text || answer.type}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Дополнительные блоки */}
                    {additionalBlocks.map((block, blockIndex) => (
                      <div key={block.id} className={`additional-block ${selectedQuestionBlock === block.id ? 'question-block-selected' : ''}`}>
                        <div
                          className="question-block-header"
                          onClick={() => handleBlockClick(block.id)}
                        >
                          <div className="block-title"><h5>{block.name}</h5></div>
                          <div className="nav-buttons">
                            <div className="posled-button"><button><svg fill="#000000" width="64px" height="64px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M7.293,7.707a1,1,0,0,1,0-1.414l4-4a1,1,0,0,1,1.414,0l4,4a1,1,0,1,1-1.414,1.414L12,4.414,8.707,7.707A1,1,0,0,1,7.293,7.707Zm0,10,4,4a1,1,0,0,0,1.414,0l4-4a1,1,0,0,0-1.414-1.414L12,19.586,8.707,16.293a1,1,0,1,0-1.414,1.414Z"></path></g></svg></button></div>
                            <div className="dop-button">
                              <button onClick={(e) => handleBlockMenuClick(e, block.id)}>
                                <svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                  <g id="SVGRepo_iconCarrier">
                                    <circle cx="18" cy="12" r="1.5" transform="rotate(90 18 12)" fill="#080341"></circle>
                                    <circle cx="12" cy="12" r="1.5" transform="rotate(90 12 12)" fill="#080341"></circle>
                                    <circle cx="6" cy="12" r="1.5" transform="rotate(90 6 12)" fill="#080341"></circle>
                                  </g>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        {block.questions.length === 0 ? (
                          <div className="block-empty-placeholder">Добавьте вопросы</div>
                        ) : (
                          <div className="questions-list">
                            {block.questions.map((question) => (
                              <div key={question.id} className="question-item">
                                <div className="question-item-header">
                                  <span className="question-type-badge">{getQuestionTypeLabel(question.type)}</span>
                                  <button
                                    className="remove-question-btn"
                                    onClick={() => handleRemoveAdditionalBlockQuestion(block.id, question.id)}
                                  >
                                    <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="question-item-text">{question.text}</div>
                                {question.explanation && (
                                  <div className="question-item-explanation">
                                    <em>{question.explanation}</em>
                                  </div>
                                )}
                                {question.answers && question.answers.length > 0 && (
                                  <div className="question-item-answers">
                                    <span className="answers-label">Ответы:</span>
                                    <ul className="answers-ul">
                                      {question.answers.map((answer, idx) => (
                                        <li key={answer.id || idx} className="answer-li">
                                          {answer.text || answer.type}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                  </div>

                  <div className="block-2-right">
                    <div className="block-options">
                      <h4>Свойства блока</h4>
                      <div className="switcher-container">
                        <p>Перемешивать вопросы</p>
                        <input type="checkbox" id="checkbox-switcher" className="options-switcher" />
                        <label htmlFor="checkbox-switcher" className="options-switcher-label"></label>
                      </div>
                    </div>
                  </div>

                </div>
              </>
            )}

            {activeBlock === 'attr' && (
              <>
                <p>attr</p>
              </>
            )}

            {activeBlock === 'settings' && (
              <>
                <div className="settings-table-container">
                  {/* Основной блок */}
                  {questions.length > 0 && (
                    <div className="settings-block-section">
                      <h5 className="settings-block-title">Основной блок</h5>
                      <div className="settings-table">
                        <table>
                          <thead>
                            <tr>
                              <th className="question-column"></th>
                              <th>Разрешена адаптация вопросов</th>
                              <th>Разрешена адаптация ответов</th>
                              <th>Обязательный вопрос</th>
                              <th>Запрет противоречий</th>
                              <th>Запись звука</th>
                              <th className="actions-column"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {questions.map((question, index) => {
                              const settings = getQuestionSettings(question.id);
                              return (
                                <tr key={question.id}>
                                  <td className="question-cell">
                                    <span className="question-number">{index + 1}.</span>
                                    <span className="question-text-cell">{question.text}</span>
                                  </td>
                                  <td className="switcher-cell">
                                    <div className="switcher-wrapper">
                                      <input
                                        type="checkbox"
                                        id={`adapt-q-${question.id}`}
                                        className="options-switcher"
                                        checked={settings.allow_adaptation}
                                        onChange={(e) => handleQuestionSettingChange(question.id, 'allow_adaptation', e.target.checked)}
                                      />
                                      <label htmlFor={`adapt-q-${question.id}`} className="options-switcher-label"></label>
                                    </div>
                                  </td>
                                  <td className="switcher-cell">
                                    <div className="switcher-wrapper">
                                      <input
                                        type="checkbox"
                                        id={`adapt-a-${question.id}`}
                                        className="options-switcher"
                                        checked={settings.allow_answer_adaptation}
                                        onChange={(e) => handleQuestionSettingChange(question.id, 'allow_answer_adaptation', e.target.checked)}
                                      />
                                      <label htmlFor={`adapt-a-${question.id}`} className="options-switcher-label"></label>
                                    </div>
                                  </td>
                                  <td className="switcher-cell">
                                    <div className="switcher-wrapper">
                                      <input
                                        type="checkbox"
                                        id={`required-${question.id}`}
                                        className="options-switcher"
                                        checked={settings.required}
                                        onChange={(e) => handleQuestionSettingChange(question.id, 'required', e.target.checked)}
                                      />
                                      <label htmlFor={`required-${question.id}`} className="options-switcher-label"></label>
                                    </div>
                                  </td>
                                  <td className="switcher-cell">
                                    <div className="switcher-wrapper">
                                      <input
                                        type="checkbox"
                                        id={`contradict-${question.id}`}
                                        className="options-switcher"
                                        checked={settings.no_contradictions}
                                        onChange={(e) => handleQuestionSettingChange(question.id, 'no_contradictions', e.target.checked)}
                                      />
                                      <label htmlFor={`contradict-${question.id}`} className="options-switcher-label"></label>
                                    </div>
                                  </td>
                                  <td className="switcher-cell">
                                    <div className="switcher-wrapper">
                                      <input
                                        type="checkbox"
                                        id={`audio-${question.id}`}
                                        className="options-switcher"
                                        checked={settings.audio_recording}
                                        onChange={(e) => handleQuestionSettingChange(question.id, 'audio_recording', e.target.checked)}
                                      />
                                      <label htmlFor={`audio-${question.id}`} className="options-switcher-label"></label>
                                    </div>
                                  </td>
                                  <td className="actions-cell">
                                    <button
                                      className="settings-dots-btn"
                                      onClick={(e) => handleSettingsMenuClick(e, question.id)}
                                    >
                                      <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="1.5" fill="#080341"></circle>
                                        <circle cx="12" cy="6" r="1.5" fill="#080341"></circle>
                                        <circle cx="12" cy="18" r="1.5" fill="#080341"></circle>
                                      </svg>
                                    </button>
                                    {hideRules[question.id] && hideRules[question.id].conditions && hideRules[question.id].conditions.filter(c => c.questionId).length > 0 && (
                                      <span className="hide-rule-indicator" title="Есть правило скрытия"></span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Паспортичка */}
                  {passportQuestions.length > 0 && (
                    <div className="settings-block-section">
                      <h5 className="settings-block-title">Вопросы о респонденте (паспортичка)</h5>
                      <div className="settings-table">
                        <table>
                          <thead>
                            <tr>
                              <th className="question-column"></th>
                              <th>Разрешена адаптация вопросов</th>
                              <th>Разрешена адаптация ответов</th>
                              <th>Обязательный вопрос</th>
                              <th>Запрет противоречий</th>
                              <th>Запись звука</th>
                              <th className="actions-column"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {passportQuestions.map((question, index) => {
                              const settings = getQuestionSettings(question.id);
                              return (
                                <tr key={question.id}>
                                  <td className="question-cell">
                                    <span className="question-number">{index + 1}.</span>
                                    <span className="question-text-cell">{question.text}</span>
                                  </td>
                                  <td className="switcher-cell">
                                    <div className="switcher-wrapper">
                                      <input
                                        type="checkbox"
                                        id={`adapt-q-${question.id}`}
                                        className="options-switcher"
                                        checked={settings.allow_adaptation}
                                        onChange={(e) => handleQuestionSettingChange(question.id, 'allow_adaptation', e.target.checked)}
                                      />
                                      <label htmlFor={`adapt-q-${question.id}`} className="options-switcher-label"></label>
                                    </div>
                                  </td>
                                  <td className="switcher-cell">
                                    <div className="switcher-wrapper">
                                      <input
                                        type="checkbox"
                                        id={`adapt-a-${question.id}`}
                                        className="options-switcher"
                                        checked={settings.allow_answer_adaptation}
                                        onChange={(e) => handleQuestionSettingChange(question.id, 'allow_answer_adaptation', e.target.checked)}
                                      />
                                      <label htmlFor={`adapt-a-${question.id}`} className="options-switcher-label"></label>
                                    </div>
                                  </td>
                                  <td className="switcher-cell">
                                    <div className="switcher-wrapper">
                                      <input
                                        type="checkbox"
                                        id={`required-${question.id}`}
                                        className="options-switcher"
                                        checked={settings.required}
                                        onChange={(e) => handleQuestionSettingChange(question.id, 'required', e.target.checked)}
                                      />
                                      <label htmlFor={`required-${question.id}`} className="options-switcher-label"></label>
                                    </div>
                                  </td>
                                  <td className="switcher-cell">
                                    <div className="switcher-wrapper">
                                      <input
                                        type="checkbox"
                                        id={`contradict-${question.id}`}
                                        className="options-switcher"
                                        checked={settings.no_contradictions}
                                        onChange={(e) => handleQuestionSettingChange(question.id, 'no_contradictions', e.target.checked)}
                                      />
                                      <label htmlFor={`contradict-${question.id}`} className="options-switcher-label"></label>
                                    </div>
                                  </td>
                                  <td className="switcher-cell">
                                    <div className="switcher-wrapper">
                                      <input
                                        type="checkbox"
                                        id={`audio-${question.id}`}
                                        className="options-switcher"
                                        checked={settings.audio_recording}
                                        onChange={(e) => handleQuestionSettingChange(question.id, 'audio_recording', e.target.checked)}
                                      />
                                      <label htmlFor={`audio-${question.id}`} className="options-switcher-label"></label>
                                    </div>
                                  </td>
                                  <td className="actions-cell">
                                    <button
                                      className="settings-dots-btn"
                                      onClick={(e) => handleSettingsMenuClick(e, question.id)}
                                    >
                                      <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="1.5" fill="#080341"></circle>
                                        <circle cx="12" cy="6" r="1.5" fill="#080341"></circle>
                                        <circle cx="12" cy="18" r="1.5" fill="#080341"></circle>
                                      </svg>
                                    </button>
                                    {hideRules[question.id] && hideRules[question.id].conditions && hideRules[question.id].conditions.filter(c => c.questionId).length > 0 && (
                                      <span className="hide-rule-indicator" title="Есть правило скрытия"></span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Дополнительные блоки */}
                  {additionalBlocks.map((block) => (
                    block.questions.length > 0 && (
                      <div key={block.id} className="settings-block-section">
                        <h5 className="settings-block-title">{block.name}</h5>
                        <div className="settings-table">
                          <table>
                            <thead>
                              <tr>
                                <th className="question-column"></th>
                                <th>Разрешена адаптация вопросов</th>
                                <th>Разрешена адаптация ответов</th>
                                <th>Обязательный вопрос</th>
                                <th>Запрет противоречий</th>
                                <th>Запись звука</th>
                                <th className="actions-column"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {block.questions.map((question, index) => {
                                const settings = getQuestionSettings(question.id);
                                return (
                                  <tr key={question.id}>
                                    <td className="question-cell">
                                      <span className="question-number">{index + 1}.</span>
                                      <span className="question-text-cell">{question.text}</span>
                                    </td>
                                    <td className="switcher-cell">
                                      <div className="switcher-wrapper">
                                        <input
                                          type="checkbox"
                                          id={`adapt-q-${question.id}`}
                                          className="options-switcher"
                                          checked={settings.allow_adaptation}
                                          onChange={(e) => handleQuestionSettingChange(question.id, 'allow_adaptation', e.target.checked)}
                                        />
                                        <label htmlFor={`adapt-q-${question.id}`} className="options-switcher-label"></label>
                                      </div>
                                    </td>
                                    <td className="switcher-cell">
                                      <div className="switcher-wrapper">
                                        <input
                                          type="checkbox"
                                          id={`adapt-a-${question.id}`}
                                          className="options-switcher"
                                          checked={settings.allow_answer_adaptation}
                                          onChange={(e) => handleQuestionSettingChange(question.id, 'allow_answer_adaptation', e.target.checked)}
                                        />
                                        <label htmlFor={`adapt-a-${question.id}`} className="options-switcher-label"></label>
                                      </div>
                                    </td>
                                    <td className="switcher-cell">
                                      <div className="switcher-wrapper">
                                        <input
                                          type="checkbox"
                                          id={`required-${question.id}`}
                                          className="options-switcher"
                                          checked={settings.required}
                                          onChange={(e) => handleQuestionSettingChange(question.id, 'required', e.target.checked)}
                                        />
                                        <label htmlFor={`required-${question.id}`} className="options-switcher-label"></label>
                                      </div>
                                    </td>
                                    <td className="switcher-cell">
                                      <div className="switcher-wrapper">
                                        <input
                                          type="checkbox"
                                          id={`contradict-${question.id}`}
                                          className="options-switcher"
                                          checked={settings.no_contradictions}
                                          onChange={(e) => handleQuestionSettingChange(question.id, 'no_contradictions', e.target.checked)}
                                        />
                                        <label htmlFor={`contradict-${question.id}`} className="options-switcher-label"></label>
                                      </div>
                                    </td>
                                    <td className="switcher-cell">
                                      <div className="switcher-wrapper">
                                        <input
                                          type="checkbox"
                                          id={`audio-${question.id}`}
                                          className="options-switcher"
                                          checked={settings.audio_recording}
                                          onChange={(e) => handleQuestionSettingChange(question.id, 'audio_recording', e.target.checked)}
                                        />
                                        <label htmlFor={`audio-${question.id}`} className="options-switcher-label"></label>
                                      </div>
                                    </td>
                                    <td className="actions-cell">
                                      <button
                                        className="settings-dots-btn"
                                        onClick={(e) => handleSettingsMenuClick(e, question.id)}
                                      >
                                        <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <circle cx="12" cy="12" r="1.5" fill="#080341"></circle>
                                          <circle cx="12" cy="6" r="1.5" fill="#080341"></circle>
                                          <circle cx="12" cy="18" r="1.5" fill="#080341"></circle>
                                        </svg>
                                      </button>
                                      {hideRules[question.id] && hideRules[question.id].conditions && hideRules[question.id].conditions.filter(c => c.questionId).length > 0 && (
                                        <span className="hide-rule-indicator" title="Есть правило скрытия"></span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  ))}

                  {/* Если нет вопросов */}
                  {questions.length === 0 && passportQuestions.length === 0 && additionalBlocks.filter(b => b.questions.length > 0).length === 0 && (
                    <div className="settings-empty-message">
                      <p>Добавьте вопросы, чтобы настроить их параметры</p>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </>
      )}

      {/* Модальное окно правила скрытия */}
      {isHideRuleModalOpen && (
        <>
          <div className="modal-bg" onClick={closeHideRuleModal}></div>
          <div className="hide-rule-modal">
            <div className="hide-rule-modal-header">
              <h4>Настройка правила скрытия</h4>
              <div className="close-btn" onClick={closeHideRuleModal}>
                <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#292929" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="hide-rule-modal-body">
              {/* Вопрос, для которого настраивается правило */}
              {hideRuleData.questionId && (
                <div className="hide-rule-question-info">
                  <p className="hide-rule-question-label">
                    Вопрос: <strong>{[...questions, ...passportQuestions, ...additionalBlocks.flatMap(b => b.questions)].find(q => q.id === hideRuleData.questionId)?.text || 'Не найден'}</strong>
                  </p>
                </div>
              )}

              {/* Карточка условия */}
              <div className="hide-rule-condition-card">
                <div className="condition-card-header">
                  <h5>Не показывать если:</h5>
                  {hideRuleData.conditions.length > 0 && (
                    <button
                      className="remove-all-conditions-btn"
                      onClick={() => {
                        if (confirm('Удалить все условия?')) {
                          setHideRuleData(prev => ({
                            ...prev,
                            conditions: [{ questionId: null, type: 'selected', answers: [''] }]
                          }));
                        }
                      }}
                    >
                      <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>

                {hideRuleData.conditions.map((condition, index) => {
                  const allQuestions = [...questions, ...passportQuestions, ...additionalBlocks.flatMap(b => b.questions)];
                  const selectedQuestion = allQuestions.find(q => q.id === condition.questionId);

                  return (
                    <div key={index} className="hide-rule-condition">
                      <div className="condition-header">
                        <span className="condition-number">Условие {index + 1}</span>
                        {hideRuleData.conditions.length > 1 && (
                          <button
                            className="remove-condition-btn"
                            onClick={() => removeCondition(index)}
                          >
                            <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="condition-row">
                        <select
                          className="condition-select"
                          value={condition.questionId || ''}
                          onChange={(e) => updateCondition(index, 'questionId', e.target.value)}
                        >
                          <option value="" disabled>Выберите вопрос</option>
                          {allQuestions.filter(q => q.id !== hideRuleData.questionId).map((q, idx) => (
                            <option key={q.id} value={q.id}>{idx + 1}. {q.text}</option>
                          ))}
                        </select>
                      </div>

                      {condition.questionId && (
                        <>
                          <div className="condition-type-buttons">
                            <button
                              className={`condition-type-btn ${condition.type === 'selected' ? 'activated' : ''}`}
                              onClick={() => updateCondition(index, 'type', 'selected')}
                            >
                              Выбрал
                            </button>
                            <button
                              className={`condition-type-btn ${condition.type === 'not_selected' ? 'activated' : ''}`}
                              onClick={() => updateCondition(index, 'type', 'not_selected')}
                            >
                              Не выбрал
                            </button>

                            {selectedQuestion && selectedQuestion.answers && selectedQuestion.answers.length > 0 && (
                              <>
                                {condition.answers && condition.answers.length > 0 && (
                                  <div className="answers-container">
                                    {condition.answers.map((answer, ansIdx) => (
                                      <div key={ansIdx} className="answer-row">
                                        <select
                                          className="answer-select"
                                          value={answer}
                                          onChange={(e) => updateConditionAnswer(index, ansIdx, e.target.value)}
                                        >
                                          <option value="" disabled>Выберите ответ</option>
                                          {selectedQuestion.answers.map((a, aIdx) => (
                                            <option key={a.id || aIdx} value={a.text || a.type}>
                                              {a.text || a.type}
                                            </option>
                                          ))}
                                        </select>
                                        {ansIdx > 0 && (
                                          <button
                                            className="remove-answer-btn-small"
                                            onClick={() => {
                                              setHideRuleData(prev => ({
                                                ...prev,
                                                conditions: prev.conditions.map((c, i) =>
                                                  i === index ? { ...c, answers: c.answers.filter((_, j) => j !== ansIdx) } : c
                                                )
                                              }));
                                            }}
                                          >
                                            <svg width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                              <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <button
                                  className="add-answer-to-condition-btn"
                                  onClick={() => addAnswerToCondition(index)}
                                >
                                  + Ответ
                                </button>
                              </>
                            )}
                            {!selectedQuestion && (
                              <p className="no-answers-message">Выберите вопрос для настройки ответов</p>
                            )}
                            {selectedQuestion && (!selectedQuestion.answers || selectedQuestion.answers.length === 0) && (
                              <p className="no-answers-message">У вопроса нет ответов</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

                <button className="add-rule-condition-btn" onClick={addCondition}>
                  + Добавить условие
                </button>
              </div>
            </div>

            <div className="submit-form">
              <button className="cancel-btn" onClick={closeHideRuleModal}>
                Отменить
              </button>
              <button className="save-btn" onClick={async () => {
                // Сохраняем правила скрытия для этого вопроса
                if (hideRuleData.questionId) {
                  try {
                    // Фильтруем пустые условия
                    const validConditions = hideRuleData.conditions.filter(c => c.questionId);
                    const hideRulesJson = JSON.stringify({ conditions: validConditions });

                    await axios.put(
                      `http://localhost:8080/question/${hideRuleData.questionId}/hide-rules`,
                      { hide_rules: hideRulesJson }
                    );

                    // Обновляем локальное состояние
                    setHideRules(prev => ({
                      ...prev,
                      [hideRuleData.questionId]: {
                        conditions: validConditions
                      }
                    }));
                  } catch (err) {
                    console.error('Ошибка при сохранении правил скрытия:', err);
                    alert('Ошибка при сохранении правил скрытия: ' + (err.response?.data?.error || err.message));
                    return;
                  }
                }
                alert('Правило скрытия сохранено');
                closeHideRuleModal();
              }}>
                Сохранить
              </button>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно правила перехода */}
      {isTransitionRuleModalOpen && (
        <>
          <div className="modal-bg" onClick={closeTransitionRuleModal}></div>
          <div className="transition-rule-modal">
            <div className="transition-rule-modal-header">
              <h4>Настройка правила перехода</h4>
              <div className="close-btn" onClick={closeTransitionRuleModal}>
                <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="transition-rule-modal-body">
              {/* Вопрос, для которого настраивается правило */}
              {transitionRuleData.questionId && (
                <div className="transition-rule-question-info">
                  <p className="transition-rule-question-label">
                    Вопрос: <strong>{[...questions, ...passportQuestions, ...additionalBlocks.flatMap(b => b.questions)].find(q => q.id === transitionRuleData.questionId)?.text || 'Не найден'}</strong>
                  </p>
                </div>
              )}

              {/* Карточка условия */}
              <div className="transition-rule-condition-card">
                <div className="transition-rule-card-header">
                  <h5>Если респондент:</h5>
                  {transitionRuleData.conditions.length > 1 && (
                    <button
                      className="remove-transition-condition-btn"
                      onClick={() => {
                        if (confirm('Удалить все условия?')) {
                          setTransitionRuleData(prev => ({
                            ...prev,
                            conditions: [{ type: 'selected', answers: [''] }]
                          }));
                        }
                      }}
                    >
                      <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>

                {transitionRuleData.conditions.map((condition, index) => {
                  const currentQuestion = [...questions, ...passportQuestions, ...additionalBlocks.flatMap(b => b.questions)].find(q => q.id === transitionRuleData.questionId);

                  return (
                    <div key={index} className="transition-rule-condition">
                      <div className="transition-condition-header">
                        <span className="transition-condition-number">Условие {index + 1}</span>
                        {transitionRuleData.conditions.length > 1 && (
                          <button
                            className="remove-transition-condition-btn"
                            onClick={() => removeTransitionCondition(index)}
                          >
                            <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className="transition-type-buttons">
                        <button
                          className={`transition-type-btn ${condition.type === 'selected' ? 'activated' : ''}`}
                          onClick={() => updateTransitionCondition(index, 'type', 'selected')}
                        >
                          Выбрал
                        </button>
                        <button
                          className={`transition-type-btn ${condition.type === 'not_selected' ? 'activated' : ''}`}
                          onClick={() => updateTransitionCondition(index, 'type', 'not_selected')}
                        >
                          Не выбрал
                        </button>

                        {currentQuestion && currentQuestion.answers && currentQuestion.answers.length > 0 && (
                          <div className="transition-answers-container">
                            {condition.answers.map((answer, ansIdx) => (
                              <div key={ansIdx} className="transition-answer-row">
                                <select
                                  className="transition-answer-select"
                                  value={answer}
                                  onChange={(e) => updateTransitionConditionAnswer(index, ansIdx, e.target.value)}
                                >
                                  <option value="" disabled>Выберите ответ</option>
                                  {currentQuestion.answers.map((a, aIdx) => (
                                    <option key={a.id || aIdx} value={a.text || a.type}>
                                      {a.text || a.type}
                                    </option>
                                  ))}
                                </select>
                                {ansIdx > 0 && (
                                  <button
                                    className="remove-transition-answer-btn"
                                    onClick={() => {
                                      setTransitionRuleData(prev => ({
                                        ...prev,
                                        conditions: prev.conditions.map((c, i) =>
                                          i === index ? { ...c, answers: c.answers.filter((_, j) => j !== ansIdx) } : c
                                        )
                                      }));
                                    }}
                                  >
                                    <svg width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              className="add-transition-answer-btn"
                              onClick={() => addAnswerToTransitionCondition(index)}
                            >
                              + Ответ
                            </button>
                          </div>
                        )}
                        {currentQuestion && (!currentQuestion.answers || currentQuestion.answers.length === 0) && (
                          <p className="no-answers-message">У вопроса нет ответов</p>
                        )}
                        {!currentQuestion && (
                          <p className="no-answers-message">Выберите вопрос для настройки ответов</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                <button className="add-transition-condition-btn" onClick={addTransitionCondition}>
                  + Добавить условие
                </button>
              </div>

              {/* Действие после условия */}
              <div className="transition-action-card">
                <h5>Действие:</h5>
                <select
                  className="transition-action-select"
                  value={transitionRuleData.action}
                  onChange={(e) => setTransitionRuleData(prev => ({
                    ...prev,
                    action: e.target.value,
                    targetQuestionId: null,
                    targetBlockId: null
                  }))}
                >
                  <option value="question">Переход к вопросу</option>
                  <option value="block">Переход к блоку вопросов</option>
                  <option value="end">Завершение опроса</option>
                </select>

                {transitionRuleData.action === 'question' && (
                  <select
                    className="transition-target-select"
                    value={transitionRuleData.targetQuestionId || ''}
                    onChange={(e) => setTransitionRuleData(prev => ({
                      ...prev,
                      targetQuestionId: e.target.value
                    }))}
                  >
                    <option value="" disabled>Выберите вопрос</option>
                    {[...questions, ...passportQuestions, ...additionalBlocks.flatMap(b => b.questions)]
                      .filter(q => q.id !== transitionRuleData.questionId)
                      .map((q, idx) => (
                        <option key={q.id} value={q.id}>{idx + 1}. {q.text}</option>
                      ))}
                  </select>
                )}

                {transitionRuleData.action === 'block' && (
                  <select
                    className="transition-target-select"
                    value={transitionRuleData.targetBlockId || ''}
                    onChange={(e) => setTransitionRuleData(prev => ({
                      ...prev,
                      targetBlockId: e.target.value
                    }))}
                  >
                    <option value="" disabled>Выберите блок</option>
                    <option value="main">Основной блок</option>
                    <option value="passport">Паспортичка</option>
                    {additionalBlocks.map(block => (
                      <option key={block.id} value={block.id}>{block.name}</option>
                    ))}
                  </select>
                )}

                {transitionRuleData.action === 'end' && (
                  <select className="transition-target-select" disabled>
                    <option>Завершение опроса</option>
                  </select>
                )}
              </div>
            </div>

            <div className="submit-form">
              <button className="cancel-btn" onClick={closeTransitionRuleModal}>
                Отменить
              </button>
              <button className="save-btn" onClick={async () => {
                // Сохраняем правила перехода для этого вопроса
                if (transitionRuleData.questionId) {
                  try {
                    // Фильтруем пустые условия
                    const validConditions = transitionRuleData.conditions.filter(c => c.answers && c.answers.length > 0 && c.answers[0] !== '');
                    const transitionRulesData = {
                      conditions: validConditions,
                      action: transitionRuleData.action,
                      targetQuestionId: transitionRuleData.targetQuestionId,
                      targetBlockId: transitionRuleData.targetBlockId
                    };
                    const transitionRulesJson = JSON.stringify(transitionRulesData);

                    await axios.put(
                      `http://localhost:8080/question/${transitionRuleData.questionId}/transition-rules`,
                      { transition_rules: transitionRulesJson }
                    );

                    // Обновляем локальное состояние
                    setTransitionRules(prev => ({
                      ...prev,
                      [transitionRuleData.questionId]: transitionRulesData
                    }));
                  } catch (err) {
                    console.error('Ошибка при сохранении правил перехода:', err);
                    alert('Ошибка при сохранении правил перехода: ' + (err.response?.data?.error || err.message));
                    return;
                  }
                }
                alert('Правило перехода сохранено');
                closeTransitionRuleModal();
              }}>
                Сохранить
              </button>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно противоречий */}
      {isContradictionModalOpen && (
        <>
          <div className="modal-bg" onClick={closeContradictionModal}></div>
          <div className="contradiction-modal">
            <div className="contradiction-modal-header">
              <h4>Настройка противоречий</h4>
              <div className="close-btn" onClick={closeContradictionModal}>
                <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="contradiction-modal-body">
              {/* Вопрос, для которого настраиваются противоречия */}
              {contradictionData.questionId && (
                <div className="contradiction-question-info">
                  <p className="contradiction-question-label">
                    Вопрос: <strong>{[...questions, ...passportQuestions, ...additionalBlocks.flatMap(b => b.questions)].find(q => q.id === contradictionData.questionId)?.text || 'Не найден'}</strong>
                  </p>
                </div>
              )}

              {/* Переключатель и ответы */}
              <div className="contradiction-type-section">
                <div className="contradiction-type-buttons">
                  <button
                    className={`contradiction-type-btn ${contradictionData.type === 'selected' ? 'activated' : ''}`}
                    onClick={() => setContradictionData(prev => ({ ...prev, type: 'selected' }))}
                  >
                    Выбрал
                  </button>
                  <button
                    className={`contradiction-type-btn ${contradictionData.type === 'not_selected' ? 'activated' : ''}`}
                    onClick={() => setContradictionData(prev => ({ ...prev, type: 'not_selected' }))}
                  >
                    Не выбрал
                  </button>

                  {(() => {
                    const currentQuestion = [...questions, ...passportQuestions, ...additionalBlocks.flatMap(b => b.questions)].find(q => q.id === contradictionData.questionId);
                    if (currentQuestion && currentQuestion.answers && currentQuestion.answers.length > 0) {
                      return (
                        <div className="contradiction-answers-container">
                          {contradictionData.answers.map((answer, ansIdx) => (
                            <div key={ansIdx} className="contradiction-answer-row">
                              <select
                                className="contradiction-answer-select"
                                value={answer}
                                onChange={(e) => {
                                  setContradictionData(prev => ({
                                    ...prev,
                                    answers: prev.answers.map((a, i) => i === ansIdx ? e.target.value : a)
                                  }));
                                }}
                              >
                                <option value="" disabled>Выберите ответ</option>
                                {currentQuestion.answers.map((a, aIdx) => (
                                  <option key={a.id || aIdx} value={a.text || a.type}>
                                    {a.text || a.type}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return <p className="no-answers-message">У вопроса нет ответов</p>;
                  })()}
                </div>
              </div>

              {/* Разделитель "Противоречит" */}
              <div className="contradiction-divider">
                <span className="contradiction-divider-line"></span>
                <span className="contradiction-divider-text">Противоречит</span>
                <span className="contradiction-divider-line"></span>
              </div>

              {/* Выпадающий список вопросов */}
              <div className="contradict-question-section">
                <select
                  className="contradict-question-select"
                  value={contradictionData.contradictQuestionId || ''}
                  onChange={(e) => setContradictionData(prev => ({
                    ...prev,
                    contradictQuestionId: e.target.value,
                    contradictAnswers: [] // Сбрасываем ответы при выборе нового вопроса
                  }))}
                >
                  <option value="" disabled>Выберите вопрос</option>
                  {[...questions, ...passportQuestions, ...additionalBlocks.flatMap(b => b.questions)]
                    .filter(q => q.id !== contradictionData.questionId)
                    .map((q, idx) => (
                      <option key={q.id} value={q.id}>{idx + 1}. {q.text}</option>
                    ))}
                </select>

                {/* Ответы на противоречащий вопрос */}
                {contradictionData.contradictQuestionId && (
                  <div className="contradict-answers-container">
                    {(() => {
                      const contradictQuestion = [...questions, ...passportQuestions, ...additionalBlocks.flatMap(b => b.questions)].find(q => q.id === contradictionData.contradictQuestionId);
                      if (contradictQuestion && contradictQuestion.answers && contradictQuestion.answers.length > 0) {
                        return (
                          <>
                            {contradictionData.contradictAnswers.length > 0 ? (
                              <>
                                {contradictionData.contradictAnswers.map((answer, ansIdx) => (
                                  <div key={ansIdx} className="contradict-answer-row">
                                    <select
                                      className="contradict-answer-select"
                                      value={answer}
                                      onChange={(e) => updateContradictionAnswer(ansIdx, e.target.value)}
                                    >
                                      <option value="" disabled>Выберите ответ</option>
                                      {contradictQuestion.answers.map((a, aIdx) => (
                                        <option key={a.id || aIdx} value={a.text || a.type}>
                                          {a.text || a.type}
                                        </option>
                                      ))}
                                    </select>
                                    {contradictionData.contradictAnswers.length > 1 && ansIdx > 0 && (
                                      <button
                                        className="remove-contradict-answer-btn"
                                        onClick={() => removeContradictionAnswer(ansIdx)}
                                      >
                                        <svg width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </>
                            ) : (
                              ''
                            )}
                            <button
                              className="add-contradict-answer-btn"
                              onClick={addContradictionAnswer}
                            >
                              + Ответ
                            </button>
                          </>
                        );
                      }
                      return <p className="no-answers-message">У вопроса нет ответов</p>;
                    })()}
                  </div>
                )}
              </div>

              {/* Разделительная полоса */}
              <div className="contradiction-section-divider"></div>

              {/* Запрет противоречий */}
              <div className="contradiction-forbid-section">
                <label className="contradiction-forbid-label">Запрет противоречий</label>
                <input
                  type="checkbox"
                  id="contradiction-forbid-switcher"
                  className="options-switcher"
                  checked={contradictionData.forbidContradictions}
                  onChange={(e) => setContradictionData(prev => ({
                    ...prev,
                    forbidContradictions: e.target.checked
                  }))}
                />
                <label htmlFor="contradiction-forbid-switcher" className="options-switcher-label"></label>
              </div>
            </div>

            <div className="submit-form">
              <button className="cancel-btn" onClick={closeContradictionModal}>
                Отменить
              </button>
              <button className="save-btn" onClick={async () => {
                // Сохраняем правила противоречий для этого вопроса
                if (contradictionData.questionId) {
                  try {
                    // Фильтруем пустые ответы
                    const validAnswers = contradictionData.answers.filter(a => a !== '');
                    const validContradictAnswers = contradictionData.contradictAnswers.filter(a => a !== '');

                    const contradictionRulesData = {
                      type: contradictionData.type,
                      answers: validAnswers.length > 0 ? validAnswers : contradictionData.answers,
                      contradictQuestionId: contradictionData.contradictQuestionId,
                      contradictAnswers: validContradictAnswers,
                      forbidContradictions: contradictionData.forbidContradictions
                    };
                    const contradictionRulesJson = JSON.stringify(contradictionRulesData);

                    await axios.put(
                      `http://localhost:8080/question/${contradictionData.questionId}/contradiction-rules`,
                      { contradiction_rules: contradictionRulesJson }
                    );

                    // Обновляем локальное состояние
                    setContradictionRules(prev => ({
                      ...prev,
                      [contradictionData.questionId]: contradictionRulesData
                    }));
                  } catch (err) {
                    console.error('Ошибка при сохранении правил противоречий:', err);
                    alert('Ошибка при сохранении правил противоречий: ' + (err.response?.data?.error || err.message));
                    return;
                  }
                }
                alert('Правила противоречий сохранены');
                closeContradictionModal();
              }}>
                Сохранить
              </button>
            </div>
          </div>
        </>
      )}

      {questionMenuOpen && (
        <>
          <div
            className="question-menu-bg"
            onClick={() => setQuestionMenuOpen(false)}
          ></div>
          <div
            className="question-menu"
            style={{
              left: `${questionMenuPosition.x}px`,
              top: `${questionMenuPosition.y}px`
            }}
          >
            <h5>Выберите тип вопроса</h5>
            <ul className="question-menu-list">
              {questionTypes.map((type) => (
                <li
                  key={type.id}
                  className="question-menu-item"
                  onClick={() => handleQuestionTypeSelect(type.id)}
                >
                  {type.label}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {blockMenuOpen && (
        <>
          <div
            className="question-menu-bg"
            onClick={() => setBlockMenuOpen(false)}
          ></div>
          <div
            className="question-menu"
            style={{
              left: `${blockMenuPosition.x}px`,
              top: `${blockMenuPosition.y}px`
            }}
          >
            <ul className="question-menu-list">
              <li
                className="question-menu-item delete-option"
                onClick={handleBlockDelete}
              >
                Удалить блок
              </li>
            </ul>
          </div>
        </>
      )}

      {settingsMenuOpen && (
        <>
          <div
            className="question-menu-bg"
            onClick={() => setSettingsMenuOpen(false)}
          ></div>
          <div
            className="question-menu"
            style={{
              left: `${settingsMenuPosition.x}px`,
              top: `${settingsMenuPosition.y}px`
            }}
          >
            <ul className="question-menu-list">
              <li
                className="question-menu-item"
                onClick={() => {
                  openTransitionRuleModal(selectedQuestionForSettings);
                }}
              >
                Правило перехода
              </li>
              <li
                className="question-menu-item"
                onClick={() => {
                  openHideRuleModal(selectedQuestionForSettings);
                }}
              >
                Правило скрытия
              </li>
              <li
                className="question-menu-item"
                onClick={() => {
                  openContradictionModal(selectedQuestionForSettings);
                }}
              >
                Противоречия
              </li>
            </ul>
          </div>
        </>
      )}

      {isQuestionFormOpen && (
        <>
          <div
            className="modal-bg"
            onClick={() => {
              setIsQuestionFormOpen(false);
              setQuestionProperties({
                maxAnswers: '',
                shuffleAnswers: false,
                regionScope: 'all'
              });
            }}
          ></div>
          <div className="question-form-window">
            <div className="question-form-container">
              <div className="question-form-main">
                <div className="question-form-header">
                  <h4>Создание вопроса</h4>
                  <div className="close-btn" onClick={() => {
                    setIsQuestionFormOpen(false);
                    setQuestionProperties({
                      maxAnswers: '',
                      shuffleAnswers: false,
                      regionScope: 'all'
                    });
                  }}>
                    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                <textarea
                  className="question-text-input"
                  placeholder="Введите вопрос"
                  value={questionData.text}
                  onChange={(e) => setQuestionData(prev => ({ ...prev, text: e.target.value }))}
                />

                <textarea
                  className="question-explanation-input"
                  placeholder="Введите пояснение"
                  value={questionData.explanation}
                  onChange={(e) => setQuestionData(prev => ({ ...prev, explanation: e.target.value }))}
                />

                <div className="answers-section">
                  {questionData.answers.length > 0 && (
                    <div className="answers-list">
                      {questionData.answers.map((answer) => (
                        <div key={answer.id} className="answer-item">
                          {(answer.type === 'text' || answer.type === 'other') ? (
                            <input
                              type="text"
                              className="answer-text-input"
                              placeholder={answer.type === 'text' ? 'Введите вариант ответа' : 'Введите свой вариант'}
                              value={answer.text}
                              onChange={(e) => handleAnswerTextChange(answer.id, e.target.value)}
                            />
                          ) : (
                            <span className="answer-label">{answer.text}</span>
                          )}
                          <button
                            className="remove-answer-btn"
                            onClick={() => handleRemoveAnswer(answer.id)}
                          >
                            <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="answers-header">
                  <button
                    className="add-answer-btn"
                    onClick={handleAddAnswerClick}
                  >
                    + Ответ
                  </button>
                </div>
              </div>

              <div className="question-form-sidebar">
                <h5>Свойства вопроса</h5>

                <div className="property-group">
                  <label>Максимум ответов</label>
                  <input
                    type="number"
                    className="property-input"
                    value={questionProperties.maxAnswers}
                    onChange={(e) => setQuestionProperties(prev => ({
                      ...prev,
                      maxAnswers: e.target.value
                    }))}
                    min="1"
                    placeholder="Неограниченно"
                  />
                </div>

                <div className="property-group">
                  <label>Перемешивать ответы</label>
                  <input
                    type="checkbox"
                    id="shuffle-answers-switcher"
                    className="options-switcher"
                    checked={questionProperties.shuffleAnswers}
                    onChange={(e) => setQuestionProperties(prev => ({
                      ...prev,
                      shuffleAnswers: e.target.checked
                    }))}
                  />
                  <label htmlFor="shuffle-answers-switcher" className="options-switcher-label"></label>
                </div>

                <div className="property-group">
                  <label>Вопрос для регионов</label>
                  <select
                    className="property-select"
                    value={questionProperties.regionScope}
                    onChange={(e) => setQuestionProperties(prev => ({
                      ...prev,
                      regionScope: e.target.value
                    }))}
                  >
                    <option value="all">Все регионы</option>
                    <option value="central">Центральный</option>
                    <option value="northwest">Северо-Западный</option>
                    <option value="south">Южный</option>
                    <option value="northcaucasus">Северо-Кавказский</option>
                    <option value="volga">Приволжский</option>
                    <option value="ural">Уральский</option>
                    <option value="siberia">Сибирский</option>
                    <option value="fareast">Дальневосточный</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="submit-form">
              <button
                className="cancel-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setIsQuestionFormOpen(false);
                  setQuestionProperties({
                    maxAnswers: '',
                    shuffleAnswers: false,
                    regionScope: 'all'
                  });
                }}
              >
                Отменить
              </button>
              <button
                type="button"
                className="save-btn"
                onClick={handleSaveQuestion}
              >
                Сохранить
              </button>
            </div>
          </div>
        </>
      )}

      {answerMenuOpen && (
        <>
          <div
            className="question-menu-bg"
            onClick={() => setAnswerMenuOpen(false)}
          ></div>
          <div
            className="question-menu"
            style={{
              left: `${answerMenuPosition.x}px`,
              top: `${answerMenuPosition.y}px`
            }}
          >
            <h5>Выберите тип ответа</h5>
            <ul className="question-menu-list">
              {answerTypes.map((type) => (
                <li
                  key={type.id}
                  className="question-menu-item"
                  onClick={() => handleAnswerTypeSelect(type.id)}
                >
                  {type.label}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="buttons">
        <button
          className="create-btn"
          onClick={openQuestionnaireModal}
        >
          <p>Создать анкету</p>
        </button>
        <button className="update-btn" onClick={fetchQuestionnaires}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21.986">
            <path d="M19.841 3.24A10.988 10.988 0 0 0 8.54.573l1.266 3.8a7.033 7.033 0 0 1 8.809 9.158L17 11.891v7.092h7l-2.407-2.439A11.049 11.049 0 0 0 19.841 3.24zM1 10.942a11.05 11.05 0 0 0 11.013 11.044 11.114 11.114 0 0 0 3.521-.575l-1.266-3.8a7.035 7.035 0 0 1-8.788-9.22L7 9.891V6.034c.021-.02.038-.044.06-.065L7 5.909V2.982H0l2.482 2.449A10.951 10.951 0 0 0 1 10.942z" />
          </svg>
        </button>
      </div>

      <div className="questionnaires-table">
        <table>
          <thead>
            <tr>
              <th>Название анкеты</th>
              <th>Код опроса</th>
              <th>Дата создания</th>
              <th> </th>
            </tr>
          </thead>
          <tbody>
            {currentQuestionnaires.length > 0 ? (
              currentQuestionnaires.map((questionnaire) => (
                <tr key={questionnaire.id}>
                  <td
                    onClick={() => openQuestionnaire(questionnaire.id)}
                    className="questionnaire-name-link"
                    title="Открыть анкету для редактирования">
                    {questionnaire.name || 'Без названия'}
                  </td>
                  <td>{questionnaire.code || '-'}</td>
                  <td>
                    {questionnaire.created_at
                      ? new Date(questionnaire.created_at).toLocaleDateString('ru-RU')
                      : '-'
                    }
                  </td>
                  <td
                    onClick={() => deleteQuestionnaire(questionnaire.id)}
                    title="Удалить анкету"
                    className="td-delete"
                  >
                    <button
                      className="delete-route-btn">
                      <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="#ff4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  Нет доступных анкет
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {questionnaireList.length > itemsPerPage && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Предыдущая
            </button>
            <span>Страница {currentPage} из {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Следующая
            </button>
          </div>
        )}
      </div>
    </>
  );
}

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
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [currentQuestionType, setCurrentQuestionType] = useState(null);
  const [questionData, setQuestionData] = useState({ text: '', explanation: '', answers: [] });
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
        block_type: selectedQuestionBlock, // Добавляем информацию о блоке (правильное имя поля для бэкенда)
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
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <g clip-path="url(#clip0_429_11083)">
                      {" "}
                      <path
                        d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006"
                        stroke="#292929"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
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
                                {isExpanded ? <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="#000000"></path> </g></svg> :
                                  <svg fill="#000000" width="16px" height="16px" viewBox="-8.5 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>right</title> <path d="M7.75 16.063l-7.688-7.688 3.719-3.594 11.063 11.094-11.344 11.313-3.5-3.469z"></path> </g></svg>}
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
                          <div className="posled-button"><button><svg fill="#000000" width="64px" height="64px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M7.293,7.707a1,1,0,0,1,0-1.414l4-4a1,1,0,0,1,1.414,0l4,4a1,1,0,1,1-1.414,1.414L12,4.414,8.707,7.707A1,1,0,0,1,7.293,7.707Zm0,10,4,4a1,1,0,0,0,1.414,0l4-4a1,1,0,0,0-1.414-1.414L12,19.586,8.707,16.293a1,1,0,1,0-1.414,1.414Z"></path></g></svg></button></div>
                          <div className="dop-button"><button><svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle cx="18" cy="12" r="1.5" transform="rotate(90 18 12)" fill="#080341"></circle> <circle cx="12" cy="12" r="1.5" transform="rotate(90 12 12)" fill="#080341"></circle> <circle cx="6" cy="12" r="1.5" transform="rotate(90 6 12)" fill="#080341"></circle> </g></svg></button></div>
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
                                <button
                                  className="remove-question-btn"
                                  onClick={() => handleRemoveQuestion(question.id)}
                                >
                                  <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
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
                          <div className="posled-button"><button><svg fill="#000000" width="64px" height="64px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M7.293,7.707a1,1,0,0,1,0-1.414l4-4a1,1,0,0,1,1.414,0l4,4a1,1,0,1,1-1.414,1.414L12,4.414,8.707,7.707A1,1,0,0,1,7.293,7.707Zm0,10,4,4a1,1,0,0,0,1.414,0l4-4a1,1,0,0,0-1.414-1.414L12,19.586,8.707,16.293a1,1,0,1,0-1.414,1.414Z"></path></g></svg></button></div>
                          <div className="dop-button"><button><svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle cx="18" cy="12" r="1.5" transform="rotate(90 18 12)" fill="#080341"></circle> <circle cx="12" cy="12" r="1.5" transform="rotate(90 12 12)" fill="#080341"></circle> <circle cx="6" cy="12" r="1.5" transform="rotate(90 6 12)" fill="#080341"></circle> </g></svg></button></div>
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
                                    <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
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
                            <div className="posled-button"><button><svg fill="#000000" width="64px" height="64px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M7.293,7.707a1,1,0,0,1,0-1.414l4-4a1,1,0,0,1,1.414,0l4,4a1,1,0,1,1-1.414,1.414L12,4.414,8.707,7.707A1,1,0,0,1,7.293,7.707Zm0,10,4,4a1,1,0,0,0,1.414,0l4-4a1,1,0,0,0-1.414-1.414L12,19.586,8.707,16.293a1,1,0,1,0-1.414,1.414Z"></path></g></svg></button></div>
                            <div className="dop-button"><button><svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle cx="18" cy="12" r="1.5" transform="rotate(90 18 12)" fill="#080341"></circle> <circle cx="12" cy="12" r="1.5" transform="rotate(90 12 12)" fill="#080341"></circle> <circle cx="6" cy="12" r="1.5" transform="rotate(90 6 12)" fill="#080341"></circle> </g></svg></button></div>
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
                                      <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
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
                <p>settings</p>
              </>
            )}

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

      {isQuestionFormOpen && (
        <>
          <div
            className="modal-bg"
            onClick={() => setIsQuestionFormOpen(false)}
          ></div>
          <div className="question-form-window">
            <div className="question-form-content">
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
                            <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#ff4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
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

            <div className="submit-form">
              <button
                className="cancel-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setIsQuestionFormOpen(false);
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

import './Survey.css'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Survey() {
    const [isWindowOpen, setIsWindowOpen] = useState(false);
    const [surveys, setSurveys] = useState([]);

    // Состояния для формы
    const [surveyName, setSurveyName] = useState('');
    const [surveyCode, setSurveyCode] = useState('');
    const [responsible, setResponsible] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [adaptation, setAdaptation] = useState(false);
    const [adaptationDate, setAdaptationDate] = useState('');
    const [koir, setKoir] = useState(false);
    const [exitPoll, setExitPoll] = useState(false);
    const [manualInput, setManualInput] = useState(false);
    const [editingSurveyId, setEditingSurveyId] = useState(null);

    // Состояние для текущего этапа (1-5)
    const [currentStep, setCurrentStep] = useState(1);
    // Состояние для пройденных этапов
    const [completedSteps, setCompletedSteps] = useState([]);
    // Состояния для отслеживания изменений на этапах
    const [step1Changed, setStep1Changed] = useState(false);
    const [step3Changed, setStep3Changed] = useState(false);
    const [step4Changed, setStep4Changed] = useState(false);

    // Пагинация
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15; // количество опросов на странице
    const totalPages = Math.ceil(surveys.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentSurveys = surveys.slice(startIndex, startIndex + itemsPerPage);

    // Состояния для блоков выборок, анкет и маршрутов
    const [showRelatedBlocks, setShowRelatedBlocks] = useState(false);
    const [currentSurveyId, setCurrentSurveyId] = useState(null);

    // Данные для выборок
    const [samples, setSamples] = useState([]);
    const [selectedSample, setSelectedSample] = useState('');
    const [isSampleSelectModalOpen, setIsSampleSelectModalOpen] = useState(false);

    // Данные для анкет
    const [questionnaires, setQuestionnaires] = useState([]);
    const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('');
    const [isQuestionnaireSelectModalOpen, setIsQuestionnaireSelectModalOpen] = useState(false);

    // Данные для маршрутов
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState('');
    const [isRouteSelectModalOpen, setIsRouteSelectModalOpen] = useState(false);

    // Данные для адаптации анкеты (этап 2)
    const [adaptationQuestionnaires, setAdaptationQuestionnaires] = useState([]);
    const [selectedAdaptationQuestionnaire, setSelectedAdaptationQuestionnaire] = useState('');
    const [adaptationQuestions, setAdaptationQuestions] = useState([]);
    const [adaptationPassportQuestions, setAdaptationPassportQuestions] = useState([]);
    const [adaptationAdditionalBlocks, setAdaptationAdditionalBlocks] = useState([]);
    const [adaptationScope, setAdaptationScope] = useState('regions');
    const [adaptationCities, setAdaptationCities] = useState([]);
    const [adaptationExpandedDistricts, setAdaptationExpandedDistricts] = useState({});
    const [adaptationLoading, setAdaptationLoading] = useState(false);

    // Состояния для модального окна редактирования вопроса
    const [isQuestionEditModalOpen, setIsQuestionEditModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editingQuestionText, setEditingQuestionText] = useState('');
    const [editingQuestionEnabled, setEditingQuestionEnabled] = useState(true);
    const [editingAnswers, setEditingAnswers] = useState([]);

    // Загрузка опросов из БД
    const fetchSurveys = async () => {
        try {
            const response = await axios.get('http://localhost:8080/surveys');
            setSurveys(Array.isArray(response.data) ? response.data : []);
            setCurrentPage(1); // сбрасываем на первую страницу после обновления
        } catch (err) {
            console.error('Ошибка при загрузке опросов:', err);
            setSurveys([]);
        }
    };

    // Переход к следующему этапу
    const goToNextStep = () => {
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    // Переход к конкретному этапу по клику
    const goToStep = (step) => {
        // Можно перейти к текущему, пройденному или следующему после пройденного этапу
        if (step <= currentStep || completedSteps.includes(step - 1) || step === currentStep + 1) {
            setCurrentStep(step);
        }
    };

    // Отметить этап как сохраненный (зеленый)
    const markStepAsCompleted = (step) => {
        if (!completedSteps.includes(step)) {
            setCompletedSteps([...completedSteps, step]);
        }
    };

    // Проверка валидации текущего этапа перед переходом
    const validateCurrentStep = () => {
        switch (currentStep) {
            case 1: // Настройка опроса
                return surveyName && surveyCode && responsible;
            case 2: // Адаптация анкеты
                return true; // Этап может быть пропущен
            case 3: // Перенос в КОИР
                return true; // Этап может быть пропущен
            case 4: // Проведение опроса
                return startDate && endDate;
            case 5: // Завершение опроса
                return true;
            default:
                return false;
        }
    };

    // Обработчик кнопки "Следующий этап"
    const handleNextStep = () => {
        // Отмечаем текущий этап как завершенный при переходе дальше, если были изменения
        if (currentStep === 1 && step1Changed) {
            markStepAsCompleted(1);
        }
        if (currentStep === 3 && step3Changed) {
            markStepAsCompleted(3);
        }
        if (currentStep === 4 && step4Changed) {
            markStepAsCompleted(4);
        }

        if (currentStep === 5) {
            // На последнем этапе сохраняем опрос
            handleSaveSurvey(new Event('submit'));
        } else if (validateCurrentStep()) {
            goToNextStep();
        } else {
            alert('Пожалуйста, заполните все обязательные поля');
        }
    };

    // Получение статуса этапа
    const getStepStatus = (step) => {
        if (completedSteps.includes(step)) return 'completed';
        if (step === currentStep) return 'current';
        return 'pending';
    };

    // Сохранение текущего этапа
    const handleSaveCurrentStep = async () => {
        const surveyId = editingSurveyId || currentSurveyId;

        // Этап 2 (Адаптация) не имеет общей формы для сохранения – адаптации сохраняются через модальное окно вопроса.
        // При нажатии «Сохранить» на этапе 2 просто переходим к следующему этапу.
        if (currentStep === 2) {
            if (!completedSteps.includes(2)) {
                // Можно раскомментировать, если хотите предупреждать пользователя
                // alert('Сначала сохраните изменения хотя бы одного вопроса на этом этапе');
                // return;
            }
            goToNextStep();
            return;
        }

        let data = {};
        let isValid = true;

        switch (currentStep) {
            case 1:
                if (!surveyName || !surveyCode || !responsible) {
                    alert('Заполните обязательные поля: название, код, ответственный');
                    isValid = false;
                    break;
                }
                data = {
                    name: surveyName,
                    code: surveyCode,
                    responsible: responsible,
                    adaptation: adaptation,
                    adaptation_date: adaptationDate ? new Date(adaptationDate).toISOString() : null,
                };
                break;
            case 3:
                data = { koir };
                break;
            case 4:
                if (!startDate || !endDate) {
                    alert('Укажите даты начала и окончания опроса');
                    isValid = false;
                    break;
                }
                data = {
                    start_date: new Date(startDate).toISOString(),
                    end_date: new Date(endDate).toISOString(),
                    exit_poll: exitPoll,
                    manual_input: manualInput,
                };
                break;
            case 5:
                // Финальное сохранение всего опроса
                await handleSaveSurvey(new Event('submit'));
                // После успешного сохранения отмечаем этап 5 завершённым
                markStepAsCompleted(5);
                alert('Опрос успешно сохранён!');
                // Окно не закрываем, этапов больше нет
                return;
            default:
                return;
        }

        if (!isValid) return;

        try {
            let response;
            if (currentStep === 1 && !surveyId) {
                // Создание нового опроса
                response = await axios.post('http://localhost:8080/survey', data);
                if (response.data.message === 'Опрос успешно создан') {
                    const newId = response.data.id;
                    setEditingSurveyId(newId);
                    setCurrentSurveyId(newId);
                    markStepAsCompleted(1);
                    setStep1Changed(false);
                    goToNextStep();
                }
            } else {
                // Обновление существующего опроса
                response = await axios.put(`http://localhost:8080/survey/${surveyId}`, data);
                if (response.data.message === 'Опрос успешно обновлен') {
                    if (currentStep === 1) {
                        markStepAsCompleted(1);
                        setStep1Changed(false);
                    } else if (currentStep === 3) {
                        markStepAsCompleted(3);
                        setStep3Changed(false);
                    } else if (currentStep === 4) {
                        markStepAsCompleted(4);
                        setStep4Changed(false);
                    }
                    goToNextStep();
                }
            }
        } catch (err) {
            console.error('Ошибка сохранения этапа:', err);
            alert('Ошибка: ' + (err.response?.data?.error || err.message));
        }
    };

    // Загрузка выборок
    const fetchSamples = async () => {
        try {
            const response = await axios.get('http://localhost:8080/samples');
            setSamples(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Ошибка при загрузке выборок:', err);
            setSamples([]);
        }
    };

    // Загрузка анкет
    const fetchQuestionnaires = async () => {
        try {
            const response = await axios.get('http://localhost:8080/questionnaires');
            setQuestionnaires(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.warn('Анкеты не загружены (endpoint недоступен):', err.message);
            setQuestionnaires([]);
        }
    };

    // Загрузка маршрутов
    const fetchRoutes = async () => {
        try {
            const response = await axios.get('http://localhost:8080/routes');
            setRoutes(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Ошибка при загрузке маршрутов:', err);
            setRoutes([]);
        }
    };

    // Загрузка анкет для адаптации
    const fetchAdaptationQuestionnaires = async () => {
        try {
            const response = await axios.get('http://localhost:8080/questionnaires');
            setAdaptationQuestionnaires(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Ошибка при загрузке анкет для адаптации:', err);
            setAdaptationQuestionnaires([]);
        }
    };

    // Загрузка городов для адаптации
    const fetchAdaptationCities = async () => {
        setAdaptationLoading(true);
        try {
            const response = await axios.get('http://localhost:8080/cities');
            setAdaptationCities(response.data);
        } catch (err) {
            console.error('Ошибка при загрузке городов:', err);
            setAdaptationCities([]);
        } finally {
            setAdaptationLoading(false);
        }
    };

    // Загрузка вопросов выбранной анкеты для адаптации
    const fetchAdaptationQuestions = async (questionnaireId) => {
        if (!questionnaireId) {
            setAdaptationQuestions([]);
            setAdaptationPassportQuestions([]);
            setAdaptationAdditionalBlocks([]);
            return;
        }
        try {
            const response = await axios.get(`http://localhost:8080/questionnaire/${questionnaireId}/questions`);
            const allQuestions = Array.isArray(response.data) ? response.data : [];

            // Разделяем вопросы по типам блоков
            const mainQuestions = allQuestions.filter(q => q.block_type === 'main');
            const passportQuestions = allQuestions.filter(q => q.block_type === 'passport');
            const additionalQuestions = allQuestions.filter(q => q.block_type && q.block_type.startsWith('additional_'));

            // Группируем дополнительные блоки
            const additionalBlocksMap = {};
            additionalQuestions.forEach(q => {
                if (!additionalBlocksMap[q.block_type]) {
                    additionalBlocksMap[q.block_type] = [];
                }
                additionalBlocksMap[q.block_type].push(q);
            });

            const additionalBlocksArr = Object.keys(additionalBlocksMap).map((blockId, index) => ({
                id: blockId,
                name: `Дополнительный блок ${index + 1}`,
                questions: additionalBlocksMap[blockId]
            }));

            setAdaptationQuestions(mainQuestions);
            setAdaptationPassportQuestions(passportQuestions);
            setAdaptationAdditionalBlocks(additionalBlocksArr);
        } catch (err) {
            console.error('Ошибка при загрузке вопросов анкеты:', err);
            setAdaptationQuestions([]);
            setAdaptationPassportQuestions([]);
            setAdaptationAdditionalBlocks([]);
        }
    };

    // Переключение раскрытия округа в дереве ФО
    const toggleAdaptationDistrict = (district) => {
        setAdaptationExpandedDistricts(prev => ({
            ...prev,
            [district]: !prev[district]
        }));
    };

    // Обработчик выбора анкеты для адаптации
    const handleAdaptationQuestionnaireChange = (questionnaireId) => {
        setSelectedAdaptationQuestionnaire(questionnaireId);
        fetchAdaptationQuestions(questionnaireId);
    };

    // Открыть модальное окно редактирования вопроса
    const openQuestionEditModal = async (question) => {
        console.log('Открытие модального окна редактирования вопроса:', {
            questionId: question.id,
            currentSurveyId: currentSurveyId,
            question: question
        });

        setEditingQuestion(question);
        setEditingQuestionText(question.text || '');
        setEditingQuestionEnabled(true);

        // Преобразуем ответы в нужный формат
        const answersData = (question.answers || []).map((answer, index) => ({
            id: answer.id || index,
            number: String(index + 1).padStart(3, '0'),
            text: typeof answer === 'string' ? answer : (answer.text || answer.type || ''),
            enabled: true
        }));

        // Загружаем сохраненные адаптации, если есть surveyId
        if (currentSurveyId) {
            try {
                console.log('Загрузка адаптаций для вопроса:', question.id, 'опроса:', currentSurveyId);
                const response = await axios.get(
                    `http://localhost:8080/survey/${currentSurveyId}/question/${question.id}/adaptations`
                );

                console.log('Полученные адаптации:', response.data);

                if (response.data && response.data.length > 0) {
                    // Берем последнюю адаптацию
                    const latestAdaptation = response.data[0];
                    const answersDataParsed = JSON.parse(latestAdaptation.answers_data || '[]');

                    console.log('Распарсенные данные ответов:', answersDataParsed);

                    setEditingQuestionText(latestAdaptation.question_text || question.text || '');
                    setEditingQuestionEnabled(latestAdaptation.is_enabled !== false);

                    // Обновляем ответы из сохраненной адаптации
                    const updatedAnswers = answersData.map((answer, index) => {
                        const savedAnswer = answersDataParsed.find(a => a.id === answer.id);
                        return {
                            ...answer,
                            text: savedAnswer ? savedAnswer.text : answer.text,
                            enabled: savedAnswer ? savedAnswer.enabled : answer.enabled
                        };
                    });
                    setEditingAnswers(updatedAnswers);
                } else {
                    setEditingAnswers(answersData);
                }
            } catch (err) {
                console.error('Ошибка при загрузке адаптаций:', err);
                setEditingAnswers(answersData);
            }
        } else {
            console.log('currentSurveyId не установлен, адаптации не загружаются');
            setEditingAnswers(answersData);
        }

        setIsQuestionEditModalOpen(true);
    };

    // Закрыть модальное окно редактирования вопроса
    const closeQuestionEditModal = () => {
        setIsQuestionEditModalOpen(false);
        setEditingQuestion(null);
        setEditingQuestionText('');
        setEditingQuestionEnabled(true);
        setEditingAnswers([]);
    };

    // Обновить текст ответа
    const handleAnswerTextChange = (index, value) => {
        setEditingAnswers(prev => prev.map((answer, i) =>
            i === index ? { ...answer, text: value } : answer
        ));
    };

    // Переключить состояние ответа
    const toggleAnswerEnabled = (index) => {
        setEditingAnswers(prev => prev.map((answer, i) =>
            i === index ? { ...answer, enabled: !answer.enabled } : answer
        ));
    };

    // Сохранить изменения вопроса
    const handleSaveQuestionEdit = async () => {
        if (!editingQuestion) {
            alert('Ошибка: вопрос не выбран');
            return;
        }

        if (!currentSurveyId) {
            alert('Сначала сохраните опрос, чтобы сохранить адаптации вопросов');
            return;
        }

        console.log('Сохранение адаптации вопроса:', {
            surveyId: currentSurveyId,
            questionId: editingQuestion.id,
            data: {
                question_text: editingQuestionText,
                is_enabled: editingQuestionEnabled,
                region_scope: adaptationScope,
                answers: editingAnswers
            }
        });

        try {
            // Подготавливаем данные для отправки
            const adaptationData = {
                question_text: editingQuestionText,
                is_enabled: editingQuestionEnabled,
                region_scope: adaptationScope,
                answers: editingAnswers.map(answer => ({
                    id: answer.id,
                    text: answer.text,
                    enabled: answer.enabled
                }))
            };

            console.log('Отправка запроса на:', `http://localhost:8080/survey/${currentSurveyId}/question/${editingQuestion.id}/adaptation`);

            // Отправляем запрос на сохранение адаптации
            const response = await axios.post(
                `http://localhost:8080/survey/${currentSurveyId}/question/${editingQuestion.id}/adaptation`,
                adaptationData
            );

            console.log('Ответ сервера:', response.data);

            if (response.data.message === 'Адаптация вопроса успешно сохранена') {
                alert('Изменения сохранены!');
                // Отмечаем этап 2 как завершенный
                markStepAsCompleted(2);
                // Не закрываем модальное окно редактирования вопроса
                // closeQuestionEditModal();
                // Обновляем вопросы, чтобы отобразить изменения
                fetchAdaptationQuestions(selectedAdaptationQuestionnaire);
            }
        } catch (err) {
            console.error('Ошибка при сохранении адаптации вопроса:', err);
            console.error('Детали ошибки:', err.response?.data);
            alert('Ошибка при сохранении: ' + (err.response?.data?.error || err.message));
        }
    };

    // Загрузка связанных данных для опроса
    const fetchRelatedData = async (surveyId) => {
        setCurrentSurveyId(surveyId);
        await Promise.allSettled([fetchSamples(), fetchQuestionnaires(), fetchRoutes()]);
        setShowRelatedBlocks(true);
    };

    // Сохранение опроса (создание или обновление)
    const handleSaveSurvey = async (e) => {
        e.preventDefault();

        const surveyData = {
            name: surveyName,
            code: surveyCode,
            responsible: responsible,
            start_date: startDate ? new Date(startDate).toISOString() : null,
            end_date: endDate ? new Date(endDate).toISOString() : null,
            adaptation: adaptation,
            adaptation_date: adaptationDate ? new Date(adaptationDate).toISOString() : null,
            koir: koir,
            exit_poll: exitPoll,
            manual_input: manualInput,
            sample_id: selectedSample || '',
            questionnaire_id: selectedQuestionnaire || '',
            route_id: selectedRoute || '',
        };

        try {
            let response;
            if (editingSurveyId) {
                // Обновление существующего опроса
                response = await axios.put(`http://localhost:8080/survey/${editingSurveyId}`, surveyData);
                if (response.data.message === 'Опрос успешно обновлен') {
                    alert('Опрос успешно обновлен!');
                    // markStepAsCompleted(5);
                    fetchSurveys();
                }
            } else {
                // Создание нового опроса
                response = await axios.post('http://localhost:8080/survey', surveyData);
                if (response.data.message === 'Опрос успешно создан') {
                    alert('Опрос успешно создан!');
                    // markStepAsCompleted(1);
                    // markStepAsCompleted(5);
                    const surveyId = response.data.id;
                    if (surveyId) {
                        setEditingSurveyId(surveyId);
                        setCurrentSurveyId(surveyId);
                        await fetchRelatedData(surveyId);
                    }
                    fetchSurveys();
                }
            }
        } catch (err) {
            console.error('Ошибка при сохранении опроса:', err);
            alert('Ошибка: ' + (err.response?.data?.error || err.message));
        }
    };

    // Обработчики для выбора элементов
    const handleSampleChange = async (sampleId) => {
        setSelectedSample(sampleId);
        if (currentSurveyId) {
            try {
                await axios.patch(`http://localhost:8080/survey/${currentSurveyId}/sample`, { sample_id: sampleId });
            } catch (err) {
                console.error('Ошибка при сохранении выборки:', err);
            }
        }
    };

    const handleQuestionnaireChange = async (questionnaireId) => {
        setSelectedQuestionnaire(questionnaireId);
        if (currentSurveyId) {
            try {
                await axios.patch(`http://localhost:8080/survey/${currentSurveyId}/questionnaire`, { questionnaire_id: questionnaireId });
            } catch (err) {
                console.error('Ошибка при сохранении анкеты:', err);
            }
        }
    };

    const handleRouteChange = async (routeId) => {
        setSelectedRoute(routeId);
        if (currentSurveyId) {
            try {
                await axios.patch(`http://localhost:8080/survey/${currentSurveyId}/route`, { route_id: routeId });
            } catch (err) {
                console.error('Ошибка при сохранении маршрута:', err);
            }
        }
    };

    // Удаление опроса
    const deleteSurvey = async (surveyId) => {
        if (!confirm('Вы уверены, что хотите удалить этот опрос?')) return;
        try {
            await axios.delete(`http://localhost:8080/survey/${surveyId}`);
            fetchSurveys();
        } catch (err) {
            console.error('Ошибка при удалении опроса:', err);
        }
    };

    // Редактирование опроса по клику на название
    const editSurvey = async (survey) => {
        setEditingSurveyId(survey.id);
        setSurveyName(survey.name || '');
        setSurveyCode(survey.code || '');
        setResponsible(survey.responsible || '');
        setStartDate(survey.start_date ? new Date(survey.start_date).toISOString().split('T')[0] : '');
        setEndDate(survey.end_date ? new Date(survey.end_date).toISOString().split('T')[0] : '');
        setAdaptation(survey.adaptation || false);
        setAdaptationDate(survey.adaptation_date ? new Date(survey.adaptation_date).toISOString().split('T')[0] : '');
        setKoir(survey.koir || false);
        setExitPoll(survey.exit_poll || false);
        setManualInput(survey.manual_input || false);
        setSelectedSample(survey.sample_id || '');
        setSelectedQuestionnaire(survey.questionnaire_id || '');
        setSelectedRoute(survey.route_id || '');

        // Определяем завершённые этапы на основе данных из БД
        const newCompletedSteps = [];

        // Этап 1 завершён всегда, если опрос существует (у него есть id)
        if (survey.id) {
            newCompletedSteps.push(1);
        }

        // Этап 2 завершён, если есть хотя бы одна адаптация вопроса
        try {
            const adaptRes = await axios.get(`http://localhost:8080/survey/${survey.id}/adaptations`);
            if (adaptRes.data && adaptRes.data.length > 0) {
                newCompletedSteps.push(2);
            }
        } catch (err) {
            // Эндпоинт может отсутствовать или адаптаций нет — этап не завершён
            console.warn('Не удалось проверить адаптации (возможно, их нет)');
        }

        // Этап 3 завершён, если koir === true
        if (survey.koir === true) {
            newCompletedSteps.push(3);
        }

        // Этап 4 завершён, если указаны обе даты
        if (survey.start_date && survey.end_date) {
            newCompletedSteps.push(4);
        }

        // Этап 5 завершён, если статус не "черновик" ИЛИ заданы все связи (выборка, анкета, маршрут)
        const hasAllRelations = survey.sample_id && survey.questionnaire_id && survey.route_id;
        if (survey.status !== 'черновик' || hasAllRelations) {
            newCompletedSteps.push(5);
        }

        setCompletedSteps(newCompletedSteps);
        setCurrentStep(1);

        // Сбрасываем состояния изменений
        setStep1Changed(false);
        setStep3Changed(false);
        setStep4Changed(false);

        setIsWindowOpen(true);
        await fetchRelatedData(survey.id);
    };

    // Закрыть окно и сбросить форму
    const closeAndReset = () => {
        setIsWindowOpen(false);
        setEditingSurveyId(null);
        setCurrentStep(1);
        setCompletedSteps([]);
        // Keep completedSteps to persist colors
        setSurveyName('');
        setSurveyCode('');
        setResponsible('');
        setStartDate('');
        setEndDate('');
        setAdaptation(false);
        setAdaptationDate('');
        setKoir(false);
        setExitPoll(false);
        setManualInput(false);
        setShowRelatedBlocks(false);
        setCurrentSurveyId(null);
        setSamples([]);
        setQuestionnaires([]);
        setRoutes([]);
        setSelectedSample('');
        setSelectedQuestionnaire('');
        setSelectedRoute('');
        setIsSampleSelectModalOpen(false);
        setIsQuestionnaireSelectModalOpen(false);
        setIsRouteSelectModalOpen(false);
        // Сброс состояний адаптации
        setAdaptationQuestionnaires([]);
        setSelectedAdaptationQuestionnaire('');
        setAdaptationQuestions([]);
        setAdaptationPassportQuestions([]);
        setAdaptationAdditionalBlocks([]);
        setAdaptationScope('regions');
        setAdaptationCities([]);
        setAdaptationExpandedDistricts({});
        // Сброс состояний модального окна редактирования вопроса
        setIsQuestionEditModalOpen(false);
        setEditingQuestion(null);
        setEditingQuestionText('');
        setEditingQuestionEnabled(true);
        setEditingAnswers([]);
        // Сброс состояний изменений этапов
        setStep1Changed(false);
        setStep3Changed(false);
        setStep4Changed(false);
    };

    useEffect(() => {
        fetchSurveys();
    }, []);

    // Загрузка данных для адаптации при открытии окна
    useEffect(() => {
        if (isWindowOpen && currentStep === 2) {
            fetchAdaptationQuestionnaires();
        }
    }, [isWindowOpen, currentStep]);

    // Загрузка городов при переключении на города
    useEffect(() => {
        if (isWindowOpen && currentStep === 2 && adaptationScope === 'cities' && adaptationCities.length === 0 && !adaptationLoading) {
            fetchAdaptationCities();
        }
    }, [adaptationScope, isWindowOpen, currentStep]);

    // Сброс страницы при изменении списка опросов (например, после удаления/добавления)
    useEffect(() => {
        setCurrentPage(1);
    }, [surveys]);

    return (
        <>
            {isWindowOpen && (
                <>
                    <div className="modal-bg" onClick={closeAndReset}></div>
                    <div className="survey-window">
                        <nav className="window-map-navigation">
                            <div className="map-title">{editingSurveyId ? 'Редактирование опроса' : 'Создание опроса'}</div>
                            <div className="close-btn" onClick={closeAndReset}>
                                <svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </nav>

                        {/* Навигация по этапам (Stepper) */}
                        <div className="survey-stepper">
                            <div className="stepper-container">
                                {[
                                    { id: 1, title: 'Настройка опроса', subtitle: '' },
                                    { id: 2, title: 'Адаптация анкеты', subtitle: completedSteps.includes(2) ? '' : 'Этап пропущен' },
                                    { id: 3, title: 'Перенос в КОИР', subtitle: completedSteps.includes(3) ? '' : 'Этап пропущен' },
                                    { id: 4, title: 'Проведение опроса', subtitle: startDate && endDate ? `${startDate} - ${endDate}` : 'Не задано - Не задано' },
                                    { id: 5, title: 'Завершение опроса', subtitle: '' }
                                ].map((step, index) => (
                                    <div
                                        key={step.id}
                                        className={`stepper-item ${getStepStatus(step.id)}`}
                                        onClick={() => goToStep(step.id)}
                                    >
                                        <div className="stepper-line-container">
                                            {index > 0 && <div className="stepper-line"></div>}
                                            <div className={`stepper-circle ${getStepStatus(step.id)}`}>
                                                {completedSteps.includes(step.id) ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M5 13L9 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                ) : (
                                                    step.id
                                                )}
                                            </div>
                                            {index < 4 && <div className="stepper-line"></div>}
                                        </div>
                                        <div className="stepper-content">
                                            <div className="stepper-title">{step.title}</div>
                                            {step.subtitle && <div className="stepper-subtitle">{step.subtitle}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {currentStep < 5 && (
                                <button className="next-step-btn" onClick={handleSaveCurrentStep} type="button">
                                    Следующий этап
                                </button>
                            )}
                        </div>

                        <div className="survey-form">
                            <div className="step-contents" style={{ flex: 1, overflowY: 'auto' }}>

                                {/* Этап 1: Настройка опроса - показывает все поля */}
                                {currentStep === 1 && (
                                    <div className="step-content">
                                        <div className="survey-input">
                                            <label><span>*</span>Название опроса </label>
                                            <input
                                                type="text"
                                                value={surveyName}
                                                onChange={(e) => {
                                                    setSurveyName(e.target.value);
                                                    setStep1Changed(true);
                                                }}
                                                required
                                            />
                                        </div>
                                        <div className="survey-input">
                                            <label><span>*</span>Код опроса </label>
                                            <input
                                                type="text"
                                                value={surveyCode}
                                                onChange={(e) => {
                                                    setSurveyCode(e.target.value);
                                                    setStep1Changed(true);
                                                }}
                                                required
                                            />
                                        </div>

                                        <div className="survey-input">
                                            <label><span>*</span>Ответственный</label>
                                            <input
                                                type="text"
                                                value={responsible}
                                                onChange={(e) => {
                                                    setResponsible(e.target.value);
                                                    setStep1Changed(true);
                                                }}
                                                required
                                            />
                                        </div>


                                        <div className="survey-steps">
                                            <div className="survey-date">
                                                <label>Проведение опроса</label>
                                                <input
                                                    type="date"
                                                    className='survey-date-begin'
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                />
                                                -
                                                <input
                                                    type="date"
                                                    className='survey-date-finish'
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="survey-adapt">
                                                <label>Адаптация анкеты</label>
                                                <input
                                                    type="checkbox"
                                                    id="checkbox-switcher1"
                                                    className="options-switcher"
                                                    checked={adaptation}
                                                    onChange={(e) => setAdaptation(e.target.checked)}
                                                />
                                                <label htmlFor="checkbox-switcher1" className="options-switcher-label"></label>
                                                {adaptation && (
                                                    <input
                                                        type="date"
                                                        value={adaptationDate}
                                                        onChange={(e) => setAdaptationDate(e.target.value)}
                                                    />
                                                )}
                                            </div>
                                            <div className="survey-koir">
                                                <label>Перенос в КОИР</label>
                                                <input
                                                    type="checkbox"
                                                    id="checkbox-switcher2"
                                                    className="options-switcher"
                                                    checked={koir}
                                                    onChange={(e) => setKoir(e.target.checked)}
                                                />
                                                <label htmlFor="checkbox-switcher2" className="options-switcher-label"></label>
                                            </div>
                                        </div>

                                        <div className="survey-exitpoll">
                                            <label>Передача агрегированных данных (exit-poll)</label>
                                            <input
                                                type="checkbox"
                                                id="checkbox-switcher3"
                                                className="options-switcher"
                                                checked={exitPoll}
                                                onChange={(e) => setExitPoll(e.target.checked)}
                                            />
                                            <label htmlFor="checkbox-switcher3" className="options-switcher-label"></label>
                                        </div>

                                        <div className="survey-accept">
                                            <label>Разрешить ручной ввод</label>
                                            <input
                                                type="checkbox"
                                                id="checkbox-switcher4"
                                                className="options-switcher"
                                                checked={manualInput}
                                                onChange={(e) => setManualInput(e.target.checked)}
                                            />
                                            <label htmlFor="checkbox-switcher4" className="options-switcher-label"></label>
                                        </div>

                                        <div className="related-blocks-container">
                                            <div className="related-blocks">
                                                <div className="related-block-item">
                                                    <div className="block-header">
                                                        <p>Выборки</p>
                                                        {selectedSample && (
                                                            <div className="selected-item-info">
                                                                <p className="selected-item-name">
                                                                    {samples.find(s => s.id === selectedSample)?.name || 'Выборка'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="block-content">
                                                        <button
                                                            className="block-action-btn"
                                                            onClick={() => setIsSampleSelectModalOpen(true)}
                                                            type='button'
                                                        >
                                                            Добавить выборку
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="related-block-item">
                                                    <div className="block-header">
                                                        <p>Анкеты</p>
                                                        {selectedQuestionnaire && (
                                                            <div className="selected-item-info">
                                                                <p className="selected-item-name">
                                                                    {questionnaires.find(q => q.id === selectedQuestionnaire)?.name || 'Анкета'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="block-content">
                                                        <button
                                                            className="block-action-btn"
                                                            onClick={() => setIsQuestionnaireSelectModalOpen(true)}
                                                            type='button'
                                                        >
                                                            Добавить анкету
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="related-block-item">
                                                    <div className="block-header">
                                                        <p>Маршруты</p>
                                                        {selectedRoute && (
                                                            <div className="selected-item-info">
                                                                <p className="selected-item-name">
                                                                    {routes.find(r => r.id === selectedRoute)?.name || 'Маршрут'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="block-content">
                                                        <button
                                                            className="block-action-btn"
                                                            onClick={() => setIsRouteSelectModalOpen(true)}
                                                            type='button'
                                                        >
                                                            Добавить маршрут
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Этап 2: Адаптация анкеты */}
                                {currentStep === 2 && (
                                    <div className="step-content adaptation-step">
                                        <div className="adaptation-container">
                                            {/* Левая панель */}
                                            <div className="adaptation-left">
                                                {/* Выпадающий список анкет */}
                                                <div className="adaptation-questionnaire-select">
                                                    <select
                                                        value={selectedAdaptationQuestionnaire}
                                                        onChange={(e) => handleAdaptationQuestionnaireChange(e.target.value)}
                                                    >
                                                        <option value="" disabled>Выбрать анкету</option>
                                                        {adaptationQuestionnaires.map(q => (
                                                            <option key={q.id} value={q.id}>{q.name || 'Без названия'}</option>
                                                        ))}
                                                    </select>
                                                    <button className="refresh-btn" onClick={fetchAdaptationQuestionnaires} title="Обновить">
                                                        <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M19.841 3.24A10.988 10.988 0 0 0 8.54.573l1.266 3.8a7.033 7.033 0 0 1 8.809 9.158L17 11.891v7.092h7l-2.407-2.439A11.049 11.049 0 0 0 19.841 3.24zM1 10.942a11.05 11.05 0 0 0 11.013 11.044 11.114 11.114 0 0 0 3.521-.575l-1.266-3.8a7.035 7.035 0 0 1-8.788-9.22L7 9.891V6.034c.021-.02.038-.044.06-.065L7 5.909V2.982H0l2.482 2.449A10.951 10.951 0 0 0 1 10.942z" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                {/* Переключатель Регионы/Города */}
                                                <div className="adaptation-scope-toggle">
                                                    <button
                                                        type="button"
                                                        className={adaptationScope === 'regions' ? 'activ' : ''}
                                                        onClick={() => setAdaptationScope('regions')}
                                                    >
                                                        Регионов
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={adaptationScope === 'cities' ? 'activ' : ''}
                                                        onClick={() => setAdaptationScope('cities')}
                                                    >
                                                        Городов
                                                    </button>
                                                </div>

                                                {/* Список ФО/регионов */}
                                                <div className="adaptation-region-list">
                                                    {adaptationScope === 'regions' ? (
                                                        <>
                                                            <div className="region-element">
                                                                <input type="checkbox" id="fo-northcaucasus" />
                                                                <label htmlFor="fo-northcaucasus">СЕВЕРО-КАВКАЗСКИЙ</label>
                                                            </div>
                                                            <div className="region-element">
                                                                <input type="checkbox" id="fo-central" />
                                                                <label htmlFor="fo-central">ЦЕНТРАЛЬНЫЙ</label>
                                                            </div>
                                                            <div className="region-element">
                                                                <input type="checkbox" id="fo-siberian" />
                                                                <label htmlFor="fo-siberian">СИБИРСКИЙ</label>
                                                            </div>
                                                            <div className="region-element">
                                                                <input type="checkbox" id="fo-northwest" />
                                                                <label htmlFor="fo-northwest">СЕВЕРО-ЗАПАДНЫЙ</label>
                                                            </div>
                                                            <div className="region-element">
                                                                <input type="checkbox" id="fo-ural" />
                                                                <label htmlFor="fo-ural">УРАЛЬСКИЙ</label>
                                                            </div>
                                                            <div className="region-element">
                                                                <input type="checkbox" id="fo-south" />
                                                                <label htmlFor="fo-south">ЮЖНЫЙ</label>
                                                            </div>
                                                            <div className="region-element">
                                                                <input type="checkbox" id="fo-fareast" />
                                                                <label htmlFor="fo-fareast">ДАЛЬНЕВОСТОЧНЫЙ</label>
                                                            </div>
                                                            <div className="region-element">
                                                                <input type="checkbox" id="fo-volga" />
                                                                <label htmlFor="fo-volga">ПРИВОЛЖСКИЙ</label>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="adaptation-cities-container">
                                                            {adaptationLoading && <p className="loading-text">Загрузка городов...</p>}
                                                            {!adaptationLoading && adaptationCities && Object.keys(adaptationCities).map(district => {
                                                                const citiesList = Object.values(adaptationCities[district]).flat();
                                                                const isExpanded = adaptationExpandedDistricts[district];

                                                                return (
                                                                    <div key={district} className="adaptation-district">
                                                                        <div className="adaptation-district-header">
                                                                            <span className="adaptation-expand-icon" onClick={() => toggleAdaptationDistrict(district)}>
                                                                                {isExpanded ? (
                                                                                    <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                        <path fillRule="evenodd" clipRule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="#000000" />
                                                                                    </svg>
                                                                                ) : (
                                                                                    <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                        <path fillRule="evenodd" clipRule="evenodd" d="M8.29289 4.29289C8.68342 3.90237 9.31658 3.90237 9.70711 4.29289L16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L9.70711 19.7071C9.31658 20.0976 8.68342 20.0976 8.29289 19.7071C7.90237 19.3166 7.90237 18.6834 8.29289 18.2929L14.5858 12L8.29289 5.70711C7.90237 5.31658 7.90237 4.68342 8.29289 4.29289Z" fill="#000000" />
                                                                                    </svg>
                                                                                )}
                                                                            </span>
                                                                            <input type="checkbox" id={`district-${district}`} />
                                                                            <label htmlFor={`district-${district}`} className="adaptation-district-name">{district}</label>
                                                                        </div>
                                                                        {isExpanded && (
                                                                            <div className="adaptation-cities-list">
                                                                                {citiesList.map(city => (
                                                                                    <div key={city} className="adaptation-city-item">
                                                                                        <input type="checkbox" id={`city-${district}-${city}`} />
                                                                                        <label htmlFor={`city-${district}-${city}`}>{city}</label>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Правая панель - вопросы и ответы */}
                                            <div className="adaptation-right">
                                                {selectedAdaptationQuestionnaire ? (
                                                    <div className="adaptation-questions">
                                                        {/* Основной блок */}
                                                        {adaptationQuestions.length > 0 && (
                                                            <div className="adaptation-block-section">
                                                                <h5 className="adaptation-block-title">Основной блок</h5>
                                                                <div className="adaptation-questions-list">
                                                                    {adaptationQuestions.map((question, index) => (
                                                                        <div key={question.id} className="adaptation-question-card">
                                                                            <div className="adaptation-question-header">
                                                                                <span className="adaptation-question-number">{String(index + 1).padStart(3, '0')}</span>
                                                                                <span className="adaptation-question-text">{question.text}</span>
                                                                                <button className="adaptation-edit-btn" title="Редактировать" onClick={() => openQuestionEditModal(question)} type="button">
                                                                                    <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                        <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                            {question.answers && question.answers.length > 0 && (
                                                                                <div className="adaptation-answers-list">
                                                                                    {question.answers.map((answer, ansIndex) => (
                                                                                        <div key={answer.id || ansIndex} className="adaptation-answer-item">
                                                                                            <span className="adaptation-answer-number">{String(index * 100 + ansIndex + 1).padStart(3, '0')}</span>
                                                                                            <span className="adaptation-answer-text">{typeof answer === 'string' ? answer : (answer.text || answer.type || '')}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Паспортичка */}
                                                        {adaptationPassportQuestions.length > 0 && (
                                                            <div className="adaptation-block-section">
                                                                <h5 className="adaptation-block-title">Вопросы о респонденте (паспортичка)</h5>
                                                                <div className="adaptation-questions-list">
                                                                    {adaptationPassportQuestions.map((question, index) => (
                                                                        <div key={question.id} className="adaptation-question-card">
                                                                            <div className="adaptation-question-header">
                                                                                <span className="adaptation-question-number">{String(index + 1).padStart(3, '0')}</span>
                                                                                <span className="adaptation-question-text">{question.text}</span>
                                                                                <button className="adaptation-edit-btn" title="Редактировать" onClick={() => openQuestionEditModal(question)} type="button">
                                                                                    <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                        <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                            {question.answers && question.answers.length > 0 && (
                                                                                <div className="adaptation-answers-list">
                                                                                    {question.answers.map((answer, ansIndex) => (
                                                                                        <div key={answer.id || ansIndex} className="adaptation-answer-item">
                                                                                            <span className="adaptation-answer-number">{String((adaptationQuestions.length + index) * 100 + ansIndex + 1).padStart(3, '0')}</span>
                                                                                            <span className="adaptation-answer-text">{typeof answer === 'string' ? answer : (answer.text || answer.type || '')}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Дополнительные блоки */}
                                                        {adaptationAdditionalBlocks.map((block, blockIndex) => (
                                                            <div key={block.id} className="adaptation-block-section">
                                                                <h5 className="adaptation-block-title">{block.name}</h5>
                                                                <div className="adaptation-questions-list">
                                                                    {block.questions.map((question, qIndex) => (
                                                                        <div key={question.id} className="adaptation-question-card">
                                                                            <div className="adaptation-question-header">
                                                                                <span className="adaptation-question-number">{String(qIndex + 1).padStart(3, '0')}</span>
                                                                                <span className="adaptation-question-text">{question.text}</span>
                                                                                <button className="adaptation-edit-btn" title="Редактировать" onClick={() => openQuestionEditModal(question)} type="button">
                                                                                    <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                        <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                            {question.answers && question.answers.length > 0 && (
                                                                                <div className="adaptation-answers-list">
                                                                                    {question.answers.map((answer, ansIndex) => (
                                                                                        <div key={answer.id || ansIndex} className="adaptation-answer-item">
                                                                                            <span className="adaptation-answer-number">{String(ansIndex + 1).padStart(3, '0')}</span>
                                                                                            <span className="adaptation-answer-text">{typeof answer === 'string' ? answer : (answer.text || answer.type || '')}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Если нет вопросов */}
                                                        {adaptationQuestions.length === 0 && adaptationPassportQuestions.length === 0 && adaptationAdditionalBlocks.length === 0 && (
                                                            <div className="adaptation-no-questions">
                                                                <p>В выбранной анкете нет вопросов</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="adaptation-no-selection">
                                                        <p>Выберите анкету для просмотра вопросов</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Этап 3: Перенос в КОИР */}
                                {currentStep === 3 && (
                                    <div className="step-content">
                                        <div className="survey-steps">
                                            <div className="survey-koir">
                                                <label>Перенос в КОИР</label>
                                                <input
                                                    type="checkbox"
                                                    id="checkbox-switcher2-step3"
                                                    className="options-switcher"
                                                    checked={koir}
                                                    onChange={(e) => {
                                                        setKoir(e.target.checked);
                                                        setStep3Changed(true);
                                                    }}
                                                />
                                                <label htmlFor="checkbox-switcher2-step3" className="options-switcher-label"></label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Этап 4: Проведение опроса */}
                                {currentStep === 4 && (
                                    <div className="step-content">
                                        <div className="survey-steps">
                                            <div className="survey-date">
                                                <label>Проведение опроса</label>
                                                <input
                                                    type="date"
                                                    className='survey-date-begin'
                                                    value={startDate}
                                                    onChange={(e) => {
                                                        setStartDate(e.target.value);
                                                        setStep4Changed(true);
                                                    }}
                                                />
                                                -
                                                <input
                                                    type="date"
                                                    className='survey-date-finish'
                                                    value={endDate}
                                                    onChange={(e) => {
                                                        setEndDate(e.target.value);
                                                        setStep4Changed(true);
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="survey-exitpoll">
                                            <label>Передача агрегированных данных (exit-poll)</label>
                                            <input
                                                type="checkbox"
                                                id="checkbox-switcher3-step4"
                                                className="options-switcher"
                                                checked={exitPoll}
                                                onChange={(e) => {
                                                    setExitPoll(e.target.checked);
                                                    setStep4Changed(true);
                                                }}
                                            />
                                            <label htmlFor="checkbox-switcher3-step4" className="options-switcher-label"></label>
                                        </div>

                                        <div className="survey-accept">
                                            <label>Разрешить ручной ввод</label>
                                            <input
                                                type="checkbox"
                                                id="checkbox-switcher4-step4"
                                                className="options-switcher"
                                                checked={manualInput}
                                                onChange={(e) => {
                                                    setManualInput(e.target.checked);
                                                    setStep4Changed(true);
                                                }}
                                            />
                                            <label htmlFor="checkbox-switcher4-step4" className="options-switcher-label"></label>
                                        </div>
                                        <button className="stage-save-btn" onClick={handleSaveCurrentStep} type="button">
                                            Сохранить этап и продолжить
                                        </button>
                                    </div>
                                )}

                                {/* Этап 5: Завершение опроса (Выборки, Анкеты, Маршруты) */}
                                {currentStep === 5 && (
                                    <div className="step-content">
                                        <div className="related-blocks-container">
                                            <div className="related-blocks">
                                                <div className="related-block-item">
                                                    <div className="block-header">
                                                        <p>Выборки</p>
                                                        {selectedSample && (
                                                            <div className="selected-item-info">
                                                                <p className="selected-item-name">
                                                                    {samples.find(s => s.id === selectedSample)?.name || 'Выборка'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="block-content">
                                                        <button
                                                            className="block-action-btn"
                                                            onClick={() => setIsSampleSelectModalOpen(true)}
                                                            type='button'
                                                        >
                                                            Добавить выборку
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="related-block-item">
                                                    <div className="block-header">
                                                        <p>Анкеты</p>
                                                        {selectedQuestionnaire && (
                                                            <div className="selected-item-info">
                                                                <p className="selected-item-name">
                                                                    {questionnaires.find(q => q.id === selectedQuestionnaire)?.name || 'Анкета'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="block-content">
                                                        <button
                                                            className="block-action-btn"
                                                            onClick={() => setIsQuestionnaireSelectModalOpen(true)}
                                                            type='button'
                                                        >
                                                            Добавить анкету
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="related-block-item">
                                                    <div className="block-header">
                                                        <p>Маршруты</p>
                                                        {selectedRoute && (
                                                            <div className="selected-item-info">
                                                                <p className="selected-item-name">
                                                                    {routes.find(r => r.id === selectedRoute)?.name || 'Маршрут'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="block-content">
                                                        <button
                                                            className="block-action-btn"
                                                            onClick={() => setIsRouteSelectModalOpen(true)}
                                                            type='button'
                                                        >
                                                            Добавить маршрут
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                            <div className="survey-footer">
                                <button className="save-btn-survey" type="button" onClick={handleSaveCurrentStep}>
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Модальное окно выбора выборки */}
            {isSampleSelectModalOpen && (
                <>
                    <div className="modal-bg" onClick={() => setIsSampleSelectModalOpen(false)}></div>
                    <div className="select-modal-window">
                        <div className="modal-header">
                            <h4>Выбрать выборку</h4>
                            <div className="close-btn" onClick={() => setIsSampleSelectModalOpen(false)}>
                                <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="select-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Название</th>
                                            <th>Тип</th>
                                            <th>Кол-во респондентов</th>
                                            <th>Дата обновления</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {samples.length > 0 ? (
                                            samples.map(sample => (
                                                <tr
                                                    key={sample.id}
                                                    className={selectedSample === sample.id ? 'selected' : ''}
                                                    onClick={() => handleSampleChange(sample.id)}
                                                >
                                                    <td>{sample.name || 'Без названия'}</td>
                                                    <td>{sample.sample_type || '-'}</td>
                                                    <td>{sample.respondents_count || 0}</td>
                                                    <td>
                                                        {sample.updated_at
                                                            ? new Date(sample.updated_at).toLocaleDateString('ru-RU')
                                                            : '-'
                                                        }
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="radio"
                                                            name="sample-select"
                                                            checked={selectedSample === sample.id}
                                                            onChange={() => handleSampleChange(sample.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                                    Нет доступных выборок
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setIsSampleSelectModalOpen(false)}>
                                Отмена
                            </button>
                            <button className="save-btn" type="button" onClick={() => setIsSampleSelectModalOpen(false)}>
                                Выбрать
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Модальное окно выбора анкеты */}
            {isQuestionnaireSelectModalOpen && (
                <>
                    <div className="modal-bg" onClick={() => setIsQuestionnaireSelectModalOpen(false)}></div>
                    <div className="select-modal-window">
                        <div className="modal-header">
                            <h4>Выбрать анкету</h4>
                            <div className="close-btn" onClick={() => setIsQuestionnaireSelectModalOpen(false)}>
                                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="select-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Название</th>
                                            <th>Код</th>
                                            <th>Область</th>
                                            <th>Статус</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {questionnaires.length > 0 ? (
                                            questionnaires.map(q => (
                                                <tr
                                                    key={q.id}
                                                    className={selectedQuestionnaire === q.id ? 'selected' : ''}
                                                    onClick={() => handleQuestionnaireChange(q.id)}
                                                >
                                                    <td>{q.name || 'Без названия'}</td>
                                                    <td>{q.code || '-'}</td>
                                                    <td>{q.scope === 'regions' ? 'Регионы' : q.scope === 'cities' ? 'Города' : q.scope || '-'}</td>
                                                    <td>{q.status || 'черновик'}</td>
                                                    <td>
                                                        <input
                                                            type="radio"
                                                            name="questionnaire-select"
                                                            checked={selectedQuestionnaire === q.id}
                                                            onChange={() => handleQuestionnaireChange(q.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                                    Нет доступных анкет
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setIsQuestionnaireSelectModalOpen(false)}>
                                Отмена
                            </button>
                            <button className="save-btn" type="button" onClick={() => setIsQuestionnaireSelectModalOpen(false)}>
                                Выбрать
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Модальное окно выбора маршрута */}
            {isRouteSelectModalOpen && (
                <>
                    <div className="modal-bg" onClick={() => setIsRouteSelectModalOpen(false)}></div>
                    <div className="select-modal-window">
                        <div className="modal-header">
                            <h4>Выбрать маршрут</h4>
                            <div className="close-btn" onClick={() => setIsRouteSelectModalOpen(false)}>
                                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="select-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Название</th>
                                            <th>Описание</th>
                                            <th>Кол-во городов</th>
                                            <th>Статус</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {routes.length > 0 ? (
                                            routes.map(route => (
                                                <tr
                                                    key={route.id}
                                                    className={selectedRoute === route.id ? 'selected' : ''}
                                                    onClick={() => handleRouteChange(route.id)}
                                                >
                                                    <td>{route.name || 'Без названия'}</td>
                                                    <td>{route.description || '-'}</td>
                                                    <td>{route.cities_count || 0}</td>
                                                    <td>{route.status || 'черновик'}</td>
                                                    <td>
                                                        <input
                                                            type="radio"
                                                            name="route-select"
                                                            checked={selectedRoute === route.id}
                                                            onChange={() => handleRouteChange(route.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                                    Нет доступных маршрутов
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setIsRouteSelectModalOpen(false)}>
                                Отмена
                            </button>
                            <button className="save-btn" type="button" onClick={() => setIsRouteSelectModalOpen(false)}>
                                Выбрать
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Модальное окно редактирования вопроса */}
            {isQuestionEditModalOpen && editingQuestion && (
                <>
                    <div className="modal-bg" onClick={closeQuestionEditModal}></div>
                    <div className="question-edit-modal">
                        <div className="question-edit-header">
                            <h4>Адаптация вопроса для региона</h4>
                            <div className="close-btn" onClick={closeQuestionEditModal}>
                                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        <div className="question-edit-body">
                            {/* Ссылка "Скрыть" */}
                            <div className="question-edit-toggle">
                                <button type="button" className="toggle-link">
                                    Скрыть
                                </button>
                            </div>

                            {/* Поле вопроса */}
                            <div className="question-edit-field">
                                <input
                                    type="text"
                                    value={editingQuestionText}
                                    onChange={(e) => setEditingQuestionText(e.target.value)}
                                    placeholder="Текст вопроса"
                                />
                                <div className="question-edit-switcher">
                                    <input
                                        type="checkbox"
                                        id="question-enabled-switcher"
                                        className="options-switcher"
                                        checked={editingQuestionEnabled}
                                        onChange={(e) => setEditingQuestionEnabled(e.target.checked)}
                                    />
                                    <label htmlFor="question-enabled-switcher" className="options-switcher-label"></label>
                                </div>
                            </div>

                            {/* Список ответов */}
                            <div className="answers-edit-list">
                                {editingAnswers.map((answer, index) => (
                                    <div key={answer.id} className="answer-edit-item">
                                        <span className="answer-edit-number">{answer.number}</span>
                                        <input
                                            type="text"
                                            value={answer.text}
                                            onChange={(e) => handleAnswerTextChange(index, e.target.value)}
                                            placeholder={`Ответ ${index + 1}`}
                                        />
                                        <div className="answer-edit-switcher">
                                            <input
                                                type="checkbox"
                                                id={`answer-switcher-${index}`}
                                                className="options-switcher"
                                                checked={answer.enabled}
                                                onChange={() => toggleAnswerEnabled(index)}
                                            />
                                            <label htmlFor={`answer-switcher-${index}`} className="options-switcher-label"></label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="question-edit-footer">
                            <button className="cancel-btn" onClick={closeQuestionEditModal} type="button">
                                Отменить
                            </button>
                            <button className="save-btn" onClick={handleSaveQuestionEdit} type="button">
                                Сохранить
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div className="buttons">
                <button
                    className="create-btn"
                    onClick={() => {
                        closeAndReset();
                        setIsWindowOpen(true);
                    }}
                >
                    Создать опрос
                </button>
                <button className="update-btn" onClick={fetchSurveys}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21.986">
                        <path d="M19.841 3.24A10.988 10.988 0 0 0 8.54.573l1.266 3.8a7.033 7.033 0 0 1 8.809 9.158L17 11.891v7.092h7l-2.407-2.439A11.049 11.049 0 0 0 19.841 3.24zM1 10.942a11.05 11.05 0 0 0 11.013 11.044 11.114 11.114 0 0 0 3.521-.575l-1.266-3.8a7.035 7.035 0 0 1-8.788-9.22L7 9.891V6.034c.021-.02.038-.044.06-.065L7 5.909V2.982H0l2.482 2.449A10.951 10.951 0 0 0 1 10.942z" />
                    </svg>
                </button>
            </div>

            {/* Единая таблица с пагинацией */}
            <div className="survey-table">
                <table>
                    <thead>
                        <tr>
                            <th>Название опроса</th>
                            <th>Код опроса</th>
                            <th>Статус</th>
                            <th>Дата начала</th>
                            <th>Дата завершения</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentSurveys.length > 0 ? (
                            currentSurveys.map((survey) => (
                                <tr key={survey.id}>
                                    <td
                                        className="survey-name-link"
                                        title='Изменить'
                                        onClick={() => editSurvey(survey)}
                                    >
                                        {survey.name || 'Без названия'}
                                    </td>
                                    <td>{survey.code || '-'}</td>
                                    <td>{survey.status || 'черновик'}</td>
                                    <td>
                                        {survey.start_date
                                            ? (() => {
                                                try {
                                                    return new Date(survey.start_date).toLocaleDateString();
                                                } catch (e) {
                                                    return '-';
                                                }
                                            })()
                                            : '-'
                                        }
                                    </td>
                                    <td>
                                        {survey.end_date
                                            ? (() => {
                                                try {
                                                    return new Date(survey.end_date).toLocaleDateString();
                                                } catch (e) {
                                                    return '-';
                                                }
                                            })()
                                            : '-'
                                        }
                                    </td>
                                    <td className='td-delete' title='Удалить'>
                                        <button
                                            className="delete-survey-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSurvey(survey.id);
                                            }}
                                        >
                                            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none">
                                                <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="#d32f2f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3vh', color: '#999' }}>
                                    Нет созданных опросов
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {surveys.length > itemsPerPage && (
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
    )
}
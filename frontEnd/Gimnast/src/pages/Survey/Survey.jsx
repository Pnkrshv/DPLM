import './survey.css'
import React, { useState, useEffect, useRef } from 'react';
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

    // Состояния для экспортов (этап 3)
    const [exports, setExports] = useState([]);
    const [exportsLoading, setExportsLoading] = useState(false);

    // Этап 4
    const [selectedConductQuestionnaire, setSelectedConductQuestionnaire] = useState('');
    const [conductData, setConductData] = useState([]);
    // Этап 4 – вкладки
    const [activeConductTab, setActiveConductTab] = useState('readiness'); // 'readiness', 'tasks', 'results'
    const [conductTableData, setConductTableData] = useState([]);
    const [expandedDistrictsConduct, setExpandedDistrictsConduct] = useState({});
    const [routeCities, setRouteCities] = useState([]);

    // Модальное окно выполнения жёстких квот выборки (по клику на гистограмму)
    const [isQuotaDetailModalOpen, setIsQuotaDetailModalOpen] = useState(false);

    // Модальное окно карты готовности опроса
    const [isReadinessMapModalOpen, setIsReadinessMapModalOpen] = useState(false);
    const mapSvgRef = useRef(null);
    const [mapTooltip, setMapTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
    const mapContainerRef = useRef(null);

    // Назначение случайных цветов регионам карты (бледно-розовый → тёмно-красный)
    // и добавление всплывающих подсказок при наведении
    useEffect(() => {
        if (isReadinessMapModalOpen && mapSvgRef.current && mapContainerRef.current) {
            const timer = setTimeout(() => {
                const svg = mapSvgRef.current;
                const container = mapContainerRef.current;
                if (!svg || !container) return;

                const paths = svg.querySelectorAll('path[id]');

                // Назначаем цвета при каждом открытии карты (больше не используем colorsAssigned)
                paths.forEach(path => {
                    const g = Math.floor(70 + Math.random() * 130);
                    const b = Math.floor(70 + Math.random() * 130);
                    path.setAttribute('fill', `rgb(255, ${g}, ${b})`);
                });

                const handleMouseEnter = (e) => {
                    const rect = container.getBoundingClientRect();
                    const x = e.clientX - rect.left + 2;
                    const y = e.clientY - rect.top - 2;
                    const path = e.currentTarget;
                    const titleEl = path.querySelector('title');
                    const name = (titleEl ? titleEl.textContent : (path.getAttribute('title') || '')).trim();
                    if (name) {
                        setMapTooltip({ show: true, text: name, x, y });
                    }
                };
                const handleMouseMove = (e) => {
                    const tooltip = container.querySelector('.map-tooltip');
                    if (tooltip) {
                        const rect = container.getBoundingClientRect();
                        const x = e.clientX - rect.left + 2;
                        const y = e.clientY - rect.top - 2;
                        tooltip.style.left = x + 'px';
                        tooltip.style.top = y + 'px';
                    }
                };
                const handleMouseLeave = () => {
                    setMapTooltip({ show: false, text: '', x: 0, y: 0 });
                };

                paths.forEach(path => {
                    path.addEventListener('mouseenter', handleMouseEnter);
                    path.addEventListener('mousemove', handleMouseMove);
                    path.addEventListener('mouseleave', handleMouseLeave);
                });

                svg._cleanup = () => {
                    paths.forEach(path => {
                        path.removeEventListener('mouseenter', handleMouseEnter);
                        path.removeEventListener('mousemove', handleMouseMove);
                        path.removeEventListener('mouseleave', handleMouseLeave);
                    });
                };
            }, 50);

            return () => {
                clearTimeout(timer);
                if (mapSvgRef.current && mapSvgRef.current._cleanup) {
                    mapSvgRef.current._cleanup();
                }
            };
        }
    }, [isReadinessMapModalOpen]);

    // Загрузка опросов из БД
    const fetchSurveys = async () => {
        try {
            const response = await axios.get('/api/surveys');
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
        // На 4 этап можно перейти с любого этапа
        // На остальные — только если это текущий, пройденный или следующий после пройденного
        if (step === 4 || step <= currentStep || completedSteps.includes(step - 1) || step === currentStep + 1) {
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

        // Этап 3 (Перенос в КОИР): проверяем, есть ли экспорт опроса.
        // Если экспорт есть — этап считается пройденным (зелёный).
        // Если экспорта нет — этап помечается пропущенным.
        if (currentStep === 3) {
            if (exports.length > 0) {
                markStepAsCompleted(3);
            } else {
                // Убираем этап из пройденных, чтобы он отображался как пропущенный
                setCompletedSteps(prev => prev.filter(s => s !== 3));
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
                response = await axios.post('/api/survey', data);
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
                response = await axios.put(`/api/survey/${surveyId}`, data);
                if (response.data.message === 'Опрос успешно обновлен') {
                    if (currentStep === 1) {
                        markStepAsCompleted(1);
                        setStep1Changed(false);
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
            const response = await axios.get('/api/samples');
            setSamples(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Ошибка при загрузке выборок:', err);
            setSamples([]);
        }
    };

    // Загрузка анкет
    const fetchQuestionnaires = async () => {
        try {
            const response = await axios.get('/api/questionnaires');
            setQuestionnaires(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.warn('Анкеты не загружены (endpoint недоступен):', err.message);
            setQuestionnaires([]);
        }
    };

    // Загрузка маршрутов
    const fetchRoutes = async () => {
        try {
            const response = await axios.get('/api/routes');
            setRoutes(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Ошибка при загрузке маршрутов:', err);
            setRoutes([]);
        }
    };

    // Загрузка анкет для адаптации
    const fetchAdaptationQuestionnaires = async () => {
        try {
            const response = await axios.get('/api/questionnaires');
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
            const response = await axios.get('/api/cities');
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
            const response = await axios.get(`/api/questionnaire/${questionnaireId}/questions`);
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
                    `/api/survey/${currentSurveyId}/question/${question.id}/adaptations`
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

            console.log('Отправка запроса на:', `/api/survey/${currentSurveyId}/question/${editingQuestion.id}/adaptation`);

            // Отправляем запрос на сохранение адаптации
            const response = await axios.post(
                `/api/survey/${currentSurveyId}/question/${editingQuestion.id}/adaptation`,
                adaptationData
            );

            console.log('Ответ сервера:', response.data);

            if (response.data.message === 'Адаптация вопроса успешно сохранена') {
                alert('Изменения сохранены!');
                markStepAsCompleted(2);
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
                response = await axios.put(`/api/survey/${editingSurveyId}`, surveyData);
                if (response.data.message === 'Опрос успешно обновлен') {
                    alert('Опрос успешно обновлен!');
                    // markStepAsCompleted(5);
                    fetchSurveys();
                }
            } else {
                // Создание нового опроса
                response = await axios.post('/api/survey', surveyData);
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
                await axios.patch(`/api/survey/${currentSurveyId}/sample`, { sample_id: sampleId });
            } catch (err) {
                console.error('Ошибка при сохранении выборки:', err);
            }
        }
    };

    const handleQuestionnaireChange = async (questionnaireId) => {
        setSelectedQuestionnaire(questionnaireId);
        if (currentSurveyId) {
            try {
                await axios.patch(`/api/survey/${currentSurveyId}/questionnaire`, { questionnaire_id: questionnaireId });
            } catch (err) {
                console.error('Ошибка при сохранении анкеты:', err);
            }
        }
    };

    const handleRouteChange = async (routeId) => {
        setSelectedRoute(routeId);
        if (currentSurveyId) {
            try {
                await axios.patch(`/api/survey/${currentSurveyId}/route`, { route_id: routeId });
            } catch (err) {
                console.error('Ошибка при сохранении маршрута:', err);
            }
        }
    };

    // Удаление опроса
    const deleteSurvey = async (surveyId) => {
        if (!confirm('Вы уверены, что хотите удалить этот опрос?')) return;
        try {
            await axios.delete(`/api/survey/${surveyId}`);
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
            const adaptRes = await axios.get(`/api/survey/${survey.id}/adaptations`);
            if (adaptRes.data && adaptRes.data.length > 0) {
                newCompletedSteps.push(2);
            }
        } catch (err) {
            // Эндпоинт может отсутствовать или адаптаций нет — этап не завершён
            console.warn('Не удалось проверить адаптации (возможно, их нет)');
        }

        // Этап 3 завершён, если koir === true
        try {
            const exportsRes = await axios.get(`/api/exports`);
            const allExports = exportsRes.data || [];
            const hasExport = allExports.some(exp => exp.survey_id === survey.id);
            if (hasExport) {
                newCompletedSteps.push(3);
            }
        } catch (err) {
            console.warn('Не удалось проверить экспорты');
        }

        // Этап 4 – проверяем даты
        if (survey.start_date && survey.end_date) {
            newCompletedSteps.push(4);
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
        fetchExports();
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
        };
        if (isWindowOpen && currentStep === 3 && currentSurveyId) {
            fetchExports();
        }
    }, [isWindowOpen, currentStep, currentSurveyId]);

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

    // Загрузка списка экспортов для текущего опроса
    const fetchExports = async () => {
        setExportsLoading(true);
        try {
            const response = await axios.get(`/api/exports`); // ← изменён URL
            setExports(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Ошибка при загрузке экспортов:', err);
            setExports([]);
        } finally {
            setExportsLoading(false);
        }
    };

    // Создание нового экспорта (кнопка "Экспорт")
    const handleCreateExport = async () => {
        if (!currentSurveyId) {
            alert('Сначала сохраните опрос');
            return;
        }
        try {
            const response = await axios.post(`/api/survey/${currentSurveyId}/export`);
            const newExport = response.data;
            setExports(prev => [newExport, ...prev]);
            if (!completedSteps.includes(3)) {
                markStepAsCompleted(3);
                setStep3Changed(true);
            }
        } catch (err) {
            console.error('Ошибка при создании экспорта:', err);
            if (err.response?.status === 409) {
                alert('Этот опрос уже был экспортирован');
            } else {
                alert('Ошибка: ' + (err.response?.data?.error || err.message));
            }
        }
    };

    // Отмена экспорта (кнопка "Отменить экспорт")
    const handleCancelExport = async () => {
        if (!currentSurveyId) {
            alert('Сначала сохраните опрос');
            return;
        }

        if (!exports || exports.length === 0) {
            alert('Нет экспортов для отмены');
            return;
        }

        if (!confirm('Вы уверены, что хотите отменить экспорт?')) return;

        try {
            const lastExportId = exports[0].id;
            const response = await axios.delete(`/api/survey/${currentSurveyId}/export/${lastExportId}`);
            if (response.data.message === 'Экспорт успешно отменен' || response.status === 200) {
                // Обновляем список экспортов (удаляем отмененный)
                setExports(prev => prev.filter(exp => exp.id !== lastExportId));
                // При отмене экспорта этап 3 становится пропущенным (серый + надпись)
                setCompletedSteps(prev => prev.filter(s => s !== 3));
                setStep3Changed(false);
                alert('Экспорт отменен');
                fetchExports();
            }
        } catch (err) {
            console.error('Ошибка при отмене экспорта:', err);
            alert('Ошибка: ' + (err.response?.data?.error || err.message));
        }
    };

    useEffect(() => {
        if (isWindowOpen && currentStep === 3) {
            fetchExports();
        }
    }, [isWindowOpen, currentStep]);

    // Синхронизация этапа 3 с наличием экспортов: если экспорт есть — этап выполнен, нет — пропущен
    useEffect(() => {
        if (!isWindowOpen || !currentSurveyId) return;
        if (exports.length > 0) {
            setCompletedSteps(prev => prev.includes(3) ? prev : [...prev, 3]);
        } else {
            setCompletedSteps(prev => prev.filter(s => s !== 3));
        }
    }, [exports, isWindowOpen, currentSurveyId]);

    const fetchConductData = async () => {
        // В будущем здесь будет запрос к API
        console.log('Обновление данных проведения опроса...');
        // setConductData(...);
    };

    useEffect(() => {
        if (isWindowOpen && currentStep === 4) {
            setSelectedConductQuestionnaire(selectedQuestionnaire || '');
            if (selectedRoute) {
                loadRouteDataForConduct();
            } else {
                setConductTableData([]);
            }
        }
    }, [isWindowOpen, currentStep, selectedRoute, selectedQuestionnaire]);


    // Генерация случайного прогресса квот в формате "X% Y%"
    const generateRandomQuotaProgress = () => {
        const low = Math.floor(Math.random() * 30) + 1;   // 1-30%
        const high = Math.floor(Math.random() * 41) + 60; // 60-100%
        return { low, high };
    };

    // Генерация случайного времени в формате "мм:сс"
    const generateRandomTime = () => {
        const minutes = Math.floor(Math.random() * 60);
        const seconds = Math.floor(Math.random() * 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Загрузка данных маршрута и формирование таблицы
    const loadRouteDataForConduct = async () => {
        if (!selectedRoute) {
            setRouteCities([]);
            setConductTableData([]);
            return;
        }
        try {
            const response = await axios.get(`/api/route/${selectedRoute}`);
            const route = response.data;
            let cities = [];
            try {
                cities = JSON.parse(route.cities_data);
            } catch (e) {
                console.error('Ошибка парсинга cities_data', e);
            }
            setRouteCities(cities);

            // Группируем по федеральным округам
            const grouped = {};
            cities.forEach(city => {
                const district = city.district;
                if (!grouped[district]) {
                    grouped[district] = [];
                }
                grouped[district].push(city);
            });

            // Формируем данные таблицы
            const tableData = Object.keys(grouped).map(district => ({
                district,
                cities: grouped[district],
                quotaProgress: generateRandomQuotaProgress(), // теперь объект { low, high }
                notMatch: '0',
                rejected: '0',
                avgTime: generateRandomTime(),
            }));
            setConductTableData(tableData);
        } catch (err) {
            console.error('Ошибка загрузки маршрута для проведения опроса:', err);
        }
    };


    return (
        <>
            {isWindowOpen && (
                <>
                    <div className="modal-bg" onClick={closeAndReset}></div>
                    <div className="survey-window">
                        <nav className="window-map-navigation">
                            <div className="map-title">{editingSurveyId ? 'Редактирование опроса' : 'Создание опроса'}</div>
                            <div className="close-btn" onClick={closeAndReset}>
                                <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                                    <div className="step-content export-step">
                                        <div className="export-header">
                                            <div className="export-buttons">
                                                <button className="export-cancel-btn" type="button" disabled={exports.length === 0} onClick={handleCancelExport}>
                                                    Отменить экспорт
                                                </button>
                                                <button className="export-create-btn" type="button" onClick={handleCreateExport}>
                                                    Экспорт
                                                </button>
                                                <button className="export-refresh-btn" type="button" onClick={fetchExports} title="Обновить">
                                                    <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M19.841 3.24A10.988 10.988 0 0 0 8.54.573l1.266 3.8a7.033 7.033 0 0 1 8.809 9.158L17 11.891v7.092h7l-2.407-2.439A11.049 11.049 0 0 0 19.841 3.24zM1 10.942a11.05 11.05 0 0 0 11.013 11.044 11.114 11.114 0 0 0 3.521-.575l-1.266-3.8a7.035 7.035 0 0 1-8.788-9.22L7 9.891V6.034c.021-.02.038-.044.06-.065L7 5.909V2.982H0l2.482 2.449A10.951 10.951 0 0 0 1 10.942z" fill="currentColor" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="export-total">
                                                Всего: {exports.length}
                                            </div>
                                        </div>

                                        <div className="export-table-container">
                                            {exportsLoading ? (
                                                <p className="loading-text">Загрузка...</p>
                                            ) : (
                                                <table className="export-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Дата экспорта</th>
                                                            <th>Дата импорта</th>
                                                            <th>Файл</th>
                                                            <th>Статус</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {exports.length > 0 ? (
                                                            exports.map((exp) => (
                                                                <tr key={exp.id}>
                                                                    <td>{new Date(exp.export_date).toLocaleString('ru-RU')}</td>
                                                                    <td>{exp.import_date ? new Date(exp.import_date).toLocaleString('ru-RU') : 'Не указано'}</td>
                                                                    <td>{exp.file_name}</td>
                                                                    <td>{exp.status}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="4" className="no-exports">Нет экспортов</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Этап 4: Проведение опроса */}
                                {currentStep === 4 && (
                                    <div className="step-content conduct-step">
                                        {/* Верхняя панель с кнопками */}
                                        <div className="conduct-header">
                                            <div className="conduct-tabs">
                                                <button
                                                    className={`conduct-tab ${activeConductTab === 'readiness' ? 'active' : ''}`}
                                                    onClick={() => setIsReadinessMapModalOpen(true)}
                                                >
                                                    Карта готовности
                                                </button>
                                                <button
                                                    className={`conduct-tab ${activeConductTab === 'tasks' ? 'active' : ''}`}
                                                    onClick={() => setActiveConductTab('tasks')}
                                                >
                                                    Задания
                                                </button>
                                                <button className="conduct-tab disabled" disabled>Агрегированные данные</button>
                                                <button
                                                    className={`conduct-tab ${activeConductTab === 'results' ? 'active' : ''}`}
                                                    onClick={() => setActiveConductTab('results')}
                                                >
                                                    Результаты
                                                </button>
                                            </div>
                                        </div>

                                        {/* Панель управления таблицей */}
                                        <div className="conduct-table-controls">
                                            <button className="refresh-table-btn" onClick={loadRouteDataForConduct} title="Обновить таблицу">
                                                <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M19.841 3.24A10.988 10.988 0 0 0 8.54.573l1.266 3.8a7.033 7.033 0 0 1 8.809 9.158L17 11.891v7.092h7l-2.407-2.439A11.049 11.049 0 0 0 19.841 3.24zM1 10.942a11.05 11.05 0 0 0 11.013 11.044 11.114 11.114 0 0 0 3.521-.575l-1.266-3.8a7.035 7.035 0 0 1-8.788-9.22L7 9.891V6.034c.021-.02.038-.044.06-.065L7 5.909V2.982H0l2.482 2.449A10.951 10.951 0 0 0 1 10.942z" fill="currentColor" />
                                                </svg>
                                            </button>
                                            <div className="conduct-questionnaire-selector">
                                                <label>Анкета</label>
                                                <select
                                                    value={selectedConductQuestionnaire}
                                                    onChange={(e) => setSelectedConductQuestionnaire(e.target.value)}
                                                >
                                                    <option value="">Выберите анкету</option>
                                                    {questionnaires.map(q => (
                                                        <option key={q.id} value={q.id}>{q.name || 'Без названия'}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Таблица */}
                                        <div className="conduct-table-container">
                                            <table className="conduct-table">
                                                <thead>
                                                    <tr>
                                                        <th>Федеральный округ/субъект РФ</th>
                                                        <th>Выполнение квот</th>
                                                        <th>Не соответствует выборке</th>
                                                        <th>Отклонено</th>
                                                        <th>Среднее время интервью, мин</th>
                                                        <th>Особенности</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {conductTableData.length > 0 ? (
                                                        conductTableData.map((row) => (
                                                            <React.Fragment key={row.district}>
                                                                <tr
                                                                    className="district-row"
                                                                    onClick={() => setExpandedDistrictsConduct(prev => ({
                                                                        ...prev,
                                                                        [row.district]: !prev[row.district]
                                                                    }))}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <td>
                                                                        <span className="expand-icon" style={{ marginRight: '8px' }}>
                                                                            {expandedDistrictsConduct[row.district] ? '▼' : '▶'}
                                                                        </span>
                                                                        {row.district}
                                                                    </td>
                                                                    <td
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={() => setIsQuotaDetailModalOpen(true)}
                                                                    >
                                                                        <div className="quota-progress-bar">
                                                                            <div
                                                                                className="quota-progress-low"
                                                                                style={{ width: `${row.quotaProgress.low}%` }}
                                                                                title={`${row.quotaProgress.low}% / ${row.quotaProgress.high}%`}
                                                                            >
                                                                                <span className="quota-progress-label">{row.quotaProgress.low}%</span>
                                                                            </div>
                                                                            <div
                                                                                className="quota-progress-high"
                                                                                style={{ width: `${row.quotaProgress.high}%` }}
                                                                                title={`${row.quotaProgress.low}% / ${row.quotaProgress.high}%`}
                                                                            >
                                                                                <span className="quota-progress-label">{row.quotaProgress.high}%</span>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>{row.notMatch}</td>
                                                                    <td>{row.rejected}</td>
                                                                    <td>{row.avgTime}</td>
                                                                    <td></td>
                                                                </tr>
                                                                {expandedDistrictsConduct[row.district] && row.cities.map((city, idx) => {
                                                                    const cityProgress = generateRandomQuotaProgress();
                                                                    const cityTime = generateRandomTime();
                                                                    return (
                                                                        <tr key={`${row.district}-${city.city}-${idx}`} className="city-row">
                                                                            <td style={{ paddingLeft: '40px' }}>{city.city}</td>
                                                                            <td
                                                                                style={{ cursor: 'pointer' }}
                                                                                onClick={() => setIsQuotaDetailModalOpen(true)}
                                                                            >
                                                                                <div className="quota-progress-bar">
                                                                                    <div
                                                                                        className="quota-progress-low"
                                                                                        style={{ width: `${cityProgress.low}%` }}
                                                                                        title={`${cityProgress.low}% / ${cityProgress.high}%`}
                                                                                    >
                                                                                        <span className="quota-progress-label">{cityProgress.low}%</span>
                                                                                    </div>
                                                                                    <div
                                                                                        className="quota-progress-high"
                                                                                        style={{ width: `${cityProgress.high}%` }}
                                                                                        title={`${cityProgress.low}% / ${cityProgress.high}%`}
                                                                                    >
                                                                                        <span className="quota-progress-label">{cityProgress.high}%</span>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td>0</td>
                                                                            <td>0</td>
                                                                            <td>{cityTime}</td>
                                                                            <td></td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </React.Fragment>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="6" className="no-data">Нет данных для отображения</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
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

            {/* Модальное окно карты готовности опроса */}
            {isReadinessMapModalOpen && (
                <>
                    <div className="modal-bg" onClick={() => setIsReadinessMapModalOpen(false)}></div>
                    <div className="map-modal">
                        <nav className="window-map-navigation">
                            <div className="map-title">Карта готовности опроса</div>
                            <div className="close-btn" onClick={() => setIsReadinessMapModalOpen(false)}>
                                <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </nav>
                        <div className="map-modal-body" ref={mapContainerRef} style={{ position: 'relative' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" className="russia-map-svg" ref={mapSvgRef}>

                                <path d="m 144.77011,730.77082 1.01,1.4 1.07,-0.59 -0.04,-1.25 -0.44,0.01 -0.34,-0.63 -0.5,0.02 -0.37,-0.38 0.26,-0.8 -0.4,-1.32 0.57,
                                -0.54 -0.02,-0.74 0.94,-0.62 -0.67,-0.48 0.37,-0.39 -0.16,-0.56 -0.62,-0.21 0.23,-0.57 -1.21,-0.08 -0.65,-0.57 -0.64,1.99 -1.16,0.37 
                                -1.89,-0.39 -1.11,0.12 -1.37,-0.57 -0.66,-0.7 -0.84,-0.14 -0.22,-0.44 0.44,-0.57 0.49,0.43 0.8,-0.14 1.03,0.64 1.65,-0.1 2.02,-0.91 
                                1.08,-0.86 1.18,0.2 0.66,0.61 1.11,0.4 0.81,-0.4 1.14,0.07 1.44,1.2 2.25,5.05 -0.65,0.25 -0.92,-2.54 -0.49,-0.46 -0.7,0.07 -0.53,1.54 
                                1.03,2.29 -0.6,1.71 0.47,1.84 -0.38,1.26 -1,0.85 -2.52,-1.55 -1.48,0.1 -0.6,-0.52 0.67,-0.31 -0.17,-0.54 0.54,-0.24 -0.58,-1.01 0,0 z"
                                    title="Республика Адыгея" id="RU-AD" />
                                <path d="m 469.45011,618.60082 0.4,-0.15 0.35,0.27 1.43,2.45 0.91,-0.17 1.76,0.97 0.35,0.78 0.65,0.27 0.09,0.36 1.4,0.67 0.55,1.71 0.61,
                                0.3 0.61,1.93 0.7,0.57 0.43,1.07 2.8,0.35 -0.01,0.97 -0.4,0.92 -1.41,0.67 -0.16,0.38 0.5,0.75 2.22,1.85 0.14,1.27 -0.57,0.57 -0.02,0.8 
                                0.32,1.09 0.67,-0.05 0.23,0.33 0.01,0.83 0,0 -0.82,-0.57 -0.66,0.11 -1.9,1.44 0.34,0.94 -0.25,1.52 0.38,0.3 0.07,1.74 -2.05,0.04 -0.58,
                                1.1 -2.22,-0.49 -1.71,0.3 0.33,1.86 -0.71,0.35 -0.24,1.07 -1.84,1.49 0.16,0.71 -1.81,0.75 -1.47,0.16 -0.93,0.64 -1.15,0.09 -2.08,1.61 
                                -1.81,0.25 -0.39,1.78 -0.35,-0.38 -0.83,0.36 0.12,0.7 0.8,-0.09 0.67,0.67 2.17,0.4 -0.19,0.92 0.94,0.56 -0.76,0.6 0.08,0.53 -0.52,0.35 
                                -0.36,-0.16 -2.41,0.81 0,0 -0.65,-0.91 -0.12,-0.7 -1.08,-1.16 -2.94,-1.23 -1.06,-0.11 -0.32,0.25 -0.7,-0.55 -0.13,0.53 -0.82,0.83 -1.73,
                                -0.3 -0.19,1.2 -1.17,0.82 -1.92,-0.23 -0.86,0.42 -1.11,-0.69 -0.89,-0.13 -0.49,0.1 -0.22,0.46 -2.24,0.12 0.19,-0.81 -0.46,-0.77 -0.16,
                                -1.08 -2.36,0.42 0.59,-2.32 -0.14,-0.66 -0.53,0.35 -1.05,-0.76 -1.59,-0.59 -0.43,1.16 -1.3,0.01 0.2,2.64 -1.93,0.77 -0.05,0.84 -0.73,0 
                                -0.09,0.85 -6.58,-13.66 -5.14,-9.41 -4.11,-6.58 0,0 0.32,-0.78 0.3,0.12 0.15,-0.32 -0.13,-0.55 0.73,-0.19 -0.74,-0.44 -0.02,-0.86 1.03,
                                -0.06 0.52,-0.57 0.04,0.89 0.81,0.64 2.15,-0.54 0.35,-1.26 0.38,-0.28 1.68,-0.33 0.5,0.3 0.23,-0.45 0.43,0.31 0.67,-0.1 0.59,-0.48 0.73,
                                0.41 0.69,-0.29 0.85,-0.61 0.14,-0.59 1.58,-0.5 0.18,-0.75 1.58,-0.97 -0.2,-0.5 0.44,-0.33 0.33,-0.14 0.29,0.54 0.42,-0.13 1.19,-0.96 
                                0.85,-0.09 -0.15,-0.56 0.5,-0.48 1.73,-0.52 -0.27,-0.83 0.54,-0.58 0.4,0.04 0.26,1.13 0.93,0.92 0.23,0.96 0.71,-0.11 0.5,0.5 1.2,-0.04 
                                0.83,0.84 0.03,1.13 1.88,0.05 -0.07,0.64 -0.74,0.48 0.49,1.27 2.51,0.54 0.38,0.2 -0.22,0.61 1.41,1.03 0.71,0.15 0.75,-0.27 -0.22,-0.29 
                                0.9,-0.89 -0.14,-0.48 0.63,-0.86 -0.13,-0.68 2.64,-2.59 0.62,-0.33 0.94,0.1 0.28,0.88 0.57,0.23 0.66,-0.73 -0.1,-1.04 2.28,-0.35 1.08,
                                0.19 2.05,-1.06 0.99,0.27 0.3,0.37 1.41,-1.78 2.07,-1 1.26,-0.25 z" title="Республика Алтай" id="RU-ALT" />
                                <path d="m 718.24011,586.89082 2.25,-0.21 2.07,-1.39 2.08,-0.38 0.43,0.21 1.47,-0.16 3.93,0.76 0.39,0.4 0.26,1.15 0.44,0.25 0.04,1.12 
                                1.68,0.33 0.79,-0.31 1.35,0.09 3.58,3.35 0.67,0.05 0.57,-0.36 0.4,-0.98 1.4,1.5 1.36,0.63 1.19,0.34 2.93,-0.11 0.93,0.59 1.99,3.28 1.1,
                                0.72 0.33,1.49 0.52,0.37 1.3,-0.06 0.05,0.37 1.83,0.62 1.03,-0.5 1.89,0.13 1.53,1.39 1.18,-0.33 1.55,0.52 0.5,0.33 0.13,1.33 0.63,0.15 
                                0.82,-0.14 1.35,0.31 1.35,-0.91 0.24,0.39 1.42,0.33 0.5,-0.88 0.84,-0.29 1.82,0.05 0.64,1.28 1.3,-0.3 0.62,-1.14 0.59,-0.09 0.69,0.72 
                                0.75,-0.33 0.81,0.18 0.43,-0.36 0.72,0.18 1.62,1 0.49,0.66 0.98,0.03 0.86,0.63 0.69,-0.21 0.7,0.28 1.12,-1.01 -0.77,-1.25 0.86,-0.45 
                                0.61,0.07 0.43,-0.42 0.66,0.15 0.51,-0.39 0.76,0.16 0.45,-0.27 1.34,0.36 0.42,-0.31 0.47,0.08 0.48,0.63 0.7,-0.3 0.85,0.27 0.57,-0.54 
                                3,-0.23 1.88,0.91 0,0 0,0 0,0 0.87,0.4 1.15,0.03 3.53,-0.58 0.13,0.49 2.59,-0.32 1.5,-0.68 1.16,0.18 0.56,1.26 0.64,0.47 -0.3,0.77 
                                0.28,0.45 1.81,1.05 -0.23,0.4 -1.23,0.16 -0.91,1.72 -1.4,0.36 -0.02,1.12 -0.35,0.55 -1.89,0.48 -0.81,1.51 -0.72,0.19 -0.43,0.71 -1.35,0.5 
                                -0.18,0.51 -1.29,0.21 -0.3,0.73 -0.98,0.51 -0.01,1.11 -0.86,2.68 -0.39,0.2 -0.85,-0.23 -1.49,0.71 -0.52,0.88 -0.76,0.46 -0.42,2.01 
                                -0.89,1.01 0.72,0.39 1.05,-0.13 0.54,0.64 0.83,0.05 0.73,0.81 0.99,-0.49 1.13,0.56 0.87,-0.18 0.69,0.52 0.5,2.52 -0.23,0.56 0.77,1.65 
                                -0.95,1.62 0.49,0.18 1.49,-0.62 1.02,0.1 0.16,0.36 -0.41,0.4 0.33,0.64 0.67,0.2 0.69,-0.34 0.14,-0.64 1.73,-0.46 0.72,0.29 2.04,-0.2 
                                0.68,0.24 0.62,-0.21 0.38,-0.72 0.59,-0.22 0.37,0.29 0.52,-0.39 -0.11,-1.09 1.32,-0.86 0.93,-0.01 0.4,-0.7 0.7,0.16 0.55,0.78 0.99,-0.16 
                                0.6,0.56 0.63,-0.07 1.93,-1.13 1.1,0.02 0.6,-0.75 2.92,2.29 -0.19,0.39 -1.02,-0.04 -0.17,0.32 0.65,0.49 0.37,0.84 -0.37,0.8 0.17,0.84 
                                -1.69,2.47 0.35,1.34 -0.2,0.81 0.45,0.21 0.16,0.6 -0.92,1.13 0.32,0.48 -0.2,0.85 -3.71,-0.51 -0.58,-0.46 -0.85,-0.09 -4.22,-1.81 -0.48,0.66 
                                0.57,1.33 -0.48,0.52 0.14,0.62 1.09,1.27 -0.12,0.65 -1.36,0.95 -2.41,-0.15 -0.73,0.4 -2.43,2.25 -0.19,1.16 -0.46,0.52 -2.74,0.98 -0.49,-0.11 
                                -1.22,0.63 -1.53,-0.1 -0.35,1.24 0.63,1.58 -0.21,0.77 -0.94,-0.04 -0.71,1.22 -1.1,0.34 -0.95,2.48 -1.27,0.7 0.43,1.05 -1.09,1.89 0.05,0.52 
                                0.31,0.25 0.85,-0.61 0.47,-0.01 0.6,0.94 0.03,0.62 -0.7,0.82 -0.08,0.52 0.47,0.33 0.52,-0.32 0.65,0.11 0.49,0.4 0.45,-0.24 0.18,1.06 0.79,0.25 
                                0.59,1.18 -0.66,0.95 0.52,0.38 0.01,0.94 0.42,0.6 -0.27,0.94 0.2,0.31 -0.92,1.27 0.75,1.3 0.01,1.95 -0.42,1.36 -0.45,0.14 0,0 -1.19,-0.08 
                                -0.53,0.29 -1.02,1.55 -0.33,1.07 -1.23,0.18 -1.28,0.77 -0.3,0.49 0,0 -0.37,0.1 -0.66,-0.53 -1.44,0.38 -2.16,-1.86 -0.07,-0.65 -0.5,-0.25 0.02,-0.52 
                                -0.73,-0.33 -0.21,-0.88 -1.17,-0.14 -0.22,-1.33 -0.35,-0.22 -0.63,0.01 -0.31,0.88 -0.96,-0.53 -0.87,0.51 -0.65,-1.07 -1.75,-0.31 0.18,-1.18 -0.34,-0.06 
                                -0.14,0.3 -1.24,-0.42 -1.1,0.16 -0.94,0.97 -0.15,-0.26 -1.18,-0.21 -0.82,-0.8 -0.33,0.41 -0.65,-0.1 -0.85,-0.85 -0.33,-1.26 -0.64,-0.15 -0.33,-0.49 0.16,-1.01 
                                -0.36,-1.02 0.72,-1.55 0.05,-0.77 -1.41,-0.61 -0.46,-0.53 0.17,-1.09 -0.5,-0.59 0.51,-1.19 -0.56,-1.17 0.1,-0.68 -0.44,-0.34 -0.87,-1.77 -1.36,-1.41 -0.17,-1.49 
                                0.54,-1.5 -0.72,0.11 0.21,0.76 -0.44,-0.14 -0.16,-0.76 0.69,-0.24 0.01,-0.49 -0.91,-0.48 0.31,-1.13 -1.13,-0.79 0.43,-0.43 -0.08,-0.93 -0.48,-0.16 -1.4,-2.5 
                                -0.12,-0.92 0.51,-0.13 0.29,-1.02 -1.85,-1 1.01,-0.91 -0.8,-0.26 0.11,-1.04 -0.61,-0.86 -0.5,0.04 0.04,-0.82 -0.89,-0.76 -0.46,0.22 -0.23,-0.31 -0.02,-0.58 0.64,-0.23 
                                -0.13,-0.74 0.51,-0.29 -0.46,-0.39 -0.58,0.42 -0.97,-1.59 -1.15,0.46 -0.11,-0.62 0.47,-0.3 0.11,-0.54 -0.9,-1.07 -0.24,-0.13 -0.51,0.4 -0.32,-0.65 -2.44,-1.15 -1.47,0.29 
                                -0.31,0.94 -0.3,-0.45 -0.79,-0.2 -0.13,-0.48 -1.96,-0.33 -1.33,-1.78 -0.94,0.26 -1.85,-1.7 -1.28,-0.04 -0.66,-0.7 -0.38,0.63 0.02,-0.59 -0.34,-0.08 -0.1,0.66 -0.23,-0.42 
                                -1.42,-0.35 -0.77,0.68 -0.71,-0.1 -1.47,0.7 -3.01,0.14 -0.69,-0.68 -0.56,0.41 -0.72,-0.04 -0.62,0.56 0,0 -0.34,-1.35 -0.38,-0.24 -0.05,-3.22 -1.06,-1.87 -0.31,-0.17 -0.19,0.4 
                                -0.73,-1.09 0.07,-0.96 0.69,-0.93 -0.52,-2.13 0.3,-0.56 0.65,-0.42 0.26,0.64 0.48,0.01 1.32,-0.63 0.1,-0.48 -0.78,-0.43 -0.39,-0.64 -0.48,-1.15 0.24,-0.97 -0.23,-0.54 -0.85,0.18 
                                -0.46,0.48 -0.07,-0.56 0.28,-1.12 1.74,-1.85 0,-1.54 0.64,-0.62 -0.92,-0.22 0.52,-2.25 -0.15,-0.97 -0.43,-0.93 -1.11,-0.89 -0.5,0.04 -0.38,1.16 -0.55,0.41 -1.29,-0.29 -0.44,-0.61 
                                0.24,-0.65 -0.51,-1.74 0.21,-1.06 -0.39,-0.5 0.02,-1.47 -0.33,-0.47 -2.67,-0.08 -0.45,0.56 -0.57,0.02 -0.55,0.62 -0.66,-0.01 -0.56,0.45 -0.63,0.09 -0.49,-0.53 -1.28,0.52 -0.25,-0.25
                                 -0.11,-3.15 0.87,-0.85 2.01,-0.31 0.22,-0.38 -0.97,-0.51 0.01,-0.69 -0.72,-0.27 0.18,-0.87 -2.41,-0.5 -0.12,-0.57 -1.12,-0.86 0.07,-0.58 0.41,-0.29 -0.13,-0.33 -1.34,-0.72 -0.08,-0.42
                                  1.21,-1.18 z" title="Амурская область" id="RU-AMU" />
                                <path d="m 143.10011,474.45082 0.9,-0.1 0.79,-1.08 0.03,-0.9 0.65,0.56 1.3,0.44 0.5,0.97 1.2,-0.06 0.68,0.51 0.92,-0.04 -0.87,-2.3 0.02,-1.35 0.34,-0.32 -0.29,-0.35 -0.25,-2.22 -0.67,-0.92
                                 0.05,-0.57 -1.17,-0.67 -0.74,-1.02 -0.2,-0.92 -2.14,-3.11 -0.07,-2.26 0.51,-1.91 0.71,-0.94 2.17,-1.07 2.08,-1.89 1.88,-3.12 3.51,-1.03 1.94,-1.23 1.94,-2.38 0.63,-1.33 0.67,-0.22 1.09,-2.71
                                  1.13,-0.56 2.58,1.51 0.06,0.5 1.49,0.25 3.14,-0.3 0.6,1.44 1.65,0.54 0.67,1.01 -2.63,2.58 0.24,0.94 0.85,-1.65 1.77,-1.09 0.17,0.32 0.17,-0.26 0.62,0.09 0.9,1.67 0.75,0.48 -0.41,1.02 0.8,2.11
                                   0.22,-0.7 -0.55,-1.07 0.57,-1.71 -0.59,-1.34 -0.15,-1.25 1.11,-3.05 0,0 1.72,0.44 1.3,1.82 3.98,1.13 2.96,2.15 0.54,0.08 1.26,-0.55 2.09,1.53 1.89,-0.8 5.21,4.21 2,-0.28 2.39,0.22 0.37,-0.34 
                                   -0.88,-1.48 0.71,-1.27 2.37,-2.12 1.62,-0.13 1.02,0.34 1.35,-0.13 1.91,0.38 0,0 0.5,1.49 -0.17,4.03 0.4,2.57 0.15,6.44 4.03,-0.79 0.62,2 2.05,4.15 0.84,1.05 1.38,0.65 0.95,0.07 -1.19,5.53 -2.84,
                                   -1.04 -2.2,-0.39 -1.15,2.24 -1.68,-0.51 -1.8,0.17 -0.7,2.17 -2.76,0.09 0.08,1.14 -0.33,0.79 -2.09,-0.5 -0.11,-1.69 -2.06,-0.36 -2.55,0.35 -1.69,-0.21 -4.78,0.38 -1.32,1.21 -0.97,0.03 -2.1,-0.6 
                                   -1.69,0.42 -1.97,1.22 1.05,2.38 0.88,0.96 1.04,0.54 1.38,-0.04 1.2,0.8 1.29,0.22 2.47,1.94 1.79,1.86 0.37,0.8 -0.12,1.47 -1.09,1.46 1.18,2.73 3.22,1.95 0.55,0.75 -0.77,1.44 -1.2,1.22 -1.72,1.09 
                                   1.22,3.56 -0.25,4.85 1.31,-0.01 0.19,1.98 1.58,0.04 0.36,-1.81 2.07,-0.18 2.45,0.24 0.01,-1.46 -0.61,-0.9 1.01,-3.8 2.01,-0.08 0.79,-1.65 6.16,1.04 -2.02,9.66 -0.48,0.13 -1.36,7.03 3.34,0.98 
                                   -1.91,6.45 -1.33,-0.25 -0.99,0.68 -1.11,-0.01 -1.81,1.29 -0.99,1.06 -0.32,1.99 0,0 -2.67,-0.47 -0.09,-1.58 -0.38,-0.36 -2.96,-0.81 -0.69,0.45 -1.43,-0.23 0.08,0.58 -0.45,0.56 -0.47,1.79 0,0 
                                   -1.85,-0.07 -0.52,-0.46 0.39,-0.9 -0.38,-0.23 -0.95,0.1 -1.09,-1.03 -1.03,0.94 -2.2,0.15 -1.94,-1.1 0.49,-1.94 -3.74,-0.51 -0.57,4.34 -6.97,-0.71 -0.55,-0.67 0.18,-0.27 -0.24,-0.37 -0.99,-0.05 
                                   -1.91,0.78 -0.12,0.84 -0.79,0.21 -0.91,1.05 -0.12,0.76 -0.97,0.26 -1.46,-0.63 -0.92,1.32 -1.12,-1.47 -0.97,-0.68 -0.67,0.18 -0.49,0.86 -0.42,-0.02 -0.72,0.64 -1.71,-0.97 -0.42,-0.81 -0.53,0.6 
                                   -1.43,-1.14 -0.42,1.2 -0.94,-0.48 -0.27,-0.67 -1.52,1.08 0.33,1 -0.62,0.87 -1.15,0.68 -1.4,-0.09 -1.88,-1.5 -0.83,0.4 -1.25,-0.59 -0.41,0.07 -0.48,1.06 -1.1,-0.18 -1.22,0.63 -0.97,-0.33 -0.72,-0.89 
                                   -0.94,-0.03 -0.85,0.95 -2.02,-0.3 -0.39,0.64 -1.58,-0.34 -0.77,-0.57 -1.16,0.08 -0.75,-1.37 -1.29,-0.43 0.14,-1.47 -0.24,-0.47 -0.63,0.87 -1.05,-0.57 0.4,-1.68 -0.38,-0.93 -0.82,-0.17 -0.44,-0.49 
                                   0.16,-0.63 -1.63,-2.89 0.15,-1.76 0,0 0.07,-2.11 0.96,-1.13 0.04,-0.32 -0.57,-0.59 0.7,-1.77 -0.04,-1.09 -0.73,-0.58 0.07,-0.79 -0.81,-1.99 -0.31,-0.32 -0.97,0.16 -0.64,-0.79 -0.07,-0.62 0.51,-0.03
                                    0.55,-1.77 -0.1,-2.65 -0.82,-1.29 -0.71,-0.27 -2.03,0.36 -3.19,-1.95 -2.21,-3.17 -0.2,-1.79 0.9,-1.18 0.09,-0.58 -0.88,0.41 -0.24,-0.25 0.59,-0.78 -0.11,-0.52 -0.76,-0.78 -0.09,-1.29 -2.05,-2.89 
                                    1.35,0.21 0.57,-0.37 1.24,0.35 1.83,-2.62 -0.56,-2.02 0.19,-0.62 0,0 0.6,0.61 0.47,0.08 0.19,-0.25 0.63,0.48 0.53,-0.32 0.24,0.37 1.58,0.1 0.51,1.16 1.23,0.33 1.17,-0.46 0.19,-1.1 0.46,-0.32 0.6,0.24
                                     0.79,-0.15 1.32,-1.69 -0.53,-2.27 -0.79,-1.04 0.54,-1.12 0.58,-0.31 -0.87,-0.22 -0.09,-0.3 0.9,-0.1 -0.6,-0.45 -1.21,-0.28 0.4,-1.27 -1.26,0.26 -0.51,0.85 0.13,0.38 -0.34,-0.4 -0.63,-0.03 -1.07,0.68 -1.62,-1.14 -2.85,-4.83 -1.23,-0.22 -0.25,-1.73 0.41,0.08 -0.73,-0.66 -0.18,-1.08 0.42,-0.24 0.5,0.6 0.39,-0.03 0.25,-0.49 1.15,-0.6 0.16,-3.2 1.26,-0.31 2.71,1.15 2.17,1.16 0.14,1.04 0.41,0.55 2.13,1.49 2.13,0.04 -0.23,0.82 -0.61,0.06 -0.22,0.42 -0.43,-0.34 -0.97,0.52 -0.06,0.62 0.82,0.79 -0.89,0.98 0.14,0.55 0.27,-0.12 0.04,-0.78 0.69,-0.16 0.11,-1.09 0.51,-0.01 0.62,-0.51 1.22,0.1 -0.69,-0.96 0.26,-0.27 1.05,0.64 2.35,0.59 1.46,1.17 1.37,0.36 1.96,1.74 z m 94.6,-131.66 0.36,-0.06 0.69,0.59 1.16,1.92 0.03,0.7 0.56,0.15 -0.01,-0.35 0.32,-0.02 -0.01,1.01 0.46,0.43 -0.38,0.18 0.2,0.85 -0.6,0.78 0.18,0.62 -0.86,1.04 0.23,1.1 0.63,0.71 -0.84,0.26 -0.79,-2.19 -1.06,-0.71 -0.02,-1.1 -0.61,-0.68 -0.17,-1.08 -0.62,-0.6 -0.83,0.27 -0.59,-0.28 -0.15,0.26 -1.08,-1.67 0.55,-1.19 0.61,0 0.4,-0.47 0.6,0.15 0.35,-0.44 0.77,0.42 0.52,-0.6 z m 17.46,-47.16 0.25,0.76 1.17,0.64 2.05,-0.2 0.79,0.36 0.25,1.03 0.87,0.05 -0.21,1.31 0.39,-0.8 2.66,0.5 0.62,0.4 0.9,1.54 -0.12,1.13 -2.48,0.95 -2.27,0.22 -0.43,0.35 3.42,-0.11 0.88,0.52 -0.75,0.83 -1.39,-0.02 -2.72,1.17 -0.53,-0.28 -1.07,0.41 1.42,0.26 0.54,-0.29 0.6,0.38 2.17,-0.85 0.44,0.33 -0.33,0.83 0.11,1.43 -0.79,1.74 -0.67,0.17 -0.66,-0.64 -0.11,0.54 -0.27,-0.48 -0.37,-0.04 -0.21,0.16 0.47,0.26 -1.17,0.51 -1.65,-1.07 0.65,0.58 -0.69,0.52 0.89,-0.09 1.83,0.58 0.58,2.16 -1.37,-0.05 -0.58,-0.72 0.3,2.07 -0.16,-0.43 -0.25,0.14 0.14,1.58 -0.38,0.05 0.02,0.43 -0.67,-0.25 0.08,-0.44 -0.5,-0.36 -1.82,-0.57 -0.72,0.2 0.97,-0.07 1.59,0.86 0.19,0.32 -0.37,0.07 0.85,0.46 0.13,1.05 -1.34,0.61 -0.26,-0.22 -0.37,0.26 -1.09,-0.14 1.1,0.33 0.28,-0.21 0.6,0.54 0.37,-0.43 0.13,1.78 -1,1.76 0.34,0.38 -0.6,-0.11 1.13,0.25 -0.14,0.6 0.52,0.33 0.51,1.3 -0.94,0.86 -0.42,1.39 -0.43,0.27 0.84,0.22 -0.52,0.8 0.04,0.9 -0.33,-0.01 0.61,1.14 -1.01,-0.35 0.03,0.52 -0.96,0.38 0.35,0.18 0.73,-0.42 1.01,0.04 0.51,0.7 0.27,3.22 0.23,0.23 -0.23,0.36 0.52,0.8 0.12,1.37 0.58,0.98 -0.05,0.55 0.88,1.08 0.19,1.27 0.55,0.72 1.92,5.27 1.29,1.28 1.74,2.58 1.81,1.82 0.74,1.33 2.16,1.46 0.93,0.06 1.22,1.76 0.02,0.27 -0.41,-0.11 -0.19,0.81 -0.44,0.29 0.21,0.33 -0.69,0.7 0.23,0.55 -3.07,-1.62 -0.11,0.54 -0.9,-0.19 -0.19,-0.52 -0.44,-0.15 0.48,0.91 0.78,0.4 0.9,0.32 0.63,-0.24 1.04,0.99 0.05,0.44 -1.42,-0.25 -0.98,-0.66 -0.48,0.1 -0.28,-0.43 -0.96,-0.32 -0.8,-0.92 -0.32,0.14 0.73,0.77 -0.5,0.01 -0.52,-0.82 -0.1,-1.27 0.64,-0.04 -0.58,-0.49 -1.27,0.8 -0.89,-0.87 -0.24,0.39 0.92,0.73 -0.87,-0.17 -0.17,0.29 1,0.7 -0.53,0.37 1.05,0.21 0.38,-0.22 -0.67,-0.2 -0.03,-0.42 0.63,0.05 0.65,0.72 -0.44,0.16 0.04,0.3 0.48,-0.01 0.79,0.88 -0.48,0.01 0.03,-0.32 -0.39,-0.17 -0.94,0.45 -2.09,-1.85 -0.52,-0.16 0.28,0.38 -0.44,0.17 -1.41,-0.85 0.43,0.59 -0.15,0.22 1.27,1.03 0,0.57 -0.54,-0.42 -0.43,0.24 -0.41,-0.75 -0.21,0.27 -0.61,-0.22 -0.99,-1.52 -0.76,-0.48 -0.32,-0.88 -0.58,0.64 1.08,1.6 -0.33,0.3 -0.18,-0.57 -1,-0.76 -0.04,0.51 -0.35,0.07 0.72,1.15 -0.29,0.04 -0.06,0.54 -0.56,0.1 -0.04,0.53 -0.84,-0.56 -0.7,-1.13 -0.53,-0.06 -0.26,-0.44 -0.39,0.19 -0.84,-1.26 -0.09,-0.4 0.31,-0.27 -1.16,-0.84 -0.74,-0.2 0.33,0.74 -0.57,0.45 -1.09,-1.06 -0.23,0.3 0.55,0.63 -0.41,-0.13 -0.29,0.29 -0.88,-0.45 0.07,0.37 -0.79,-0.19 -0.63,-1.02 -0.21,0.41 -0.31,-0.46 -0.6,0.11 -1.39,-0.96 -0.33,0.06 0.4,0.42 -0.18,0.26 -1.47,-1.73 0.4,0.15 1.25,-0.56 0.77,0.11 0.67,-1.27 -1.73,-2.55 1.03,-0.18 0.29,-0.43 1.76,1.46 -0.38,-1.27 -0.67,-0.94 0.47,0.24 0.17,-0.39 0.51,-0.05 0.76,-1.06 -0.24,-0.87 -0.57,1.3 -0.62,-0.35 -0.11,-0.42 -0.32,0.03 0.02,1.15 -0.7,-0.42 0.03,-0.63 -0.34,0.16 -0.77,-0.32 -0.37,-0.58 -1.32,-2.54 0.03,-1.19 -0.5,-1.44 0.7,-0.41 0.1,-0.85 0.48,-0.76 -0.35,-0.35 -0.58,0.33 -1.2,2.06 0.07,0.79 -0.44,-0.62 -0.57,0.22 -0.09,-0.63 -0.51,-0.37 -0.08,0.5 0.72,0.99 -0.56,0.73 -1.36,-1.35 -1.25,-3.38 0.25,-0.32 -0.55,-1.47 -0.34,0.04 0.21,2.15 -0.31,0.67 -0.62,-0.32 0.41,1.95 -0.95,-1.15 -0.4,-1.96 -0.03,0.83 -0.23,0.42 -0.27,-0.05 -0.13,0.52 0.83,1.3 -0.87,-0.23 -0.56,0.42 -1.07,-0.25 -0.3,0.2 -0.98,-1.27 -1.01,-0.48 -0.38,-0.96 0.05,-0.95 -1.04,-3.97 1.05,-6.13 1.54,-1.24 0.52,-0.87 0.61,1.13 0.87,0.28 0.42,-0.09 0.64,-0.8 0.66,1.67 0.46,0.14 0.43,-0.48 -0.21,-1.72 0.29,-0.47 0.46,0.19 -0.61,-1.33 0.49,0.04 0.42,-0.42 -0.45,-0.07 -0.27,-0.93 1.39,0.8 -0.31,-1.1 0.26,0.24 0.5,-0.29 0.13,-0.61 -1.04,-0.67 -0.04,-0.44 0.68,0.17 0.63,0.75 -0.32,-0.82 0.29,-0.73 -0.45,-0.57 0.79,-0.81 -0.28,-0.21 -0.49,0.33 0.11,-0.71 1.25,-0.56 -0.17,-0.43 0.74,-0.66 -0.46,-0.4 0.52,-0.37 1.03,-0.15 0.97,0.62 0.25,-0.27 -0.96,-0.58 -1.2,-0.01 -1.41,1.13 -0.41,-0.12 0.88,-1.48 -0.2,-0.27 -0.5,0.38 -0.36,-0.4 0.57,-0.41 0.43,0.2 0.5,-0.49 -0.43,-0.56 -0.24,0.6 -1.78,-0.29 -0.78,-1.22 -0.44,-0.15 1.23,-3.19 2.56,-1.44 2.26,0.96 1.51,0.03 -1.15,-0.74 -0.02,-0.3 -0.71,-0.04 -0.76,-0.49 -0.15,-0.46 0.3,-1.34 0.49,0.04 0.2,-0.29 0.59,0.55 0.48,0.01 0.18,-0.48 -0.64,-0.23 -0.85,-1.19 0.15,-0.41 -0.27,-0.23 0.29,-0.45 -0.12,-0.51 1.78,-2.33 0.32,-0.14 0.62,0.32 0.94,-1.06 1.44,-0.68 0.44,0.5 0.51,-0.37 -0.14,0.63 0.21,0.13 1.27,0.09 0.43,-0.69 0.8,-0.23 0.71,0.64 0.2,-0.18 -0.73,-0.8 0.3,-0.95 0.91,-0.81 0.65,0.1 0.68,-0.87 1.1,-0.56 2.06,1.3 z m 39.64,-71.05 0.34,0.03 0.09,-1.29 0.39,-0.57 1.77,-0.3 0.66,-1.36 -0.18,-0.86 -1.23,0.17 -0.38,-0.43 0.65,-1.41 -0.29,-1.4 1.23,-1.04 0.29,0.13 -0.19,0.39 1.78,-0.63 1.24,0.09 0.56,-0.8 0.92,0.86 0.81,-0.53 0.26,0.82 2.22,0.38 0.41,-0.28 0.61,0.09 -0.07,2.18 0.58,-0.09 0.41,0.54 0.4,-1.49 0.54,0.53 0.35,-0.6 -0.16,-0.45 0.4,0.07 -0.14,-0.44 0.29,-0.5 0.58,0.54 -0.15,0.78 0.45,-0.14 0.36,0.32 -0.12,0.34 0.73,0.31 0.57,-0.85 0.5,-0.08 0.91,-1.06 1.88,-0.83 -0.31,-0.37 1.29,-0.79 0.49,0.21 0.94,-0.32 0.82,0.91 0.46,0.12 0.75,-0.62 0.19,-0.56 0.84,-0.55 0.7,0.35 0.39,-1.38 0.67,0.7 0.68,0.04 0.58,0.48 -0.73,-1.27 0.48,-1.42 0.62,0.2 0.2,-0.31 -0.27,-0.37 0.13,-0.55 0.85,-0.59 1.05,0.07 0.35,0.93 0.82,-0.41 0.03,-0.61 0.78,-0.25 0.26,-1.61 0.64,-0.56 0.6,-0.06 0.48,0.7 2.33,1.2 0.41,-0.06 0.42,-0.43 -0.66,-1.12 -0.09,-1.17 -1.12,-1.64 0.43,-1.65 0.75,-1.05 0.59,-0.32 0.54,0.28 0.97,-1.46 0.62,-0.08 0.7,-1.45 0.85,-0.63 0.69,-0.09 0.36,-0.82 1.6,-0.54 0.05,-0.76 0.76,-0.71 1.06,0.52 2.48,-2.03 2.75,-0.34 1.4,0.28 0.63,0.86 0.71,-0.19 0.42,0.41 0.74,-0.05 0.49,1.41 0.59,-0.35 0.28,0.8 1.29,1.05 -0.43,1.56 0.51,0.87 0.82,0.13 -0.14,1.71 0.92,0.85 -1.56,2.2 -0.37,2.33 0.72,0.61 -1.13,1.34 -1.16,2.68 -1.09,0.53 0.21,0.54 -0.91,1.61 -0.92,0.64 0.06,0.53 0.73,0.47 -0.16,0.43 -0.77,0.27 -0.58,-0.22 -1.23,0.55 -2.73,2.06 -0.84,0.33 -2.7,2.51 -0.75,0.04 -1.82,0.82 -1.7,1.64 -0.63,0.13 -0.6,-0.38 -0.01,0.57 -1.24,0.95 -1.24,0.19 -2.78,1.19 -0.17,0.48 -2.32,1.37 -0.29,0.88 -0.43,-0.08 -0.76,0.5 -0.91,-0.18 -0.06,0.34 -1.1,0.21 -0.83,0.76 -2,0.88 -1.61,0.15 -1.08,1.16 -0.82,0.11 -0.64,1.37 -0.29,-0.4 0.46,-0.79 -0.66,-0.36 0.08,-0.74 -0.42,-0.37 -0.2,1.33 -0.79,0.76 -0.3,0.81 -0.72,0.28 -0.31,0.55 -0.73,0.05 -0.02,0.26 -1.12,-0.64 -0.31,1.01 -1.33,1.45 -1.76,0.48 -1.6,1.22 -0.38,0.62 -0.5,0.11 0.33,-0.4 -0.26,-0.34 -0.55,0.28 -1.04,-0.04 -1.3,2.39 -0.23,0.98 -0.08,-1.47 -0.45,0.08 -0.4,1.39 0.19,0.83 -0.45,0.29 0.05,0.59 -0.46,0.06 -0.37,0.97 -0.55,0.39 -0.39,-0.59 0.17,-2.3 -0.59,-0.15 -0.24,0.58 0.36,0.29 -0.66,0.77 -0.55,1.74 -0.62,0.64 -0.76,0.26 -0.07,0.49 -0.92,0.26 -0.27,0.5 0.22,0.63 -0.39,0.3 0.38,0.36 -0.56,1.74 -0.7,-0.13 -0.32,-1.04 0.16,-1.01 -0.67,-0.05 -0.18,0.74 -0.38,0.01 0.23,0.27 -0.69,0.24 0.4,0.39 -0.17,0.97 -1.39,0.79 0.18,-0.23 -0.4,-0.59 -0.22,0.75 -1.01,-0.53 -0.34,0.29 0.8,0.83 0.87,0.35 2.63,-0.21 0.48,0.96 -0.67,1.73 -0.37,0.22 -2.06,-0.12 -0.42,-0.46 0.5,1.89 0.67,0.29 -0.16,1.13 -1.08,0.67 -1.21,0.14 -1.68,-0.58 -0.58,0.27 -0.44,-1.09 -0.73,-0.82 -0.34,-0.01 0.96,1.39 -0.11,0.58 1.1,0.32 0.21,0.83 0.51,0.25 0.24,1.69 -0.53,0.35 -0.18,0.56 -1.15,-0.02 -1.98,-2.83 -0.68,-0.11 -0.37,-0.41 -0.2,-1.1 -0.54,0.26 0.31,1.35 1.12,1.64 -0.79,-0.17 -0.17,0.27 0.18,0.82 -0.56,1.47 0.28,0.78 -0.41,1.02 0.38,0.3 0.13,0.77 -0.47,0.07 -1.83,-0.73 -0.85,-1.22 -0.92,-0.25 -2.27,-1.65 -0.29,0.86 1.11,0.82 0.62,0.04 1.28,2.69 -0.3,0.71 0.57,1.28 -0.39,0.72 0.67,1.17 -0.67,0.31 0.73,0.52 -1.08,0.21 -0.22,-0.28 -0.09,0.47 0.68,-0.01 0.17,0.46 -1.07,-0.23 -0.32,0.32 0.56,0.21 -0.11,0.96 -0.93,-1.08 -1.01,-0.19 0.49,1.36 1.41,0.3 0.03,0.56 -0.35,-0.39 -0.81,-0.06 -0.23,0.22 0.22,0.47 -0.17,0.58 -0.39,-0.21 0.26,-0.56 -0.17,-0.39 -1.27,-0.69 -0.06,0.61 0.7,0.74 -0.13,1.21 0.69,1.26 -0.75,0.05 -0.05,0.53 -1.69,-0.61 -0.99,-1 -0.54,-0.13 -0.49,-1.88 -1.22,-1.96 -0.52,0.48 0.88,2.39 -0.39,0.22 -0.83,-0.35 -1.23,0.19 0.46,0.33 0.85,-0.16 0.94,0.38 0.26,-0.19 2.5,4.16 -0.21,0.36 -0.17,-0.23 -0.65,0.37 0.87,0.44 0.19,2.48 -0.62,0.85 -0.97,0.59 -0.52,-1.77 -0.75,-0.94 -3.81,-1 -1.31,0.12 -0.61,-0.96 -0.78,0.21 1.23,1.02 1.13,-0.03 2.11,1.03 0.76,-0.04 0.64,0.71 -0.14,0.39 0.84,0.37 0.76,2.89 -0.08,0.89 -0.68,0.6 -1.11,0.22 -0.04,0.78 -1.37,-0.43 -1.43,-0.81 -1.14,-2.33 -1.31,-1.06 -1.47,-0.47 1.94,1.15 0.69,0.79 -0.15,0.61 1.04,1.08 -1.23,0.38 1.25,0.02 2.35,2.49 0.04,0.89 -0.63,0.54 -0.1,0.67 -1.66,2.69 -0.66,-1.56 -0.61,0.23 0.35,0.95 0.28,-0.05 -0.62,1.36 0.15,0.47 -0.44,0.12 -2.32,-0.81 -1.66,-0.02 -0.38,-0.68 -0.02,-1.9 -1.52,-2.06 -0.35,-1.37 -0.35,-0.33 0.51,1.73 0.82,1.07 -0.06,2.65 -1.46,-1.04 -2.42,0.25 -0.77,-0.51 -0.53,-1.08 -1.04,-0.77 -1.22,-0.43 -1.42,0.54 -0.87,0.86 -0.55,-0.09 -1.26,1.51 -1.05,0.38 -0.19,-0.57 -0.77,-0.09 -0.18,-0.59 0.71,-0.96 1.02,0.02 0.53,-1.13 1.13,-0.77 0.04,-0.46 -1.37,0.96 -0.75,-0.75 1.25,-1.98 2.2,-1.29 0.3,-0.68 1.32,-0.15 1.49,-1.08 0.99,0.01 0.12,-0.39 0.41,-0.08 -0.13,-0.25 -0.56,0.45 -1.81,0.07 -0.72,0.72 -0.37,-0.46 0.5,-0.76 -1.17,0.78 -1.03,-0.25 -2.47,2.4 -0.85,-0.52 -0.48,0.42 -0.68,-0.42 0.07,-0.49 -0.42,-0.19 -0.4,-0.91 -1.28,-0.98 -0.33,-0.68 0.31,-1.1 0.26,0.61 1.41,0.06 1.06,-1.3 -0.23,-0.33 0.25,-0.46 1.28,-1.43 0.9,-0.56 1.61,-0.24 0.6,-0.65 1.19,0.44 0.29,0.86 1.16,0.11 -1.22,-0.61 0.34,-0.3 -0.38,-0.82 -1.99,-0.65 0.07,-0.61 3.08,-3.54 0.34,0.32 0.7,-0.45 1.34,1.01 1.57,0.06 0.4,0.36 -0.18,0.28 0.79,-0.16 0.5,0.36 0.04,0.46 0.58,0.01 0.88,0.84 1.67,-0.18 0.13,-0.22 -0.61,-0.11 -0.87,0.27 -1.24,-0.87 -0.1,-0.33 0.79,-0.35 0.43,-1.1 -0.56,0.9 -0.54,0.12 -0.5,-0.45 -1.21,-0.29 0.16,-0.34 -0.46,-0.89 -0.69,-0.05 -0.25,-0.4 -0.92,-0.36 -1.27,-0.15 -0.36,-0.59 0.42,-0.81 0.65,-0.43 0.15,0.99 2.5,-0.81 0.44,0.82 0.42,-0.31 0.1,-0.53 -0.63,-0.93 -0.57,0.29 -0.3,-1.04 -0.49,0.23 -1.43,-0.33 0.45,-1.62 0.85,0.14 1.11,-0.76 1.88,0.04 1.55,-0.6 0.28,-0.42 -1.06,-0.29 0.37,-0.44 -0.2,-0.64 -1.41,-0.2 -0.94,0.53 -0.11,-0.69 -1,-0.39 0.38,-1.11 -0.07,-1.03 1.7,-1.53 0.4,0.4 0.37,-0.11 -0.17,0.44 0.35,0.26 0.59,-0.06 0.13,-0.49 1.81,-0.59 0.84,-0.66 0,0.4 1.51,1.26 1.3,-0.03 0.19,-0.49 0.72,0.09 0.21,-0.24 -0.57,-0.74 -0.8,0.62 -1.06,-0.02 -0.49,-1.25 -0.4,-0.26 -0.39,0.24 0.05,-0.63 0.77,-0.37 -0.23,-0.38 -1.02,0.24 -0.42,-0.38 -0.94,0.11 -0.53,0.34 -0.34,-0.15 -0.28,0.37 -0.53,-0.04 -0.6,-0.64 0.03,-0.58 0.94,-1.03 2.45,-1.49 0.68,0.3 0.93,-0.93 0.76,-0.03 0.28,-0.35 -0.92,-0.49 -0.66,0.03 -0.52,0.76 -0.61,0.27 0.35,-0.78 -0.61,0.14 0.01,-0.27 1.04,-0.93 -0.58,-1.06 -1.97,0.72 -0.59,0.83 -0.86,0.07 0.14,-1.56 0.43,-0.96 -0.93,-0.72 -0.47,0.26 0.37,-1.79 0.59,-1.01 1.03,-0.67 0.07,0.72 0.97,-0.35 -0.24,0.56 0.33,0.36 0.89,-0.62 1.05,3.34 0.44,-0.54 0.67,-0.19 -0.09,-1.42 0.78,-0.64 0.41,-1.2 0.67,-0.16 0.46,-1.19 -0.61,-0.73 -0.78,-0.04 -0.15,-0.75 1.72,-1.91 0.54,-0.29 1.61,0.56 0.89,-0.3 -0.12,0.63 1.37,0.94 2.22,-0.15 -0.14,-0.93 -0.92,0.01 -0.19,-0.73 0.21,-1.02 -0.52,-0.97 -0.51,0.02 -0.14,-1.25 0.35,-0.57 1.82,-0.78 0.65,-0.65 0.92,-0.23 0.18,0.19 0.9,-0.77 -0.16,-1.18 -1.24,0.43 -0.49,-0.39 -0.2,0.18 -0.08,-0.39 0.75,-1 0.18,0.29 0.65,-0.41 0.47,0.13 3.03,-1.64 -0.04,-1.04 -0.63,0.09 0.62,-0.73 0.68,-0.17 -0.19,-0.64 1.07,-1.28 0.52,-0.2 1.45,0.43 0.45,-0.89 1.2,-0.1 -0.17,-1.26 1.09,-0.18 1.56,0.71 0.73,-0.77 1.16,-0.17 0,-0.65 0.29,-0.27 1.23,0.11 0.86,-0.35 0.33,-0.54 -0.22,-0.3 -0.65,-0.63 -0.96,-0.13 -0.18,-0.57 1.37,-1.44 1.79,-0.85 0.82,0.33 1.28,-0.01 -1.06,1.16 -0.87,1.63 -0.74,0.53 0.31,0.12 0.15,0.66 0.54,-0.35 0.71,0.29 0.33,-0.33 z m -5.46,-139.580002 0.35,0.05 -0.05,0.27 -1.11,0.66 -0.98,1.6 -1.4,0.01 -0.38,0.89 -0.78,0.15 -0.4,-1.04 -0.85,-0.5 -0.27,-0.53 -1.57,-1.35 -1,-0.21 0.16,-0.52 2.58,-2.18 2.09,-0.89 1.42,0.24 1,0.55 1.19,2.8 z m -62.57,-2.16 0.46,0.08 -0.74,2.77 1.31,1.45 -0.08,0.51 0.41,0.67 -0.3,0.33 -2.04,0.19 -2.53,-0.82 -1.48,0.16 -1.06,-0.46 -0.12,-0.9 -0.92,0.63 -1.19,-0.09 -0.23,-0.4 0.25,-0.59 1.44,-1.1 0.6,0.3 0.27,0.81 0.33,-0.06 0.88,-0.86 0.9,-2.35 1.72,-1.14 0.21,-1.3 1.15,0.86 0.01,0.51 0.75,0.8 z m -6.5,-3.23 -1.48,0.08 -0.27,1.11 0.41,1.7 -0.72,0.69 -0.56,-0.07 -0.6,-0.37 -0.2,-1.43 -1.95,-2.05 -0.25,-0.87 0.57,-0.92 1.73,-1.39 1.71,-0.56 1.2,0.39 0.78,1.12 0.05,1.23 -0.65,0.71 0.23,0.63 z m 36.53,-7.84 0.65,0.05 0.27,0.36 -0.4,2.02 -1.03,0.56 -0.6,0.92 -1.15,0.43 -1.11,-1.34 0.08,-0.25 0.28,-0.19 0.74,0.3 0.06,-0.84 0.91,-0.28 -0.8,-1.07 0.87,-0.77 1.02,-0.65 0.21,0.75 z m 11.29,-1.48 0.16,0.73 1.03,0.73 0.23,0.56 -0.63,3.54 0.69,1.03 -0.86,0.87 -0.06,2.57 0.26,0.52 -0.45,1.55 -0.25,0.26 -1.26,-0.12 -0.54,0.19 -0.06,0.4 -1.81,-0.75 -2.03,0.34 -2.75,-1.3 2.22,-3.79 -0.72,-2.09 0.09,-1.15 -0.84,-1.99 0.81,-0.75 2.05,-0.59 1.15,0.15 0.64,0.91 0.46,0.02 0.29,-0.3 0.08,-1.5 2.1,-0.04 z m -25.92,-1.23 0.31,0.51 -0.36,1.18 4.05,4.64 -1.06,1.83 -0.63,-0.91 -0.8,0.4 -0.32,0.5 -0.07,1.83 -0.57,0.47 -0.52,-0.03 -0.74,-0.72 -4.02,-0.05 -2.38,-1.54 -1.04,-1.54 -0.12,-1.16 0.73,-0.46 2.01,0.14 0.44,-1.2 1.19,-0.2 0.42,-1.47 -0.96,-0.39 -0.13,-0.32 1.25,-1.43 0.79,-0.45 0.95,0.63 0.82,-0.73 0.76,0.47 z m 9.46,1.21 -0.57,0 -0.17,-0.55 2.31,-1.47 -0.77,1.7 -0.8,0.32 z m 24.17,-5.39 0.57,0.53 1.01,-0.1 4.7,2.25 0.86,1.27 0.63,0.39 1.1,2.32 -0.31,0.49 -2.47,-0.04 -1.89,-0.72 -0.28,1.05 -1.06,-0.12 -0.85,1.03 -1.31,0.75 -0.43,1.68 1.22,-0.04 1.19,0.65 0.27,0.48 -0.53,1.04 0.23,1.26 -3.08,-0.76 -0.27,0.3 0.74,1.77 -0.26,1.13 -1.38,-0.34 -1.48,-1.01 -0.45,-0.65 -1.71,-0.84 -0.69,-6.85 0.29,-1.34 -0.52,-0.94 -0.08,-1.29 -1.46,-2.06 2.25,-0.5 0.51,-0.44 1.36,0.39 0.35,-0.53 3.23,-0.21 z m -25.45,4.33 -0.59,-0.38 0.21,-1.85 0.86,-1.32 0.27,-1.02 0.71,0.37 0.84,1.99 -0.5,1.5 -1.8,0.71 z m -1.15,-5.11 0.82,0.13 0.43,0.7 -0.03,0.36 -1.02,0.76 -0.37,1.58 -0.54,-0.09 -1.23,-1.16 -1.49,-0.28 0.02,-2.1 0.53,-0.99 -1,-1.9 0.6,-1.5 0.97,0.02 1.63,0.62 -0.01,0.72 -0.62,0.3 -0.42,0.82 1.81,0.59 0.26,0.58 -0.55,0.66 0.21,0.18 z m 25.31,-5.53 0.51,0.11 0.63,-0.44 0.19,0.67 -1.35,3.62 -0.94,0.09 -0.37,-0.5 -0.58,0.23 -0.28,0.52 -1.98,-1.67 -0.24,-1.23 0.47,-0.1 0.35,-0.63 2.69,-0.65 0.45,-0.52 0.45,0.5 z m -32.24,0.11 0.2,2.95 0.93,1.61 -0.87,1.94 -0.88,-0.72 -0.72,-1.35 0.3,-2.19 0.48,-0.77 -1.88,-1.32 0.8,-0.38 -0.13,-0.85 0.23,-0.15 0.72,0.31 0.82,0.92 z m 22.15,-6.3 2.91,2 0.83,1.87 -0.72,2.13 -1.35,0.81 -1.16,-0.13 -1.08,0.75 -0.4,-0.24 -0.23,-1.21 -1.91,1.13 -3.07,-0.76 -0.45,-0.46 1.31,-2.4 -0.37,-0.36 -1.79,0.44 -0.25,-0.2 0.55,-0.8 1.83,-0.53 0.5,-0.97 0.84,-0.5 4.01,-0.57 z m -63.3,-3.38 2.02,1.72 1.27,-0.53 0.42,0.16 0.7,-0.51 1.56,0.85 0.71,1.02 0.11,1.22 -1.09,0.36 0.01,0.44 0.9,0.6 0.41,1.04 -0.21,0.72 0.79,0.4 0.44,0.65 -0.7,1.5 -0.36,0.09 -0.47,-0.39 -0.57,0.13 -0.2,-0.87 -0.39,-0.26 -1.12,0.24 -0.82,-0.23 -0.91,-1.12 0.12,-2.15 -0.96,0.34 -0.17,-1.91 -0.68,-0.53 -0.74,0.04 -0.83,0.74 0.52,1.08 -1.06,-0.47 -0.24,0.25 0.12,0.99 0.48,0.2 0.1,1.35 -2.04,-0.5 0.02,1.81 0.36,0.24 0.06,0.67 0.58,0.47 -0.01,1.27 -0.95,-0.09 -1.11,-0.73 -1.46,1.6 -0.34,1.65 -1.2,-0.17 -0.69,-0.54 -0.52,0.8 0.36,1.65 -0.74,-0.44 -0.78,0.14 0.06,1.68 -0.72,0.66 -0.79,0 -1.05,-0.52 0.53,-2.58 -0.2,-1.69 -1.03,0.07 -0.61,0.66 -0.56,-0.44 -0.43,0.07 -0.42,1.36 -0.61,0.24 -1,-1.78 -1.04,-0.66 -1.62,-0.32 -0.59,-0.78 -0.56,-0.23 0.94,-0.96 1.72,-0.2 0.43,-0.53 1.5,-0.67 4.22,-0.65 1.75,-1.06 0.92,-1.04 -0.1,-0.34 3.09,-1.07 0.85,-1.4 1.54,-0.69 -0.62,-1.19 0.2,-1.03 1.08,0.18 0.79,-0.83 1.63,0.75 z m 103.8,0.38 0.56,2.73 -0.04,2.76 -0.25,1.95 -0.6,0.48 -0.4,1.03 -0.06,0.98 0.31,0.6 -1.41,1.21 -1.56,0.33 -0.49,2.18 0.39,1.59 -0.81,0.56 -1.63,0.32 0.86,0.28 -0.93,2.45 -0.79,0.33 -0.48,0.64 -2.28,-0.67 -1.46,-0.73 -0.59,-1.16 -1.17,-1.26 -1.17,0.3 0.1,0.53 -0.35,0.42 -0.57,0.02 -2.79,1.73 -1.16,-3.05 -0.65,-0.41 -0.68,-1.01 0.94,-1.54 -0.61,-1.04 0.14,-2.25 -0.34,-0.52 0.7,-0.37 -0.29,-0.79 0.42,-2.51 0.55,-1.25 0.9,-0.96 -0.55,-1.45 0.02,-0.25 0.43,0.24 -0.16,-0.64 1.01,-0.9 0.78,-0.08 1.38,-0.81 1.6,0.77 -0.75,0.59 -1.42,0.19 0,0.36 2.06,-0.45 0.9,0.94 1.8,-0.91 0.55,0.41 0,-0.37 0.5,-0.36 1.51,-0.27 1.52,-0.84 0.88,0.48 1.78,-2.15 3.15,0.18 0.7,1.42 z m -48.96,-0.57 0.27,0.36 0.95,0.22 1.28,1.26 1.08,0.17 1.13,1.3 -4.25,1.54 -1.61,-0.26 -1.33,1.26 -0.57,-0.09 -1.27,-1.07 0.15,-1.52 -0.28,-0.41 -1.49,-0.19 -1.42,0.47 -1.66,-1.26 -0.09,-0.95 0.79,-1.13 1.33,-0.65 0.33,-0.05 0.68,0.59 0.95,-0.74 1.14,-0.11 0.4,0.22 -0.27,0.88 0.25,0.18 0.77,-0.31 0.37,-1.21 0.8,-0.09 0.75,0.19 0.74,0.75 0.08,0.65 z m 25.61,-1.32 0.95,2.21 -0.46,2.8 -1.57,0.17 -1.62,1.48 -1.26,-0.27 -1,-1.07 -0.7,0.17 -1.53,-0.91 -0.21,-1.05 1.25,-0.41 1.25,-2.32 0.94,-0.53 3.01,-0.59 0.95,0.32 z m -56.7,0.79 -1.1,0.74 -1.15,0.16 0.33,0.6 -0.3,0.24 -1.46,0.1 -0.15,0.47 0.87,-0.08 0,0.32 -1.1,0.84 -0.02,0.55 -0.49,-0.12 -0.89,0.78 0.5,0.12 0.6,0.91 0.58,0.18 1.56,-1.99 0.56,0.81 0.58,-1.37 0.82,-0.29 0.48,0.99 0.81,0.03 0,-0.96 1.02,-0.65 1.66,1.78 0.05,0.77 0.69,0.05 1.48,1.21 -0.14,0.48 -2.72,3.11 -1.7,0.59 -0.24,1.5 -1.04,1.68 -1.5,0.78 -4.04,0.39 -1.54,1.1 -1.14,0.46 -1.08,0 -0.22,0.72 0.94,1.15 0.1,2.26 -0.4,0.82 -0.37,0.02 -0.53,0.67 -0.64,0.25 -1.23,-0.19 -1.65,-0.88 -1.23,0.14 -0.61,-0.61 -0.7,0.41 0.2,1.8 -0.69,0.26 -0.67,-0.14 -0.62,0.58 0.03,1.73 0.52,-0.43 0.55,0.31 1.49,-0.22 0.5,0.63 -0.19,0.8 0.45,0.47 -1.06,1.01 0.85,0.67 0.71,0.15 0.34,0.97 -0.59,0.47 -0.91,-0.06 -0.1,0.46 0.27,0.29 -0.72,-0.03 -1.37,-0.79 -0.33,-0.96 -0.64,-0.27 -0.44,0.98 0.57,1.86 -1.16,1.99 -0.61,-1.68 -1.01,-0.19 -1.09,0.86 -0.03,0.43 0.36,0.2 -0.16,0.67 -2.19,0.69 -0.34,-1.26 1.43,-3.43 1.22,-0.38 0.95,-0.89 -2.33,-0.17 0.15,-0.53 0.96,-0.49 0.01,-0.8 -0.93,-0.21 -0.87,0.65 -0.76,-0.16 -0.19,0.51 -0.58,-0.41 -0.15,0.5 -0.83,-0.11 -0.17,0.29 0.72,1 -0.08,0.4 -0.93,-0.17 -0.93,1.11 -0.54,-0.01 -1.23,-1.1 0.45,-1.44 -1.89,-2.63 0.08,-1.35 1.33,-0.82 0.69,-1.24 1.29,-0.6 0.75,0.7 -0.35,2.09 0.34,0.15 0.93,-0.55 0.63,-0.03 0.36,1.1 1.01,-0.55 0.37,0.52 2,-0.15 -1.16,-0.86 -0.09,-0.45 1.66,-0.04 0.16,-0.23 -2.73,-0.69 -0.64,-0.6 -0.45,-1.12 1.19,-0.5 1.37,0.33 0.92,-0.56 1.72,0.76 0.02,-0.65 -1.05,-0.83 0.35,-0.7 -0.25,-0.33 -2.38,-0.46 -2.6,0.73 -0.64,-0.42 2.56,-1.89 1.27,-1.35 0.88,-0.43 0.69,0.57 1.17,-0.93 1.16,0.12 -0.04,0.4 0.59,0.29 -0.17,0.99 0.29,0.18 0.52,-0.27 0.6,1.07 0.92,-0.2 -0.13,-1.5 1.01,0 1.12,0.42 0.41,-0.3 0.13,-0.49 -0.29,-0.72 0.47,-0.57 -0.13,-1.09 0.75,-0.37 0.29,0.18 0.35,-0.35 -1.07,-1.47 1.07,-0.63 0.73,0.29 0.3,-0.18 0.8,-0.98 -0.35,-0.47 0.28,-0.55 -0.49,0 0.25,-0.68 -0.24,-0.6 -2.79,0.95 -0.01,-0.89 0.91,-1.4 -0.31,-0.16 -0.61,0.66 -0.46,-0.17 -0.24,0.97 -0.33,0.09 -0.62,-1.04 1.19,-0.69 0.18,-0.73 -0.37,-0.31 -0.84,0.1 2.46,-1.78 0.77,-0.08 0.4,-0.73 0.95,-0.66 1.14,-2.64 2.94,-1.78 0.68,0.67 0.92,0.23 -0.38,0.54 -1.52,0.34 -1.82,1.13 0.55,-0.01 -0.15,0.48 0.63,0.06 0.26,0.92 0.67,-0.21 0.28,-0.9 2.53,-0.94 1.95,-2.44 1.02,3.65 -0.16,0.81 z m 52.72,-10.16 0.4,0.05 0.4,0.91 1.74,1.3 0.54,0.96 -0.85,1.88 -0.05,1.08 -0.75,0.47 -1.4,-0.2 -1.95,-3.15 -1.02,-0.88 -0.42,-0.84 0.1,-0.36 0.93,-0.47 0,0.5 0.58,-0.17 0.18,-1.51 1.57,0.43 z m -24.42,-0.15 0.31,0.15 0.6,-0.32 0.62,1.02 0.89,0.16 1.53,2.56 1.47,-0.2 2.47,-0.89 1.64,0.71 0.56,1.04 2.31,1.28 0.5,1.83 0.79,0.73 0.42,1.15 1.62,1.15 1.35,0.31 2,1.04 0.69,1.3 0.88,0.82 0.06,0.75 -1.65,2.51 -2.88,1.38 -0.52,-0.05 -0.69,-0.65 -0.49,-1.92 -1.49,-0.91 -0.05,-0.81 -0.42,-0.7 -2.09,-0.59 -1.21,-0.72 -0.49,-0.07 -0.61,0.39 -1.21,-0.9 -0.92,-1.16 0.66,-0.82 -0.28,-0.38 -1.29,-0.17 -1.36,-1.32 -0.5,-1.75 -0.65,-0.06 -0.27,0.81 -1.49,-0.1 -1.43,-1.09 0.48,-0.61 -0.5,-0.81 -0.43,-0.17 -1.12,0.55 -0.88,-0.6 -0.22,-1.6 1.55,-1.56 -0.28,-0.29 -0.05,-0.99 0.41,-0.66 0.8,0.01 0.86,1.22 z m 10.94,-0.32 2.32,-0.04 0.66,0.43 1.06,1.49 1.95,-0.14 0.63,0.62 1.46,0.24 0.31,0.21 -0.16,0.8 1.01,0.87 0.86,1.6 0.65,0.11 0.61,0.92 0.98,-0.15 1.08,0.95 0.1,0.52 -1.76,1.25 -0.46,0.68 -0.48,0.11 0.12,0.87 -0.89,0.93 -2.31,-0.71 -1.43,-1.2 -0.08,-2.01 -0.79,-0.92 -1.23,-0.67 -0.76,-1.15 0.04,-1.07 -0.95,-1.49 -1.97,-0.89 -2.59,-1.97 -0.47,-0.71 0.53,-0.69 0.66,0.88 1.3,0.33 z m 33.67,-1.33 2.31,0.21 1.27,0.7 -0.04,0.4 -0.8,0.58 0.44,1.75 -0.39,1.43 -2.34,3.74 -0.76,0.76 -2.31,0.71 -2.58,-0.7 -0.79,-0.72 -0.25,-0.85 -1.36,-0.69 -0.58,-0.89 1.52,-1.03 0.55,-1.11 0.86,-0.87 1.28,-0.44 0.86,-1.06 3.11,-1.92 z m -74.55,-3.48 0.36,0.67 1.28,0.72 0.28,1.66 -0.8,1.2 -0.89,0.3 -0.18,0.58 0.38,0.78 -1.13,0 -0.97,0.53 -0.5,1.16 -0.48,-0.81 0.7,-1.11 0.07,-0.71 -0.39,-0.54 0.12,-1.19 -0.57,-0.83 -0.04,-0.61 1.13,-0.55 0.06,-0.33 -0.41,-0.16 0.23,-0.32 1.75,-0.44 z m 99.15,-0.12 1.55,0.28 0.74,0.66 0.79,-0.05 1.47,1.91 0.65,1.5 0.18,0.61 -0.29,0.1 0.85,3.17 -1.62,1.69 0.76,0.19 0.2,1.55 0.46,0.65 -0.35,2 -2.82,4.97 -1.2,0.66 -2.51,2.21 -1.04,0.31 -0.95,-0.16 -2.82,1.21 -0.24,-0.08 0.05,-0.6 -3.98,2.3 -0.91,-0.12 0.01,-0.97 -1.89,-3.32 -1.7,-1.61 -0.1,-1.11 2.07,-2.79 2,-1.89 0.72,-1.54 1.04,-0.74 0.81,-0.29 3.71,0.17 1.02,-0.58 0.56,-1.8 -0.47,-2.75 0.63,-2.57 -0.15,-0.64 1.18,-1.54 1.59,-0.99 z m -47.77,-1.57 0.96,0.64 0.33,1.09 -0.77,-0.08 -0.55,0.81 -0.6,2.48 -0.46,0.62 -0.55,-0.13 -0.19,0.36 -1.1,0.11 -1.39,-0.18 -1.81,-1.54 -0.95,-0.44 0.53,-0.98 1.69,-0.69 0.9,-1 3.96,-1.07 z m 18.99,-2.51 0.29,0.82 -1.37,1.02 -1.58,-1.17 -1.72,-0.45 -0.76,-0.9 1.38,-0.82 1.64,0.14 1.47,0.5 0.65,0.86 z m -28.02,-6.26 1.06,0.52 0.36,0.79 1.14,-0.32 2.07,1.98 0.71,-0.3 0.73,2.11 0.93,-0.24 0.25,-0.92 0.48,0.92 1.57,1 -1.99,0.81 -0.84,-0.14 -1.19,0.71 -0.94,0.18 -3.2,2.89 -0.28,0.72 -1.82,1.2 -1.21,-0.25 0.47,-1.65 -1.02,-0.67 -2.43,1.3 -2.41,-0.67 -0.25,-0.51 0.43,-1 -0.07,-1.2 -0.23,-0.24 -0.7,0.21 -0.18,-0.41 0.73,-1.47 -0.54,-0.81 1.4,-1.01 0.21,0.3 -0.22,0.64 0.61,0.38 1.12,-0.06 1.45,1.2 0.5,-0.33 0.53,0.2 0.47,0.93 1.75,0.61 0.43,-0.15 -0.84,-1.67 -0.79,-0.7 0.6,-1.71 -0.91,-2.61 2.06,-0.56 z m 16.94,-0.68 0.63,0.14 0.8,-0.27 0.27,0.25 -0.58,0.29 -0.07,0.71 0.6,0.55 0.8,2.56 -0.05,0.49 -0.65,0.77 -2.04,0.71 -2.4,-1.05 -0.8,-1.44 0.35,-1.36 1.49,-1.73 0.88,-0.7 0.77,0.08 z m -9.67,-6.8 1.25,0.51 -0.15,1.41 0.58,0.3 0.08,0.77 1.03,0.68 0.95,-0.15 1.23,0.52 1.38,1.9 0.23,0.88 -0.22,0.76 -1.8,1.35 -1.22,0.29 -2.11,-0.3 -0.72,-0.76 -1.09,-0.36 -0.45,-1.15 -0.74,-0.66 -0.37,0.3 -0.71,-0.28 -0.58,0.27 -0.46,-0.49 -1.58,-0.1 -0.31,-0.26 -0.12,-1.67 0.78,-0.22 -0.06,-1.99 0.64,-0.51 1.72,0.53 0.71,-0.6 0.39,0.18 0.48,-0.96 1.24,-0.19 z m 40.18,-7.26 1.73,0.31 0.99,0.61 0.75,0.81 0.56,1.63 -0.64,1.92 -1.03,1.12 -1.02,0.54 -2.05,-0.47 -1.33,0.08 -1.55,-0.67 -0.8,-0.73 -0.3,-1.89 -1.96,-0.29 -0.99,-0.85 0.56,-1.1 0.97,-0.5 1.77,0.07 1.25,-0.54 -0.04,0.57 -0.47,0.17 -0.13,0.41 3.73,-1.2 z m -29.93,-7.39 1.34,0.53 0.66,1.14 -0.1,1.45 -0.42,0.6 0.29,1.25 -0.76,1.21 -2.69,0.46 -0.27,0.36 -0.82,-0.42 -1.39,0.18 -0.57,0.77 -0.52,0.04 -1.01,0.92 -0.51,0.02 -1.24,-1.3 -0.08,-1.65 0.71,-1.07 -1.09,-2.14 2.17,-1.14 1.54,0.23 3.01,-1.41 1.75,-0.03 z" title="Архангельская область" id="RU-ARK" />
                                <path d="m 193.37011,685.26082 -0.66,1.87 3.16,1.17 1.25,1.41 -0.07,1.05 0.8,0.28 -1.37,0.84 1.04,1.74 -0.33,0.23 0.42,0.58 1.45,0.9 0.22,-1.48 2.01,0.75 2.61,-0.19 0.94,0.9 1.42,2.59 1.63,0.2 0.9,3.45
                                 1.95,3.35 -0.66,0.77 -0.81,0.09 -0.35,-0.04 -0.68,-0.87 -0.54,-0.03 -0.5,0.43 -0.23,0.79 0.46,0.13 0.1,0.38 0.58,-0.01 1.33,1.39 2.34,1.1 0.57,0.76 -0.41,0.46 0.21,0.44 -1.06,1.19 0.2,0.36 -0.48,0.68 
                                 -0.18,-0.18 -0.37,0.41 -0.65,0.01 0.16,1.21 -1.08,-2.32 -0.34,0.03 0.69,1.43 -0.1,0.68 0.5,0.45 -0.11,0.42 -0.4,-0.03 -1.32,-1.42 0.19,0.82 -0.82,0.14 0.09,0.72 -0.74,-0.26 -1.09,1.88 -1.26,-0.52 
                                 -0.79,0.26 -0.74,0.71 -1.14,-1.57 -0.63,0.19 -0.21,0.6 0.86,1.01 -0.22,0.26 -0.46,-0.46 0.43,1.11 -0.46,0.08 0,0 -0.67,-0.6 0.52,-0.93 -1.43,-0.25 -1.28,0.49 -2.16,-0.05 0.93,-1.29 1.72,-3.66 -0.23,-0.42 
                                 -2,0.44 -0.31,-0.22 -0.04,-1.08 -0.31,-0.44 -0.82,-0.06 -1.01,-0.59 1.34,-1.28 1.4,-0.09 0.07,-1.11 0.41,-0.65 1.21,-0.53 0.28,-0.9 -1.01,-1.44 -0.78,-0.08 -0.51,-1.05 -0.56,-0.21 -2.37,-4.38 0.83,-1.06 0.92,-0.42 0.26,-0.44 -1.11,-0.33 -1.98,2.18 -2.58,-2.08 -1.94,-2.43 0.1,-1.74 -0.67,-0.23 -0.66,0.26 -1.79,-1.43 0,0 -0.9,-0.93 -0.92,-0.29 -0.39,-0.64 1.17,-1.87 1.46,0.27 -0.06,-0.44 -0.83,-0.2 0,-0.38 2.31,-0.24 2.01,-1.33 1.42,-1.75 1.36,0.06 0.9,0.48 1.43,0.99 0.19,0.62 0,0 z" title="Астраханская область" id="RU-AST" />
                                <path d="m 249.44011,593.83082 1.56,-2.41 0.65,0.21 0.35,0.91 0.74,0.19 0.71,0.68 1.61,-0.53 1.23,0.75 0.66,-0.21 0.89,-0.85 1.57,-0.49 0.49,0.1 1.32,2.47 0.43,0.26 1.15,-0.34 1,-0.85 0.67,-0.04 2.65,3.47 0.63,0 1.79,-0.95 0.13,-0.54 1.38,-1.44 0,0 0.15,0.68 0.71,0.85 -0.28,0.65 0.45,0.47 1.08,-0.48 0.66,0.04 1.06,0.77 0.45,0.08 0.86,-0.55 1.01,0.14 0.3,0.35 1.76,-0.98 1.83,1.2 0.77,0.14 0.76,-0.95 0,0 0.57,-0.33 0.45,0.25 1.06,-0.26 0.34,0.5 -0.05,0.36 -1.07,0.82 0.19,1.2 -0.74,1.54 1.35,0.86 -0.21,0.52 0.2,1.13 0.68,-0.24 0.67,0.6 1.02,0.04 -1.09,1.59 -2.21,0.32 -0.28,0.4 0.19,0.69 -0.9,0.87 -0.43,0.18 -1.1,-0.56 -0.76,0.57 0.04,0.46 -0.74,0.78 1.08,0.46 0.42,1.02 -0.88,0.87 -0.81,0.33 -0.58,-1.08 -0.39,0.16 -0.39,-0.33 -1.11,-1.69 -0.69,0.69 -0.17,0.99 -1,1.51 -0.31,-0.11 0.56,-0.94 -0.32,-1.41 0.65,-1.05 -0.25,-0.59 -3.6,-0.78 -2.03,1.16 -1,2.04 1.07,1.26 -0.71,1.49 3.92,3.1 0.26,0.91 1.08,1.3 0.49,0.15 0.6,-0.15 1.22,-1.22 1.29,-0.34 1.55,0.83 0.62,-0.04 0.56,-1.08 2.16,-0.8 0.61,0.34 0.51,-0.12 1.46,-1.45 0.62,-1.33 0.61,-0.23 0.53,-0.75 0.44,0.75 1.1,-0.18 -0.31,0.8 0.39,0.82 -0.87,2.17 -0.87,0.79 0.36,0.78 -0.6,0.87 0.9,0.7 -0.36,1.94 -1.07,-0.41 -1.94,0.21 -0.8,1.98 -0.73,0.65 -1.03,0.21 -0.31,3.1 -0.64,1.13 0.41,0.68 0.05,1.14 -0.05,1.74 -0.4,0.33 0.55,0.64 0.15,1.28 0.4,0.64 -0.95,1.13 -0.18,2.94 -0.29,0.63 0.71,1.15 -0.36,0.68 0.34,0.56 0,0 -0.11,0.34 0.53,1.28 -0.44,0.62 -0.59,-0.18 -0.45,0.32 -0.27,1.51 0.63,0.67 -0.8,2.93 -0.58,0.62 -0.99,0.12 -1.12,0.64 -0.41,-0.07 -0.71,-0.92 -1.55,-0.44 -0.65,0.1 -0.31,-0.36 -0.44,0.1 -0.85,1.8 -1.17,-0.33 -0.1,0.99 -1.22,0.79 -1.13,-1.47 -0.98,-0.62 -0.39,0.24 0.36,1.18 -0.39,0.52 -0.65,-0.11 0.28,-1.08 -1.26,-2.03 0.66,-0.99 -0.79,-1.69 -1.33,-1.35 -0.31,0.01 -0.54,0.9 -0.7,-0.73 1.18,-1.16 0.28,-0.81 -0.15,-1.19 -0.58,-0.77 0.41,-0.79 -0.22,-0.22 -0.51,0.38 -1.67,-1.15 -0.31,1.27 -1.62,2.2 -2.01,-0.6 -0.51,-2.12 -0.75,-0.63 -0.54,0.14 -0.32,-0.35 0.25,-0.58 0.59,0.15 0.36,-0.38 -0.28,-0.22 -0.18,-1.22 -1.22,0.38 -0.56,-0.38 -0.03,-0.74 -0.82,-1.26 -0.5,-2.49 -0.34,-0.28 -1.63,0.35 -0.83,-1.42 -1.31,-0.6 -0.8,0.09 -1.17,-0.99 -1.68,-2.6 -1.31,-1.37 -1.02,-2.17 -0.71,-0.81 0,0 0.25,-0.82 -0.39,-1.75 0.39,-2.27 0.29,-1.14 1.18,-1.97 -0.24,-1.24 0.61,-1.11 -0.3,-0.45 -0.92,0.04 -0.7,-1.08 -1.08,-0.9 -0.86,-0.27 0.29,-0.65 1.72,-0.69 0.78,0.02 1.06,-1.37 1.59,-0.87 0.38,-1.21 0.45,-0.47 -0.07,-0.82 1.37,-1.25 -0.04,-1.02 -0.9,-0.47 0.16,-0.23 -0.53,-0.33 -0.52,-1.17 -1.06,-0.5 0,0 0.38,-0.72 1.8,-1.25 0.71,-1.51 1.34,-0.71 z" title="Республика Башкортостан" id="RU-BA" />
                                <path d="m 113.12011,658.61082 0.68,0.15 0.35,0.68 1,-0.17 0.6,-0.46 0.62,0.29 0.48,-0.82 0.55,-0.14 0.17,-0.52 -0.44,-0.24 0.63,-0.71 0.6,0.66 0.95,-0.35 0.66,0.47 1.89,0.41 1.4,-1.18 1.81,-0.31 0.72,-1.15 1.49,-0.33 0.47,-0.37 1.5,-0.1 1.09,0.27 0.97,-0.66 0.76,-0.06 2.4,1.68 0,0 1.27,0.35 0.2,0.43 -0.04,0.56 -0.64,0.39 0.09,0.79 1.58,0.53 0.94,-0.82 0.66,0.59 -0.17,0.81 0.53,0.56 -0.25,0.31 -0.73,-0.25 -0.2,0.94 0.75,0.41 -0.11,0.52 0.58,0.75 0.53,-0.03 0.46,0.7 1.09,0.41 -0.12,0.36 -0.67,-0.03 0.29,0.69 -0.53,0.69 0.58,1 -0.23,0.55 0.44,1.93 0.84,0.78 0.07,0.58 -0.6,1.59 -0.45,0.31 0,0 -0.4,-0.64 -0.36,0.48 -1.14,0.37 -0.24,-0.69 -1.3,-0.47 -0.43,-1 -0.17,0.44 -1.15,-0.1 -0.19,-0.35 -0.52,0.13 -0.47,-1.1 -1,0.11 -0.07,0.82 0.26,0.31 -1.38,0.58 0.1,-0.37 -0.94,-1.16 -1.13,-0.4 -0.77,-0.9 -0.04,-1.44 -0.46,0.07 -0.72,-0.61 0.02,-0.93 -0.54,0.29 -0.53,-0.11 -1.21,0.8 -2.21,0.16 -1.42,1.19 -0.63,-0.32 0.16,-0.49 -0.27,0.16 -0.71,-0.54 -1.03,0.46 -0.25,-0.73 -0.9,-1.01 -0.58,-0.17 -1.72,0.16 -0.68,1.01 -0.77,-0.01 -0.35,-1.19 -0.51,-0.17 -0.71,-1.21 0.04,-0.76 0.61,-0.22 -0.09,-1.07 -0.68,-1.22 0.07,-0.61 -0.44,-0.18 0.02,-0.77 z" title="Белгородская область" id="RU-BEL" />
                                <path d="m 99.870108,623.48082 1.130002,-0.16 0.97,0.59 0.83,1.46 0.36,-0.15 0.28,0.35 1.35,-0.42 0.2,0.53 1.06,0.78 0,0.49 0.74,0.46 0.16,2.9 0.68,0.52 0.67,0 1.18,0.56 0.96,-0.13 0.78,0.94 0,0 0.09,1.35 -0.35,0.25 1.24,0.67 -0.12,0.81 -0.77,0.01 0.02,0.65 -0.83,0.26 -0.36,-0.59 -0.11,0.56 -0.7,-0.11 0.09,0.61 -0.75,0.25 0.6,1.1 0.31,-0.36 0.47,0.53 0.52,-0.07 -0.23,0.51 0.33,0.54 -0.24,0.35 -0.45,-0.15 0.3,0.62 -0.27,0.39 0.49,0.43 -1.34,1.08 -0.03,0.68 0.4,-0.1 0.46,0.49 0,0 -1.03,1.71 -0.26,0.15 -0.57,-0.33 -0.37,0.26 0.3,0.67 -0.27,0.77 -1.44,-0.05 -0.89,0.68 -0.18,0.97 0.83,0.28 -0.62,0.76 0,0 -0.19,-0.17 -0.34,0.32 0.08,-0.57 -0.28,0.03 -0.61,-0.93 -0.44,-0.13 -0.07,-0.97 0.32,-0.62 -0.36,-0.69 -0.87,-0.63 -0.14,-0.64 -0.57,-0.02 -0.09,-0.63 -0.76,0.03 -1.540002,0.72 0.14,-0.66 -0.88,-0.12 -0.45,0.25 -1.07,-0.43 -0.13,0.43 -0.69,0.4 -0.2,-0.15 -1.03,0.86 -0.21,-0.35 -1.38,0.23 -0.91,-0.86 -1.25,-0.22 -0.2,0.33 0.27,0.76 -0.48,0.2 0.23,1.06 -0.45,0.62 -0.63,0.4 -0.36,-0.14 -0.63,0.54 -1,-0.08 0.12,-0.63 -1.02,-0.14 -0.19,-0.99 -0.72,-0.12 0.19,-0.92 -0.81,-0.38 0.22,-1.19 -0.28,-0.44 0.19,-0.52 -0.27,-0.15 0.22,-0.51 0.2,0.21 0.23,-0.34 -0.66,-0.45 -0.42,-1.15 0.4,-0.17 0.23,-0.85 -0.52,-0.62 0.07,-0.38 -0.9,-0.47 -0.33,-0.9 -0.85,-0.71 0.5,0.07 0.2,-0.64 0.38,-0.11 -0.15,-0.41 0.35,-0.82 1,0.04 0.46,-0.48 0.87,0.31 0.54,1.04 0.61,0.04 0.13,0.35 2.12,-0.12 0.1,-0.37 0.61,-0.1 0.2,-0.51 0.67,-0.19 0.58,-0.94 -0.14,-0.26 0.64,0.07 0.67,-0.58 0.36,0.06 0.05,-0.68 0.33,-0.1 -0.25,-0.18 0,0 0.7,-0.39 0.41,0.27 0.03,-0.87 0.35,-0.47 -0.15,-0.46 1.09,-0.9 0.52,-0.94 0.44,0.12 0.15,-1.11 0.4,0.28 0.34,-0.39 -0.53,-0.67 0.54,-1.19 0.56,0.5 0.34,-0.34 -0.2,-0.34 z" title="Брянская область" id="RU-BRY" />
                                <path d="m 570.72011,636.34082 0.29,-0.95 0.86,-0.64 -0.01,-0.64 1.77,-0.25 1.73,-1.09 0.06,-1.21 1.71,0.17 0.31,-0.77 0.88,-0.27 0.65,1.56 0.04,1.64 0.59,0.97 2.26,1.53 0.91,1.32 3.54,2.19 1.66,1.68 0.59,1.43 1.11,0.5 1.19,1.11 0.79,-0.48 1.31,0.35 0.8,-0.24 1.02,0.44 0.17,1.2 0.47,0.2 1.41,1.98 1.99,0.93 0.69,1.85 -0.14,1.26 0.29,1.06 0.63,0.6 2.37,0 1.04,0.77 0,2.92 0.74,-0.2 0.57,-0.6 1.07,-0.23 0.46,-0.55 1.4,-0.16 0.64,-0.41 0.43,0.28 0.48,-0.51 -0.02,-1.43 0.57,-1.04 4.81,-2.68 8.16,-9.53 7.53,-4.49 3.87,-3.82 2.93,-8.8 0.26,-5.76 0.45,-0.6 -0.52,0.02 0.57,-1.31 0.49,-0.4 -0.07,-2.48 0.27,-0.84 -0.21,-1.49 0.45,-2.09 -0.61,-0.4 -0.1,-0.45 -0.08,-2.06 0.42,-0.67 -0.17,-0.86 0.49,-0.36 1.07,-3.83 0.74,-0.24 1.25,0.16 0.38,-0.6 -1.26,-0.76 -0.52,0.04 -0.94,-2.52 -1.02,-0.4 -0.95,-1.13 1.08,-1.7 0.07,-0.65 -0.38,-0.24 0.2,-0.33 1.7,-0.24 1.12,-1.09 0.86,0.05 1.99,-0.79 1.45,0.3 1.26,-1.09 0.26,-1.53 0.67,-0.9 2.72,0.53 1.36,1.12 1.21,-0.39 0.64,0.28 1.21,-0.13 0.97,0.55 1.33,-1.25 -0.06,-0.61 0.64,-1.22 1.07,-0.94 0.48,0.2 1.42,2.4 0.38,0.09 0.4,-0.49 1.25,0.18 0.93,0.91 1.53,0.27 1.23,-1.38 0.6,0.06 0.08,1.83 1.35,1.33 2.59,0.9 2.34,-0.45 1.44,0.78 0.27,0.74 0.85,0.17 0.4,-0.1 0.26,-0.83 1.01,-1.04 2.14,0.33 0.63,-0.51 1.59,-0.02 0.4,-0.35 0.4,-1.39 1.42,-2.14 0.01,-1.38 3.95,-0.07 1.31,-1.39 2.11,-0.12 0.99,1.22 -0.86,0.33 -2.61,2.23 0,0 0,0 0,0 0,0 0,0 -1.16,1.07 0.21,1.86 -1.17,1.19 1.63,0.88 0.34,1.15 0.35,0.25 0.09,0.44 -0.6,0.17 -0.01,0.8 1.03,2.43 -0.42,1.94 0.61,1.34 -0.2,1.66 0.51,1.52 0.24,3.58 1.6,0.55 1.64,-0.11 1.49,2.21 1.47,1.02 0.9,2.56 -0.6,2.22 -0.4,0.29 0.01,0.72 -0.72,0.94 -1.24,0.15 -0.31,0.3 -1.54,-0.15 -5.12,1.51 -0.78,1.48 -1.68,0.93 -2.64,2.35 -1.71,0.65 -0.87,1.62 -1.04,0 -0.21,0.39 -2.43,0.83 -0.99,1.19 0.01,2.46 0.69,0.67 0.01,0.95 1.14,0.88 0.53,-0.06 0.14,0.73 -0.47,0.47 0.27,0.3 1.12,0.18 -0.23,1.5 -0.31,0.16 -0.11,1.24 -1.21,1.7 -2.09,0.6 -1.49,1.78 -3.17,0.34 -1.42,1.2 -2.32,-0.13 -0.6,0.26 -0.8,1.19 -1.54,-0.33 -0.3,-0.41 -0.67,0.18 -3.12,3.95 -4.16,1.63 -0.51,0.92 -0.93,0.66 -0.22,1.07 -1.1,0.83 -1.75,-0.2 -0.43,-0.82 -2.78,-0.09 -1.16,0.6 -1.23,1.32 -2.76,0.88 -1.28,-0.66 -0.09,-0.43 -2.46,0.14 -0.84,-0.58 -0.08,1.02 -0.33,0.22 -0.38,-0.19 -0.21,1.3 -0.6,1.11 1.27,1 -0.77,0.7 -1.06,0.27 -0.34,2.94 -0.95,0.5 -0.17,0.52 0.73,0.75 1.71,0.58 0.58,0.81 1.03,0.11 -0.35,0.82 -1.06,-0.28 -1.1,0.75 -0.8,0.14 -0.92,0.82 -0.59,-0.09 -0.56,1.34 -1.33,0.88 0.16,0.94 0,0 -0.35,0.31 -0.81,-0.04 -1.3,-0.19 -0.52,-0.51 -0.4,0.33 -0.89,-0.31 -1.29,-2.26 -1.5,-1.11 -1.36,-0.29 -2.07,0.58 -1.34,-0.62 -0.32,-0.68 -3.13,-0.23 -1.6,-0.53 -0.6,0.05 -1.33,0.92 -1.16,-0.06 -2.64,0.95 -1.32,0.09 -0.86,0.59 -0.41,0.74 -1.2,0.36 -1.84,-0.61 -0.96,0.78 -1.65,-0.86 -0.86,0.16 -0.67,-1.18 -2.23,-0.08 -0.65,-0.72 -1.31,-0.57 -0.8,-1.16 -0.91,-0.21 -0.73,-0.55 -0.06,-0.56 0.46,-1.01 -0.95,-1.15 0.3,-1.41 -0.52,-1.21 -0.31,-2.19 0.44,-0.67 -0.93,-0.81 -2.43,-0.78 -0.62,0.11 -0.57,-0.56 -0.71,0.02 -0.73,0.46 -0.98,-1.01 -0.7,0.04 -4.5,-2.39 -3.74,-0.04 -1.91,-1.71 -2.91,-0.7 -0.35,-0.68 -1.61,-0.6 -0.42,-0.6 0,0 -0.13,-1.08 -0.99,0.1 -0.24,-0.24 0.13,-0.76 -1.22,0.17 0,-1.84 1.2,-1.23 0.11,-0.99 0.73,-0.72 0.23,-1.42 -0.54,0.09 -0.19,-0.26 0.23,-0.94 0.8,-0.52 0.65,0.6 0.71,0.17 z" title="Республика Бурятия" id="RU-BU" />
                                <path d="m 186.10011,733.31082 1.55,0.73 0.84,-0.33 1.33,0.34 -0.03,1.21 0.53,-0.51 0.92,-0.14 -0.1,-0.59 1.09,-0.91 0.58,0.78 -0.01,0.45 0.72,0.38 0.1,0.42 -0.16,0.84 -1.64,2.84 0.79,2.03 -0.14,1.34 0.53,0.27 -0.11,0.82 0.27,0.39 -0.76,0.77 -0.31,-0.04 -0.21,-0.47 -0.91,0.3 -0.74,0.61 0.63,0.87 -1.32,0.37 -0.22,0.94 -0.55,-0.08 -0.27,0.66 -0.94,0.54 0,0 -1.46,-0.83 -1.71,0.15 -1.18,-1.6 -0.56,0.02 0,0 0.51,-0.64 -0.09,-0.63 0.44,-0.63 -0.29,-1.1 0.96,-1.81 0.06,-1.18 -0.8,-0.38 0.14,-0.89 -2.08,-0.97 0,0 0.23,-1.06 0,0 0.33,0.14 0.82,-0.54 0.16,-1.89 0.85,-0.21 0.28,0.82 1.05,0.03 0.53,-0.37 -0.04,-0.93 z" title="Чеченская республика" id="RU-CE" />
                                <path d="m 282.62011,596.63082 0.15,-1.04 0.41,0.11 0.52,-0.4 -0.16,-1.24 0.8,-0.42 0.81,0.46 1.75,0.18 0.68,1.1 1.74,-0.42 1.16,0.41 2.04,-0.55 1.19,0.72 0.84,-0.25 0.6,0.33 2.6,-0.27 -0.5,-1.23 0.96,-0.76 0.86,0.39 0.82,-0.28 0.7,0.77 1.24,-0.06 0.09,0.5 0.78,0.28 0.39,0.91 1.05,0.45 0,0 1.22,1.64 0.28,1.35 0.9,0.05 -0.32,0.62 1.58,1.53 -0.26,0.39 0.38,1.49 -0.56,0.67 0.69,0.19 -0.22,0.83 -0.65,0.39 -0.7,0.26 -1.41,-0.17 0.35,1.34 -1.1,0.45 1.41,2.45 -0.45,1.18 -0.37,0.01 -0.5,-0.55 -0.77,0.21 -0.04,0.71 0.91,2.15 -0.28,0.65 1.01,1.02 2.14,-0.88 0.61,0.38 -0.26,0.52 1.31,0.16 1.98,-0.71 1.53,0.1 0.6,2.3 -1.21,0.77 0.24,0.64 -0.31,0.6 1.44,1.27 0.39,0.03 0.1,0.8 0,0 -1.51,0.06 -0.04,0.8 -0.3,0.24 -2.18,-0.1 -0.12,0.42 -1.48,1.17 -0.31,1.04 -0.78,-0.45 -0.2,-0.72 0.54,-0.37 -0.49,-0.36 -1.54,0.28 -0.95,-0.28 -0.5,0.33 0.28,0.9 -0.43,0.11 -0.77,-0.25 0.24,-0.51 -0.42,-0.02 0.03,-0.28 -0.45,0.59 -0.39,-0.55 -0.56,0.21 -0.33,0.71 -0.23,-0.5 -0.61,-0.3 -0.25,-0.78 -0.48,-0.07 -0.63,0.19 -0.36,0.48 0,1.42 -0.49,-0.07 -0.22,-0.46 -0.93,0.11 -0.27,0.67 1.05,0.2 0.59,1.02 -1.23,1.19 -0.04,0.69 -0.3,-0.34 -0.58,0.03 -0.02,0.6 3.15,0.7 1.06,-0.39 0.61,0.8 -1.03,0.8 -0.48,-0.42 -0.86,-0.12 -0.16,0.79 -0.55,0.61 0.17,1.08 1.53,0.35 0.88,0.64 0.74,-0.03 0.33,-0.43 0.94,1.09 2.24,0.53 0.19,1.32 -0.93,0.64 -0.94,-0.71 -1.16,0.17 -0.53,0.41 -1.3,-0.86 -0.63,0.57 -0.97,-0.53 -0.86,0.73 -0.66,-0.12 0.35,0.81 -1.57,1.65 -0.9,0.25 -0.1,1.15 0.91,0.42 0.05,1.19 0.9,0.16 0.7,1.95 -0.77,0.75 -1.22,0.49 -0.52,0.73 -1.37,0.04 -1.86,1.79 -1.11,0.17 0,0 -0.95,-0.66 0.77,-1.71 1.02,-0.89 -0.37,-1.77 -1.52,0.17 -0.96,-0.66 -0.26,0.22 -0.85,-0.42 -0.88,0.28 -0.23,-0.47 -0.32,0.05 -1.4,0.59 -0.23,0.63 0.25,1.09 -1.4,-0.83 -0.58,-1.13 -1.03,0.02 0,0 -0.34,-0.56 0.36,-0.68 -0.71,-1.15 0.29,-0.63 0.18,-2.94 0.95,-1.13 -0.4,-0.64 -0.15,-1.28 -0.55,-0.64 0.4,-0.33 0.05,-1.74 -0.05,-1.14 -0.41,-0.68 0.64,-1.13 0.31,-3.1 1.03,-0.21 0.73,-0.65 0.8,-1.98 1.94,-0.21 1.07,0.41 0.36,-1.94 -0.9,-0.7 0.6,-0.87 -0.36,-0.78 0.87,-0.79 0.87,-2.17 -0.39,-0.82 0.31,-0.8 -1.1,0.18 -0.44,-0.75 -0.53,0.75 -0.61,0.23 -0.62,1.33 -1.46,1.45 -0.51,0.12 -0.61,-0.34 -2.16,0.8 -0.56,1.08 -0.62,0.04 -1.55,-0.83 -1.29,0.34 -1.22,1.22 -0.6,0.15 -0.49,-0.15 -1.08,-1.3 -0.26,-0.91 -3.92,-3.1 0.71,-1.49 -1.07,-1.26 1,-2.04 2.03,-1.16 3.6,0.78 0.25,0.59 -0.65,1.05 0.32,1.41 -0.56,0.94 0.31,0.11 1,-1.51 0.17,-0.99 0.69,-0.69 1.11,1.69 0.39,0.33 0.39,-0.16 0.58,1.08 0.81,-0.33 0.88,-0.87 -0.42,-1.02 -1.08,-0.46 0.74,-0.78 -0.04,-0.46 0.76,-0.57 1.1,0.56 0.43,-0.18 0.9,-0.87 -0.19,-0.69 0.28,-0.4 2.21,-0.32 1.09,-1.59 -1.02,-0.04 -0.67,-0.6 -0.68,0.24 -0.2,-1.13 0.21,-0.52 -1.35,-0.86 0.74,-1.54 -0.19,-1.2 1.07,-0.82 0.05,-0.36 -0.34,-0.5 -1.06,0.26 -0.45,-0.25 z" title="Челябинская область" id="RU-CHE" />
                                <path d="m 1063.1501,377.29082 -0.76,-0.54 1,-2.08 1.5,-0.95 -0.1,-0.38 0.52,-0.1 0.57,-0.71 0.65,-0.12 -0.05,0.27 1.2,0.04 -0.05,0.4 0.81,0.12 -0.13,0.46 0.62,-0.14 -0.1,0.2 0.55,0.18 -0.13,0.25 0.44,-0.53 0.33,0.72 2.74,0.54 1.45,0.87 0.24,0.96 -0.28,1.07 -0.94,-0.12 -0.13,0.34 0.41,0.5 -0.38,0.22 0.27,1.12 -0.38,1.53 -0.51,0.67 -0.87,-0.22 -1.06,0.17 -3.86,-1.57 -1.73,-1.28 -0.18,-0.69 0.27,-0.16 -1.93,-1.04 z m 140.03,95.59 0.65,-0.23 0.44,0.55 -0.36,0.4 -1.28,-0.13 -0.44,-0.36 0.32,-0.58 0.67,0.35 z m -62.95,-121.12 -0.2,-1.92 1.87,-2.22 0.09,-1.06 2.02,-1.29 2.18,-3.11 1.52,-1.12 -0.09,0.36 0.48,0.09 0.3,-0.64 0.5,-0.1 0.46,-1.06 0.51,-0.27 0.05,0.28 1.47,-0.04 -0.54,-0.36 0.17,-0.34 0.52,0.14 0.4,-0.62 0.07,0.59 0.24,0.03 0.5,-0.8 0.14,0.48 0.55,0.03 0.02,0.46 0.46,-0.29 0.95,0.44 0.4,-0.33 0.31,0.19 0.96,-1.12 3.17,0.46 -0.01,0.29 0.77,-0.01 2.04,0.98 -0.62,0.11 0.76,0.49 -0.11,0.5 0.73,-0.06 0.04,-0.41 0.26,0.15 0.75,0.8 -0.49,0.29 0.4,0.43 -0.54,-0.02 1.05,0.31 0.69,1.2 1.65,1.7 0.65,-0.18 0.03,0.54 0.53,0.65 -0.21,1.47 -0.49,0.3 -0.27,0.79 -2.38,1.81 -1.69,0.27 -1.83,0.88 -2.6,0.39 -3.29,1.54 -2.32,0.54 0.64,-0.46 -0.73,-0.77 -0.9,-0.69 -2.15,-0.57 -0.88,0.29 -1.5,1.68 -1.17,0.69 -0.63,0.08 -0.4,-0.31 0.84,0.16 0.21,-0.18 -0.31,-0.35 -0.43,0.24 -1.21,-0.11 -3.48,2.03 0.21,-0.29 -0.24,-1.8 -0.85,-2.25 z m 83.76,95.28 0.2,1 -0.47,1.29 -0.63,-0.04 -0.69,-0.66 -0.82,0.16 -0.91,0.44 -2.75,2.83 0.38,0.82 -0.36,0.6 0.17,2.05 -0.55,0.89 -1.91,-0.27 -0.13,-0.51 -2.12,-0.9 -0.72,-1.42 -1.11,-0.96 -0.41,-0.02 0.45,0.38 0.27,0.99 0.86,0.7 -0.38,-0.07 -0.03,0.45 0.59,0.75 1.22,0.48 0.57,0.76 -0.05,1.49 -0.47,0.56 -1.6,-1.1 -4.55,1.04 -0.22,-0.08 1.45,-0.58 -1.43,-0.13 -0.89,-0.71 -0.6,0.37 -0.29,-0.29 -0.45,0.07 0.24,-0.65 -0.63,-0.69 0.04,-0.4 -0.77,-0.63 -1.25,0.22 0.08,-0.4 -1.24,0.45 0.84,0.11 0.04,0.87 0.82,-0.03 1.09,0.63 -0.24,0.69 0.61,1.12 -0.96,0.16 0.62,0.75 1.23,-0.29 0.69,-0.81 -0.96,2.93 0.29,0.47 -0.18,1.39 0.89,1.98 -1.35,2.1 -0.89,0.78 -0.93,-0.11 0.08,0.3 -1.77,1.14 -1.35,-0.56 -0.97,0.6 0.16,0.49 -0.9,0.43 0.04,0.39 0.92,-0.38 0.99,-1.09 1.19,1.29 -0.24,0.59 -0.42,0.07 -0.06,0.57 -0.89,0.13 -0.66,0.48 0.04,0.23 0.76,-0.21 0.23,-0.36 0.58,0.3 -1.03,1.55 0.67,-0.04 0.31,-0.69 0.41,-0.07 0.5,0.12 0.09,0.41 0.59,0.01 0.34,0.49 1.11,0.15 0.39,1.13 0.97,1.2 -1.5,0.01 -1.11,0.5 -0.94,-0.47 -0.3,-1.8 -1.36,0.33 -0.52,0.55 0.08,0.26 1.13,-0.37 0.49,0.61 -0.36,2.12 -0.76,0.66 -1.23,0.27 -1.8,-0.86 0.07,-1.23 0.69,-0.6 0.11,0.31 0.62,-0.87 -0.67,0.26 0.3,-1.67 -0.38,0.08 -0.1,-0.98 -0.31,0.01 -0.17,-0.44 0.46,1.98 -0.15,0.79 -1.64,1.74 -0.7,0.09 -2.53,-1.57 -0.41,-1.94 -1.69,-1.51 0.44,-0.15 -0.12,-0.33 -0.95,0.28 -2.96,-2.19 -1.08,-0.45 -0.88,0.44 -1.95,-0.22 -0.23,-0.26 -0.46,0.25 -0.12,-0.42 0.5,-0.64 -0.73,0.04 -0.05,-0.68 -2.04,-1.01 0.01,-0.41 -0.87,-0.48 0.75,-0.64 0.36,-1.75 -0.96,-1.68 -0.32,-2.88 -0.58,-0.43 -7,-2.88 -1.01,0.14 -1.52,1.84 -1.03,0.43 -2.15,0.28 -0.42,-0.28 -0.88,0.18 -1.29,-0.26 -1.02,0.3 -1.9,-0.85 0.84,-3.79 -0.38,-0.59 -0.89,0.29 -0.74,-1.15 -0.08,-0.74 -1.19,-1.09 0.4,-0.46 -0.16,-1.03 0.64,0.15 0.65,-0.78 -0.11,-0.99 1.32,-0.76 -0.2,-0.83 0.45,-0.85 -0.41,-0.41 0.49,-0.68 -0.15,-1.75 -0.28,-0.27 -0.26,0.86 -0.39,-0.09 -0.96,2.88 -0.85,0.61 -0.57,0.07 -0.7,-0.53 0.05,-0.45 -0.43,-0.59 0.29,-0.47 -0.09,-1.81 -0.41,0.35 -0.07,1.34 -0.26,0.15 -1.63,-0.76 0.02,0.55 1.26,1.49 -0.23,0.62 -1.1,0.82 -1.03,-0.19 -0.48,-0.8 -0.63,0.06 0.15,0.29 -0.68,1.08 -0.19,3.28 1.09,2.73 2.5,1.96 -0.41,1.04 0.49,0.64 -1.53,2.14 0.12,0.65 -0.36,0.71 -0.16,1.63 -0.99,1.73 -0.74,0.1 -0.9,1.04 -1.82,1.27 -2.27,3.19 -2.87,0.81 -4.1,3.24 -0.33,-0.39 0.8,0.01 1.31,-0.99 -0.33,-0.49 -2.75,0.61 -1.65,-0.59 -0.88,0.43 -0.13,-0.61 -2.08,-0.16 -0.62,-1.06 -0.67,-0.15 0.06,-0.58 -0.59,0.12 -0.38,-0.4 0.88,-0.5 -0.31,-0.2 0.08,-0.77 -0.28,-0.27 -1.32,0.11 -0.09,1.07 0.58,0.69 -1.91,0.91 -0.25,-0.49 -0.47,-0.02 -0.14,-0.72 -0.36,-0.21 -0.44,0.24 -0.59,-0.41 -0.66,-0.07 -0.82,0.92 -0.68,0.04 -0.12,-0.83 -1.37,-0.6 -0.99,-0.78 -0.02,-0.33 -0.42,0.02 -0.73,0.97 -0.37,1.21 -0.95,0.85 -0.55,0.3 -0.67,-0.53 -1.55,0.71 -0.92,-0.19 -0.4,0.36 1.23,0.44 1.13,-0.72 1.38,0.26 1.54,-1.1 0.5,-0.75 0.08,-0.94 0.97,-0.01 0.47,0.33 0.74,1.87 0.92,1.09 -0.09,0.58 -1.66,0.81 -0.17,0.46 0.19,0.11 0.3,-0.42 0.77,0.18 0.58,-0.37 0.31,-0.76 0.54,0 1.09,0.72 0.4,1.38 2.23,-2.81 1,0.07 1.02,-0.83 1.13,0.17 -0.16,1.98 -0.54,1.07 0.05,1.21 0.53,1.27 2.6,2.85 1.38,0.66 0.86,-0.08 -0.4,-0.5 1.53,-1.76 -0.75,-1.71 3.06,6.86 1.01,5.48 0.12,2.4 0.55,1.89 1.48,2.5 1.65,1.13 0.88,1.32 0.1,0.82 -1.04,0.15 -0.36,1.15 0.48,1.51 1.3,0.27 0.3,0.33 0.49,2.46 -0.23,0.95 -0.96,0.55 -0.09,0.94 -0.6,0.87 -1.08,-0.23 -0.54,0.51 -0.19,0.56 0.52,0.49 -0.27,0.5 0.21,0.58 -0.56,0.66 -0.51,-0.94 -5.04,-1.84 -1.75,-1.11 -3.71,-0.5 -3.15,0.33 -1.35,0.42 -2.51,1.3 -2.48,2.24 -1.73,0.43 -3.06,1.46 -2.41,2.12 -2.92,1.5 -0.64,0.87 -1.6,0.71 -0.53,-0.21 0,0 0.09,-0.72 -0.51,-0.45 -0.17,-0.95 -0.58,-0.48 -0.3,-1.28 -0.85,0.21 -0.49,-0.36 -0.15,-1.85 -0.75,-0.44 1.2,-1.4 -0.36,-1.17 -0.63,-0.49 -0.91,-0.07 -0.34,-0.67 -0.78,-0.25 -4.25,1.44 -2.23,1.48 -0.84,-0.73 -1.34,-0.52 -0.96,0.21 -0.43,0.43 -1.17,0.05 -0.35,-0.65 -0.86,-0.36 -1.36,0.74 -0.5,0.89 -3.22,1.14 0.15,-0.72 -0.25,-0.07 -0.77,0.56 0.1,-0.95 -0.24,-0.17 -0.42,0.21 -0.24,0.69 -0.68,0.09 -0.03,0.6 -1.24,0.19 -0.21,0.53 -3.42,-1.23 -0.95,0.83 -0.43,-0.37 -0.28,-1.53 -0.56,-0.65 0.18,-0.63 -0.73,-0.76 0.21,-1.14 -0.29,-0.84 -0.77,-0.06 -0.62,-0.6 -0.66,0.03 -0.85,-1.49 -3.36,-2.48 -1.12,0.27 -1.26,-0.52 -0.48,-0.74 -1.87,-1.08 0.08,-0.7 0.69,-0.27 0.25,-0.53 0.9,-0.19 0.88,-1 -0.01,-1.12 0.58,-0.4 0.32,-0.89 0.97,-0.37 1.23,-1.64 1.23,-0.31 0.76,-0.64 -0.08,-0.4 0.48,-0.68 -0.81,-3.08 -1.03,-0.63 0.07,-0.94 -0.68,-0.35 -1.74,-0.17 -1.03,-1.23 -0.55,-2.82 -1.41,-0.32 -0.48,-0.68 -0.26,-1.35 -1.37,0.33 -0.39,-0.27 -0.7,0.65 -1.12,0.29 -0.66,-0.22 -0.13,-0.84 -1.01,0.34 -0.48,-0.21 -0.1,-1.61 -1.14,-0.58 -0.74,-0.81 -1.1,-1.99 -0.49,0.16 -0.74,1.08 -1.16,0.48 -0.89,-0.16 -1.18,0.37 -1.18,-1.33 -2.09,-0.58 -0.74,1.06 -0.79,0.17 -0.51,-0.31 0.27,-0.98 -0.85,-2.08 -2.64,-0.15 -0.58,-1.26 -0.66,-0.25 -1.15,0.39 -0.32,0.59 0.34,1.42 -0.58,0.44 -1.2,-2 -0.86,-0.01 -2.85,-2.1 -0.94,-0.01 -0.66,0.58 -1.23,0.05 -0.58,-0.54 -0.86,-0.08 -0.44,-0.38 -1.56,2.14 -0.77,-0.14 -0.36,0.27 -0.04,0.59 0.54,0.55 0.04,0.67 0,0 -3.18,0.13 -1.5,-1.57 -3.39,-0.58 -1.44,-1.01 -1.59,-3.27 -1.09,-0.19 -1.63,-1.18 -4.78,-0.87 -2.97,-3.52 -0.67,-2.05 -2.01,-0.43 -0.59,-0.92 -4.58,-1.67 -1.15999,-1.32 0.07,-4.2 0.49,-1.27 1.32999,-1.83 0.08,-0.65 -1.95999,-0.11 -1.61,-1.03 -0.26,-0.83 -0.96,-0.08 0,0 0,0 0,0 -0.57,-0.76 -0.29,-1.18 0.85,-0.6 0.27,-1.17 1.26,-1.86 -0.07,-0.88 0.47,-0.96 1.09,-0.62 -0.15,-0.63 -1.14,-1.45 0.3,-1.69 -0.25,-1.13 -2.18,-1.09 -1.25,-0.2 -1.38,-1.87 -1.33,-0.42 -0.21,-0.53 0.2,-2.15 -0.84,-1.53 -0.15,-1.71 0.37,-2.55 1.15,-0.28 0.9,0.16 0.99,-0.43 0.39,-0.67 -0.07,-0.37 -0.91,-0.48 -0.4,-0.98 1.07,-1.39 0.63,-2.5 1.31,-0.96 2.65,0.16 2.77999,-2.4 0.61,0.69 0.72,0.03 0.41,-0.3 1.11,0.51 0.48,-1.16 0.55,-0.59 0.74,-0.19 5.34,0.55 1.54,-0.62 2.26,-2.06 1.02,-0.23 4.42,1.35 2.7,1.26 0.58,-0.98 -0.05,-1.63 0.42,-0.77 -0.09,-1.88 0.88,-0.54 -0.11,-0.84 0.35,-0.92 -0.81,-0.63 -0.09,-1.12 0.89,-0.58 0.7,-1.24 -0.73,-1.57 -1.23,-0.48 -0.43,-0.81 0.48,-2.99 1.44,-0.33 -0.04,-0.59 -2.13,-2.73 -0.09,-1.54 -0.92,-0.46 0.27,-1.03 -0.75,-1.11 0.71,-0.35 0.53,-1.53 -0.09,-0.84 0,0 0.11,-0.87 1,0.72 -0.08,-0.28 0.44,-0.27 1.27,0.64 0.8,0 3.24,-1.44 1.31,0.65 1.3,0.11 1.5,-0.41 1.26,-1.33 0.66,0.16 0.91,1.68 2.36,1.79 2.18,0.42 2.14,-0.62 1.62,0.37 2.26,-0.01 3.56,1.34 2.19,0.19 0.98,-0.37 0.59,0.61 1.45,0.1 1.71,-1.47 3.3,-3.97 1.03,-0.51 1.03,1.15 0.92,0.22 0.13,0.37 -0.36,-0.08 -0.34,0.34 -0.19,0.81 1.13,1.11 1.07,0.56 -0.38,4.36 0.41,2.1 0.51,0.42 2.74,0.17 1.22,0.69 1.7,1.55 0.88,0.24 0.53,-0.18 0.73,1.31 0.27,1.86 -0.31,1.15 0.36,1.14 1.05,1.01 0.76,0.05 4.45,-0.97 1,-1.2 2.6,-1.71 1.44,-1.96 0.02,-1.12 -0.31,-0.69 -0.92,-0.6 0.31,-2.37 -0.58,-1.54 -0.46,-0.14 -0.04,-1.77 -0.45,-0.4 0.1,-0.74 -0.42,-1.08 -0.75,-0.59 -1.81,0.43 -0.87,-0.27 0.23,-1.51 0.64,-0.63 -0.17,-0.13 1.63,-0.48 0.78,-0.77 -0.58,-3.08 0.46,-3.46 -0.22,-0.37 -0.78,-0.25 0.09,-0.43 0.67,-0.12 1.65,0.94 1.54,-0.12 1.9,0.67 1.29,0.11 2.9,1.26 2.87,0.48 1.73,0.73 1.75,-0.67 0.49,0.65 0.05,0.66 2.24,1.41 0.47,-0.05 -0.03,-0.88 0.43,-0.59 1.69,-0.58 1.6,1.45 -0.27,0.32 0.72,0.94 1.3,-1.01 1.24,-0.39 0.2,0.21 0.63,-0.21 0.11,0.48 0.34,-0.03 0.08,-0.44 1.11,0.51 4.29,0.19 4.77,-0.88 1.3,0.31 1.27,-0.25 2.21,2.93 3.37,2.03 1.84,0.71 2.35,0.37 2.76,1.98 1.71,0.78 1.17,0.07 0.03,0.47 0.99,-0.53 2.99,1.28 4.29,3.31 4.16,4.89 1.57,1.33 1.26,0.36 0.65,-0.27 0.05,-0.42 0.56,0.28 -0.1,0.21 1.03,1.07 3.36,2.12 2.8,3.53 3.38,2.59 2.55,2.47 11.22,8.4 1.35,0.56 0.3,-0.19 -0.06,0.84 3.91,2.63 0.18,0.28 -0.43,0.35 0.45,1.48 1.26,1.63 0.7,0.36 1.29,1.44 0.54,2.32 -0.49,-1.15 -0.54,0.68 -0.3,3.45 0.39,1.77 0.53,0.96 0.62,0.37 -0.49,0.11 0.37,3.03 -0.43,-0.16 -1.32,1.61 0.72,1.01 1.27,0.19 1.79,1.19 0.16,1.04 -0.28,0.18 -0.14,1.3 0.74,0.93 1.46,-1.18 0.03,-0.93 0.92,-0.28 0.74,0.47 -0.27,0.46 0.27,1.78 -0.56,-0.02 -0.08,0.28 0.72,0.33 0.55,-0.1 0.3,-0.27 -0.63,-0.4 1.24,-0.49 0.2,-1.46 -0.83,-0.58 -0.35,-0.76 -1.53,-0.33 -1.17,-0.78 2.18,-1.66 -0.2,-3.15 -0.6,-2.39 -0.72,-0.3 -0.39,0.25 -0.23,-1.52 -2.05,0.5 -0.88,-0.24 0.02,-0.31 1.01,-0.35 5.46,-0.01 0.58,-0.7 1.47,0.69 2.64,0.71 0.38,-0.13 6.79,1.98 0.99,-0.77 0.8,0.53 0.69,-0.08 0.64,0.7 -0.46,0.65 0.32,0.63 2.24,1.63 -0.22,1.32 1.68,1.86 2.9,2.43 1.14,1.71 2.54,1.17 1.25,1.62 -0.5,-0.18 0.06,0.46 1.8,0.49 0.74,-0.2 0.54,0.42 z m -18.51,22.63 1.49,1.16 -3.78,1.3 -0.35,-0.41 0.98,-1.85 0.74,-0.42 0.92,0.22 z" title="Чукотский автономный округ" id="RU-CHU" />
                                <path d="m 190.28011,598.34082 2.72,-1.8 0.86,0.45 0.5,-0.09 0.71,-0.87 2.62,-1.77 1.2,-0.12 0.43,0.37 0.61,1.62 0.81,0.47 2.16,0.36 0.85,2.21 2.89,1.54 0,0 0.03,0.73 -1.02,0.21 -0.53,0.86 -1.2,0.45 0.04,0.67 0.79,0.41 -1.08,0.87 -1.19,1.76 -0.78,0.23 -0.14,0.38 -0.11,1.03 0.45,0.16 0.52,-0.64 0.43,0.05 -0.06,-0.72 0.55,0.18 0.78,1.99 -0.95,0.53 -0.14,0.7 0.42,0.56 0.94,-0.39 -0.01,0.38 -2.25,0.39 0.36,1.29 -1,-0.05 0.12,0.7 -1.15,-0.15 -0.99,-0.76 0.09,0.42 -0.48,0.41 0.53,0.81 -1.25,0.52 0,0 -0.8,0.68 -0.6,-0.51 -0.66,0.07 -0.86,0.87 -0.52,-0.6 -0.78,0.04 -1.51,-1.06 0,0 -0.45,-1.57 -1.01,-0.86 0.46,-0.74 -0.26,-0.61 -0.39,-0.18 -0.53,1.17 -0.26,0.02 -0.19,-0.82 0,0 -0.41,-1.6 0.43,-0.69 0.93,-0.56 0.29,-1.13 0.97,-0.66 -0.19,-0.76 -1.54,-0.66 -1.45,-1.38 -0.01,-0.83 1.02,-1.37 -0.18,-1.72 z" title="Чувашская республика" id="RU-CU" />
                                <path d="m 187.10011,723.15082 0.86,-0.27 3.99,0.66 1.2,1.01 1.41,0.59 1.06,-0.43 0,0 -0.34,1.43 -0.4,0 0.03,0.59 0.26,0.08 -0.33,0.45 0.48,0.26 -0.73,0.34 0.15,0.35 0.66,-0.08 1.08,0.73 0.58,1.92 0.27,0.21 0.41,-0.33 0.25,0.29 0.36,1.15 1.77,2.59 -0.51,2.28 -0.47,0.38 0.38,0 -0.15,0.37 0.26,0.31 1.23,-3.89 0.66,-0.26 0.27,0.26 -2.03,4.97 0.27,0.64 0.29,-0.49 0.36,0.59 -0.66,0.69 -0.43,1.98 1.7,1.36 0.31,2.39 2.45,3.06 2.14,4.13 0.96,0.45 -0.65,2.27 -1.17,1 -1.48,0.32 -1.19,2.56 -0.9,0.29 -0.93,-0.47 -0.63,0.3 -0.37,-0.57 -1.54,-0.49 -1.1,-2.52 -0.76,0.25 -0.08,-0.7 -0.69,-0.96 -0.41,-0.01 -0.46,-0.52 -0.19,-0.71 -1.39,0.5 -0.2,-0.69 -0.73,-0.15 -0.35,-0.62 -0.53,0.21 -0.48,-0.62 -0.55,0.13 -0.31,-0.29 -0.13,0.26 -0.31,-0.47 -0.86,0.14 -0.4,-0.73 -0.72,-0.17 -1.23,-0.88 0.2,-0.76 0.75,-0.15 -0.14,-0.65 0.34,-0.87 0,0 0.94,-0.54 0.27,-0.66 0.55,0.08 0.22,-0.94 1.32,-0.37 -0.63,-0.87 0.74,-0.61 0.91,-0.3 0.21,0.47 0.31,0.04 0.76,-0.77 -0.27,-0.39 0.11,-0.82 -0.53,-0.27 0.14,-1.34 -0.79,-2.03 1.64,-2.84 0.16,-0.84 -0.1,-0.42 -0.72,-0.38 0.01,-0.45 -0.58,-0.78 -1.09,0.91 0.1,0.59 -0.92,0.14 -0.53,0.51 0.03,-1.21 -1.33,-0.34 -0.84,0.33 -1.55,-0.73 0,0 -0.03,-1.56 -0.56,-0.21 -0.93,0.39 -1.14,-0.54 0.2,-0.4 1.54,-0.46 0.3,-0.49 -0.08,-1 -1.25,-0.28 0.24,-0.31 -0.16,-0.63 1.4,-0.73 0.68,-1.03 0.33,-0.75 -0.39,-1.09 z" title="Республика Дагестан" id="RU-DA" />
                                <path d="m 484.01011,640.36082 0.34,0.33 0.95,-0.22 0.29,0.49 -0.12,0.45 2.26,0.92 0.48,-0.05 1.09,-1.28 0.46,-0.04 1.78,1.59 0.84,-0.3 0.83,0.23 0.33,0.92 -0.16,1.81 0,0 -1.06,1.33 -1.59,0.39 -0.98,2.63 0.67,0.68 0.63,-0.22 0.11,0.55 -0.78,1.32 -0.71,0.23 -0.02,0.59 0.24,0.51 0.95,0.27 0.74,0.86 1.16,0.45 -0.02,0.3 0.54,0.4 1.36,-0.5 0.54,-0.8 0.14,-1.17 0.37,-0.47 0.33,0.09 0,0 1.47,1.71 -0.41,1.21 0.78,1.66 -0.06,0.95 1.09,0.87 0.09,0.73 0.65,0.63 0.53,-0.04 0.44,0.89 0.82,0.71 0.13,0.86 2.03,1.63 0.17,0.48 -0.5,0.96 -0.62,0.27 -0.85,-0.26 -0.36,-0.87 -0.4,-0.1 0.3,1.14 -0.9,0.53 -0.54,0.83 0.04,0.42 1.13,0.23 0.67,0.93 0.16,1.65 0,0 0.25,1.42 0.7,0.27 -0.4,0.94 -1.7,0.56 -0.49,0.71 -0.98,-0.65 -0.36,0.61 0.22,0.57 -1.64,0.76 -0.44,-0.87 -0.28,0.01 -0.32,0.43 0.12,0.73 -1.32,-0.27 -0.34,-0.58 -0.58,0.5 -1.52,-0.29 -0.83,0.2 -0.91,1.27 0.72,0.82 -0.34,0.5 -0.68,-0.13 -0.5,0.95 -2.03,0.11 -0.95,0.46 -0.41,-0.16 -0.06,0.4 -1.02,0.21 -0.35,-0.15 -0.32,-1.28 -0.69,-0.38 -0.97,-0.06 -0.26,-0.45 -0.42,-0.06 -0.24,-1.21 -0.68,-0.39 -0.08,-1.04 -1.21,-0.42 -0.09,-0.66 1.16,-0.77 0.15,-1.02 -1.36,0 -0.04,0.53 -1.3,1.29 -1.35,0.62 -0.5,1.34 -0.46,-0.61 -1.22,0.21 -0.11,-0.63 -1.76,-0.02 -0.88,-0.52 -0.94,0.44 -1.02,-0.29 -0.57,-0.58 0.05,-0.83 -0.72,-1.74 -0.89,-0.51 0.05,-0.83 0.33,-0.08 -0.14,-0.46 -3.85,-2.3 -1.1,0.28 -0.64,-0.87 -0.01,-2.39 -1.31,-1.49 0,0 2.41,-0.81 0.36,0.16 0.52,-0.35 -0.08,-0.53 0.76,-0.6 -0.94,-0.56 0.19,-0.92 -2.17,-0.4 -0.67,-0.67 -0.8,0.09 -0.12,-0.7 0.83,-0.36 0.35,0.38 0.39,-1.78 1.81,-0.25 2.08,-1.61 1.15,-0.09 0.93,-0.64 1.47,-0.16 1.81,-0.75 -0.16,-0.71 1.84,-1.49 0.24,-1.07 0.71,-0.35 -0.33,-1.86 1.71,-0.3 2.22,0.49 0.58,-1.1 2.05,-0.04 -0.07,-1.74 -0.38,-0.3 0.25,-1.52 -0.34,-0.94 1.9,-1.44 0.66,-0.11 z" title="Республика Алтай" id="RU-AL" />
                                <path d="m 179.70011,745.37082 0.27,-1.06 0.26,0.5 0.72,0.16 0.93,-0.94 -0.37,-1.55 -1.28,-1.32 -0.77,-0.03 0.13,-1.61 -0.56,-0.51 0.1,-1.27 0.81,-0.11 0.18,0.54 0.4,0.07 0.27,-0.97 0.71,0.38 0,0 2.08,0.97 -0.14,0.89 0.8,0.38 -0.06,1.18 -0.96,1.81 0.29,1.1 -0.44,0.63 0.09,0.63 -0.51,0.64 0,0 -1.51,-0.5 -0.79,1.18 z" title="Республика Ингушетия" id="RU-IN" />
                                <path d="m 713.27011,569.29082 -3.24,0.64 -1.38,-0.67 -1.06,-1.51 -0.78,-0.57 -0.74,-0.19 -0.58,0.27 -1.56,-0.69 -0.61,0.03 -0.57,0.78 -1.14,0.47 -0.25,0.57 0.74,0.55 0.31,1.41 -0.45,0.18 -0.53,-0.58 -0.38,0.59 0.16,0.8 -0.45,1.8 0.21,0.53 -0.36,0.1 -0.21,0.58 -1.24,-0.06 -0.35,0.4 0.44,0.3 0.25,0.87 -0.39,0.76 0.38,0.62 0.85,0.07 -0.59,1.29 0.25,0.61 0.6,0.41 0,1.42 0.58,-0.05 0.13,0.49 -0.4,0.6 0.45,0.39 0.83,-0.58 0.11,-0.57 0.46,-0.06 1.22,0.63 -0.48,0.25 -0.3,0.96 -0.77,0.34 0.62,1.13 -0.39,1.54 -0.38,0.19 0.18,0.66 -0.32,0.63 -0.47,-0.31 -0.49,0.25 -1.01,-1.45 -0.81,0.8 -0.38,0.97 -0.29,0.18 -0.68,-0.23 0.12,0.52 -0.76,-0.1 -0.76,0.55 -0.35,-0.32 -1.8,-0.11 -1.14,-1.01 -0.41,-0.07 -0.8,0.55 -0.81,-0.76 -1.59,-0.88 -0.32,0.1 0,0 2.61,-2.23 0.86,-0.33 -0.99,-1.22 -2.11,0.12 -1.31,1.39 -3.95,0.07 -0.01,1.38 -1.42,2.14 -0.4,1.39 -0.4,0.35 -1.59,0.02 -0.63,0.51 -2.14,-0.33 -1.01,1.04 -0.26,0.83 -0.4,0.1 -0.85,-0.17 -0.27,-0.74 -1.44,-0.78 -2.34,0.45 -2.59,-0.9 -1.35,-1.33 -0.08,-1.83 -0.6,-0.06 -1.23,1.38 -1.53,-0.27 -0.93,-0.91 -1.25,-0.18 -0.4,0.49 -0.38,-0.09 -1.42,-2.4 -0.48,-0.2 -1.07,0.94 -0.64,1.22 0.06,0.61 -1.33,1.25 -0.97,-0.55 -1.21,0.13 -0.64,-0.28 -1.21,0.39 -1.36,-1.12 -2.72,-0.53 -0.67,0.9 -0.26,1.53 -1.26,1.09 -1.45,-0.3 -1.99,0.79 -0.86,-0.05 -1.12,1.09 -1.7,0.24 -0.2,0.33 0.38,0.24 -0.07,0.65 -1.08,1.7 0.95,1.13 1.02,0.4 0.94,2.52 0.52,-0.04 1.26,0.76 -0.38,0.6 -1.25,-0.16 -0.74,0.24 -1.07,3.83 -0.49,0.36 0.17,0.86 -0.42,0.67 0.08,2.06 0.1,0.45 0.61,0.4 -0.45,2.09 0.21,1.49 -0.27,0.84 0.07,2.48 -0.49,0.4 -0.57,1.31 0.52,-0.02 -0.45,0.6 -0.26,5.76 -2.93,8.8 -3.87,3.82 -7.53,4.49 -8.16,9.53 -4.81,2.68 -0.57,1.04 0.02,1.43 -0.48,0.51 -0.43,-0.28 -0.64,0.41 -1.4,0.16 -0.46,0.55 -1.07,0.23 -0.57,0.6 -0.74,0.2 0,-2.92 -1.04,-0.77 -2.37,0 -0.63,-0.6 -0.29,-1.06 0.14,-1.26 -0.69,-1.85 -1.99,-0.93 -1.41,-1.98 -0.47,-0.2 -0.17,-1.2 -1.02,-0.44 -0.8,0.24 -1.31,-0.35 -0.79,0.48 -1.19,-1.11 -1.11,-0.5 -0.59,-1.43 -1.66,-1.68 -3.54,-2.19 -0.91,-1.32 -2.26,-1.53 -0.59,-0.97 -0.04,-1.64 -0.65,-1.56 -0.88,0.27 -0.31,0.77 -1.71,-0.17 -0.06,1.21 -1.73,1.09 -1.77,0.25 0.01,0.64 -0.86,0.64 -0.29,0.95 0,0 -2.38,-1.44 0.53,-0.63 -0.62,-0.45 -0.49,-0.11 -0.62,0.37 -0.69,-0.43 -0.61,0.5 -2.3,0.19 -0.11,-1.32 -1.42,-0.23 -0.5,-0.65 -0.01,-0.84 -1.07,-0.1 -0.55,-0.37 -1.32,0.2 -0.24,-0.79 -1.05,-0.59 -0.24,-0.73 -0.65,-0.64 -1.15,0 -0.34,-0.5 -0.56,-0.14 -0.78,-1.08 -1.02,0.08 -0.1,0.89 0,0 -1.66,-0.39 -0.72,-1.14 -0.66,-0.41 -1.04,-1.85 -0.77,-0.46 -0.04,-0.71 -1.48,-1.06 -0.54,-0.8 -0.81,-0.15 0.13,-1.29 0.68,-0.9 1.38,-0.24 0.88,-1.59 3.16,0.37 -0.06,-0.63 1.25,-3.32 -0.09,-0.89 -0.52,-0.58 0.63,-2.49 -0.37,-1.13 1.81,-0.82 -0.67,-1.2 0.13,-2.28 -0.68,-0.59 0.3,-0.42 -0.11,-1.25 1.31,-1.21 0.28,-1.76 0.93,-0.11 0.27,-0.99 0.89,0.12 0.41,0.49 0.82,-0.83 0.09,-1.23 0.76,0.06 -0.12,-2.19 2.53,-0.33 -0.18,-0.94 0.31,-0.91 -0.14,-0.29 -0.97,-0.14 0.32,-2.76 -2.09,-0.13 -0.28,-0.46 0.09,-0.59 0.83,-0.45 0.2,-0.66 -1.99,-1.07 4.15,-10.01 6.09,0.23 0.44,0.77 1.66,-0.09 0.51,-0.62 0.66,0.13 1.48,-0.34 0.46,-2.1 0.72,-0.47 0.26,-1.1 0.97,-0.22 0.75,0.39 0.92,-0.39 0.82,0.81 -0.55,1.1 0.26,1.15 0.38,0.34 1.43,0.3 -0.08,0.53 0.55,0.48 -0.26,0.76 0.57,0.6 -0.33,0.45 0.17,0.74 1.48,0.84 0.34,0.79 0.47,0.03 0.53,-0.85 0.65,0.16 0.32,-0.32 -0.17,-0.97 -0.59,-0.36 -0.35,-1.08 0.41,-1.36 -0.43,-1.39 1.86,0.1 0.02,-0.8 1.23,-1.46 -0.6,-0.36 0.09,-0.58 1.89,-1.58 0.92,-0.2 1.07,-2.4 0.59,-0.54 2.71,-0.69 1.3,-1.76 1.23,-0.68 0.46,-0.84 -0.18,-1.89 -1.07,-2.17 0.57,-1.71 1.53,-0.75 0.98,0.2 0.18,-0.6 0.82,-0.8 0.95,0.49 0.68,-0.32 1.29,0.17 0.03,0.44 -0.89,0.01 -0.03,0.85 0.79,0.97 0.03,0.72 1.3,1.6 2.94,0.83 0.17,2.08 1.07,-0.52 1.01,0.14 0.11,0.68 0.61,0.11 -0.08,1.21 1.09,0.21 0.46,-0.36 0.87,-0.01 1.57,-1.38 -0.54,-0.4 -0.39,-0.89 0.18,-0.6 2.42,-2.27 1.18,-0.4 0.46,-0.49 -0.16,-1.81 -1.2,-1.25 0.36,-0.65 -0.11,-1.1 -1.02,0.02 -1.2,-1.34 -0.14,-0.96 -0.57,-0.94 1.65,-1.31 0.65,-1.32 3.13,0.12 -0.05,-0.6 -0.58,-0.56 0.4,-1.15 -0.34,-0.8 0.14,-2.85 -0.68,0.14 -0.54,-0.6 -1.25,0.17 -2.01,-1.17 -1.79,-2.08 -0.6,-1.37 0.68,-1.59 -0.25,-0.55 -0.58,-0.16 -0.05,-0.66 0.83,-0.43 -0.06,-2.23 0.3,-0.78 0.77,-0.35 0.04,-0.65 2.17,-1.22 -0.22,-1.01 -0.55,-0.59 0.09,-0.7 2.36,-1.07 0.13,-0.58 2.19,-1.69 0.34,-0.68 1.35,-0.02 1.01,-0.77 -0.44,-1.95 3.39,-3.24 0.55,-2.59 -0.44,-0.4 -0.05,-0.5 0.62,-0.78 0.16,-0.76 1.94,-2.07 -0.09,-0.81 0.53,-0.9 -1.83,-0.53 -0.5,-0.69 0.32,-0.83 -0.99,-1.72 -1.33,-1.27 -0.21,-1.93 1.08,-0.11 0.51,-0.37 0.35,-1.76 -0.64,-0.72 0.28,-1.01 0.6,-0.31 0.76,0.57 0.74,-0.4 0.4,-0.66 -1.26,-1.69 -0.31,-0.88 0.91,-1.24 0.12,-2.04 0.65,-1.7 -0.48,-2.22 0.31,-0.3 2.71,1.47 0.79,-0.97 1.06,1.09 1.12,0.19 0.53,-0.36 0.28,-1.11 1.26,-0.35 2.83,-0.14 0.57,0.64 0.93,-1.98 -0.95,-1.1 -0.45,-1.5 -1.11,-0.52 0,0 0.79,-0.44 1.01,0.42 0.84,-0.84 0.38,0.11 0.06,1.12 0.52,0.43 -0.38,0.96 0.33,1.44 0.3,0.63 1.18,0.2 0.48,0.69 -0.32,1.45 0.39,0.28 0.03,0.58 -0.62,0.63 -2.91,0.2 0,1.07 -1.16,2.12 0.29,0.7 1.7,-0.58 1.14,-0.04 1.87,0.94 1.47,-0.21 1.47,2.94 0.91,-0.28 0.51,6.37 0.3,0.79 1.06,1.2 -0.07,0.49 -1.23,1.16 -0.26,1.19 -0.54,0.38 -0.03,0.6 -0.53,0.48 0,1.3 1.08,1.57 0.84,-0.57 2.12,-0.04 0.71,1.89 -0.31,0.51 0.41,1.3 -0.6,1.2 0.09,0.84 -1.39,0.71 -0.63,0.79 -0.54,1.62 0.37,1.66 1.64,2.58 -0.3,3.32 0.34,0.67 0.47,0.16 0.65,-0.29 0.47,0.36 0.48,1.17 0.85,0.61 1.22,-0.18 0.79,0.57 -0.31,2.16 -1.67,2.33 0.36,0.69 -0.43,1.02 -1.34,0.23 -0.09,0.41 0.56,0.43 -0.04,0.43 -0.67,0.3 -0.1,0.63 -0.76,0.66 0.1,1.04 -0.68,0.46 -0.26,1.15 -0.59,0.76 -0.43,1.89 0.52,1.1 -0.85,1.31 -0.01,0.97 -1.4,2.1 0.32,0.87 -0.27,0.96 -1.24,1.47 -0.19,0.71 0.42,0.32 -0.48,0.51 -0.13,0.73 1.36,0.65 0.21,0.88 0.87,1.04 -0.09,1.06 0.32,0.31 0.78,-0.35 0.33,1.28 0.89,-0.33 2.7,0.13 0.87,-0.53 0.71,-0.06 0.61,-0.65 0.5,-1.69 0.46,-0.59 1.89,0.3 0.89,-0.27 0.43,0.57 0.6,0.06 0.34,-0.6 1.36,-0.34 1.09,0.78 0.71,-0.75 2.01,-0.51 1.92,-2.68 0.6,1 -0.31,1.89 0.96,-0.43 1.46,-0.01 -0.02,1.19 -0.89,0.43 -0.74,0.81 0.19,1.36 -0.31,1.2 0.27,1.42 0.51,0.02 0.49,-0.35 0,-2.61 0.51,-0.4 0.01,0.77 0.77,0.55 0.95,-1.55 2.07,-0.78 0.8,0.09 1.44,-1.32 0.15,-0.73 -0.39,-1.43 1.02,-0.79 0.28,-1.12 0.81,-0.81 0.78,-0.07 0.03,-0.57 0.35,-0.52 0.68,-0.06 -0.08,-0.6 0.38,-0.32 0.51,0.25 0.52,-0.19 -0.01,-0.84 0.59,-0.84 1.44,-1.17 0.78,-0.16 0.15,-0.72 -0.35,-0.78 1.26,-1.8 1.41,0.05 0.56,-0.32 0.55,-0.97 0.26,-1.53 1.02,-1.48 0.51,0.44 0.77,-0.01 1.95,-1.14 0.55,-0.01 0.89,0.63 -0.06,0.56 1.2,0 0.76,0.4 0.03,0.48 0.81,0.01 0.3,0.53 1.41,-0.14 0.73,0.97 0.86,0.18 0.09,0.76 1.05,0.35 0.56,0.62 0.35,0.58 0.05,1.09 0.35,0.38 1.55,-0.38 -0.57,1.62 -0.65,0.26 -0.48,0.63 0.65,0.62 0.1,2.67 -0.23,0.73 0.27,0.68 0.87,0.67 1.39,-0.17 0.71,0.3 1.05,-0.83 0.37,1.34 0.39,0.34 0.77,-0.37 0.23,-1.32 0.47,-0.26 0.36,-0.99 0.14,0.49 1.02,-0.26 0.68,0.8 0.28,1 2.67,0.93 0.63,1.66 -0.98,1.36 0.38,2.68 0.48,0.31 -0.45,0.96 0.5,1.55 -0.37,2.86 2.23,1.47 0.09,0.71 -0.39,0.58 0.63,1.6 z" title="Иркутская область" id="RU-IRK" />
                                <path d="m 149.75011,581.91082 0.7,-0.42 0.71,0.17 0.24,-0.38 1.36,-0.18 0.83,0.49 0,-0.42 0.41,0.02 0.46,-0.6 0,-0.55 0.52,0.26 2.72,-0.85 0.31,-1.69 -0.24,-1.56 2.41,0.73 0.13,0.48 1.16,0.69 0.37,-0.3 0.39,0.25 0.84,-0.15 0.21,-0.5 0.63,-0.27 0.29,0.27 1.21,-0.17 0.29,-0.7 0.84,0.29 -0.25,1.23 0.38,1.04 -0.62,0.6 0.78,0.79 1.12,0.11 0.77,-0.5 0.21,-0.47 -0.29,-1.36 0.53,-0.95 0.2,2.61 0.93,-1.18 0.75,-0.32 1.27,0.27 0.45,0.4 0.13,0.63 0,0 -0.11,0.47 1.14,0.68 -0.11,0.3 -0.34,-0.23 -0.2,0.57 -0.44,-0.32 -0.5,0.36 0.19,0.44 -0.86,0.4 -0.35,0.54 -0.07,1.22 0.9,0.22 -0.05,0.26 0.5,0.22 -1.23,2.34 -2.81,0.34 -0.03,0.34 -0.48,0.23 -0.57,-0.32 -0.8,0.32 -0.43,0.58 0.38,0.5 -0.38,0.89 0.35,0.29 0.4,-0.31 0.05,2.48 -1.68,0.07 -0.42,0.81 0,0 -1.22,0.08 -0.17,-0.52 -1.04,-0.23 -0.67,0.19 -0.04,0.56 -0.88,0.76 -0.9,-0.38 -0.24,-1.66 -2.09,0.61 -0.55,0.45 -0.45,-0.63 -1.5,-0.09 -0.24,-0.35 -0.73,0.3 -0.19,0.41 -0.47,-0.45 -1.31,-0.33 -0.25,-0.98 -0.66,-0.21 -1.57,0.42 -0.17,0.37 -0.7,0.05 -0.14,0.37 -0.35,-0.1 -0.65,1.31 -0.65,-0.53 -0.91,-0.19 -0.68,-1.85 -0.64,-0.06 0.51,-1.14 -0.06,-0.86 -1.79,-0.56 -1.01,0.68 -0.4,-0.07 0,0 -0.18,-1 0.38,0.01 0.17,-0.89 0.85,-0.35 -0.5,-0.79 0.42,-0.45 0.4,0.01 -0.04,-0.4 1.04,-0.62 0.18,0.18 0.68,-0.92 0.41,-0.02 0.54,-0.58 0.31,-0.13 0.5,0.49 0.36,-0.06 -0.01,-0.41 0.5,-0.33 -0.73,-0.44 1.74,0.17 z" title="Ивановская область" id="RU-IVA" />
                                <path d="m 166.81011,735.54082 3,-0.81 0.55,-0.48 0.73,1.37 1.41,-0.42 1.52,0.44 0.6,-1.27 0.75,-0.56 2.31,0.88 0.9,-1.13 0.04,0.53 -0.71,0.94 -0.02,0.7 0,0 -0.07,0.76 0.84,0.79 -0.19,2.23 -0.21,0.19 -0.66,-0.28 -0.72,0.5 -0.72,-0.34 -0.28,0.32 0.16,1.04 -0.38,0.44 -0.37,-0.07 -0.15,-0.24 0.36,-0.05 -0.27,-0.34 -0.47,0.24 -0.39,-0.6 -1.99,3.26 -0.65,0.29 -0.57,-0.36 -0.49,0.42 0,0 -1.62,-0.38 -1.09,-0.97 -0.01,-0.55 -0.81,-0.25 -0.23,-0.53 -1.53,-0.04 0.02,0.36 -0.95,-0.47 0,0 -0.3,-0.71 0.1,-1 0.57,-0.79 -0.11,-0.98 1.71,-1.02 z" title="Кабардино-Балкарская республика" id="RU-KB" />
                                <path d="m 159.57011,728.66082 0.37,-0.32 0.78,0.08 0.73,1.2 2.33,0.45 0.79,0.82 0.04,-0.5 0.71,0.05 0.07,-0.6 0.31,-0.08 0.75,1.16 -2.38,1.3 -0.29,1.05 1.19,0.69 0.36,-0.19 -0.09,-0.54 0.52,0.13 0.55,0.92 0.11,1.01 0.39,0.25 0,0 -0.39,1.06 -1.71,1.02 0.11,0.98 -0.57,0.79 -0.1,1 0.3,0.71 0,0 -0.69,-0.27 -0.13,-0.41 -1.06,0.45 -0.54,-0.21 -1.11,0.35 -1.33,-0.52 -0.38,0.43 -0.6,-0.29 -0.75,0.1 -1.47,-0.81 -0.13,-0.55 -0.55,0.28 -1.38,-0.61 -0.56,0.12 -0.46,-0.48 -0.44,0.06 -0.4,-0.59 -1.17,-0.45 0,0 0.05,-1.97 0.69,-1.79 0.82,-0.32 0.06,-1.5 0.57,-0.23 2.56,0.7 0.47,0.84 0.8,0.16 0.56,-1.08 0.65,0 0.6,-1.31 -0.08,-0.86 -0.7,-0.76 z" title="Карачаево-Черкесская республика" id="RU-KC" />
                                <path d="m 159.57011,728.66082 -1.22,0.91 0.71,0.76 0.08,0.86 -0.6,1.31 -0.65,0 -0.56,1.08 -0.8,-0.15 -0.47,-0.84 -2.56,-0.7 -0.57,0.22 -0.06,1.5 -0.82,0.32 -0.68,1.79 -0.05,1.97 0,0 -0.38,-0.28 -0.65,0.43 -2.32,-0.67 -1.02,0.16 -0.68,1.81 -0.43,-0.13 -0.51,-0.99 -1.07,-0.69 -3.13,-3.7 -1.86,-1.53 -0.27,-0.65 -0.95,-0.35 -0.53,-0.84 -4.23,-1.36 -1.1,-1.33 0.12,-0.26 -0.58,0.09 -0.58,-0.64 0.07,-0.36 -0.8,-0.68 0.07,0.55 -0.53,0.3 -1.83,-0.45 -0.75,-0.65 -0.58,-1.33 0.13,-0.37 -0.56,-0.64 -2.4,-1.16 -1.2,-0.04 -0.99,-0.87 2.83,-0.94 0.03,-0.39 -1.42,0.24 -0.24,-0.74 0.26,0.22 0.39,-0.25 -0.66,-0.36 0.15,-0.28 0.51,-0.09 2.65,1.21 1.6,-0.14 0.69,-0.44 0.43,-0.9 0.06,-1.9 1.57,-0.94 1.01,-2.87 1,-0.21 -0.33,0.89 0.29,0.19 0.56,-1.7 0.42,-0.43 1.54,1.17 0.88,0.05 -0.09,-0.78 -1.59,-0.98 -1.47,-1.73 -1.02,-0.34 -0.06,0.47 -0.54,-0.45 -1.35,-2.91 0.68,0.43 1.28,0.12 2.09,-1.11 0.24,0.78 1.3,0.25 0.64,-0.25 -0.11,-0.6 -1.25,-0.3 0.12,-0.76 0.56,-0.57 0.34,0.25 0.81,-0.17 0,0 0.11,0.42 1.52,-0.03 -0.64,1.46 0,0.69 0.5,-0.59 1.5,0.12 0.72,-0.68 0.08,-0.67 1.39,-0.79 0.54,0.41 3.36,0.35 0.71,0.54 -0.49,1.73 1.5,0.67 0.43,0.98 -0.25,0.54 0.66,0.81 2.7,0 0.75,0.57 1.34,-0.51 0.2,1.34 0.78,0.52 0.68,1.31 0,0 -0.15,0.74 0.68,0.53 0.2,0.98 -0.55,0 -0.49,0.92 -0.76,-0.35 -1.12,0.22 -0.22,1.27 0.7,0.45 0.68,1.05 0.28,1.86 2.46,0.3 -0.02,0.89 0.89,1.23 1.4,0.75 0.08,1 -0.92,1.14 -0.78,0.3 0.54,0.94 2,1.45 z m -14.8,2.11 1.01,1.4 1.07,-0.59 -0.04,-1.25 -0.44,0 -0.33,-0.63 -0.5,0.02 -0.37,-0.38 0.25,-0.8 -0.39,-1.32 0.57,-0.54 -0.02,-0.74 0.95,-0.62 -0.67,-0.47 0.37,-0.39 -0.16,-0.56 -0.61,-0.22 0.22,-0.57 -1.21,-0.08 -0.65,-0.57 -0.64,1.99 -1.16,0.37 -1.89,-0.38 -1.11,0.12 -1.37,-0.57 -0.66,-0.69 -0.84,-0.14 -0.22,-0.44 0.44,-0.57 0.48,0.44 0.8,-0.14 1.03,0.64 1.66,-0.1 2.02,-0.9 1.08,-0.86 1.17,0.2 0.67,0.61 1.11,0.4 0.81,-0.4 1.14,0.07 1.44,1.2 2.25,5.05 -0.65,0.26 -0.92,-2.54 -0.49,-0.46 -0.7,0.06 -0.53,1.54 1.03,2.29 -0.6,1.71 0.47,1.84 -0.38,1.26 -1,0.86 -2.53,-1.55 -1.48,0.1 -0.6,-0.52 0.67,-0.31 -0.17,-0.54 0.54,-0.24 -0.58,-1.01 0,0 0.66,-0.34 z" title="Краснодарский край" id="RU-KDA" />
                                <path d="m 494.75011,587.33082 0.52,2.18 -0.1,0.81 -0.33,0.34 -0.66,0.06 -0.25,0.75 0.83,0.68 -0.12,0.55 0.86,1.32 1.12,-0.02 0.4,0.85 1.01,0.07 0.31,1.31 1.01,1.19 -0.06,1 0.65,1.73 0.73,0.34 -0.12,0.93 -1.13,0.52 -0.52,0.7 -1.66,0.39 -2.33,2.89 0,0 0,0 0,0 -0.45,0.97 -0.71,0.34 -0.01,0.78 0.55,3.19 0.73,1.43 0.81,0.73 -0.26,0.93 -0.68,0.32 -0.29,0.72 -0.33,2.98 -1.2,0.63 0.25,0.43 1.28,0.72 0.47,-0.2 0.5,-0.93 0.89,-0.26 0.39,1.01 0.44,0.28 1.19,-0.56 0.21,0.24 0.28,1.78 -0.99,1.15 -0.24,1.56 0.91,0.1 0.47,2.07 -1.39,0.34 -0.67,1.53 -0.89,0.85 0.27,0.87 -0.56,1.59 0.11,0.36 0.64,-0.63 0.9,1.35 0.21,0.52 -0.56,0.27 0.68,0.53 0.06,0.53 -0.84,0.44 -0.17,0.84 0.26,0.45 0.46,-0.08 0.55,1.02 0.72,0.34 0.21,0.64 -0.48,0.1 -0.27,0.63 -0.6,0.35 -0.12,0.48 0.79,0.84 -1.48,1.49 -1.7,1.1 0.12,1.06 -1.33,0.94 -0.66,0.13 0,0 0.16,-1.81 -0.33,-0.92 -0.83,-0.23 -0.84,0.3 -1.78,-1.59 -0.46,0.04 -1.09,1.28 -0.48,0.05 -2.26,-0.92 0.12,-0.45 -0.29,-0.49 -0.95,0.22 -0.34,-0.33 0,0 -0.01,-0.83 -0.23,-0.33 -0.67,0.05 -0.32,-1.09 0.02,-0.8 0.57,-0.57 -0.14,-1.27 -2.22,-1.85 -0.5,-0.75 0.16,-0.38 1.41,-0.67 0.4,-0.92 0.01,-0.97 -2.8,-0.35 -0.43,-1.07 -0.7,-0.57 -0.61,-1.93 -0.61,-0.3 -0.55,-1.71 -1.4,-0.67 -0.09,-0.36 -0.65,-0.27 -0.35,-0.78 -1.76,-0.97 -0.91,0.17 -1.43,-2.45 -0.35,-0.27 -0.4,0.15 0,0 -0.8,-1.97 0.55,-0.77 -0.83,-0.78 0.14,-0.64 0.55,-0.18 0.34,-0.52 -0.29,-0.99 -1.15,-1.32 0.38,-1.55 -0.41,-1.63 0.06,-1.69 -1.74,-0.06 1.06,-0.82 0.2,-1.57 -0.26,-0.61 -0.85,-0.37 -0.66,-1.14 0.18,-0.37 -0.45,-1.44 0.32,-0.44 -0.18,-1.19 -0.65,-0.19 0,0 2.48,-1.46 1.09,0.08 2.16,-0.93 2.66,-0.22 -0.4,-0.15 -0.22,-0.68 1.52,-0.49 0.36,-0.97 1.38,-0.73 0.59,-0.69 0.56,-0.06 0.25,-1.39 0.29,-0.23 0.96,1.01 0.44,0.07 1.29,-0.83 1.47,0.02 -0.23,0.81 0.22,0.26 1.51,-0.07 0.87,-0.37 0.23,-0.99 1.36,-0.01 -0.07,0.88 1.59,-0.92 0.34,1.49 1.63,-0.69 1.27,-1.17 2.73,-1.75 0.96,0.3 z" title="Кемеровская область" id="RU-KEM" />
                                <path d="m 113.02011,608.39082 0.34,0.42 0.76,0.03 0.84,-0.76 0.92,-0.12 0.7,0.76 0.83,-0.09 0.45,0.49 0.62,-0.07 0.25,0.39 0.75,-0.21 0.16,0.25 0.54,-1.09 0.26,0.02 0.1,-0.59 0.89,0.02 0.42,-0.47 0.23,1.04 1.1,0.04 0.18,0.6 1.18,-0.46 0,0 -0.01,0.02 0,0 0,0 0,0 0,0 0,0 0.07,0.18 0,0 0,0 0,0 0,0 0,0 0.01,0 0,0 0.02,0.02 0,0 0.03,0.05 0,0 -0.01,0.02 0,0 -0.01,0.01 0,0 0.6,0.81 0,0 0.14,-0.05 0,0 0.22,-0.02 0,0 -0.3,0.1 -0.02,0.37 0.47,0.2 0.01,0.43 -0.26,0.11 0.66,1.12 -0.05,1.23 0.25,0.2 0,0 -0.38,2.65 -0.53,0.99 -0.73,-0.66 -0.81,0.21 0.25,0.58 -0.63,0.43 0.21,0.72 0.72,0.11 -0.21,1.34 0.26,0.38 -1.95,0.15 -0.42,-0.33 -1.02,0.29 -0.63,0.75 -0.8,-0.19 -0.72,0.97 -1.18,-0.18 0.81,0.46 -0.14,0.29 -0.63,0.08 1.4,0.17 -0.71,0.75 0.01,1.07 -0.59,-0.13 -0.57,0.48 0.26,0.4 -0.68,0.39 0.36,0.49 -0.35,0.44 1.04,0.86 -0.54,0.6 0,0 -1.11,0.84 -0.24,0.54 -0.7,0.06 -0.23,-0.42 -0.57,0.38 -0.5,1.24 -0.34,-0.1 0.34,-0.74 -0.48,0.16 -0.52,1.37 -0.95,0.33 0.05,0.52 -0.38,-0.2 -0.61,0.27 0,0 -0.78,-0.94 -0.96,0.13 -1.18,-0.56 -0.67,0 -0.68,-0.52 -0.16,-2.9 -0.74,-0.46 0,-0.49 -1.06,-0.78 -0.2,-0.53 -1.35,0.42 -0.28,-0.35 -0.36,0.15 -0.83,-1.46 -0.97,-0.59 -1.130002,0.16 0,0 -0.43,-0.69 0.720002,-0.11 0.25,-1.17 0.51,-0.25 -0.26,-0.49 0.68,-0.99 -0.65,-0.48 0.38,-0.91 -0.38,-0.26 0.31,-0.68 0.44,0.07 0.8,-0.76 0.2,0.33 0.24,-0.32 0.59,-0.04 0.89,0.43 0.56,-0.12 0.32,0.6 0.47,-0.3 1.16,0.16 0.48,-1.44 -0.71,-0.97 1.54,0.4 1.99,-1.13 0.19,-0.28 -0.56,-0.5 -0.08,-0.6 1.66,-1.7 0.31,0.58 0.17,-0.13 0.49,-1.36 0.24,0.01 0.65,-1.15 z" title="Калужская область" id="RU-KLU" />
                                <path d="m 798.58011,602.42082 -0.01,-1.12 -0.6,-0.92 -0.06,-0.77 0.59,-1.96 1.3,-2.3 0.18,-2.26 0.59,-0.89 0.57,-0.2 0.59,0.65 0.46,-0.1 0.57,-0.89 0.68,0.97 0.58,-0.16 0.27,-0.48 -0.55,-0.96 0.09,-1.48 0.99,-0.69 0.14,-0.55 -2.6,-4 -1.08,-1.02 -0.71,-0.08 -0.26,-0.95 0.53,-0.12 0.21,-0.94 0.39,-0.06 -0.01,0.39 1.08,0.54 0.39,-0.25 0.45,-0.87 0.03,-1.06 1.12,-1.38 0.1,-0.54 0.8,-0.72 0.57,-0.05 0.14,-0.61 0.41,-0.08 0.26,-0.5 -2.23,-2.36 0.37,-0.67 -1.13,-0.46 -0.55,-0.67 0.18,-0.84 -0.7,-0.17 -0.16,-1.15 1.33,-0.32 0.53,0.83 1.2,0.5 0.56,0.67 1.04,-0.06 -0.45,-1.86 0.37,-0.77 0.53,-0.19 -0.46,-3.33 1.81,0.23 0.25,-0.96 0.68,-0.83 -0.38,-0.97 0.74,-2.39 1.61,-0.33 0.32,-0.77 -0.68,-0.7 0.44,-1.15 0.55,0.15 0.61,-0.27 0.24,-1.04 0.64,-0.32 0.95,0.17 1.93,-0.8 0.86,0.49 2.47,-0.54 1.74,0.91 0.65,-0.21 0.76,0.68 0.77,0.01 0.85,-0.71 0.41,0.03 0.88,1.05 0.43,-0.16 1.75,0.67 0.65,-0.35 0,-0.36 0.71,-0.76 -0.01,-0.9 2.25,-3.08 0.8,-0.23 1,0.17 1.44,0.82 0.09,0.39 1.79,0.56 1.58,0.11 1.12,0.69 0.5,-0.04 1.3,-1.22 1.54,-0.26 1.99,-1.83 0.3,-0.47 -0.14,-0.92 1.17,-1.18 2.61,0.04 0.48,-0.41 0.29,0.66 -0.15,0.8 0.82,-0.03 0.57,-0.69 -0.03,-0.32 -0.52,-0.28 -0.18,-1.2 0.75,-1.17 -0.57,-0.72 0.16,-1.37 -0.32,-0.85 0.27,-0.45 0.01,-1.32 1.07,-1.98 -0.45,-1.09 1.41,-3.35 -2.19,-2.59 1.05,-2.4 -0.26,-0.74 0.22,-0.32 0.66,0.16 1.71,-1.5 0.31,-0.56 -0.33,-0.87 0.43,-0.76 0.36,0.55 0.48,-0.37 1.37,-0.01 0.38,-0.45 -0.02,-0.85 0.46,-0.48 0.93,0.31 0.96,-0.7 1.38,-0.3 1.02,-1.79 0.64,-0.3 1.23,-3.64 -0.36,-1.14 0.66,-0.33 1.35,0.08 0.09,-0.54 0.69,-0.76 -0.43,-0.65 0.69,-4.5 0.66,-0.51 1.45,-0.05 0.71,-1.35 1.01,-0.01 0.43,0.78 0.9,-0.05 -0.04,1.01 0.82,0.06 0.67,-0.33 0.17,0.86 0.74,1.12 0.85,0.53 -0.03,1.03 0.47,0.7 0.66,0.34 0.14,0.5 0.87,0.23 0.52,1.04 1.01,-0.35 0.42,-0.59 0.72,-0.02 0.45,1.88 1.11,0.78 0.77,-0.1 0.92,-1.05 1.79,0.52 0.26,0.75 0.63,-0.22 0.08,-0.83 0.79,-0.95 -0.05,-1.23 0.92,-0.39 0.04,0.8 0.68,0.48 -0.04,0.38 0.86,-0.52 0.66,0.14 0.33,0.77 -0.26,0.37 0.86,1.55 0.58,-1.17 1.1,-0.58 0.41,0.18 -0.31,0.94 0.24,0.71 -0.44,0.72 0.13,0.63 0.78,0.42 0.47,-0.34 1.08,-0.04 0.77,-1.04 1.14,-0.4 0.53,-2.21 0.86,-0.86 0,0 1.78,-0.21 0.56,0.9 1.29,0.76 0.52,-0.79 0.39,0.08 0.27,0.46 0.49,-0.12 -0.26,0.78 0.58,0.01 0.21,-0.48 0.59,-0.09 0.34,-0.48 -0.13,-0.86 0.42,-0.34 0.42,0.95 1.04,0.18 1.93,1.33 2.08,2.82 -0.03,0.71 1.14,1.42 -0.14,1.77 0.79,0.99 -0.24,1.02 0.74,2.26 -0.05,1.23 -0.41,0.52 0.15,0.35 -0.49,1.41 -1.15,0.13 -0.32,0.46 -0.02,2.12 0.37,0.68 -0.36,0.65 -0.76,0.02 -1.43,-1.18 -0.5,0.13 -0.47,0.54 -0.51,0.05 -0.54,1.19 -0.5,0 -1.08,0.79 0,0.88 -0.68,0.19 -0.23,0.61 0.68,1.04 -0.53,0.26 2.27,2.46 1.03,-0.55 0.96,0.26 0.99,-0.58 0.85,0.26 0.73,1.55 1.44,0.32 0.26,0.77 -0.45,0.73 0.81,1.35 0.34,0.11 0.87,-0.87 0.57,-0.05 0.05,0.89 0.84,0.34 0.11,0.65 -0.37,0.4 0.45,0.44 0.16,1.68 -0.57,1.41 -0.02,1.82 -1.67,0.65 0,0 -0.8,0.14 -1.08,-0.42 -0.17,-0.61 -1.67,-0.42 -1.01,1.01 0,1.62 0.35,0.97 -0.28,0.29 -0.79,-0.33 -1.11,0.95 -0.49,-0.05 0.08,-0.51 -1.17,-0.91 1.03,-2.22 -0.34,-0.25 -0.33,0.34 -0.36,-0.2 -0.17,0.67 -0.78,-0.85 -0.1,0.22 -0.78,-0.26 -1.83,0.5 -0.01,-0.34 -0.45,-0.1 -2.08,0.67 -7.81,-0.45 -2.83,1.15 -1.64,-0.6 -5.9,2.39 -2.73,2.5 -2.63,4.56 -0.84,0.95 -1.77,1.45 -2.06,0.93 -1.83,1.88 -1.58,4.04 -0.45,2.16 -1.01,0.7 -0.3,0.59 -0.47,-0.25 -1.71,0.81 -1.53,2.94 -0.51,-0.1 -0.77,0.37 -0.85,1.71 -1.33,0.78 -0.88,0.06 -0.97,1.08 -0.15,0.71 -0.24,-0.24 -0.42,0.16 -0.25,1.49 -0.34,0.24 -0.43,-0.24 0.03,0.33 -1.37,0.67 -0.23,2.23 -0.24,-0.16 0.05,-0.8 -0.84,0.18 0.25,0.38 -0.66,1.23 -0.67,0.36 -0.08,0.95 -0.32,-0.1 -0.83,0.64 0.16,1.1 0.86,0.31 -0.2,0.56 -0.44,-0.3 -0.71,0.12 -0.16,0.78 -0.92,0.19 -0.54,1.68 -0.45,0.22 -0.4,1.05 -0.98,0.25 -1.14,1.03 -0.25,1.16 -0.67,-0.25 -1.49,1.39 -0.27,0.87 -0.56,-0.08 -0.88,0.69 -0.68,1.22 -0.3,-0.31 -0.82,0.69 -0.35,-0.15 -0.08,0.54 -0.86,0.19 -2.05,3.52 -0.51,0.03 -1.15,1.21 -0.62,0.06 -0.8,0.86 -1.31,0.41 -2.43,2.73 -0.04,0.59 0.61,0.97 2.25,0.97 0.65,0.01 0.26,0.17 0.03,0.76 0.56,0.37 3.08,-0.76 0.28,0.25 1.85,0.09 2.3,-0.71 -0.19,0.57 0.57,0.42 -0.57,0.63 0.34,0.32 -0.35,0.28 0.19,0.51 -0.24,0.28 -0.06,-0.4 -0.31,0.24 0.05,0.7 0.5,0.42 -0.51,0.42 0.4,0.33 0.04,0.29 -0.43,0.24 0.49,0.99 -0.34,0.13 0.22,0.15 -0.12,0.61 -0.62,0.59 -0.19,1.18 0.26,1.43 0.62,0.46 0.48,-0.47 -0.05,-0.34 0.66,-0.32 0.88,0.1 0.35,0.47 0.59,-0.51 0.77,-2.24 -0.26,-0.24 -0.77,0.21 -0.54,-1.08 0.75,-1.05 0.72,-0.18 -0.18,-0.26 0.82,-0.34 0.11,-0.38 1.72,0.14 0.71,-0.33 -1.87,2.77 -0.21,0.09 0,-0.75 -0.55,0.13 -0.39,0.26 -0.19,0.78 1.02,0.17 1.16,1.04 1.89,-0.15 -0.38,0.75 -1.4,0.85 -0.07,0.72 -0.72,1.26 -1.21,0.13 -0.98,0.88 0.86,0.63 4.58,-0.58 2.53,-1.83 0.49,-2.08 1.51,-1.1 -0.1,2.34 -1.53,1.87 0.07,0.5 -0.73,0.51 0.04,0.54 1.41,-0.09 1.4,-2.21 0.37,-2.46 0.41,-0.85 0.01,-1.34 -0.78,0.4 0.47,-1.08 0.06,-1.22 -0.56,-0.47 0.64,-0.22 1.97,1.09 2,0.47 1.21,-0.3 1.92,-1.16 0.36,0.07 0.04,1.1 2.89,1.77 0.08,0.69 0.87,0.53 -0.53,0.76 0.4,1.08 1.49,1.12 -0.08,0.39 0.89,0.92 2.2,1.24 -0.24,0.89 0.64,-0.22 -0.07,0.41 0.91,0.17 -0.18,0.28 0.75,0.66 1.63,0.26 -0.16,0.58 -0.37,0.19 0.52,0.06 0.21,0.88 -0.58,0.19 0.04,0.64 -1.06,0.15 0.27,0.33 -0.4,0.49 -0.72,0.05 -1.63,-0.99 -0.4,-0.67 -0.71,0.08 0.78,1.06 0.73,0.04 0.18,1.15 0.62,0.18 0.13,0.48 1.29,0.21 -0.55,0.88 0.6,0.65 0.15,1.71 -0.39,0.98 -0.73,0.29 0.07,0.98 1.91,2.1 1,-0.18 0.13,0.98 -0.59,-0.08 -0.82,0.71 -0.03,1.17 0.56,0.5 -0.23,0.48 -1.42,0.77 -0.62,1.92 -0.7,0.02 -0.95,0.59 0.07,1.53 -1.14,0.35 0.4,0.11 0.08,0.45 0.49,-0.07 -0.03,0.58 -1.37,0.58 0.25,0.81 -0.53,0.21 0.37,2 -0.35,0.7 0.13,0.39 -0.9,0.68 -0.09,0.94 -0.6,1.14 0.46,0.99 -0.57,0.97 0.85,2.28 -0.28,0.44 0.1,1.61 0.26,0.42 1.03,0.33 -1.44,1.03 -0.62,1.27 0.34,0.82 0.58,0.25 -0.21,1.17 0.34,1.28 -0.92,1.76 0.05,1.16 -0.82,0.9 0.25,0.14 0.04,1.09 -0.5,0.11 0.24,0.46 -0.68,0.91 0.82,-0.6 0.41,0.53 -0.21,0.61 -0.88,0.81 -0.4,1.04 -0.06,3.28 -0.64,0.46 -0.35,0.77 -0.81,0.33 -1.44,1.48 -1.31,2.06 -0.95,0.48 -0.92,1.16 -1.63,3.64 0.02,0.69 -0.34,-0.12 0,0 -1.02,-0.72 -1.22,0.32 -1.21,-0.39 0.56,-1.33 -0.54,-0.59 0.12,-0.37 1.61,-1.02 0.12,-0.73 -0.46,-0.91 -1,-0.86 0.37,-0.79 0.57,-0.21 -0.03,-0.56 -1.11,-0.14 0.06,-0.53 -0.54,-0.37 -0.29,-1.49 -1.12,-0.34 -0.91,0.73 0.03,0.65 -1.51,0.26 -0.29,0.61 -1.06,0.46 -0.95,-0.31 -1.13,0.31 -1.03,1.02 0.55,1.15 1.34,0.79 -0.17,0.49 -0.79,0.26 -0.18,0.51 1.21,0.09 1.25,0.89 0.95,-0.21 0.61,0.43 0.45,-0.06 -0.51,0.75 0.62,0.23 0.09,1.09 -0.58,0.56 -0.56,0.08 -0.06,0.7 -0.79,0.38 -0.73,-0.26 -2.04,1.64 -0.86,-0.3 -0.17,-0.37 -1.64,-0.34 -0.77,2.14 0.39,0.85 -2.81,2.16 -1.04,-0.16 -0.87,0.48 -1.33,-0.5 -0.35,-0.58 -0.35,0.03 -0.58,0.77 -1.58,-1.17 0.21,-0.47 -1.19,-0.08 -0.01,-0.23 -0.35,0 -0.49,0.58 -0.68,0.03 -0.09,-0.38 0.5,-0.83 -0.66,-0.46 -0.06,-0.86 -0.85,-0.03 -1.05,-0.49 -0.73,0.84 -0.72,-0.27 -0.46,0.33 -0.95,-0.01 -0.6,1.79 -0.98,-0.46 0.31,2.15 -0.33,0.81 -3.23,0.72 0,0 0.35,-3.22 0.49,-1.21 0.62,-0.32 -0.04,-0.82 -0.47,-0.53 0.23,-0.81 0.82,-1.03 1.42,-0.24 0.53,-0.53 1.48,-2.49 -0.71,-0.99 -0.13,-0.75 -0.49,-0.14 -0.27,-0.93 1.15,-3.02 -0.59,-0.26 -0.43,-0.72 -0.42,0.21 -0.77,-0.41 -0.8,0.12 0,0 1.61,-1.13 1.73,0.52 0.72,-0.45 0.24,-1.3 -0.87,-0.31 -0.57,0.32 -0.67,-0.46 -0.26,0.33 -0.41,-0.84 -0.44,-0.08 -0.44,-0.59 -0.47,-0.04 -1.08,1.11 -3.09,-0.5 -2.37,-1.07 -1.17,-1.24 -0.68,-3.08 -0.87,-0.48 -1.69,-0.12 -0.34,-0.89 -0.63,0.33 -0.7,-0.21 -0.62,0.35 -0.57,-0.44 -0.07,-1.03 -1.64,-0.84 -0.78,0.33 -0.16,0.78 -0.38,0.23 0.04,0.79 -0.48,0.12 -0.36,-0.46 -0.73,-0.17 -1.95,1.27 -0.67,-0.29 0,0 0.44,-0.14 0.43,-1.36 -0.01,-1.95 -0.75,-1.3 0.92,-1.27 -0.2,-0.31 0.27,-0.94 -0.42,-0.6 -0.01,-0.95 -0.51,-0.38 0.65,-0.95 -0.59,-1.18 -0.78,-0.25 -0.19,-1.06 -0.45,0.24 -0.49,-0.4 -0.65,-0.12 -0.52,0.32 -0.46,-0.33 0.07,-0.52 0.7,-0.82 -0.02,-0.62 -0.6,-0.94 -0.47,0.01 -0.85,0.61 -0.31,-0.25 -0.05,-0.51 1.1,-1.89 -0.43,-1.05 1.27,-0.71 0.95,-2.47 1.1,-0.34 0.71,-1.22 0.94,0.04 0.21,-0.77 -0.63,-1.58 0.35,-1.25 1.53,0.11 1.21,-0.64 0.49,0.11 2.74,-0.98 0.46,-0.53 0.2,-1.15 2.42,-2.25 0.73,-0.4 2.41,0.15 1.36,-0.95 0.13,-0.65 -1.09,-1.27 -0.14,-0.62 0.48,-0.52 -0.57,-1.32 0.48,-0.67 4.22,1.81 0.85,0.08 0.57,0.47 3.72,0.5 0.19,-0.85 -0.32,-0.48 0.91,-1.13 -0.16,-0.6 -0.44,-0.22 0.2,-0.81 -0.35,-1.34 1.7,-2.48 -0.18,-0.83 0.38,-0.8 -0.37,-0.83 -0.65,-0.49 0.17,-0.32 1.02,0.03 0.19,-0.38 -2.92,-2.29 -0.6,0.75 -1.1,-0.02 -1.93,1.13 -0.62,0.07 -0.61,-0.56 -0.98,0.16 -0.55,-0.78 -0.7,-0.16 -0.41,0.69 -0.93,0.02 -1.32,0.86 0.12,1.09 -0.52,0.39 -0.38,-0.29 -0.59,0.22 -0.38,0.73 -0.61,0.2 -0.68,-0.24 -2.03,0.2 -0.73,-0.28 -1.72,0.46 -0.14,0.64 -0.7,0.34 -0.66,-0.21 -0.34,-0.64 0.41,-0.4 -0.16,-0.35 -1.03,-0.11 -1.49,0.62 -0.49,-0.17 0.95,-1.62 -0.77,-1.65 0.23,-0.56 -0.5,-2.52 -0.69,-0.52 -0.87,0.19 -1.13,-0.56 -0.99,0.49 -0.74,-0.81 -0.83,-0.05 -0.54,-0.64 -1.04,0.12 -0.72,-0.39 0.89,-1.01 0.42,-2.01 0.75,-0.46 0.52,-0.88 1.49,-0.71 0.85,0.23 0.39,-0.21 0.85,-2.67 0.01,-1.11 0.99,-0.51 0.3,-0.73 1.28,-0.21 0.18,-0.51 1.35,-0.51 0.44,-0.7 0.71,-0.2 0.81,-1.51 1.89,-0.48 0.35,-0.54 0.02,-1.12 1.4,-0.36 0.91,-1.72 1.23,-0.16 0.23,-0.41 -1.81,-1.04 -0.28,-0.45 0.31,-0.77 -0.65,-0.46 -0.56,-1.26 -1.16,-0.19 -1.5,0.68 -2.59,0.31 -0.13,-0.49 -3.53,0.58 -1.15,-0.02 -1.01,-0.33 z" title="Хабаровский край" id="RU-KHA" />
                                <path d="m 109.40011,470.65082 -0.98,0.47 0.57,0.28 0.19,0.85 0.5,0.3 -0.03,0.46 0.42,0.41 -1.36,1.48 0.79,0.57 0.44,-0.18 0.16,1.21 0.51,0.26 0.57,-0.21 0.11,1.08 1.46,0.19 -0.11,0.69 0.57,0.21 0.98,-0.7 0.37,0.25 0.32,-0.45 -0.3,-0.66 0.98,0.47 0.2,0.52 0.42,-0.02 0.42,0.54 0.3,0.51 -0.22,0.5 0.58,0.78 0.59,-0.52 1.35,1.34 -0.37,0.38 0,0.59 0.58,0.25 -0.12,0.93 0.24,0.34 1.26,0.04 0.06,0.3 1.01,0.27 0,0 -0.19,0.62 0.56,2.02 -1.83,2.62 -1.24,-0.35 -0.57,0.37 -1.35,-0.21 2.05,2.89 0.09,1.29 0.76,0.78 0.11,0.52 -0.59,0.78 0.24,0.25 0.88,-0.41 -0.09,0.58 -0.9,1.18 0.2,1.79 2.21,3.17 3.19,1.95 2.03,-0.36 0.71,0.27 0.82,1.29 0.1,2.65 -0.55,1.77 -0.51,0.03 0.07,0.62 0.64,0.79 0.97,-0.16 0.31,0.32 0.81,1.99 -0.07,0.79 0.73,0.58 0.04,1.09 -0.7,1.77 0.57,0.59 -0.04,0.32 -0.96,1.13 -0.07,2.11 0,0 -2.83,0.4 -0.63,-0.33 -0.42,-0.71 -0.42,0.03 -0.83,-0.6 -0.88,0.38 -0.49,0.86 -1.41,-0.54 -1.6,2.54 -5.68,3.19 0,0 0,0 0,0 0,0 0,0 -0.52,-0.55 -0.8,1.01 -0.28,-0.06 -0.74,-0.52 0.02,-1.59 -1.38,0.84 -2.53,-1.29 -2.13,1.46 -0.24,1.36 -1.89,-1.74 -0.58,0.27 -2.55,-0.32 -2.170002,1.19 0.22,0.61 1.090002,0.85 0.85,-0.49 0.93,0.42 -0.81,2.01 -0.26,0.28 -1.27,-0.84 -0.950002,-0.11 0,0.65 -0.78,0.4 -1,1.09 -0.45,1.32 -0.63,0.37 -0.61,-0.14 -1.25,1.68 -1.08,-0.07 -18.44,-7.19 -0.85,-0.05 -1,-0.67 -1.18,0 -0.5,-0.86 -0.96,-0.4 -0.78,-0.95 0,0 1.29,-1.76 0.01,-0.53 0.96,-0.19 1.66,-2.76 1.21,-1.12 0.31,-0.92 1.7,-1.8 -0.02,-0.42 2.13,-2.71 0.33,-0.96 2.15,-1.7 -0.1,-0.34 1.57,-1.76 3.01,-7.19 -0.89,-1.88 -1.29,-1.26 -0.34,-1.79 -3.2,-2.91 -2,-0.85 -3.76,-4.71 1.94,-1.13 1.77,-3.13 0.41,-1.57 -0.59,-1.39 0.28,-0.38 -0.2,-0.58 -0.83,-0.37 -0.75,-0.99 -1.04,-0.36 -0.48,-0.75 0.11,-0.92 -0.42,-1.65 0.09,-0.56 0.87,-1 -0.71,-1.26 0.33,-0.82 -0.32,-0.26 -2.11,0.04 -0.48,-0.5 -0.37,-1.19 -0.26,-1.69 0.21,-1.19 0.78,-0.52 0.77,0.04 0.35,-0.28 -0.45,-0.57 0.49,-0.96 -0.13,-0.32 -1.58,-0.25 -0.35,-0.4 1.14,-1.42 -0.19,-2.27 0.97,-1.71 -1.03,-1.09 1.95,-1.08 0.85,0.42 0.02,-1.21 -0.38,-2.98 -1.19,-4.11 -1.72,-2.72 -0.56,-2.4 -1.27,-2.88 0,0 2.69,-0.63 2.43,0.17 2.91,-0.28 1,-0.36 2.85,0.2 2.05,-0.27 -0.07,0.35 1.64,0.1 0.13,1.88 1.02,0.45 0.8,2.07 3.13,0.11 0.22,-0.33 -0.2,-0.94 1.1,0.39 -1.19,-1.04 1.56,-0.17 0.29,-1.78 0.29,-0.21 1.91,0.26 0,0 2.42,0.92 -2.18,0.25 1.22,0.34 1.32,-0.38 0.48,0.37 -0.22,0.11 0.19,0.43 0.59,0.29 1.02,0.29 0.18,-0.57 0.420002,0 -0.310002,0.63 1.110002,0.52 -1.590002,0.39 1.320002,0.98 -1.450002,0.09 -3.3,1.31 1.73,-0.3 0.71,-0.55 0.55,-0.03 0.04,0.28 1.130002,-0.33 0.21,0.14 -0.35,0.45 1.5,0.14 0.08,0.41 0.79,0.25 -0.14,0.56 0.53,-0.44 1.08,-0.05 0.54,0.65 -0.24,0.44 0.48,-0.1 -0.04,0.24 -0.01,-0.43 0.25,0.05 0.52,0.55 -0.13,0.21 0.34,-0.05 1.27,1.04 0.15,0.65 0.28,-0.12 0.19,0.26 0,0.48 0.66,0.4 0.11,0.38 -0.35,0.08 -0.11,0.63 0.3,0.12 -0.21,0.26 0.17,0.54 0.25,-0.45 0.75,0.2 0.17,0.42 -0.23,0.61 -0.54,0.15 0.72,0.29 -0.87,-0.2 -0.57,0.49 0.27,0.09 -0.16,0.34 0.29,0.54 -0.25,0.6 0.36,-0.28 0.35,0.35 -0.71,0.47 0.45,0.04 0.49,1.24 -0.16,0.26 -0.27,-0.29 0.01,1.08 -0.74,0.67 0.28,0.86 -0.56,0.25 -0.81,-0.2 0.32,0.61 -1.22,-0.12 0.58,0.7 -0.57,-0.26 -0.57,0.18 1.54,0.73 -0.35,0.35 0.2,1.12 0.46,-0.13 -0.06,0.64 0.47,-0.17 0.36,0.48 -0.33,0.04 0.69,0.72 -0.43,0.17 0.32,1.08 0.76,0.12 -0.28,0.61 0.24,0.11 -0.09,0.45 0.21,-0.18 -0.17,0.37 0.38,-0.44 -0.11,0.34 -0.95,0.63 0.66,0.13 0.38,0.92 0.09,-0.27 0.36,0.28 -0.09,0.37 0.59,0.69 -0.57,1.02 z" title="Республика Карелия" id="RU-KR" />
                                <path d="m 494.91011,605.92082 0.89,1.02 0.45,-0.04 0.92,0.73 0.11,1.31 0.72,0.66 -0.21,0.6 0.79,0.1 0.38,1.07 1.05,-0.12 0.32,0.33 0.4,-0.81 0.86,-0.24 0.65,0.69 1.77,-1.04 1.61,-0.24 0.48,-0.58 0.24,1.06 1.48,0.62 0.34,1.1 -0.18,0.71 1.62,-0.42 0.22,0.91 0.9,-0.1 0.54,0.59 -0.43,2.04 2.18,1.71 0.66,2.62 1.52,2.67 0.01,1.1 -0.99,1.81 0.05,0.71 0.87,1.83 0.11,1.11 1.97,0.81 0.73,1.14 -0.04,0.76 -1.3,1.55 -1.06,0.62 -0.55,-0.02 0.15,0.28 -0.25,0.01 0,-0.3 -0.51,0.37 0.41,1.55 -0.08,0.94 -1.11,1.43 -1.46,1.03 -0.3,0.69 -0.69,0.28 -1.43,1.4 -1.78,3.45 0,0 -1.14,-0.1 -0.26,0.46 -0.59,0.22 -0.65,-0.34 -0.25,0.2 0.17,1.2 -0.63,0.62 -0.2,0.89 0.74,1.73 -0.3,0.34 -1,0.21 -1.11,1.55 -0.74,0.47 -1.3,-0.63 -1.5,0.6 -0.45,-0.19 0.21,-1.03 -1.27,0.32 -0.75,0.58 -0.94,0.1 0,0 -0.33,-0.08 -0.37,0.47 -0.14,1.17 -0.54,0.79 -1.36,0.51 -0.54,-0.41 0.02,-0.3 -1.16,-0.45 -0.74,-0.86 -0.95,-0.27 -0.24,-0.51 0.02,-0.59 0.71,-0.22 0.78,-1.33 -0.1,-0.55 -0.64,0.22 -0.67,-0.68 0.99,-2.63 1.58,-0.4 1.06,-1.33 0,0 0.66,-0.13 1.33,-0.94 -0.11,-1.06 1.69,-1.1 1.48,-1.49 -0.79,-0.84 0.13,-0.48 0.6,-0.36 0.27,-0.63 0.48,-0.1 -0.21,-0.64 -0.72,-0.33 -0.55,-1.02 -0.46,0.08 -0.25,-0.45 0.17,-0.84 0.84,-0.44 -0.06,-0.53 -0.68,-0.54 0.56,-0.27 -0.21,-0.51 -0.9,-1.36 -0.64,0.63 -0.11,-0.36 0.55,-1.59 -0.26,-0.87 0.89,-0.85 0.67,-1.53 1.39,-0.34 -0.47,-2.07 -0.91,-0.11 0.24,-1.56 0.99,-1.15 -0.28,-1.78 -0.21,-0.25 -1.19,0.56 -0.44,-0.28 -0.4,-1.01 -0.88,0.26 -0.5,0.93 -0.47,0.2 -1.28,-0.73 -0.25,-0.43 1.2,-0.62 0.34,-2.99 0.28,-0.72 0.69,-0.32 0.26,-0.93 -0.81,-0.73 -0.74,-1.43 -0.55,-3.19 0.02,-0.78 0.71,-0.34 0.44,-0.89 z" title="Республика Хакасия" id="RU-KK" />
                                <path d="m 172.92011,697.52082 -0.12,-1.34 0.28,-0.92 2.18,-1.3 -0.01,-0.84 0.73,-0.36 1.07,0.54 0.68,-0.03 0.8,-0.93 0.24,-0.51 -1.42,-0.72 0.18,-0.83 0.54,-0.65 1.33,0.37 -0.2,1.07 0.25,0.29 1.05,-0.48 0.36,0.4 0.56,-0.04 0.46,-0.25 -0.27,-0.53 0.18,-0.36 0.65,-0.01 1.44,0.64 0.51,-0.25 0,0 1.79,1.43 0.66,-0.26 0.67,0.23 -0.1,1.74 1.94,2.43 2.58,2.08 1.98,-2.18 1.11,0.33 -0.26,0.44 -0.92,0.42 -0.83,1.06 2.37,4.38 0.56,0.21 0.51,1.05 0.78,0.08 1.01,1.44 -0.28,0.9 -1.21,0.53 -0.41,0.65 -0.07,1.11 -1.4,0.09 -1.34,1.28 1.01,0.59 0.82,0.06 0.31,0.44 0.04,1.08 0.31,0.22 2,-0.44 0.23,0.42 -1.72,3.66 -0.93,1.29 2.16,0.05 1.28,-0.49 1.43,0.25 -0.52,0.93 0.67,0.6 0,0 -0.58,3.42 -0.97,-1.13 0.38,1.31 -0.39,0.18 0.14,0.47 -0.56,0.81 -0.42,-0.15 -1.03,1.69 -0.49,-0.59 -0.53,0.58 -0.11,-0.35 -0.44,-0.11 0,0 -1.06,0.43 -1.41,-0.59 -1.2,-1.01 -3.99,-0.66 -0.86,0.27 0,0 -0.96,-1.41 -0.83,-0.59 -3.65,-1.69 -0.56,-0.61 -3.16,-0.87 -1.55,-1.65 -1.2,-2.22 -2.28,-0.88 -1.69,-0.17 -0.92,-0.9 -2.32,-0.95 -0.7,-0.69 -0.95,1.38 -0.85,0.18 -0.93,0.83 -1.69,0.22 0.14,-1.5 -0.72,-0.21 -0.36,0.05 0.2,0.73 -0.43,0.42 0.14,0.77 -0.28,0.12 -1.3,-0.65 -1.73,-0.12 0,0 0.13,-0.41 -0.56,-1.08 0.26,-0.37 0.6,-0.22 0.71,0.44 0.73,-0.54 -0.09,-0.95 0.69,-0.37 0.87,0.22 0.35,-0.34 -0.84,-1.23 -0.33,-0.83 0.17,-0.17 2.53,1.07 0.78,0.8 1.16,0.53 1.92,-0.53 3.12,2.5 1.58,-0.03 1.01,-2.47 0.51,0.42 0.04,0.75 0.76,-0.4 0.16,-0.27 -0.53,-1.27 0.31,-0.83 -0.83,-0.3 1.9,-2.59 0.44,0.03 0.81,-0.75 0.06,-1.4 0.49,-1.5 0.09,-2.86 -0.81,-0.49 0.2,-0.41 -0.59,-0.1 -0.25,1.08 -1.24,0.49 -0.29,1.16 -0.36,-0.02 -0.59,-0.29 z" title="Республика Калмыкия" id="RU-KL" />
                                <path d="m 304.36011,454.73082 1.71,1.71 0.97,2.02 0.16,1.46 1.67,1.35 1.32,0.56 -0.41,5.25 -0.54,1.29 0.94,2.25 -0.64,1.63 -1.6,1.11 0.22,0.87 2.11,1.39 1.3,-0.67 2.63,1.2 0.53,2 1.26,1.11 1.29,-0.29 1.71,-1.38 2.77,0.02 0.67,-0.57 0.76,0.18 1.57,-0.78 2.44,-0.32 2.23,-0.86 4.45,-0.53 1.6,1.28 3.03,-0.95 0.51,0.42 0.44,1.14 -0.84,2.6 0.28,0.88 0.69,0.72 1.81,0.49 0.38,1.18 3.28,-0.46 0.5,0.93 2.42,-1.6 2.64,-2.41 3.11,1.69 0.08,-1.44 0.64,-1.01 -0.69,-1.39 1.21,-0.38 1.58,0.18 0.91,1.02 2.6,-0.11 0.34,0.95 3.29,-0.5 1.2,1.48 1.79,0.99 0.34,0.62 0.09,0.92 -0.54,0.98 -0.62,0.39 1.71,3.24 0.33,1.82 3.04,0.09 0.54,0.37 0.87,1.55 0.07,2.54 0.81,3.41 2.94,-0.74 0.94,-0.83 2.5,0.32 1.29,-0.25 1.33,-1.91 0.4,-0.11 1.16,0.1 0.46,1.35 0.54,0.29 0.96,1.62 0.76,0.44 4.59,0.01 0.97,0.51 1.61,1.8 3.66,-0.27 1.76,-0.66 3.67,-0.47 3.17,1.44 0.68,0.94 0.5,-0.01 1.23,-1 1.18,-0.05 1.61,0.55 0.55,0.54 0.79,1.96 1.69,1.81 3.22,2.51 1.52,0.71 1.58,-0.74 3.8,-0.62 2.6,0.53 4.85,-0.22 0.89,-3.52 1.91,-0.48 1.98,-1.86 -0.03,-0.3 0.74,-0.1 0.34,-1.52 2.15,-0.83 0.26,0.05 0.56,1.38 1.95,2.03 -0.26,0.84 0.34,0.45 1.19,0.77 0.74,-0.31 0.99,1.5 0.68,0.4 0.57,-0.16 0.38,-1.32 0.41,-0.55 0.63,-0.11 1.95,1.1 2.8,-0.08 0.05,1.73 1.99,0.63 0.19,1.14 0.87,0.67 1.65,0.49 1.1,-1.13 0.11,0.82 1.29,-0.98 0.87,0.36 1.34,2.2 0.79,-0.08 0.62,0.71 0.13,1.02 1.36,1.39 0,0 -0.01,2.89 1.23,2.52 0.57,0.52 1.35,0.3 1.86,1.08 1.36,0.16 1.81,1.66 1.87,0.43 0.35,1.2 -1.19,0.29 -1.04,0.83 0.06,2 -7.86,4.49 -2.24,1.65 0,0 -2.2,0.14 -3.07,-2.63 -2.31,0.17 -4.77,3.64 -0.81,0.86 -0.11,1.47 -1.12,1.19 -0.67,0.09 -2.07,-1.72 -1.96,-0.05 -0.82,0.36 -2.83,-0.29 -0.25,-1.6 -1.63,-0.77 -0.68,-0.05 -0.93,0.62 -2,0.35 -1.11,0.78 -3.27,0.01 -1.82,0.41 -1.06,-0.25 -0.4,-1.94 -1.06,-0.25 -0.63,-0.05 -0.98,1.01 -1.07,-0.54 -0.33,-0.68 -1.06,0.83 -3.01,-0.31 -0.61,0.61 -1.83,-0.67 -2.97,-0.08 -1.46,-0.57 -0.45,0.17 -0.26,0.54 0.08,1.15 -0.46,1.12 0.51,1.39 -0.14,0.38 -1.4,0.89 -0.2,1.62 0.26,1.7 -1.05,2.11 0.32,1.46 -0.68,5.82 -3.57,0.62 -0.88,1.43 -0.8,0.15 -0.8,1.79 -1.52,1.38 0.63,2.4 -0.18,0.89 -3.57,3.42 -0.27,0.68 0,0 -0.96,-0.64 -0.99,0.22 -1.68,-0.37 -3.64,0.06 -1.3,-1.4 -1,0.26 -0.89,-0.8 -2.45,0.78 -1.76,-0.51 -0.94,-0.44 0.96,-1.11 -1.43,-1.33 0.61,-0.84 -0.16,-0.55 -0.96,-0.3 -1.25,0.74 -1.41,-1.33 -0.13,-1.47 -2.57,-3.12 -1.47,-0.18 -1.01,-1.12 -2.59,-1.8 -1.31,-1.45 -1.5,0.71 -0.68,-0.76 -2.14,0.58 -1.95,-0.83 -1.27,-1 -3.13,1.12 -0.04,-0.97 -1,-0.47 -1.32,0.13 -0.92,0.76 1.13,1.87 -3.8,3.1 -1.87,-0.01 -0.42,2.41 -0.93,1.76 -2.41,0.92 -2.3,0.35 -0.95,1.53 -3.36,1.82 -0.31,-0.63 -0.65,-0.19 -1.51,1.25 0.05,3.12 -3.74,1.18 -1.91,-0.36 -0.46,0.44 0,0 -0.27,-1.25 -1.5,-0.54 -1.36,-1.53 -1.87,-5.96 -0.22,-0.29 -0.73,0.06 -0.31,-1.27 -1.67,0.07 -2.85,-0.95 -2.24,-0.06 -0.87,-0.37 -0.82,-0.88 -0.53,-1.11 0.01,-3.92 -0.57,-3.31 -0.49,-0.92 -3.19,-1.32 0.48,-1.13 -0.26,-1.13 -2.51,-4.5 -0.76,-2.64 0.58,-1.91 -0.14,-0.85 -1.27,-1.92 -11.05,-7.22 -5.4,-0.97 -2.55,0.54 -0.59,-0.67 0.02,-1.53 -0.28,-0.41 -3.07,-1.35 -0.41,0.41 0,0 -0.13,-3.31 0.3,-0.45 -0.02,-1.12 1.07,-0.62 -0.03,-1.85 -0.51,-1.07 -0.52,-0.07 -0.28,-0.42 -0.57,-2.67 0.81,-0.93 0.02,-1.3 -1.49,-1.62 -0.31,-1.17 0.61,-0.94 -0.34,-1.64 0.6,-0.87 -0.31,-0.97 0.55,-0.43 -0.12,-0.81 0.7,-3.03 0.29,-2.85 -0.24,-1.11 0.44,-0.28 0.44,-1.48 1.11,-0.78 0.26,-1.02 0.77,-0.77 -0.41,-1.16 -1.16,-0.04 -0.28,-0.75 -0.02,-4.07 -1.01,-1.09 0.82,-1.18 0.48,-1.47 0.49,-0.24 -0.82,-0.93 0.06,-1.13 0.85,-0.25 0.16,-0.99 1.01,-0.35 0.11,-0.51 0.74,-0.1 -0.02,-1.38 1.11,-1 1.94,0.76 0.14,0.79 0.65,0.33 0.18,0.97 1.2,-0.74 0.17,-0.98 2.08,-1.21 0.31,-1.13 0.75,-0.32 1.05,-1.23 -0.33,-1.48 0.16,-0.69 1.98,-3.33 0.77,-0.32 0.05,-0.4 1.17,-1.22 z" title="Ханты-Мансийский автономный округ" id="RU-KHM" />
                                <path d="m 1.8701076,615.72082 0.04,0.38 -1.70999997,1.85 1.66999997,-2.23 z m 10.8400004,-8.11 0.81,1.24 1.07,0.08 0.71,0.75 1.11,0.54 0.96,-0.03 0.23,0.73 1.05,-0.47 1.87,0.18 0.72,-0.31 0.58,1.26 0.17,-0.22 0.57,0.86 0.68,0.25 0.22,1.41 -1.06,0.8 0.09,1.05 -0.47,0.59 0.1,1.61 0.62,1.18 -9.44,0.52 -12.0400004,-1.42 1.06,-0.77 0.36,-0.96 0.72,0.27 1.7,-1.33 0.47,-0.04 -0.2,-0.34 -1.17,-0.01 -0.83,0.54 -0.3,-0.91 -0.45,-0.03 -0.25,0.33 0.13,0.74 -0.67,-0.1 0.67,-1.48 -0.24,-1.6 0.35,-0.81 1.12,0.21 0.99,-0.24 0.64,0.32 0.98,-0.38 1.3,-1.1 1.95,-2.77 0.34,0.15 -0.6,0.5 -0.38,0.93 -2.33,2.47 1.31,0.28 0.44,-0.21 0.65,0.58 1.5900004,0.09 1.12,-0.73 -0.49,-3.17 0.55,0.13 0.15,-0.64 0.77,-0.52 z" title="Калининградская область" id="RU-KGD" />
                                <path d="m 210.20011,447.59082 18.81,-12.02 -0.15,-2.32 0.79,-0.08 3.75,-3.03 17.42,1.53 9.87,0.28 38,-0.44 0.8,0.27 1.19,-0.73 1.12,0.18 0.86,-1.53 8.03,-5.62 0.17,-2.52 1.18,-2.58 1.79,-1.81 1.14,-0.34 1.51,0.72 -0.08,-0.98 1.78,-2.15 -0.39,-2.12 3.53,-2.05 0.28,-0.79 1.04,-0.41 -0.19,-2.68 1.3,-1.12 1.35,-0.02 0.77,-0.34 1.18,0.72 0.66,0.05 1.2,-0.73 0,0 -0.01,0.88 -1.08,1.54 0.34,5.96 1.39,1.3 1.19,-0.09 1.01,-0.61 1.35,-0.08 0.42,0.95 -0.11,0.84 -0.63,0.87 1.28,1.12 0.45,1.47 -0.45,0.46 -1.59,-0.41 -0.49,0.26 -0.64,1.11 1.71,0.64 0.63,1.21 -0.1,0.82 -0.65,0.8 -2.12,0.88 -1.19,1.78 -1.91,1.4 -0.96,1.73 -0.93,0.51 0.46,3.08 -1.69,1.45 -0.89,0.03 -1.13,0.54 -0.27,1.13 -1.41,0.7 -0.58,0.85 -1.88,-0.01 -1.54,1.92 -1.43,1.03 -1.55,0.43 -0.59,1.78 -0.51,0.58 0.6,1.68 -0.72,-0.34 -1.14,1.11 -0.35,1.32 -0.54,0.46 -0.21,0.79 -0.55,0.32 0.44,1.01 -0.76,0.96 -0.1,0.95 -5.12,2.69 0,0 -1.14,0.63 -1.17,1.22 -0.05,0.4 -0.77,0.32 -1.98,3.33 -0.16,0.69 0.33,1.48 -1.05,1.23 -0.75,0.32 -0.31,1.13 -2.08,1.21 -0.17,0.98 -1.2,0.74 -0.18,-0.97 -0.65,-0.33 -0.14,-0.79 -1.94,-0.76 -1.11,1 0.02,1.38 -0.74,0.1 -0.11,0.51 -1.01,0.35 -0.16,0.99 -0.85,0.25 -0.06,1.13 0.82,0.93 -0.49,0.24 -0.48,1.47 -0.82,1.18 1.01,1.09 0.02,4.07 0.28,0.75 1.16,0.04 0.41,1.16 -0.77,0.77 -0.26,1.02 -1.11,0.78 -0.44,1.48 -0.44,0.28 0.24,1.11 -0.29,2.85 -0.7,3.03 0.12,0.81 -0.55,0.43 0.31,0.97 -0.6,0.87 0.34,1.64 -0.61,0.94 0.31,1.17 1.49,1.62 -0.02,1.3 -0.81,0.93 0.57,2.67 0.28,0.42 0.52,0.07 0.51,1.07 0.03,1.85 -1.07,0.62 0.02,1.12 -0.3,0.45 0.13,3.31 0,0 -0.69,1.39 0.19,2.39 0,0 -1.75,1.04 -0.56,1.1 -1.17,0.13 -0.43,0.43 -8.72,0.12 -2.9,-0.36 -0.86,0.49 -2.63,-0.87 -0.32,0.57 -0.38,-0.05 -0.44,1.13 -0.92,-0.14 -1.15,3.14 -2.79,-0.69 -0.96,2.27 -3.26,-0.23 -0.65,1.78 -0.79,-0.14 -0.91,2.13 0,0 0,0 0,0 -7.95,-1.23 -0.38,1.87 -3.48,-0.59 0.66,-2.27 -4.05,-0.55 -0.65,1.79 -2.2,-0.17 -0.9,1.8 -3.15,-0.6 -1,4.22 2.75,1.04 -0.13,0.73 1.5,0.52 -0.14,0.88 0.35,0.79 -0.62,1.06 0,0 -1.48,-1.1 -0.89,0.25 -3.13,5.39 -0.63,0.04 -0.89,-1.79 -1.54,-0.25 -1.78,2.75 -0.98,-0.08 -1.9,0.43 -1.12,0.47 -0.6,0.66 -0.93,-0.2 -0.61,0.23 -0.09,0.52 0.42,0.73 -1.52,0.45 -0.23,2.15 0.28,0.38 -0.12,1.21 0.23,0.44 -0.31,1.59 -0.87,0.54 -0.67,-0.14 -0.6,-0.35 0.34,-2.14 -1.65,-0.22 -0.12,-0.82 -1.32,-0.51 -0.48,0.47 -0.32,-0.16 0.2,-2.46 -4.09,-0.69 0.02,-4.52 -0.32,-1.91 0.35,-0.81 1.66,-1.61 -0.22,-0.68 -1.2,-1.07 0.08,-1.96 -0.85,-3.44 -0.47,-0.38 0,0 0.32,-1.99 0.99,-1.06 1.81,-1.3 1.12,0.01 0.98,-0.68 1.33,0.26 1.92,-6.45 -3.34,-0.98 1.36,-7.03 0.48,-0.13 2.02,-9.66 -6.16,-1.04 -0.8,1.65 -2.01,0.08 -1.01,3.8 0.6,0.89 -0.01,1.47 -2.45,-0.24 -2.07,0.17 -0.36,1.81 -1.58,-0.04 -0.19,-1.98 -1.31,0.01 0.25,-4.85 -1.22,-3.56 1.72,-1.1 1.2,-1.22 0.76,-1.44 -0.55,-0.75 -3.22,-1.95 -1.18,-2.73 1.09,-1.46 0.12,-1.46 -0.37,-0.81 -1.79,-1.86 -2.47,-1.94 -1.28,-0.22 -1.21,-0.8 -1.37,0.03 -1.04,-0.54 -0.88,-0.96 -1.05,-2.38 1.97,-1.22 1.69,-0.42 2.1,0.6 0.97,-0.04 1.32,-1.2 4.78,-0.39 1.69,0.21 2.55,-0.35 2.06,0.36 0.11,1.7 2.09,0.5 0.33,-0.79 -0.08,-1.14 2.76,-0.09 0.69,-2.18 1.8,-0.16 1.68,0.51 1.15,-2.23 2.2,0.39 2.85,1.03 1.19,-5.53 -0.95,-0.06 -1.38,-0.65 -0.85,-1.05 -2.05,-4.16 -0.62,-1.99 -4.03,0.79 -0.15,-6.44 -0.39,-2.57 0.16,-4.03 z" title="Республика Коми" id="RU-KO" />
                                <path d="m 1040.5701,558.00082 -0.3,1.93 -0.49,0.57 -1.1,-0.02 -1.46,0.85 -0.7,-0.06 -4.17,3.25 -0.71,1.71 -0.54,-1.43 1.28,-0.57 1.22,-2.83 0.07,-1.17 1.2,-1.57 -0.11,-0.36 2.7,-1.21 0.67,-0.9 1.41,-0.84 0.03,0.65 0.31,0.14 0.03,0.73 0.66,1.13 z m 68.71,-40 -1.07,-0.52 -0.87,0.25 0.02,0.66 0.36,0.15 -1.81,1.86 -1.22,-1.36 -0.81,-0.04 -0.43,0.43 -0.08,2.48 -0.92,0.04 -0.38,0.39 0.04,0.79 -1.14,1.02 -0.6,0.11 -1.18,-1.19 -1.01,0.59 -0.16,0.42 1.39,0.88 0.23,0.82 -0.6,0.35 -0.91,-0.72 -0.76,-0.15 1.22,0.77 -1.04,0.88 -0.25,0.62 -0.93,-0.13 -0.8,-0.65 -0.4,0.16 0.19,0.71 0.52,0.43 -0.95,0.43 0.68,-0.12 -0.02,0.91 0.46,-0.38 0.12,0.4 -0.55,0.57 -0.85,0.03 -1.69,-1.33 -0.18,0.18 0.85,0.63 0.55,1.31 -0.56,0.37 -0.57,1.31 -0.46,-0.75 -0.26,0.14 0.05,0.61 -0.37,0.25 -0.68,-0.01 -0.23,-0.34 -0.52,0.17 -0.69,0.85 0.25,0.49 -0.2,0.39 -0.76,0.02 -0.91,0.72 0,0.72 -3.79,1.87 -0.86,1.2 -0.64,-0.07 0.08,0.52 -0.31,0.23 0.52,0.22 -0.05,0.6 -0.81,0.29 -0.41,0.5 -0.65,3.99 -0.78,0.53 -1.33,-0.55 0.18,-0.62 -1.38,-0.79 -0.72,-2.42 -0.6,-0.4 -0.34,-1.89 -2.29,-1.7 -2.27,-0.66 -2.27,-0.12 -0.52,0.33 -1.18,-0.74 -1.28,-0.06 -2.18,0.58 -1.44,0.83 -0.61,-0.38 -0.13,0.88 -0.3,-0.17 -0.77,0.58 -1.34,0.37 -1.58,1.07 -0.71,-0.3 -0.42,-0.6 0.16,1.27 -0.69,0.2 -0.63,0.99 -0.47,0.08 0.22,0.13 -0.83,1.6 -2.29,2.6 -0.87,1.6 -1.37,0.17 -0.13,-0.22 0.64,-2.34 0.17,-2.08 0.57,-0.42 0.17,-0.55 -0.42,-2.5 0.96,-0.67 -0.1,-0.71 -0.72,-0.12 -1.17,0.62 -0.7,0.97 -1.23,0.61 -0.56,0.73 -2.66,1.4 -1.15,1.19 -0.42,-0.35 -0.94,0.18 0.08,0.56 0.53,-0.39 0.43,0.1 -0.2,0.69 0.6,0.6 -0.41,0.3 -0.51,1.51 -0.97,0.38 -0.82,0.79 -0.42,-0.51 -0.14,-1.61 -0.43,-1 -0.67,-0.29 -0.35,-0.7 -0.89,-0.55 -0.9,0.5 0.12,1.14 -0.92,0.4 -0.58,0.72 0.01,0.38 0.56,0.48 -0.94,-0.13 -0.13,-0.44 1.23,-1.25 -0.59,0.07 -0.78,-0.63 -1.23,0.26 -0.41,0.36 -0.77,1.64 -0.3,-0.31 -1.04,-0.08 -1.01,2 0.25,1.84 -0.4,0.4 -0.95,0.18 -0.26,0.66 0.1,0.67 0.93,1.19 0,1.61 -1.84,0.46 0.1,1.01 1.01,0.6 0.15,0.77 -1.56,-0.96 -0.9,0.36 0.73,1.66 0.44,0.17 -0.21,0.48 -1.56,0.97 -0.22,0.75 -1.34,0.84 -1.14,1.19 -2.38,4.64 -0.93,3.51 0.3,2.08 0.75,1.29 2.14,0.9 -0.62,1.53 0.73,-0.29 0.58,-0.9 -0.24,-1.6 0.43,-0.77 1.01,-0.31 2.51,1.75 1.18,0.03 0.77,1.24 -0.67,0.82 -0.03,1.01 -0.57,0.26 -0.35,1.14 -1.36,0.67 -0.79,0.91 -0.21,1.58 0.62,2.73 -0.55,3.46 1.09,1.08 -0.84,-0.38 0.8,0.4 1.06,-0.67 0.42,0.21 0.77,-0.19 -0.03,0.37 0.39,0.3 -0.36,0.92 0.27,0.64 -0.17,1.7 0.75,1.44 0.06,1.82 -1.31,0.65 -1.12,1.65 -1.5,-0.76 -1.29,-2.05 0.55,-0.57 0.23,-0.94 1.44,-0.44 0,-0.44 0.94,-0.56 0.25,-0.8 -0.27,-0.17 -0.49,-0.17 -0.23,0.26 -0.45,1.3 -1.44,-0.84 -1,0.82 -1.11,0.35 -0.04,0.4 0.89,0.53 -0.03,0.37 0.33,-0.02 0.18,0.48 -2.84,1.43 -0.93,0.84 0.01,0.78 -2.34,5.92 -0.11,1.96 0.33,2.31 0.68,1.85 1.99,2.69 -0.36,0.42 0.24,0.83 -1,0.7 -2.17,2.39 -1.54,-0.17 -1.39,0.41 -0.62,-0.52 0.01,-0.7 -0.52,-0.15 -2.2,0.48 -2.46,1.69 -1.42,1.63 -1.12,0.73 -0.95,1.38 -0.97,3.14 -0.04,2.21 0.69,0.97 0.07,1.15 -0.14,0.26 -0.66,-0.33 -0.1,-0.46 -0.41,0.34 0.49,0.29 0.03,0.99 0.53,0.23 -0.05,0.69 0.44,0 -0.51,0.85 0.32,0.55 0.1,-0.49 0.39,-0.12 -0.14,0.4 0.46,1 -0.18,0.55 -2.09,-1.27 0.77,-0.79 -0.27,-0.07 -0.69,0.67 -1.01,-0.38 -0.75,0.31 -0.57,0.89 -0.42,-0.21 -1.71,0.71 -1.46999,1.12 -1.33,1.56 -0.14,-1.1 -0.52,-0.86 -0.56,-0.12 -0.82,0.52 -0.06,0.45 0.42,0.19 -0.4,0.16 0.15,0.68 0.85,0.03 -0.11,-0.26 0.69,-0.07 -0.01,0.54 -0.28,0.06 0.38,0.28 -0.58,0.79 -0.51,-0.21 -0.08,0.24 0.05,0.42 0.82,0.51 -0.48,0.5 0.11,0.29 -0.32,0.13 -0.83,-0.41 0.16,0.59 0.81,0.81 -0.22,0.37 0.21,0.23 -0.92,0.85 0.78,-0.34 0.38,0.23 -0.12,0.6 -0.43,0.25 0.46,0.12 0.07,0.33 -1.17,0.92 0.14,0.64 -0.27,0.51 -0.18,-0.17 -0.33,0.27 0.16,0.58 -0.42,0.7 0.04,0.55 -1.21,1.78 -0.55,0.28 -0.86,1.8 -1,0.86 -1.47,0.59 -0.89,1.77 -0.48,0.01 -0.84,1.41 -1.2,0.81 -3.08,3.21 0.79,-1.41 -0.08,-0.94 -0.4,-0.13 0.09,-1.22 -1.2,-1.01 -0.45,-2.7 0.12,-3.46 -0.33,-4.18 -2.23,-7.88 -1.03,-8.78 -1.88,-10.18 -1.32,-10.13 0.7,-9.22 0.68,-1.76 1.77,-7.51 0.91,-1.63 0.48,-0.27 -0.76,0.95 0.86,-0.48 0.17,-0.8 1.79,-1.31 0.49,-0.9 0.06,-0.99 0.85,0.54 0.46,-0.15 0,-0.5 1.81,-3.8 0.12,-1.31 -0.3,-1.43 -0.62,-1.35 -0.71,-0.29 0.54,-0.99 0.39,-0.03 0.71,-0.77 0.35,0.77 0.88,0.36 0.92,0.1 0.97,-0.33 0.66,-0.48 0.4,-0.94 -0.09,-0.5 0.64,-0.57 0.09,-0.57 2.31,0.5 0,-0.27 0.93,0 1.38,-0.95 2.47,-2.6 2.94999,-2.26 0.8,-1.38 2.47,-2.71 0.73,-1.53 0.32,0.08 0.3,-0.37 0.28,-1.23 -0.3,-0.44 1.05,-2.14 0.97,-0.8 1.41,-1.95 0.83,-0.17 0.75,-0.8 0.56,-2.22 2.76,-0.9 0.45,-1.17 1.21,-0.81 1.12,-1.27 1.66,-2.73 1.98,-1.15 1.08,-1.24 0.17,-1.23 -0.38,-0.17 0.44,-1.68 0.6,-0.17 0.4,-0.75 0.05,0.32 0.49,-0.27 0.3,-0.58 1.47,-0.29 0.75,-0.92 1.35,0.03 0.67,-0.66 0.76,-1.57 0.7,-0.3 0.88,0.36 -0.02,-0.38 0.47,-0.41 1.04,0.09 -0.02,0.65 0.57,-0.88 1.61,-0.8 1.07,0.5 -0.59,-0.28 0.53,-0.98 -1.99,-1.27 0.13,-0.37 0.71,-0.33 0.05,-0.81 0.35,-0.43 1.97,-1.38 0.59,-1.69 -0.75,-1.36 -0.71,-0.09 -0.39,0.4 -0.17,-0.76 0.72,-1.52 0.15,-1.22 1.34,-0.53 0.17,-1.8 -0.23,-0.61 0.36,-0.77 -0.18,-1.4 0.33,-0.55 -0.24,-1.14 0.37,-0.57 0.2,-2.16 2.03,-1.32 0.62,-1.29 1.45,-0.21 0.97,0.49 1.86,0.21 -0.27,-0.51 0.85,-0.35 0.18,-0.37 -0.96,0.04 -2.06,-1.21 -0.28,0.2 -1.17,-1.91 -1.22,-0.23 -1.18,0.49 -1.68,0.14 -0.88,1.1 -0.97,-0.38 -3.51,1.19 -0.35,1.24 -0.87,0.54 0.65,-0.14 0.18,0.64 0.97,0.68 -0.96,0.28 -0.05,0.47 -1.22,0.97 0.53,1.45 -0.23,0.81 0.59,0.23 -0.92,1.46 -0.04,0.98 -0.59,1.41 0.67,0.72 1.9,0.78 -0.03,0.68 -0.81,0.31 0.02,0.56 -0.3,-0.36 -0.51,0.19 -0.27,0.54 0.31,0.48 -0.58,0.51 -0.53,-0.98 -0.8,-0.35 0.63,-0.64 -0.72,-1.01 -1.5,0.74 0.11,0.55 0.78,0.05 0.11,0.48 -2.36,-1.19 0,0 0.21,-0.96 -0.74,-0.75 -0.63,-1.58 0.42,-0.4 0.53,0.09 0.95,-1.13 -0.36,-1.06 -1.64,-0.34 -0.51,-0.52 0.16,-0.61 2.22,-0.71 1.6,-1.07 0.02,-1.83 0.31,-0.9 -0.85,-1.7 0.89,-0.81 0.17,-0.7 -1.68,-0.74 0.54,-0.78 -1.64,-1.58 -1.04,-0.27 -0.07,-0.9 0.5,-2.15 0.48,-0.6 0.6,0.28 0.72,-0.2 0.67,-0.99 0.88,-0.4 0.06,-0.37 -0.61,-0.6 0.35,-0.78 -0.35,-1.33 1.11,-0.38 1.21,-1.73 -0.07,-1.25 -0.45,-0.81 -0.76,-0.32 -0.04,-0.69 -0.7,-0.56 0.69,-1.71 0.61,-0.52 -0.1,-2.04 -0.82,-1.36 0.18,-0.8 0.87,-0.62 1.58,-0.21 0.58,-0.49 -0.38,-0.49 0.11,-0.45 1.86,-1.36 0.02,-0.53 -0.69,-0.79 0.01,-0.72 -1.28,-1.33 -0.05,-2.13 0,0 -0.04,-0.67 -0.54,-0.55 0.04,-0.59 0.36,-0.27 0.77,0.14 1.56,-2.14 0.44,0.38 0.86,0.08 0.58,0.54 1.23,-0.05 0.66,-0.58 0.94,0.01 2.85,2.1 0.86,0.01 1.2,2 0.58,-0.44 -0.34,-1.42 0.32,-0.59 1.15,-0.39 0.66,0.25 0.58,1.26 2.64,0.15 0.85,2.08 -0.27,0.98 0.51,0.31 0.79,-0.17 0.74,-1.06 2.09,0.58 1.18,1.33 1.18,-0.37 0.89,0.16 1.16,-0.48 0.74,-1.08 0.49,-0.16 1.1,1.99 0.74,0.81 1.14,0.58 0.1,1.61 0.48,0.21 1.01,-0.34 0.13,0.84 0.66,0.22 1.12,-0.29 0.7,-0.65 0.39,0.27 1.37,-0.33 0.26,1.35 0.48,0.68 1.41,0.32 0.55,2.82 1.03,1.23 1.74,0.17 0.68,0.35 -0.07,0.94 1.03,0.63 0.81,3.08 -0.48,0.68 0.08,0.4 -0.76,0.64 -1.23,0.31 -1.23,1.64 -0.97,0.37 -0.32,0.89 -0.58,0.4 0.01,1.12 -0.88,1 -0.9,0.19 -0.25,0.53 -0.69,0.27 -0.08,0.7 1.87,1.08 0.48,0.74 1.26,0.52 1.12,-0.27 3.36,2.48 0.85,1.49 0.66,-0.03 0.62,0.6 0.77,0.06 0.29,0.84 -0.21,1.14 0.73,0.76 -0.18,0.63 0.56,0.65 0.28,1.53 0.43,0.37 0.95,-0.83 3.42,1.23 0.21,-0.53 1.24,-0.19 0.03,-0.6 0.68,-0.09 0.24,-0.69 0.42,-0.21 0.24,0.17 -0.1,0.95 0.77,-0.56 0.25,0.07 -0.15,0.72 3.22,-1.14 0.5,-0.89 1.36,-0.74 0.86,0.36 0.35,0.65 1.17,-0.05 0.43,-0.43 0.96,-0.21 1.34,0.52 0.84,0.73 2.23,-1.48 4.25,-1.44 0.78,0.25 0.34,0.67 0.91,0.07 0.63,0.49 0.36,1.17 -1.2,1.4 0.75,0.44 0.15,1.85 0.49,0.36 0.85,-0.21 0.3,1.28 0.58,0.48 0.17,0.95 0.51,0.45 -0.09,0.72 0,0 -0.94,0.37 z m -54.82,97.24 -1.32,-1.36 0.13,-0.52 -0.66,0.08 -0.19,-0.31 -0.06,0.28 -0.63,-1.08 -0.79,-0.53 -1.42,-3.4 -1.61,-0.71 1.61,-0.99 1.06,0.53 0.91,-0.1 0.31,0.36 -0.42,0.44 0.03,1.12 1.41,2.67 1.08,0.62 0.36,0.6 0.2,2.3 z" title="Камчатский край" id="RU-KAM" />
                                <path d="m 109.99011,642.96082 1.34,-0.25 0.32,-0.47 1.07,0.37 0.07,-0.63 0.67,0.36 0.15,-0.6 0.5,0.17 0.42,1.92 0.32,0.18 4.67,-1.31 0.41,0.12 1.01,1.63 0.94,0.15 0.26,0.46 0.73,0.05 1.03,0.78 2.13,0.38 1.51,1.6 0.31,-0.1 0.36,-0.86 0.65,0.09 0.47,0.58 0.56,-0.9 0.3,0.07 0,0 0.51,1.11 1.15,0.5 1.11,-0.3 0.66,0.16 0.64,-0.4 0,0 1.07,0.7 0.3,0.75 -0.15,0.82 0.97,0.51 -0.71,0.69 -0.57,-0.39 -1.83,0.46 1.11,2.02 0.28,1.39 -0.26,0.88 0,0 -2.4,-1.68 -0.76,0.06 -0.97,0.66 -1.09,-0.27 -1.5,0.1 -0.47,0.37 -1.49,0.33 -0.72,1.15 -1.81,0.31 -1.4,1.18 -1.89,-0.41 -0.66,-0.47 -0.95,0.35 -0.6,-0.66 -0.63,0.71 0.44,0.24 -0.17,0.52 -0.55,0.14 -0.48,0.82 -0.62,-0.29 -0.6,0.46 -1,0.17 -0.35,-0.68 -0.68,-0.15 0,0 0.23,-0.39 -0.64,-0.36 -1,0.31 -0.6,-1.88 -0.97,-0.15 -1.19,0.68 -0.88,-0.13 -0.23,-0.68 -1.73,-0.22 -0.54,0.4 -0.49,-0.32 0.52,-1.19 -0.86,-0.48 0.68,-1.41 -1.62,-1.55 2.37,-0.73 -0.03,-1.23 -0.65,-0.45 0,0 0.62,-0.76 -0.83,-0.28 0.18,-0.97 0.89,-0.68 1.44,0.05 0.27,-0.77 -0.3,-0.67 0.37,-0.26 0.57,0.33 0.26,-0.15 z" title="Курская область" id="RU-KRS" />
                                <path d="m 197.24011,550.10082 -0.38,3.51 1.5,0.25 -0.16,0.99 0.31,0.5 -0.26,0.18 0.46,0.96 0.7,0.33 0.24,-0.51 0.17,0.86 0.7,1.06 0.28,1.7 -2.1,-0.21 -0.23,0.15 0.39,0.56 -0.34,0.31 0.43,0.67 -0.87,0.49 -0.57,-0.16 -0.97,0.95 0.19,1.01 -0.86,0.19 -0.3,-0.2 -0.42,0.39 -0.89,0.16 -0.18,-0.21 -0.66,1.42 0.21,1.02 -1.33,0.62 0.55,0.33 -0.52,0.66 0.34,1.05 -0.27,0.5 -0.43,0.04 -0.42,0.89 0.44,0.69 0,0 -3.25,0.62 -0.52,-0.14 -0.22,0.38 -0.31,-0.04 -0.25,0.97 -0.41,0.36 -0.49,-0.02 -1.18,-1.51 -0.88,0.24 -0.86,-0.8 -2.41,0.12 -0.33,0.47 0.26,2.22 -0.38,0.39 0.16,0.67 -0.5,0.34 -0.15,0.93 -1.04,-0.12 -1.59,2.48 -0.89,0.05 -1.34,0.96 -2.51,-0.1 0,0 -0.13,-0.63 -0.45,-0.4 -1.27,-0.27 -0.75,0.32 -0.93,1.18 -0.2,-2.61 -0.53,0.95 0.29,1.36 -0.21,0.47 -0.77,0.5 -1.12,-0.11 -0.78,-0.79 0.62,-0.6 -0.38,-1.04 0.25,-1.23 -0.84,-0.29 -0.29,0.7 -1.21,0.17 -0.29,-0.27 -0.63,0.27 -0.21,0.5 -0.84,0.15 -0.39,-0.25 -0.37,0.3 -1.16,-0.69 -0.13,-0.48 -2.41,-0.73 0.24,1.56 -0.31,1.69 -2.72,0.85 -0.52,-0.26 0,0.55 -0.46,0.6 -0.41,-0.02 0,0.42 -0.83,-0.49 -1.36,0.18 -0.24,0.38 -0.71,-0.17 -0.7,0.42 0,0 -0.49,-0.6 -0.12,-1.99 0.43,-0.25 -0.15,-0.58 0.58,-0.15 -0.08,-0.64 0.32,0.31 0.18,-0.41 0.51,0.27 0.21,-0.4 -0.6,-1.09 0.63,-1.25 -0.55,-1.36 1.07,-0.81 -0.08,-1.46 1.16,-0.84 -0.3,-0.74 0.51,-0.28 0.67,-1.11 0.72,-0.24 0.52,-0.68 -0.74,-0.95 -0.19,-1.11 -0.8,-0.39 0,0 0.35,-0.34 0.27,0.15 -0.18,-0.6 0.71,-0.72 0.53,-0.1 0.55,-1.05 -0.77,-0.91 0.44,-0.87 0.3,0.17 -0.02,-0.76 -0.48,-0.34 0.57,-0.55 -0.01,-0.38 0.35,-0.21 0.29,0.8 0.39,-0.61 1.61,-1.07 1.16,-0.37 0.99,0.16 0.34,-0.6 0.23,0.26 0.4,-0.12 0.12,-1.75 -0.99,-0.67 0.73,-1.99 1.01,0.27 0.21,1.28 0.55,0.7 0.44,-0.49 1.69,-0.37 0.51,1.24 0.35,0.01 0.71,1.26 0.38,-0.13 0.03,-0.73 0.3,0.26 1.03,-0.3 -0.03,-0.33 0.62,-0.46 0.69,0.61 0.2,-0.17 0.24,0.38 0.3,-0.12 -0.04,-0.73 1.14,-0.48 0.26,1.69 0.56,-0.29 -0.1,-0.41 1.32,-0.65 0.02,0.81 0.7,-0.07 0.81,0.42 1.13,-0.37 0.16,0.61 0.84,0.2 0.04,0.41 1.38,-0.33 3.51,0.55 0.49,-0.96 1.54,0.04 0.33,-0.51 2.51,0.39 0.19,-0.4 0.51,0.43 1.16,0.1 0.87,-2.02 0.57,0.1 0.28,-0.49 1.55,-0.18 0.24,-1.37 -0.31,-0.42 0.33,-1.34 1.51,-0.12 0.14,0.43 0.6,-0.12 0.41,-0.51 z" title="Костромская область" id="RU-KOS" />
                                <path d="m 304.14011,596.32082 0.08,-1.58 0.85,-0.57 1.71,-2.73 0.8,-0.59 0.34,0.02 0.65,1.08 0.7,-0.85 1.43,-0.84 1.27,0.66 1.27,-0.09 0.25,0.34 0.37,-0.59 0.78,-0.35 2.09,1.62 2.34,0.28 0.77,-0.27 -0.17,-1.15 1.06,-0.93 -0.06,-1.16 0.29,-0.27 0.49,0.1 1,-1.04 1.88,0.03 0.87,0.87 0,0 0.36,1.26 -0.16,1.65 1.11,1.91 -0.27,0.58 0.22,0.41 3.51,0.43 0.35,0.92 2.28,2.53 1.84,-0.83 1.59,1.68 1.43,-1.18 0.56,0.96 0.7,0.11 0.78,-0.52 0.43,0.72 1.65,0.03 1.01,2.74 1.5,0.36 1.2,-0.4 0.75,0.85 2.03,-0.51 0.37,1.45 3.16,3.1 0.05,1.44 0,0 -0.28,0.89 -3.16,0.02 0.18,0.75 0.61,0.73 -0.49,0.58 -0.13,0.8 -1.28,0.19 -1.11,-0.42 -0.53,0.43 -0.22,0.74 -0.9,0.37 -0.61,0.18 -1.71,-0.35 -0.24,0.57 -1.37,0.26 -0.3,0.32 -1.79,0.1 -0.45,0.51 -2.8,0.44 -2.33,0.88 -0.48,-0.16 -0.05,-1.01 -0.76,0.24 -0.61,1.11 -1.89,-0.58 -0.3,0.42 0.23,0.54 -0.89,-0.1 -1.12,0.69 0.15,2.25 -0.79,0.03 -0.96,-0.98 -1.6,0.75 -0.09,-0.57 -0.72,0.09 -0.81,0.51 -0.38,-0.09 -0.3,0.42 -2.55,0.14 -0.34,0.44 -0.25,-0.36 -0.25,0.44 -1.08,-0.04 -2.11,0.89 -0.99,0.1 0,0 -0.1,-0.8 -0.39,-0.03 -1.44,-1.27 0.31,-0.6 -0.24,-0.64 1.21,-0.77 -0.6,-2.3 -1.53,-0.1 -1.98,0.71 -1.31,-0.16 0.26,-0.52 -0.61,-0.38 -2.14,0.88 -1.01,-1.02 0.28,-0.65 -0.91,-2.15 0.04,-0.71 0.77,-0.21 0.5,0.55 0.37,-0.01 0.45,-1.18 -1.41,-2.45 1.1,-0.45 -0.35,-1.34 1.41,0.17 0.7,-0.26 0.65,-0.39 0.22,-0.83 -0.69,-0.19 0.56,-0.67 -0.38,-1.49 0.26,-0.39 -1.58,-1.53 0.32,-0.62 -0.9,-0.05 -0.28,-1.35 z" title="Курганская область" id="RU-KGN" />
                                <path d="m 196.87011,532.04082 0.47,-1.79 0.44,-0.56 -0.08,-0.58 1.43,0.23 0.69,-0.45 2.95,0.8 0.38,0.36 0.09,1.59 2.67,0.47 0,0 0.47,0.38 0.85,3.44 -0.08,1.96 1.2,1.07 0.22,0.68 -1.66,1.61 -0.35,0.81 0.32,1.91 -0.02,4.52 4.09,0.69 -0.2,2.46 0.32,0.16 0.48,-0.47 1.32,0.51 0.12,0.82 1.65,0.22 -0.34,2.14 0.6,0.35 0.67,0.14 0.87,-0.54 0.31,-1.59 -0.23,-0.44 0.12,-1.21 -0.28,-0.38 0.23,-2.15 1.52,-0.45 -0.42,-0.73 0.09,-0.52 0.61,-0.23 0.93,0.2 0.6,-0.66 1.12,-0.47 1.9,-0.43 0.98,0.08 1.78,-2.75 1.54,0.25 0.89,1.79 0.63,-0.04 3.13,-5.39 0.89,-0.25 1.48,1.1 0,0 1.27,0.72 6.33,1.04 0.16,-1.01 0.55,-0.24 0,0 1.21,1.76 0.39,1.43 -0.8,4.26 0,0 -0.9,0.13 -0.25,2.01 -1.34,2.76 1.28,2.85 0.87,0.01 1.13,0.65 0.71,-0.18 0.43,0.37 -0.59,1.26 0.32,2.03 0.77,1.01 0,0 0,0 0,0 -1.03,0.57 -0.2,0.62 0.31,0.53 -0.22,0.44 0.28,1.94 0,0 -0.76,0.1 -0.36,0.42 -0.48,-0.19 -0.57,0.33 -0.25,-0.31 -0.3,0.11 -0.08,0.52 -1.1,-0.08 -0.84,-1.63 -1.44,0.53 -0.16,1.04 -0.35,0.36 -2.93,-0.23 -1.75,-0.75 -0.64,0.02 -1.21,0.57 -0.97,1.15 -0.91,2.35 1.15,1.1 0.05,0.87 0.81,0.41 -0.45,0.91 0.27,2.48 -0.4,1.17 -0.79,0.8 -0.11,0.61 -0.97,0.58 0.03,0.55 -0.64,0.23 -0.54,-0.26 -1.08,0.13 -0.58,0.42 -0.74,1.79 2.11,4.74 0.89,0.93 -0.1,0.64 -0.76,0.65 -0.34,1.21 -1.22,-0.05 -0.25,0.69 0.22,0.87 -0.26,0.6 1.09,1.06 0.18,0.73 1.19,0.82 -0.7,0.82 0.72,0.54 -0.52,0.73 0,0 -0.24,0.59 -0.5,0.02 -0.81,-0.64 -0.53,0.17 -0.75,-0.53 -0.77,-1.15 0.27,-1.17 -0.25,-0.82 -0.45,-0.49 -0.52,0.28 0.2,0.85 -1.18,-0.35 -0.67,-1.32 0.12,-0.57 -1.43,-2.1 -0.59,0.62 -0.55,-0.3 -0.42,0.41 -0.64,-0.26 0,0 0.48,-1.67 -0.3,-0.89 -0.62,-0.39 -0.43,0.17 -1.41,-0.41 0.29,-0.98 -0.3,-0.5 0.1,-0.46 -1.01,-0.56 -1.13,0.27 -0.7,0.55 -0.7,-0.31 -0.61,-1.67 -0.02,-0.77 0.45,-0.75 -0.29,-0.46 -1.11,0.32 -0.17,0.72 0.36,0.66 -0.58,0.49 -0.14,0.87 -0.29,0.16 -0.79,-0.31 0.27,-0.72 -0.46,-0.32 -0.93,0.44 -0.88,-0.37 -0.75,0.84 -0.45,-0.56 -0.71,0 -0.25,0.82 -0.54,0.2 -0.03,0.67 -0.74,0.25 -1.34,0.09 -0.85,-0.8 -1.68,1.99 -0.12,0.81 -0.87,-0.3 -1.66,0.52 0.17,-0.6 -0.41,-0.54 -2.6,-0.3 0,0 0.26,-2.17 -0.39,-0.62 0.69,-0.58 -0.81,-1.35 -0.13,-1.41 0.53,-1.13 0.39,-0.25 1.36,0.26 1.62,-1.05 1.14,0.77 0.44,-0.2 0.54,-1.06 0.39,-2.87 1.27,-1.45 -2.86,-0.97 -2.1,-0.24 -4.02,-0.26 -0.86,0.35 -0.11,-0.7 0,0 -0.44,-0.69 0.42,-0.89 0.43,-0.04 0.27,-0.5 -0.34,-1.05 0.52,-0.66 -0.55,-0.33 1.33,-0.62 -0.21,-1.02 0.66,-1.42 0.18,0.21 0.89,-0.16 0.42,-0.39 0.3,0.2 0.86,-0.19 -0.19,-1.01 0.97,-0.95 0.57,0.16 0.87,-0.49 -0.43,-0.67 0.34,-0.31 -0.39,-0.56 0.23,-0.15 2.1,0.21 -0.28,-1.7 -0.7,-1.06 -0.17,-0.86 -0.24,0.51 -0.7,-0.33 -0.46,-0.96 0.26,-0.18 -0.31,-0.5 0.16,-0.99 -1.5,-0.25 0.38,-3.51 0,0 0.11,-1.48 -0.22,-0.52 -1.59,-0.65 0.84,-2.42 0.28,-2.72 -1.42,1.41 -0.83,0.22 -2.23,-1.11 -0.63,-1.73 2.36,-0.39 0.66,0.17 0.36,-0.31 0.63,-3.25 1.29,-1.36 -0.48,-2.44 z" title="Кировская область" id="RU-KIR" />
                                <path d="m 473.52011,266.98082 0.66,-0.67 0.36,-1.85 1.25,-0.56 1.99,1.81 -0.49,1.11 -0.37,0.13 -0.23,-0.87 -0.93,-0.48 -0.33,0.31 0.69,0.32 0.21,0.45 -0.4,0.44 -0.56,-0.14 -0.69,0.69 -0.68,0.14 -0.05,-0.24 0.32,-0.05 -0.12,-0.47 -0.57,0.23 -0.06,-0.3 z m 52.17,-164.4 -0.3,-0.22 0.28,-0.15 0.02,0.37 z m -19.52,-64.240002 -0.76,-0.96 -0.15,-1.28 0.62,-2.42 0.52,-0.63 3.27,-0.78 1.9,-0.06 0.67,-0.47 4.15,1.72 0.15,1.75 0.47,1.36 -1.22,1.79 -1.49,1.41 -1.85,0.37 -2.46,-0.21 -1.07,-0.71 -2.75,-0.88 z m 10.32,33.67 0.47,-0.13 0.43,-0.75 1.2,0.51 0.29,-0.86 1.57,0.61 -1,-0.96 0.21,-0.14 0.97,0.24 0.49,0.65 0.9,-0.53 1.19,0.6 1.33,-0.23 -0.69,-1.01 -2.91,-0.74 -2.01,-1.46 0.74,-0.69 1.63,-0.41 0.83,-0.9 2.1,-0.19 1.1,-0.76 0.04,-3.34 0.48,-3 2.78,-4.58 -0.11,-0.48 0.4,-1.08 -0.52,-0.42 -0.48,0.39 0.29,1.33 -0.2,0.2 -0.8,0.03 -1.47,0.72 -0.4,-0.92 -0.51,1.09 -0.64,0.25 -0.67,-0.08 -0.29,-1.14 0.85,-0.88 1,-1.89 -0.01,-1.5 2.18,-1.76 0.73,0.28 0.31,-0.19 -0.68,-1.39 0.03,-1.37 -0.34,-0.41 0.28,-0.34 0.94,-0.2 1.96,-1.86 1.37,0.55 0.2,-0.27 -0.33,-1.36 1.72,-1.04 1.02,-0.18 0.87,-1.22 0.83,-0.13 0.59,-0.51 0.57,0.11 2.58,-1.52 0.29,-0.74 2.94,-3.25 2.18,-0.19 -0.45,-0.54 -2.19,0.1 -0.87,-0.26 -0.18,-1.4 0.2,-0.21 3.31,-1.05 1.74,0.42 0.67,1 0.19,1.14 -0.86,2.18 1.7,-0.1 0.2,1.1 0.65,0.22 0.29,1.49 0.77,1.31 1.12,1.08 0.19,2.03 1.5,1.24 -0.36,1.44 0.8,2.14 0.77,0.18 1.48,1.27 0.41,1.15 1.86,1.48 0.03,0.63 3.02,0.53 -0.59,1.42 0.69,-0.07 0.43,0.82 -0.1,0.62 -0.73,0.74 0.88,0.4 0.24,1.76 -0.86,0.15 -0.73,0.96 -0.45,-0.28 -0.89,0.16 -0.3,0.83 -0.9,0.4 -0.38,-0.15 -0.08,-1.1 -0.46,0.54 -0.52,-0.35 0.1,0.96 -0.9,4.8 0.93,3.13 0.1,4.13 1.17,0.42 0.32,0.78 -0.01,0.69 -1.21,1.67 0.17,0.85 -1.26,0.06 -1.15,0.55 -1.35,-0.19 -3,0.56 -5.06,0.23 -1.94,1.52 -1.65,0.84 -1.16,0.19 -1.36,-0.31 -1.04,0.91 -0.72,-0.62 -1.62,3.12 -4.5,2.63 -3.83,-2.26 -2.83,-2.59 -3.1,-0.2 -1.36,-0.76 0.17,-0.38 0.79,-0.37 -0.09,-0.93 4.44,2.23 0.46,-0.35 -0.15,-0.64 -0.65,-0.65 -3.68,-2.02 -0.19,-0.74 -1.11,-0.82 2.28,-0.15 2.54,-0.71 1.56,0.43 1.88,1.43 0.65,-0.31 -0.79,-1.45 -2.19,-0.9 -0.87,0.07 -2.94,0.92 -3.34,0.22 -1.8,0.75 -0.28,-0.18 0.36,-0.71 -0.05,-0.68 -0.65,0.8 -1.4,0.43 1.25,-2.38 z m 156.22,196.300002 0.23,1.48 -0.18,1.15 -0.18,0.17 -0.13,-0.4 -1.58,3.91 -0.65,-0.12 -0.71,0.38 -1.15,2.68 -4.47,-1.38 -1.84,-2.27 -2.22,-0.71 -1.04,-1.19 0.17,-1.27 0.56,-0.59 0.97,-0.15 1.18,0.78 1.05,-0.83 -0.24,-0.37 0.36,-1.33 -0.53,-0.68 0.24,-2.39 4.93,0.92 3.27,0.23 1.31,0.87 0.65,1.11 z m 3.38,-41.36 0.08,2.41 -0.32,1.83 -0.63,1.47 -0.5,2.74 -1.19,2.35 -0.8,-0.03 -0.39,-0.4 1.33,-1.87 0.19,-1.11 -2.03,-0.89 -1.21,-0.03 -1.15,0.48 1.1,-0.78 -0.03,-0.35 -0.53,-0.35 0.08,-0.35 -1.08,-0.57 -2.24,-2.4 -0.89,-0.54 -1.02,0.16 -0.63,-0.26 0.59,0.53 0.68,0.07 0.46,1.7 1.17,0.04 1.34,1.07 0.28,0.85 -0.21,0.51 -0.71,-0.03 -0.81,-0.71 -0.24,0.59 0.58,0.43 0.82,0.07 -0.04,0.72 0.54,0.64 0.01,0.48 -0.72,0.86 0.11,1.15 0.82,0.24 0.72,-0.53 0.05,-0.53 -0.36,-0.4 0.16,-0.54 1.79,-1.61 0.3,0.06 0.37,0.49 -0.13,0.98 0.25,0.31 -0.48,0.66 0.76,1.66 1.07,0.43 1.27,0.01 0.23,1.03 -0.08,1.7 -0.66,-0.14 -0.77,0.83 0.56,-0.26 0.63,0.3 -0.38,2.88 -0.91,2 -2.09,2.53 -1.46,2.53 -0.58,0.51 -0.16,-0.15 -0.14,0.86 -0.88,1.18 -1.24,0.65 -0.5,0.78 0.28,-0.85 -2.65,1.2 -0.44,-0.17 0.22,0.48 -1.27,2.86 -0.35,0.26 -0.38,-0.46 0.53,0.87 -0.92,1.21 -0.25,1.1 -1.66,-1.04 -1.04,0.2 -1.63,1.62 -1.46,2.28 -0.61,-0.15 -2.55,1.62 -1.36,-0.6 -1.15,0.23 1.45,0.25 0.15,1.14 -2.08,2.57 -0.63,0.09 0.91,-0.7 -0.56,-0.39 -1.47,1.65 -0.7,0.06 -0.12,0.57 -0.29,-0.73 -0.45,-0.08 -0.26,0.42 -0.45,-0.19 -0.08,0.31 -0.48,0 -0.41,0.65 -0.47,0.15 0.7,-0.02 0.39,-0.69 1.6,0.48 1.23,-0.77 0.15,1.15 -0.48,2.14 -2.5,3 -2.26,0.32 -0.91,0.58 -0.85,1.37 0.19,0.21 -1.14,1.16 -2.13,3.97 -0.62,-0.3 -0.25,-0.65 -0.77,0 0.69,0.2 0.13,1.55 -1.48,2.29 -1.2,0.1 -1.47,1.12 -1.57,-0.19 -0.79,0.32 -1.65,-0.39 -0.79,0.55 -1.55,-0.73 -1,0.27 -0.04,-0.28 -0.95,-0.21 -2.61,0.26 -0.52,-0.81 -0.74,0.4 -0.07,0.37 0.86,0.3 0.19,0.38 2.85,-0.26 2.76,1.57 0,1.83 -1.25,1.24 -0.13,2.17 -0.72,1.12 -0.82,0.25 -2.46,-0.4 -1.23,1.27 -0.68,2.49 -0.29,0.1 0.38,0.14 0.03,0.34 -0.98,0.96 -0.05,2.43 -1.01,1.32 -0.33,1.52 -2.69,2.21 -0.65,0.2 0.44,0.9 1.13,0.23 0.66,-0.31 2.18,-2.56 0.8,0.52 -0.41,-0.69 0.48,-1.26 1.63,-1.3 -0.14,-3.12 0.15,-0.58 0.73,-0.66 0.19,-0.79 0.68,0.04 1.21,0.88 1.27,0.35 2.5,-0.74 1.6,0.28 2.89,-0.11 0.54,-0.24 1.27,-1.49 0.63,-0.25 0.9,2.61 1.04,0.77 0.85,0.04 -0.73,-0.71 0.09,-2.65 1.18,-0.77 -0.45,-0.07 -0.5,0.36 -1.66,-0.38 -0.16,0.41 0.24,-0.95 4.8,-1.36 2.64,-1.26 0.23,-0.25 -0.48,-0.57 0.07,-1.12 0.53,1.16 0.81,0.59 0.64,-0.56 -0.34,-0.21 0.16,-0.59 1.92,0.43 0.54,-0.22 1.17,-1.29 0.79,-0.12 0.37,-1.12 -0.61,0.08 0.23,-0.62 0.61,0.07 1.43,-0.74 -0.18,-0.59 0.67,-0.71 0.82,0.14 1.68,-0.69 0.26,-0.44 0.35,0.13 0.06,-0.57 -0.37,-0.6 0.34,-1.16 -0.77,-0.1 -0.88,-0.65 -0.5,0.93 -1.25,0.61 -1.01,1.26 -1.26,-0.51 -2.32,0.29 -0.3,0.31 0.11,0.71 -0.58,-0.55 -0.69,-1.44 -0.29,-2.28 0.77,-0.3 1.43,-1.27 0.89,-3.09 2.62,-0.47 1.57,0.63 1.83,1.35 0.82,1.01 0.64,0.08 0.62,-0.68 0.09,-0.47 -0.34,-0.09 -0.02,-0.58 0.56,-1.24 1.24,-0.77 1.4,-0.08 0.53,1.12 -1.5,0.65 -0.75,-0.05 -0.44,0.42 0.55,2.46 0,0 -1.88,1.42 -0.57,0.85 -0.26,2.22 1.25,0.28 0.66,1.86 -0.4,0.32 -0.81,-0.54 -0.72,0.05 -1.54,4.51 -3.49,0.05 -0.44,0.78 2.97,1.49 0.15,1.38 -1.48,1.6 0.75,1.19 1.54,-0.6 1.31,0.37 0.29,0.61 -0.46,0.9 0.62,1.07 -0.08,1.03 -0.94,0.2 -0.52,0.98 1.21,0.24 -0.85,2.34 -0.31,1.98 0.44,3.79 0.65,-0.1 0.5,0.35 -0.18,1.21 1.42,0.34 0.74,0.89 -0.02,1.41 -0.72,0.77 -0.36,0.94 0.6,1.03 1.45,-0.07 0.58,0.85 1.08,-0.04 0.78,1 -0.3,2.31 0.79,0.23 0.47,0.94 1.37,0.48 0.31,4.5 -0.22,3.11 0.67,6.01 -0.2,2.19 0.24,0.75 1.5,0.73 1.26,1.71 1.12,0.15 0.63,0.45 -0.01,1.1 -1.03,0.24 -0.21,1.2 0.27,0.71 -0.35,0.94 -1.04,0.12 -0.37,1.08 -0.4,0.21 -0.57,-0.94 -0.46,-0.02 -1.25,1.76 -3.01,0.87 -0.71,1.32 -1.47,0.18 -2.11,1.58 -2.65,0.85 -0.87,1.07 -1.13,0.21 -0.88,0.73 -0.38,0.76 0.27,0.79 -0.51,0.4 -0.05,1.28 1.3,1 0.34,0.92 -4.83,0.78 -0.32,0.54 0.28,1 -0.38,1.2 -1.37,0.55 -0.12,1.21 0.51,0.59 -0.2,1.69 0.97,0.52 -0.05,0.55 -0.54,0.6 -0.19,1.96 -0.85,2.23 -1.31,0.46 -1.41,-0.24 -0.35,-0.52 0.06,-1.04 -0.59,-0.15 -3.69,0.24 -1.6,1.35 -0.62,1.57 -0.42,0.31 -1.31,-0.12 -2,0.69 -0.76,0.75 0,0 0,0 0,0 -2.53,1.53 0,0 0,0 0,0 -2.57,0.25 -1.26,-0.8 -1.03,0.83 -0.57,1.2 -0.68,0.39 -0.26,1.35 2.76,4.87 2.6,5.48 0.4,4.52 -0.19,9.14 -0.86,10.31 -0.11,4.91 -0.33,1.57 -0.7,0.72 -1.3,-0.45 -1.29,1.28 -1.52,0.22 -0.49,2.41 -0.61,0.37 -2.72,-0.02 -0.17,0.58 1.33,1.32 0.77,-0.42 0.81,0.17 0.15,0.92 1.4,-0.25 -0.02,0.95 -0.55,0.92 0.31,0.33 0.74,-0.2 0.14,0.92 0.58,0.72 -0.29,1.32 0.41,2.29 -0.92,1.68 -0.1,4.37 1.89,1.2 0.38,1.04 -0.05,6.4 1.42,0.82 1.14,1.72 1.1,-0.02 0.27,0.38 -1.23,0.91 -0.25,1.53 -0.6,-0.27 -0.82,0.12 -0.77,0.56 -0.61,1.4 0.58,1 -0.79,0 -0.75,1.23 -0.8,0.27 -0.25,0.76 -0.87,0.08 -0.29,0.5 0.07,0.84 0.55,0.47 0.01,0.74 0.71,0.59 -0.78,0.27 -0.44,-0.69 -0.46,0.06 -0.24,0.81 0.25,0.67 -0.76,1.36 0.28,0.81 -0.25,0.41 -1.02,-0.04 0.31,1.34 -0.31,0.4 0.99,1.51 0.92,-0.95 0.96,0.27 0.11,0.77 -0.31,0.55 0.45,0.57 1.03,-0.47 1.88,-0.23 0.33,-0.36 -0.12,-0.65 0.61,-0.35 0.68,1.95 1.27,-0.1 0.41,0.89 1.89,0.17 0.23,1.49 1,0 0.53,-0.45 0.74,0.11 2.24,1.51 0.89,0 0.09,-0.61 0,0 1.11,0.51 0.45,1.5 0.95,1.11 -0.93,1.97 -0.57,-0.64 -2.83,0.13 -1.26,0.36 -0.28,1.11 -0.53,0.36 -1.12,-0.19 -1.06,-1.09 -0.79,0.97 -2.72,-1.47 -0.3,0.3 0.48,2.22 -0.66,1.7 -0.12,2.04 -0.9,1.24 0.31,0.89 1.25,1.69 -0.39,0.65 -0.74,0.4 -0.77,-0.56 -0.59,0.3 -0.28,1.01 0.64,0.72 -0.35,1.76 -0.51,0.37 -1.08,0.11 0.21,1.93 1.33,1.27 0.99,1.72 -0.33,0.83 0.5,0.7 1.83,0.53 -0.53,0.9 0.09,0.81 -1.94,2.07 -0.16,0.76 -0.62,0.78 0.05,0.5 0.45,0.4 -0.56,2.58 -3.38,3.25 0.44,1.94 -1.01,0.77 -1.36,0.02 -0.34,0.68 -2.19,1.69 -0.13,0.58 -2.36,1.07 -0.1,0.71 0.55,0.59 0.23,1.01 -2.17,1.22 -0.05,0.65 -0.77,0.35 -0.3,0.78 0.06,2.23 -0.83,0.42 0.05,0.66 0.58,0.16 0.25,0.56 -0.68,1.59 0.59,1.37 1.79,2.08 2.01,1.16 1.25,-0.17 0.54,0.6 0.68,-0.14 -0.14,2.86 0.34,0.79 -0.4,1.15 0.58,0.56 0.04,0.6 -3.12,-0.12 -0.65,1.32 -1.65,1.3 0.58,0.94 0.14,0.96 1.19,1.34 1.02,-0.02 0.11,1.1 -0.35,0.65 1.19,1.25 0.17,1.81 -0.47,0.49 -1.18,0.4 -2.42,2.27 -0.18,0.61 0.39,0.88 0.54,0.4 -1.57,1.38 -0.87,0.01 -0.46,0.36 -1.09,-0.22 0.08,-1.2 -0.61,-0.11 -0.11,-0.69 -1.01,-0.13 -1.07,0.52 -0.18,-2.08 -2.94,-0.83 -1.29,-1.6 -0.03,-0.73 -0.79,-0.97 0.03,-0.85 0.9,-0.01 -0.03,-0.44 -1.29,-0.17 -0.69,0.32 -0.95,-0.49 -0.81,0.8 -0.18,0.59 -0.99,-0.2 -1.53,0.75 -0.57,1.71 1.08,2.16 0.18,1.89 -0.46,0.84 -1.24,0.68 -1.3,1.76 -2.71,0.69 -0.59,0.54 -1.07,2.4 -0.92,0.2 -1.9,1.58 -0.09,0.58 0.59,0.37 -1.22,1.46 -0.02,0.8 -1.86,-0.1 0.43,1.39 -0.41,1.36 0.36,1.08 0.59,0.36 0.17,0.96 -0.32,0.33 -0.65,-0.16 -0.53,0.85 -0.47,-0.03 -0.34,-0.79 -1.48,-0.84 -0.17,-0.73 0.32,-0.45 -0.57,-0.6 0.26,-0.76 -0.55,-0.48 0.08,-0.53 -1.43,-0.3 -0.38,-0.34 -0.26,-1.14 0.55,-1.1 -0.81,-0.81 -0.92,0.39 -0.75,-0.39 -0.97,0.22 -0.26,1.1 -0.72,0.47 -0.46,2.1 -1.48,0.34 -0.66,-0.14 -0.51,0.62 -1.66,0.08 -0.44,-0.76 -6.09,-0.23 -4.15,10.01 1.99,1.07 -0.2,0.67 -0.83,0.45 -0.1,0.59 0.28,0.45 2.08,0.13 -0.31,2.76 0.97,0.14 0.13,0.29 -0.3,0.91 0.18,0.94 -2.53,0.33 0.12,2.19 -0.76,-0.06 -0.1,1.23 -0.82,0.83 -0.4,-0.48 -0.89,-0.12 -0.28,0.99 -0.92,0.11 -0.28,1.76 -1.31,1.21 0.11,1.25 -0.3,0.42 0.69,0.59 -0.14,2.28 0.67,1.2 -1.81,0.82 0.37,1.13 -0.62,2.48 0.52,0.58 0.09,0.89 -1.24,3.33 0.05,0.63 -3.16,-0.37 -0.87,1.59 -1.39,0.25 -0.68,0.9 -0.12,1.29 0.81,0.15 0.54,0.81 1.48,1.06 0.04,0.71 0.77,0.46 1.04,1.85 0.66,0.41 0.72,1.14 1.65,0.39 0,0 -0.23,0.94 -1.93,0.7 -1.3,-0.63 -0.18,0.64 -0.67,0.16 -0.43,0.62 -1.42,-0.38 -0.76,0.28 -0.25,-0.38 -2.44,1.35 -1.36,-0.76 -1.08,0.87 -0.07,-0.22 -2.16,0.25 -0.72,0.63 0.59,0.55 0,0.43 -0.55,0.42 -0.74,3.35 -1.56,0.19 -0.82,0.43 -1.06,2.39 -0.58,0.33 -0.05,0.88 -1.1,1.07 -0.02,1.22 -0.77,0.57 -0.3,1.51 -1.29,0.25 -0.65,0.46 -3.57,3.41 -1.3,-0.07 -1.84,0.71 -0.95,-0.22 -2.18,0.64 -0.73,-0.2 -0.72,-0.94 -1,0.26 -1.61,-0.66 -1.89,0.29 -0.42,-0.57 -0.56,-0.15 -1.35,0.58 -1.03,-2.09 -1.42,-1.21 0,0 1.78,-3.45 1.43,-1.4 0.69,-0.28 0.3,-0.69 1.46,-1.03 1.11,-1.43 0.08,-0.94 -0.41,-1.55 0.51,-0.37 0,0.3 0.25,-0.01 -0.15,-0.28 0.55,0.02 1.06,-0.62 1.3,-1.55 0.04,-0.76 -0.73,-1.14 -1.97,-0.81 -0.11,-1.11 -0.87,-1.83 -0.05,-0.71 0.99,-1.81 -0.01,-1.1 -1.52,-2.67 -0.66,-2.62 -2.18,-1.71 0.43,-2.04 -0.54,-0.59 -0.9,0.1 -0.22,-0.91 -1.62,0.42 0.18,-0.71 -0.34,-1.1 -1.48,-0.62 -0.24,-1.06 -0.48,0.58 -1.61,0.24 -1.77,1.04 -0.65,-0.69 -0.86,0.24 -0.4,0.81 -0.32,-0.33 -1.05,0.12 -0.38,-1.07 -0.79,-0.1 0.21,-0.6 -0.72,-0.66 -0.11,-1.31 -0.92,-0.73 -0.45,0.04 -0.89,-1.02 0,0 2.33,-2.89 1.67,-0.39 0.51,-0.7 1.14,-0.52 0.12,-0.93 -0.73,-0.34 -0.64,-1.73 0.06,-1 -1.01,-1.19 -0.31,-1.31 -1,-0.07 -0.4,-0.85 -1.12,0.02 -0.87,-1.32 0.12,-0.55 -0.83,-0.68 0.25,-0.75 0.66,-0.05 0.33,-0.34 0.1,-0.81 -0.52,-2.18 0,0 0.82,-1.93 -0.33,-0.72 -1.2,0.13 0.14,-0.54 1.14,-1.1 1.34,-3.07 1.51,-0.73 -0.3,-1.1 2.25,-0.72 0.16,-2.42 -0.13,-1.01 -0.83,-0.84 -0.64,-0.18 -1.52,0.25 -1.52,-0.72 -0.76,-0.95 -3.99,-0.84 -0.1,-0.94 -0.77,-1.26 -0.25,-3.58 2.77,-3.21 1.55,-2.38 2,-1.05 -0.13,-0.85 -1.37,-1.47 -0.12,-1.17 -0.19,-0.32 -1.05,0.05 -3.85,0.56 -1.24,-2.02 -1.51,-3.92 -2.42,-0.08 -0.14,-2.03 -0.33,-0.66 -0.82,-0.34 -4.56,-0.88 -3.27,0.23 -2.36,0.64 -6.44,0.17 -0.48,-1.55 0.57,-1.07 -0.01,-2.08 0.66,-0.58 0.57,-1.34 -3.07,-5.98 -0.84,-0.63 -0.19,-0.82 0,0 2.24,-1.66 7.86,-4.49 -0.06,-2 1.04,-0.83 1.19,-0.3 -0.35,-1.2 -1.87,-0.43 -1.81,-1.66 -1.35,-0.16 -1.87,-1.08 -1.35,-0.29 -0.57,-0.52 -1.23,-2.52 0.01,-2.9 0,0 0.51,-1.34 2.38,-2.8 0.3,-2.05 0.59,-1.4 1.69,-1.69 0.53,-1.33 1.12,-0.96 0.19,-1.3 0.4,-0.32 0.18,-0.79 -0.59,-1.5 0.38,-0.53 -0.16,-0.72 0.33,-1.79 -0.43,-0.26 -0.68,0.12 -0.79,-1.82 -1.4,-0.79 -0.21,-0.75 1.38,-1.43 0.3,-2.76 1.05,-0.59 1.32,-1.44 1.97,-1.45 0.03,-3.52 -0.54,-1.64 0.18,-0.62 -0.69,-1.48 0.74,-1.33 -0.77,-3.58 -0.68,-0.07 -0.2,-0.41 -0.91,-0.38 -1.5,1.08 -0.7,-0.12 -0.68,-0.8 -1.03,-0.36 0.6,-0.71 -0.18,-0.54 -2.59,0.49 -2.09,-0.21 -0.29,-0.43 0.48,-1.04 -0.79,-1.88 0.54,-1.19 1.71,-1.61 -0.76,-3.72 -0.96,-0.85 -1.68,-0.56 1.28,-0.76 -0.34,-0.81 -2.52,-1.74 -1.46,0.35 -0.88,-0.27 -0.44,-0.59 -0.24,-1.9 -0.97,-1.26 -0.24,-0.83 0.67,-0.7 0.02,-0.88 0.99,-0.7 -1.64,-3.33 -1.85,-2.23 -0.07,-0.81 0.79,-1.3 0.69,-0.55 0.27,-0.88 -0.81,-2.4 -1.15,-0.74 -0.13,-1.04 -6.36,-5.85 1.35,-1.61 -0.17,-2.06 0.58,-1.2 -0.05,-0.69 -1.99,-2.03 -0.3,-1.92 -1.01,-0.75 -1.21,-2.54 0.3,-0.34 0.71,0.03 1.29,-0.52 0.98,0.44 1.2,-0.4 0.1,-2.73 1.01,-1.23 0.23,-1.64 1.19,-0.85 0,0 0.15,-3.04 0,0 -0.43,-2.61 1.6,-1.08 -0.12,-1.1 -0.33,-0.99 -1.73,-1.75 -0.51,-2.69 -0.98,-1.88 0.79,-0.99 -0.5,-0.96 -1.43,-0.14 -2.34,-0.87 -0.14,-0.74 1.08,-1.51 0,-1.1 -2.04,-1.5 -0.51,0.86 0.15,1.25 -0.23,0.95 -0.61,0.64 -0.73,0.17 -0.96,-0.26 -1.69,1.04 -0.88,-0.08 -2.34,-1.8 -0.94,0.11 -1.87,-0.78 -2.2,0.19 -0.85,-0.47 -0.78,-1.37 -0.55,-0.12 -1.35,-4.51 -2.84,-0.62 0.25,-1.75 -0.84,-1.6 -0.26,-1.18 1.53,-1.51 1.41,-2.3 0.07,-1.44 0.32,-0.49 0.5,0.12 0.56,0.22 0.12,0.59 1.08,-2.11 3.55,-3.53 0.05,-0.71 0.86,-0.43 1.56,0.03 1.18,0.93 0.82,0.08 0.33,-0.57 -0.12,-0.42 -1.09,-1.25 1.19,-3.29 -1.25,-1.4 0.62,-2.19 -0.77,-1.65 -0.21,-2.8 -0.55,-1.04 -2.44,-0.75 -2.49,-1.21 -2.47,-3.4 -0.84,-0.07 -0.64,-0.57 -0.51,-2.33 0.17,-0.84 0.59,-0.26 0.23,-0.76 -0.14,-2.2 2.86,-0.08 1.36,-0.66 0.96,-1.44 0.59,-3.01 1.56,-0.52 0.2,-0.53 -0.45,-1.18 -2.28,-1.66 -1.4,-0.45 -0.71,-0.88 -2.16,0.37 -1.63,-0.25 -2.09,-1.57 -2.16,-2.24 0.12,-1.33 -1.36,-2.52 0,0 4.8,0.24 1.94,0.41 3.08,3.24 1.01,0.62 -0.2,0.6 0.58,-0.47 3.67,1.77 0.81,2.17 0.94,0.15 0.68,1.32 2.15,2.42 0.6,2.1 2.4,1.43 1.32,0.17 2.82,-0.43 3.35,-1.41 0.98,-0.11 0.66,0.02 0.57,0.85 1.47,0.28 0.53,0.74 0.07,0.71 -0.97,1.89 -1.38,0.86 0.17,2.83 -1.99,0.88 -3.44,2.52 0.59,4.14 -0.93,1.42 0.59,0.52 -0.15,0.77 -0.13,-0.42 -0.12,0.32 1.39,4.49 -1.1,1.28 -0.29,1.65 -0.96,0.92 0.54,1.34 -0.05,0.66 -0.58,1.1 -1.15,0.72 0.08,0.51 -0.5,0.51 0.45,-0.14 0.11,0.94 -0.88,1.83 0.35,0 0.66,-1.83 0.08,-1.84 0.66,-0.21 0.74,-1.29 -0.02,1.52 0.21,-0.03 0.03,0.73 0.54,0.37 0.08,0.74 -0.2,0.31 -0.08,-0.22 -1.18,-0.01 -0.35,0.27 1.19,-0.07 0.33,0.27 0.79,1.35 0.15,0.91 -0.76,0.41 -0.4,0.64 0.05,1.36 0.23,0.14 -0.1,-1.52 0.47,-0.64 0.65,-0.26 0.25,0.39 0.3,-0.62 1.48,0.54 2.39,2.55 -0.37,0.88 -1.29,-0.17 -0.53,-0.54 0.05,0.32 0.49,0.37 1.35,0.19 1.3,0.75 0.4,0.92 1.6,1.79 0.65,1.78 2.45,0.06 -0.08,0.36 0.12,-0.59 0.7,0.02 1.54,3.2 0.81,0.43 0.88,-0.27 1,-0.95 -0.25,-0.4 -0.8,0.41 -0.34,-1.55 -2.06,-0.57 -1.1,-1.67 0.14,-0.16 0.37,0.47 -0.16,-0.44 -1.23,-0.54 -0.64,-0.81 -0.96,-1.8 -0.28,-1.28 -0.65,-0.72 -2.08,-0.62 0.25,-1.38 -1.4,-3.12 0.41,-0.97 0.02,0.25 1.14,0.45 0.91,-0.05 1.15,-0.71 0.41,0.6 -0.08,-0.7 0.42,-0.19 1.34,-2.2 -0.34,-0.93 0.28,-0.38 -0.45,0.12 0.42,-0.41 -0.06,-0.45 -0.58,-0.85 -1.15,-5.26 0.06,-0.83 -0.78,-2.75 -0.78,-1.15 -0.62,-0.13 -0.46,-1.3 0.59,0.31 0.18,-0.73 -0.81,-2.34 1.22,-1.35 0.78,-3.96 0.85,-0.53 0.49,-0.82 0.34,-1.36 -0.12,-0.82 -1.1,-1.71 -0.73,-0.61 0.28,-1.18 -0.94,-1.29 -0.91,-0.55 -2.71,-0.49 -0.31,-0.3 -0.4,0.24 -0.04,0.5 -1.31,-3.83 -1.81,-1.51 0.15,-0.28 0.52,0.37 0.87,-1.05 -0.38,-0.1 0.13,-0.35 -0.33,-0.16 -0.86,-2 -2.57,-1.33 0.37,-0.85 -0.59,0.61 -1.3,-0.25 -0.39,-0.38 -0.85,0.24 -0.24,-0.37 -1.4,0.03 -2.07,-1.53 -0.64,-0.15 -0.44,-0.58 -0.63,-1.61 0.14,-0.51 0.51,-0.23 -0.25,-0.79 0.77,-0.91 -0.42,-0.5 -0.84,0.53 -0.4,-0.27 -0.15,-1.41 0.08,-1.14 1.43,-1.61 -0.28,0.05 -0.22,-0.61 0.43,-2.51 -0.61,-1.98 0.1,-0.48 -0.83,-0.82 -1.31,-0.59 0.81,-0.34 -0.11,-0.94 -1.47,-0.47 -0.17,-0.71 -0.54,0.28 0.63,-0.53 1.4,0.15 -0.04,-0.54 0.61,0.44 0.96,-0.24 -0.81,-0.33 -0.29,-0.6 0.28,-0.08 -1.26,-1.1 -0.5,0.23 -0.71,-0.51 0.7,-1.59 0.42,0.27 0.45,-0.29 -0.17,-0.53 0.75,-0.36 0.62,-1.02 -0.6,-0.07 0.12,-0.67 0.32,-0.21 -0.18,-0.51 -0.51,0.2 -0.07,0.63 -0.21,-0.03 -0.1,-0.73 -0.41,-0.41 0.47,-0.66 -0.28,-0.39 1.65,-0.42 0.71,0.66 0.44,-0.03 -0.01,-0.51 1.31,-0.16 -0.09,-0.28 1.65,0.17 0.57,-0.27 0.06,-0.45 3.6,-0.85 3.17,-0.33 0.48,0.53 0.08,0.63 0.18,-0.31 -0.37,-0.87 7.67,0.17 6.61,-1.78 2.6,-1.18 1.3,0.29 1.11,0.92 1.61,0.14 1.32,-0.41 0.08,-1.46 1.18,-1.06 1.76,-0.08 1.28,-1.02 3.18,-0.59 0.3,0.34 1.3,-0.63 0.14,0.29 0.7,-0.1 0.36,0.47 1.15,0.42 0.8,-0.65 -0.32,0 -0.31,-1.62 -0.37,-0.8 -0.81,-0.43 -0.28,-1.07 1.15,-0.58 1.69,0.03 -0.05,-0.4 1.01,-0.41 -4.04,0.59 -0.54,-0.65 0.29,-0.54 -1.08,-0.57 0.57,-1.33 -0.76,-1.52 -0.5,-0.39 -1.31,-0.08 -0.81,-0.75 -1.14,0.15 -1.37,-0.62 -0.51,-0.81 0.06,-0.94 0.45,-0.83 0.96,-0.15 0.27,0.42 0.24,-0.28 0.96,1.91 0.18,-0.69 -0.34,-1.43 -1.52,-0.75 1.11,-0.19 0.09,-0.24 0.49,0.29 0.02,-0.54 0.38,-0.34 0.29,0.3 0.42,-0.57 0.67,-0.03 1.09,1.25 -0.33,0.7 0.55,-0.31 0.46,0.87 0.18,-0.54 1.16,0 -0.18,0.9 -1.59,1.43 0.81,0.4 0.16,-0.9 0.88,-0.49 -0.16,0.8 0.33,0.45 -0.35,0.72 0.3,0.15 0.4,-0.42 0.08,-0.94 -0.53,-1.35 0.17,-0.34 1.33,0.86 1.11,-0.13 0.02,-0.72 -0.52,-0.24 0.13,-1.17 -0.4,0.07 0.39,1.86 -0.41,0.24 -1.56,-1.39 0.47,-1.15 0.52,-0.21 -0.37,-0.29 0.02,-0.46 -0.69,1.43 -1.37,0.34 -0.57,-0.17 -0.04,-0.33 0.35,-0.2 -0.78,-0.16 0.2,-0.92 -0.31,0.16 -0.31,-0.74 -0.49,0.14 0.04,-0.54 1.37,-0.88 -1.64,0.1 -0.34,-0.26 0.07,-0.36 -0.99,-0.26 0.27,-0.77 -0.85,-0.13 -0.05,0.28 -0.64,-0.08 0.03,-0.26 -1.19,0.04 -0.2,-0.4 -0.29,0.51 -0.44,-0.19 -0.86,0.52 0.66,-0.76 -0.86,-0.57 0.96,-0.79 -0.46,-0.53 0.11,-0.51 0.87,-0.51 0.63,0.51 0.28,-1.32 0.35,0.15 0.2,-0.3 -0.9,-0.69 -0.16,-0.87 0.77,-0.09 0.34,1.06 0.55,-0.68 0.03,0.47 1.06,0.69 0.03,0.59 -0.77,-0.26 -0.34,0.35 0.49,0.43 0.34,1.04 0.49,-0.87 0.58,-0.12 0.3,0.3 -0.19,0.64 0.84,-0.52 -0.06,1.14 -0.5,0.46 0.98,-0.21 0.29,0.35 -0.39,0.37 0.02,0.85 0.72,-0.44 1.25,0.78 -0.67,-1.1 0.18,-0.72 0.41,-0.25 -0.25,-0.23 -0.9,0.13 -0.3,-0.67 0.51,-0.48 -0.23,-0.21 0.5,-0.12 -0.22,-0.27 0.24,-0.36 0.42,0.38 0.49,-0.04 0.59,0.63 -0.18,-0.69 0.47,-0.67 -0.59,0.03 0.33,-2.34 0.67,-0.01 -0.25,-0.41 1.85,-2.08 -0.66,0.1 -0.75,-1.14 0.35,-0.33 1.27,-0.16 0.44,0.71 -0.47,0.58 0.64,0.08 0.4,0.47 0.43,-0.99 0.64,-0.04 0.26,-0.69 -0.13,-0.94 -2.05,-0.17 -0.39,0.3 -2.2,-1.49 -1.08,-0.08 -0.02,0.73 -0.48,-1.26 0.71,-0.84 1.78,-0.46 5.28,1.13 0.93,-0.25 0.74,-0.72 -0.03,0.39 0.5,-0.18 0.68,-0.44 -0.1,-0.48 0.4,-0.02 -0.67,-0.52 1.69,-2.59 0.55,0.29 0.32,0.94 0.42,0.06 -0.76,-1.37 0.08,-0.97 1.12,-0.63 1.35,0.22 -0.52,-0.49 0.13,-0.29 -0.53,0.34 -0.46,-0.16 0.79,-0.87 1.52,-0.32 0.23,1.11 -0.22,0.24 1.02,-0.1 -0.64,-0.22 -0.45,-1.49 -1.15,0.17 -0.79,0.47 -0.44,-0.18 2.46,-1.28 0.34,0.11 1.23,-2.11 1.11,0.07 0.49,0.58 -1.42,-0.3 -0.11,1.06 1.12,0.26 -0.34,0.61 0.52,0.17 0.65,-0.6 0.23,0.28 0.98,0.08 -0.38,-0.76 0.12,-0.73 1.38,-0.38 0.76,0.14 0.19,-0.38 0.31,0.18 -0.95,-1.1 0.08,-0.28 1.17,-0.73 0.68,-0.03 0.47,-0.64 1.23,0.44 1.13,-0.85 0.41,0.22 0.31,-0.4 -0.2,-0.37 1.14,-0.4 0.6,-0.56 -0.1,0.75 0.5,0.98 1.11,-1.42 0.78,-0.51 -0.29,0.91 0.25,0.4 0.78,-0.01 1,-0.96 0.41,0.67 0.99,0.35 -0.37,-1.81 0.43,-0.38 0.03,-0.87 0.82,0.15 -0.27,0.54 1.69,-0.49 -0.05,0.43 0.45,0.25 0.38,-1 2.15,-0.06 -0.05,-0.73 0.52,-0.5 0.95,0.2 0.28,-0.3 2.34,-0.43 1.07,-0.7 0.81,0.15 1.03,-0.28 2.15,-1.27 0.97,-0.15 2.43,-1.6 -0.14,-0.92 -0.3,0.84 -3.15,1.33 -0.47,-0.31 -0.29,-1.39 -0.45,0.9 0.36,0.87 -0.42,0.32 -1.13,-1.75 -0.46,-0.17 0.29,-1.06 0.39,-0.27 -0.56,-0.06 -0.28,0.63 -0.87,0.25 -1.1,0.87 1.4,0.85 -0.82,0.3 -0.77,-0.32 -0.55,0.28 0.48,-0.94 -0.37,-0.35 0.01,-0.77 -0.48,-0.13 1.17,-0.87 -0.06,-1.26 -0.34,-0.44 1.06,-0.53 -0.23,0.92 0.52,0.41 -0.11,0.43 1,-0.62 0.31,-0.55 -0.31,-0.34 0.6,-0.5 -1.14,-0.55 0.62,-0.6 0.44,0.75 0.77,-0.76 0.56,0.47 -0.23,0.48 -0.73,0.42 0.51,0.29 0.21,0.57 -0.4,0.66 0.17,0.2 0.5,-0.06 0.46,-0.56 0,-0.82 0.3,0.49 1.08,-0.75 0.23,0.49 1.72,0.09 -0.35,-0.5 -0.66,-0.23 -0.19,-0.5 -1,-0.13 -0.26,-0.49 0.23,-0.28 1.57,0.29 0.95,-0.18 0.2,-0.35 0.7,0.83 0.82,-0.74 0.78,-0.14 -0.16,0.61 0.61,0.28 0.02,0.86 0.59,-0.33 0.73,0.06 -0.41,-0.83 0.66,-0.24 0.72,0.23 -0.32,-0.41 0.33,-0.4 -1.75,0.02 -0.11,-0.42 0.47,-0.22 1.87,0.04 0.58,1.2 0.92,0.53 0.87,-0.73 0.65,0.5 1.12,-1.74 0.34,0.34 1.05,0.11 0.17,0.37 1.39,-0.11 1.61,1.21 0.39,-0.27 0.06,0.33 0.89,0.33 -0.68,0.51 -0.34,-0.37 -0.81,0.74 0.3,0.43 0.65,0.05 -2.23,3.33 -1.54,1.55 0.71,1.29 0.32,-0.14 0.65,-1.7 1.85,-1.92 0.54,0.74 0.52,-0.46 0.66,0.18 0.21,-0.26 -0.28,-0.1 0.12,-0.51 -0.49,-0.22 0.86,-0.29 0.22,-0.47 0.93,-0.02 -0.36,0.93 1.12,-0.2 0.27,0.25 -0.28,0.8 -1.72,2.34 0.26,0.17 1.13,-0.57 0.51,-0.61 0.71,0.45 0.22,-0.64 0.92,-0.6 0.2,-1.06 0.32,0 1.9,-1.8 0.7,0.06 -1.4,0.96 -0.16,0.35 0.67,0.73 -0.68,0.54 0.03,0.28 0.93,-0.01 0.31,-1.31 0.69,-0.19 0.28,-0.43 0.52,-0.1 1.14,0.83 0.32,-0.36 0.71,0.18 -0.51,-1.5 -0.9,0.03 -0.66,-0.59 1.81,-1.34 0.27,0.07 -0.13,0.45 0.6,0.14 -0.16,0.34 0.25,0.32 0.78,-0.46 0.22,0.2 0.39,-0.65 0.63,0.14 0.18,-0.6 -0.85,-0.06 -0.23,-0.47 -0.34,0.34 -0.55,-0.33 0,-0.37 0.52,-0.43 0.55,0.13 -0.07,-0.33 0.62,-0.56 1.67,-0.26 1.79,-1.88 1.25,-0.8 0.3,0.24 -0.58,1.49 1.01,0.1 0.15,-0.63 1.05,0.42 1.55,0.1 0.11,0.46 -1.09,1.18 0.06,0.27 0.37,0.45 1.41,-0.13 1.05,-0.78 -0.18,1.13 -0.99,0.58 0.13,0.25 1.11,0.06 0.27,-0.81 0.83,-0.68 -0.08,-0.59 -1.03,-1.17 -0.29,-1.45 -1.33,-1.04 -0.02,-0.67 -0.56,-0.98 -1.51,-0.21 -0.52,-2.23 -1.01,-1.49 0.08,-0.64 0.36,-0.46 0.55,-0.04 3.29,1.63 1.71,0.1 2.42,-0.65 1.48,0.09 0.38,0.4 3.66,-1.41 0.71,-0.75 0.41,0 0.14,-0.54 0.82,-0.43 0.52,-3.85 0.61,-0.23 0.27,-0.77 -0.22,-0.98 -1.71,-0.86 -0.72,-2.57 0.95,-3.66 0.74,0.08 0.07,0.44 0.35,-0.03 0.38,-0.71 0.35,-0.03 -0.06,-1.56 0.56,-0.69 -0.49,-0.01 0.1,-0.47 -0.57,0.22 0.95,-1.96 2.29,-3.36 0.68,-1.48 2.04,-2.43 0.23,-0.98 0.6,-0.04 1.27,0.91 -0.66,-1.4 0.79,-0.42 0.72,0.13 -0.37,-0.15 0,-0.61 1.69,-2.83 -0.06,-0.38 0.5,-0.39 0.35,0.13 -0.1,-0.3 1.71,-0.95 0.3,-0.51 -0.12,-0.38 0.35,0.13 1.04,-2.07 1.09,-0.31 0.14,0.98 1.63,-0.28 3.21,-3.51 0.41,0.42 0.75,-0.59 0.44,0.44 0.12,0.69 -0.43,0.39 0.91,0.95 1.68,-1.13 0.54,-0.07 0.62,0.37 0.01,1.21 0.37,0.22 -0.29,0.48 1.19,1.64 0.56,-0.56 2.09,1.51 1.04,0.22 0.73,-0.11 0.51,-0.55 1.74,0.02 -0.29,0.38 0.54,1.3 -0.12,1.18 0.37,1.12 0.35,0.17 -0.14,0.51 1.2,0.86 0.03,0.57 0.81,0.06 -0.48,0.71 -0.66,0.19 -0.5,-0.5 -1.59,-0.47 -0.55,0.46 -1.82,0.29 0.05,0.68 0.4,-0.22 0.07,-0.45 1.57,-0.26 0.14,0.2 -1.65,2.26 -0.5,-0.26 -0.26,0.52 -0.36,-0.11 -1.26,0.77 0.85,-0.41 1.47,-0.08 0.14,0.61 -0.97,1.44 -3.77,2.02 -0.81,-0.33 -0.82,0.12 -1.28,1.33 -1.2,0.06 -0.97,1 0.56,0.39 0.96,0.07 0.57,-0.4 1.3,0.11 0.42,-0.74 0.68,1.04 1.51,0.5 0.99,-1.01 0.52,0.52 0.67,0.08 1.77,-0.98 1.14,0.22 1.01,-1.2 -0.42,0.9 0.07,1.23 -0.94,0.79 0.4,0.55 -0.83,0.23 -0.79,-0.28 -0.75,0.48 0.08,0.37 0.45,-0.26 0.54,1.06 0.62,-0.15 0.34,-0.47 1.12,-0.01 2.03,-2.14 1.66,0.43 0.46,1.28 0.37,-0.06 0.5,-0.75 0.44,1.08 0.64,-0.27 -0.69,-0.29 0.16,-0.52 0.6,-0.01 -0.24,-0.69 0.8,0.01 0.76,0.8 -0.15,0.4 0.97,-0.08 -0.52,0.64 0.17,0.16 2.21,-0.58 -0.69,0.52 0.79,0.76 -0.1,0.7 0.37,0.54 1.06,0.48 -0.26,0.51 -1.84,0.47 1.1,0.55 -1.15,0.88 0.02,0.41 0.53,-0.39 0.12,0.21 -0.56,0.93 -1.43,0.42 -0.04,1.53 -0.48,0.14 -0.46,0.76 -0.93,-0.23 0.09,1.2 0.41,0.17 0.01,0.31 -0.47,0.93 0.05,0.93 -0.46,0.58 0.15,0.54 -0.67,1.03 -0.37,-0.25 -0.35,-1.17 -0.85,0.32 0.66,1.06 -0.43,0.58 0.7,0.85 0.3,-0.04 -0.08,0.43 1.02,-0.29 0.34,-0.4 0.66,1.4 0.16,-1.34 1,0.09 2.28,-0.89 0.81,0.1 1.15,0.79 0.53,-0.05 1.3,-1 0.84,-1.44 0.19,-1.66 -0.42,-1.02 -0.03,-1.9 0.44,-0.43 1.47,0.13 -0.14,-0.42 0.47,-0.23 1.35,0.94 1.51,0.43 1.85,-0.46 1.15,-0.89 1.12,0.13 1.41,-0.99 0.42,0.19 -0.34,0.36 1.65,0.15 1.05,1.18 0.84,0.17 -0.15,0.39 0.99,-0.62 0.21,1.21 0.21,-1.1 2.07,-1.3 1.66,-0.46 0.66,0.1 -0.06,0.69 1.44,0.34 0.85,-0.16 -0.28,-0.31 1.24,-0.72 0.78,0.47 -0.68,1.04 0.4,0.31 -0.11,0.76 0.66,-0.43 1.86,0.45 0.25,-0.41 1.27,0.74 0.1,0.59 -1.25,-1.03 0.25,0.5 -0.66,1.48 0.85,-0.03 -0.62,0.5 0.97,-0.04 1.39,1.06 0.58,0.64 0.16,1.06 0.81,0.51 0.6,1.85 0.49,0.42 0.41,-0.52 0.23,0.71 1.48,1.53 0.67,1.16 0.84,0.56 -0.51,0.79 -0.04,2.76 -0.45,-0.04 -0.76,-0.9 -0.69,0.09 0.71,0.85 -0.17,0.37 0.74,0.19 -0.25,0.36 0.77,-0.02 -0.06,-0.33 0.58,-0.16 -0.08,0.78 0.44,1.05 0.15,0.98 -0.3,0.61 -0.9,0.59 -0.59,-0.14 -0.14,0.32 0.93,0.02 -0.17,0.22 0.41,0.09 0.03,-0.54 0.8,0.31 0.37,0.57 -0.17,-1.01 1.1,-0.47 -0.09,-0.82 -0.39,-0.31 0.36,-0.76 0.52,-0.16 0.35,0.31 0.04,-0.42 0.48,0.08 0.77,0.82 -1.31,-1.87 -1.09,-0.26 -0.39,-1.22 0.26,-0.3 1.39,0.24 0.13,-0.55 0.56,0 0.39,1.01 -0.32,0.21 0.77,0.44 0.38,1.07 0.3,1.69 -0.24,0.65 0.56,1.92 0.22,2.71 -0.3,0.45 0.38,0.68 -0.11,0.36 0.34,0.48 -0.34,-1.71 0.39,-0.3 0.49,0.28 0.46,-0.75 0.52,0.81 0.23,-0.3 0.27,0.53 z m -260.56,-122.65 0.28,1.15 -0.62,0.48 -5.29,0.3 -0.57,-0.55 -0.21,-1.89 -0.83,0.39 -0.46,-0.3 -0.47,0.48 -0.86,-0.73 -1.31,-2.38 -0.02,-1.550002 0.4,-0.44 0.61,0.11 1,0.710002 -0.09,0.41 -0.47,-0.08 -0.11,0.25 0.66,0.51 0.87,-0.89 0.99,0.21 5.09,3.47 1.41,0.34 z m 14.29,206.8 -0.22,0.78 -0.65,-0.05 -0.54,0.39 -0.9,-0.44 -1.39,-0.04 -1.26,-0.48 -0.35,-0.67 -1.37,-0.9 -0.04,-1.27 2.5,-3.37 0.8,-1.79 0.86,-0.75 0.75,0.11 -0.97,0.27 1.44,1.69 0.99,2.27 -0.02,0.3 -0.33,-0.08 0.51,2.39 -0.25,0.45 0.44,1.19 z m -5.71,-261.710002 -0.71,-0.26 -0.4,-0.67 0.4,-1.64 1.48,-2.67 2.66,-1.14 1.35,0.1 2.76,1.1 0.87,0.94 0.05,1.29 -0.34,0.62 -2.62,1.85 -4.21,0.58 -1.29,-0.1 z m 26.09,319.930002 -0.49,-1.39 0.66,1.2 -0.17,0.19 z m 138.2,-253.81 -0.14,0.38 -0.13,-0.45 0.27,0.07 z m -10.98,30.42 0.57,-0.4 0.46,-1.11 0.02,-0.77 -0.38,-0.23 0.55,-0.89 0.19,-1.79 2.2,-1.53 -1.53,0 -0.32,-0.28 0.3,-2.03 2.02,-4.82 0.3,0.03 0.47,1.01 2.6,1.07 0.69,0 -2.19,-1.6 -0.31,-1.16 0.31,-0.37 -0.75,-0.72 1.47,-5.78 0.45,-0.27 2.15,1.62 1.26,0.5 0.38,-0.16 -1.77,-1.26 -0.55,-0.66 0.2,-0.57 -0.43,0.25 -1.38,-0.84 0.34,-1.48 0.81,-1.02 1.62,-0.08 -1.58,-0.83 0.74,-2.98 0.89,-0.52 0.8,0.44 -0.12,-0.45 0.65,0.13 0.23,-0.25 -0.1,-0.98 -0.51,-0.74 -0.06,-1.45 0.47,-1 0.34,0.11 0.38,-0.57 0.8,-0.13 0.91,3.99 -0.19,0.54 2.13,0.99 0.15,0.58 -0.69,-5.85 0.69,-2.48 1.08,-0.49 0.51,0.83 2.55,1.19 0.4,1.47 0.42,-0.13 -0.2,0.74 0.53,-0.23 -0.07,0.76 0.56,-0.34 0.4,0.48 -0.73,1.68 -0.29,-0.15 -0.7,1.58 -0.42,0.11 0.25,0.25 -0.77,2.81 0.28,0.85 -0.84,1.94 0,3.5 0.23,0.15 -0.43,1.52 -1.12,0.97 0.18,0.22 -0.4,0.36 -0.06,1.24 -0.75,2.01 0.71,-0.25 0.26,0.2 0.94,-1.85 0.42,0.3 0.23,-0.28 -0.3,-0.14 -0.05,-1.21 0.56,-0.13 -0.03,-0.68 1.28,-4.15 0.04,-1.34 1.01,1.06 -0.12,-0.51 0.28,-0.33 1.59,-0.96 0.12,-1.11 0.39,0.2 0.5,-0.39 0.18,-1.91 0.35,-0.78 0.24,-0.09 -0.01,0.63 0.38,-0.49 0.05,0.22 -0.14,2.57 0.44,-1.34 0.73,-0.24 -0.05,-0.74 0.41,-0.48 -0.02,1.52 1.21,0.05 0.17,0.26 0.01,1.64 -0.52,0.73 0.75,1.28 -0.19,1.12 0.4,0.18 0.58,-0.43 1,0.42 1.24,2.17 -0.08,1.94 0.47,0.01 -0.13,0.39 0.51,-0.47 0.53,0.36 -1.32,0.81 -2.7,-0.68 -0.35,0.33 0.73,0 0.83,0.6 0.4,-0.18 0.89,0.23 1.21,0.79 0.11,1.18 -0.37,0.4 -0.21,1.29 1.56,-2.88 -0.46,-0.18 0.05,-0.36 0.79,-0.71 1.33,0.73 1.17,1.18 0.78,2.62 -0.49,-0.09 -0.03,0.54 0.6,0.38 -0.12,1.69 0.59,4.16 -0.37,1.67 -1.29,2.91 -2.19,3.5 -0.52,0.3 0.05,-0.43 -0.52,-0.35 -1.53,0.57 -2,-0.05 -2.38,2.06 -1,0.18 -0.15,0.38 -1.51,-0.15 -1.27,0.53 -0.54,0.59 -1.33,-0.33 -0.89,0.64 0.18,0.77 -1.4,1.12 -0.04,-0.57 0.48,-0.28 -0.57,-0.64 0.13,-0.84 -1.63,0.15 -0.53,0.33 -1.05,-0.14 -1.54,0.94 -0.54,-0.54 0.69,-0.75 -0.28,-0.59 -0.63,1.31 -1.88,0.33 -1.19,-0.33 -0.32,0.22 0.46,-0.87 -0.18,-0.1 -0.54,0.97 -1.72,0.63 -2.84,3.12 -1.8,0.98 -3.65,3.49 -1.3,-0.03 -0.06,-0.4 -0.95,0.13 -0.9,0.92 -0.6,-1.04 -0.13,-1.88 -0.52,-0.38 1.83,-5.46 0.58,-0.61 0.46,-1.36 1.97,-3.51 -0.17,-2.44 z m 2.46,-6.41 -0.15,0.44 -0.25,-0.03 0.02,-0.33 0.38,-0.08 z m 2.87,-8.22 -0.09,0.29 -0.26,-0.14 0.35,-0.15 z m 28.16,18.74 -0.08,-0.23 0.32,-0.06 -0.24,0.29 z m -9.64,-29.58 -0.19,0.21 0.1,-0.86 0.09,0.65 z m -26.71,42.08 0.16,-0.34 0.25,0.09 -0.41,0.25 z m -12.9,-81.740002 0.06,0.71 1.14,0.85 0.1,0.59 -1.53,1.58 0.6,1.93 -0.42,0.74 0.65,0.41 -0.4,1.39 -0.93,0.55 -1.06,1.53 -1.09,-0.31 -0.95,0.13 1.18,0.47 0.12,0.31 -4.13,2.12 -0.47,0.68 -1.15,0.08 -2.24,1.91 0.24,0.34 0.66,-0.33 0.5,0.14 1.52,-1.07 0.58,-0.03 0.27,0.83 0.13,-1 0.76,-0.54 0.13,-0.45 0.87,-0.6 3.33,-1.02 -0.07,1.6 -1.13,1.01 -1.4,0.5 -0.34,0.96 -0.76,0.43 -0.34,1.55 0.25,1.03 -0.33,0.710002 0.31,0.93 0.08,-3.190002 2.21,-1.99 1.02,-0.48 0.61,-0.99 0.78,0.5 -0.04,-1.85 0.55,0.01 0.38,-0.59 0.58,0.01 0.98,-0.59 0.49,0.07 -1.05,-3.36 0.41,-0.42 0.29,0.41 0.71,0.11 0.55,-0.87 0.01,-1.41 0.35,-0.23 -0.14,0.75 0.34,-0.31 0.32,0.19 -0.67,1.81 -0.04,1.15 0.44,-0.41 0.27,0.22 -0.15,-1.23 0.6,-1.75 0.06,-1.41 -0.62,-0.83 -0.14,-1.14 0.51,-0.85 1.25,-0.74 0.23,0.12 -0.46,0.96 0.56,0.54 0.5,-0.28 0.39,-0.83 0.28,0.12 0.1,0.62 0.87,-0.73 1.8,0.02 0.01,0.36 -1.06,0.71 0.05,0.41 1.61,-0.41 0.39,0.46 -0.75,0.59 -0.08,0.57 1.54,0.08 -0.45,0.41 1.11,0.15 0.22,0.43 -0.31,0.2 -0.25,1 0.21,0.09 0.34,-0.71 0.59,0.67 -0.19,0.59 0.73,-0.03 0.56,0.94 0.04,1.43 0.69,0.24 -0.1,0.55 0.36,-0.28 0.11,0.19 0.22,1.87 0.36,0.74 -0.42,0.89 -0.73,0.51 -0.76,-0.23 -0.15,0.22 0.14,0.27 0.3,-0.09 -0.05,0.51 0.37,0.21 0.09,1.05 -0.35,2.44 -0.48,-0.18 0.2,0.600002 -0.22,2.28 -0.61,0.7 0.49,0.25 0.5,1.7 -0.76,2.37 0.35,1.24 -0.36,1.74 0.31,1.01 -0.11,2.52 -0.22,0.22 -0.66,-0.39 0.16,0.6 -0.24,0.48 -0.61,0.27 0.29,0.55 -0.67,-0.75 0.17,-0.14 -1.69,-1.65 -0.62,-0.18 -0.35,0.37 0.09,0.71 1.17,1.96 2.71,2.87 -0.8,0.31 -0.2,0.86 2.29,1.08 0.26,1.46 -0.4,0.9 0.8,2.94 -0.11,0.52 -0.45,0.82 -1.55,1.14 -1.14,1.41 -0.41,1.21 -0.86,-0.21 -0.17,-0.32 -1.55,0.87 -3.75,-0.35 -0.67,0.9 -1.08,0.59 -0.52,-1.16 -0.39,-0.27 -0.55,0.18 -0.45,-0.85 -0.31,0.16 0.31,0.47 -0.6,-0.02 -0.41,-0.59 -0.54,-0.15 -1.89,0.8 -0.73,-0.77 -0.77,-0.2 -0.57,-1.26 0.1,-0.69 -0.61,0.28 -0.9,-0.19 -1.42,-1.86 -0.14,-1.96 -0.61,-0.49 -1.3,0.08 -0.48,0.34 -0.42,-0.39 0.37,-0.36 -0.68,0.45 -0.27,0.6 -1.2,-1.22 -1.02,1.25 -1.07,0.03 -0.66,-0.81 -1.38,0.35 -0.17,-1.62 0.3,-0.85 -0.13,-0.24 -0.55,0.34 -0.24,-1.62 -1.11,0.11 -0.77,1.2 -0.51,0.07 -1.08,1.3 -0.97,-0.35 0.43,-0.26 -0.09,-0.46 -0.56,0.47 -0.57,-0.16 -1.65,-2.76 0.27,-2.43 -2.35,-2.33 0.37,-0.23 -0.44,-0.22 0.19,-0.49 0.19,-0.16 0.04,0.26 0.2,-0.47 -0.47,-1.63 0.24,-1.05 -0.4,-2.53 0.46,-0.95 -0.19,-1.75 -0.55,-0.35 -1.32,0.15 -0.61,-0.32 -0.16,1.06 0.31,0.4 -0.34,0.79 -0.87,-0.43 0.06,0.36 -0.54,0.15 0.33,-1.1 -0.74,-0.53 0.73,-0.57 0.45,0.16 -0.21,-1.26 0.69,0.02 -1.19,-0.67 0.19,-0.4 -0.83,-0.3 -0.09,-0.32 -0.29,0.09 -0.13,-0.33 0.1,-0.31 0.85,-0.08 0.03,-0.56 0.64,-0.37 0.13,-1.490002 -1.14,0.640002 -0.29,0.87 0.3,0.72 -0.77,0.19 -1.31,1.73 -0.19,0.8 0.64,0.61 -0.92,1 0.57,0.19 0.04,0.28 -1.45,0.27 -0.6,-0.41 -0.23,-0.82 0.9,-0.43 -0.09,-0.49 0.53,0.08 -0.03,-1.14 -0.8,-0.32 -0.71,0.55 -0.48,-0.53 0.28,-0.51 -0.59,-0.61 -0.73,0.07 0.02,-0.61 0.67,0 0.22,0.45 2.01,0.85 0.17,-0.76 1.6,-2.13 0.83,-0.1 -0.25,-0.150002 0.85,-1.33 0.42,-1.56 1.88,-2.8 1.8,-0.52 2.52,0.42 0.09,-0.27 -0.96,-0.19 0.88,-0.85 -0.11,-0.79 -0.93,-0.49 -1.75,-2.19 0.03,-1.11 0.38,-0.15 0.39,-0.79 -0.41,-0.29 -0.16,-1.31 0.84,0.68 0.92,-0.76 1.23,0.48 -0.8,-0.91 0.46,-0.19 0.18,-1.74 1.39,-0.94 0.23,-1.64 0.33,0.08 0.12,0.68 0.58,0.28 -0.28,0.82 0.83,0.42 0.63,1.2 0.82,-1.27 0.01,-1.55 0.58,-0.61 1.08,0.32 0.78,-0.32 0.49,0.49 1.76,-0.4 0.56,0.62 0.38,-0.16 0.41,-0.84 0.6,0.56 0.9,0.1 0.89,-0.53 0.27,-1.02 0.93,0.67 2.35,-1.08 0.66,-0.79 3.54,0.1 0.34,0.81 1.59,1.54 z m -44.24,17.79 0.15,0.55 0.27,-0.1 -0.31,0.27 -3.24,-2.47 -0.43,-1.56 4.77,0.42 -0.7,0.58 1.31,0.85 0.68,-1.82 0.28,0.08 -0.1,-0.31 0.83,-0.03 0.21,0.56 0.54,0.09 0.25,-1.26 -0.35,-0.79 -1.21,-1.14 -1.24,-0.24 -0.59,0.55 -0.36,-0.4 -1.12,-0.34 -0.82,0.12 -2.29,-0.6 -0.49,-1.4 0.4,-0.73 0.42,0.16 0.63,-0.47 0.2,-0.62 -1.53,-1.95 0.83,-0.61 0.1,-1 -0.7,-0.25 -0.21,-1.34 -1.75,-1.13 3.66,-0.28 1.19,0.31 1.77,-0.5 0.39,0.83 0.52,0.36 1.61,0.35 1.78,-0.06 0.51,0.78 2.99,-0.2 2.53,1.11 2.12,2.36 1.14,0.37 0.58,0.53 -0.58,1.87 -0.67,0.68 0.23,0.46 -0.17,0.52 -1.44,1.06 -0.52,-0.17 0.46,-2.03 -1.26,1.85 -1.18,-0.64 0.97,0.94 0.75,-0.49 -0.16,0.64 0.7,0.39 -0.66,0.97 -0.71,0.36 -0.49,1.26 -0.75,0.76 -2.85,1.13 -1.76,0.27 -2.74,-0.45 -1.35,1.05 -1.04,-0.06 z m 35.76,-2.98 0.04,-0.3 0.21,0.43 -0.25,-0.13 z" title="Красноярский край" id="RU-KYA" />
                                <path d="m 64.530108,534.79082 -0.42,-0.12 -0.6,0.24 0.05,0.25 -0.53,-0.17 -0.07,0.87 -1.1,0.41 -0.02,0.89 -0.52,-0.42 -1.19,0.58 -1.49,-0.49 2.73,-3.52 0.48,-0.16 2.13,-2.52 0.86,0.11 0.46,-1.43 0.77,-1.16 0.84,-0.33 1.92,-1.64 0.77,-1.15 0,0 0.78,0.95 0.96,0.4 0.54,0.85 1.18,0 1,0.67 0.85,0.05 18.44,7.19 1.08,0.07 1.25,-1.68 0.61,0.14 0.63,-0.37 0.45,-1.32 1,-1.09 0.78,-0.4 0,-0.65 0.950002,0.11 1.27,0.84 0.26,-0.28 0.81,-2.01 -0.93,-0.42 -0.85,0.49 -1.090002,-0.85 -0.22,-0.61 2.170002,-1.19 2.55,0.32 0.58,-0.27 1.89,1.74 0.24,-1.36 2.13,-1.46 2.53,1.29 1.38,-0.84 -0.02,1.59 0.74,0.52 0.28,0.06 0.8,-1.01 0.52,0.55 0,0 0.26,1.02 -0.38,1.06 -0.98,0.82 0.04,0.49 0.54,0.43 -0.31,0.8 -0.45,0.53 -0.83,-0.4 -0.44,0.15 -0.82,1.06 0.67,1.53 0.33,1.81 -0.74,3.57 -0.55,0.77 -0.14,1.65 0.65,0.53 -0.02,0.57 -0.42,0.41 2.43,0.91 -0.5,0.6 -0.07,2.51 0.19,0.45 1.38,0.3 0.13,1.24 -0.84,-0.61 0.04,1.37 -1.01,1.24 0.59,0.68 -0.62,0.88 -0.23,1.03 -0.81,-0.01 -0.71,0.74 -0.62,-0.19 -0.34,0.57 -0.59,-0.67 -1.07,1.36 0.03,0.58 -0.27,0.12 0.21,0.46 0,0 -1.11,0.05 -2.03,-1.02 -1.18,0.19 -0.35,0.62 -0.5,-0.17 -0.69,-0.58 -0.63,-0.1 -1.45,-2.56 -1.140002,0.28 -0.65,-0.24 -0.73,0.88 -1.54,-1.06 -0.43,-0.7 -0.67,1.07 -1.17,0.93 -0.2,0.85 0.29,0.9 -0.44,0.8 -0.67,0.26 -2.18,-1.31 -0.32,-1.58 -2.37,-1.66 -0.38,0.1 -0.34,1.45 -0.38,0.1 -0.37,-0.04 -0.69,-0.86 -1.01,-0.11 0.39,1.94 -0.53,0.4 -0.01,0.75 -0.87,1.38 -0.94,0.37 -0.84,-0.6 -0.78,-0.02 -0.67,1.84 -1.32,1.1 -0.31,1.45 -0.4,0.17 -0.83,-0.33 -1.22,0.73 -1.39,-0.86 -0.22,0.15 -0.22,0.4 0.28,0.46 -0.42,0.68 0.36,0.98 -0.02,1.13 -0.87,0.61 -0.77,-0.29 0,0 -0.79,0.43 -0.83,-0.09 -0.63,-0.39 -0.42,-1.01 -1.9,-0.6 -0.16,-1.2 -1.86,-1.84 -0.81,0.07 -3.48,-0.95 -0.67,0.07 -0.95,-1.62 -0.94,-0.46 -1.06,-0.14 -1,0.98 -0.37,-0.55 0,0 0.15,-0.59 0,0 0,0 0,0 1.22,-3.3 0.89,-0.72 0.64,-0.01 0.05,-0.51 0.59,-0.46 -1.18,-1.44 0.36,-1.58 -0.67,-1.55 0.18,-0.8 0.51,-0.54 0.63,0.17 0.26,1.3 1.03,0.39 0.48,-0.3 0.29,-2.1 0.61,-0.32 1.23,1.09 1.68,-0.5 0.73,-0.9 -0.01,-0.3 -0.54,-0.29 0.4,-0.12 0.09,-0.52 0.48,-0.41 0.74,-0.13 3.36,0.89 0,0 -0.14,0.99 0.77,0.55 0.48,-0.05 0,0.32 1.53,1.67 1.25,1.05 0.9,0.15 1.08,-0.4 0.39,-0.88 0.82,0.01 0.64,-0.71 -0.09,-0.47 -1.73,-1.06 0.05,-1.93 -1.24,-0.93 0.23,-1.11 -1.82,-0.41 -3.52,-1.58 -0.7,0.15 -0.94,1.34 0,0 -1.9,0.02 -0.86,-0.29 -0.21,-0.83 -0.98,-0.69 -0.34,-0.95 -0.28,0.51 -1.09,-0.51 -1.24,-2.81 0.37,-0.01 0.5,1.02 1.05,0.59 -0.4,-1.19 0.18,-0.55 -0.24,-0.49 -0.29,0.5 -0.4,-0.66 0.17,-0.61 0.31,0.57 0.62,0.17 -0.42,-0.9 0.76,-0.14 -0.19,-0.34 0.27,-0.57 -0.38,-0.68 -0.27,0.05 0.12,0.44 -0.31,0.05 0.08,0.82 -0.33,0.08 z m -6.3,23.66 0,0.01 0,0 0,0 0,0 0,-0.01 z" title="Ленинградская область" id="RU-LEN" />
                                <path d="m 138.37011,628.88082 0.35,0.2 0.51,-0.23 0.34,0.28 0.88,1.9 0.92,-0.38 0.5,0.23 1.13,-0.23 0.2,-1.11 1.29,-0.79 0.17,0.4 0.38,-0.28 0.84,0.5 0,0.87 -0.29,0.07 0.58,0.65 0.81,0.16 0.59,0.7 0,0 -0.5,1.49 0.34,1.91 -0.18,0.51 0.46,0.28 -0.71,0.89 0.49,1.06 -0.26,0.32 -0.63,-0.07 -0.36,0.77 0.78,2.08 2.03,1.1 -0.23,0.57 0.33,0.42 1.34,0.39 1.46,1.25 -0.04,0.65 -0.71,0.35 -0.67,2.3 0,0 -4.3,-0.21 -0.44,0.55 -1.1,0.01 -1.42,-0.53 -0.17,-1.1 -0.66,-0.33 -2.05,-0.09 -0.17,1.05 -0.46,0.2 -0.7,-0.43 -0.43,-0.83 -0.56,-0.2 -0.37,0.29 -0.62,-0.3 -0.43,0.95 -0.83,-0.25 -1.54,0.95 0,0 -0.64,0.4 -0.66,-0.16 -1.11,0.3 -1.15,-0.5 -0.51,-1.11 0,0 -0.01,-1.39 1.38,-1.08 0.37,0.19 0.35,-0.26 0.2,-0.62 -0.56,-0.69 0.05,-0.39 -0.45,0.01 -0.17,-0.41 0.36,-0.34 -0.84,-0.26 -0.12,-0.29 0.42,-0.25 -0.88,-0.77 -0.6,0.06 -0.04,-0.43 0.56,-0.02 0.8,-1.49 -0.32,-0.71 0.29,-0.84 -0.41,-0.5 0.23,-0.88 0,0 0.43,-0.01 -0.06,-0.58 0.65,0.01 0.1,0.28 1.9,-0.14 0.34,1.21 0.6,-0.23 0.02,-0.38 0.34,0.14 0.35,-0.91 0.29,-0.03 0.09,0.67 0.51,-0.06 -0.03,-0.51 0.27,0.08 0.33,-0.65 -0.88,-0.84 0.53,-0.15 -0.91,-1.51 2.05,-0.6 -0.46,-1.07 0.27,-0.13 -0.49,-0.27 0.87,-0.66 0.43,0.29 z" title="Липецкая область" id="RU-LIP" />
                                <path d="m 124.76011,602.00082 -0.01,0.01 0,0 0.44,0.4 0.55,-0.18 -0.17,-0.14 0.19,0.29 -0.86,0.21 -0.31,-0.28 0.31,-0.16 -0.42,0.11 -0.03,-0.29 -0.4,0.29 0.71,-0.3 0,0 0,0.04 z m 6.28,-0.9 0.3,0.01 0,0 -0.31,0.13 0,0 0.01,-0.14 z m -6.49,7.47 0.03,-0.39 0.52,-0.26 -1.22,-1.17 -0.39,-0.75 0.08,-0.86 0.86,-0.12 0.28,0.75 0.62,-0.1 0.64,0.3 -0.41,-0.33 0.34,-0.12 -0.32,-1.6 0.95,-0.25 0.66,-0.56 0.69,0 -0.1,-0.43 -0.51,0.22 0.24,-0.35 0.2,0.13 -0.16,-1.15 -0.36,0.28 -0.09,-0.39 0.42,0.09 0.19,-0.51 -0.29,0.11 -0.15,-0.32 0.57,-0.33 -0.53,-1.06 0.6,0.04 -0.22,0.49 0.27,0.45 0.78,-0.4 -0.12,-0.44 0.4,-0.17 -0.12,0.58 0.96,0.16 1.05,0.9 0.04,1.01 0.92,0.47 -0.03,0.5 -0.35,-0.04 -0.1,-0.4 -0.3,0.09 -0.95,1.41 -0.97,0.21 -0.14,0.66 0.23,0.4 -0.48,0.22 -0.06,0.45 -0.65,-0.57 -0.37,0.17 -0.15,0.3 0.69,0.69 -0.47,0.67 0.16,0.27 -0.32,-0.02 0.17,0.83 -0.63,0.38 -0.32,-0.47 -0.01,0.23 -0.4,-0.15 -0.36,0.27 0.06,0.83 -0.43,0.22 0,0 -0.33,0.04 0,0 -0.14,0.05 0,0 -0.6,-0.81 0,0 0.01,-0.01 0,0 0.01,-0.02 0,0 -0.03,-0.05 0,0 -0.02,-0.02 0,0 -0.01,0 0,0 -0.08,-0.18 0,0 0.05,-0.07 z m 3.44,-9.57 0.12,0.02 0,0 -0.62,0.31 0.22,-0.31 0,0 0.28,-0.02 z m -2.05,0.25 -0.11,-0.66 0.42,-0.07 0.56,0.5 -0.4,0.09 -0.06,0.35 0,0 0,0 0,0 -0.41,-0.21 0,0 0,0 z" title="Москва" id="RU-MOW" />
                                <path d="m 194.64011,586.18082 2.6,0.3 0.41,0.54 -0.17,0.6 1.66,-0.52 0.87,0.3 0.12,-0.81 1.68,-1.99 0.85,0.8 1.34,-0.09 0.74,-0.25 0.03,-0.67 0.54,-0.2 0.25,-0.82 0.71,0 0.45,0.56 0.75,-0.84 0.88,0.37 0.93,-0.44 0.46,0.32 -0.27,0.72 0.79,0.31 0.29,-0.16 0.14,-0.87 0.58,-0.49 -0.36,-0.66 0.17,-0.72 1.11,-0.32 0.29,0.46 -0.45,0.75 0.02,0.77 0.61,1.67 0.7,0.31 0.7,-0.55 1.13,-0.27 1.01,0.56 -0.1,0.46 0.3,0.5 -0.29,0.98 1.41,0.41 0.43,-0.17 0.62,0.39 0.3,0.89 -0.48,1.67 0,0 0.13,0.58 0.61,0.08 0.27,0.45 -0.05,0.3 -0.82,0.32 -0.51,0.9 -0.44,-0.46 -0.89,0.61 -0.3,-0.46 0.34,-0.52 -0.58,-0.34 -1.05,0.39 -0.41,0.91 -0.82,-0.11 -0.48,0.98 -1.83,-0.43 -1.02,0.63 -0.53,0.94 0.18,0.54 1.11,0.02 -0.08,0.4 -0.57,0.81 -0.72,-0.02 -0.57,1.12 -0.89,-0.27 -0.43,1.37 -1.52,1.17 0.12,0.82 0,0 -2.89,-1.54 -0.85,-2.21 -2.16,-0.36 -0.81,-0.47 -0.61,-1.62 -0.43,-0.37 -1.2,0.12 -2.62,1.77 -0.71,0.87 -0.5,0.09 -0.86,-0.45 -2.72,1.8 0,0 -0.46,-1.27 0.08,-0.71 -1.63,-1.2 0.71,-0.92 -0.07,-0.83 -1.26,-0.83 -0.92,0.19 -0.19,-0.56 0.29,-1.15 0.67,-0.77 1.04,0.06 -0.12,-2.29 0.56,-0.75 2.15,-0.46 0.67,-0.85 1.5,0.49 0.56,-0.15 0.38,-0.66 z" title="Республика Марий Эл" id="RU-ME" />
                                <path d="m 996.41011,443.88082 0.96,0.08 0.26,0.83 1.61,1.03 1.95999,0.11 -0.08,0.65 -1.32999,1.83 -0.49,1.27 -0.07,4.2 1.15999,1.32 4.58,1.67 0.59,0.92 2.01,0.43 0.67,2.05 2.97,3.52 4.78,0.87 1.63,1.18 1.09,0.19 1.59,3.27 1.44,1.01 3.39,0.58 1.5,1.57 3.18,-0.13 0,0 0.05,2.13 1.28,1.33 -0.01,0.72 0.69,0.79 -0.02,0.53 -1.86,1.36 -0.11,0.45 0.38,0.49 -0.58,0.49 -1.58,0.21 -0.87,0.62 -0.18,0.8 0.82,1.36 0.1,2.04 -0.61,0.52 -0.69,1.71 0.7,0.56 0.04,0.69 0.76,0.32 0.45,0.81 0.07,1.25 -1.21,1.73 -1.11,0.38 0.35,1.33 -0.35,0.78 0.61,0.6 -0.06,0.37 -0.88,0.4 -0.67,0.99 -0.72,0.2 -0.6,-0.28 -0.48,0.6 -0.5,2.15 0.07,0.9 1.04,0.27 1.64,1.58 -0.54,0.78 1.68,0.74 -0.17,0.7 -0.89,0.81 0.85,1.7 -0.31,0.9 -0.02,1.83 -1.6,1.07 -2.22,0.71 -0.16,0.61 0.51,0.52 1.64,0.34 0.36,1.06 -0.95,1.13 -0.53,-0.09 -0.42,0.4 0.63,1.58 0.74,0.75 -0.21,0.96 0,0 -0.44,0.06 -0.14,0.83 -0.46,-0.02 0.27,0.36 -0.51,0.61 -0.37,-0.11 0.12,0.58 -0.64,0.35 -0.22,0.85 -0.72,0.04 0.38,0.22 -0.29,0.5 -0.62,0.11 -0.35,-0.81 0.14,1.39 -0.28,0.04 -0.3,-0.56 -0.29,1.09 -1.1,0.71 -0.54,-0.04 0.36,0.31 -0.14,0.68 -0.67,-0.17 -0.65,0.68 0.38,0.47 -1.04,0.97 -0.69,0.04 -0.46,1.31 -1.58,1 -0.94,2.65 -0.71,-0.72 -0.36,0.72 -0.7,-0.35 -0.58,0.67 -0.39,-0.11 0.07,-0.67 -0.57,0.36 0.28,0.18 -0.05,0.56 -0.54,0.44 -0.09,0.48 -0.92,0.54 -0.04,-1.22 0.41,-0.1 -0.03,-0.52 0.36,-0.27 -0.04,-0.88 -0.5,-0.68 0.24,-0.27 0.28,0.16 0.16,-1.05 0.77,-0.01 -0.3,-0.35 0.6,-0.89 0.05,-0.7 -0.48,-0.19 -0.68,0.37 -0.52,-0.28 -1.84,1.48 -0.37,-0.09 0.1,0.43 -0.8,-0.18 1.5,-2.68 -0.19,-0.96 -0.43,-0.53 0.26,-0.19 -0.22,-0.42 -1.01,0.22 0.46,-0.8 0.44,-0.02 0.44,0.41 0.28,-0.32 -0.71,-0.37 0.54,-0.39 -0.04,-0.56 0.7,0 0.23,-0.96 -0.47,-0.16 1.69,-1.47 -0.16,-0.63 0.55,-1.17 -0.42,-0.36 1.05,-1.12 -0.09,-0.57 -0.28,-0.02 0.31,-0.4 -0.16,-1.23 -0.45,-0.42 -2.03,1.47 -1.05,2.01 -0.67,-0.2 -0.09,0.35 -0.41,0 -0.22,-0.35 0.02,0.58 -0.88,0.45 -0.35,-0.2 -0.06,-0.52 0.43,-1.97 -0.43,0.53 -0.69,0.21 -0.55,-0.59 0.4,-0.56 -0.23,-0.4 -1.29,-0.51 -1.24999,-0.05 -0.34,0.43 -0.53,-0.09 -0.38,1.27 -0.61,0.02 -0.39,-0.33 -0.98,0.09 -0.57,0.67 -0.63,-0.52 -0.99,0.02 -1.58,1.41 -1.55,-0.81 -2.38,-0.11 -0.83,0.85 -0.19,0.81 -0.61,-0.26 -1.53,0.71 -1.05,1.71 -0.59,0.3 -1.03,-0.01 -0.32,2.15 0.12,2.59 -0.26,0.17 -0.2,-0.39 -0.67,0.31 -2.71,2.54 -0.62,0.99 -0.69,0.12 -0.14,0.24 0.42,0.33 -0.36,0.5 -0.09,2.31 -0.66,-0.23 -0.68,1.15 -0.72,0.1 -1.05,1.01 -0.3,0.87 -0.77,-0.1 -1.24,1.57 -1.26,0.62 -1.14,1.03 -1.78,2.92 -0.52,-0.03 -0.65,0.44 0.53,2.61 -1.16,-0.16 -0.75,0.31 0.03,1.92 1.04,2.26 -0.59,-0.57 -0.1,-0.6 -0.34,-0.03 -0.58,1.83 -0.29,-0.09 -0.25,0.33 0.4,0.81 1.26,0.31 0.31,-1.14 0.34,-0.23 0.15,0.41 -0.26,0.44 0.34,0.28 -0.02,0.58 0.74,-0.01 -0.53,-1.01 0.25,-0.41 -0.41,-0.11 -0.12,-0.39 0.99,0.54 0.71,-0.4 1.01,1.09 0.87,-0.08 0.43,-0.38 0.82,1.48 0.89,0.63 0.06,0.56 -0.46,0.2 0.33,0.8 -0.46,0.18 0.33,0.68 -2.51,-0.32 -0.29,0.23 0.1,0.74 -0.93,-0.28 -1.01,-0.96 -1.01,0.29 -0.45,-0.19 0.22,0.19 -0.24,0.07 0.18,1.14 -0.17,-0.2 -0.37,0.53 -0.39,-0.27 -0.41,0.13 -0.9,0.66 -0.74,-0.32 -0.71,-1.37 -1.1,-0.21 0.26,-0.46 0.38,-0.01 0.02,-0.47 -0.98,0.85 -1.92,-0.91 -0.17,1.47 -0.25,-0.23 -0.33,0.46 0.59,0.02 -0.08,0.62 -1.57,0 -0.74,0.3 -0.49,0.81 -0.3,1.42 -0.67,-0.29 -0.63,0.29 -0.46,-0.48 -0.79,-0.13 -0.22,-0.51 -0.79,-0.48 -1.7,0.48 -0.21,0.96 -0.54,0.44 -1.63,0.09 -1.14,0.53 -1.5,-0.32 -0.93,0.38 0.12,-0.28 -0.79,-1.1 -0.1,-0.87 -0.97,-1.49 0.83,0.27 1.75,-1.11 0.91,0.24 0.42,-0.21 0.74,0.49 2.35,-0.23 0.85,-0.72 0.8,0 0.08,-0.44 -1.08,-0.98 -0.23,0.23 -0.02,-0.33 -0.92,0.58 -0.8,-0.61 -1.16,0.1 -0.14,-0.38 0.38,-0.4 -0.56,-0.58 -0.11,-0.67 -0.62,-0.74 -0.54,-0.12 -0.78,-1.39 -0.31,0.01 -0.41,0.64 -1.23,-0.34 -1.58,0.24 -0.18,0.32 0.39,0.31 -0.24,0.42 0.35,0.13 -0.15,0.39 -1.29,0.31 -0.08,-0.79 -1.79,0.05 1.86,-0.64 0.09,-0.46 -1.4,0.29 -0.85,-0.49 0.01,-0.54 -0.53,-0.06 -0.5,-0.51 -1.15,-0.03 -3.73,-1.39 -1.05,0.08 -1.3,0.59 -1.85,1.31 0.37,0.06 0.09,1.03 0.74,0.23 0.08,0.84 -0.91,-0.35 -1.21,0.48 -0.5,-0.47 0.46,-0.62 -0.36,-0.28 -1.13,1.26 0.13,1.4 0.53,0.21 0.6,-0.63 0.03,0.63 0.3,-0.1 -0.12,-0.29 0.45,-0.03 -0.44,0.81 0.27,0.52 -0.24,0.66 -0.63,-0.65 -0.35,0.1 -0.18,0.51 -0.31,-0.02 -0.11,-0.41 -0.96,0.4 -1.13,-0.21 0.18,-0.39 -0.31,-1.34 -0.81,-0.42 -2.97,0.32 -0.81,0.41 0.63,0.72 -0.36,0.58 -1.17,-0.63 -0.68,0.41 0.02,0.59 -1.77,-1.39 -0.94,0.23 -0.52,-0.54 -0.94,-0.18 0,0 1.67,-0.65 0.02,-1.82 0.57,-1.41 -0.16,-1.68 -0.45,-0.44 0.37,-0.4 -0.11,-0.65 -0.84,-0.34 -0.05,-0.89 -0.57,0.05 -0.87,0.87 -0.34,-0.11 -0.81,-1.35 0.45,-0.73 -0.26,-0.77 -1.44,-0.32 -0.73,-1.55 -0.85,-0.26 -0.99,0.58 -0.96,-0.26 -1.03,0.55 -2.27,-2.46 0.53,-0.26 -0.68,-1.04 0.23,-0.61 0.68,-0.19 0,-0.88 1.08,-0.79 0.5,0 0.54,-1.19 0.51,-0.05 0.47,-0.54 0.5,-0.13 1.43,1.18 0.76,-0.02 0.36,-0.65 -0.37,-0.68 0.02,-2.12 0.32,-0.46 1.15,-0.13 0.49,-1.41 -0.15,-0.35 0.41,-0.52 0.05,-1.23 -0.74,-2.26 0.24,-1.02 -0.79,-0.99 0.14,-1.77 -1.14,-1.42 0.03,-0.71 -2.08,-2.82 -1.93,-1.33 -1.04,-0.18 -0.42,-0.95 -0.42,0.34 0.13,0.86 -0.34,0.48 -0.59,0.09 -0.21,0.48 -0.58,-0.01 0.26,-0.78 -0.49,0.12 -0.27,-0.46 -0.39,-0.08 -0.52,0.79 -1.29,-0.76 -0.56,-0.9 -1.78,0.21 0,0 -0.09,-0.93 0.53,-0.17 0.51,-0.71 0.39,0.18 0.61,-1.11 0.67,-0.1 0.3,-0.84 -0.18,-1.2 0.57,-1.15 -0.44,-0.73 0.8,-0.77 0.27,0.28 0.8,-0.24 0.26,-0.4 -0.51,-0.62 0.46,-1.66 -0.62,-0.42 -0.08,-0.64 0.62,-0.97 -0.13,-1.92 -1.4,-1.13 0.49,-0.58 -0.01,-0.71 -0.65,-0.89 0.29,-0.92 0.93,-1.21 -0.09,-0.71 0.61,-1.37 -0.15,-0.83 1.08,-1.46 0.5,-1.69 -0.33,-1.95 0.2,-0.69 3.47,-1.45 0.87,-1.2 0.71,-2.54 0.42,-0.33 1.2,0.58 2.2,-0.34 2.4,1.85 0.8,0.05 0.21,-0.99 0.74,0.21 1.26,-0.82 0.43,0.44 -0.5,1.39 1.21,0.95 -0.26,0.59 1.25,0.22 0.71,-0.24 -0.09,-0.99 0.3,-0.84 1.65,-2.55 -1.54,-1.97 -0.26,-1.32 0.82,-0.42 1.47,-1.66 0.82,0.42 0.13,0.92 1.06,0.55 0.82,-0.57 0.84,0.72 0.32,-0.76 1.02,0.3 0.79,0.85 0.97,0.1 -0.16,-0.73 0.83,0.37 2.49,-1.85 0.35,-0.73 1.01,0.16 -0.01,0.65 1.15,0.64 -0.05,0.61 -0.71,0.62 0.29,0.62 -0.12,0.92 1.11,0.93 0.26,0.83 1.04,-0.14 1.09,0.68 0.78,0.03 -0.09,-2.27 0.41,-0.67 1.56,0.38 1.17,-0.14 0.74,-0.61 0.33,0.42 0.75,-0.6 0.79,1.03 0.54,-0.19 0.78,-1.73 0.69,-0.01 1.58,-0.72 1.36,0.6 -0.42,1.04 0.49,0.29 1.76,-0.44 0.33,-0.81 -0.81,-1.26 0.21,-0.43 0.97,-0.18 0.7,-1.33 1.43,-0.83 0.33,-0.78 -0.13,-0.48 -1.11,-0.58 -0.93,-3.71 0.92,-0.51 0.08,-1.85 0.6,-0.78 -0.01,-0.56 1.05,-0.28 0.92,-0.75 1.19,0.39 0.59,-0.21 0.01,-0.64 0.45,-0.47 0.83,0 0.6,-0.83 0.14,-0.83 -0.82,-0.74 0.2,-0.95 1.09,-1.36 -0.26,-0.6 0.3,-1.4 -0.51,-0.19 0.21,-1.52 1.08,-0.34 0.52,-0.57 1.31,0.13 0.94,-0.24 0.39,0.47 -0.15,0.98 0.92,-0.04 1.3,-1.97 0.07,-1.3 -0.93,-0.84 -0.2,-0.79 1.25,-0.79 0.03,-0.83 1.11,-0.69 0.65,0.19 0.45,0.52 0.75,0.05 0.32,0.92 0.96,-0.26 0.49,-0.92 0.81,-0.17 0.44,0.85 1.6,-0.25 1.54,0.48 1.23,-0.8 0.37,1.21 0.95,0.77 1.67,-0.08 0.72,0.37 0.74,-0.49 0.16,-1 1,-1.15 0.32,0.13 0.24,1.42 1.8,1.17 0.08,0.74 -0.56,0.49 1.33,1.06 2.19,0.12 0.32,-0.43 0.02,-0.99 0.86,-0.56 0.83,-1.36 1.4,-0.19 1.63,-0.74 0.99,0.26 0.51,0.96 0.57,-0.22 0.88,0.21 0.42,-0.47 -1.13,-2.21 0.91,-1.55 z" title="Магаданская область" id="RU-MAG" />
                                <path d="m 88.600108,374.31082 0.64,-0.3 0.93,0.43 0.41,0.71 0.59,0.12 1.39,1.17 -0.09,0.7 1.12,0.36 0.26,-0.32 1.6,0.34 0.17,0.38 0.95,0.25 0.23,0.39 -0.18,1.66 -0.95,1.3 -0.77,0.38 -2.41,-0.74 -0.53,-0.59 -0.43,0.23 -1.34,-0.26 -0.22,-0.66 0.32,-0.54 -0.52,-1.17 -0.31,0.25 0.42,0.54 -0.33,1.09 -0.41,0.42 -0.62,0.06 0.69,0.65 -0.32,1.05 0.88,-0.94 0.92,0.55 1.06,0.15 0.23,0.25 -0.31,0.62 0.8,0.21 0.01,0.44 -0.71,0.27 -1.09,1.26 1.15,-0.4 0.2,-0.79 0.43,0.1 0.23,-0.45 0.07,0.28 0.32,-0.16 0.07,1.05 0.47,-0.83 0.98,0.01 0.56,0.26 -0.52,0.86 -0.06,0.8 0.73,-1.37 1.16,-0.17 -1.22,1.45 0.18,0.26 -0.72,1.54 0.53,-0.06 0.53,-1.39 2.15,-0.86 0.2,-0.38 1.42,0.64 -0.76,0.84 0.53,-0.16 0.09,0.32 -0.62,1.26 -1.02,-0.03 0.13,0.29 -0.35,0.34 2.15,0.11 -1.74,0.56 1.49,0.32 -0.01,1.04 -0.53,0.21 -0.45,0.85 -1.65,0.46 -0.55,0.48 0.78,-0.21 0.88,0.2 0.27,-0.46 1.07,-0.13 -0.06,-0.62 0.34,-0.18 0.580002,-1.37 -0.150002,-0.91 0.420002,-0.54 -0.470002,0.19 0.120002,-0.87 1.2,-0.1 0.11,0.27 0.5,-0.38 0.54,0.17 0.36,-0.28 0.97,0.31 2.21,0.03 0.11,0.54 0.63,0.32 2.87,0.67 0.13,0.52 0.44,-0.41 1,0.23 0.29,0.43 0.34,-0.24 0.33,0.22 0.2,-0.3 -0.85,-0.96 0.97,0 0.54,0.48 0.96,0.02 2,0.92 0.27,-0.25 0.69,0.88 0.78,0.32 0.27,-0.24 0.28,0.51 1.33,0.27 0.47,1.23 0.15,-0.3 0.25,0.47 0.16,-0.16 1.04,0.5 3.16,2.85 1.22,0.63 0.29,0.62 0.49,0.16 0.07,0.44 0.5,-0.04 0.44,0.79 0.75,0.15 1,0.91 2.19,2.31 1.05,1.86 0.24,-0.09 1.17,1.13 1.45,2.09 0.37,0.11 0.44,-1.27 0.99,1.32 0.81,0.05 0.06,0.54 1.28,1.42 -0.05,0.4 0.64,-0.26 3.52,3.43 -0.25,-0.59 0.24,-0.24 0.52,0.48 0.84,-0.1 -0.66,-2.44 1.18,1.83 0.48,1.52 0.27,0.14 0.09,-0.25 0.86,1.09 1.69,1.03 -0.05,0.96 -0.48,-0.37 -0.27,0.24 0.96,1.51 0.29,-0.1 0.45,0.63 0.44,-0.6 -0.14,-0.59 0.41,-0.04 0.14,0.3 0.12,-0.36 0.9,1.44 0.86,-0.1 0.48,0.44 0.55,1.48 -0.47,1.33 0.24,0.88 -0.25,0.81 0.75,0.49 0.24,0.61 -0.27,2.76 0.4,0.62 0.82,0.45 0.46,-0.37 0.23,0.4 -0.35,1.01 0.63,0.54 -0.41,0.64 0.09,1.77 -0.59,0.06 0.25,0.59 -0.63,2.35 -3.52,4.36 -0.14,0.88 -0.69,0.36 -0.13,0.82 -0.78,0.95 -1.8,1.11 -1.6,1.73 -3.78,1.25 -2.58,1.55 -1.52,-0.08 -1.58,0.77 -2.57,0.17 -1.31,-0.46 -1.56,-0.11 -1.71,-0.54 -2.35,-1.57 -3.4,-1.42 -2.75,-0.13 -6.98,-1.78 -1.13,-0.57 -0.26,-0.86 -0.83,-0.02 -2.05,-2.17 -0.69,-0.24 -0.84,0.14 -0.64,0.76 -1,0.19 -0.61,-0.86 -0.01,-1.13 -2.5,-0.73 -0.61,0.12 -0.3,-0.2 -0.09,-0.66 -0.27,0.26 -0.34,-0.42 0.14,-0.44 -1.31,-0.72 -0.25,-0.78 -0.01,1.03 -0.33,-0.18 0.25,1.16 -0.690002,0.37 -2.34,-1.94 -1.44,-1.43 -1.42,-2.15 -0.01,-0.72 1.24,-0.59 -1.44,0.23 -0.95,-0.78 -0.86,0.24 -0.52,-0.23 -0.55,-0.69 -0.59,0.5 -0.89,-0.21 -0.3,0.63 -1.3,-0.6 1.35,1.01 0.56,-0.26 -0.14,-0.46 0.72,0.29 0.58,0.5 -0.5,0.13 0.37,0.5 0.59,-0.02 0.73,0.42 0.26,1.95 -1.02,0.69 0.93,0 1.19,1.15 -0.05,0.36 0.68,0.6 -0.72,0.19 0.19,0.21 2.35,1.15 1.51,0.2 0.42,0.45 -0.1,0.46 -0.4,-0.45 -0.88,-0.16 -0.39,1.07 -1.67,-0.49 0.04,0.47 0,0 -1.91,-0.26 -0.29,0.21 -0.29,1.78 -1.56,0.17 1.19,1.04 -1.1,-0.39 0.2,0.94 -0.22,0.33 -3.13,-0.11 -0.8,-2.07 -1.02,-0.45 -0.13,-1.88 -1.64,-0.1 0.07,-0.35 -2.05,0.27 -2.85,-0.2 -1,0.36 -2.91,0.28 -2.43,-0.17 -2.69,0.63 0,0 -2.35,-4.31 -0.34,-2.49 3.59,-6.31 0.76,-0.55 0.01,-0.46 2.23,-2.98 0.55,-2.95 -2.45,-2.26 -2.5,-5.32 -4.92,-2.35 -1.5,-6.85 1.95,-3.73 0.58,-2.73 -2.24,-0.2 -0.41,-0.47 3.53,-2.98 0.78,0.81 0.73,-0.63 0.88,-1.43 0.37,-1.25 0.04,-2.44 1.33,-0.52 0.39,0.3 1.97,-2.14 1.12,0.11 0.89,-1.01 0.61,-1.93 -0.57,-2.22 0.56,-0.03 1.22,1.01 1.15,1.53 2.1,0.02 0.9,-0.91 -0.1,-2.07 -0.36,-0.44 0.12,-0.57 -0.39,-1.05 0.65,0.5 0.59,-0.32 0.19,0.36 0.45,-0.12 2.31,1.27 0,0.87 -1.23,1.83 0.5,-0.29 0.48,-0.98 0.46,-0.18 0.17,-0.81 1.68,0.27 0.64,0.45 0.02,-0.36 -0.84,-0.89 0.33,-2.14 0.33,-0.38 0.55,0.32 1.28,1.4 0.02,-0.45 0.37,0.08 -0.48,-1.29 -0.57,-0.57 0.29,-0.4 -0.64,-0.73 0.13,-0.8 0.53,0.05 -0.1,0.37 z" title="Мурманская область" id="RU-MUR" />
                                <path d="m 163.80011,613.33082 1.07,0.85 0.99,-0.55 0.28,0.01 0.36,0.71 0.52,0.01 0.87,-0.65 0.68,0.46 0.31,-1.11 1.05,-0.52 0.12,-0.46 0.54,-0.09 0.8,0.41 0.8,-0.25 -0.05,1.2 2.51,0.53 -0.04,0.64 0.26,0.22 0.85,-0.16 0.22,0.24 -0.14,0.68 0.89,0.83 0.91,0.04 1.18,0.89 0.58,-0.53 0.5,0.31 -0.45,0.91 1.59,-0.57 0.57,0.44 1,-0.25 0.54,0.24 0.23,-0.43 -1.09,-1.1 0.64,-0.78 -0.19,-1.19 0.44,-0.54 0.47,0.61 0.49,-1.48 1.33,-0.47 -0.29,-1.38 0.49,-1 1.33,-1.01 0.71,0.18 -0.46,1.89 0.39,0.42 1.42,-0.21 0.98,-0.73 0,0 0.19,0.82 0.26,-0.02 0.53,-1.17 0.39,0.18 0.26,0.61 -0.46,0.74 1.01,0.86 0.45,1.57 0,0 0.53,1.73 -0.71,0.59 0.56,0.03 0.3,0.42 -0.58,0.61 1.09,-0.05 -0.58,0.91 0.17,0.25 0.76,0.02 -0.02,0.98 -0.65,0.17 -1.66,1.29 -2.6,0.77 -1.14,1.94 0,0 -0.46,0.62 -1.58,0.06 -1.61,0.53 -0.35,-0.21 -0.18,-0.81 -1.16,0.25 -1.52,-0.15 -1.75,1.04 0.09,0.77 0.86,1.09 -0.21,0.35 -1.1,0.3 -0.4,-0.48 -1.56,0.24 -1.84,-0.55 -0.62,-0.65 -0.14,-1.19 -1.36,-0.75 -0.8,-0.08 -0.15,-0.47 -0.39,-0.1 -0.86,0.43 -1.41,-0.64 -0.56,0.92 0.45,0.88 -0.3,0.63 -0.6,0.1 -0.46,-0.29 -0.79,0.35 -1.36,-0.14 -0.99,0.59 -0.4,-0.76 -0.47,0.46 0.13,0.87 -1.21,-1.1 0,0 0.34,-0.77 0.89,-0.81 -1.73,-1.6 0.36,-0.58 0.39,0.72 0.55,-0.4 0.65,0.44 0.15,-0.24 -0.28,-0.46 0.47,-0.28 0.95,0.04 -0.29,-0.68 -1.13,0.07 -0.4,-0.6 -0.71,0.34 0.18,0.32 -0.79,0.36 -0.71,-1.09 0.72,0.28 1.5,-0.93 0.12,-0.62 0.98,-0.17 -0.31,-0.61 -0.48,-0.17 0.26,-0.86 0.45,0.26 0,-0.73 0.6,-0.38 -0.53,-0.35 -0.09,-1.02 -0.63,0.15 -0.15,-0.43 -0.22,0.26 -0.75,-0.69 -0.4,-0.76 0.4,-0.41 0.46,0.07 z" title="Республика Мордовия" id="RU-MO" />
                                <path d="m 111.44011,599.52082 1.36,-1.66 -0.41,-0.33 0.55,-0.75 -0.33,-0.65 1.36,-0.41 -0.27,-0.65 0.36,-1.01 -0.72,0.05 0.09,-0.97 0.53,0.35 0.23,-0.53 0.18,0.21 0.4,-0.3 0.08,0.28 0.34,-0.46 0.6,0.36 0.11,0.89 0.41,-0.23 1.63,0.41 0.29,0.47 0.39,-1 0.68,0.13 1.42,-1.07 0.67,0.16 0.15,-0.35 1.94,-0.98 -0.04,-0.27 1.45,0.66 0.73,-0.04 -0.08,-1.3 0.27,-0.4 -0.07,-0.63 -0.38,-0.37 0.89,-0.52 1.05,0.4 0.64,-0.46 0.4,0.19 0.53,-0.72 -0.04,-0.97 1.17,-0.61 1.33,1.05 0.67,0.15 0.51,1.35 1.64,-0.2 0,0 0.79,0.92 0,0 -0.59,0.14 0.41,1.53 -0.63,0.59 0.44,0.2 -0.25,0.24 0.27,0.51 0.41,-0.02 0,0.76 0.34,0.08 -0.34,1.62 0.53,0.77 0.37,-0.07 -0.19,0.41 0.35,1.43 0.48,0.66 -0.3,0.19 0.12,0.22 0.93,0.01 0.75,0.72 1.54,-0.25 -0.19,0.2 0.34,-0.08 -0.19,0.36 0.51,0.75 1.08,0.13 0.51,-0.29 -0.27,0.38 0.24,0.77 1.01,-0.03 0.11,0.38 0.28,-0.55 0.93,-0.06 0.6,-0.61 1.09,0.12 0.16,1.23 1.2,0.99 -0.25,1.7 0.79,-0.01 0.23,0.37 -0.38,0.98 0.56,1.11 0,0 -0.31,0.04 -0.23,0.78 -1.15,0.74 -1.41,0.18 -0.49,0.89 0.61,-0.22 0.34,0.3 -0.39,1.31 -0.25,-0.19 -0.63,0.24 -0.47,-0.27 -0.14,0.58 -0.46,0.02 -0.59,0.63 0.08,0.39 -0.54,0.51 0.08,0.47 -0.58,0.82 0.35,0.09 -0.96,0.51 -0.02,0.82 -0.52,-0.2 -0.3,0.33 -0.72,-0.02 -0.22,0.35 -0.41,-0.32 -0.72,0.26 -0.2,0.81 0.37,0.14 -0.4,0.72 1.26,0.52 0.05,0.45 -0.37,0.11 -0.14,0.49 -0.6,-0.43 -0.22,0.56 -0.51,-0.15 -0.06,1.01 -0.35,0.18 0,0 -1.34,-0.6 -0.14,-0.48 0.35,-0.37 -0.6,-0.63 -0.4,-1.48 0.66,-0.13 0.26,-0.81 -0.19,-0.43 -0.52,0.16 -0.73,-0.36 -0.35,0.35 -0.92,-0.92 -0.54,-0.14 0.08,-0.48 -0.78,-1.13 -1.2,0.24 0,1.08 -0.57,0.39 -0.66,-0.29 -0.4,0.18 -0.16,-0.78 -0.49,-0.56 -1.04,-0.14 -0.03,0.23 -0.66,-0.31 0,0 -0.24,-0.2 0.04,-1.23 -0.66,-1.12 0.27,-0.11 -0.01,-0.43 -0.47,-0.2 0.02,-0.38 0.3,-0.1 0,0 0.11,-0.01 0,0 0.43,-0.22 -0.06,-0.83 0.36,-0.27 0.4,0.15 0.01,-0.23 0.32,0.47 0.63,-0.38 -0.17,-0.83 0.32,0.02 -0.16,-0.27 0.47,-0.67 -0.69,-0.69 0.15,-0.3 0.37,-0.17 0.65,0.57 0.06,-0.45 0.48,-0.22 -0.23,-0.4 0.14,-0.66 0.97,-0.21 0.95,-1.41 0.3,-0.09 0.1,0.4 0.35,0.04 0.03,-0.5 -0.92,-0.47 -0.04,-1.01 -1.05,-0.9 -0.96,-0.16 0.12,-0.58 -0.4,0.17 0.12,0.44 -0.78,0.4 -0.27,-0.45 0.22,-0.49 -0.6,-0.04 0.53,1.06 -0.57,0.33 0.15,0.32 0.29,-0.11 -0.19,0.51 -0.42,-0.09 0.09,0.39 0.36,-0.28 0.16,1.15 -0.2,-0.13 -0.24,0.35 0.51,-0.22 0.1,0.43 -0.69,0 -0.66,0.56 -0.95,0.25 0.32,1.6 -0.34,0.12 0.41,0.33 -0.64,-0.3 -0.62,0.1 -0.28,-0.75 -0.86,0.12 -0.08,0.86 0.39,0.75 1.22,1.17 -0.52,0.26 -0.03,0.39 0,0 -0.01,0.01 0,0 -1.19,0.46 -0.18,-0.6 -1.1,-0.04 -0.23,-1.04 -0.42,0.47 -0.89,-0.02 -0.1,0.59 -0.26,-0.02 -0.54,1.09 -0.15,-0.25 -0.75,0.22 -0.26,-0.39 -0.61,0.08 -0.45,-0.5 -0.83,0.09 -0.7,-0.75 -0.92,0.11 -0.84,0.77 -0.76,-0.04 -0.34,-0.42 0,0 -0.65,-0.73 0.39,-1.34 -0.16,-1.82 0.67,-0.22 -0.04,-0.42 -0.47,-0.52 0.04,-1.62 -0.34,-0.08 -1.04,-2.03 z m 14.9,-0.06 -0.4,-0.22 -0.11,-0.66 0.42,-0.07 0.56,0.5 -0.4,0.09 -0.07,0.36 z m 1.54,-0.57 0.23,0.13 0,0 -0.62,0.31 0.22,-0.31 0,0 0.17,-0.13 z m -3.13,3.12 0.44,0.4 0.55,-0.18 -0.17,-0.14 0.19,0.29 -0.86,0.21 -0.31,-0.28 0.31,-0.16 -0.42,0.11 -0.03,-0.29 -0.4,0.29 0.71,-0.3 0,0 -0.01,0.05 z m 6.21,-0.86 0.38,-0.05 0,0 -0.31,0.13 0,0 -0.07,-0.08 z m -6.35,7.64 0,0 0,0 0,0 0,0 0,0 z m 0.04,0.09 0,0 0,0 0.01,-0.02 0,0 -0.01,0.02 z m 0.73,0.77 -0.14,0.05 0,0 0.14,-0.05 0,0 0,0 z" title="Московская область" id="RU-MOS" />
                                <path d="m 73.940108,566.34082 0.77,0.29 0.87,-0.61 0.02,-1.13 -0.36,-0.98 0.42,-0.68 -0.27,-0.46 0.22,-0.4 0.21,-0.15 1.4,0.86 1.21,-0.73 0.85,0.29 0.41,-0.16 0.3,-1.45 1.32,-1.1 0.67,-1.84 0.78,0.02 0.84,0.6 0.94,-0.37 0.87,-1.39 0.01,-0.75 0.53,-0.39 -0.39,-1.94 1.01,0.1 0.69,0.87 0.37,0.04 0.37,-0.11 0.35,-1.45 0.37,-0.1 2.37,1.66 0.32,1.58 2.18,1.31 0.67,-0.26 0.44,-0.8 -0.29,-0.91 0.2,-0.84 1.17,-0.94 0.67,-1.07 0.43,0.7 1.54,1.07 0.73,-0.89 0.65,0.24 1.140002,-0.28 1.44,2.56 0.64,0.1 0.68,0.58 0.51,0.17 0.35,-0.61 1.18,-0.19 2.03,1.02 1.11,-0.06 0,0 1.46,0.72 -0.42,0.33 0.31,0.27 1.79,0.54 -0.27,1.97 0.65,-0.4 0.14,1.03 0.95,-1.36 0.62,0.01 1.27,0.74 0.39,-0.21 0.51,0.68 2.17,0.84 0.49,0.61 0.07,0.68 0.48,0.35 0.06,0.6 0.37,0.34 0.95,0.12 0,0 -0.49,0.45 -0.87,-0.22 -0.45,0.48 -0.38,-0.23 -0.52,0.61 -0.64,-0.26 -0.18,0.87 -2.64,-0.49 -1.73,0.87 -0.28,0.34 0.31,0.64 -0.98,1.22 -0.74,0.14 -0.29,0.35 -0.68,-0.54 -0.33,0.18 -0.74,-0.4 -0.59,0.6 -0.04,0.73 0.31,0.53 -0.46,0.48 -1.5,-0.89 -0.52,0.16 -0.31,-0.47 -0.61,0 -0.67,-0.62 -0.85,0.13 -0.07,-0.34 -1.16,1.27 -1.32,-0.21 -1.18,1.59 1.13,0.94 -0.18,1.18 -0.81,0.58 -0.2,0.71 0.33,0.69 -0.49,0.46 -0.610002,-0.25 -0.92,0.33 0.29,0.36 -0.28,0.6 0.22,0.57 -0.6,0.18 -0.19,0.51 -0.02,0.51 0.56,0.39 -0.21,0.68 -0.75,-0.9 -0.9,0.62 -0.54,-0.5 -0.33,0.4 -0.48,-0.3 -0.35,0.15 -1.01,1.69 -0.78,-0.03 -0.42,0.63 -0.65,-0.02 -0.05,0.37 -0.9,-0.1 -0.09,1.06 -0.68,-0.14 -0.21,0.38 -0.79,0.22 0.05,0.44 -0.36,0.06 0.17,0.47 -0.3,0.12 -0.29,-0.71 -0.52,0.11 -0.25,0.43 -0.39,-0.21 -0.56,0.81 0.31,0.36 -0.49,0.13 -0.4,0.93 -2.48,-0.4 -0.45,0.49 -1.68,-0.77 0,0 -0.34,-0.18 -0.88,0.49 -0.72,-0.48 -0.29,-0.73 1.03,-2.61 -2.62,-1.81 0.46,-1.25 -0.26,-0.26 1.48,-1.67 -0.69,-0.02 -0.79,-0.57 0.48,-1.25 -0.64,-0.34 0.58,-0.79 0.05,-0.85 -1.9,-0.03 -1.3,-0.64 -0.75,0 -0.08,-0.73 -1,-0.91 -1.27,-0.39 0.21,-0.96 -0.39,-0.64 1.85,-1.36 z" title="Новгородская область" id="RU-NGR" />
                                <path d="m 228.45011,403.86082 -1.2,0.39 -1.03,-0.09 -0.55,0.37 -0.84,-0.08 -0.07,0.44 -1.1,0.55 1.15,-1.37 1.06,-0.67 3.05,0.16 -0.47,0.3 z m 52.53,-17.38 2.2,0.99 0.9,0.72 0.32,0.5 -0.02,0.41 -0.25,0.03 0.42,0.49 0.22,1.48 -0.56,-0.26 -0.54,-2.29 -1.35,-0.97 -0.85,-0.18 -0.99,-0.92 -0.06,-1.02 0.56,1.02 z m -65.07,-0.78 1.83,1.31 -0.38,0 0.22,0.43 0.37,-0.32 0.99,0.95 0.83,1.51 0.18,1.81 -1.13,2.21 -0.17,-0.74 1.07,-3 -0.24,-0.7 -0.01,0.98 -1.18,1.03 0.09,0.55 -1.53,0.92 0.24,0.06 -0.37,0.44 0.1,0.31 0.3,-0.05 -0.82,0.89 -0.88,1.85 -2.12,1.14 -0.31,-0.22 0.08,0.38 -2.73,1.14 -0.04,-0.25 -1.52,0.57 -0.26,-0.61 -0.17,0.83 -1.17,-0.57 0.5,0.16 -2.2,-2.35 0.43,-0.08 -0.45,-0.43 -0.1,0.32 -0.2,-0.15 0.2,1.26 1.11,1.41 -0.47,-0.28 -0.66,-0.68 -0.21,-0.98 -0.03,-5.25 0.45,-2.63 0.97,-2.59 1.84,-2.05 1.21,-0.76 2.64,-0.46 1.38,0.66 2.32,2.03 z m -22.73,48.95 -0.02,0.24 2.35,-0.54 0.28,0.46 0.19,-0.58 0.82,-0.04 2.36,-1.27 1.52,0.67 -0.17,-0.59 1.18,-1.7 0.09,-2.39 -0.58,-0.98 0.79,-0.88 -0.1,-1.78 1.11,-1.92 -0.64,-2.42 1.17,-1.25 0.77,0.49 -0.25,0.07 0.1,0.45 1.15,-1.26 0.68,-0.27 0.91,0.51 1.5,-1.09 0.23,0.15 -0.23,0.26 1.34,-0.15 1.1,0.68 -0.46,0.22 0.2,0.39 0.56,-0.11 -0.42,-0.1 0.35,-0.46 -1.42,-1.27 -0.82,0.3 0.34,-1.28 -0.11,-1.25 -1.23,-1.55 1.72,1.41 1.2,0.14 1.12,-0.35 2.95,-1.91 3.39,-2.81 -0.16,0.7 -1.5,1.03 0.37,0.35 0.51,-0.26 -0.03,-0.32 0.42,0.01 -0.05,-0.5 0.42,-0.13 0.34,-0.67 -0.14,-0.37 5.16,-5 0.8,0.5 2.75,-0.76 0.51,-0.55 0.48,0.03 0.07,-0.39 0.96,0.12 0.3,-0.41 -0.66,-0.1 0.48,-0.73 2.13,-0.45 2.4,-1.23 0.33,0.15 -0.74,1.02 -0.77,0.06 0.07,0.74 0.65,-0.72 0.63,0.4 -0.04,0.62 0.4,-0.3 0.29,0.13 -0.22,0.11 0.08,0.87 -0.76,0.49 -0.21,0.54 1.06,1.01 0.12,-0.32 0.67,-0.09 1.3,-1.37 0.72,-0.36 0.42,-1.11 -1.29,-0.87 -0.25,-0.87 -0.44,-0.23 0.27,-0.91 -0.9,0.98 -0.81,-0.39 7.7,-5.75 3.69,-1.53 4.08,-0.65 0.98,0.32 -0.45,0.31 -0.62,-0.25 -0.64,0.48 -3.27,0.8 -1.93,0.2 0.25,0.25 -0.48,0.38 1.01,0.75 0.13,-0.25 -0.51,-0.47 1.01,0.08 1.43,0.7 -0.28,0.75 -0.62,0.03 -0.32,1.11 0.11,0.88 -0.77,0.8 -0.27,1.02 0.62,0.31 0.85,1.3 0.26,2.23 -0.92,0.68 0.08,0.67 -0.49,-0.2 -0.57,-0.84 -0.47,0.14 -0.24,-0.31 0.03,0.3 0.49,0.21 -0.02,0.91 -0.35,-0.66 -0.9,-0.33 -1.16,0.62 -0.82,1.28 -0.01,1.02 -0.38,-0.03 0.23,1.51 -0.47,0.15 0.23,0.13 0.6,-0.53 -0.08,-0.65 0.39,-0.69 1.14,-0.35 0.83,0.17 1.13,-0.36 0.43,0.33 0.29,-0.12 0.4,0.27 -0.24,0.36 0.3,0.38 0.92,-0.66 -0.42,0.76 0.57,-0.82 0.09,0.45 0.48,-0.6 -0.14,0.98 0.28,1.38 -1.24,2.15 0.28,0.18 1.4,-1.99 0.43,-2.5 0.64,-0.12 1.15,-1.29 0.41,0.17 0.87,2.23 0.47,0.4 0.82,-0.01 -0.23,0.79 0.58,-1.08 -0.09,-0.81 0.53,-0.71 -0.7,-1.4 0.3,0.19 -0.21,-0.3 0.97,-2.03 0.5,0 -0.06,-0.29 0.88,-0.88 0.25,0.13 -0.08,-0.23 1.04,-1.02 2.06,-0.02 2.12,-1.83 0.8,-0.12 1.47,1.09 1.22,0.01 1.29,-0.58 1.06,0.42 0.67,0.87 1.35,0.68 1.91,-0.23 1.11,-1.14 0.03,-0.9 1.29,-1.97 -0.68,-0.21 -1.34,0.72 -1.22,-0.04 5.11,-1.77 0.23,0.17 -0.33,0.48 0.2,0.79 0.54,-0.42 0.14,-0.53 -0.47,-0.4 0.18,-0.3 6.59,-3.37 2.12,-0.07 0.77,0.28 -0.04,0.25 -0.56,-0.23 -0.89,0.36 -0.8,0.78 0.91,0.29 2.1,1.74 0.79,1.61 -0.57,1.26 -1.29,-0.22 -0.61,0.32 -0.04,0.81 -0.67,0.91 0.58,1.29 -0.3,1.94 0.37,0.43 1.47,0.27 1.11,0.71 1.77,-0.52 0.23,-0.48 0.56,-0.05 0.47,-1.08 -1.09,-3.56 0.98,-1.58 0.84,0.74 2.72,-0.34 1.35,-1.08 1.27,-2.35 0.59,-0.5 0.66,0.05 -0.17,0.74 1.15,0.01 0.48,1.11 0.4,-0.02 -0.32,-0.13 0.05,-1.09 -1.56,-1.39 -0.12,0.29 -0.14,-0.19 0.35,-1.47 -0.32,-1.12 0.15,-0.4 -0.69,-1.46 -0.43,-0.39 -0.31,0.17 0.09,1.12 -0.85,-0.57 -0.15,-2.66 -2.35,-3.85 -0.09,-0.65 -0.55,-0.5 0.1,-0.71 -0.36,-0.4 0.24,-1.44 0.92,-0.83 0.74,0.27 1.45,-0.13 -0.09,0.75 0.85,0.28 0.25,-0.29 -0.77,-1.6 0.05,-0.54 0.63,0.17 -0.41,-1.91 0.96,-1.09 1.46,0.64 0.39,-0.74 0.54,0.99 0.82,-0.05 0.36,0.65 0.95,0.27 1.76,0.11 2.23,0.7 5.7,0.45 1.05,0.34 0.01,0.67 0.11,-0.7 4.04,1.56 5.89,2.98 0.89,0.97 -0.2,0.29 0.33,-0.19 2.37,2.06 0.62,1.32 0,0 -0.81,0.8 -0.45,1.15 0.19,1.71 -0.27,0.56 -1.13,0.79 0.6,1.55 -0.27,0.56 0.89,0.74 0.26,-0.72 0.55,0.27 1.68,1.61 1.37,-0.17 0.97,0.61 -0.01,0.89 1.25,0.7 -0.33,1.06 1,2.35 -0.26,1.02 -1.35,1.36 0,0 -1.2,0.72 -0.66,-0.04 -1.18,-0.72 -0.77,0.34 -1.35,0.02 -1.31,1.12 0.19,2.68 -1.04,0.42 -0.28,0.79 -3.53,2.05 0.4,2.12 -1.79,2.15 0.08,0.98 -1.51,-0.72 -1.15,0.34 -1.79,1.82 -1.18,2.57 -0.17,2.53 -8.03,5.62 -0.86,1.53 -1.12,-0.18 -1.19,0.72 -0.8,-0.27 -38.01,0.43 -9.87,-0.28 -17.42,-1.53 -3.75,3.03 -0.8,0.08 0.16,2.32 -18.81,12.03 0,0 -1.91,-0.38 -1.35,0.13 -1.02,-0.34 -1.62,0.13 -2.37,2.12 -0.71,1.27 0.88,1.48 -0.37,0.34 -2.39,-0.22 -2,0.28 -5.21,-4.21 -1.89,0.8 -2.09,-1.53 -1.26,0.55 -0.54,-0.08 -2.96,-2.15 -3.98,-1.13 -1.3,-1.82 -1.72,-0.44 0,0 0.62,-1.41 0.5,-0.23 0.52,-2.59 1.05,-0.31 -0.74,-0.22 -0.93,-2.08 0.91,-0.78 -0.12,-1.22 0.41,-0.23 -0.93,-1.75 -0.72,-0.67 0.09,-0.55 0.51,-0.41 -0.74,0.38 -0.79,-0.89 0.04,-0.45 -1.01,-0.43 -1.28,0.15 -0.61,-0.71 0.02,-1.19 1.28,-5.22 0.95,-2.22 0.35,-0.15 -0.1,0.63 0.37,-0.75 0.23,0.05 -0.42,-0.42 -0.26,0.1 0.51,-1.58 -0.48,-1.36 0.4,-0.75 0.56,0.01 -0.33,-0.44 0.78,-0.24 -0.73,-0.19 -0.24,0.2 0.04,-1.12 1.34,-1.16 -1.06,0.23 0.13,-3.66 -0.28,-1.77 -1.32,-1.64 -4.42,-3.81 -0.98,-1.21 -0.01,-0.55 1.35,-0.01 4.22,2.64 4.78,-0.05 3.71,0.32 2.3,0.52 3.42,1.6 -0.83,-0.38 -0.23,0.36 1.07,1.44 0.02,0.66 0.82,0.49 1.31,1.98 1.54,1.16 0.07,0.33 -0.52,0.2 0.43,-0.12 0.14,1.68 0.97,2.05 -0.06,1.72 -1.84,0.03 -1.06,-0.36 0.18,0.32 -1.71,0.57 -0.68,-0.12 -0.77,0.69 -1.31,0.21 -0.1,-0.35 -1.03,0.28 -1.36,1.04 -0.3,-0.13 -0.17,0.38 0.39,-0.08 0.18,0.48 -0.29,1.56 -0.31,-0.17 -0.72,0.32 -1.15,1.33 -0.52,1.28 -0.12,1.7 -0.56,0.4 0.27,-0.28 0.37,0.41 0.2,-0.17 1.52,1.28 3.13,1.71 -0.1,1.71 0.72,0.65 0.87,2.49 1.46,0.79 0.11,0.28 -0.42,0.39 3.81,-1.03 0.42,0.03 0.3,0.43 -0.25,0.24 z m 89.76,-71.74 -0.03,0.78 0.67,0.3 1.44,1.47 1.71,2.99 1.45,1.26 -0.02,0.5 1.23,0.78 0.52,-0.14 -0.03,0.51 0.47,0.67 1.66,1.94 0.77,0.3 0.06,0.96 0.7,1.71 -0.56,0.92 0.15,0.94 -0.85,-0.52 0.28,0.67 -0.68,0.03 -0.17,0.33 -0.35,-0.23 0.15,0.4 -0.63,-0.25 0.19,0.43 -1.41,-1 0.24,0.67 -0.56,-0.18 0.2,0.77 -0.45,-0.17 -0.17,-0.56 -0.8,0.14 -1.51,-0.51 0.23,-0.62 -0.28,-0.31 0.07,-0.74 0.22,0.34 0.7,-0.13 -1.12,-1.61 -0.93,-0.7 -0.09,0.24 -0.73,-0.31 -0.39,0.19 -0.35,-0.49 -0.61,-0.02 -1.04,-0.72 1.39,1.88 -0.82,-0.02 -0.55,-1.27 -1.3,-1.07 -1.46,-2.11 0.32,-0.79 -0.71,-0.27 0.77,-0.24 -0.52,-0.4 0.33,-0.16 -0.08,-0.34 -0.36,0.33 -0.17,-0.62 -0.19,0.25 -0.27,-0.18 0.66,-0.45 -0.62,-0.54 -0.17,0.26 0.04,-0.41 -0.41,-0.02 0.08,-0.39 1.39,0.28 1.04,0.85 0.48,-0.09 0.01,-0.59 -2.02,-1.64 -0.17,-0.54 0.97,0.43 0,-0.55 0.95,-0.64 0.1,-1.13 0.96,-0.07 0.98,-0.78 z" title="Ненецкий автономный округ" id="RU-NEN" />
                                <path d="m 177.89011,735.73082 0.33,0.22 1.73,-0.51 0.98,0.16 0.8,0.99 0,0 -0.23,1.06 0,0 -0.71,-0.38 -0.27,0.97 -0.4,-0.07 -0.18,-0.54 -0.81,0.11 -0.1,1.27 0.56,0.51 -0.13,1.61 0.77,0.03 1.28,1.32 0.37,1.55 -0.93,0.94 -0.72,-0.16 -0.26,-0.5 -0.27,1.06 0,0 -1.22,-0.04 -1.32,0.38 -0.82,0.84 -1.25,0.21 -0.62,0.45 -1.27,-0.28 -0.28,-0.39 0.43,-1.19 -1.05,-0.49 -0.6,-0.64 -1.03,-0.29 0,0 0.49,-0.42 0.57,0.36 0.65,-0.29 1.99,-3.26 0.39,0.6 0.47,-0.24 0.27,0.34 -0.36,0.05 0.15,0.24 0.37,0.07 0.38,-0.44 -0.16,-1.04 0.28,-0.32 0.72,0.34 0.72,-0.5 0.66,0.28 0.21,-0.19 0.19,-2.23 -0.84,-0.79 z" title="Республика Северная Осетия — Алания" id="RU-SE" />
                                <path d="m 405.05011,582.62082 2.31,0.57 1.83,-0.2 1.51,0.61 8.07,0.23 2.47,-0.2 0.9,0.99 5.77,1.27 1.34,1.04 1.82,0.88 3.81,5.41 2.33,-0.3 3.99,-1.05 0.43,0.17 2.42,3.23 0.53,0.16 5.5,-1.55 2.84,-0.29 0.43,-0.53 -0.02,-0.67 1.95,-0.52 0.87,1.65 -1.1,2.02 0.76,0.64 -0.1,0.98 0.73,0.47 -0.07,1.03 0.66,1.98 -0.56,1.25 -0.48,0.2 0.51,0.68 2.33,0.03 1.39,-2.55 1.23,-1.51 1.25,-0.41 0.94,0.73 0.61,-0.07 0.71,-0.63 0,0 0.65,0.19 0.18,1.19 -0.32,0.44 0.45,1.44 -0.18,0.37 0.66,1.14 0.85,0.37 0.26,0.61 -0.2,1.57 -1.06,0.82 1.74,0.06 -0.06,1.69 0.41,1.63 -0.38,1.55 1.15,1.32 0.29,0.99 -0.34,0.52 -0.55,0.18 -0.14,0.64 0.83,0.78 -0.55,0.77 0.8,1.97 0,0 -0.04,0.29 -1.26,0.25 -2.07,1 -1.41,1.78 -0.3,-0.37 -0.99,-0.27 -2.05,1.06 -1.08,-0.19 -2.28,0.35 0.1,1.04 -0.66,0.73 -0.57,-0.23 -0.28,-0.88 -0.94,-0.1 -0.62,0.33 -2.64,2.59 0.13,0.68 -0.63,0.86 0.14,0.48 -0.9,0.89 0.22,0.29 -0.75,0.27 -0.71,-0.15 -1.41,-1.03 0.22,-0.61 -0.38,-0.2 -2.51,-0.54 -0.49,-1.27 0.74,-0.48 0.07,-0.64 -1.88,-0.05 -0.03,-1.13 -0.83,-0.84 -1.2,0.04 -0.5,-0.5 -0.71,0.11 -0.23,-0.96 -0.93,-0.92 -0.26,-1.13 -0.4,-0.04 -0.54,0.58 0.27,0.83 -1.73,0.52 -0.5,0.48 0.15,0.56 -0.85,0.09 -1.19,0.96 -0.42,0.13 -0.29,-0.54 -0.33,0.14 -0.44,0.33 0.2,0.5 -1.58,0.97 -0.18,0.75 -1.58,0.5 -0.14,0.59 -0.85,0.61 -0.69,0.29 -0.73,-0.41 -0.59,0.48 -0.67,0.1 -0.43,-0.31 -0.23,0.45 -0.5,-0.3 -1.68,0.33 -0.38,0.28 -0.35,1.26 -2.15,0.54 -0.81,-0.64 -0.04,-0.89 -0.52,0.57 -1.03,0.06 0.02,0.86 0.74,0.44 -0.73,0.19 0.13,0.55 -0.15,0.32 -0.3,-0.12 -0.32,0.78 0,0 -7.95,-6.78 -1.83,-2.04 -0.58,-1.6 1.31,0.09 0.33,0.42 0.67,-0.42 0.67,-0.9 0.21,-0.92 -0.15,-0.67 -0.49,-0.17 1.09,-0.59 -0.04,-0.39 -1.38,0.5 -0.6,0.87 -1.41,0.26 -1.59,-0.38 -0.05,1 -3.79,1.75 0,0 -0.21,-4.02 0.12,-0.89 0.94,-0.65 -0.17,-1.02 -0.67,-0.36 -0.22,-1.07 -0.63,-0.67 -0.18,0.67 -0.46,-1.36 -1.36,-0.01 0.61,-1.68 -0.55,-0.91 -0.52,-0.03 0.31,-1.14 -0.65,-0.94 -0.09,-0.79 -0.56,-0.15 1.08,-1.51 0.67,-0.22 -1.34,-0.74 -0.21,-0.72 0.3,-0.37 -0.61,-0.95 0.31,-0.39 0.9,0.28 0.5,-0.25 -0.24,-1.53 1.35,-1.54 -0.1,-0.74 1.08,-0.19 0.53,-0.63 0.95,0.02 1.32,-0.79 1.27,0.31 0.83,-0.47 -0.15,-0.68 -1.24,-1.1 -0.12,-1.12 0.28,-0.57 -0.64,-0.52 -1.22,0.82 -0.38,-0.71 1.5,-1.79 0.68,-0.15 0.88,-0.97 0,-2.93 -0.49,-0.6 0.05,-1.12 z" title="Новосибирская область" id="RU-NVS" />
                                <path d="m 191.99011,571.25082 0.11,0.7 0.86,-0.35 4.02,0.26 2.1,0.24 2.86,0.97 -1.27,1.45 -0.39,2.87 -0.54,1.06 -0.44,0.2 -1.14,-0.77 -1.62,1.05 -1.36,-0.26 -0.39,0.25 -0.53,1.13 0.13,1.41 0.81,1.35 -0.69,0.58 0.39,0.62 -0.26,2.17 0,0 -0.4,-0.5 -0.38,0.66 -0.56,0.15 -1.5,-0.49 -0.67,0.85 -2.15,0.46 -0.56,0.75 0.12,2.29 -1.04,-0.06 -0.67,0.77 -0.29,1.15 0.19,0.56 0.92,-0.19 1.26,0.83 0.07,0.83 -0.71,0.92 1.63,1.2 -0.08,0.71 0.46,1.27 0,0 -0.42,0.89 0.18,1.72 -1.02,1.37 0.01,0.83 1.45,1.38 1.54,0.66 0.19,0.76 -0.97,0.66 -0.29,1.13 -0.93,0.56 -0.43,0.69 0.41,1.6 0,0 -0.98,0.73 -1.42,0.21 -0.39,-0.42 0.46,-1.89 -0.71,-0.18 -1.33,1.01 -0.49,1 0.29,1.38 -1.33,0.47 -0.49,1.48 -0.47,-0.61 -0.44,0.54 0.19,1.19 -0.64,0.78 1.09,1.1 -0.23,0.43 -0.54,-0.24 -1,0.25 -0.57,-0.44 -1.59,0.57 0.45,-0.91 -0.5,-0.31 -0.58,0.53 -1.18,-0.89 -0.91,-0.04 -0.89,-0.83 0.14,-0.68 -0.22,-0.24 -0.85,0.16 -0.26,-0.22 0.04,-0.64 -2.51,-0.53 0.05,-1.2 -0.8,0.25 -0.8,-0.41 -0.54,0.09 -0.12,0.46 -1.05,0.52 -0.31,1.11 -0.68,-0.46 -0.87,0.65 -0.52,-0.01 -0.36,-0.71 -0.28,-0.01 -0.99,0.55 -1.07,-0.85 0,0 -0.04,-1.35 0.45,-0.37 -0.46,-0.37 -0.36,0.31 -0.29,-0.24 -0.99,0.65 -1.62,-0.39 0.16,-1.28 -1.09,0.64 -0.56,-0.65 0.1,-0.48 0,0 0.51,-0.2 0.44,-0.87 0.31,-1.67 0.35,0 0.77,-0.94 -0.38,-1.12 0.04,-1.4 1.25,-1.71 1.16,-0.63 0.34,-1.49 0.8,-0.13 0.77,-0.73 0.09,-0.64 -0.26,-0.32 0.36,-0.44 0.84,-0.19 0.66,-0.75 0.05,-0.53 -1.36,-0.55 -0.21,-1.42 -0.68,-0.66 0,0 0.42,-0.81 1.68,-0.07 -0.05,-2.48 -0.4,0.31 -0.35,-0.29 0.38,-0.89 -0.38,-0.5 0.43,-0.58 0.8,-0.32 0.57,0.32 0.48,-0.23 0.03,-0.34 2.81,-0.34 1.23,-2.34 -0.5,-0.22 0.05,-0.26 -0.9,-0.22 0.07,-1.22 0.35,-0.54 0.86,-0.4 -0.19,-0.44 0.5,-0.36 0.44,0.32 0.2,-0.57 0.34,0.23 0.11,-0.3 -1.14,-0.68 0.11,-0.47 0,0 2.51,0.1 1.34,-0.96 0.89,-0.05 1.59,-2.48 1.04,0.12 0.15,-0.93 0.5,-0.34 -0.16,-0.67 0.38,-0.39 -0.26,-2.22 0.33,-0.47 2.41,-0.12 0.86,0.8 0.88,-0.24 1.18,1.51 0.49,0.02 0.41,-0.36 0.25,-0.97 0.31,0.04 0.22,-0.38 0.52,0.14 z" title="Нижегородская область" id="RU-NIZ" />
                                <path d="m 236.22011,618.84082 0.35,0.43 1.36,-0.03 1.42,0.77 0.66,-0.54 0.47,0.65 -0.1,0.3 -1.19,0.36 -0.11,0.49 0.76,0.44 -0.12,0.83 1.37,-0.62 0.88,1.03 0.22,-0.09 0,0 0.71,0.81 1.02,2.17 1.31,1.37 1.68,2.6 1.17,0.99 0.8,-0.09 1.31,0.6 0.83,1.42 1.63,-0.35 0.34,0.28 0.5,2.49 0.82,1.26 0.03,0.74 0.56,0.38 1.22,-0.38 0.18,1.22 0.28,0.22 -0.36,0.38 -0.59,-0.15 -0.25,0.58 0.32,0.35 0.54,-0.14 0.75,0.63 0.51,2.12 2.01,0.6 1.62,-2.2 0.31,-1.27 1.67,1.15 0.51,-0.38 0.22,0.22 -0.41,0.79 0.58,0.77 0.15,1.19 -0.28,0.81 -1.18,1.16 0.7,0.73 0.54,-0.9 0.31,-0.01 1.33,1.35 0.79,1.69 -0.66,0.99 1.26,2.03 -0.28,1.08 0.65,0.11 0.39,-0.52 -0.36,-1.18 0.39,-0.24 0.98,0.62 1.13,1.47 1.22,-0.79 0.1,-0.99 1.17,0.33 0.85,-1.8 0.44,-0.1 0.31,0.36 0.65,-0.1 1.55,0.44 0.71,0.92 0.41,0.07 1.12,-0.64 0.99,-0.12 0.58,-0.62 0.8,-2.93 -0.63,-0.67 0.27,-1.51 0.45,-0.32 0.59,0.18 0.44,-0.62 -0.53,-1.28 0.11,-0.34 0,0 1.03,-0.02 0.58,1.13 1.4,0.83 -0.25,-1.09 0.23,-0.63 1.4,-0.59 0.32,-0.05 0.23,0.47 0.88,-0.28 0.85,0.42 0.26,-0.22 0.96,0.66 1.52,-0.17 0.37,1.77 -1.02,0.89 -0.77,1.71 0.95,0.66 0,0 -0.37,0.08 -0.09,0.43 0.35,0.82 0.59,0.2 -0.02,-0.44 1.6,1.04 0.83,0.17 -0.92,1.16 0.6,0.61 0.89,0.35 2.3,0.05 0.07,0.77 0.52,0.9 1.28,0.1 1.22,0.65 0.95,-0.32 0.5,1 0.88,0.87 -0.64,0.21 -1.14,5.14 -4.3,1.5 -2.52,-0.1 -1.15,-0.26 -0.87,-1.09 -0.09,-0.62 -0.81,-0.24 -0.47,0.42 -1.23,2.76 -2.16,0.78 0.07,-1.01 -0.45,-0.62 -1.42,0.13 -0.44,-0.32 -2.22,-0.25 -0.87,-0.82 -0.06,-0.72 -1.29,0.09 -0.24,-1.29 0.28,-0.79 -0.28,-0.58 -1.39,-0.2 -0.57,-0.93 -0.56,0.32 -0.24,0.73 -0.54,-0.13 -0.12,-0.53 -0.63,0.49 -0.53,-0.4 -0.39,0.18 -0.39,-0.42 -0.46,0.11 -0.16,2.26 -0.36,0.23 -0.25,-0.39 -0.57,0.11 -0.41,0.65 -1.15,-0.58 -1.19,-1.89 -1.15,0.5 -0.47,-0.27 -0.39,0.25 -0.51,-0.33 -0.74,0.04 0.02,1.22 -0.68,-0.21 -1,-1.12 -0.24,0.27 0.07,1.01 -0.57,0.07 -0.31,0.69 -1.16,-0.27 -0.4,1.95 -2.86,1.71 -0.3,0.46 -1.49,-1.16 -0.93,0.13 -1.85,-1.63 -0.26,-0.33 0.3,-0.83 -0.37,-0.29 -1.24,1.06 -0.39,-0.51 -0.84,-0.12 -0.37,0.94 0.51,2.06 -0.85,1 -0.72,0 -0.61,-1.05 0.65,-2.43 -1.55,-0.42 -0.83,-1.26 0.07,-0.5 -0.21,-0.3 -0.14,0.15 -0.02,-0.65 -0.76,-0.6 -2.55,-0.73 -0.5,-0.91 0.19,-0.94 -1.83,-1.44 -0.7,0.31 -0.12,-0.24 -1.34,0.08 -0.66,0.36 -0.39,-0.33 -0.41,0.27 0.17,-0.32 -0.82,-0.07 -0.7,0.34 0.05,0.23 -1.02,-0.06 -1.6,-3.47 -0.48,0.56 -0.63,-0.02 -0.47,0.72 -1.79,-0.31 -0.73,1.07 0.28,0.78 -0.9,0.56 -0.3,0.04 0.13,-0.5 -0.57,-0.54 -0.34,0.58 -0.65,0.32 -0.82,-0.08 -0.52,-0.76 0.85,-0.17 -0.01,-0.95 -0.66,-0.42 -1.47,0.25 -1.23,-0.14 -0.38,-0.77 0,0 0.19,-0.56 0,0 2.29,-1.7 1.59,-1.61 0.33,-0.58 -0.46,-2.16 1.32,-1.52 0,-0.45 -0.64,-0.68 0.45,-1.31 0.51,-0.52 0.5,0.19 0.52,-1.36 -0.12,-0.81 1.5,-1.42 1.1,-0.62 0.35,-1.2 -0.47,-0.62 0.62,-1.49 -0.11,-0.53 1.04,-0.44 -1,-0.33 -0.46,-1.09 0.81,-1.2 0.28,-1.72 0.97,-1.51 0.43,-1.62 0.03,-0.65 -0.84,-0.88 -0.07,-0.56 0.35,-0.13 0.21,-1.7 z" title="Оренбургская область" id="RU-ORE" />
                                <path d="m 117.46011,627.95082 0.31,0.79 0.4,-0.12 1.36,0.61 0.4,0.85 1.14,0.85 1.33,-0.23 -0.16,0.22 0.62,1.03 1.31,0.38 0.32,-0.3 1.59,0.72 0.67,-0.24 0.04,-0.55 2.02,0.32 0.01,1.62 0.59,0.42 0.4,-0.41 0.99,1.48 0,0 -0.23,0.88 0.41,0.5 -0.29,0.84 0.32,0.71 -0.8,1.49 -0.56,0.02 0.04,0.43 0.6,-0.06 0.88,0.77 -0.42,0.25 0.12,0.29 0.84,0.26 -0.36,0.34 0.17,0.41 0.45,-0.01 -0.05,0.39 0.56,0.69 -0.2,0.62 -0.35,0.26 -0.37,-0.19 -1.38,1.08 0.01,1.39 0,0 -0.3,-0.07 -0.56,0.9 -0.47,-0.58 -0.65,-0.09 -0.36,0.86 -0.31,0.1 -1.51,-1.6 -2.13,-0.38 -1.03,-0.78 -0.73,-0.05 -0.26,-0.46 -0.94,-0.15 -1.01,-1.63 -0.41,-0.12 -4.67,1.31 -0.32,-0.18 -0.42,-1.92 -0.5,-0.17 -0.15,0.6 -0.67,-0.36 -0.07,0.63 -1.07,-0.37 -0.32,0.47 -1.34,0.25 0,0 -0.46,-0.49 -0.4,0.1 0.03,-0.68 1.34,-1.08 -0.49,-0.43 0.27,-0.39 -0.3,-0.62 0.45,0.15 0.24,-0.35 -0.33,-0.54 0.23,-0.51 -0.52,0.07 -0.47,-0.53 -0.31,0.36 -0.6,-1.1 0.75,-0.25 -0.09,-0.61 0.7,0.11 0.11,-0.56 0.36,0.59 0.83,-0.26 -0.02,-0.65 0.77,-0.01 0.12,-0.81 -1.24,-0.67 0.35,-0.25 -0.09,-1.35 0,0 0.61,-0.27 0.38,0.2 -0.05,-0.52 0.95,-0.33 0.52,-1.37 0.48,-0.16 -0.34,0.74 0.34,0.1 0.5,-1.24 0.57,-0.38 0.23,0.42 0.7,-0.06 0.24,-0.54 z" title="Орловская область" id="RU-ORL" />
                                <path d="m 398.28011,564.55082 1.29,1.82 -1.61,1.02 -0.57,0.78 1.42,1.36 -1.06,1.07 0.05,0.55 1.35,1.15 1.7,0.81 0.51,3.07 -0.31,1.02 0.83,0.06 1.14,2.15 0.18,1.35 0.79,-0.23 1.06,2.09 0,0 0.54,2.46 -0.05,1.12 0.49,0.6 0,2.93 -0.88,0.97 -0.68,0.15 -1.5,1.79 0.38,0.71 1.22,-0.82 0.64,0.52 -0.28,0.57 0.12,1.12 1.24,1.1 0.15,0.68 -0.83,0.47 -1.27,-0.31 -1.32,0.79 -0.95,-0.02 -0.53,0.63 -1.08,0.19 0.1,0.74 -1.35,1.54 0.24,1.53 -0.5,0.25 -0.9,-0.28 -0.31,0.39 0.61,0.95 -0.3,0.37 0.21,0.72 1.34,0.74 -0.67,0.22 -1.08,1.51 0.56,0.15 0.09,0.79 0.65,0.94 -0.31,1.14 0.52,0.03 0.55,0.91 -0.61,1.68 1.36,0.01 0.46,1.36 0.18,-0.67 0.63,0.67 0.22,1.07 0.67,0.36 0.17,1.02 -0.94,0.65 -0.12,0.89 0.21,4.02 0,0 -0.7,0.32 -0.5,-0.21 -0.96,0.49 0.61,0.87 -0.07,0.38 -3.11,2.29 -1.63,-0.36 -0.29,0.73 -0.61,0.04 -0.32,1.09 -1.22,-0.21 -0.21,1.07 0.31,0.18 -0.58,1.44 -0.88,-0.33 -0.28,-1.27 -0.52,-0.11 -0.13,0.62 -0.63,-0.06 0.08,-0.83 -1.23,-0.28 -0.5,0.75 -1.14,-0.46 -0.18,0.78 -0.37,-0.09 -0.12,0.54 -0.95,0.93 -0.5,-0.39 0.15,-0.65 -1.1,-0.5 0.26,-0.85 -0.17,-0.45 0.5,-0.09 0.14,-1.29 0.77,-0.23 -0.17,-0.38 0.24,-0.45 1.62,0.24 0.42,-2.33 -0.84,-0.25 -0.02,0.4 -0.85,0.44 0.11,0.68 -0.84,-0.49 -0.06,0.42 -0.8,0.03 -1.58,-0.52 -0.19,-0.63 -0.47,-0.07 0.03,-0.55 -2.73,-0.43 -0.4,0.3 -0.18,0.76 1.04,0 0.41,1.18 -1.21,-0.48 -0.52,0.97 -0.74,-0.53 0.3,-1.04 -0.41,-0.61 0.51,-0.37 0.44,0.1 -0.02,-0.35 -1.32,-0.61 0.1,-0.61 -0.33,-0.21 -0.09,-0.78 -0.9,-0.54 -0.72,0.09 0.64,0.83 -0.31,0.73 0.8,0.54 -0.17,0.64 -0.55,-0.27 -0.51,-0.83 -1.84,-0.31 -0.3,0.69 0.15,0.65 -0.65,0.44 -1.01,-0.08 -0.1,-0.58 -1.05,-0.33 -1.03,0.89 -0.35,-0.05 -0.66,-1.13 0.24,-0.73 -0.57,-0.32 -0.06,-0.58 1.35,0.21 0.2,-0.87 -0.23,-2.36 0.74,-0.39 -0.01,-0.49 -1.18,-0.64 -0.56,-0.81 -0.45,-1.42 0.14,-2.3 -1.4,-2.82 -1.38,0.5 -0.76,-0.22 0,0 -0.27,-1.21 0.55,-1 0.51,0.1 0.56,-0.39 0.45,-1.12 -0.03,-0.3 -0.91,-0.2 -0.41,-1.59 1.85,-1 -0.13,-0.21 -1.79,0.2 -0.23,-0.43 0.28,-0.4 1.38,0.07 0.51,-0.5 0.54,-2.02 -0.29,-1.35 -0.66,-0.57 1.64,-0.87 -0.52,-1.12 -0.71,-0.12 -0.17,-0.34 0.5,-0.44 0.56,0.16 1.2,-1.06 -0.49,-1.9 0.72,0.42 0.38,-0.18 1.09,0.22 0.48,-0.74 0.41,0.1 0.46,-0.33 -0.09,-0.4 0.42,-0.24 0.08,-0.56 -0.52,-1.89 -2.87,-3.2 -0.7,-2 -1.34,-0.08 -0.32,0.23 -0.2,1.37 -0.93,0.05 -0.37,-0.78 -0.86,-0.33 -0.48,-0.74 0.03,-0.33 2.19,-1.97 -1.04,-2.43 -0.65,-0.58 0.03,-0.73 0.35,-3.31 1.74,-4.25 0.59,-2.27 0.73,0.68 0.9,0.15 0.06,0.83 1.3,0.46 -0.36,2.08 0.06,1.68 0.39,0.89 4.98,-0.83 0.55,0.28 0.7,0.99 3.25,-0.08 1.44,0.51 1.24,-0.65 -0.27,-0.32 1.34,-1.4 7.19,0.28 2.11,-1.82 0.96,-0.26 1.12,-1.31 1.29,-0.42 0.22,-0.98 z" title="Омская область" id="RU-OMS" />
                                <path d="m 271.05011,594.22082 -1.38,1.44 -0.13,0.54 -1.79,0.95 -0.63,0 -2.65,-3.47 -0.67,0.04 -1,0.85 -1.15,0.34 -0.43,-0.26 -1.32,-2.47 -0.49,-0.1 -1.57,0.49 -0.89,0.85 -0.66,0.21 -1.23,-0.75 -1.61,0.53 -0.71,-0.68 -0.74,-0.19 -0.35,-0.91 -0.65,-0.21 -1.56,2.41 0,0 -0.41,-1.64 -0.64,-0.2 -1.17,-1.47 0.18,-0.75 -0.41,-0.21 -0.72,0.39 -0.12,0.75 -0.44,-0.55 0.07,-0.96 -0.32,-0.47 0.12,-0.76 1.44,-0.18 0.99,-2.12 1.66,-1.13 -0.13,-0.32 -0.61,-0.07 -0.18,-0.53 0.27,-0.52 -0.29,-1.74 -0.76,0.05 -0.2,-0.33 0.2,-0.9 0.59,-0.58 -0.18,-0.61 -1.38,-1.25 0.47,-0.81 -0.02,-1.11 0.48,-1.19 -0.53,-2.15 -1.23,-1.61 -0.93,-1.92 0.51,-1.18 -0.81,-2.1 0,0 -0.28,-1.94 0.22,-0.44 -0.31,-0.53 0.2,-0.62 1.03,-0.57 -0.77,-1.01 -0.32,-2.03 0.59,-1.26 -0.43,-0.37 -0.71,0.18 -1.13,-0.65 -0.87,-0.01 -1.28,-2.85 1.34,-2.76 0.25,-2.01 0.9,-0.13 0,0 0.67,-2.88 0.02,-2.23 -1.49,-2.34 0,0 -0.55,0.24 -0.16,1.01 -6.33,-1.04 -1.27,-0.72 0,0 0.62,-1.06 -0.35,-0.79 0.14,-0.88 -1.5,-0.52 0.13,-0.73 -2.75,-1.04 1,-4.22 3.15,0.6 0.9,-1.8 2.2,0.17 0.65,-1.79 4.05,0.55 -0.66,2.27 3.48,0.59 0.38,-1.87 7.95,1.23 0.91,-2.13 0.79,0.14 0.65,-1.78 3.26,0.23 0.96,-2.27 2.79,0.69 1.15,-3.14 0.92,0.14 0.44,-1.13 0.38,0.05 0.32,-0.57 2.63,0.87 0.86,-0.49 2.9,0.36 8.72,-0.12 0.43,-0.43 1.17,-0.13 0.56,-1.1 1.75,-1.04 0,0 0.73,1.82 -1.36,3.47 0.01,1.16 0.48,3.32 0.91,1.78 -0.01,2.32 -0.69,2.83 -1.36,3.22 0.08,1.4 -1.13,3.86 -2.1,1.88 -1.05,1.66 -1.01,3.46 0.8,0.69 1,1.68 0.76,0.46 1.02,0.11 1.21,1.57 -0.16,1.28 0.58,1.01 -0.76,1.13 -0.01,1.22 0.48,0.16 0.25,0.8 0.5,0.38 1.09,-0.19 0.17,0.25 -0.3,0.8 0.45,1.8 -0.34,0.65 -1.37,0.93 -0.34,1.07 -0.41,0.28 -0.97,-0.18 -1.34,1.11 -0.4,0.99 -1.13,1.32 0.09,1.31 0.55,0.8 1.15,0.27 0.27,0.47 -0.07,1.28 -1.38,1.01 -1.03,1.24 -0.48,-1.54 -1.25,0.1 -1.01,-0.41 -0.64,0.69 -0.01,0.66 -0.68,0.89 0.2,0.86 -0.73,1.64 0.08,0.53 0.97,0.78 -0.33,1.28 0.66,0.93 -0.26,0.3 0.28,0.56 -0.28,0.19 -0.35,-0.5 -0.37,-0.03 -1.88,2.15 -0.7,0.33 -1.66,-0.67 -0.55,0.46 -0.19,1.12 1.31,2.12 -0.43,1.11 z" title="Пермский край'" id="RU-PER" />
                                <path d="m 820.32011,705.97082 3.23,-0.72 0.33,-0.81 -0.31,-2.15 0.98,0.46 0.6,-1.79 0.95,0.01 0.46,-0.33 0.72,0.27 0.73,-0.84 1.05,0.49 0.85,0.03 0.06,0.86 0.66,0.46 -0.5,0.83 0.09,0.38 0.68,-0.03 0.49,-0.58 0.35,0 0.01,0.23 1.19,0.08 -0.21,0.47 1.58,1.17 0.58,-0.77 0.35,-0.03 0.35,0.58 1.33,0.5 0.87,-0.48 1.04,0.16 2.81,-2.16 -0.39,-0.85 0.77,-2.14 1.64,0.34 0.17,0.37 0.86,0.3 2.04,-1.64 0.73,0.26 0.79,-0.38 0.06,-0.7 0.56,-0.08 0.58,-0.56 -0.09,-1.09 -0.62,-0.23 0.51,-0.75 -0.45,0.06 -0.61,-0.43 -0.95,0.21 -1.25,-0.89 -1.21,-0.09 0.18,-0.51 0.79,-0.26 0.17,-0.49 -1.34,-0.79 -0.55,-1.15 1.03,-1.02 1.13,-0.31 0.95,0.31 1.06,-0.46 0.29,-0.61 1.51,-0.26 -0.03,-0.65 0.91,-0.73 1.12,0.34 0.29,1.49 0.54,0.37 -0.06,0.53 1.11,0.14 0.03,0.56 -0.57,0.21 -0.37,0.79 1,0.86 0.46,0.91 -0.12,0.73 -1.61,1.02 -0.12,0.37 0.54,0.59 -0.56,1.33 1.21,0.39 1.22,-0.32 1.02,0.72 0,0 0.34,0.12 -0.44,0.97 -0.94,0.28 -2.03,2.55 -0.66,1.98 -0.98,1.74 -0.03,1.58 -1.17,0.92 -0.56,2.21 -2.37,2.99 -0.6,1.41 -2.33,1.99 -1.6,2.45 -2.43,1.8 -0.26,1.07 -0.94,0.66 -1.38,2.01 0.06,0.57 -0.67,-0.29 -0.1,0.47 -0.28,0.05 0.24,0.27 -0.68,0.46 -0.09,0.91 -0.57,0.89 -1.94,0.84 -0.6,1.46 -1.06,0.91 -0.11,1.39 -0.75,0.28 -0.17,0.63 -0.37,-0.05 0.05,0.71 0.48,-0.17 -0.65,1.29 -1.13,0.78 -0.21,-0.26 0.29,-0.28 -0.65,0.27 0.24,0.15 -0.06,0.62 -0.37,0.25 -0.23,1.02 -1.21,0.36 -1.29,1.17 -0.1,0.41 -0.78,0.06 0.03,0.26 -1.86,1.27 -1.65,0.72 -0.43,0.77 -0.74,0.35 -0.71,0.89 -0.24,-0.24 0.27,-0.01 -0.44,-0.15 -1.07,0.99 -0.49,-0.67 -0.47,0.48 -0.58,-0.08 0.08,0.2 -0.65,0.38 -0.93,0 -0.69,0.68 -1.13,0.31 -0.29,-0.43 0.65,-0.26 -0.74,-0.63 0.08,-0.3 -0.71,0.09 0.09,0.41 -0.46,0.52 -0.61,-1.05 0.09,-0.66 -0.42,0.03 -0.17,0.55 -0.89,0.11 -0.01,-0.23 -0.41,0 0.05,-0.43 -0.57,-0.3 -0.88,0.9 -0.2,-0.7 0.2,-1.32 -0.24,-0.21 0.33,-0.18 -0.12,-0.76 0.55,-0.26 -0.06,-0.33 -0.54,-0.01 0.34,-0.54 -0.14,-0.27 -0.37,0.01 0.13,0.21 -0.48,0.58 -0.85,0.35 -1.33,1.26 -0.34,-0.23 0.3,-1.14 0.63,-0.32 0.44,-0.77 -0.42,-0.11 -0.15,0.35 -0.83,-0.27 -0.38,0.25 -0.24,-0.68 -0.2,1.27 -0.53,0.3 -0.27,0.94 -0.73,0.97 -0.24,-0.07 -0.06,0.66 -0.97,0.06 0.11,0.68 0.59,-0.05 -1.51,1.03 -0.42,1.34 0.13,0.77 -0.69,-0.59 -0.1,-0.56 -0.53,0.38 -0.48,-0.08 -0.31,0.47 -0.83,-0.4 0.2,-0.65 -0.81,-0.02 -0.51,0.44 1.45,1.2 -0.11,0.61 -0.43,0.03 -0.25,1.1 -0.5,0.66 -0.81,-2.43 0.41,-0.09 0.04,-0.76 -0.6,-0.69 -0.57,0.14 -0.39,-0.42 1.06,-0.86 0.94,-0.33 0.62,0.14 0.36,-0.41 1.41,0.15 -0.05,-0.59 0.69,0.02 0.2,-0.42 -0.27,-0.61 0.75,-1.13 -0.08,-0.7 0.84,-1.88 -0.05,-0.68 -0.84,-0.87 0.32,-0.41 -0.18,-2.22 0.64,-2.54 -1.37,-6.12 -1.06,-1.64 0.93,-0.36 0.12,-0.41 1.27,0.06 0.48,-0.58 1.05,0.14 -0.1,-0.26 1.5,-1.22 -0.29,-0.42 0.23,-0.62 0.7,0.05 0.36,-0.98 0.46,-0.28 0.29,0.57 0.9,0.45 0.9,2.82 -0.52,2.18 1.47,1.26 1.75,0.6 0.98,-1.36 1.11,-3.69 0.87,0.36 1.17,-1.08 -0.36,-1.11 0.51,-2.33 0.79,-0.57 0.37,0.29 1.14,-1.65 0.01,-0.3 -0.37,-0.1 0.53,-0.91 -0.24,-0.08 0.1,-0.71 0.46,-0.35 0.28,0.27 0.17,-0.73 0.44,-0.07 0.49,-1.21 -0.34,-0.88 0.89,-0.8 0.26,0.24 0.43,-0.66 0.08,-0.59 -0.37,-0.19 0.53,-0.54 -0.66,-0.81 0.45,-1.15 0.84,-0.81 z" title="Приморский край" id="RU-PRI" />
                                <path d="m 58.240108,558.72082 -0.16,0.34 0,0 0.37,0.55 1,-0.99 1.06,0.15 0.94,0.45 0.95,1.62 0.67,-0.07 3.48,0.96 0.81,-0.08 1.86,1.84 0.16,1.2 1.91,0.6 0.41,1.01 0.63,0.38 0.83,0.09 0.78,-0.43 0,0 0,2.1 -1.85,1.36 0.39,0.64 -0.21,0.96 1.27,0.39 1,0.91 0.08,0.73 0.75,0 1.3,0.64 1.9,0.03 -0.05,0.85 -0.58,0.79 0.64,0.34 -0.48,1.25 0.79,0.57 0.69,0.02 -1.48,1.67 0.26,0.26 -0.46,1.25 2.62,1.81 -1.03,2.61 0.29,0.73 0.72,0.48 0.88,-0.49 0.34,0.18 0,0 -0.27,0.08 -0.48,1.77 -0.65,0.64 0.56,0.05 -0.46,0.44 0.45,0.63 1.27,0.65 -0.21,1.95 1.5,0.36 0.26,0.66 -0.33,0.4 0.67,0.48 1.23,0 0.39,0.35 -0.55,0.09 -0.04,0.64 0.5,0.44 -0.53,0.51 0.47,1.29 -0.17,0.47 -0.86,0.56 0.21,0.8 -0.23,0.57 0.46,1.54 0,0 -1.62,0.42 -0.69,-0.32 -0.47,0.15 -0.59,0.4 0.22,0.26 -0.73,0.68 0,0 -0.34,-0.17 -0.44,0.53 -0.34,-0.13 -0.18,-0.65 -0.39,0.15 -0.36,-1.06 -0.71,-0.25 -0.31,-0.73 -0.96,-0.17 -0.62,-0.62 -0.7,-0.09 -0.36,0.58 -1.08,-0.75 -0.15,0.28 -0.65,0.02 -0.44,1.18 -0.32,-0.3 -0.81,0.23 -1.14,0.95 -0.78,-0.77 0.22,-1.76 0.56,-0.25 -0.47,-0.29 0.08,-0.33 -1.57,-0.24 -0.29,-0.51 -0.72,-0.07 -1.57,0.9 -0.84,-0.02 -0.17,-0.8 -0.33,-0.23 0.13,-0.56 -1.87,-0.13 -0.19,0.53 -0.56,-0.05 -0.36,-0.25 0.15,-0.29 -0.85,-0.57 0.54,-1.8 -0.56,-1.13 0.16,-0.85 -0.63,-1.14 0.3,-0.55 -0.73,-0.26 -0.35,-1.52 -0.6,-0.48 0.53,-0.94 -0.52,-0.12 -0.4,-0.64 -1.3,0.5 0.05,-1 0.39,-0.25 0.08,-0.7 0.09,-1.3 -0.22,-0.15 0.75,-0.86 0.22,-1.83 -1.52,-1.44 -0.97,-0.47 0.36,-0.5 -0.1,-0.73 -1.16,0.09 -0.49,-0.65 0.63,-0.44 -0.2,-0.75 0.24,-0.42 0.59,-0.3 0.24,0.18 0.14,-0.32 -0.37,-0.75 0.3,-0.07 0.1,-0.53 1.14,-0.2 0.53,0.24 0.31,-0.38 -0.21,-0.76 -0.71,-0.21 -0.05,-1.1 -0.35,-0.19 0.26,-0.71 -0.78,-0.67 -0.64,-1.79 0.56,-1.68 -0.74,-5.59 0.35,-0.95 z" title="Псковская область" id="RU-PSK" />
                                <path d="m 163.04011,625.95082 1.21,1.1 -0.13,-0.87 0.47,-0.46 0.4,0.76 0.99,-0.59 1.36,0.14 0.79,-0.35 0.46,0.29 0.6,-0.1 0.3,-0.63 -0.45,-0.88 0.56,-0.92 1.41,0.64 0.86,-0.43 0.39,0.1 0.15,0.47 0.8,0.08 1.36,0.75 0.14,1.19 0.62,0.65 1.84,0.55 1.56,-0.24 0.4,0.48 1.1,-0.3 0.21,-0.35 -0.86,-1.09 -0.09,-0.77 1.75,-1.04 1.52,0.15 1.16,-0.25 0.18,0.81 0.35,0.21 1.61,-0.53 1.58,-0.06 0.46,-0.62 0,0 0.32,0.15 1.09,-0.36 0.82,0.55 0.48,0.59 0.2,1.19 1.75,2.16 -0.05,1.54 0.37,0.31 1.29,-0.19 0.09,0.47 1.32,0.95 0.25,0.68 -0.34,0.95 0.42,0.86 -0.37,2.81 0.51,1.31 -0.13,0.54 -1,0.82 -0.18,0.66 0,0 -0.81,-0.27 -0.3,-0.79 -1.03,0.55 -0.78,-0.11 -0.63,0.94 -0.82,-0.03 -0.5,0.7 -0.87,0.4 0.37,1.02 -0.24,0.37 -2.44,-1.33 -1.06,1.23 -2.31,-0.11 -0.47,0.2 -0.49,0.82 -1.33,-1.5 -1.16,-0.05 -0.71,-0.49 -0.3,0.01 -0.32,1.21 -1.69,1.32 -0.98,-0.74 -1.47,-0.21 -1.08,-0.82 -1.83,0.51 -0.66,0.54 -1.32,-1.14 -0.48,0.03 -0.73,0.62 0,0 0.03,-1.18 1.17,-1.34 -0.04,-0.75 -2.12,-2.69 -2.8,-2.49 0.06,-0.83 -1.13,-1.56 -0.81,-0.04 -0.3,-0.29 0.16,-1.15 -1.34,-0.85 0.2,-3.08 -0.26,-0.23 0,0 z" title="Пензенская область" id="RU-PNZ" />
                                <path d="m 156.50011,668.00082 0.56,0.3 0.19,0.92 1.1,0.56 -0.21,1 1.18,0.51 0.58,-0.12 2.07,1.82 0.13,0.87 -0.98,2.83 0.35,1.17 -0.31,0.52 0.06,0.96 2,-0.01 0.58,0.69 -0.2,0.67 1.09,0.03 0.6,0.33 1,1.6 -0.88,1.7 0.15,0.83 -0.29,0.37 -2.72,0.82 -1.43,1.01 0.42,1.46 -0.79,0.37 0.36,0.79 -0.48,0.67 0.03,0.72 3.23,0.48 1.89,1.46 0.22,1.08 1.77,2.95 0.53,-0.1 0.24,-0.47 0.83,0.08 -0.08,0.88 0.66,0.48 2.99,-0.72 0,0 0.67,1.69 0.59,0.29 0.36,0.01 0.28,-1.15 1.24,-0.5 0.25,-1.08 0.59,0.11 -0.19,0.41 0.81,0.49 -0.09,2.86 -0.49,1.5 -0.06,1.4 -0.81,0.75 -0.44,-0.03 -1.9,2.59 0.83,0.3 -0.31,0.83 0.53,1.27 -0.16,0.27 -0.77,0.4 -0.03,-0.75 -0.51,-0.42 -1.01,2.47 -1.58,0.03 -3.12,-2.5 -1.93,0.53 -1.16,-0.53 -0.78,-0.8 -2.53,-1.07 -0.17,0.17 0.33,0.83 0.84,1.23 -0.35,0.33 -0.87,-0.22 -0.69,0.37 0.09,0.95 -0.73,0.54 -0.71,-0.44 -0.6,0.22 -0.26,0.37 0.55,1.08 -0.13,0.41 0,0 -1.83,-0.08 -0.47,0.68 -1.57,-0.33 0,0 -0.68,-1.31 -0.78,-0.52 -0.2,-1.34 -1.34,0.51 -0.75,-0.57 -2.7,0 -0.66,-0.81 0.25,-0.54 -0.43,-0.98 -1.5,-0.67 0.49,-1.73 -0.71,-0.54 -3.36,-0.35 -0.54,-0.41 -1.39,0.79 -0.08,0.67 -0.72,0.68 -1.5,-0.12 -0.5,0.59 0,-0.69 0.64,-1.46 -1.52,0.03 -0.11,-0.42 0,0 1.26,-0.35 0.43,-0.62 1.5,-0.8 1.35,0.23 0.11,-0.41 -0.37,-0.25 -0.31,-1.13 0.21,-0.76 -0.4,-0.25 -1.66,0.17 -0.02,0.73 -2.76,0.61 -0.03,0.29 -0.43,-0.35 0.39,-0.96 1.04,-0.33 0.56,0.13 -0.03,-0.45 -1.54,0.2 -1.2,0.87 -1.1,0.26 0.03,-0.56 0.63,-0.26 -0.06,-0.5 -0.73,-0.13 0.56,-0.73 -0.06,-1.6 0.56,-0.82 1.74,-0.29 0.38,-0.6 0.7,0.12 0.2,-1.29 0.62,-0.75 1.71,0.4 1.8,-0.41 0.33,0.36 0.33,-0.19 0.48,0.35 1.67,0.04 0.61,-1.79 -0.36,-0.47 0.65,-0.1 0.42,-1.95 0.35,0.05 0.15,-0.3 -0.23,-0.69 -0.42,0.18 -0.55,-0.26 0.69,-0.51 -0.68,-1.1 -0.01,-1.06 -1.16,-0.22 -0.22,-0.36 1,-2.45 1.39,0.53 0.76,-0.9 -0.27,-0.33 -0.44,0.4 -0.59,-0.38 -0.54,0.01 -0.09,0.25 -0.58,-1.13 -0.6,-0.11 0.04,-0.5 1.9,-0.17 0.63,-1.22 1.26,-0.75 -0.28,-2.12 0.41,-0.78 -0.07,-0.61 0,0 0.54,-0.68 2.2,0.48 0.89,-0.55 1.92,-0.54 1.06,-2.46 1.96,-1.81 0.31,-1.37 z" title="Ростовская область" id="RU-ROS" />
                                <path d="m 147.93011,607.33082 0.92,-0.16 0.15,0.3 -0.49,0.16 0.21,0.4 0.58,-0.02 0.47,-0.63 0.42,0.13 -0.12,0.74 0.42,0.79 1.08,-0.04 0.21,-0.37 0.66,0.3 0.18,-0.76 0.68,0.08 0.61,1.49 0.33,0.06 -0.01,-0.61 0.57,-0.56 0.44,0.06 1.33,1.21 1.22,-0.44 0.4,0.52 0.25,-0.27 0.65,0.1 0,0 -0.1,0.48 0.57,0.65 1.09,-0.64 -0.16,1.29 1.62,0.39 0.98,-0.65 0.29,0.24 0.37,-0.31 0.46,0.37 -0.45,0.37 0.04,1.35 0,0 0.06,0.29 -0.46,-0.07 -0.4,0.41 0.4,0.76 0.75,0.69 0.22,-0.26 0.15,0.43 0.63,-0.15 0.09,1.02 0.53,0.35 -0.6,0.39 0,0.73 -0.45,-0.26 -0.26,0.86 0.48,0.17 0.31,0.61 -0.98,0.18 -0.12,0.61 -1.5,0.94 -0.71,-0.29 0.71,1.09 0.79,-0.36 -0.18,-0.32 0.71,-0.34 0.39,0.59 1.13,-0.07 0.29,0.68 -0.95,-0.04 -0.48,0.28 0.29,0.45 -0.15,0.25 -0.66,-0.45 -0.55,0.4 -0.39,-0.72 -0.36,0.58 1.73,1.6 -0.89,0.81 -0.34,0.77 0,0 -1.71,0.27 0,0 -1.32,-0.07 -0.84,0.32 -0.17,-0.29 -1.19,0.35 -0.15,-0.44 -0.25,0.62 -0.99,0.03 -0.35,2.63 -0.48,0.11 0.17,0.49 -0.38,0.21 -0.36,-0.19 -0.21,0.88 -0.46,-0.06 -0.31,-0.7 -1.06,-0.46 -0.43,0.49 -0.24,-0.1 -0.4,-0.88 -0.57,-0.03 -0.19,0.65 -0.55,0.11 0.04,0.62 -0.56,-0.71 -0.48,0.32 0.24,0.8 -0.95,0.54 -0.39,-0.43 -0.25,0.92 -0.72,-0.13 0,0 -0.58,-0.69 -0.81,-0.17 -0.58,-0.65 0.29,-0.07 0,-0.87 -0.83,-0.5 -0.39,0.28 -0.17,-0.4 -1.29,0.79 -0.2,1.11 -1.13,0.24 -0.51,-0.23 -0.92,0.38 -0.88,-1.9 -0.34,-0.28 -0.5,0.22 -0.35,-0.2 0,0 0.21,-1.73 0.46,-0.55 -0.84,0.03 -0.19,-0.39 0.24,-0.43 -0.6,-0.07 0.35,-0.26 -0.13,-0.64 0.64,-0.46 -0.69,0.13 -0.28,-0.23 0.05,-0.54 -0.4,-0.18 0.21,-0.26 -0.58,-0.24 0.01,-0.66 0.58,0.01 0.25,-0.6 -0.75,-0.3 -0.18,-0.73 0,0 0.35,-0.18 0.06,-1.01 0.51,0.15 0.22,-0.56 0.6,0.43 0.14,-0.49 0.37,-0.11 -0.05,-0.45 -1.26,-0.52 0.4,-0.72 -0.37,-0.14 0.2,-0.81 0.72,-0.26 0.41,0.32 0.22,-0.35 0.72,0.02 0.3,-0.33 0.52,0.2 0.02,-0.82 0.96,-0.51 -0.35,-0.09 0.58,-0.82 -0.08,-0.47 0.54,-0.51 -0.08,-0.39 0.59,-0.63 0.46,-0.02 0.14,-0.58 0.47,0.27 0.63,-0.24 0.25,0.19 0.39,-1.31 -0.34,-0.3 -0.61,0.22 0.49,-0.89 1.41,-0.18 1.15,-0.74 0.23,-0.78 0.33,-0.05 z" title="Рязанская область" id="RU-RYA" />
                                <path d="m 218.44011,617.03082 1.06,0.38 0.61,0.89 0.57,-0.56 0.34,0.18 0.52,0.85 -0.16,0.56 0.37,0.15 1.58,-1.44 1.39,1.26 0.43,-1.14 -0.07,-1.17 1.19,-1.09 -0.03,-0.51 0.93,0.39 0.68,-0.59 -0.12,1.11 0.31,0.15 0.81,-0.99 0.47,0.77 1.76,1.03 0.84,0.17 -0.04,0.78 0.74,0.54 0.13,0.64 1.7,-1.36 0.63,0.34 0.52,-0.43 0.3,0.09 0.32,0.81 0,0 -1.13,0.66 -0.21,1.7 -0.35,0.13 0.07,0.56 0.84,0.88 -0.03,0.65 -0.43,1.62 -0.97,1.51 -0.28,1.72 -0.81,1.2 0.46,1.09 1,0.33 -1.04,0.44 0.11,0.53 -0.62,1.49 0.47,0.62 -0.35,1.2 -1.1,0.62 -1.5,1.42 0.12,0.81 -0.52,1.36 -0.5,-0.19 -0.51,0.52 -0.45,1.31 0.64,0.68 0,0.45 -1.32,1.52 0.46,2.16 -0.33,0.58 -1.59,1.61 -2.29,1.7 0,0 -1.49,-2.2 -2.01,-0.68 -0.51,0.18 -0.8,-0.88 0.19,-0.3 -0.97,-0.2 -0.48,-0.47 -1.1,-0.03 -1.28,-0.9 -0.1,-1.18 -0.43,-0.47 -0.36,0.04 -0.14,0.6 -0.51,-0.11 -0.63,-0.63 0.14,-0.54 -0.74,-0.42 -2.41,0.21 -1.38,-1.1 -0.57,-0.87 -0.49,0.05 -0.41,-0.5 -0.68,-0.17 -1.02,0.79 -0.2,-0.52 0.72,-1.16 -0.11,-0.37 0,0 0.55,-0.23 0.67,-1.36 -0.61,-0.71 -1,-0.12 0.13,-0.43 -0.36,-0.19 -0.68,0.35 -0.18,-0.31 0.27,-1.03 -0.44,-0.53 0.11,-0.95 -0.55,-0.26 -0.77,-1.18 0.47,-0.52 0.01,-0.49 1,-0.47 1.34,0.46 0.26,-0.74 -0.16,-0.8 -0.48,-0.39 0.07,-0.37 0.44,-0.3 1.35,0.35 0.28,-0.21 -0.11,-0.32 -1.07,-0.49 0.38,-0.42 2.37,0.88 1.32,-1.81 1.4,0.17 -0.36,-0.55 0.65,0.23 1.25,-0.26 1.06,0.75 1.53,-0.86 1.21,0.49 0.33,-0.36 -0.61,-0.75 1.76,-1.48 0.1,-1.34 0.55,-0.85 -0.39,-0.84 0.08,-0.97 z" title="Самарская область" id="RU-SAM" />
                                <path d="m 830.95011,274.28082 -0.27,-0.86 1.25,0.43 3.25,3.87 0.52,1.32 1.06,1.07 0.18,1.67 -0.85,1 -0.79,-0.78 0.03,-0.72 -0.86,-1.31 -1.47,-1.23 -0.36,-1.62 -0.76,-0.81 -0.13,-1.04 -0.33,0.2 0.25,0.69 -0.76,-0.3 0.04,-1.58 z m 13.86,66.19 -0.01,0.26 -0.48,-0.63 -0.29,0.09 -0.12,0.68 -0.94,-0.37 -1.23,-1.05 0.16,-0.74 0.53,-0.14 0.78,0.99 -0.35,-0.53 1.61,-0.81 1.58,0.1 0.12,0.39 0.26,-0.3 0.36,0.29 0.39,-0.27 1.22,0.03 0.71,1.06 -0.04,0.71 -1.13,1.83 -0.75,0.29 -0.87,-0.74 -0.17,-0.74 -1.17,-0.15 -0.17,-0.25 z m 18.77,-46.37 2.31,-0.14 2.16,-2.35 1.04,-2.39 0.39,-1.83 0.39,-0.3 -0.34,0.04 0.15,-0.81 0.48,-0.49 0.6,-1.73 0.81,-0.94 0.87,0.57 0.71,-0.06 1.39,-0.93 3.66,-0.92 1.48,1.42 2.08,0.77 4.91,5.26 1.37,2.04 0.97,2.31 -0.07,0.6 -0.53,0.58 -0.12,1.5 0.49,2.73 0.34,0.43 -2.57,1.05 -3.46,-1.3 -2,0.14 -1.28,-0.73 -4.88,-0.98 -1.83,-0.8 -3.49,-2.33 -1.18,-0.26 -2.12,0.35 -3.18,1.85 -0.66,-0.13 -0.67,-1.45 0.4,-0.75 1.38,-0.02 z m 7.62,-18.45 -0.37,0.88 0.31,1.31 -0.24,1.35 -0.54,0.83 -0.89,0.24 -0.93,0.58 -0.69,0.92 -0.39,-0.03 0.12,0.36 0.69,-0.13 -0.13,0.2 -1.16,-0.09 -0.82,-0.71 -1.19,-2.44 -0.33,-1.48 0.2,-3.1 0.41,-0.82 0.93,-0.6 3.39,-0.39 1.3,0.76 0.41,1.07 -0.08,1.29 z m -40.17,-35.18 0.35,-0.28 0.53,-2.1 0.18,-2.32 -0.24,-2.43 0.72,-3.06 0.04,-0.84 -0.39,-0.45 0.36,-1.03 1.6,5.32 1.03,1.28 1.03,0.67 -0.92,1.35 -0.82,2.18 -0.12,0.62 0.65,1.07 -1.34,1.91 -2.17,0.25 -0.27,-0.24 -0.22,-1.9 z m 165.38,203.41 -0.84,1.66 1.13,2.21 -0.42,0.47 -0.88,-0.21 -0.57,0.22 -0.51,-0.96 -0.99,-0.26 -1.63,0.74 -1.4,0.19 -0.83,1.36 -0.86,0.56 -0.02,0.99 -0.32,0.43 -2.19,-0.12 -1.33,-1.06 0.56,-0.49 -0.08,-0.74 -1.8,-1.17 -0.24,-1.42 -0.32,-0.13 -1,1.15 -0.16,1 -0.74,0.49 -0.72,-0.37 -1.67,0.08 -0.95,-0.77 -0.37,-1.21 -1.23,0.8 -1.54,-0.48 -1.6,0.25 -0.44,-0.85 -0.81,0.17 -0.49,0.92 -0.96,0.26 -0.32,-0.92 -0.75,-0.05 -0.45,-0.52 -0.65,-0.19 -1.11,0.69 -0.03,0.83 -1.25,0.79 0.2,0.79 0.93,0.84 -0.07,1.3 -1.3,1.97 -0.92,0.04 0.15,-0.98 -0.39,-0.47 -0.94,0.24 -1.31,-0.13 -0.52,0.57 -1.08,0.34 -0.21,1.52 0.51,0.19 -0.3,1.4 0.26,0.6 -1.09,1.36 -0.2,0.95 0.82,0.74 -0.14,0.83 -0.6,0.83 -0.83,0 -0.45,0.47 -0.01,0.64 -0.59,0.21 -1.19,-0.39 -0.92,0.75 -1.05,0.28 0.01,0.56 -0.6,0.78 -0.08,1.85 -0.92,0.51 0.93,3.71 1.11,0.58 0.13,0.48 -0.33,0.78 -1.43,0.83 -0.7,1.33 -0.97,0.18 -0.21,0.43 0.81,1.26 -0.33,0.81 -1.76,0.44 -0.49,-0.29 0.42,-1.04 -1.36,-0.6 -1.58,0.72 -0.69,0.01 -0.78,1.73 -0.54,0.19 -0.79,-1.03 -0.75,0.6 -0.33,-0.42 -0.74,0.61 -1.17,0.14 -1.56,-0.38 -0.41,0.67 0.09,2.27 -0.78,-0.03 -1.09,-0.68 -1.04,0.14 -0.26,-0.83 -1.11,-0.93 0.12,-0.92 -0.29,-0.62 0.71,-0.62 0.05,-0.61 -1.15,-0.64 0.01,-0.65 -1.01,-0.16 -0.35,0.73 -2.49,1.85 -0.83,-0.37 0.16,0.73 -0.97,-0.1 -0.79,-0.85 -1.02,-0.3 -0.32,0.76 -0.84,-0.72 -0.82,0.57 -1.06,-0.55 -0.13,-0.92 -0.82,-0.42 -1.47,1.66 -0.82,0.42 0.26,1.32 1.54,1.97 -1.65,2.55 -0.3,0.84 0.09,0.99 -0.71,0.24 -1.25,-0.22 0.26,-0.59 -1.21,-0.95 0.5,-1.39 -0.43,-0.44 -1.26,0.82 -0.74,-0.21 -0.21,0.99 -0.8,-0.05 -2.4,-1.85 -2.2,0.34 -1.2,-0.58 -0.42,0.33 -0.71,2.54 -0.87,1.2 -3.47,1.45 -0.2,0.69 0.33,1.95 -0.5,1.69 -1.08,1.46 0.15,0.83 -0.61,1.37 0.09,0.71 -0.93,1.21 -0.29,0.92 0.65,0.89 0.01,0.71 -0.49,0.58 1.4,1.13 0.13,1.92 -0.62,0.97 0.08,0.64 0.62,0.42 -0.46,1.66 0.51,0.62 -0.26,0.4 -0.8,0.24 -0.27,-0.28 -0.8,0.77 0.44,0.73 -0.57,1.15 0.18,1.2 -0.3,0.84 -0.67,0.1 -0.61,1.11 -0.39,-0.18 -0.51,0.71 -0.53,0.17 0.09,0.93 0,0 -0.86,0.86 -0.53,2.21 -1.14,0.4 -0.77,1.04 -1.08,0.04 -0.47,0.34 -0.78,-0.42 -0.13,-0.63 0.44,-0.72 -0.24,-0.71 0.31,-0.94 -0.41,-0.18 -1.1,0.58 -0.58,1.17 -0.86,-1.55 0.26,-0.37 -0.33,-0.77 -0.66,-0.14 -0.86,0.52 0.04,-0.38 -0.68,-0.48 -0.04,-0.8 -0.92,0.39 0.05,1.23 -0.79,0.95 -0.08,0.83 -0.63,0.22 -0.26,-0.75 -1.79,-0.52 -0.92,1.05 -0.77,0.1 -1.11,-0.78 -0.45,-1.88 -0.72,0.02 -0.42,0.59 -1.01,0.35 -0.52,-1.04 -0.87,-0.23 -0.14,-0.5 -0.66,-0.34 -0.47,-0.7 0.03,-1.03 -0.85,-0.53 -0.74,-1.12 -0.17,-0.86 -0.67,0.33 -0.82,-0.06 0.04,-1.01 -0.9,0.05 -0.43,-0.78 -1.01,0.01 -0.71,1.35 -1.45,0.05 -0.66,0.51 -0.69,4.5 0.43,0.65 -0.69,0.76 -0.09,0.54 -1.35,-0.08 -0.66,0.33 0.36,1.14 -1.23,3.64 -0.64,0.3 -1.02,1.79 -1.38,0.3 -0.96,0.7 -0.93,-0.31 -0.46,0.48 0.02,0.85 -0.38,0.45 -1.37,0.01 -0.48,0.37 -0.36,-0.55 -0.43,0.76 0.33,0.87 -0.31,0.56 -1.71,1.5 -0.66,-0.16 -0.22,0.32 0.26,0.74 -1.05,2.4 2.19,2.59 -1.41,3.35 0.45,1.09 -1.07,1.98 -0.01,1.32 -0.27,0.45 0.32,0.85 -0.16,1.37 0.57,0.72 -0.75,1.17 0.18,1.2 0.52,0.28 0.03,0.32 -0.57,0.69 -0.82,0.03 0.15,-0.8 -0.29,-0.66 -0.48,0.41 -2.61,-0.04 -1.17,1.18 0.14,0.92 -0.3,0.47 -1.99,1.83 -1.54,0.26 -1.3,1.22 -0.5,0.04 -1.12,-0.69 -1.58,-0.11 -1.79,-0.56 -0.09,-0.39 -1.44,-0.82 -1,-0.17 -0.8,0.23 -2.25,3.08 0.01,0.9 -0.71,0.76 0,0.36 -0.65,0.35 -1.75,-0.67 -0.43,0.16 -0.88,-1.05 -0.41,-0.03 -0.85,0.71 -0.77,-0.01 -0.76,-0.68 -0.65,0.21 -1.74,-0.91 -2.47,0.54 -0.86,-0.49 -1.93,0.8 -0.95,-0.17 -0.64,0.32 -0.24,1.04 -0.61,0.27 -0.55,-0.15 -0.44,1.15 0.68,0.7 -0.32,0.77 -1.61,0.33 -0.74,2.39 0.38,0.97 -0.68,0.83 -0.25,0.96 -1.81,-0.23 0.46,3.33 -0.53,0.19 -0.37,0.77 0.45,1.86 -1.04,0.06 -0.56,-0.67 -1.2,-0.5 -0.53,-0.83 -1.33,0.32 0.16,1.15 0.7,0.17 -0.18,0.84 0.55,0.67 1.13,0.46 -0.37,0.67 2.23,2.36 -0.26,0.5 -0.41,0.08 -0.14,0.61 -0.57,0.05 -0.8,0.72 -0.1,0.54 -1.12,1.38 -0.03,1.06 -0.45,0.87 -0.39,0.25 -1.08,-0.54 0.01,-0.39 -0.39,0.06 -0.21,0.94 -0.53,0.12 0.26,0.95 0.71,0.08 1.08,1.02 2.6,4 -0.14,0.55 -0.99,0.69 -0.09,1.48 0.55,0.96 -0.27,0.48 -0.58,0.16 -0.68,-0.97 -0.57,0.89 -0.46,0.1 -0.59,-0.65 -0.57,0.2 -0.59,0.89 -0.18,2.26 -1.3,2.3 -0.59,1.96 0.06,0.77 0.6,0.92 0.01,1.12 0,0 -1.88,-0.92 -3,0.24 -0.58,0.54 -0.85,-0.28 -0.7,0.3 -0.48,-0.63 -0.47,-0.08 -0.41,0.31 -1.34,-0.36 -0.46,0.26 -0.75,-0.16 -0.51,0.39 -0.66,-0.15 -0.42,0.42 -0.61,-0.08 -0.86,0.45 0.77,1.25 -1.12,1.01 -0.7,-0.28 -0.69,0.21 -0.86,-0.63 -0.97,-0.03 -0.49,-0.65 -1.63,-1.01 -0.71,-0.18 -0.44,0.36 -0.81,-0.18 -0.75,0.34 -0.69,-0.72 -0.59,0.09 -0.63,1.14 -1.3,0.3 -0.63,-1.28 -1.82,-0.05 -0.84,0.29 -0.5,0.88 -1.42,-0.33 -0.24,-0.39 -1.35,0.92 -1.35,-0.31 -0.82,0.15 -0.63,-0.16 -0.13,-1.33 -0.5,-0.33 -1.55,-0.52 -1.17,0.34 -1.54,-1.4 -1.88,-0.13 -1.03,0.5 -1.84,-0.62 -0.04,-0.38 -1.3,0.07 -0.52,-0.37 -0.33,-1.49 -1.1,-0.72 -1.99,-3.28 -0.93,-0.59 -2.94,0.11 -1.19,-0.34 -1.35,-0.63 -1.4,-1.5 -0.41,0.98 -0.57,0.35 -0.67,-0.04 -3.58,-3.36 -1.35,-0.09 -0.79,0.31 -1.68,-0.33 -0.04,-1.13 -0.44,-0.25 -0.26,-1.15 -0.39,-0.39 -3.92,-0.76 -1.47,0.16 -0.43,-0.21 -2.08,0.38 -2.06,1.39 -2.26,0.2 0,0 -1.04,-0.98 -0.25,-1.84 0.43,-0.57 -1.94,-3.37 0.39,-2.15 -0.96,-0.49 -0.48,0.2 -0.04,0.84 -0.4,0.33 -0.4,-0.73 0.13,-1.08 -0.23,-0.65 -0.76,-0.4 0.51,-3.45 0.39,-0.87 -0.32,-2.38 0,0 0.24,-0.7 -0.63,-1.6 0.39,-0.58 -0.09,-0.71 -2.23,-1.47 0.37,-2.86 -0.5,-1.55 0.45,-0.96 -0.48,-0.31 -0.38,-2.68 0.98,-1.36 -0.63,-1.66 -2.67,-0.93 -0.28,-1 -0.68,-0.8 -1.01,0.26 -0.15,-0.49 -0.35,0.99 -0.48,0.26 -0.23,1.32 -0.77,0.37 -0.38,-0.33 -0.37,-1.34 -1.05,0.83 -0.71,-0.3 -1.39,0.16 -0.88,-0.66 -0.26,-0.68 0.23,-0.73 -0.1,-2.67 -0.65,-0.62 0.47,-0.63 0.66,-0.26 0.56,-1.62 -1.55,0.37 -0.36,-0.38 -0.04,-1.09 -0.35,-0.58 -0.56,-0.62 -1.05,-0.35 -0.09,-0.76 -0.86,-0.18 -0.74,-0.97 -1.41,0.13 -0.29,-0.53 -0.81,-0.01 -0.04,-0.48 -0.76,-0.39 -1.2,-0.01 0.05,-0.55 -0.88,-0.63 -0.55,0.01 -1.94,1.15 -0.77,0 -0.51,-0.44 -1.02,1.48 -0.26,1.53 -0.55,0.97 -0.56,0.32 -1.41,-0.05 -1.26,1.8 0.34,0.79 -0.15,0.72 -0.78,0.15 -1.44,1.17 -0.6,0.83 0.01,0.84 -0.51,0.2 -0.51,-0.25 -0.38,0.32 0.07,0.6 -0.68,0.06 -0.35,0.52 -0.02,0.57 -0.78,0.08 -0.81,0.8 -0.28,1.13 -1.01,0.79 0.38,1.43 -0.15,0.73 -1.44,1.32 -0.8,-0.09 -2.08,0.78 -0.94,1.55 -0.77,-0.55 -0.01,-0.77 -0.5,0.39 0,2.62 -0.49,0.34 -0.51,-0.02 -0.27,-1.42 0.31,-1.2 -0.19,-1.37 0.73,-0.81 0.9,-0.43 0.01,-1.19 -1.46,0.01 -0.97,0.43 0.32,-1.89 -0.6,-1 -1.92,2.68 -2.01,0.5 -0.71,0.75 -1.09,-0.78 -1.36,0.34 -0.34,0.6 -0.6,-0.06 -0.43,-0.57 -0.89,0.27 -1.89,-0.31 -0.46,0.59 -0.5,1.69 -0.6,0.65 -0.71,0.06 -0.87,0.53 -2.7,-0.13 -0.9,0.33 -0.32,-1.28 -0.78,0.35 -0.32,-0.31 0.09,-1.06 -0.87,-1.05 -0.21,-0.87 -1.37,-0.65 0.13,-0.73 0.48,-0.51 -0.42,-0.32 0.19,-0.71 1.24,-1.47 0.27,-0.96 -0.32,-0.87 1.4,-2.11 0.01,-0.97 0.85,-1.3 -0.52,-1.1 0.44,-1.89 0.59,-0.76 0.26,-1.15 0.68,-0.46 -0.1,-1.04 0.77,-0.66 0.1,-0.63 0.67,-0.3 0.04,-0.43 -0.56,-0.42 0.09,-0.41 1.34,-0.23 0.43,-1.01 -0.37,-0.69 1.68,-2.33 0.31,-2.16 -0.79,-0.58 -1.22,0.18 -0.85,-0.61 -0.47,-1.17 -0.47,-0.35 -0.65,0.29 -0.47,-0.16 -0.33,-0.67 0.3,-3.32 -1.64,-2.58 -0.37,-1.67 0.54,-1.62 0.63,-0.79 1.39,-0.7 -0.09,-0.84 0.6,-1.2 -0.41,-1.3 0.31,-0.51 -0.71,-1.89 -2.13,0.04 -0.84,0.57 -1.08,-1.57 0,-1.3 0.54,-0.48 0.03,-0.6 0.53,-0.38 0.26,-1.19 1.23,-1.16 0.07,-0.49 -1.05,-1.2 -0.31,-0.8 -0.51,-6.37 -0.91,0.28 -1.47,-2.94 -1.47,0.21 -1.86,-0.94 -1.14,0.04 -1.71,0.57 -0.29,-0.69 1.16,-2.12 0,-1.08 2.9,-0.2 0.63,-0.63 -0.03,-0.58 -0.4,-0.28 0.33,-1.45 -0.48,-0.69 -1.19,-0.2 -0.3,-0.64 -0.33,-1.44 0.38,-0.96 -0.52,-0.43 -0.06,-1.13 -0.38,-0.11 -0.84,0.85 -1.01,-0.43 -0.79,0.45 0,0 -0.09,0.61 -0.89,0 -2.24,-1.51 -0.74,-0.11 -0.53,0.45 -1,0 -0.23,-1.49 -1.89,-0.17 -0.41,-0.89 -1.27,0.1 -0.68,-1.95 -0.61,0.35 0.12,0.65 -0.33,0.36 -1.88,0.23 -1.03,0.47 -0.45,-0.57 0.31,-0.55 -0.11,-0.77 -0.96,-0.27 -0.92,0.95 -0.99,-1.51 0.31,-0.4 -0.31,-1.34 1.02,0.04 0.25,-0.41 -0.28,-0.81 0.76,-1.36 -0.25,-0.67 0.24,-0.81 0.38,-0.08 0.44,0.69 0.78,-0.27 -0.71,-0.59 -0.01,-0.74 -0.55,-0.47 -0.07,-0.84 0.29,-0.5 0.87,-0.08 0.25,-0.76 0.8,-0.27 0.75,-1.23 0.79,0 -0.58,-1 0.61,-1.4 0.77,-0.56 0.82,-0.12 0.6,0.27 0.25,-1.53 1.23,-0.91 -0.27,-0.38 -1.1,0.02 -1.14,-1.72 -1.42,-0.82 0.05,-6.4 -0.38,-1.04 -1.89,-1.2 0.1,-4.37 0.92,-1.68 -0.41,-2.29 0.29,-1.32 -0.58,-0.72 -0.14,-0.92 -0.74,0.2 -0.31,-0.33 0.55,-0.92 0.02,-0.95 -1.4,0.25 -0.15,-0.92 -0.81,-0.17 -0.77,0.42 -1.33,-1.32 0.17,-0.58 2.72,0.02 0.61,-0.37 0.49,-2.41 1.52,-0.22 1.29,-1.28 1.3,0.45 0.7,-0.72 0.33,-1.57 0.11,-4.91 0.86,-10.31 0.19,-9.14 -0.4,-4.52 -2.6,-5.48 -2.76,-4.87 0.26,-1.35 0.68,-0.39 0.57,-1.2 1.03,-0.83 1.26,0.8 2.57,-0.25 3.29,-2.28 2,-0.69 1.31,0.12 0.42,-0.31 0.62,-1.57 1.6,-1.35 3.69,-0.24 0.59,0.15 -0.06,1.04 0.35,0.52 1.41,0.24 1.31,-0.46 0.85,-2.23 0.19,-1.96 0.54,-0.6 0.05,-0.55 -0.97,-0.52 0.2,-1.69 -0.51,-0.59 0.12,-1.21 1.37,-0.55 0.38,-1.2 -0.28,-1 0.32,-0.54 4.83,-0.78 -0.34,-0.92 -1.3,-1 0.05,-1.28 0.51,-0.4 -0.27,-0.79 0.38,-0.76 0.88,-0.73 1.13,-0.21 0.87,-1.07 2.65,-0.85 2.11,-1.58 1.47,-0.18 0.71,-1.32 3.01,-0.87 1.25,-1.76 0.46,0.02 0.57,0.94 0.4,-0.21 0.37,-1.08 1.04,-0.12 0.35,-0.94 -0.27,-0.71 0.21,-1.2 1.03,-0.24 0.01,-1.1 -0.63,-0.45 -1.12,-0.15 -1.26,-1.71 -1.5,-0.73 -0.24,-0.75 0.2,-2.19 -0.67,-6.01 0.22,-3.11 -0.31,-4.5 -1.37,-0.48 -0.47,-0.94 -0.79,-0.23 0.3,-2.31 -0.78,-1 -1.08,0.04 -0.58,-0.85 -1.45,0.07 -0.6,-1.03 0.36,-0.94 0.72,-0.77 0.02,-1.41 -0.74,-0.89 -1.42,-0.34 0.18,-1.21 -0.5,-0.35 -0.65,0.1 -0.44,-3.79 0.31,-1.98 0.85,-2.34 -1.21,-0.24 0.52,-0.98 0.94,-0.2 0.08,-1.03 -0.62,-1.07 0.46,-0.9 -0.29,-0.61 -1.31,-0.37 -1.54,0.6 -0.75,-1.19 1.48,-1.6 -0.15,-1.38 -2.97,-1.49 0.44,-0.78 3.49,-0.05 1.54,-4.51 0.72,-0.05 0.81,0.54 0.4,-0.32 -0.66,-1.86 -1.25,-0.28 0.26,-2.22 0.57,-0.85 1.88,-1.42 0,0 1.82,2.32 2.46,1.41 3.3,0.68 3.3,-0.39 0.78,-0.55 0.63,-1.53 -1.35,-4.38 0.2,-0.67 1,1.99 1.41,1.38 0.56,2.09 1.19,2.64 0.31,2.18 -1.08,1.21 -0.74,2.5 0.65,0.81 0.27,0.94 1.48,0.89 0.13,1.75 -0.39,0.8 0.59,0.13 0.33,-0.29 1.03,-2 1.18,0.25 0.71,-0.39 0.42,-0.67 -0.52,-0.21 -0.89,0.61 -0.33,-0.2 -1.93,-2.12 -0.36,-0.69 0.08,-0.88 -0.32,-0.36 3.21,-1.05 1.15,-0.98 0.99,-0.29 1.97,0.47 2.63,-0.48 1.35,-1.16 0.5,0.07 -0.46,-0.42 1.17,-0.77 0.64,-0.3 0.81,0.5 -0.3,-0.41 0.23,-0.19 0.9,-0.09 0.6,0.41 0.07,-0.2 2.39,0.27 2.07,0.94 1.68,-0.4 0.85,0.2 5.3,2.23 3.38,0.23 1.25,-0.42 5.04,0.69 0.63,0.46 -0.01,0.99 0.48,0.07 0.69,0.96 -0.72,0.6 -0.69,0.1 -0.69,-1.01 -0.13,0.24 -0.67,-0.28 -0.11,0.5 -0.98,0.98 -0.01,1.06 0.49,0.22 0.02,0.31 -0.77,1.37 0.29,0.5 -0.04,1.13 0.85,1.2 3.08,1.3 1.4,0.99 2.28,0.72 1.61,1.37 1.35,-0.5 0.57,0.1 1.41,0.58 3.54,0.33 3.08,1.24 2.55,-0.89 1.6,-0.16 1.63,0.83 0.05,-0.44 0.76,0 0.16,0.44 1.83,-1.04 0.61,0.97 0.34,-0.36 1.02,0.85 1,0.09 -0.27,-1.11 0.39,0.36 0.69,-0.03 -1.71,-1.54 0.08,-0.32 0.48,-0.07 1.35,1.6 2.13,0.76 0.22,0.79 0.55,0 0.55,-0.42 0.41,-1.2 0.49,-0.1 -0.28,-1.86 0.74,-1.71 -0.1,1.06 0.36,-0.08 0.12,-0.88 0.66,0.56 0.15,-0.34 0.46,-0.03 -0.67,-0.33 -0.58,-0.93 -0.68,-0.01 1.24,-1 0.51,0.39 0.26,-0.64 -0.79,-0.04 -0.12,-0.39 -0.25,0.57 -0.13,-0.88 -0.48,-0.14 0.39,-0.21 0.13,-0.71 -0.37,0.41 -0.06,-0.41 -0.67,-0.17 0.63,-0.42 -0.73,-0.43 -0.2,-0.78 0.15,-0.3 0.97,-0.23 0,-0.31 -0.59,0.23 -0.28,-0.16 0.13,-0.32 -0.39,0.24 -0.72,-0.41 0.29,-0.25 0.14,0.37 0.32,-0.07 -0.38,-0.9 0.32,-0.54 0.25,0.35 -0.16,0.43 0.77,0.84 0.23,-0.09 -0.45,-0.68 0.16,-1.1 -0.24,0.34 -0.49,-0.68 -0.28,0.06 0.38,-0.75 -0.39,-1.04 0.63,0.28 0.27,-0.24 -0.36,-0.13 -0.24,-0.82 0.71,0.84 0.3,-0.29 -0.65,-1 0.36,-0.14 -0.28,-1.16 0.32,0.25 0.25,-0.24 -0.23,0.8 0.31,0.38 0.24,-1.25 0.22,-0.1 0.06,0.71 0.06,-0.59 0.34,-0.09 -0.34,1.13 0.1,0.19 0.25,-0.72 0.34,0.19 -0.19,0.58 0.43,0.35 0.13,0.63 0.62,-1.48 0.37,0.79 0.31,-0.2 -0.27,-0.41 0.3,-0.21 0.46,0.65 0.4,-0.75 -0.05,-0.92 0.75,-0.31 0,-0.53 -0.16,0.14 0.32,-0.61 0.4,-0.16 -0.36,0.38 0.18,0.32 0.37,-0.51 -0.61,-1.17 0.38,-0.1 0.26,0.74 0.24,-0.3 0.16,0.26 0.45,-1.6 0.42,0.05 -0.25,0.92 0.54,-0.18 -0.04,0.8 0.22,-0.58 0.08,0.63 0.84,-0.3 0.19,0.75 0.65,-0.65 -0.33,1.04 0.31,0.36 -0.03,1.03 0.33,-1.03 -0.2,-0.19 0.85,-0.83 0.32,0.27 -0.42,0.38 -0.04,0.55 0.58,-0.4 -0.18,0.73 0.3,0.49 0.56,-1.34 -0.04,2.61 0.15,-0.69 0.49,-0.4 -0.28,-0.64 0.48,-0.38 0.31,0.81 -0.25,-0.21 -0.14,0.69 0.67,-0.15 -0.57,2.21 0.81,-1.67 -0.5,2.63 0.3,-0.11 0.22,-0.91 0.13,0.63 0.13,-0.37 0.5,0.32 0.1,-1.52 0.22,0.54 -0.3,0.43 0.59,0.55 0.07,-1.42 -0.06,0.46 0.35,0.42 -0.16,0.47 0.62,-0.13 0.09,0.47 0.35,-0.48 -0.14,0.51 0.25,0.16 0.25,-0.47 -0.21,0.81 0.18,0.66 0.37,0.17 0.02,0.92 0.23,-0.24 -0.11,-0.69 0.23,-0.03 -0.05,1 0.18,-0.22 0.14,0.53 0.05,-0.7 0.26,-0.05 0.27,0.54 0.14,-0.76 -0.59,-0.18 -0.17,0.23 0.06,-0.5 0.99,0.25 0.17,-0.32 -0.58,-0.26 0.29,-1.1 0.46,0.55 -0.36,0.32 0.38,0.28 0.61,-0.53 0.03,0.77 0.3,-1.03 0.21,0.03 -0.17,0.54 0.85,-1.39 0.09,0.45 0.37,-0.56 0.37,1.23 0.27,-0.35 0.26,0.09 -0.39,0.74 0.35,0.13 -0.46,1.92 0.43,1.3 0.97,-0.69 1.22,0.04 -0.04,-1.04 0.68,-0.88 0.02,1.18 0.4,0.76 0.43,0 -0.35,-1.13 0.16,-0.18 0.54,0.27 -0.23,-0.32 0.38,-1.72 -0.17,-0.32 0.33,-0.39 1.55,-0.01 0.68,0.32 0.63,0.93 -0.27,0.7 0.24,0.38 0.27,-1.03 0.47,0.49 0.91,-0.35 1.72,0.13 0.03,0.33 -0.93,0.89 0.19,0.32 0.78,-0.43 0.21,0.39 1.2,-0.19 -0.74,1.39 1.04,-1.13 -1.11,1.45 0.33,0.3 0.98,-0.54 0.83,0.04 0.56,-0.32 0.83,0.69 -0.4,0.27 0.43,0.13 -0.01,0.65 -1.04,0.64 0.27,0.26 -0.51,0.21 0.54,-0.1 0.38,0.5 2.29,-0.29 0.84,0.68 -0.28,0.01 0.33,0.27 -0.84,0.93 0.6,-0.42 0.3,0.25 -1.07,1.46 0.56,-0.3 -0.03,0.4 0.47,-0.53 0.42,0.64 0.03,0.78 0.88,-0.96 0.66,0.17 0.4,0.61 0.22,-0.16 0.43,0.45 -0.17,0.17 0.38,0.78 -0.19,0.44 0.32,-0.26 0.35,0.74 0.46,-0.39 -0.12,0.34 0.37,-0.11 0.02,0.7 0.54,0.39 -0.46,0.43 0.43,0.17 -1.67,0.08 -1.02,-0.28 -0.28,-0.77 -0.27,-0.12 -0.07,0.25 0.16,0.85 1.6,1.17 0.21,0.72 0.38,0.18 -0.7,0.28 -0.22,0.56 0.33,0.81 0.91,0 -0.26,0.34 -0.9,-0.07 -0.01,0.72 -1.22,0.16 0.67,0.64 0.54,-0.18 -0.01,0.26 -0.5,-0.04 0.32,0.33 1.04,0.05 0.5,0.59 -0.11,0.93 -0.5,0.68 -1.47,-0.62 0.57,0.56 -1.25,-0.52 -0.15,0.21 0.31,0.27 -0.28,0.18 0.46,0.4 -2.23,-0.04 0.1,0.62 -0.46,-0.02 0.4,0.79 -0.42,0.05 0.04,0.52 0.41,-0.05 0.69,0.66 -0.21,0.52 1.46,-0.43 2.14,0.84 -0.2,0.05 0.37,0.33 -0.13,0.32 -0.53,0.3 0.91,0.34 -0.39,0.38 0.6,0.18 -0.21,0.33 0.25,0.19 -0.3,0.04 0.34,0.14 0.02,0.46 -1.05,0.15 0.35,0.36 -0.52,0.47 0.61,-0.19 0.17,0.86 -0.24,-0.45 -0.26,0.34 0.16,0.25 1.1,0.41 -0.81,0.2 -0.7,1.07 0.1,0.52 1.04,-0.47 0.24,0.42 -0.42,-0.05 0.31,0.32 -0.26,0.39 -0.32,-0.21 0.1,0.3 -0.47,0.5 -0.86,-0.65 0.63,0.66 -1.17,0.67 -0.82,-0.15 -0.29,0.41 -0.62,0.1 -0.64,-0.88 -0.21,0.03 0.13,0.48 -1.47,-0.03 -0.1,0.57 0.25,0.15 -0.31,-0.04 -0.28,0.65 1.65,1.74 -0.86,0.24 -0.51,-0.36 -0.44,-0.59 -0.19,-1.13 -0.35,0.1 -0.21,0.95 0.52,1.54 0.8,0.69 0.42,2.28 0.3,0.39 0.96,0.22 0.41,0.59 0.07,-0.4 1.4,-0.72 0.64,-1.04 -0.64,-1.72 -0.53,-3.05 1.51,3 0.35,1.02 -0.07,0.88 1.76,2.26 -0.86,-0.49 -1.04,-0.11 -2.96,1.04 -0.53,0.88 0.37,0.11 0.2,0.56 -0.15,0.8 0.67,0.13 0.32,-0.41 1.32,-0.13 0.72,1.68 0,1.26 -0.34,-0.16 0.31,0.35 -0.3,0.14 0.6,-0.24 0.75,3.75 1.99,1.79 0.27,1.52 0.61,0.72 -0.24,0.4 0.42,-0.17 0.88,0.31 -0.02,0.35 0.43,-0.38 0.39,0.54 0.25,-0.06 0.88,2.13 -0.26,0.57 0.76,1.05 0.65,0.15 0.75,-0.31 0.15,1.17 0.54,0.31 0.92,-0.32 0.34,-0.6 -0.14,-1.34 0.31,-0.43 -0.1,0.87 0.88,3.13 -0.18,0.38 0.85,1.25 0.97,-0.26 1.41,-1.36 2.12,-3.12 0.64,-2.2 -0.04,-2.36 0.5,-0.4 1.22,-3.08 0.4,-2.96 1.33,-5.13 2.29,-5.35 0.84,-1.22 0.63,-0.35 0.78,0.08 1.05,-0.55 0.82,0.09 1.35,1.86 0.05,0.87 -0.56,-1.24 -1.16,-1.1 -0.74,-0.04 -0.78,0.53 0.28,0.25 -0.31,0.39 -0.71,-0.35 0.25,1.81 -0.44,0.88 0.25,0.86 1.21,0.56 1.35,2.87 1.07,1.51 1.75,1.73 1.54,1.01 3.68,1.28 1.63,0.01 1.54,-0.63 0.94,-1.51 1.47,-1.32 1.05,-0.33 2.24,-1.72 -0.09,0.22 1.12,-0.63 0.85,0.25 1.03,-0.38 4.44,1.48 -0.16,0.14 0.44,0.58 0.7,0.36 0.4,-0.27 0.93,0.08 1.89,2.49 1.53,0.31 1.07,0.74 -0.28,0.55 0.7,-0.43 -0.19,0.64 0.54,-0.45 -0.49,1.29 0.33,-0.05 -0.13,0.74 0.41,-0.1 0.08,0.53 0.41,0.11 0.22,-0.51 0.49,-0.17 -0.16,0.44 0.9,0.04 0.01,0.32 0.99,0.62 0.49,0.05 0.75,-0.62 -0.07,-0.83 -0.97,-0.26 -0.02,-1.44 -0.48,0.08 0.03,-0.4 -0.4,0.31 -0.01,-0.47 -0.32,0.24 -0.22,-0.28 0.66,-0.1 0.47,-0.62 1.13,-3.86 1.24,-0.28 0.85,0.16 0.19,1.25 0.28,0.01 0.34,-0.47 0.61,0.13 -0.03,-0.34 0.34,0.02 -0.6,-0.92 0.14,-0.25 1.6,-0.54 1.01,1.02 1.02,0.17 0.12,2.94 0.62,1.08 0.94,-0.27 0.22,0.23 0.61,-1.96 1.61,0.32 0.56,0.9 0.15,-0.47 0.34,-0.03 0.04,0.34 0.56,-1.41 0.36,0.56 0.09,-0.38 0.17,0.2 0.31,-0.31 -0.16,-0.26 0.34,0.02 -0.71,-0.29 -0.17,-0.55 -0.16,0.15 -1.28,-3.35 -0.02,-2.36 0.26,-0.02 -0.27,-0.13 0,-0.79 0.54,-0.27 -0.04,-0.26 -0.56,-0.26 -0.34,-1.18 -2.37,-0.76 1.57,0.32 0.71,-0.23 0.56,-1.25 0.04,-1.09 0.97,-1.1 0.36,-1.43 0.32,-0.29 0.89,0.75 1.12,-0.86 -0.34,-0.91 -1,-0.3 -1.92,0.2 -0.84,-0.25 -0.74,0.2 -1.4,1.73 -1.54,-0.72 -0.24,-2.4 0.73,-1.87 2.44,-3.1 1.9,-0.2 1.76,0.58 0.43,0.59 0.77,-0.61 2.22,-0.1 1.81,-1.04 0.93,0.31 -0.26,-0.48 0.53,-0.78 1.51,-0.64 0.31,0.06 -0.08,0.27 0.33,-0.19 0.07,-0.29 -1.07,-0.3 0.11,-0.28 -0.35,-0.18 0.19,-0.61 -1.05,-1.46 -0.17,0.11 -1.01,-2.13 -0.55,-0.22 0.19,-0.33 -0.36,-0.38 -0.13,-1.11 1.06,-0.07 1.92,0.62 1.16,0.01 0.77,0.42 0.32,0.75 1.26,1.03 2.37,1.01 5.12,0.57 6.24,0.19 1.6,0.67 3.55,0.33 4,1.32 5.61,1.19 3.48,1.43 5.15,2.7 0.58,0.43 -0.02,0.73 0.86,0.56 4.35,-0.79 2.67,0.33 1.02,-0.23 2.37,0.2 6.35,2.79 2.3,1.8 2,2.48 0.87,2.01 0.24,1.62 -0.31,0.7 -3.13,1.96 -0.45,-2.04 -0.2,0.79 -0.31,-0.03 0.36,-0.69 -0.34,-1.13 -0.39,-0.28 -0.76,0.23 0.46,0.35 -0.45,0.31 -0.04,0.46 -0.31,-0.24 -0.2,0.19 -0.6,1.4 -0.68,0.35 -0.29,0.55 -0.15,0.47 0.45,0.9 0.34,-0.6 0.77,0.55 0.65,-0.43 0.97,1.08 0.91,0.11 1.89,-0.22 0.55,-0.43 1.07,0.72 0.13,0.46 0.6,0.21 -0.1,0.67 0.45,0.35 0.04,0.9 0.83,0.26 2.03,-0.14 -0.51,0.35 0.99,0.23 -0.06,2.13 0.6,0.91 2.37,-0.81 0.37,0.57 2.97,1.16 1.86,2.73 -0.41,-0.05 0.67,1.61 0.71,0.83 -0.05,0.4 1.27,1.61 -0.2,0.44 -0.31,-0.26 -0.98,0.28 -1.46,-0.23 -0.04,0.29 0.75,0.54 1.14,0.11 2.01,1.78 2.15,0.92 3.09,-0.08 1.79,-0.45 0.3,0.27 0.29,-0.42 1.93,-0.45 0.43,0.09 0.06,0.46 0.49,-0.46 0.68,0.2 0.96,-0.86 2.83,-1.24 4.4,-1.14 1.15,-0.57 1.56,0 1.53,-0.7 0.57,0.19 2.92,-0.63 3.84,0.19 0.47,-0.38 0.34,0.23 1.54,-0.23 3.09,0.46 5.82,1.54 3.97,1.68 3.04999,1.94 3.23,2.93 2.19,3.39 1.11,3.25 0.53,2.83 -1.04,2.54 0.05,1.22 -0.61,1.27 0.01,0.77 -1.46,2.3 1.26,2.04 2.36,1.82 -0.3,-0.55 0.64,0.06 2.81,1.42 0.31,-0.36 2.09,0.73 0.31,1.74 -0.32,1.88 0.4,4.23 0.55,0.3 0.52,-1.46 -0.66,-1.96 0.03,-1.01 2.73,-2.54 0.46,-0.13 0.54,0.29 0.28,-0.41 -0.24,1.41 0.28,0.81 -1.18,1.19 -0.84,0.42 -0.26,-0.56 0.22,1.13 0.89,-0.02 0.03,-0.29 0.77,-0.2 0.63,-1.2 0.98,-1.02 1.55,-0.45 0.14,-0.85 1.17,-0.72 -0.03,-0.76 0.35,0.22 0.61,-0.16 0,0 0.09,0.84 -0.53,1.53 -0.71,0.35 0.75,1.11 -0.27,1.03 0.92,0.46 0.09,1.54 2.13,2.73 0.04,0.59 -1.44,0.33 -0.48,2.99 0.43,0.81 1.23,0.48 0.73,1.57 -0.7,1.24 -0.89,0.58 0.09,1.12 0.81,0.63 -0.35,0.92 0.11,0.84 -0.88,0.54 0.09,1.88 -0.42,0.77 0.05,1.63 -0.58,0.98 -2.7,-1.26 -4.42,-1.35 -1.02,0.23 -2.26,2.06 -1.54,0.62 -5.34,-0.55 -0.74,0.19 -0.55,0.59 -0.48,1.16 -1.11,-0.51 -0.41,0.3 -0.72,-0.03 -0.61,-0.69 -2.77999,2.4 -2.65,-0.16 -1.31,0.96 -0.63,2.5 -1.07,1.39 0.4,0.98 0.91,0.48 0.07,0.37 -0.41,0.67 -0.99,0.43 -0.9,-0.16 -1.15,0.28 -0.37,2.55 0.15,1.71 0.84,1.53 -0.2,2.15 0.21,0.53 1.33,0.42 1.38,1.87 1.25,0.2 2.18,1.09 0.25,1.13 -0.3,1.69 1.14,1.45 0.15,0.63 -1.09,0.62 -0.47,0.96 0.07,0.88 -1.26,1.86 -0.27,1.17 -0.85,0.6 0.29,1.18 0.53,0.76 z m -125.99,-222.27 -0.31,-0.23 0.98,0.24 -0.17,0.32 -0.5,-0.33 z m 38.29,26.65 -1.2,-1.39 1.01,-1.67 -0.56,-3.27 0.96,-1.58 0.38,-1.47 -0.19,-1.37 0.62,-1.37 1.45,1.13 0.51,1.22 -0.76,2.01 0.63,1.17 0.13,0.93 1.9,1.25 1.02,-0.03 1.08,-0.86 -0.37,-0.26 -0.44,0.41 -0.53,-0.09 1.17,-1.02 0.54,-0.77 -0.18,-0.16 0.77,-0.31 0.5,0.26 0.78,-0.63 2.81,1.42 2.7,-0.32 1.28,0.89 0.12,0.57 -0.59,1.44 0.33,1.11 -0.14,0.64 0.31,0.14 0.29,1 1.28,0.06 4.04,-1.92 2.73,1.03 0.1,0.44 0.24,-0.29 2.57,0.46 1.02,1.02 0.17,0.54 -0.52,0.27 0.08,0.25 0.54,-0.13 1.49,1.18 2.07,-1.42 1.11,0.41 -2.06,3.74 0.28,1.08 -0.49,2.52 -4.12,1.4 -1.27,0.76 -1.09,0.17 -0.79,0.56 -2.97,0.82 -1.69,0.1 -1.74,-0.56 -0.22,0.34 -3.58,-1.08 -1.1,-0.93 -2.89,-4.06 -2.23,-0.64 -1.84,-0.93 -2.53,-2.63 -1.74,-1.18 -1.18,-0.4 z m -65.52,-5.95 -0.21,-1.48 0.76,-0.64 0.18,-0.77 -0.58,-1.2 0.47,-0.17 -0.45,-0.18 -0.22,-0.51 0.78,-0.79 -0.36,-0.66 0.12,-0.53 -0.6,-0.12 -1.11,0.93 1.03,1.13 -0.23,0.42 -0.79,-0.84 -0.22,-0.71 1.04,-0.75 0.59,-1 -0.51,-2.01 0.51,-1.06 0.89,-0.27 0.92,0.45 0.97,-1.24 -0.85,-1.78 -0.21,0.6 -0.26,-1.67 0.32,-1.43 1.25,-1.55 0.69,-0.28 0.71,0.26 0.59,-0.39 1.35,0.03 0.65,-1.73 -0.1,-0.87 0.45,-0.71 0.65,-0.33 0.52,1.55 0.36,0.04 0.39,-2.47 2.25,-1.34 0.37,0.02 0.18,0.52 0.36,-0.4 1.35,-0.15 -0.71,0.38 0.11,1.71 0.55,0.46 -0.61,0.61 0.62,-0.39 0.79,1.11 1.3,0.57 1.35,2.04 2.76,1.08 -0.57,1.31 -0.1,-0.36 -0.46,0.08 -0.13,1.08 0.71,0.37 0.12,0.57 1.06,0.67 0.62,0.84 0.19,-0.38 0.69,-0.16 1.39,0.8 0.35,0.93 -0.05,0.83 -0.43,0.47 0.34,1.13 0.3,0.11 0.32,-0.39 -0.35,-0.92 1.09,0.12 0.84,0.93 0.11,0.85 0.46,0.43 1.06,-0.25 -1.09,-1.94 -0.15,-1.98 0.53,-2.59 -0.33,-0.93 0.1,-1.58 0.85,-3.36 1.8,0.14 2.97,1.63 -0.83,-1.12 -1.24,-3.5 -0.58,-0.09 0.15,-0.54 0.25,0 1.5,1.4 1.36,0.5 1.91,2.85 1.29,0.99 1.03,1.29 0.4,1.25 1.6,1.38 3.24,1.44 1.38,-0.56 0.26,0.2 0.43,-0.81 1.23,-0.42 3.41,1.45 1.98,2.43 0.94,0.52 1.7,0.29 0.65,1.21 0.69,0.61 2.4,1.46 1.22,1.81 0.08,0.58 -1.64,-0.15 -2.24,2.05 -0.57,1.57 0.48,2.28 0.92,0.55 -1.31,0.93 -0.46,2.56 -2.41,2.75 -1.48,0.35 -1.06,0.86 -0.62,-0.22 -0.13,-0.99 -0.37,-0.33 -1.91,-0.22 -0.75,0.34 -0.27,1.54 0.69,-0.09 0.99,1.32 -0.11,0.63 -1.04,0.98 -0.86,0.32 -1.22,-0.22 -1.5,0.55 -0.15,-0.43 -0.32,-0.05 -0.43,0.63 -0.33,-0.17 0.03,0.27 -0.43,-0.58 -0.57,-0.19 -0.76,1.84 0.61,-0.54 0.06,0.27 -1.24,0.99 -0.97,-0.09 -3.31,-3.2 0.31,-0.17 0.25,-0.95 0.74,-0.27 0.86,0.68 0.38,0.83 0.39,0 -0.07,-0.66 -0.87,-1.02 0.03,-1.07 -1.06,0.55 -1.57,-0.16 -0.67,0.78 -1.16,0.56 -0.24,0.58 -5.42,1.36 -4.36,2 -1.75,0.41 1.01,-0.38 -0.48,-2.03 -1.25,-1.03 0.11,-0.4 -0.42,0.07 -0.29,-0.61 -0.47,-0.2 -0.27,0.23 -0.08,-0.46 -0.83,1.45 -0.47,-0.03 0.35,0.32 -0.03,1.53 0.41,0.38 0.76,-0.78 0,0.33 -0.78,0.81 -0.99,3.29 -0.99,1.22 -1.12,0.67 -0.74,-0.09 -2.53,-2.06 -3.75,-1.18 -1.32,-2.16 -0.82,-2.49 0.33,0.03 0.21,-0.4 -0.59,0.16 -1.25,-1.48 0.16,-0.48 -0.21,-0.16 0.51,-0.55 -0.97,0.73 -1.95,-1.5 -2.53,-4.85 0.9,0.54 -0.11,-0.23 -1.11,-0.78 -0.19,-2.63 0.95,-0.74 0.88,-0.18 z" title="Республика Саха (Якутия)" id="RU-SA" />
                                <path d="m 907.46011,727.90082 1.22,1 1.65,-0.33 -0.58,0.98 -0.44,-0.23 -0.96,1 -1.31,0.11 -0.47,0.8 -0.9,0.47 -0.32,1.15 -0.41,-0.03 -0.29,0.91 -1.37,0.65 -0.22,1.38 -0.9,0.08 -0.21,-1.2 2.42,-2.09 0.02,-0.54 1.76,-2.17 0.64,-1.51 0.67,-0.43 z m 18.78,-10.5 0.75,0.45 -0.49,0.67 0.37,0.52 -0.25,0.58 -1.6,0.04 -0.89,0.78 -1.31,0.38 -1.53,1.07 -1.4,1.55 -0.86,0.14 -0.45,-0.58 -0.5,0.11 -0.29,0.52 0.29,0.24 -0.4,0.68 -1.87,1.38 -0.92,1.47 -0.89,0.07 -0.88,1.32 -0.7,-0.14 0.08,-0.56 0.56,-0.5 -0.04,-0.81 0.34,0.54 0.29,-0.43 -0.18,-0.44 0.63,0.23 0.65,-0.62 0.06,-0.58 -0.6,-0.21 -0.04,-0.45 0.9,0.18 0.22,-0.64 1.73,-1.22 0.2,-0.82 -0.21,-0.47 1.08,0.4 0.56,-1.17 0.98,-0.32 -0.16,-1.44 0.38,-0.64 0.46,0.1 0.64,1.64 1.26,-0.07 1.65,-0.96 0.17,-0.59 1.23,-1.24 0.98,-0.16 z m 12.62,-6.77 -2.38,2.06 -0.17,0.78 -0.47,0.51 -0.75,0.66 -0.71,0.11 -1.83,1.94 -1,0.54 -0.94,-0.06 1.92,-2.75 0.89,-0.14 1.71,-2.23 1.12,-0.28 -0.07,-0.58 0.32,-0.29 0.87,-0.4 0.86,0.27 0.81,-0.29 -0.18,0.15 z m 12.04,-9.92 0.42,0.37 -0.85,0.77 -0.11,0.65 -2.39,2.32 -0.44,-0.01 -0.3,-0.8 1.09,-0.04 0.42,-0.91 0.93,-0.56 1.23,-1.79 z m 1.59,-2.23 0.63,0.27 -0.17,0.56 -0.61,0 -0.14,-0.53 0.29,-0.3 z m 4.28,-4.49 -0.03,0.94 -0.54,0.39 0,-0.8 0.57,-0.53 z m 1.08,-3.43 0.53,0.4 0.03,0.53 -0.81,-0.38 0.25,-0.55 z m 7.08,-8.43 0.31,0.22 -0.21,0.49 -1.42,1.3 -0.18,-0.33 0.76,-0.54 0.15,-0.97 0.59,-0.17 z m 2.11,-2.89 0.86,0.45 -0.06,0.4 -0.65,0.16 -0.35,-0.81 0.2,-0.2 z m 2.63,-5.12 0.52,0.29 -0.76,1.59 0.23,1.54 -0.38,0.48 -0.87,0.17 -0.36,-0.23 -0.07,-0.82 1.69,-3.02 z m 8.55,-12.67 0.85,0.3 -0.22,1.03 0.33,0.55 -0.01,1.07 -0.96,0.51 -0.09,0.71 -0.97,1.7 -0.49,0.16 -0.19,0.47 -1.28,0.06 -0.76,0.5 -0.85,1.56 -0.29,-0.61 -0.89,0.04 0.25,-1.76 -0.35,-0.98 0.96,0.13 0.45,-0.76 1,-0.13 0.24,-0.29 0.48,0.12 0.78,-0.85 0.75,-2.28 1.26,-1.25 z m 3.2,-1.07 0.21,1.12 -0.72,1.45 -0.98,0.03 -0.68,-0.57 0.12,-0.95 2.05,-1.08 z m -98.79,-42 2,3.79 -0.05,0.95 -0.63,1.04 0,0.97 2.29,6.85 0.75,4.59 -0.01,3.98 -0.24,1.53 -0.8,1.48 -0.44,3.27 0.3,0.82 -0.31,-0.09 -0.02,0.62 0.35,0.22 -0.03,0.45 0.46,0.24 0.12,-0.22 0.56,1.42 -0.67,1.54 0.21,0.39 -0.28,0.81 0.99,0.05 0.11,-1.49 0.83,3.34 -0.22,-0.32 -0.51,0.2 0.88,0.72 0.21,0.64 1.7,9.66 1.7,4.03 0.01,0.76 0.91,2.31 0.05,1.4 0.75,1.21 -0.13,0.88 0.44,1.99 0.77,2.21 2.18,1.99 -0.13,1.47 0.54,0.87 -0.55,0.03 -0.13,-1.44 -0.62,-1.23 -1.65,-1.59 -1.42,-2.03 -2.97,-0.96 0.2,-0.06 -0.3,-0.24 -1.08,-0.24 -0.45,0.17 -0.66,-0.72 -1.21,0.28 0.7,0.4 -0.26,0.29 1.02,0.03 -1.89,0.73 -1.48,1.53 -0.16,0.83 0.26,1.45 -1.27,2.62 -1.53,5.03 -0.57,3.14 0.08,1.02 1.14,3.11 1.84,1.61 0.59,1.11 0,1.84 0.53,1.72 0.43,0.36 -0.05,0.4 -0.41,-0.22 -0.15,0.49 0.45,0.2 0.25,0.88 0.62,-0.09 0.71,0.37 0.24,-0.37 -0.28,-0.38 -1.08,-0.28 -0.24,-0.38 1.67,0.26 0.26,-0.56 0.26,0.12 0.54,3.69 0.55,1.13 -1.11,1.92 0.02,0.91 -0.37,0.8 0.06,-1.92 -0.86,-3.15 -1.15,-1.01 -0.55,0.13 -1.23,-0.39 -0.85,0.28 -0.32,-1.39 -0.31,-0.18 -0.04,0.27 -1.15,0.35 -0.76,0.97 -1.19,3.37 -0.51,2.6 -0.6,0.45 -0.12,0.92 -1.18,-1.57 -0.79,-5.71 1.28,-3.13 0.53,-2.18 -0.14,-1.11 -0.56,-0.9 0.24,-0.75 -0.27,-2.66 0.9,-2.58 0.83,-1.29 -0.43,-3.65 -1.82,-3.46 -0.31,-1.33 0.95,-1.19 -0.15,-0.5 0.33,-0.26 0.19,-2.2 0.39,0.12 -0.23,-0.28 0.29,-0.68 -0.18,-1.27 0.54,-1.97 0.17,-3.15 -0.25,-1.63 0.31,-1.1 -0.34,-2.74 0.18,-0.8 -0.78,-2.09 0.3,-3.04 1.05,-2.03 0.16,-1.3 -0.6,-2.34 -0.64,-0.88 0,-0.82 -1.17,-1.21 0.25,-0.35 -0.18,-0.26 -0.28,0.28 -1.55,-1.62 0.76,0.36 0.35,-0.82 -0.48,-0.68 -0.96,-0.51 0.42,-0.75 -0.37,-1.76 0.44,-0.67 -0.47,-1.91 0.17,-0.82 0.73,-0.69 0.52,-1.22 -0.07,-1.94 0.72,-3.66 -0.65,-1.59 -0.46,-2.58 0.89,-0.75 2.62,-1.19 -0.27,0.16 0.19,1.69 0.22,0.25 0.55,-0.29 0.67,0.1 1.07,-1.72 0.59,0.17 -0.1,-0.55 -0.21,0.1 -0.47,-0.65 -0.35,0.65 -0.26,-1.38 1.16,-0.34 0.25,0.9 0.83,-1.12 -0.23,-1.3 -0.38,-0.3 -0.24,1.37 -0.58,0.42 0.71,-1.98 0.05,-1.07 -1.82,-2.25 -0.5,-1.34 -0.82,-0.8 0.9,0.3 1.04,-0.26 0.87,-0.56 0.08,-0.8 0.32,-0.14 z" title="Сахалинская область" id="RU-SAK" />
                                <path d="m 84.910108,601.79082 0.9,0.44 0.98,-0.05 1.35,0.97 0.07,-0.77 1.28,-0.23 0.19,0.71 0.72,0.04 -0.65,0.34 0.45,0.33 0.68,-0.49 0.75,0.25 0.35,-0.37 0.67,0.27 0.11,0.37 0.27,-0.85 0.52,0.25 -0.41,0.78 0.33,0.1 0.18,-0.53 0.6,0 1.81,0.52 0.4,-0.69 0.42,0.45 0.38,-0.47 0.37,0.55 0.48,-1 0.75,-0.38 0.91,0.08 0.660002,-0.47 -0.06,-0.69 0.52,0.07 0.51,-0.74 -0.31,-0.61 0.28,-0.55 0.15,0.36 0.29,-0.21 0.31,0.25 0.03,0.47 0.26,-0.06 0.31,-0.98 -0.55,-0.4 0.49,-0.66 0.61,-0.08 0.36,0.38 1.55,-0.26 0.6,1.31 0.48,-0.73 0.96,0.85 1.24,0.45 0.55,-0.78 2.43,0.19 0,0 1.01,2.1 0.35,0.09 -0.05,1.62 0.47,0.52 0.04,0.42 -0.67,0.22 0.17,1.82 -0.4,1.34 0.66,0.74 0,0 0.02,0.84 -0.65,1.15 -0.24,-0.01 -0.49,1.36 -0.17,0.13 -0.31,-0.58 -1.66,1.7 0.08,0.6 0.56,0.5 -0.19,0.28 -1.99,1.13 -1.54,-0.4 0.71,0.97 -0.48,1.44 -1.16,-0.16 -0.47,0.3 -0.32,-0.6 -0.56,0.12 -0.89,-0.43 -0.59,0.04 -0.24,0.32 -0.2,-0.33 -0.8,0.76 -0.44,-0.07 -0.31,0.68 0.38,0.26 -0.38,0.91 0.65,0.48 -0.68,0.99 0.26,0.49 -0.51,0.25 -0.25,1.17 -0.720002,0.11 0.43,0.69 0,0 -0.63,0.29 0.2,0.34 -0.34,0.34 -0.56,-0.5 -0.54,1.19 0.53,0.67 -0.34,0.39 -0.4,-0.28 -0.15,1.11 -0.44,-0.12 -0.52,0.94 -1.09,0.9 0.15,0.46 -0.35,0.47 -0.03,0.87 -0.41,-0.27 -0.7,0.39 0,0 0.03,-0.65 -0.69,0.05 -0.18,-0.43 -0.18,0.36 -0.14,-0.48 -1.07,-0.94 0.08,-0.64 -0.31,-0.2 0.66,-0.48 -0.32,-0.51 -0.67,0.14 -0.21,-0.33 -0.55,-0.06 0.21,-0.17 -0.51,0.1 -0.06,-0.31 -0.66,-0.24 -1.36,0.36 -1.2,-0.21 -0.08,-0.39 0.7,-0.84 -0.14,-0.47 0.3,-0.19 -0.27,-0.56 0.33,-0.18 0.01,-0.44 -0.75,-0.17 0.03,-0.52 -0.65,0.03 -0.21,-0.45 -1.06,-0.31 -0.85,-1.13 -0.48,-0.03 -0.04,-1.18 -0.6,-1.31 -1.12,-0.58 0.89,-1.79 -1.52,-0.25 0.05,-0.49 -1.75,-1.08 0.56,-1.82 0.76,-0.13 -0.1,-0.86 0.68,-0.26 -0.29,-1.72 -1.11,-1.44 0.02,-0.5 0.76,-0.8 -0.23,-0.98 0.37,-0.24 -0.31,-0.45 0.31,-0.37 -0.3,-0.75 0,0 0.73,-0.68 -0.22,-0.26 0.59,-0.4 0.47,-0.15 0.69,0.32 z" title="Смоленская область" id="RU-SMO" />
                                <path d="m 75.680108,546.12082 0.31,-0.21 -0.01,-1.07 -1.73,-0.47 -0.3,-1.92 -2.25,-0.78 -1.48,0.51 0,0 0.94,-1.34 0.7,-0.15 3.52,1.58 1.82,0.41 -0.23,1.11 1.24,0.93 -0.05,1.93 1.73,1.06 0.09,0.47 -0.64,0.71 -0.82,-0.01 -0.39,0.88 -1.08,0.4 -0.9,-0.15 -1.25,-1.05 -1.53,-1.67 0,-0.32 -0.48,0.05 -0.77,-0.55 0.14,-0.99 0,0 0.61,0 1.78,1 1.07,-0.1 -0.04,-0.26 z" title="Санкт-Петербург" id="RU-SPE" />
                                <path d="m 206.29011,637.89082 0.11,0.37 -0.72,1.16 0.2,0.52 1.02,-0.79 0.68,0.17 0.41,0.5 0.49,-0.05 0.57,0.87 1.38,1.1 2.41,-0.21 0.74,0.42 -0.14,0.54 0.63,0.63 0.51,0.11 0.14,-0.6 0.36,-0.04 0.43,0.47 0.1,1.18 1.28,0.9 1.1,0.03 0.48,0.47 0.97,0.2 -0.19,0.3 0.8,0.88 0.51,-0.18 2.01,0.68 1.49,2.2 0,0 -0.19,0.56 0,0 -0.73,-0.05 0.02,0.73 0.4,0.31 -0.28,0.96 -0.64,0.07 0.37,-0.66 -0.67,-0.15 -0.4,-0.01 -0.38,0.48 -0.02,1.45 -0.35,0 -0.02,0.41 -0.79,0.07 0.12,1.06 -3.1,1.22 -1.42,1.36 -1.67,0.07 -0.6,-0.24 -0.69,1.5 0.62,1.58 -2.28,0.85 -1.92,2.07 -1.37,-0.71 -0.54,0.17 0.66,0.85 0.36,3.17 0.57,1.23 -0.18,0.78 0.7,0.27 0.18,0.7 -1.02,1.07 -2.17,0.99 -0.06,0.34 -0.81,-0.68 -0.58,0.01 -0.96,-2.49 -0.76,-0.64 -1.25,-2.04 -1.9,-1.47 -0.84,0.74 0,0 -1.01,0.09 -0.52,-1.05 -1.01,0.24 -1.05,-0.94 -0.54,-1.09 -1.32,-0.58 -0.38,0.2 -0.19,0.91 -0.72,0.61 -1,-0.31 -1.33,0.64 -0.3,-0.35 0.1,-1.23 -1.78,-1.29 -0.59,-0.06 -0.66,0.5 0.52,1.31 -0.25,0.38 -2.19,-0.19 -1.13,0.44 -0.47,-1.47 0.78,-0.68 0.17,-1.66 -1.8,-2.6 -0.85,-0.07 -0.68,-0.66 -1.29,-0.03 -0.51,0.49 -0.63,-0.66 -1.6,0.14 -0.99,0.94 -0.83,0.23 -0.21,-0.25 0.24,-0.68 -0.24,-0.17 -0.99,0.66 -0.64,-0.15 -2.27,1.38 -0.82,-0.31 -3.16,-2.38 0,0 -0.1,-1.57 -0.35,-0.63 -0.33,-0.42 -1.38,-0.43 -0.51,-0.62 0,0 -0.25,-0.64 0.14,-0.65 1.22,-1.83 0.01,-0.77 0.86,-1.77 -0.03,-0.69 0.92,-1.54 0.24,-1.11 0.73,-0.57 0,0 0.73,-0.62 0.48,-0.03 1.32,1.14 0.66,-0.54 1.83,-0.51 1.08,0.82 1.47,0.21 0.98,0.74 1.69,-1.32 0.32,-1.21 0.3,-0.01 0.71,0.49 1.16,0.05 1.33,1.5 0.49,-0.82 0.47,-0.2 2.31,0.11 1.06,-1.23 2.44,1.33 0.24,-0.37 -0.37,-1.02 0.87,-0.4 0.5,-0.7 0.82,0.03 0.63,-0.94 0.78,0.11 1.03,-0.55 0.3,0.79 0.81,0.27 0,0 0.45,0.34 1.12,-0.39 0.42,0.79 0.81,-0.33 0.36,0.37 1.32,0.19 1.22,-0.83 1.28,0.59 0.37,-0.29 -0.38,-0.95 0.53,-0.81 0.68,0.53 0.58,-0.15 0.44,-0.9 0.66,0.14 0.83,-0.56 z" title="Саратовская область" id="RU-SAR" />
                                <path d="m 158.52011,712.74082 1.73,0.12 1.3,0.65 0.28,-0.12 -0.14,-0.77 0.43,-0.42 -0.2,-0.73 0.36,-0.05 0.72,0.21 -0.14,1.5 1.69,-0.22 0.93,-0.83 0.85,-0.18 0.95,-1.38 0.7,0.69 2.32,0.95 0.92,0.9 1.69,0.17 2.28,0.88 1.2,2.22 1.55,1.65 3.16,0.87 0.56,0.61 3.65,1.69 0.83,0.59 0.96,1.41 0,0 -0.85,1.07 0.39,1.09 -0.33,0.75 -0.68,1.03 -1.4,0.73 0.16,0.63 -0.24,0.31 1.25,0.28 0.08,1 -0.3,0.49 -1.54,0.46 -0.2,0.4 1.14,0.54 0.93,-0.39 0.56,0.21 0.03,1.56 0,0 -0.39,0.33 0.04,0.93 -0.53,0.37 -1.05,-0.03 -0.28,-0.82 -0.85,0.21 -0.16,1.89 -0.82,0.54 -0.33,-0.14 0,0 -0.8,-0.99 -0.98,-0.16 -1.73,0.51 -0.33,-0.22 0,0 0.02,-0.7 0.71,-0.94 -0.04,-0.53 -0.9,1.13 -2.31,-0.88 -0.75,0.56 -0.6,1.27 -1.52,-0.44 -1.41,0.42 -0.73,-1.37 -0.55,0.48 -3,0.81 0,0 -0.39,-0.25 -0.11,-1.01 -0.55,-0.92 -0.52,-0.13 0.09,0.54 -0.36,0.19 -1.19,-0.69 0.29,-1.05 2.38,-1.3 -0.75,-1.16 -0.31,0.08 -0.07,0.6 -0.71,-0.05 -0.04,0.5 -0.79,-0.82 -2.33,-0.45 -0.73,-1.2 -0.78,-0.08 -0.37,0.32 0,0 0,0 0,0 -2.04,-1.44 -0.54,-0.94 0.78,-0.29 0.92,-1.14 -0.07,-1 -1.4,-0.76 -0.89,-1.22 0.02,-0.89 -2.46,-0.3 -0.28,-1.86 -0.68,-1.05 -0.71,-0.45 0.23,-1.27 1.12,-0.23 0.75,0.35 0.49,-0.92 0.56,0 -0.2,-0.98 -0.68,-0.53 0.16,-0.74 0,0 1.57,0.33 0.47,-0.67 z" title="Ставропольский край" id="RU-STA" />
                                <path d="m 285.74011,515.78082 0.41,-0.41 3.07,1.35 0.28,0.41 -0.02,1.53 0.59,0.67 2.55,-0.54 5.4,0.97 11.05,7.22 1.27,1.92 0.14,0.85 -0.58,1.91 0.76,2.64 2.51,4.5 0.26,1.13 -0.48,1.13 3.19,1.32 0.49,0.92 0.57,3.31 -0.01,3.92 0.53,1.11 0.82,0.88 0.87,0.37 2.24,0.06 2.85,0.95 1.67,-0.07 0.31,1.27 0.73,-0.06 0.22,0.29 1.87,5.96 1.36,1.53 1.5,0.54 0.27,1.25 0,0 0.44,4.04 1.19,2.82 -2.28,1.29 -0.38,0.65 -0.76,0.25 -0.46,0.81 -0.88,0.65 -0.92,-0.66 -3.73,2.08 0.86,1.02 -0.97,1.65 1.55,6.82 0.21,0.37 0.96,-0.15 0.16,0.29 -0.5,1.47 -1.72,0.3 0,0 -0.87,-0.87 -1.88,-0.03 -1,1.04 -0.49,-0.1 -0.29,0.27 0.06,1.16 -1.06,0.93 0.17,1.15 -0.77,0.27 -2.34,-0.28 -2.09,-1.62 -0.78,0.35 -0.37,0.59 -0.25,-0.34 -1.27,0.09 -1.27,-0.66 -1.43,0.84 -0.7,0.85 -0.65,-1.08 -0.34,-0.02 -0.8,0.59 -1.71,2.73 -0.85,0.57 -0.08,1.58 0,0 -1.05,-0.45 -0.39,-0.91 -0.78,-0.28 -0.09,-0.5 -1.24,0.06 -0.7,-0.77 -0.82,0.28 -0.86,-0.39 -0.96,0.76 0.5,1.23 -2.6,0.27 -0.6,-0.33 -0.84,0.25 -1.19,-0.72 -2.04,0.55 -1.16,-0.41 -1.74,0.42 -0.68,-1.1 -1.75,-0.18 -0.81,-0.46 -0.8,0.42 0.16,1.24 -0.52,0.4 -0.41,-0.11 -0.15,1.04 0,0 -0.76,0.95 -0.77,-0.14 -1.83,-1.2 -1.76,0.98 -0.3,-0.35 -1.01,-0.14 -0.86,0.55 -0.45,-0.08 -1.06,-0.77 -0.66,-0.04 -1.08,0.48 -0.45,-0.47 0.28,-0.65 -0.71,-0.85 -0.15,-0.68 0,0 -0.25,-3.23 0.43,-1.11 -1.31,-2.12 0.19,-1.12 0.55,-0.46 1.66,0.67 0.7,-0.33 1.88,-2.15 0.37,0.03 0.35,0.5 0.28,-0.19 -0.28,-0.56 0.26,-0.3 -0.66,-0.93 0.33,-1.28 -0.97,-0.78 -0.08,-0.53 0.73,-1.64 -0.2,-0.86 0.68,-0.89 0.01,-0.66 0.64,-0.69 1.01,0.41 1.25,-0.1 0.48,1.54 1.03,-1.24 1.38,-1.01 0.07,-1.28 -0.27,-0.47 -1.15,-0.27 -0.55,-0.8 -0.09,-1.31 1.13,-1.32 0.4,-0.99 1.34,-1.11 0.97,0.18 0.41,-0.28 0.34,-1.07 1.37,-0.93 0.34,-0.65 -0.45,-1.8 0.3,-0.8 -0.17,-0.25 -1.09,0.19 -0.5,-0.38 -0.25,-0.8 -0.48,-0.16 0.01,-1.22 0.76,-1.13 -0.58,-1.01 0.16,-1.28 -1.21,-1.57 -1.02,-0.11 -0.76,-0.46 -1,-1.68 -0.8,-0.69 1.01,-3.46 1.05,-1.66 2.1,-1.88 1.13,-3.86 -0.08,-1.4 1.36,-3.22 0.69,-2.83 0.01,-2.32 -0.91,-1.78 -0.48,-3.32 -0.01,-1.16 1.36,-3.47 -0.73,-1.82 0,0 -0.19,-2.39 z" title="Свердловская область" id="RU-SVE" />
                                <path d="m 147.57011,631.82082 0.71,0.13 0.25,-0.92 0.39,0.44 0.95,-0.54 -0.24,-0.8 0.48,-0.32 0.56,0.7 -0.04,-0.61 0.55,-0.12 0.19,-0.65 0.57,0.04 0.4,0.87 0.24,0.1 0.42,-0.49 1.06,0.46 0.31,0.7 0.45,0.06 0.21,-0.87 0.37,0.19 0.37,-0.21 -0.16,-0.49 0.47,-0.11 0.35,-2.62 0.99,-0.03 0.24,-0.63 0.15,0.44 1.19,-0.35 0.16,0.29 0.84,-0.32 1.32,0.07 0,0 0.26,0.23 -0.2,3.08 1.34,0.85 -0.16,1.15 0.3,0.29 0.81,0.04 1.13,1.56 -0.06,0.83 2.8,2.49 2.12,2.69 0.04,0.75 -1.17,1.34 -0.03,1.18 0,0 -0.73,0.57 -0.24,1.11 -0.92,1.54 0.03,0.69 -0.86,1.77 -0.01,0.77 -1.22,1.83 -0.14,0.65 0.25,0.64 0,0 -0.68,-0.34 -0.58,0.36 -0.56,-1.13 -0.69,-0.05 -0.22,0.79 -0.53,-0.36 -0.85,-0.01 -0.69,-0.79 -0.68,0.23 -1.03,-0.65 -1.86,-0.32 -0.61,0.72 -1.82,0.18 -0.47,-0.35 0.19,-1.19 -0.26,-0.48 -2.81,-0.8 0,0 0.67,-2.3 0.71,-0.35 0.04,-0.65 -1.46,-1.25 -1.34,-0.39 -0.33,-0.42 0.23,-0.57 -2.03,-1.1 -0.78,-2.08 0.36,-0.77 0.63,0.07 0.26,-0.32 -0.49,-1.06 0.71,-0.89 -0.46,-0.28 0.18,-0.51 -0.34,-1.91 z" title="Тамбовская область" id="RU-TAM" />
                                <path d="m 398.15011,563.48082 0.27,-0.68 3.57,-3.42 0.18,-0.89 -0.63,-2.4 1.52,-1.38 0.8,-1.79 0.8,-0.15 0.88,-1.43 3.57,-0.62 0.68,-5.82 -0.32,-1.46 1.05,-2.11 -0.26,-1.7 0.2,-1.62 1.4,-0.89 0.14,-0.38 -0.51,-1.39 0.46,-1.12 -0.08,-1.15 0.26,-0.54 0.45,-0.17 1.46,0.57 2.97,0.08 1.83,0.67 0.61,-0.61 3.01,0.31 1.06,-0.83 0.33,0.68 1.07,0.54 0.98,-1.01 0.63,0.05 1.06,0.25 0.4,1.94 1.06,0.25 1.82,-0.41 3.27,-0.01 1.11,-0.78 2,-0.35 0.93,-0.62 0.68,0.05 1.63,0.77 0.25,1.6 2.83,0.29 0.82,-0.36 1.96,0.05 2.07,1.72 0.67,-0.09 1.12,-1.19 0.11,-1.47 0.81,-0.86 4.77,-3.64 2.31,-0.17 3.07,2.63 2.2,-0.14 0,0 0.19,0.82 0.85,0.63 3.07,5.98 -0.57,1.34 -0.66,0.58 0.01,2.09 -0.57,1.07 0.49,1.54 6.44,-0.17 2.36,-0.64 3.27,-0.22 4.56,0.88 0.82,0.34 0.33,0.67 0.14,2.03 2.43,0.08 1.51,3.92 1.23,2.02 3.86,-0.56 1.05,-0.05 0.18,0.32 0.12,1.17 1.37,1.47 0.13,0.85 -2,1.05 -1.55,2.38 -2.77,3.21 0.25,3.58 0.77,1.26 0.1,0.93 3.99,0.85 0.76,0.94 1.52,0.72 1.51,-0.25 0.64,0.18 0.84,0.84 0.12,1.01 -0.15,2.42 -2.25,0.72 0.3,1.1 -1.51,0.73 -1.34,3.06 -1.14,1.1 -0.14,0.54 1.2,-0.14 0.33,0.73 -0.82,1.93 0,0 -0.5,1.15 -0.96,-0.3 -2.73,1.75 -1.27,1.17 -1.63,0.69 -0.34,-1.49 -1.59,0.92 0.07,-0.88 -1.36,0.01 -0.23,0.99 -0.87,0.37 -1.51,0.07 -0.22,-0.26 0.23,-0.81 -1.47,-0.02 -1.29,0.83 -0.44,-0.07 -0.96,-1.01 -0.29,0.23 -0.25,1.39 -0.56,0.06 -0.59,0.69 -1.38,0.73 -0.36,0.97 -1.52,0.49 0.22,0.68 0.4,0.15 -2.66,0.22 -2.16,0.93 -1.09,-0.08 -2.48,1.46 0,0 -0.71,0.63 -0.61,0.07 -0.94,-0.73 -1.25,0.41 -1.23,1.51 -1.39,2.55 -2.33,-0.03 -0.51,-0.68 0.48,-0.2 0.56,-1.25 -0.66,-1.98 0.07,-1.03 -0.73,-0.47 0.1,-0.98 -0.76,-0.64 1.1,-2.02 -0.87,-1.65 -1.95,0.52 0.02,0.67 -0.43,0.53 -2.84,0.29 -5.5,1.55 -0.53,-0.16 -2.42,-3.23 -0.43,-0.17 -3.99,1.05 -2.33,0.3 -3.81,-5.41 -1.82,-0.88 -1.34,-1.04 -5.77,-1.27 -0.9,-0.99 -2.47,0.2 -8.07,-0.23 -1.51,-0.61 -1.83,0.2 -2.31,-0.57 0,0 -1.06,-2.09 -0.79,0.23 -0.18,-1.35 -1.14,-2.15 -0.83,-0.06 0.31,-1.02 -0.51,-3.07 -1.7,-0.81 -1.35,-1.15 -0.05,-0.55 1.06,-1.07 -1.42,-1.36 0.57,-0.78 1.61,-1.02 -1.29,-1.82 0,0 0.33,-0.49 z" title="Томская область" id="RU-TOM" />
                                <path d="m 126.36011,613.39082 0.66,0.32 0.03,-0.23 1.04,0.13 0.49,0.57 0.16,0.78 0.4,-0.19 0.66,0.29 0.56,-0.39 0.01,-1.08 1.2,-0.24 0.78,1.13 -0.08,0.48 0.54,0.14 0.91,0.91 0.35,-0.35 0.74,0.36 0.51,-0.16 0.2,0.43 -0.26,0.81 -0.66,0.13 0.4,1.48 0.59,0.63 -0.35,0.37 0.14,0.48 1.35,0.6 0,0 0.18,0.73 0.75,0.3 -0.26,0.6 -0.58,-0.01 -0.01,0.66 0.58,0.24 -0.21,0.26 0.41,0.19 -0.05,0.53 0.27,0.23 0.69,-0.13 -0.64,0.46 0.13,0.64 -0.35,0.25 0.61,0.07 -0.24,0.43 0.19,0.39 0.84,-0.03 -0.46,0.55 -0.21,1.73 0,0 -0.03,0.46 -0.43,-0.29 -0.87,0.66 0.49,0.27 -0.27,0.13 0.46,1.07 -2.05,0.6 0.91,1.51 -0.53,0.15 0.88,0.84 -0.33,0.65 -0.27,-0.08 0.03,0.51 -0.51,0.06 -0.09,-0.67 -0.29,0.03 -0.35,0.91 -0.34,-0.14 -0.02,0.38 -0.6,0.23 -0.34,-1.21 -1.9,0.14 -0.1,-0.28 -0.65,-0.01 0.06,0.58 -0.43,0.01 0,0 -0.99,-1.48 -0.4,0.41 -0.59,-0.42 -0.01,-1.62 -2.02,-0.32 -0.04,0.55 -0.67,0.24 -1.59,-0.72 -0.32,0.3 -1.31,-0.38 -0.62,-1.03 0.16,-0.22 -1.33,0.23 -1.14,-0.85 -0.4,-0.85 -1.36,-0.61 -0.4,0.12 -0.31,-0.79 0,0 0.54,-0.6 -1.04,-0.86 0.35,-0.44 -0.36,-0.49 0.68,-0.39 -0.26,-0.4 0.57,-0.48 0.59,0.13 -0.01,-1.07 0.71,-0.75 -1.4,-0.17 0.63,-0.08 0.14,-0.29 -0.81,-0.46 1.18,0.18 0.72,-0.97 0.8,0.19 0.63,-0.75 1.02,-0.29 0.42,0.33 1.95,-0.15 -0.26,-0.38 0.21,-1.34 -0.72,-0.11 -0.21,-0.72 0.63,-0.43 -0.25,-0.58 0.81,-0.21 0.73,0.66 0.53,-0.99 z" title="Тульская область" id="RU-TUL" />
                                <path d="m 218.39011,589.98082 0.64,0.26 0.42,-0.41 0.55,0.3 0.59,-0.62 1.43,2.1 -0.12,0.57 0.67,1.32 1.18,0.35 -0.2,-0.85 0.52,-0.28 0.45,0.49 0.25,0.82 -0.27,1.17 0.77,1.15 0.75,0.53 0.53,-0.17 0.81,0.64 0.5,-0.02 0.24,-0.59 0,0 1.53,-0.44 0.36,0.2 -1.1,0.87 -0.71,1.1 -0.06,0.36 0.66,0.49 1.07,-0.48 1.36,0.39 0.82,-0.26 0.49,0.08 0.82,0.9 0.37,-0.07 0.38,-0.56 -0.2,-1.67 0.94,-0.48 0.85,1.02 0.99,-0.64 0.55,0.82 0.52,-0.42 -0.48,-1.23 0.22,-0.24 0.83,0.4 0.18,-0.51 -0.57,-0.68 -1.6,-0.6 -0.02,-0.24 1.21,-1.11 1.02,-0.24 0.52,-0.92 -0.25,-0.52 1.05,-0.8 0.32,0.47 -0.79,1.46 0.21,2.33 1.45,1.19 0.66,0.14 0.38,-0.49 -0.5,-1.29 0.24,-0.37 1.64,0.62 -0.05,1.42 -0.97,0.66 -0.02,0.86 -1.04,0.71 -0.14,0.42 0.9,0.82 2.96,-1.34 0,0 1.06,0.5 0.52,1.17 0.53,0.33 -0.16,0.23 0.9,0.47 0.04,1.02 -1.37,1.25 0.07,0.82 -0.45,0.47 -0.38,1.21 -1.59,0.87 -1.06,1.37 -0.78,-0.02 -1.72,0.69 -0.29,0.65 0.86,0.27 1.08,0.9 0.7,1.08 0.92,-0.04 0.3,0.45 -0.61,1.11 0.24,1.24 -1.18,1.97 -0.29,1.14 -0.39,2.27 0.39,1.75 -0.25,0.82 0,0 -0.22,0.09 -0.88,-1.03 -1.37,0.62 0.12,-0.83 -0.76,-0.44 0.11,-0.49 1.19,-0.36 0.1,-0.3 -0.47,-0.65 -0.66,0.54 -1.42,-0.77 -1.36,0.03 -0.35,-0.43 0,0 -0.32,-0.81 -0.3,-0.09 -0.52,0.43 -0.63,-0.34 -1.7,1.36 -0.13,-0.64 -0.74,-0.54 0.04,-0.78 -0.84,-0.17 -1.76,-1.03 -0.47,-0.77 -0.81,0.99 -0.31,-0.15 0.12,-1.11 -0.68,0.59 -0.93,-0.39 0.03,0.51 -1.19,1.09 0.07,1.17 -0.43,1.14 -1.39,-1.26 -1.58,1.44 -0.37,-0.15 0.16,-0.56 -0.52,-0.85 -0.34,-0.18 -0.57,0.56 -0.61,-0.89 -1.06,-0.38 0,0 -1.46,0.04 -0.76,-0.83 -1.36,0.02 0.15,-0.5 -1.21,-2.32 -1.15,-0.98 -0.4,0.43 -0.15,-0.3 -0.27,0.18 -0.3,0.53 -0.78,0.09 0.89,0.43 -0.95,0.06 -1.15,1.7 -0.88,0.31 -1.47,0.01 -0.65,-0.69 -0.99,-0.25 -0.01,-0.74 -0.64,0.17 -0.57,-0.4 -0.47,0.76 -0.73,-0.12 -0.24,1.24 -0.45,-0.27 -0.08,-1.05 -0.44,-0.33 -0.51,0.18 0.09,0.54 -0.98,1.13 0.16,0.73 -0.29,0.15 -0.86,-0.43 -0.29,0.6 -0.31,-1.15 0.26,-0.31 -0.83,-0.97 0,0 1.25,-0.52 -0.53,-0.81 0.48,-0.41 -0.09,-0.42 0.99,0.76 1.15,0.15 -0.12,-0.7 1,0.05 -0.36,-1.29 2.25,-0.39 0.01,-0.38 -0.94,0.39 -0.42,-0.56 0.14,-0.7 0.95,-0.53 -0.78,-1.99 -0.55,-0.18 0.06,0.72 -0.43,-0.05 -0.52,0.64 -0.45,-0.16 0.11,-1.03 0.14,-0.38 0.78,-0.23 1.19,-1.76 1.08,-0.87 -0.79,-0.41 -0.04,-0.67 1.2,-0.45 0.53,-0.86 1.02,-0.21 -0.03,-0.73 0,0 -0.12,-0.82 1.52,-1.17 0.43,-1.37 0.89,0.27 0.57,-1.12 0.72,0.02 0.57,-0.81 0.08,-0.4 -1.11,-0.02 -0.18,-0.54 0.53,-0.94 1.02,-0.63 1.83,0.43 0.48,-0.98 0.82,0.11 0.41,-0.91 1.05,-0.39 0.58,0.34 -0.34,0.52 0.3,0.46 0.89,-0.61 0.44,0.46 0.51,-0.9 0.82,-0.32 0.05,-0.3 -0.27,-0.45 -0.61,-0.08 z" title="Республика Татарстан" id="RU-TA" />
                                <path d="m 552.43011,627.53082 0.1,-0.89 1.02,-0.08 0.78,1.08 0.56,0.14 0.34,0.5 1.15,0 0.65,0.64 0.24,0.73 1.05,0.59 0.24,0.79 1.32,-0.2 0.55,0.37 1.07,0.1 0.01,0.84 0.5,0.65 1.42,0.23 0.11,1.32 2.3,-0.19 0.61,-0.5 0.69,0.43 0.62,-0.37 0.49,0.11 0.62,0.45 -0.53,0.63 2.38,1.44 0,0 -0.09,0.7 -0.71,-0.17 -0.65,-0.6 -0.8,0.52 -0.23,0.94 0.19,0.26 0.54,-0.09 -0.23,1.42 -0.73,0.72 -0.11,0.99 -1.2,1.23 0,1.84 1.22,-0.17 -0.13,0.76 0.24,0.24 0.99,-0.1 0.13,1.08 0,0 -0.35,-0.33 -0.43,0.14 -0.2,1.15 -1.12,2.56 -2.74,1.18 -0.58,2.95 -1.33,0.28 -0.74,1.31 0.06,1.04 -0.9,2.6 0.28,0.62 1.09,0.93 -0.46,0.97 0.67,1.46 0.7,0.7 1.27,0.48 -0.48,1.54 -0.01,1.74 -0.59,0.57 -0.47,1.26 -1.67,1.55 -0.57,-0.4 -1.51,0.44 0.14,0.74 -2.06,1.38 -0.97,-0.24 -1.28,-1.5 -1.43,-0.35 -0.88,0.46 0,-0.61 -0.33,-0.25 -1.49,0.93 -0.96,-1.04 -1.57,-0.31 -0.72,0.44 -1,-0.68 -0.53,0.32 -0.16,0.53 -1.72,0.49 -2.89,-0.4 -0.93,-1.17 -2.48,0.31 -0.78,-1.51 -0.74,-0.5 -0.42,-2.81 -0.52,-1.24 -5.41,-0.07 -0.37,-0.23 -2.62,0.39 -0.87,-0.71 0.36,-1.5 -0.17,-0.24 -1.37,-0.06 -0.49,0.39 -0.02,0.52 -0.94,0.05 -0.01,-0.6 -1.03,-0.21 -0.71,-1.34 -0.36,0.18 -0.33,1.84 -0.95,0.4 -0.87,-0.03 -1.2,-0.59 -0.7,0.17 -0.73,0.69 -0.07,0.94 -1.47,0.33 -0.08,1 -1.24,-0.3 -0.84,0.3 -2.37,-0.07 -0.51,-0.27 -0.5,1.7 0.55,0.16 0.13,0.84 -0.57,0.38 -0.15,0.56 -0.86,-0.16 -1.25,0.37 -0.68,1.41 -1.34,-0.22 -1.12,0.58 -1.19,-0.16 -0.9,0.23 -0.24,0.36 0,0 -0.16,-1.65 -0.67,-0.93 -1.13,-0.23 -0.04,-0.42 0.54,-0.83 0.9,-0.53 -0.3,-1.14 0.4,0.1 0.36,0.87 0.85,0.26 0.62,-0.27 0.5,-0.96 -0.17,-0.48 -2.03,-1.63 -0.13,-0.86 -0.82,-0.71 -0.44,-0.89 -0.53,0.04 -0.65,-0.63 -0.09,-0.73 -1.09,-0.87 0.06,-0.95 -0.78,-1.66 0.41,-1.21 -1.47,-1.71 0,0 0.93,-0.11 0.75,-0.58 1.27,-0.32 -0.21,1.03 0.45,0.19 1.5,-0.6 1.29,0.64 0.74,-0.47 1.12,-1.55 0.99,-0.21 0.3,-0.35 -0.74,-1.72 0.19,-0.89 0.63,-0.62 -0.17,-1.2 0.25,-0.2 0.66,0.34 0.58,-0.22 0.26,-0.46 1.14,0.09 0,0 1.42,1.21 1.03,2.1 1.35,-0.58 0.56,0.14 0.43,0.58 1.89,-0.29 1.61,0.66 1.01,-0.26 0.71,0.94 0.73,0.19 2.19,-0.64 0.95,0.22 1.84,-0.71 1.3,0.06 3.58,-3.4 0.65,-0.46 1.29,-0.25 0.29,-1.5 0.77,-0.58 0.02,-1.22 1.1,-1.07 0.05,-0.88 0.58,-0.33 1.06,-2.39 0.82,-0.44 1.56,-0.19 0.74,-3.35 0.56,-0.42 0,-0.42 -0.59,-0.56 0.72,-0.63 2.16,-0.25 0.07,0.22 1.08,-0.87 1.36,0.76 2.44,-1.34 0.24,0.37 0.76,-0.28 1.42,0.38 0.43,-0.62 0.67,-0.16 0.18,-0.63 1.3,0.62 1.94,-0.7 z" title="Республика Тыва" id="RU-TY" />
                                <path d="m 120.87011,565.22082 0.58,0.09 0.62,-1.51 0.39,-0.03 0.22,-1.07 1.36,-0.33 -0.52,-0.94 0.82,-0.56 0.7,0.34 0.27,-0.4 3.84,4.85 0,0 0.28,0.83 -0.16,0.4 -0.38,-0.06 -0.29,0.42 -0.41,-0.13 -0.47,0.68 0.46,0.51 -0.94,0.94 0.55,0.14 0.28,0.68 0.89,0.03 0.92,1.4 -0.82,0.11 -0.29,0.89 -1.36,0.51 -0.07,0.49 0.96,-0.09 0.43,0.39 -1.02,0.01 0.01,0.45 0.43,0.01 -0.56,0.76 1.4,0.5 0.55,0.63 0.43,1.11 0.92,0.72 0.17,1.91 1.28,1.44 0.52,0.16 0.58,-0.17 0.21,-0.44 0.57,-0.01 0.29,1.08 -0.53,0.75 -0.54,-0.1 -0.02,0.76 0.22,0.48 0.43,0.14 -0.34,0.49 0.44,0.94 -0.28,0.39 -0.98,0.32 0.61,0.31 -0.36,0.95 0.27,0.9 0.34,-0.05 0.37,0.56 0,0 -1.65,0.2 -0.51,-1.35 -0.67,-0.15 -1.33,-1.05 -1.17,0.61 0.05,0.96 -0.53,0.72 -0.4,-0.19 -0.64,0.46 -1.06,-0.4 -0.89,0.52 0.38,0.37 0.06,0.63 -0.26,0.4 0.07,1.3 -0.72,0.04 -1.46,-0.66 0.04,0.26 -1.93,0.98 -0.15,0.35 -0.67,-0.16 -1.41,1.07 -0.68,-0.13 -0.39,1 -0.29,-0.47 -1.63,-0.4 -0.41,0.23 -0.11,-0.89 -0.59,-0.36 -0.35,0.45 -0.08,-0.28 -0.4,0.3 -0.18,-0.21 -0.23,0.53 -0.53,-0.35 -0.09,0.97 0.72,-0.05 -0.36,1.01 0.27,0.65 -1.36,0.41 0.33,0.65 -0.55,0.76 0.41,0.32 -1.35,1.67 0,0 -2.43,-0.19 -0.55,0.78 -1.24,-0.45 -0.96,-0.85 -0.48,0.73 -0.6,-1.31 -1.55,0.26 -0.36,-0.38 -0.61,0.08 -0.49,0.66 0.55,0.4 -0.31,0.98 -0.26,0.06 -0.03,-0.47 -0.31,-0.25 -0.29,0.21 -0.15,-0.36 -0.28,0.55 0.31,0.61 -0.51,0.74 -0.52,-0.07 0.06,0.69 -0.660002,0.47 -0.91,-0.08 -0.75,0.38 -0.48,1 -0.37,-0.55 -0.38,0.47 -0.42,-0.45 -0.4,0.69 -1.81,-0.52 -0.6,0 -0.18,0.53 -0.33,-0.1 0.41,-0.78 -0.52,-0.25 -0.27,0.85 -0.11,-0.37 -0.67,-0.27 -0.35,0.37 -0.75,-0.25 -0.68,0.49 -0.45,-0.33 0.65,-0.34 -0.72,-0.04 -0.19,-0.71 -1.28,0.23 -0.07,0.77 -1.35,-0.97 -0.98,0.05 -0.9,-0.44 0,0 -0.46,-1.54 0.23,-0.57 -0.21,-0.8 0.86,-0.56 0.17,-0.47 -0.47,-1.29 0.53,-0.51 -0.5,-0.44 0.04,-0.64 0.55,-0.09 -0.39,-0.35 -1.23,0 -0.67,-0.48 0.33,-0.4 -0.26,-0.66 -1.5,-0.36 0.21,-1.95 -1.27,-0.65 -0.45,-0.63 0.46,-0.44 -0.56,-0.05 0.65,-0.64 0.48,-1.77 0.27,-0.08 0,0 1.68,0.77 0.45,-0.49 2.48,0.4 0.4,-0.93 0.49,-0.13 -0.31,-0.36 0.56,-0.81 0.39,0.21 0.25,-0.43 0.52,-0.11 0.29,0.71 0.3,-0.12 -0.17,-0.47 0.36,-0.06 -0.05,-0.44 0.79,-0.22 0.21,-0.38 0.68,0.14 0.09,-1.06 0.9,0.1 0.05,-0.37 0.65,0.02 0.42,-0.63 0.78,0.03 1.01,-1.69 0.35,-0.15 0.48,0.3 0.33,-0.4 0.54,0.5 0.9,-0.62 0.75,0.9 0.21,-0.68 -0.56,-0.39 0.02,-0.51 0.19,-0.51 0.6,-0.18 -0.22,-0.57 0.28,-0.6 -0.29,-0.36 0.92,-0.33 0.610002,0.25 0.49,-0.46 -0.33,-0.69 0.2,-0.71 0.81,-0.58 0.18,-1.18 -1.13,-0.94 1.18,-1.59 1.32,0.21 1.16,-1.27 0.07,0.34 0.85,-0.13 0.67,0.62 0.61,0 0.31,0.47 0.52,-0.16 1.5,0.89 0.46,-0.48 -0.31,-0.53 0.04,-0.73 0.59,-0.6 0.74,0.4 0.33,-0.18 0.68,0.54 0.29,-0.35 0.74,-0.14 0.98,-1.22 -0.31,-0.64 0.28,-0.34 1.73,-0.87 2.64,0.49 0.18,-0.87 0.64,0.26 0.52,-0.61 0.38,0.23 0.45,-0.48 0.87,0.22 z" title="Тверская область" id="RU-TVE" />
                                <path d="m 332.43011,564.61082 0.46,-0.44 1.91,0.36 3.74,-1.18 -0.05,-3.12 1.51,-1.25 0.65,0.19 0.31,0.63 3.36,-1.82 0.95,-1.53 2.3,-0.35 2.41,-0.92 0.93,-1.76 0.42,-2.41 1.87,0.01 3.8,-3.1 -1.13,-1.87 0.92,-0.76 1.32,-0.13 1,0.47 0.04,0.97 3.13,-1.12 1.27,1 1.95,0.83 2.14,-0.58 0.68,0.76 1.5,-0.71 1.31,1.45 2.59,1.8 1.01,1.12 1.47,0.18 2.57,3.12 0.13,1.47 1.41,1.33 1.25,-0.74 0.96,0.3 0.16,0.55 -0.61,0.84 1.43,1.33 -0.96,1.11 0.94,0.44 1.76,0.51 2.45,-0.78 0.89,0.8 1,-0.26 1.3,1.4 3.64,-0.06 1.68,0.37 0.99,-0.22 0.96,0.64 0,0 0.46,0.58 -0.33,0.49 0,0 -1.54,1.45 -0.22,0.98 -1.29,0.42 -1.12,1.31 -0.96,0.26 -2.11,1.82 -7.19,-0.28 -1.34,1.4 0.27,0.32 -1.24,0.65 -1.44,-0.51 -3.25,0.08 -0.7,-0.99 -0.55,-0.28 -4.98,0.83 -0.39,-0.89 -0.06,-1.68 0.36,-2.08 -1.3,-0.46 -0.06,-0.83 -0.9,-0.15 -0.73,-0.68 -0.59,2.27 -1.74,4.25 -0.35,3.31 -0.03,0.73 0.65,0.58 1.04,2.43 -2.19,1.97 -0.03,0.33 0.48,0.74 0.86,0.33 0.37,0.78 0.93,-0.05 0.2,-1.37 0.32,-0.23 1.34,0.08 0.7,2 2.87,3.2 0.52,1.89 -0.08,0.56 -0.42,0.24 0.09,0.4 -0.46,0.33 -0.41,-0.1 -0.48,0.74 -1.09,-0.22 -0.38,0.18 -0.72,-0.42 0.49,1.9 -1.2,1.06 -0.56,-0.16 -0.5,0.44 0.17,0.34 0.71,0.12 0.52,1.12 -1.64,0.87 0.66,0.57 0.29,1.35 -0.54,2.02 -0.51,0.5 -1.38,-0.07 -0.28,0.4 0.23,0.43 1.79,-0.2 0.13,0.21 -1.85,1 0.41,1.59 0.91,0.2 0.03,0.3 -0.45,1.12 -0.56,0.39 -0.51,-0.1 -0.55,1 0.27,1.21 0,0 -0.44,-0.01 -0.46,0.97 -1.28,0.82 -0.48,-0.01 -0.71,-0.67 -0.79,-0.2 -0.57,-1.09 -1.39,-0.66 -1.29,0.03 -0.83,-0.32 -1.25,0.39 -0.8,-0.95 -0.98,-0.27 -0.21,0.93 0.44,0.04 0.17,0.77 -1.72,-0.82 -0.78,1.25 0,0 -0.05,-1.44 -3.16,-3.1 -0.37,-1.45 -2.03,0.51 -0.75,-0.85 -1.2,0.4 -1.5,-0.36 -1.01,-2.74 -1.65,-0.03 -0.43,-0.72 -0.78,0.52 -0.7,-0.11 -0.56,-0.96 -1.43,1.18 -1.59,-1.68 -1.84,0.83 -2.28,-2.53 -0.35,-0.92 -3.51,-0.43 -0.22,-0.41 0.27,-0.58 -1.11,-1.91 0.16,-1.65 -0.36,-1.26 0,0 1.72,-0.3 0.5,-1.47 -0.16,-0.29 -0.96,0.15 -0.21,-0.37 -1.55,-6.82 0.97,-1.65 -0.86,-1.02 3.73,-2.08 0.92,0.66 0.88,-0.65 0.46,-0.81 0.76,-0.25 0.38,-0.65 2.28,-1.29 -1.19,-2.82 z" title="Тюменская область" id="RU-TYU" />
                                <path d="m 228.10011,596.74082 0.52,-0.73 -0.72,-0.54 0.7,-0.82 -1.19,-0.82 -0.18,-0.73 -1.09,-1.06 0.26,-0.6 -0.22,-0.87 0.25,-0.69 1.22,0.05 0.34,-1.21 0.76,-0.65 0.1,-0.64 -0.89,-0.93 -2.11,-4.74 0.74,-1.79 0.58,-0.42 1.08,-0.13 0.54,0.26 0.64,-0.23 -0.03,-0.55 0.97,-0.58 0.11,-0.61 0.79,-0.8 0.4,-1.17 -0.27,-2.48 0.45,-0.91 -0.81,-0.41 -0.05,-0.87 -1.15,-1.1 0.91,-2.35 0.97,-1.15 1.21,-0.57 0.64,-0.02 1.75,0.75 2.93,0.23 0.35,-0.36 0.16,-1.04 1.44,-0.53 0.84,1.63 1.1,0.08 0.08,-0.52 0.3,-0.11 0.25,0.31 0.57,-0.33 0.48,0.19 0.36,-0.42 0.76,-0.1 0,0 0.81,2.1 -0.51,1.18 0.93,1.92 1.23,1.61 0.53,2.15 -0.48,1.19 0.02,1.11 -0.47,0.81 1.38,1.25 0.18,0.61 -0.59,0.58 -0.2,0.9 0.2,0.33 0.76,-0.05 0.29,1.74 -0.27,0.52 0.18,0.53 0.61,0.07 0.13,0.32 -1.66,1.13 -0.99,2.12 -1.44,0.18 -0.12,0.76 0.32,0.47 -0.07,0.96 0.44,0.55 0.12,-0.75 0.72,-0.39 0.41,0.21 -0.18,0.75 1.17,1.47 0.64,0.2 0.41,1.64 0,0 -0.11,0.85 -1.34,0.71 -0.71,1.51 -1.8,1.25 -0.38,0.72 0,0 -2.96,1.34 -0.9,-0.82 0.14,-0.42 1.04,-0.71 0.02,-0.86 0.97,-0.66 0.05,-1.42 -1.64,-0.62 -0.24,0.37 0.5,1.29 -0.38,0.49 -0.66,-0.14 -1.45,-1.19 -0.21,-2.33 0.79,-1.46 -0.32,-0.47 -1.05,0.8 0.25,0.52 -0.52,0.92 -1.02,0.24 -1.21,1.11 0.02,0.24 1.6,0.6 0.57,0.68 -0.18,0.51 -0.83,-0.4 -0.22,0.24 0.48,1.23 -0.52,0.42 -0.55,-0.82 -0.99,0.64 -0.85,-1.02 -0.94,0.48 0.2,1.67 -0.38,0.56 -0.37,0.07 -0.82,-0.9 -0.49,-0.08 -0.82,0.26 -1.36,-0.39 -1.07,0.48 -0.66,-0.49 0.06,-0.36 0.71,-1.1 1.1,-0.87 -0.36,-0.2 z" title="Удмуртская республика" id="RU-UD" />
                                <path d="m 198.36011,614.69082 0.83,0.97 -0.26,0.31 0.31,1.15 0.29,-0.6 0.86,0.43 0.29,-0.15 -0.16,-0.73 0.98,-1.13 -0.09,-0.54 0.51,-0.18 0.44,0.33 0.08,1.05 0.45,0.27 0.24,-1.24 0.73,0.12 0.47,-0.76 0.57,0.4 0.64,-0.17 0.01,0.74 0.99,0.25 0.65,0.69 1.47,-0.01 0.88,-0.31 1.15,-1.7 0.95,-0.06 -0.89,-0.43 0.78,-0.09 0.3,-0.53 0.27,-0.18 0.15,0.3 0.4,-0.43 1.15,0.98 1.21,2.32 -0.15,0.5 1.36,-0.02 0.76,0.83 1.46,-0.04 0,0 1.02,1.65 -0.08,0.97 0.39,0.84 -0.55,0.85 -0.1,1.34 -1.76,1.48 0.61,0.75 -0.33,0.36 -1.21,-0.49 -1.53,0.86 -1.06,-0.75 -1.25,0.26 -0.65,-0.23 0.36,0.55 -1.4,-0.17 -1.32,1.81 -2.37,-0.88 -0.38,0.42 1.07,0.49 0.11,0.32 -0.28,0.21 -1.35,-0.35 -0.44,0.3 -0.07,0.37 0.48,0.39 0.16,0.8 -0.26,0.74 -1.34,-0.46 -1,0.47 -0.01,0.49 -0.47,0.52 0.77,1.18 0.55,0.26 -0.11,0.95 0.44,0.53 -0.27,1.03 0.18,0.31 0.68,-0.35 0.36,0.19 -0.13,0.43 1,0.12 0.61,0.71 -0.67,1.36 -0.55,0.23 0,0 -0.66,-0.32 -0.83,0.56 -0.66,-0.14 -0.44,0.9 -0.58,0.15 -0.68,-0.53 -0.53,0.81 0.38,0.95 -0.37,0.29 -1.28,-0.59 -1.22,0.83 -1.32,-0.19 -0.36,-0.37 -0.81,0.33 -0.42,-0.79 -1.12,0.39 -0.45,-0.34 0,0 0.18,-0.66 1,-0.82 0.13,-0.54 -0.51,-1.31 0.37,-2.81 -0.42,-0.86 0.34,-0.95 -0.25,-0.68 -1.32,-0.95 -0.09,-0.47 -1.29,0.19 -0.37,-0.31 0.05,-1.54 -1.75,-2.16 -0.2,-1.19 -0.48,-0.59 -0.82,-0.55 -1.09,0.36 -0.32,-0.15 0,0 1.14,-1.94 2.6,-0.77 1.66,-1.29 0.65,-0.17 0.02,-0.98 -0.76,-0.02 -0.17,-0.25 0.58,-0.91 -1.09,0.05 0.58,-0.61 -0.3,-0.42 -0.56,-0.03 0.71,-0.59 -0.53,-1.73 0,0 1.51,1.06 0.78,-0.04 0.52,0.6 0.86,-0.87 0.66,-0.07 0.6,0.51 z" title="Ульяновская область" id="RU-ULY" />
                                <path d="m 167.33011,655.95082 3.16,2.38 0.82,0.31 2.27,-1.38 0.64,0.15 0.99,-0.66 0.24,0.17 -0.24,0.68 0.21,0.25 0.83,-0.23 0.99,-0.94 1.6,-0.14 0.63,0.66 0.51,-0.49 1.29,0.03 0.68,0.66 0.85,0.07 1.8,2.6 -0.17,1.66 -0.78,0.68 0.47,1.47 1.13,-0.44 2.19,0.19 0.25,-0.38 -0.52,-1.31 0.66,-0.5 0.59,0.06 1.78,1.29 -0.1,1.23 0.3,0.35 1.33,-0.64 1,0.31 0.72,-0.61 0.19,-0.91 0.38,-0.2 1.32,0.58 0.54,1.09 1.05,0.94 1.01,-0.24 0.52,1.05 1.01,-0.09 0,0 -0.19,0.63 -0.76,0.33 0.18,0.76 -0.47,0.49 0.56,1.05 -0.52,1.08 -0.75,0.91 -1.75,0.64 -0.18,0.32 -0.79,5.59 1.71,1.36 0.23,0.48 -0.58,1.48 -1.39,0.99 -1.23,3.07 0,0 -0.19,-0.62 -1.43,-0.99 -0.9,-0.48 -1.36,-0.06 -1.42,1.75 -2.01,1.33 -2.31,0.24 0,0.38 0.83,0.2 0.06,0.44 -1.46,-0.27 -1.17,1.87 0.39,0.64 0.92,0.29 0.9,0.93 0,0 -0.51,0.25 -1.44,-0.64 -0.65,0.01 -0.18,0.36 0.27,0.53 -0.46,0.25 -0.56,0.04 -0.36,-0.4 -1.05,0.48 -0.25,-0.29 0.2,-1.07 -1.33,-0.37 -0.54,0.65 -0.18,0.83 1.42,0.72 -0.24,0.51 -0.8,0.93 -0.68,0.03 -1.07,-0.54 -0.73,0.36 0.01,0.84 -2.18,1.3 -0.28,0.92 0.12,1.34 0,0 -2.99,0.72 -0.66,-0.48 0.09,-0.88 -0.83,-0.08 -0.24,0.47 -0.53,0.09 -1.78,-2.95 -0.22,-1.08 -1.89,-1.46 -3.23,-0.48 -0.03,-0.71 0.49,-0.67 -0.36,-0.79 0.79,-0.38 -0.42,-1.45 1.43,-1.02 2.72,-0.82 0.29,-0.37 -0.15,-0.83 0.88,-1.69 -1,-1.6 -0.6,-0.34 -1.09,-0.03 0.2,-0.67 -0.59,-0.69 -2,0.01 -0.06,-0.97 0.31,-0.51 -0.34,-1.17 0.97,-2.84 -0.12,-0.87 -2.07,-1.82 -0.58,0.12 -1.18,-0.51 0.22,-1 -1.1,-0.56 -0.19,-0.91 -0.56,-0.3 0,0 0.87,-1.54 -0.16,-2.16 0.64,-0.33 -1.52,-1.82 -0.97,-0.55 0.21,-0.32 1.31,-0.3 0.1,-0.72 0.55,-0.52 0.55,0.07 1.13,-0.72 0.27,-0.93 0.87,-1.07 2.99,0.28 0.75,-0.36 1.37,-0.03 0.45,-0.67 z" title="Волгоградская область" id="RU-VGG" />
                                <path d="m 142.14011,588.78082 0.4,0.07 1.01,-0.68 1.79,0.56 0.06,0.86 -0.51,1.14 0.64,0.06 0.68,1.85 0.91,0.19 0.65,0.53 0.65,-1.31 0.35,0.1 0.14,-0.37 0.7,-0.05 0.17,-0.37 1.57,-0.42 0.66,0.21 0.25,0.98 1.31,0.33 0.47,0.45 0.19,-0.41 0.73,-0.3 0.24,0.35 1.5,0.09 0.45,0.63 0.55,-0.45 2.09,-0.61 0.24,1.66 0.9,0.38 0.88,-0.76 0.04,-0.56 0.67,-0.19 1.04,0.23 0.17,0.52 1.22,-0.08 0,0 0.68,0.66 0.21,1.42 1.36,0.55 -0.05,0.53 -0.66,0.75 -0.84,0.19 -0.36,0.44 0.26,0.32 -0.09,0.64 -0.77,0.73 -0.8,0.13 -0.34,1.49 -1.16,0.63 -1.25,1.71 -0.04,1.4 0.38,1.12 -0.77,0.94 -0.35,0 -0.31,1.67 -0.44,0.87 -0.51,0.2 0,0 -0.65,-0.1 -0.24,0.26 -0.4,-0.52 -1.23,0.44 -1.32,-1.21 -0.44,-0.06 -0.57,0.56 0.01,0.61 -0.34,-0.06 -0.61,-1.49 -0.68,-0.08 -0.17,0.76 -0.67,-0.3 -0.21,0.37 -1.08,0.04 -0.41,-0.78 0.11,-0.74 -0.42,-0.13 -0.47,0.64 -0.58,0.02 -0.21,-0.4 0.48,-0.16 -0.14,-0.3 -0.93,0.16 0,0 -0.56,-1.11 0.38,-0.99 -0.23,-0.37 -0.79,0.02 0.26,-1.7 -1.21,-0.99 -0.16,-1.23 -1.09,-0.11 -0.6,0.6 -0.93,0.06 -0.28,0.55 -0.12,-0.39 -1,0.03 -0.24,-0.78 0.26,-0.37 -0.51,0.28 -1.07,-0.13 -0.52,-0.74 0.19,-0.36 -0.34,0.08 0.19,-0.2 -1.54,0.24 -0.75,-0.72 -0.92,-0.01 -0.13,-0.22 0.3,-0.19 -0.48,-0.66 -0.35,-1.43 0.18,-0.41 -0.36,0.07 -0.53,-0.77 0.34,-1.63 -0.34,-0.08 0,-0.76 -0.4,0.02 -0.27,-0.51 0.25,-0.24 -0.44,-0.21 0.63,-0.58 -0.41,-1.53 0.59,-0.14 0,0 0.78,0.73 0.1,0.96 0.47,0.15 1.15,-0.77 0.58,0.09 0.59,0.66 1.03,-0.01 0.37,-0.47 0.98,0.73 0.51,-0.18 -0.11,-0.42 0.48,-0.72 -0.24,-0.03 -0.07,-0.71 z" title="Владимирская область" id="RU-VLA" />
                                <path d="m 341.91011,396.97082 0.59,0.44 0.15,0.75 -0.5,-0.02 -0.93,-1.01 -0.38,0.09 0.35,-0.29 0.72,0.04 z m 79.8,-77.03 0.27,0.32 -0.43,0.48 0.04,0.52 -0.41,0 -0.54,-0.76 0.34,-0.56 0.73,0 z m -0.62,-1.99 -0.94,0.43 -0.82,1.27 -0.71,0.15 -0.56,0.76 -0.24,-0.05 -0.6,1.58 -0.93,-0.22 -0.44,0.01 0.06,0.24 -2.69,-0.12 -2.12,0.47 -0.67,-0.54 0.63,-1.57 1.87,-1.51 0.99,-2.43 1.96,-1.87 3.95,1.04 0.86,1.08 0.4,1.28 z m -78.6,40.65 0.08,-0.98 -0.27,-0.15 -0.12,-1.42 -0.43,-0.85 -0.92,-0.15 -0.95,0.51 -0.39,0.57 -1.32,0.25 -0.52,0.41 0.2,-1.31 -0.61,-1.1 0.83,-0.82 1.05,-2.31 -0.23,-0.67 0.44,0.13 -0.31,-0.21 0.17,-0.43 0.54,-0.06 -1.62,-1.01 1.37,-3.48 3.01,-1.85 1.01,-0.79 0.61,-1.03 2.5,-1.78 2.22,-2.99 0.85,-1.9 0.91,-2.41 0.97,-5.98 0.61,-0.39 -0.45,-0.4 0.63,-4.02 0.45,-0.14 -0.38,-0.12 0.34,-3.32 0.6,-2.17 0.21,-2.34 0.6,-0.01 -0.02,-0.31 -0.46,0.07 -0.04,-0.37 1.62,-2.54 1.27,-4.22 1.71,-0.35 1.23,0.22 0.11,0.69 -0.31,-0.11 -1.37,0.74 0.02,0.69 0.45,0.21 1.87,-0.37 0.09,-0.3 1.27,0.31 1.08,-0.36 1.74,0.11 0.46,-0.29 1.72,0.54 2.18,-0.52 1.84,0.28 1.79,-0.26 2.08,1.26 0.96,0.22 -0.04,0.46 -0.39,0.21 0.45,0.18 0.22,-0.21 0.14,0.31 0.18,-0.6 -0.36,-0.21 0.5,-0.04 5.39,3.1 -1.08,-0.01 0.26,0.92 0.55,0.6 -0.8,0.89 0.13,1.28 0.56,1.06 -0.46,0.25 -0.8,-0.21 0.9,0.37 0.39,-0.16 -0.19,0.81 0.51,4.36 -0.99,1.83 0.12,1.54 -0.94,1.47 -0.47,3.71 -0.89,0.91 -0.22,-0.09 -0.1,3.55 -0.89,1.06 -0.32,1.74 -0.75,0.27 -0.54,0.75 -0.43,0.03 -0.68,1.3 0.25,1.41 0.99,1.61 0.25,1.32 1.35,1.76 1.94,1.11 -0.07,0.23 0.63,0.02 0.33,0.55 0.21,1.06 -0.45,1.7 1.73,3.01 -0.32,3.84 -0.58,2.31 0.45,1.53 -0.06,2.52 -0.88,0.34 -1.21,1.52 -0.36,1.14 1.14,2.15 -0.64,3.17 0.87,1.8 0.52,2.23 0.01,0.83 -1.18,2.65 1.27,3.42 -0.5,1.08 -0.82,-0.4 0.95,2.98 -0.94,1.61 -0.17,2.27 0.69,3.36 0.49,1.02 1.14,1.5 2.3,1.8 2.47,2.54 0.93,2.34 -0.19,1.04 -0.02,-1.3 -0.6,0.17 -0.46,1.87 -2.38,2.98 0.16,1.1 -0.52,1.48 1.24,3.37 -0.16,1.33 -0.78,0.71 0.33,1.77 -0.22,0.4 0.01,-0.67 -1.61,0.65 0.08,1.02 -2.05,0.93 -0.29,1.51 -0.99,0.9 0.27,1.32 -0.44,1.34 -1,0.19 -0.35,-0.37 -0.49,0.56 0.59,1.13 0,1.75 -0.19,0.07 -0.06,-0.48 -0.65,0.02 -1.29,0.71 0.48,-0.05 0.39,0.4 -0.22,0.5 0.34,0.48 -0.57,0.17 -1.17,1.46 -0.19,0.77 0.28,0.42 -0.74,-0.22 0.12,0.38 -0.39,0.14 0.11,-1.11 -0.85,-0.16 -0.38,0.62 -0.94,-1.18 -0.52,0.52 1.06,0.8 -0.58,-0.11 -0.54,0.53 -0.87,0.09 -1,1.11 -1.37,-0.16 -0.59,0.85 -2.02,0.72 -1.4,-0.58 -0.4,0.44 -1.01,0.03 -1.21,-2.21 -0.31,0.09 -0.04,0.77 -1.49,0.05 -1.36,-0.69 -1.23,-0.15 -0.82,-0.51 -0.1,-0.46 -0.47,0.12 -0.09,-0.25 -0.81,0.83 -0.81,0.01 -0.43,-0.61 -0.44,0.56 2.31,0.27 -0.21,0.77 -1.01,0.48 0.02,0.31 1.54,0.02 0.23,0.27 -0.33,2.5 0.51,0.75 1.73,1.55 2.74,0.65 0.88,1.14 3.17,1.22 4.43,-0.54 2.95,0.26 2.18,0.77 0.65,1.02 1.21,-0.19 0.23,0.46 1.71,-0.51 0.09,-0.62 0.45,-0.05 0.74,-1.06 -0.44,-2.02 -0.35,-0.41 0.5,0.25 0.07,-0.28 -0.57,-0.2 0.8,-0.7 0.46,-1.03 0.33,0.25 0.15,-0.42 0.09,0.21 0.1,-0.27 1.87,-0.26 0.53,-0.38 0.84,-1.51 3.32,-1.82 0.89,-1.04 0.05,-0.88 1.69,-1.09 0.68,-3.66 -0.24,-1.89 1.57,-2.91 4.12,-4.2 0.37,-1.41 0.14,-5.43 -1.08,-3.54 -2.4,-3.06 1.07,-2.46 -0.16,-3.26 0.33,-0.99 0.9,-1.03 1.07,-0.66 4.1,-1.86 2.21,-0.32 3.21,-1.61 2.81,-0.28 0.54,0.31 0.61,2.02 0.08,0.95 -0.43,1.22 0.16,0.47 2.73,2.65 0.35,1.28 0.34,-0.02 -0.01,-0.44 0.42,0.13 1.19,1.58 -0.13,0.38 -0.63,-0.02 0.31,1.86 -0.93,1.65 0.33,0.69 0.66,-0.03 0.39,0.32 -0.92,2.56 0.02,3.17 0.61,1.11 -0.54,1.42 -0.74,-0.18 -0.36,0.63 0.75,1.07 1.56,1.14 1.15,0.45 1.11,1.28 -0.56,4.68 0.24,0.09 0.15,-1.53 0.43,-0.62 1.41,1.41 -0.4,-2.1 0.89,-0.72 1.66,-0.86 0.85,0.71 1.28,-0.19 -0.38,-0.25 0.32,-0.1 1.58,1.05 0.77,1.52 0.75,0.72 1.01,0.4 0.98,1.36 0.54,0.21 0.67,-0.19 -0.04,0.66 2.33,1.89 0.78,-0.22 1.34,0.63 -0.94,-0.66 0.5,-0.18 0.54,0.23 -0.4,-0.32 -1.7,0.26 -0.75,-0.38 -1.5,-1.22 -0.02,-0.72 -1.21,-0.07 -1.05,-1.5 -1.33,-0.62 -1.11,-2 0.23,-1.09 1.83,0.63 1.57,1.22 0.84,1.75 0.98,0.29 0.13,1.39 0,-1.56 -0.98,-0.29 -1.52,-2.5 -1.62,-1.41 -0.96,-0.35 0.21,-0.47 -0.96,-0.03 -0.33,0.71 -0.68,0.2 -0.73,-0.41 1,-0.12 0.1,-0.53 -0.31,-0.33 -0.82,0.28 -0.37,-0.61 -0.19,0.91 -0.42,-0.5 -1.69,0.41 -0.74,-0.81 -1.02,0.24 0.83,-0.66 -1.09,-0.29 -0.33,-0.85 -0.29,0.65 -0.57,0.29 -1.34,-0.76 -0.07,-2.09 0.39,-0.96 0.6,-0.16 -0.26,-0.37 -0.19,0.21 -0.26,-0.8 -0.06,-2.79 0.8,-1.36 0.92,-0.72 1.97,-0.02 1.14,-0.73 -0.82,-1.93 -0.51,-0.3 -0.77,-1.56 0.56,-0.24 -0.02,-0.48 -1.04,-0.47 -0.14,-0.34 -0.35,-1.32 0.23,-2.28 -0.6,-1.69 -0.11,-1.62 -0.32,-0.43 -1.93,-0.65 -0.86,-0.83 -1.95,-0.82 -0.71,-0.58 -1.25,-1.91 -1.62,-0.07 -2.39,-1.79 -1.07,-0.42 -3.55,-0.03 -1.98,1.84 -0.21,0.97 -2.66,0.37 -2.06,-1.02 -1.82,0.18 -1.83,1.19 -0.85,-0.37 -0.72,-2.1 0.76,-2.32 0.19,-2.15 -0.55,-1.93 -1.62,-2.36 -0.45,-2.68 0.83,-1.08 0.69,-2.71 -0.19,-0.45 0.48,-1.92 -0.2,-0.59 -0.55,-0.37 3.66,-6.26 0.57,-1.75 0.2,-2.39 -0.6,-1.92 -2.31,-3.61 0.15,-2.08 -1.35,-1.77 -1.07,-3.65 -1.98,-2.87 -1.77,-1.12 -0.56,-0.7 0.61,-1.35 2.41,-2.73 0.6,-1.34 0.4,-1.55 -0.49,-1.3 0.34,-0.72 1.81,-1.49 5.36,-2.94 2.27,-2.48 1.07,-1.8 0.57,-2.71 -0.06,-3.53 -0.71,-4.8 -0.61,-2.21 -0.82,-1.58 1.07,-1.65 0.5,-0.14 3.36,3.01 0.13,0.35 -0.53,0.4 -0.12,-0.54 -0.45,0.16 -0.2,0.83 2.48,4.07 -0.73,-0.08 -0.41,1.01 0.47,2.6 0.99,2.69 -0.26,0.58 -0.78,0.47 -0.48,1.38 -0.12,1.75 -0.58,1.54 0.38,0.75 -0.36,1.11 -0.66,0.12 0,-0.49 -0.25,0.65 0.18,1 -0.4,2.45 0.34,1.25 1.39,1.73 -0.38,1.47 0.63,1.29 -0.7,0.99 -0.06,1.03 -0.59,-0.24 -0.73,0.66 0.56,1.81 0.8,1 1.35,0.42 2.25,1.61 1.47,0.4 0.68,-0.19 0.87,0.42 2.37,-0.05 4.29,0.78 1.25,-0.24 2.57,0.8 0.88,1.7 0.16,1.68 2.9,1.05 0.25,0.46 0.24,-0.11 0.29,-2.31 -1.15,-1.08 -0.38,-1.22 0.41,-3.01 -1.87,-0.5 -0.62,0.7 -0.24,-0.74 0.46,-1.54 -0.56,-0.14 -0.31,0.15 0.38,0.44 -1.31,0.43 0,0.78 -0.83,-0.38 -0.45,-0.66 -0.31,-0.11 -0.13,0.24 0.47,0.33 -1.18,-0.42 -1.27,-1.13 -0.38,-1.3 -0.16,0.23 -0.19,-0.47 -0.6,0.3 -2.29,-1.19 -0.75,-1.13 -1.84,-1.15 -0.26,-0.66 0.08,-1.52 -0.97,-1.83 -0.65,-2.96 -0.61,-0.26 0.45,-0.55 0.75,-0.23 2.24,-2.57 2.96,-0.77 0.49,0.17 -0.13,0.5 0.44,0.62 1.3,0.91 1.29,1.28 1.05,1.61 0.69,0.42 1.63,0.11 2.01,-1.14 0.96,-1.91 -0.18,-1.29 -1.27,-2.07 -0.52,-0.33 -1.66,0.12 -1.52,0.99 -0.82,-0.23 -0.11,-0.92 0.83,-1.74 -0.41,-0.69 0.57,-0.07 0.71,0.64 0.38,-0.07 1.33,-2.74 1.38,-0.69 0.11,-0.45 0.76,0.37 0.25,-0.28 0.42,0.08 0.2,0.46 1.85,0.95 0.15,0.55 0.06,-0.69 -0.69,-0.14 -0.57,-0.81 0.84,-0.95 0,0 1.36,2.52 -0.12,1.33 2.16,2.24 2.09,1.57 1.63,0.25 2.16,-0.37 0.71,0.88 1.4,0.45 2.28,1.66 0.45,1.18 -0.2,0.53 -1.56,0.52 -0.59,3.01 -0.96,1.44 -1.36,0.66 -2.86,0.08 0.14,2.2 -0.23,0.76 -0.59,0.26 -0.17,0.84 0.51,2.33 0.64,0.57 0.84,0.07 2.47,3.4 2.49,1.21 2.44,0.75 0.55,1.04 0.21,2.8 0.77,1.65 -0.62,2.19 1.25,1.4 -1.19,3.29 1.09,1.25 0.12,0.42 -0.33,0.57 -0.82,-0.08 -1.18,-0.93 -1.56,-0.03 -0.86,0.43 -0.05,0.71 -3.55,3.53 -1.08,2.11 -0.12,-0.59 -0.56,-0.22 -0.5,-0.12 -0.32,0.49 -0.07,1.44 -1.41,2.3 -1.53,1.51 0.26,1.18 0.84,1.6 -0.25,1.75 2.84,0.62 1.35,4.51 0.55,0.12 0.78,1.37 0.85,0.47 2.2,-0.19 1.87,0.78 0.94,-0.11 2.34,1.8 0.88,0.08 1.69,-1.04 0.96,0.26 0.73,-0.17 0.61,-0.64 0.23,-0.95 -0.15,-1.25 0.51,-0.86 2.04,1.5 0,1.1 -1.08,1.51 0.14,0.74 2.34,0.87 1.43,0.14 0.5,0.96 -0.79,0.99 0.98,1.88 0.51,2.69 1.73,1.75 0.33,0.99 0.12,1.1 -1.6,1.08 0.43,2.61 0,0 -0.15,3.04 0,0 -1.19,0.85 -0.23,1.64 -1.01,1.23 -0.1,2.73 -1.2,0.4 -0.98,-0.44 -1.29,0.52 -0.71,-0.03 -0.3,0.34 1.21,2.54 1.01,0.75 0.3,1.92 1.99,2.03 0.05,0.69 -0.58,1.2 0.17,2.06 -1.35,1.61 6.36,5.85 0.13,1.04 1.15,0.74 0.81,2.4 -0.27,0.88 -0.69,0.55 -0.79,1.3 0.07,0.81 1.85,2.23 1.64,3.33 -0.99,0.7 -0.02,0.88 -0.67,0.7 0.24,0.83 0.97,1.26 0.24,1.9 0.44,0.59 0.88,0.27 1.46,-0.35 2.52,1.74 0.34,0.81 -1.28,0.76 1.68,0.56 0.96,0.85 0.76,3.72 -1.71,1.61 -0.54,1.19 0.79,1.88 -0.48,1.04 0.29,0.43 2.09,0.21 2.59,-0.49 0.18,0.54 -0.6,0.71 1.03,0.36 0.68,0.8 0.7,0.12 1.5,-1.08 0.91,0.38 0.2,0.41 0.68,0.07 0.77,3.58 -0.74,1.33 0.69,1.48 -0.18,0.62 0.54,1.64 -0.03,3.52 -1.97,1.45 -1.32,1.44 -1.05,0.59 -0.3,2.76 -1.38,1.43 0.21,0.75 1.4,0.79 0.79,1.82 0.68,-0.12 0.43,0.26 -0.33,1.79 0.16,0.72 -0.38,0.53 0.59,1.5 -0.18,0.79 -0.4,0.32 -0.19,1.3 -1.12,0.96 -0.53,1.33 -1.69,1.69 -0.59,1.4 -0.3,2.05 -2.38,2.8 -0.51,1.34 0,0 -1.35,-1.38 -0.13,-1.02 -0.63,-0.71 -0.79,0.08 -1.33,-2.19 -0.87,-0.36 -1.29,0.98 -0.1,-0.82 -1.1,1.13 -1.65,-0.49 -0.87,-0.68 -0.19,-1.13 -2,-0.63 -0.04,-1.73 -2.81,0.08 -1.95,-1.1 -0.63,0.12 -0.4,0.55 -0.38,1.31 -0.57,0.16 -0.68,-0.4 -1,-1.5 -0.74,0.31 -1.19,-0.77 -0.34,-0.45 0.25,-0.84 -1.94,-2.03 -0.56,-1.38 -0.26,-0.06 -2.16,0.84 -0.33,1.52 -0.75,0.09 0.03,0.3 -1.98,1.86 -1.91,0.49 -0.89,3.51 -4.84,0.22 -2.6,-0.53 -3.8,0.62 -1.58,0.73 -1.52,-0.71 -3.22,-2.51 -1.69,-1.81 -0.79,-1.96 -0.55,-0.54 -1.61,-0.55 -1.17,0.05 -1.23,1.01 -0.49,0 -0.68,-0.93 -3.17,-1.45 -3.68,0.47 -1.75,0.66 -3.67,0.27 -1.61,-1.8 -0.97,-0.5 -4.6,-0.01 -0.76,-0.44 -0.96,-1.62 -0.54,-0.29 -0.45,-1.36 -1.17,-0.1 -0.4,0.11 -1.33,1.91 -1.28,0.25 -2.51,-0.32 -0.94,0.83 -2.94,0.74 -0.81,-3.41 -0.07,-2.53 -0.88,-1.55 -0.54,-0.38 -3.04,-0.09 -0.33,-1.81 -1.71,-3.25 0.61,-0.39 0.55,-0.98 -0.09,-0.92 -0.33,-0.62 -1.8,-1 -1.2,-1.48 -3.29,0.51 -0.34,-0.95 -2.6,0.11 -0.91,-1.01 -1.58,-0.19 -1.21,0.39 0.68,1.39 -0.64,1.01 -0.07,1.44 -3.12,-1.69 -2.64,2.41 -2.42,1.59 -0.5,-0.93 -3.27,0.46 -0.38,-1.19 -1.82,-0.49 -0.69,-0.72 -0.28,-0.88 0.84,-2.6 -0.44,-1.15 -0.51,-0.42 -3.03,0.95 -1.6,-1.28 -4.45,0.53 -2.23,0.86 -2.45,0.32 -1.57,0.78 -0.76,-0.18 -0.67,0.56 -2.78,-0.02 -1.71,1.38 -1.29,0.29 -1.26,-1.11 -0.53,-2 -2.63,-1.2 -1.3,0.67 -2.11,-1.39 -0.22,-0.86 1.59,-1.11 0.65,-1.63 -0.95,-2.25 0.54,-1.29 0.4,-5.25 -1.31,-0.57 -1.68,-1.35 -0.16,-1.46 -0.97,-2.01 -1.71,-1.71 0,0 5.11,-2.69 0.1,-0.95 0.76,-0.96 -0.44,-1.01 0.55,-0.32 0.2,-0.79 0.54,-0.46 0.34,-1.32 1.14,-1.11 0.72,0.34 -0.6,-1.68 0.51,-0.58 0.59,-1.78 1.55,-0.43 1.43,-1.03 1.54,-1.92 1.88,0.01 0.58,-0.85 1.41,-0.7 0.28,-1.13 1.13,-0.54 0.88,-0.03 1.69,-1.44 -0.46,-3.09 0.94,-0.5 0.96,-1.73 1.91,-1.4 1.19,-1.78 2.12,-0.88 0.65,-0.8 0.11,-0.82 -0.63,-1.21 -1.72,-0.64 0.64,-1.11 0.48,-0.25 1.59,0.41 0.45,-0.46 -0.45,-1.47 -1.28,-1.12 0.63,-0.87 0.11,-0.83 -0.42,-0.95 -1.35,0.08 -1,0.61 -1.2,0.09 -1.39,-1.3 -0.34,-5.97 1.09,-1.53 0.01,-0.88 0,0 1.35,-1.36 0.26,-1.02 -1,-2.35 0.33,-1.06 -1.25,-0.7 0.01,-0.89 -0.97,-0.61 -1.37,0.17 -1.68,-1.61 -0.55,-0.27 -0.26,0.72 -0.89,-0.74 0.27,-0.56 -0.6,-1.55 1.13,-0.79 0.27,-0.56 -0.19,-1.71 0.45,-1.15 0.81,-0.8 0,0 1.36,0.15 1.08,1.22 1.38,0.71 5.2,1.62 1.49,1.44 1.11,1.85 -1.1,-1.58 -1.75,-1.52 -1.35,0.03 -0.21,-0.51 -0.51,-0.06 -0.19,0.3 -0.41,-0.41 -0.18,0.2 0.08,-0.45 -0.82,0 -0.68,-0.46 1.71,1.68 0.68,-0.17 0.71,0.37 -0.24,0.04 0.91,0.17 1.02,0.96 0.45,-0.18 0.1,0.67 0.53,0.49 1.91,1.02 3.67,1.25 -0.7,0.5 0.13,0.79 0.37,0.09 0.67,1.34 1.15,0.42 -0.35,0.19 0.59,0.03 1.95,2.06 0.21,0.66 0.75,0.52 0.1,0.18 -0.87,-0.34 0.56,0.76 -0.02,0.44 0.13,-0.32 0.54,-0.06 1.77,0.99 0.64,0.69 0.34,0.93 -0.36,0.64 -0.34,0.03 0.1,1.21 0.49,-0.01 0.31,0.54 -0.34,0.98 0.23,-0.05 -0.07,-0.46 1.67,-1.64 0.68,-0.08 -0.51,-0.32 0.59,-0.7 -0.23,-0.14 0.1,-0.94 2.31,-4.81 0.83,-3.37 0.67,-0.64 -0.13,-0.98 -1,-0.43 0.55,-0.25 0.16,-0.8 -0.48,-0.07 -0.9,0.63 -0.87,0.06 -1.01,-0.46 -1.21,-1.27 -0.41,-1.37 -1.98,-3.31 -0.64,-2.25 0.68,-0.82 0.26,-2.97 -0.83,0.07 -0.11,0.44 0.3,0.24 -0.61,0.25 -1.24,-0.7 -1.08,-1.46 -0.93,-0.46 -0.04,-0.28 -0.95,0.21 -2.48,-1.87 -0.47,0.4 0.33,0.77 -0.89,0.45 0.46,-0.84 -0.64,0.78 0.09,0.82 0.51,1.04 0.29,-0.02 -0.11,0.24 -0.38,0.18 -0.72,-1.34 -0.03,-5.64 0.92,-3.72 0.21,-0.19 0.34,0.43 -0.54,0.33 0.08,0.71 1.06,0.39 1.27,-0.43 1.02,-1.25 -0.5,-1.7 -0.48,-0.39 -0.34,-1.86 -0.89,-0.01 0.7,-3.4 0.98,-1.6 -1.1,-1.75 0.37,-1.67 0.85,-1.26 z m 52.33,-55.94 1.52,1.33 -1.03,-0.91 -0.34,0.18 -0.67,3.33 0.48,1.5 -0.53,0.66 -0.46,-0.18 0.27,-0.52 -0.57,0.25 -0.87,-0.63 -0.2,-0.7 -0.27,-0.05 -0.04,0.31 -0.26,-0.2 -1.36,-1.78 0.77,-2.24 0.87,-0.75 0.8,-0.13 1.89,0.53 z m -24.22,-5.06 0.48,-0.24 0.42,-0.84 1.43,2.99 0.11,1.33 -2.01,0.05 -1,1.02 -0.98,0.42 -1.35,-0.23 -2.22,1.3 -1.18,1.12 -1.74,-0.1 -0.27,-0.3 0.06,-0.61 -0.51,-0.5 0.07,0.48 -0.57,0.19 0.69,1.12 -1.22,-0.12 -0.09,-1.56 0.78,-5.39 -0.23,-2.59 2.93,-1.73 2.72,-0.72 0.88,0.04 2.64,1.64 -0.14,0.31 0.78,0.9 0.15,1.03 -0.63,0.99 z" title="Ямало-Ненецкий автономный округ" id="RU-YAN" />
                                <path d="m 115.13011,527.02082 5.68,-3.19 1.6,-2.54 1.41,0.53 0.49,-0.86 0.87,-0.38 0.83,0.6 0.42,-0.03 0.42,0.71 0.63,0.32 2.83,-0.39 0,0 -0.15,1.76 1.63,2.89 -0.16,0.64 0.44,0.48 0.82,0.18 0.39,0.93 -0.4,1.68 1.05,0.57 0.62,-0.88 0.24,0.48 -0.14,1.46 1.29,0.43 0.75,1.37 1.16,-0.08 0.77,0.57 1.58,0.33 0.39,-0.64 2.02,0.3 0.85,-0.95 0.95,0.03 0.71,0.89 0.97,0.33 1.23,-0.63 1.1,0.18 0.48,-1.07 0.41,-0.07 1.25,0.59 0.83,-0.4 1.88,1.5 1.39,0.09 1.16,-0.68 0.62,-0.87 -0.33,-1.01 1.51,-1.08 0.27,0.67 0.94,0.48 0.41,-1.21 1.43,1.14 0.53,-0.6 0.42,0.82 1.71,0.97 0.72,-0.64 0.42,0.02 0.48,-0.86 0.67,-0.18 0.98,0.68 1.12,1.46 0.92,-1.32 1.45,0.63 0.97,-0.27 0.13,-0.76 0.9,-1.05 0.79,-0.22 0.13,-0.84 1.91,-0.78 0.99,0.05 0.23,0.38 -0.18,0.27 0.55,0.67 6.97,0.71 0.57,-4.34 3.74,0.51 -0.49,1.94 1.94,1.1 2.2,-0.15 1.03,-0.94 1.09,1.03 0.95,-0.1 0.38,0.23 -0.39,0.9 0.52,0.46 1.85,0.07 0,0 -0.5,1.48 0.48,2.44 -1.29,1.36 -0.63,3.25 -0.36,0.31 -0.66,-0.17 -2.36,0.39 0.63,1.73 2.23,1.11 0.83,-0.22 1.42,-1.41 -0.28,2.72 -0.84,2.42 1.59,0.65 0.22,0.52 -0.11,1.48 0,0 -2.32,-0.09 -0.41,0.51 -0.6,0.12 -0.14,-0.43 -1.51,0.12 -0.33,1.34 0.31,0.42 -0.24,1.37 -1.55,0.18 -0.28,0.49 -0.57,-0.1 -0.87,2.02 -1.16,-0.1 -0.51,-0.43 -0.19,0.4 -2.51,-0.39 -0.33,0.51 -1.54,-0.04 -0.49,0.96 -3.51,-0.55 -1.38,0.33 -0.04,-0.41 -0.84,-0.2 -0.16,-0.61 -1.13,0.37 -0.81,-0.42 -0.7,0.07 -0.02,-0.81 -1.32,0.65 0.1,0.41 -0.56,0.29 -0.26,-1.69 -1.14,0.48 0.04,0.73 -0.3,0.12 -0.24,-0.38 -0.2,0.17 -0.69,-0.61 -0.62,0.46 0.03,0.33 -1.03,0.3 -0.3,-0.26 -0.03,0.73 -0.38,0.13 -0.71,-1.26 -0.35,-0.01 -0.51,-1.24 -1.69,0.37 -0.44,0.49 -0.55,-0.7 -0.21,-1.28 -1.01,-0.27 -0.73,1.99 0.99,0.67 -0.12,1.75 -0.4,0.12 -0.23,-0.26 -0.34,0.6 -0.99,-0.16 -1.16,0.37 -1.61,1.07 -0.39,0.61 -0.29,-0.8 -0.35,0.21 0.01,0.38 -0.57,0.55 0.48,0.34 0.02,0.76 -0.3,-0.17 -0.44,0.87 0.77,0.91 -0.55,1.05 -0.53,0.1 -0.71,0.72 0.18,0.6 -0.27,-0.15 -0.35,0.34 0,0 -0.97,0.18 0,-0.46 -0.37,-0.15 -1.28,0.01 -0.33,0.26 -0.32,-0.29 -0.41,0.53 -0.75,-0.44 -0.25,0.35 -1.46,-0.85 -0.22,-0.48 0.43,-0.11 -0.08,-0.42 -1.83,-1.45 -0.3,-0.85 -0.81,0.2 -0.48,-1.03 -0.95,0.24 -2.68,-1.14 -0.39,0.41 -0.59,-0.49 -0.37,0.45 0.34,1.23 -0.42,0.77 0.13,0.41 -0.39,0.33 -0.61,-0.33 -0.91,0.18 0.04,-0.28 -0.33,-0.09 -0.57,0.03 -0.04,0.51 -0.83,0.26 -3,-0.35 -0.32,0.45 -0.24,-0.3 0.03,0.52 0.46,0.48 -0.58,0.16 0.2,0.24 -0.25,0.55 -0.37,-0.25 0.09,-0.26 -1.18,-0.32 -0.29,2.07 -0.3,-0.27 -0.26,0.29 0,0 -3.84,-4.85 -0.27,0.4 -0.7,-0.34 -0.82,0.56 0.52,0.94 -1.36,0.33 -0.22,1.07 -0.39,0.03 -0.62,1.51 -0.58,-0.09 0,0 -0.95,-0.12 -0.37,-0.34 -0.06,-0.6 -0.48,-0.35 -0.07,-0.68 -0.49,-0.61 -2.17,-0.84 -0.51,-0.68 -0.39,0.21 -1.27,-0.74 -0.62,-0.01 -0.95,1.36 -0.14,-1.03 -0.65,0.4 0.27,-1.97 -1.79,-0.54 -0.31,-0.27 0.42,-0.33 -1.46,-0.72 0,0 -0.21,-0.45 0.27,-0.12 -0.03,-0.58 1.08,-1.36 0.59,0.67 0.34,-0.58 0.61,0.19 0.72,-0.74 0.8,0.01 0.23,-1.03 0.62,-0.87 -0.59,-0.68 1.01,-1.24 -0.04,-1.36 0.83,0.61 -0.13,-1.25 -1.37,-0.29 -0.19,-0.46 0.07,-2.51 0.49,-0.6 -2.42,-0.91 0.41,-0.41 0.02,-0.57 -0.65,-0.53 0.14,-1.64 0.55,-0.77 0.74,-3.58 -0.33,-1.81 -0.67,-1.53 0.82,-1.05 0.44,-0.15 0.82,0.4 0.45,-0.54 0.31,-0.79 -0.54,-0.43 -0.03,-0.5 0.98,-0.81 0.38,-1.06 z" title="Вологодская область" id="RU-VLG" />
                                <path d="m 134.26011,647.82082 1.54,-0.95 0.83,0.25 0.43,-0.95 0.62,0.3 0.37,-0.29 0.56,0.2 0.43,0.83 0.7,0.43 0.46,-0.2 0.17,-1.05 2.05,0.09 0.66,0.33 0.17,1.1 1.42,0.53 1.1,-0.01 0.44,-0.55 4.3,0.21 0,0 2.81,0.8 0.26,0.48 -0.19,1.19 0.47,0.35 1.82,-0.18 0.61,-0.72 1.86,0.32 1.03,0.65 0.68,-0.23 0.69,0.79 0.85,0.01 0.53,0.36 0.22,-0.79 0.69,0.05 0.56,1.13 0.58,-0.36 0.68,0.34 0,0 0.51,0.62 1.38,0.43 0.33,0.42 0.35,0.63 0.1,1.57 0,0 -1.42,0.36 -0.45,0.67 -1.37,0.03 -0.75,0.36 -2.99,-0.28 -0.87,1.07 -0.27,0.93 -1.13,0.72 -0.55,-0.07 -0.55,0.52 -0.1,0.72 -1.31,0.3 -0.21,0.32 0.97,0.55 1.52,1.82 -0.64,0.33 0.16,2.16 -0.87,1.54 0,0 -0.28,1.35 -1.96,1.81 -1.06,2.46 -1.92,0.54 -0.89,0.56 -2.2,-0.48 -0.54,0.68 0,0 -0.54,-0.63 -1.26,0.24 -0.31,0.41 -0.85,-0.1 -1.04,-0.7 -0.27,-1.2 -1.14,-0.26 -0.61,0.28 -0.73,-0.32 -0.27,-0.59 0,0 0.45,-0.31 0.6,-1.59 -0.07,-0.58 -0.84,-0.78 -0.44,-1.93 0.23,-0.55 -0.58,-1 0.53,-0.69 -0.29,-0.69 0.67,0.03 0.12,-0.36 -1.09,-0.41 -0.46,-0.7 -0.53,0.03 -0.58,-0.75 0.11,-0.52 -0.75,-0.41 0.2,-0.94 0.73,0.25 0.25,-0.31 -0.53,-0.56 0.17,-0.81 -0.66,-0.59 -0.94,0.82 -1.58,-0.53 -0.09,-0.79 0.64,-0.39 0.04,-0.56 -0.2,-0.43 -1.27,-0.35 0,0 0.26,-0.88 -0.28,-1.39 -1.11,-2.02 1.83,-0.46 0.57,0.39 0.71,-0.69 -0.97,-0.51 0.15,-0.82 -0.3,-0.75 z" title="Воронежская область" id="RU-VOR" />
                                <path d="m 129.15011,565.66082 0.26,-0.29 0.3,0.27 0.29,-2.07 1.18,0.32 -0.09,0.26 0.37,0.25 0.25,-0.55 -0.2,-0.24 0.58,-0.16 -0.46,-0.48 -0.03,-0.52 0.24,0.3 0.32,-0.45 3,0.35 0.83,-0.26 0.04,-0.51 0.57,-0.03 0.33,0.09 -0.04,0.28 0.91,-0.18 0.61,0.33 0.39,-0.33 -0.13,-0.41 0.42,-0.77 -0.34,-1.23 0.37,-0.45 0.59,0.49 0.39,-0.41 2.68,1.14 0.95,-0.24 0.48,1.03 0.81,-0.2 0.3,0.85 1.83,1.45 0.08,0.42 -0.43,0.11 0.22,0.48 1.46,0.85 0.25,-0.35 0.75,0.44 0.41,-0.53 0.32,0.29 0.33,-0.26 1.28,-0.01 0.37,0.15 0,0.46 0.97,-0.18 0,0 0.8,0.39 0.19,1.11 0.74,0.95 -0.52,0.68 -0.72,0.24 -0.67,1.11 -0.51,0.28 0.3,0.74 -1.16,0.84 0.08,1.46 -1.07,0.81 0.55,1.36 -0.63,1.25 0.6,1.09 -0.21,0.4 -0.51,-0.27 -0.18,0.41 -0.32,-0.31 0.08,0.64 -0.58,0.15 0.15,0.58 -0.43,0.25 0.12,1.99 0.49,0.6 0,0 -0.59,0.34 -1.74,-0.17 0.73,0.44 -0.5,0.33 0.01,0.41 -0.36,0.06 -0.5,-0.49 -0.31,0.13 -0.54,0.58 -0.41,0.02 -0.68,0.92 -0.18,-0.18 -1.04,0.62 0.04,0.4 -0.4,-0.01 -0.42,0.45 0.5,0.79 -0.85,0.35 -0.17,0.89 -0.38,-0.01 0.18,1 0,0 -0.59,0.95 0.07,0.71 0.24,0.03 -0.48,0.72 0.11,0.42 -0.51,0.18 -0.98,-0.73 -0.37,0.47 -1.03,0.01 -0.59,-0.66 -0.58,-0.09 -1.15,0.77 -0.47,-0.15 -0.1,-0.96 -0.78,-0.73 0,0 -0.79,-0.92 0,0 -0.37,-0.56 -0.34,0.05 -0.27,-0.9 0.36,-0.95 -0.61,-0.31 0.98,-0.32 0.28,-0.39 -0.44,-0.94 0.34,-0.49 -0.43,-0.14 -0.22,-0.48 0.02,-0.76 0.54,0.1 0.53,-0.75 -0.29,-1.08 -0.57,0.01 -0.21,0.44 -0.58,0.17 -0.52,-0.16 -1.28,-1.44 -0.17,-1.91 -0.92,-0.72 -0.43,-1.11 -0.55,-0.63 -1.4,-0.5 0.56,-0.76 -0.43,-0.01 -0.01,-0.45 1.02,-0.01 -0.43,-0.39 -0.96,0.09 0.07,-0.49 1.36,-0.51 0.29,-0.89 0.82,-0.11 -0.92,-1.4 -0.89,-0.03 -0.28,-0.68 -0.55,-0.14 0.94,-0.94 -0.46,-0.51 0.47,-0.68 0.41,0.13 0.29,-0.42 0.38,0.06 0.16,-0.4 z" title="Ярославская область" id="RU-YAR" />
                                <path d="m 801.46011,678.32082 0.67,0.3 1.95,-1.28 0.74,0.17 0.36,0.46 0.47,-0.11 -0.04,-0.79 0.38,-0.23 0.15,-0.78 0.78,-0.33 1.64,0.83 0.07,1.03 0.57,0.44 0.62,-0.35 0.7,0.21 0.63,-0.33 0.34,0.89 1.69,0.12 0.87,0.48 0.68,3.08 1.17,1.24 2.37,1.07 3.09,0.5 1.09,-1.1 0.47,0.03 0.44,0.59 0.44,0.08 0.41,0.84 0.26,-0.33 0.67,0.46 0.57,-0.32 0.87,0.31 -0.24,1.3 -0.71,0.46 -1.73,-0.52 -1.61,1.13 0,0 -1.74,0.44 -0.28,0.58 -0.82,0.19 -0.19,0.8 -0.64,-0.13 -2.01,1.33 -2.44,-0.33 -0.92,0.52 -0.17,0.41 -0.94,0.2 -0.51,0.78 -0.98,-0.21 -0.77,2.46 -1.75,-0.38 -0.52,0.49 -1.76,0 -0.24,0.43 -1.17,-0.05 -0.76,-0.4 -0.75,0.5 -1.06,-0.87 -2.98,0.6 -0.54,-0.37 -0.01,-1.05 -0.64,-1.21 -1.33,-1.18 -0.19,-0.63 1.25,-2.13 -0.67,-1.31 0.17,-0.77 -0.98,0.08 -0.14,-1.01 -0.54,-0.37 1.09,-2.56 -0.27,-0.32 -0.51,0.19 0,0 0.3,-0.49 1.28,-0.77 1.23,-0.18 0.33,-1.07 1.02,-1.55 0.53,-0.29 z" title="Еврейская автономная область" id="RU-YEV" />
                                <path d="m 733.14011,630.54082 -3.02,1.2 -0.86,0.01 -0.72,0.49 -0.69,0.1 -0.37,-0.34 -1.43,0.18 -1.36,1.35 -0.39,0.82 -0.7,0.4 -1.78,2.43 -1.82,1.12 0.2,0.79 -0.22,0.87 0.26,0.56 0.87,0.08 0.63,-0.5 1.31,-0.26 1.92,1.16 -0.79,2.29 0.07,0.41 0.98,0.8 -0.14,0.44 0.29,0.56 -0.26,0.93 -0.44,0.42 0.2,0.52 -0.44,0.81 -0.64,0.19 -0.13,0.38 -0.47,-0.05 -0.14,0.46 -2,1.87 -0.59,0.05 -0.36,1.44 -0.51,0.71 0.11,0.44 -0.62,0.77 0.2,0.35 -0.88,0.82 0.03,0.72 -0.36,0.02 -0.1,1.46 -1.66,2.09 -0.24,1.89 -1.48,1.53 -0.24,1.72 -0.89,0.74 0.44,0.44 1.25,0.06 0.11,0.32 -0.37,0.39 0.34,1.14 -0.3,0.78 -0.97,1.07 -4.47,0.92 -0.56,1.02 -0.7,0.11 -0.06,0.53 -1.01,0.48 -0.57,0.8 -0.34,-0.01 -1.84,1.72 -2.7,-1.35 -1.46,-0.04 -2.44,-1.03 -1.63,-1.2 -0.72,-1.19 -2.67,-1.02 -1.27,0.27 -2.13,1.34 -2.58,-0.17 -1.16,-0.85 -1.96,-2.39 -1.84,-0.66 -1.82,0.09 -0.76,-0.43 -2.25,1.09 -1.19,1.13 -0.64,-0.06 -2.05,1.28 -2.12,1.8 -0.7,2.19 -2.48,1.35 -1.73,-0.6 -4.15,1.66 -1.72,-0.1 -1.38,0.67 -0.88,-0.33 -1.77,0.96 -1.27,1.12 -1.21,0.4 -1.36,-0.16 -1.42,-1.06 -0.52,0.74 -0.75,0.29 -2.4,-0.49 -0.31,0.2 -0.63,-0.39 -1.55,0.01 -0.4,-0.68 -1.9,-0.8 -1.27,0.27 -0.55,-0.25 -3.02,0.25 -1.86,-2.11 -1.05,-0.34 -0.81,-0.62 -0.09,-0.66 -0.48,-0.02 0.26,-0.74 -0.25,-1.24 0.2,-0.72 -0.86,-0.01 -0.81,-0.68 0,0 -0.16,-0.94 1.33,-0.88 0.56,-1.34 0.59,0.09 0.92,-0.82 0.8,-0.14 1.1,-0.75 1.06,0.28 0.35,-0.82 -1.03,-0.11 -0.58,-0.81 -1.71,-0.58 -0.73,-0.75 0.17,-0.52 0.95,-0.5 0.34,-2.94 1.06,-0.27 0.77,-0.7 -1.27,-1 0.6,-1.11 0.21,-1.3 0.38,0.19 0.33,-0.22 0.08,-1.02 0.84,0.58 2.46,-0.14 0.09,0.43 1.28,0.66 2.76,-0.88 1.23,-1.32 1.16,-0.6 2.78,0.09 0.43,0.82 1.75,0.2 1.1,-0.83 0.22,-1.07 0.93,-0.66 0.51,-0.92 4.16,-1.63 3.12,-3.95 0.67,-0.18 0.3,0.41 1.54,0.33 0.8,-1.19 0.6,-0.26 2.32,0.13 1.42,-1.2 3.17,-0.34 1.49,-1.78 2.09,-0.6 1.21,-1.7 0.11,-1.24 0.31,-0.16 0.23,-1.5 -1.12,-0.18 -0.27,-0.3 0.47,-0.47 -0.14,-0.73 -0.53,0.06 -1.14,-0.88 -0.01,-0.95 -0.69,-0.67 -0.01,-2.46 0.99,-1.19 2.43,-0.83 0.21,-0.39 1.04,0 0.87,-1.62 1.71,-0.65 2.64,-2.35 1.68,-0.93 0.78,-1.48 5.12,-1.51 1.54,0.15 0.31,-0.3 1.24,-0.15 0.72,-0.94 -0.01,-0.72 0.4,-0.29 0.6,-2.22 -0.9,-2.56 -1.47,-1.02 -1.49,-2.21 -1.64,0.11 -1.6,-0.55 -0.24,-3.58 -0.51,-1.52 0.2,-1.66 -0.61,-1.34 0.42,-1.94 -1.03,-2.43 0.01,-0.8 0.6,-0.17 -0.09,-0.44 -0.35,-0.25 -0.34,-1.15 -1.63,-0.88 1.17,-1.19 -0.21,-1.86 1.16,-1.07 0,0 0.32,-0.1 1.59,0.88 0.81,0.76 0.8,-0.55 0.41,0.07 1.14,1.01 1.8,0.11 0.35,0.32 0.76,-0.55 0.76,0.1 -0.12,-0.52 0.68,0.23 0.29,-0.18 0.38,-0.97 0.81,-0.8 1.01,1.45 0.49,-0.25 0.47,0.31 0.32,-0.63 -0.18,-0.66 0.38,-0.19 0.39,-1.54 -0.62,-1.13 0.77,-0.34 0.3,-0.96 0.48,-0.25 -1.22,-0.63 -0.46,0.06 -0.11,0.57 -0.83,0.58 -0.45,-0.39 0.4,-0.6 -0.13,-0.49 -0.58,0.05 0,-1.42 -0.6,-0.41 -0.25,-0.61 0.59,-1.29 -0.85,-0.07 -0.38,-0.62 0.39,-0.76 -0.25,-0.87 -0.44,-0.3 0.35,-0.4 1.24,0.06 0.21,-0.58 0.36,-0.1 -0.21,-0.53 0.45,-1.8 -0.16,-0.8 0.38,-0.59 0.53,0.58 0.45,-0.18 -0.31,-1.41 -0.74,-0.55 0.25,-0.57 1.14,-0.47 0.57,-0.78 0.61,-0.03 1.56,0.69 0.58,-0.27 0.74,0.19 0.78,0.57 1.06,1.51 1.38,0.67 3.24,-0.64 0,0 0.32,2.39 -0.39,0.87 -0.51,3.45 0.75,0.4 0.24,0.65 -0.13,1.08 0.4,0.73 0.4,-0.33 0.04,-0.84 0.48,-0.2 0.96,0.49 -0.39,2.14 1.95,3.38 -0.44,0.57 0.25,1.83 1.04,0.99 0,0 0.07,0.39 -1.21,1.18 0.08,0.42 1.34,0.72 0.13,0.33 -0.41,0.29 -0.07,0.58 1.12,0.86 0.12,0.57 2.41,0.5 -0.18,0.87 0.72,0.27 -0.01,0.69 0.97,0.51 -0.22,0.38 -2.01,0.31 -0.87,0.85 0.11,3.15 0.25,0.25 1.28,-0.52 0.49,0.53 0.63,-0.09 0.56,-0.45 0.66,0.01 0.55,-0.62 0.57,-0.02 0.45,-0.56 2.67,0.08 0.33,0.47 -0.02,1.47 0.39,0.5 -0.21,1.06 0.51,1.74 -0.24,0.65 0.44,0.61 1.29,0.29 0.55,-0.41 0.38,-1.16 0.5,-0.04 1.11,0.89 0.43,0.93 0.15,0.97 -0.52,2.25 0.92,0.22 -0.64,0.62 0,1.54 -1.74,1.85 -0.28,1.12 0.07,0.56 0.46,-0.48 0.85,-0.18 0.23,0.54 -0.24,0.97 0.48,1.15 0.39,0.64 0.78,0.43 -0.1,0.48 -1.32,0.63 -0.48,-0.01 -0.26,-0.64 -0.65,0.42 -0.3,0.56 0.52,2.13 -0.69,0.93 -0.07,0.96 0.73,1.09 0.19,-0.4 0.31,0.17 1.06,1.87 0.05,3.22 0.38,0.24 0.34,1.35 0,0 z" title="Забайкальский край" id="RU-ZAB" />

                            </svg>

                            {mapTooltip.show && (
                                <div
                                    className="map-tooltip"
                                    style={{
                                        position: 'absolute',
                                        left: mapTooltip.x,
                                        top: mapTooltip.y,
                                    }}
                                >
                                    {mapTooltip.text}
                                </div>
                            )}
                        </div>
                        <div className="map-modal-footer">
                            <button className="close-btn-grey" onClick={() => setIsReadinessMapModalOpen(false)} type="button">
                                Закрыть
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Модальное окно выполнения жёстких квот выборки */}
            {isQuotaDetailModalOpen && (
                <>
                    <div className="modal-bg" onClick={() => setIsQuotaDetailModalOpen(false)}></div>
                    <div className="quota-detail-modal">
                        <nav className="window-map-navigation">
                            <div className="map-title">Выполнение жетских квот выборки</div>
                            <div className="close-btn" onClick={() => setIsQuotaDetailModalOpen(false)}>
                                <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#292929" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </nav>
                        <div className="quota-detail-body">
                            <div className="quota-detail-table-container">
                                <table className="quota-detail-table">
                                    <thead>
                                        <tr className="quota-detail-header-row-1">
                                            <th rowSpan="2" className="quota-detail-corner"></th>
                                            <th rowSpan="2" className="quota-detail-header-opros">
                                                <div className="quota-header-stacked">
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                            </th>
                                            <th colSpan="4">женский</th>
                                            <th colSpan="4">мужской</th>
                                            <th rowSpan="2">всего</th>
                                        </tr>
                                        <tr className="quota-detail-header-row-2">
                                            <th>старше 60 лет</th>
                                            <th>50-59 лет</th>
                                            <th>30-49 лет</th>
                                            <th>18-29 лет</th>
                                            <th>старше 60 лет</th>
                                            <th>50-59 лет</th>
                                            <th>30-49 лет</th>
                                            <th>18-29 лет</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            'город более 1 млн человек',
                                            'город от 500 тыс до 1 млн человек',
                                            'город от 100 тыс до 500 тыс человек',
                                            'город от 50 тыс до 100 тыс человек',
                                            'Всего',
                                        ].map((rowLabel, rowIdx) => (
                                            <tr key={rowIdx}>
                                                <td className="quota-detail-row-label">{rowLabel}</td>
                                                <td className="quota-detail-cell opr">
                                                    <span className="quota-cell-interviewed">Опрошено</span>
                                                    <span className="quota-cell-plan">План</span>
                                                </td>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((colIdx) => (
                                                    <td key={colIdx} className="quota-detail-cell col">
                                                        <span className="quota-cell-interviewed">-</span>
                                                        <span className="quota-cell-plan">-</span>
                                                    </td>
                                                ))}
                                                <td className="quota-detail-cell col">
                                                    <span className="quota-cell-interviewed">-</span>
                                                    <span className="quota-cell-plan">-</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="quota-detail-footer">
                            <button className="close-btn-grey" onClick={() => setIsQuotaDetailModalOpen(false)} type="button">
                                Закрыть
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
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

    // Состояния для блоков выборок, анкет и маршрутов
    const [showRelatedBlocks, setShowRelatedBlocks] = useState(false);
    const [currentSurveyId, setCurrentSurveyId] = useState(null);

    // Данные для выборок
    const [samples, setSamples] = useState([]);
    const [selectedSample, setSelectedSample] = useState('');
    const [isSampleWindowOpen, setIsSampleWindowOpen] = useState(false);
    const [isSampleSelectModalOpen, setIsSampleSelectModalOpen] = useState(false);

    // Данные для анкет
    const [questionnaires, setQuestionnaires] = useState([]);
    const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('');
    const [isQuestionnaireWindowOpen, setIsQuestionnaireWindowOpen] = useState(false);
    const [isQuestionnaireSelectModalOpen, setIsQuestionnaireSelectModalOpen] = useState(false);

    // Данные для маршрутов
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState('');
    const [isRouteWindowOpen, setIsRouteWindowOpen] = useState(false);
    const [isRouteSelectModalOpen, setIsRouteSelectModalOpen] = useState(false);

    // Загрузка опросов из БД
    const fetchSurveys = async () => {
        try {
            const response = await axios.get('http://localhost:8080/surveys');
            setSurveys(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Ошибка при загрузке опросов:', err);
            setSurveys([]);
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

    // Загрузка связанных данных для опроса
    const fetchRelatedData = async (surveyId) => {
        console.log('=== fetchRelatedData вызван для surveyId:', surveyId);
        setCurrentSurveyId(surveyId);
        // Загружаем все данные параллельно, игнорируя ошибки отдельных запросов
        const results = await Promise.allSettled([fetchSamples(), fetchQuestionnaires(), fetchRoutes()]);
        console.log('Результаты загрузки:', {
            samples: results[0],
            questionnaires: results[1],
            routes: results[2]
        });
        console.log('Устанавливаю showRelatedBlocks = true');
        setShowRelatedBlocks(true);
        console.log('showRelatedBlocks установлен в:', true);
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
                console.log('=== Обновление опроса с ID:', editingSurveyId);
                response = await axios.put(`http://localhost:8080/survey/${editingSurveyId}`, surveyData);
                console.log('Ответ от сервера (update):', response.data);
                if (response.data.message === 'Опрос успешно обновлен') {
                    // Показываем уведомление и закрываем форму
                    alert('Опрос успешно обновлен!')
                    setIsWindowOpen(false);
                    await fetchRelatedData(editingSurveyId);
                    fetchSurveys();
                }
            } else {
                // Создание нового опроса
                console.log('=== Создание нового опроса');
                response = await axios.post('http://localhost:8080/survey', surveyData);
                console.log('Ответ от сервера (create):', response.data);
                if (response.data.message === 'Опрос успешно создан') {
                    // Получаем ID созданного опроса и загружаем связанные данные
                    alert('Опрос успешно создан!')
                    setIsWindowOpen(false);
                    const surveyId = response.data.id;
                    console.log('Полученный surveyId:', surveyId);
                    if (surveyId) {
                        await fetchRelatedData(surveyId);
                    } else {
                        console.error('Не получен ID созданного опроса!');
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
                console.log('Выборка сохранена:', sampleId);
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
                console.log('Анкета сохранена:', questionnaireId);
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
                console.log('Маршрут сохранен:', routeId);
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
        // Устанавливаем выбранные значения из опроса
        setSelectedSample(survey.sample_id || '');
        setSelectedQuestionnaire(survey.questionnaire_id || '');
        setSelectedRoute(survey.route_id || '');
        setIsWindowOpen(true);
        // Загружаем связанные данные и показываем блоки
        await fetchRelatedData(survey.id);
    };

    // Закрыть окно и сбросить форму
    const closeAndReset = () => {
        setIsWindowOpen(false);
        setEditingSurveyId(null);
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
    };

    useEffect(() => {
        fetchSurveys();
    }, []);

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
                        <form onSubmit={handleSaveSurvey} className="survey-form">
                            <div className="survey-input">
                                <label><span>*</span>Название опроса </label>
                                <input
                                    type="text"
                                    value={surveyName}
                                    onChange={(e) => setSurveyName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="survey-input">
                                <label><span>*</span>Код опроса </label>
                                <input
                                    type="text"
                                    value={surveyCode}
                                    onChange={(e) => setSurveyCode(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="survey-select">
                                <label><span>*</span>Ответственный </label>
                                <select
                                    value={responsible}
                                    onChange={(e) => setResponsible(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Выбрать</option>
                                    <option value="Иванов И.И.">Иванов И.И.</option>
                                    <option value="Петров П.П.">Петров П.П.</option>
                                    <option value="Сидоров С.С.">Сидоров С.С.</option>
                                </select>
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

                            {/* Блоки выборок, анкет и маршрутов */}
                            {console.log('Рендер: showRelatedBlocks =', showRelatedBlocks)}
                            {showRelatedBlocks && (
                                <div className="related-blocks-container">

                                    <div className="related-blocks">
                                        {/* Блок Выборки */}
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

                                        {/* Блок Анкеты */}
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

                                        {/* Блок Маршруты */}
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
                            )}

                            <button className="save-btn-survey" type='submit'>
                                Сохранить
                            </button>
                        </form>

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
                        {surveys && surveys.length > 0 ? (
                            surveys.map((survey) => (
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
                                    <td className='td-delete' title='Удалить' onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSurvey(survey.id);
                                    }}>
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
            </div>
        </>
    )
}

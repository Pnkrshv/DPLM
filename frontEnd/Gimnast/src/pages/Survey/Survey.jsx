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
        };

        try {
            let response;
            if (editingSurveyId) {
                // Обновление существующего опроса
                response = await axios.put(`http://localhost:8080/survey/${editingSurveyId}`, surveyData);
                if (response.data.message === 'Опрос успешно обновлен') {
                    alert('Опрос успешно обновлен!');
                    closeAndReset();
                    fetchSurveys();
                }
            } else {
                // Создание нового опроса
                response = await axios.post('http://localhost:8080/survey', surveyData);
                if (response.data.message === 'Опрос успешно создан') {
                    alert('Опрос успешно создан!');
                    closeAndReset();
                    fetchSurveys();
                }
            }
        } catch (err) {
            console.error('Ошибка при сохранении опроса:', err);
            alert('Ошибка: ' + (err.response?.data?.error || err.message));
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
    const editSurvey = (survey) => {
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
        setIsWindowOpen(true);
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

                            <button className="save-btn-survey" type='submit'>
                                Сохранить
                            </button>
                        </form>
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

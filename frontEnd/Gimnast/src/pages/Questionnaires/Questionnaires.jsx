import "./Questionnaires.css";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function Questionnaires() {
  const [scope, setScope] = useState("regions");
  const [isModalopen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeBlock, setActiveBlock] = useState('questions');
  const [expandedDistricts, setExpandedDistricts] = useState({});
  const [selectedCities, setSelectedCities] = useState({});
  const districtRefs = useRef({});

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
    // Здесь должна быть логика сохранения анкеты на сервер
    // Пока просто закрываем форму и показываем уведомление
    alert("Анкета успешно сохранена!");
    setIsModalOpen(false);
    setIsSettingsOpen(true);
  };

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
              <input className="input-create" type="text" />

              <label>Инструкция по проведению интервью</label>
              <textarea></textarea>

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
                        <button className="export-word">Выгрузить в Word</button>
                        <button className="export-is">Экспорт в ИС Полог</button>
                      </div>

                      <div className="btn-gr-2">
                        <button className="add-question">+ Вопрос</button>
                        <button className="add-block">Добавить блок вопросов</button>
                      </div>

                    </div>

                    <div className="create-question-block">
                      <div className="block-nav">
                        <div className="block-title"><h5>Основной блок</h5></div>
                        <div className="nav-buttons">
                          <div className="posled-button"><button><svg fill="#000000" width="64px" height="64px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M7.293,7.707a1,1,0,0,1,0-1.414l4-4a1,1,0,0,1,1.414,0l4,4a1,1,0,1,1-1.414,1.414L12,4.414,8.707,7.707A1,1,0,0,1,7.293,7.707Zm0,10,4,4a1,1,0,0,0,1.414,0l4-4a1,1,0,0,0-1.414-1.414L12,19.586,8.707,16.293a1,1,0,1,0-1.414,1.414Z"></path></g></svg></button></div>
                          <div className="dop-button"><button><svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle cx="18" cy="12" r="1.5" transform="rotate(90 18 12)" fill="#080341"></circle> <circle cx="12" cy="12" r="1.5" transform="rotate(90 12 12)" fill="#080341"></circle> <circle cx="6" cy="12" r="1.5" transform="rotate(90 6 12)" fill="#080341"></circle> </g></svg></button></div>
                        </div>
                      </div>
                      <textarea className="block-text-area" placeholder="Добавьте вопросы"></textarea>
                    </div>

                    <div className="passport-block">
                      <div className="block-nav">
                        <div className="block-title"><h5>Вопросы о респонденте (паспортичка)</h5></div>
                        <div className="nav-buttons">
                          <div className="posled-button"><button><svg fill="#000000" width="64px" height="64px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M7.293,7.707a1,1,0,0,1,0-1.414l4-4a1,1,0,0,1,1.414,0l4,4a1,1,0,1,1-1.414,1.414L12,4.414,8.707,7.707A1,1,0,0,1,7.293,7.707Zm0,10,4,4a1,1,0,0,0,1.414,0l4-4a1,1,0,0,0-1.414-1.414L12,19.586,8.707,16.293a1,1,0,1,0-1.414,1.414Z"></path></g></svg></button></div>
                          <div className="dop-button"><button><svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle cx="18" cy="12" r="1.5" transform="rotate(90 18 12)" fill="#080341"></circle> <circle cx="12" cy="12" r="1.5" transform="rotate(90 12 12)" fill="#080341"></circle> <circle cx="6" cy="12" r="1.5" transform="rotate(90 6 12)" fill="#080341"></circle> </g></svg></button></div>
                        </div>
                      </div>
                      <textarea className="block-text-area" placeholder="Добавьте вопросы"></textarea>
                    </div>

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

      <div className="buttons">
        <button
          className="create-btn"
          onClick={() => {
            setIsModalOpen(true);
          }}
        >
          <p>Создать анкету</p>
        </button>
        <button className="update-btn">
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
          <tbody></tbody>
        </table>
      </div>
    </>
  );
}

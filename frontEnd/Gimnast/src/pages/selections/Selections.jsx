import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Selections.css";

export default function Selections() {
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("parameters");
  const [scope, setScope] = useState("regions");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const dataTabRef = useRef(null);
  const paramsTabRef = useRef(null);

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
          setError(
            `Ошибка сервера: ${err.response.status} - ${err.response.data.error}`,
          );
        } else if (err.request) {
          setError(`Ошибка подключения к серверу: ${err.message}`);
        } else {
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
    if (isWindowOpen && scope === "cities") {
      if (cities.length === 0 && !loading) {
        fetchCities();
      }
    }
  }, [isWindowOpen, scope, cities.length, loading]);

  useEffect(() => {
    if (isWindowOpen) {
      updateIndicatorPosition();
    }
  }, [activeTab, isWindowOpen]);

  useEffect(() => {
    if (isWindowOpen) {
      const handleResize = () => {
        updateIndicatorPosition();
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isWindowOpen, activeTab]);

  const updateIndicatorPosition = () => {
    const activeTabElement =
      activeTab === "data" ? dataTabRef.current : paramsTabRef.current;

    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      setIndicatorStyle({
        transform: `translateX(${offsetLeft}px)`,
        width: `${offsetWidth}px`,
        opacity: 1,
      });
    }
  };

  return (
    <>
      {isWindowOpen && (
        <>
          <div className="window-bg" onClick={() => { setIsWindowOpen(false) }}></div>
          <div className="modal-window">
            <div className="window-navigation">
              <div className="nav-elements">
                <div className="tab-indicator" style={indicatorStyle}></div>
                <div
                  ref={dataTabRef}
                  className={`nav-element ${activeTab === "data" ? "activeTab" : ""}`}
                  onClick={() => {
                    setActiveTab("data");
                  }}
                >
                  Данные выборки
                </div>
                <div
                  ref={paramsTabRef}
                  className={`nav-element ${activeTab === "parameters" ? "activeTab" : ""}`}
                  onClick={() => {
                    setActiveTab("parameters");
                  }}
                >
                  Параметры
                </div>
              </div>
              <div
                className="close-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setIsWindowOpen(false);
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
                    <g clipPath="url(#clip0_429_11083)">
                      <path
                        d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006"
                        stroke="#292929"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </g>
                    <defs>
                      <clipPath id="clip0_429_11083">
                        <rect width="24" height="24" fill="white"></rect>
                      </clipPath>
                    </defs>
                  </g>
                </svg>
              </div>
            </div>

            <div className="window-content">
              {activeTab === "parameters" && (
                <>
                  <form method="post" className="parameters-form">
                    <div className="form-name">
                      <label>
                        <span>*</span>Название выборки
                      </label>
                      <input type="text" />
                    </div>
                    <div className="form-type">
                      <label>Тип выборки</label>
                      <select>
                        <option disabled selected>
                          <span>Выбрать</span>
                        </option>
                        <option>Выборка 1</option>
                        <option>Выборка 2</option>
                      </select>
                    </div>

                    <div className="region second">
                      <label>Форма актуальна для</label>
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

                      <div className="region-list">
                        {scope === "regions" ? (
                          <>
                            <div className="region-element">
                              <input type="checkbox" name="" id="" />
                              <p>СЕВЕРО-КАВКАЗСКИЙ</p>
                            </div>
                            <div className="region-element">
                              <input type="checkbox" name="" id="" />
                              <p>ЦЕНТРАЛЬНЫЙ</p>
                            </div>
                            <div className="region-element">
                              <input type="checkbox" name="" id="" />
                              <p>СИБИРСКИЙ</p>
                            </div>
                            <div className="region-element">
                              <input type="checkbox" name="" id="" />
                              <p>СЕВЕРО-ЗАПАДНЫЙ</p>
                            </div>
                            <div className="region-element">
                              <input type="checkbox" name="" id="" />
                              <p>УРАЛЬСКИЙ</p>
                            </div>
                            <div className="region-element">
                              <input type="checkbox" name="" id="" />
                              <p>ЮЖНЫЙ</p>
                            </div>
                            <div className="region-element">
                              <input type="checkbox" name="" id="" />
                              <p>ДАЛЬНЕВОСТОЧНЫЙ</p>
                            </div>
                            <div className="region-element">
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
                              {loading ? (
                                <div className="loading">
                                  <div className="spinner"></div>
                                  <p>Загрузка городов...</p>
                                </div>
                              ) : error ? (
                                <div className="error">
                                  <p>{error}</p>
                                  <button
                                    type="button"
                                    onClick={fetchCities}
                                    className="retry-btn"
                                  >
                                    {" "}
                                    Повторить попытку{" "}
                                  </button>
                                </div>
                              ) : cities.length > 0 ? (
                                <div className="cities-grid selection-gr">
                                  {cities.map((city, index) => (
                                    <div
                                      className="city-checkbox"
                                      key={`${city.City} - ${city.index}`}
                                    >
                                      <input
                                        type="checkbox"
                                        name="city"
                                        id={`city-${index}`}
                                        value={city.name}
                                      />
                                      <label htmlFor={`city-${city.index}`}>
                                        {city.city} ({city.region})
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="no-cities">
                                  <p>Нет доступных городов</p>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          ""
                        )}
                      </div>
                    </div>
                  </form>

                  <div className="right-side">
                    <button
                      className="save-btn sec"
                      onClick={() => {
                        setIsWindowOpen(false);
                      }}
                    >Сохранить</button>
                    <div className="right-nav">
                      <div className="right-nav-element">Жёсткие квоты</div>
                      <div className="right-nav-element">+ Мягкие квоты</div>
                    </div>
                    <div className="right-select">
                      <select>
                        <option disabled selected>
                          Выбрать
                        </option>
                        <option>Option 1</option>
                        <option>Option 2</option>
                      </select>
                    </div>
                    <div className="row-col">
                      <div className="row">
                        <h3 className="row-title">Строки</h3>
                        <select className="row-select">
                          <option disabled selected>
                            Вбырать
                          </option>
                          <option>Option</option>
                          <option>Option</option>
                          <option>Option</option>
                        </select>
                        <hr className="row-line" />
                        <div className="row-data"></div>
                      </div>

                      <div className="column">
                        <h3 className="col-title">Столбцы</h3>
                        <select className="col-select">
                          <option selected disabled>
                            Выбрать
                          </option>
                          <option>Option</option>
                          <option>Option</option>
                          <option>Option</option>
                        </select>
                        <hr className="col-line" />
                        <div className="col-data"></div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "data" && (
                <>
                  <p>data</p>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <div className="buttons">
        <button
          className="create-btn"
          onClick={() => {
            setIsWindowOpen(true);
          }}
        >
          <p>Создать выборку</p>
        </button>
        <button className="update-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21.986">
            <path d="M19.841 3.24A10.988 10.988 0 0 0 8.54.573l1.266 3.8a7.033 7.033 0 0 1 8.809 9.158L17 11.891v7.092h7l-2.407-2.439A11.049 11.049 0 0 0 19.841 3.24zM1 10.942a11.05 11.05 0 0 0 11.013 11.044 11.114 11.114 0 0 0 3.521-.575l-1.266-3.8a7.035 7.035 0 0 1-8.788-9.22L7 9.891V6.034c.021-.02.038-.044.06-.065L7 5.909V2.982H0l2.482 2.449A10.951 10.951 0 0 0 1 10.942z" />
          </svg>
        </button>
      </div>
    </>
  );
}

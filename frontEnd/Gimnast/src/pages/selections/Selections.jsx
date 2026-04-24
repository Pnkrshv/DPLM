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
  const [expandedDistricts, setExpandedDistricts] = useState({});
  const [selectedCities, setSelectedCities] = useState({});
  const districtRefs = useRef({});
  const dataTabRef = useRef(null);
  const paramsTabRef = useRef(null);
  const [quotaTabs, setQuotaTabs] = useState(["hard"]);
  const [activeQuotaTab, setActiveQuotaTab] = useState("hard");
  const [sampleName, setSampleName] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [respondentsCount, setRespondentsCount] = useState("");
  const [samples, setSamples] = useState([]);
  const [currentSample, setCurrentSample] = useState(null);
  const [editingSampleId, setEditingSampleId] = useState(null);

  // Пагинация для таблицы выборок
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 13;
  const totalPages = Math.ceil(samples.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSamples = samples.slice(startIndex, startIndex + itemsPerPage);

  // Состояния для жёстких квот
  const [hardQuotaRows, setHardQuotaRows] = useState("");
  const [hardQuotaCols, setHardQuotaCols] = useState("");

  // Состояния для мягких квот
  const [softQuotaRows, setSoftQuotaRows] = useState("");
  const [softQuotaCols, setSoftQuotaCols] = useState("");

  // Данные для выпадающих списков
  const rowOptions = [
    "Тип населённого пункта",
    "Количество населения",
    "Административный статус",
    "Географическое положение",
    "Экономический статус"
  ];

  const colOptions = [
    "Пол",
    "Возраст",
    "Образование",
    "Доход",
    "Семейное положение"
  ];

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
      const response = await axios.get("/cities");
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
    if (isWindowOpen) {
      if (cities.length === 0 && !loading) {
        fetchCities();
      }
    }
  }, [isWindowOpen, cities.length, loading]);

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

  const data = [
    { category: 'административный центр субъекта РФ', female: '-', male: '-', total: '-' },
    { category: 'районный центр субъекта РФ', female: '-', male: '-', total: '-' },
    { category: 'поселок городского типа', female: '-', male: '-', total: '-' },
    { category: 'сельский населенный пункт', female: '-', male: '-', total: '-' },
    { category: 'другое', female: '-', male: '-', total: '-' },
    { category: 'всего', female: '-', male: '-', total: '-' },
  ];

  const handleAddSoftQuota = () => {
    if (!quotaTabs.includes("soft")) {
      setQuotaTabs([...quotaTabs, "soft"]);
    }
  };

  const handleSaveSample = async () => {
    if (!sampleName || !sampleType) {
      alert("Заполните название и тип выборки");
      return;
    }

    const sampleData = {
      name: sampleName,
      sample_type: sampleType,
      respondents_count: parseInt(respondentsCount) || 0,
      hard_quotas: JSON.stringify({
        selectedCities: selectedCities,
        scope: scope,
        rows: hardQuotaRows,
        cols: hardQuotaCols,
      }),
      soft_quotas: JSON.stringify({
        enabled: quotaTabs.includes("soft"),
        rows: softQuotaRows,
        cols: softQuotaCols,
      }),
    };

    try {
      let response;
      if (editingSampleId) {
        // Обновление существующей выборки
        response = await axios.put(`/sample/${editingSampleId}`, sampleData);
        if (response.data.message === "Выборка успешно обновлена") {
          alert("Выборка успешно обновлена!");
          // Очистка всех полей
          setSampleName("");
          setSampleType("");
          setRespondentsCount("");
          setSelectedCities({});
          setExpandedDistricts({});
          setQuotaTabs(["hard"]);
          setActiveQuotaTab("hard");
          setScope("regions");
          setHardQuotaRows("");
          setHardQuotaCols("");
          setSoftQuotaRows("");
          setSoftQuotaCols("");
          setEditingSampleId(null);
          setIsWindowOpen(false);
          fetchSamples();
        }
      } else {
        // Создание новой выборки
        response = await axios.post("/sample", sampleData);
        if (response.data.message === "Выборка успешно создана") {
          alert("Выборка успешно сохранена!");
          // Очистка всех полей
          setSampleName("");
          setSampleType("");
          setRespondentsCount("");
          setSelectedCities({});
          setExpandedDistricts({});
          setQuotaTabs(["hard"]);
          setActiveQuotaTab("hard");
          setScope("regions");
          setHardQuotaRows("");
          setHardQuotaCols("");
          setSoftQuotaRows("");
          setSoftQuotaCols("");
          setIsWindowOpen(false);
          fetchSamples();
        }
      }
    } catch (err) {
      console.error("Ошибка при сохранении выборки", err);
      alert("Ошибка при сохранении выборки: " + (err.response?.data?.error || err.message));
    }
  };

  const fetchSamples = async () => {
    try {
      const response = await axios.get("/samples");
      setSamples(response.data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Ошибка при загрузке выборок", err);
    }
  };

  const loadCurrentSample = async () => {
    // Загружаем последнюю созданную выборку
    if (samples.length > 0) {
      const latestSample = samples[0];
      setCurrentSample(latestSample);
    }
  };

  const loadSampleForEdit = async (sampleId) => {
    try {
      const response = await axios.get(`/sample/${sampleId}`);
      const sample = response.data;
      setEditingSampleId(sampleId);

      // Заполняем поля формы данными из выборки
      setSampleName(sample.name);
      setSampleType(sample.sample_type);
      setRespondentsCount(sample.respondents_count.toString());

      // Парсим данные квот
      try {
        const hardQuotas = JSON.parse(sample.hard_quotas);
        setHardQuotaRows(hardQuotas.rows || "");
        setHardQuotaCols(hardQuotas.cols || "");
        if (hardQuotas.selectedCities) {
          setSelectedCities(hardQuotas.selectedCities);
        }
        if (hardQuotas.scope) {
          setScope(hardQuotas.scope);
        }
      } catch (e) {
        console.error("Ошибка парсинга жёстких квот", e);
      }

      try {
        const softQuotas = JSON.parse(sample.soft_quotas);
        setSoftQuotaRows(softQuotas.rows || "");
        setSoftQuotaCols(softQuotas.cols || "");
        if (softQuotas.enabled && !quotaTabs.includes("soft")) {
          setQuotaTabs(["hard", "soft"]);
        }
      } catch (e) {
        console.error("Ошибка парсинга мягких квот", e);
      }

      // Открываем окно и переключаем на вкладку параметров
      setIsWindowOpen(true);
      setActiveTab("parameters");
    } catch (err) {
      console.error("Ошибка при загрузке выборки", err);
      alert("Ошибка при загрузке данных выборки");
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  useEffect(() => {
    if (activeTab === "data") {
      loadCurrentSample();
    }
  }, [activeTab, samples]);

  return (
    <>
      {isWindowOpen && (
        <>
          <div className="window-bg" onClick={() => {
            setIsWindowOpen(false);
            setSampleName('');
            setSampleType('');
            selectedCities([]);
          }}></div>
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
                  setSampleName('');
                  setSampleType('');
                  selectedCities([]);
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
                      <input
                        type="text"
                        value={sampleName}
                        onChange={(e) => setSampleName(e.target.value)}
                      />
                    </div>
                    <div className="form-type">
                      <label>Тип выборки</label>
                      <select
                        value={sampleType}
                        onChange={(e) => setSampleType(e.target.value)}
                      >
                        <option disabled value="">
                          <span>Выбрать</span>
                        </option>
                        <option>Случайная</option>
                        <option>Систематическая</option>
                        <option>Стратифицированная</option>
                        <option>Кластерная</option>
                        <option>Многоступенчатая</option>
                        <option>Стихийная</option>
                        <option>Квотная</option>
                        <option>Экспертная</option>
                        <option>Выборка «снежным комом»</option>
                      </select>
                    </div>

                    <div className="region second">
                      <div className="reg-buttons">
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
                                      <input
                                        type="checkbox"
                                        ref={el => districtRefs.current[district] = el}
                                        onChange={(e) => handleDistrictChange(district, e.target.checked)}
                                        checked={allSelected}
                                      />
                                      <p className="district-name" onClick={() => toggleExpand(district)}>
                                        {district}
                                      </p>
                                      <p className="expand-icon" onClick={() => toggleExpand(district)}>
                                        {isExpanded ? <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="#000000"></path> </g></svg> :
                                          <svg fill="#000000" width="16px" height="16px" viewBox="-8.5 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>right</title> <path d="M7.75 16.063l-7.688-7.688 3.719-3.594 11.063 11.094-11.344 11.313-3.5-3.469z"></path> </g></svg>}
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
                    </div>
                  </form>

                  <div className="right-side">
                    <button
                      className="save-btn sec"
                      onClick={handleSaveSample}
                    >Сохранить</button>
                    <div className="right-nav">
                      <div className="quota-tabs">
                        <button
                          className={`quota-tab-btn ${activeQuotaTab === "hard" ? "activ" : ""}`}
                          onClick={() => setActiveQuotaTab("hard")}
                        >
                          Жесткие квоты
                        </button>
                        {quotaTabs.includes("soft") && (
                          <button
                            className={`quota-tab-btn ${activeQuotaTab === "soft" ? "activ" : ""}`}
                            onClick={() => setActiveQuotaTab("soft")}
                          >
                            Мягкие квоты
                          </button>
                        )}
                        {!quotaTabs.includes("soft") && (
                          <button className="add-soft-quota-btn" onClick={handleAddSoftQuota}>
                            + Мягкие квоты
                          </button>
                        )}
                      </div>
                    </div>
                    {activeQuotaTab === "hard" && (
                      <>
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
                      </>
                    )}
                    {activeQuotaTab === "soft" && (
                      <div className="soft-quota-content">
                        <div className="soft-quota-selectors">
                          <div className="soft-quota-row">
                            <label>Строки:</label>
                            <select
                              value={softQuotaRows}
                              onChange={(e) => setSoftQuotaRows(e.target.value)}
                            >
                              <option disabled value="">
                                Выбрать характеристику для строк
                              </option>
                              {rowOptions.map((option, index) => (
                                <option key={index} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="soft-quota-col">
                            <label>Столбцы:</label>
                            <select
                              value={softQuotaCols}
                              onChange={(e) => setSoftQuotaCols(e.target.value)}
                            >
                              <option disabled value="">
                                Выбрать характеристику для столбцов
                              </option>
                              {colOptions.map((option, index) => (
                                <option key={index} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="soft-quota-preview">
                            {softQuotaRows && <p><strong>Строки:</strong> {softQuotaRows}</p>}
                            {softQuotaCols && <p><strong>Столбцы:</strong> {softQuotaCols}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === "data" && (
                <>



                  <div className="data-window">
                    <div className="data-cities-list">
                      <div className="data-cities-container">
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
                                <input
                                  type="checkbox"
                                  ref={el => districtRefs.current[district] = el}
                                  onChange={(e) => handleDistrictChange(district, e.target.checked)}
                                  checked={allSelected}
                                />
                                <p className="district-name" onClick={() => toggleExpand(district)}>
                                  {district}
                                </p>
                                <p className="expand-icon" onClick={() => toggleExpand(district)}>
                                  {isExpanded ? <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="#000000"></path> </g></svg> :
                                    <svg fill="#000000" width="16px" height="16px" viewBox="-8.5 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>right</title> <path d="M7.75 16.063l-7.688-7.688 3.719-3.594 11.063 11.094-11.344 11.313-3.5-3.469z"></path> </g></svg>}
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
                    </div>

                    <div className="data-cities-set">
                      <div className="size-selection">
                        <label htmlFor="">Размер общей выборки для региона: </label>
                        <input
                          type="number"
                          value={respondentsCount}
                          onChange={(e) => setRespondentsCount(e.target.value)}
                        />
                      </div>

                      <div className="data-table">
                        <h2>Жёсткие квоты</h2>
                        {currentSample && (
                          <div className="quota-info">
                            {(() => {
                              try {
                                const hardQuotas = JSON.parse(currentSample.hard_quotas);
                                return (
                                  <>
                                    {hardQuotas.rows && (
                                      <p className="quota-rows"><strong>Строки:</strong> {hardQuotas.rows}</p>
                                    )}
                                    {hardQuotas.cols && (
                                      <p className="quota-cols"><strong>Столбцы:</strong> {hardQuotas.cols}</p>
                                    )}
                                  </>
                                );
                              } catch (e) {
                                return <p>Ошибка загрузки данных квот</p>;
                              }
                            })()}
                          </div>
                        )}
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th></th>
                              {currentSample && (() => {
                                try {
                                  const hardQuotas = JSON.parse(currentSample.hard_quotas);
                                  if (hardQuotas.cols) {
                                    const cols = hardQuotas.cols.split(',').map((col, i) => col.trim());
                                    return cols.map((col, index) => (
                                      <th key={index}>{col}</th>
                                    ));
                                  }
                                } catch (e) { }
                              })()}
                              {!currentSample?.hard_quotas && (
                                <>
                                  <th>Женский</th>
                                  <th>Мужской</th>
                                  <th>Всего</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((item, index) => (
                              <tr key={index}>
                                <td style={{ textAlign: 'left' }}>{item.category}</td>
                                {currentSample && (() => {
                                  try {
                                    const hardQuotas = JSON.parse(currentSample.hard_quotas);
                                    if (hardQuotas.cols) {
                                      const cols = hardQuotas.cols.split(',').map((col, i) => col.trim());
                                      return cols.map((col, i) => (
                                        <td key={i}>-</td>
                                      ));
                                    }
                                  } catch (e) { }
                                })()}
                                {!currentSample?.hard_quotas && (
                                  <>
                                    <td>{item.female}</td>
                                    <td>{item.male}</td>
                                    <td>{item.total}</td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="data-buttons">
                    <button className="data-count-btn" onClick={(e) => {
                      e.preventDefault();
                    }}>Рассчитать</button>
                    <button
                      className="data-save-btn"
                      type="button"
                      onClick={() => {
                        setActiveTab("parameters");
                      }}
                    >
                      Изменить параметры
                    </button>
                  </div>



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
        <button className="update-btn" onClick={fetchSamples}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21.986">
            <path d="M19.841 3.24A10.988 10.988 0 0 0 8.54.573l1.266 3.8a7.033 7.033 0 0 1 8.809 9.158L17 11.891v7.092h7l-2.407-2.439A11.049 11.049 0 0 0 19.841 3.24zM1 10.942a11.05 11.05 0 0 0 11.013 11.044 11.114 11.114 0 0 0 3.521-.575l-1.266-3.8a7.035 7.035 0 0 1-8.788-9.22L7 9.891V6.034c.021-.02.038-.044.06-.065L7 5.909V2.982H0l2.482 2.449A10.951 10.951 0 0 0 1 10.942z" />
          </svg>
        </button>
      </div>
      <div className="selection-table">
        <table>
          <thead>
            <tr>
              <th>Название выборки</th>
              <th>Жесткие квоты</th>
              <th>Мягкие квоты</th>
              <th>Количество респондентов</th>
              <th>Тип выборки</th>
              <th>Дата изменения</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {currentSamples.length > 0 ? (
              currentSamples.map((sample) => {
                let hardQuotasData = {};
                let softQuotasData = {};
                try {
                  hardQuotasData = JSON.parse(sample.hard_quotas);
                  softQuotasData = JSON.parse(sample.soft_quotas);
                } catch (e) {
                  console.error("Ошибка парсинга квот", e);
                }

                const hardQuotasCount = hardQuotasData.selectedCities
                  ? Object.values(hardQuotasData.selectedCities).reduce(
                    (acc, district) => acc + Object.keys(district || {}).length,
                    0
                  )
                  : 0;

                const softQuotasCount = softQuotasData.enabled ? "Есть" : "Нет";

                return (
                  <tr key={sample.id}>
                    <td
                      className="sample-name-link"
                      onClick={() => loadSampleForEdit(sample.id)}
                      title="Изменить"
                    >
                      {sample.name}
                    </td>
                    <td>{hardQuotasCount}</td>
                    <td>{softQuotasCount}</td>
                    <td>{sample.respondents_count}</td>
                    <td>{sample.sample_type}</td>
                    <td>{new Date(sample.updated_at).toLocaleDateString()}</td>
                    <td className="td-delete">
                      <button
                        className="delete-sample-btn"
                        title="Удалить"
                        onClick={async () => {
                          if (confirm("Вы уверены, что хотите удалить эту выборку?")) {
                            try {
                              await axios.delete(`/sample/${sample.id}`);
                              fetchSamples();
                            } catch (err) {
                              console.error("Ошибка при удалении", err);
                            }
                          }
                        }}
                      >
                        <svg width="22px" height="22px" viewBox="0 0 24 24" fill="none">
                          <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="#d32f2f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  Нет доступных выборок
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {samples.length > itemsPerPage && (
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

import { useState, useRef, useEffect } from "react";
import "./Maps.css";
import axios from "axios";

export default function Maps() {
    const [isCreateMapOpen, setIsCreateMapOpen] = useState(false);
    const [expandedDistricts, setExpandedDistricts] = useState({});
    const [selectedCities, setSelectedCities] = useState({});
    const districtRefs = useRef({});
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [routeName, setRouteName] = useState('');
    const [isModalMapOpen, setIsModalMapOpen] = useState(false);
    const [savedCities, setSavedCities] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [down, setDown] = useState(false);

    useEffect(() => {
        if (cities && Object.keys(cities).length > 0) {
            setSelectedCities({});
            setExpandedDistricts({});
        }
    }, [cities]);

    useEffect(() => {
        if (!cities) return;
        Object.keys(cities).forEach((district) => {
            const citiesList = Object.values(cities[district]).flat();
            const total = citiesList.length;
            const selectedCount = citiesList.filter(
                (city) => selectedCities[district]?.[city],
            ).length;
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
        citiesList.forEach((city) => {
            updateDistrict[city] = checked;
        });
        setSelectedCities((prev) => ({
            ...prev,
            [district]: updateDistrict,
        }));
    };

    const handleCityChange = (district, city, checked) => {
        setSelectedCities((prev) => ({
            ...prev,
            [district]: {
                ...(prev[district] || {}),
                [city]: checked,
            },
        }));
    };

    const toggleExpand = (district) => {
        setExpandedDistricts((prev) => ({
            ...prev,
            [district]: !prev[district],
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
        if (isCreateMapOpen) {
            fetchCities();
        }
    }, [isCreateMapOpen]);

    const getSavedCities = () => {
        const result = [];

        Object.keys(selectedCities).forEach((district) => {
            Object.keys(selectedCities[district]).forEach((city) => {
                if (selectedCities[district][city]) {
                    result.push({
                        district,
                        city,
                    })
                }
            })
        })

        return result;
    };

    const groupedCities = savedCities.reduce((acc, item) => {
        if (!acc[item.district]) acc[item.district] = [];
        acc[item.district].push(item.city);
        return acc;
    }, {});

    const toggleGroup = (district) => {
        setExpandedGroups(prev => ({
            ...prev,
            [district]: !prev[district]
        }));
    };

    const downArrow = <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="#000000"></path> </g></svg>
    const upArrow = <svg fill="#000000" width="16px" height="16px" viewBox="-8.5 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>right</title> <path d="M7.75 16.063l-7.688-7.688 3.719-3.594 11.063 11.094-11.344 11.313-3.5-3.469z"></path> </g></svg>


    return (
        <>
            {isCreateMapOpen && (
                <>
                    <div
                        className="modal-bg"
                        onClick={() => {
                            setIsCreateMapOpen(false);
                        }}
                    ></div>
                    <div className="create-map-window">
                        <nav className="window-map-navigation">
                            <div className="map-title">Создание маршрута</div>
                            <div
                                className="close-btn"
                                onClick={() => setIsCreateMapOpen(false)}
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
                                        <g clipPath="url(#clip0_429_11083)">
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
                        </nav>

                        <form action="" className="create-map-form">
                            <div className="name-trace">
                                <label>
                                    <span style={{ color: "red" }}>*</span>Название маршрута
                                </label>
                                <input
                                    type="text"
                                    value={routeName}
                                    onChange={(e) => {
                                        setRouteName(e.target.value)
                                    }}
                                />
                            </div>
                            <div className="about-trace">
                                <label>Описание маршрута</label>
                                <textarea></textarea>
                            </div>
                            <div className="ogran-np">
                                <p>Без ограничения по населенным пунктам</p>
                                <input
                                    type="checkbox"
                                    id="checkbox-switcher6"
                                    className="options-switcher"
                                />
                                <label
                                    htmlFor="checkbox-switcher6"
                                    className="options-switcher-label"
                                ></label>
                            </div>

                            <div className="map-regions">
                                <div className="regions-list">
                                    <div className="select-type">
                                        <p>Регионы маршрута</p>
                                        <div className="select-regions">
                                            <p className="select-all">Выделить всё</p>|
                                            <p className="deselect-all">Снять выделение</p>
                                        </div>
                                    </div>

                                    <div className="cities-container maps-container">
                                        {loading && <p>Загрузка городов...</p>}
                                        {error && <p className="error">{error}</p>}
                                        {!loading &&
                                            !error &&
                                            cities &&
                                            Object.keys(cities).map((district) => {
                                                const citiesList = Object.values(
                                                    cities[district],
                                                ).flat();
                                                const isExpanded = expandedDistricts[district];
                                                const anySelected = citiesList.some(
                                                    (city) => selectedCities[district]?.[city],
                                                );
                                                const allSelected =
                                                    citiesList.length > 0 &&
                                                    citiesList.every(
                                                        (city) => selectedCities[district]?.[city],
                                                    );

                                                return (
                                                    <div key={district} className="district-item">
                                                        <div className="district-header">
                                                            <p
                                                                className="expand-icon"
                                                                onClick={() => toggleExpand(district)}
                                                            >
                                                                {isExpanded ? (
                                                                    <svg
                                                                        width="16px"
                                                                        height="16px"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <g
                                                                            id="SVGRepo_bgCarrier"
                                                                            stroke-width="0"
                                                                        ></g>
                                                                        <g
                                                                            id="SVGRepo_tracerCarrier"
                                                                            stroke-linecap="round"
                                                                            stroke-linejoin="round"
                                                                        ></g>
                                                                        <g id="SVGRepo_iconCarrier">
                                                                            {" "}
                                                                            <path
                                                                                fill-rule="evenodd"
                                                                                clip-rule="evenodd"
                                                                                d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z"
                                                                                fill="#000000"
                                                                            ></path>{" "}
                                                                        </g>
                                                                    </svg>
                                                                ) : (
                                                                    <svg
                                                                        fill="#000000"
                                                                        width="16px"
                                                                        height="16px"
                                                                        viewBox="-8.5 0 32 32"
                                                                        version="1.1"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <g
                                                                            id="SVGRepo_bgCarrier"
                                                                            strokeWidth="0"
                                                                        ></g>
                                                                        <g
                                                                            id="SVGRepo_tracerCarrier"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        ></g>
                                                                        <g id="SVGRepo_iconCarrier">
                                                                            {" "}
                                                                            <title>right</title>{" "}
                                                                            <path d="M7.75 16.063l-7.688-7.688 3.719-3.594 11.063 11.094-11.344 11.313-3.5-3.469z"></path>{" "}
                                                                        </g>
                                                                    </svg>
                                                                )}
                                                            </p>
                                                            <input
                                                                type="checkbox"
                                                                ref={(el) =>
                                                                    (districtRefs.current[district] = el)
                                                                }
                                                                onChange={(e) =>
                                                                    handleDistrictChange(
                                                                        district,
                                                                        e.target.checked,
                                                                    )
                                                                }
                                                                checked={allSelected}
                                                            />
                                                            <p
                                                                className="district-name"
                                                                onClick={() => toggleExpand(district)}
                                                            >
                                                                {district}
                                                            </p>
                                                        </div>
                                                        {isExpanded && (
                                                            <div className="cities-list">
                                                                {citiesList.map((city) => (
                                                                    <div key={city} className="city-item">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                selectedCities[district]?.[city] ||
                                                                                false
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleCityChange(
                                                                                    district,
                                                                                    city,
                                                                                    e.target.checked,
                                                                                )
                                                                            }
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
                            </div>

                            <div className="podgotovka">
                                Подготовка маршрута завершена
                                <input
                                    type="checkbox"
                                    id="checkbox-switcher7"
                                    className="options-switcher"
                                />
                                <label
                                    htmlFor="checkbox-switcher7"
                                    className="options-switcher-label"
                                ></label>
                            </div>

                            <div className="footer-map">
                                <button className="map-cancel" onClick={() => { setIsCreateMapOpen(false) }}>Отменить</button>
                                <button className="map-submit"
                                    onClick={(e) => {
                                        setIsCreateMapOpen(false);
                                        setIsModalMapOpen(true);
                                        setSavedCities(getSavedCities())
                                        e.preventDefault();
                                        const route = {
                                            name: routeName,
                                            cities: selectedCities,
                                        }
                                    }}
                                    type="submit"
                                >Сохранить</button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {isModalMapOpen && (
                <>
                    <div
                        className="modal-bg"
                        onClick={() => {
                            setIsModalMapOpen(false);
                        }}
                    ></div>
                    <div className="modal-map">
                        <div className="modal-map-nav">
                            <h3 className="modal-map-title">{routeName}</h3>
                            <div className="modal-map-settings">*</div>
                        </div>
                        <div className="modal-map-body">
                            <div className="modal-map-cities">
                                <p className="all-cities">
                                    {savedCities.length === 0 ? <p>Нет выбранных городов</p> : <p><b>Всего: </b> {savedCities.length}</p>}
                                </p>
                                {Object.entries(groupedCities).map(([district, cities]) => (
                                    <div key={district} className="modal-group">
                                        <p
                                            className="modal-group-title"
                                            onClick={() => toggleGroup(district)}
                                        >
                                            {expandedGroups[district] ? downArrow : upArrow} {district}
                                        </p>
                                        {expandedGroups[district] && (
                                            <div className="modal-group-cities">
                                                {cities.map((city, idx) => (
                                                    <p key={idx} className="modal-city-item">
                                                        г. {city}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="main-modal-map">
                                <div className="modal-map-buttons">
                                    <div className="table-buttons">
                                        <button>Все</button>
                                        <button>Выбранные</button>
                                        <button>Невыбранные</button>
                                    </div>

                                    <div className="settings-buttons">
                                        <button className="setting-discard">Отклонить</button>
                                        <button className="setting-approve">Согласовать</button>
                                        <button className="add-city">Добавить город</button>
                                    </div>
                                </div>
                                <div className="modal-map-table">
                                    <table>
                                    //table
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                </>
            )
            }

            <div className="buttons">
                <button className="create-btn" onClick={() => {
                    setIsCreateMapOpen(true);
                }}>Создать маршрут</button>
                <button className="update-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21.986">
                        <path d="M19.841 3.24A10.988 10.988 0 0 0 8.54.573l1.266 3.8a7.033 7.033 0 0 1 8.809 9.158L17 11.891v7.092h7l-2.407-2.439A11.049 11.049 0 0 0 19.841 3.24zM1 10.942a11.05 11.05 0 0 0 11.013 11.044 11.114 11.114 0 0 0 3.521-.575l-1.266-3.8a7.035 7.035 0 0 1-8.788-9.22L7 9.891V6.034c.021-.02.038-.044.06-.065L7 5.909V2.982H0l2.482 2.449A10.951 10.951 0 0 0 1 10.942z" />
                    </svg>
                </button>
            </div>

            <div className="map-table">
                <table >
                    <thead>
                        <tr>
                            <th>Название маршрута</th>
                            <th>Статус</th>
                            <th>Количество населенных пунктов</th>
                            <th>Дата создания</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </>
    );
}

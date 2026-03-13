import { useState, useRef, useEffect } from "react";
import "./Maps.css";
import axios from "axios";
import MapComponent from "./MapComponent";

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
    const [description, setDescription] = useState('');
    const [isAddWindowOpen, setIsAddWindowOpen] = useState(false);
    const [shortName, setShortName] = useState("");
    const [fullName, setFullName] = useState("");
    const [coords, setCoords] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [mapPosition, setMapPosition] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [regions, setRegions] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [population, setPopulation] = useState("");

    useEffect(() => {
        const fetchRegions = async () => {
            try {
                const res = await axios.get("http://localhost:8080/cities");
                const data = res.data;

                const allRegions = [];
                Object.values(data).forEach((foRegions) => {
                    allRegions.push(...Object.keys(foRegions));
                });

                setRegions(allRegions);
            } catch (err) {
                console.error("Ошибка при загрузке регионов", err);
            }
        };

        fetchRegions();
    }, []);

    const fetchSuggestions = async (query) => {
        if (!query) return;
        const res = await axios.get("http://localhost:8080/cities/search", {
            params: { q: query }
        });

        setSuggestions(res.data);
    };

    const handleSearchCity = async (cityName) => {
        const query = cityName || searchQuery;
        if (!query) return;

        try {
            const res = await axios.get(
                `https://nominatim.openstreetmap.org/search`,
                {
                    params: {
                        q: query,
                        format: "json",
                        limit: 1
                    }
                }
            );

            if (res.data.length === 0) {
                alert("Город не найден");
                return;
            }

            const city = res.data[0];

            const lat = parseFloat(city.lat);
            const lon = parseFloat(city.lon);

            setShortName(query);
            setFullName(city.display_name);
            setCoords(`${lat}, ${lon}`);

            setMapPosition([lat, lon]);
        } catch (err) {
            console.error(err);
        }
    };

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

    const handleAddCitySubmit = (e) => {
        e.preventDefault();
        if (!selectedDistrict || !shortName) {
            alert("Выберите город из списка подсказок");
            return;
        }
        const newCity = {
            district: selectedDistrict,
            city: shortName,
            population: population,
        };
        setSavedCities((prev) => [...prev, newCity]);
        setSearchQuery("");
        setPopulation("");
        setShortName("");
        setFullName("");
        setCoords("");
        setSelectedRegion("");
        setSelectedDistrict("");
        setMapPosition([55.753960, 37.620393]);
        setIsAddWindowOpen(false);
    };

    return (
        <>

            {isAddWindowOpen && (
                <>
                    <div
                        className="modal-bg"
                        onClick={(e) => {
                            e.preventDefault();
                            setSearchQuery('');
                            setShortName('');
                            setFullName('');
                            setCoords('');
                            setMapPosition([55.753960, 37.620393]);
                            setIsAddWindowOpen(false);
                        }}
                    ></div>
                    <div className="add-window">
                        <div className="add-window-title">
                            <p>Добавление населенного пункта</p>
                            <div className="close-btn"
                                onClick={() => {
                                    setIsAddWindowOpen(false)
                                }}>
                                <svg
                                    width="16px"
                                    height="16px"
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
                        <div className="add-window-main">
                            <div className="main-find">
                                <div className="find-form">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        className="find-input"
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShortName(e.target.value);
                                            fetchSuggestions(e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                            }
                                        }}
                                        onBlur={(e) => {
                                            setTimeout(() => setSuggestions([]), 1000);
                                        }}
                                    />
                                    <ul className="suggestions-list">
                                        {suggestions.map((item, idx) => (
                                            <li
                                                key={idx}
                                                onClick={() => {
                                                    setSearchQuery(item.city);
                                                    setShortName(item.city);
                                                    handleSearchCity(item.city);
                                                    setSelectedRegion(item.region);
                                                    setSelectedDistrict(item.district);
                                                    setCoords("");
                                                    setSuggestions([]);
                                                }}
                                            >
                                                {item.city} ({item.region})
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        type="button"
                                        onClick={handleSearchCity}
                                    >Поиск</button>
                                </div>
                            </div>
                            <form onSubmit={handleAddCitySubmit} className="main-add-form">

                                <div className="form-short-name">
                                    <label>Короткое название</label>
                                    <input type="text" name="" id="" required value={shortName} />
                                </div>
                                <div className="form-full-name">
                                    <label htmlFor="">Полное название</label>
                                    <input type="text" name="" id="" required value={fullName} />
                                </div>
                                <div className="form-region">
                                    <label htmlFor=""><span>*</span>Регион</label>
                                    <select
                                        name="region"
                                        required
                                        value={selectedRegion}
                                        onChange={(e) => setSelectedRegion(e.target.value)}
                                    >
                                        <option disabled>Выберите регион</option>
                                        {regions.map((region) => (
                                            <option key={region} value={region}>{region}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-coordination">
                                    <label>Координаты</label>
                                    <input type="text" value={coords} />
                                </div>
                                <div className="form-id">
                                    <label>ID</label>
                                    <input type="text" required />
                                </div>
                                <div className="form-count">
                                    <label>Численность населения</label>
                                    <input
                                        type="number"
                                        required
                                        value={population}
                                        onChange={(e) => {
                                            setPopulation(e.target.value);
                                        }}
                                    />
                                </div>
                                <div className="form-charact">
                                    <label>Характеристики</label>
                                    <select>
                                        <option disabled selected>Выбрать</option>
                                        <option></option>
                                        <option></option>
                                    </select>
                                </div>
                                <div className="form-monotown">
                                    <label>Моногород</label>
                                    <input type="checkbox" id="checkbox-switcher" className="options-switcher" />
                                    <label htmlFor="checkbox-switcher" className="options-switcher-label"></label>
                                </div>
                                <div className="form-buttons">
                                    <button className="cancel-btn" type="button" onClick={() => setIsAddWindowOpen(false)}>
                                        Отмена
                                    </button>
                                    <button className="add-btn" type="submit">Добавить</button>
                                </div>
                            </form>
                            <div className="main-map">
                                <MapComponent position={mapPosition} />
                            </div>
                        </div>
                    </div>
                </>
            )}


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

                        <form className="create-map-form" onSubmit={(e) => {
                            e.preventDefault();
                            setIsCreateMapOpen(false);
                            setSavedCities(getSavedCities())
                            const route = {
                                name: routeName,
                                cities: selectedCities,
                            }
                        }}>
                            <div className="name-trace">
                                <label>
                                    <span style={{ color: "red" }}>*</span>Название маршрута
                                </label>
                                <input
                                    type="text"
                                    value={routeName}
                                    name="routeName"
                                    required
                                    onChange={(e) => {
                                        setRouteName(e.target.value)
                                    }}
                                />
                            </div>
                            <div className="about-trace">
                                <label>Описание маршрута</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value)
                                    }}
                                ></textarea>
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
                                <button className="map-submit" type="submit" onClick={() => { setIsModalMapOpen(true) }}>Сохранить</button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {isModalMapOpen && (
                <>
                    <div className="modal-map">
                        <div className="modal-map-nav">
                            <div className="modal-map-title">
                                <div className="route-info">
                                    {downArrow}
                                    {description && (
                                        <div className="route-description">
                                            {description}
                                        </div>
                                    )}
                                </div>
                                <h3>{routeName}</h3>
                            </div>
                            <div className="modal-map-settings">
                                <svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 8.25C9.92894 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92894 15.75 12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25ZM9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12Z" fill="#1C274C"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9747 1.25C11.5303 1.24999 11.1592 1.24999 10.8546 1.27077C10.5375 1.29241 10.238 1.33905 9.94761 1.45933C9.27379 1.73844 8.73843 2.27379 8.45932 2.94762C8.31402 3.29842 8.27467 3.66812 8.25964 4.06996C8.24756 4.39299 8.08454 4.66251 7.84395 4.80141C7.60337 4.94031 7.28845 4.94673 7.00266 4.79568C6.64714 4.60777 6.30729 4.45699 5.93083 4.40743C5.20773 4.31223 4.47642 4.50819 3.89779 4.95219C3.64843 5.14353 3.45827 5.3796 3.28099 5.6434C3.11068 5.89681 2.92517 6.21815 2.70294 6.60307L2.67769 6.64681C2.45545 7.03172 2.26993 7.35304 2.13562 7.62723C1.99581 7.91267 1.88644 8.19539 1.84541 8.50701C1.75021 9.23012 1.94617 9.96142 2.39016 10.5401C2.62128 10.8412 2.92173 11.0602 3.26217 11.2741C3.53595 11.4461 3.68788 11.7221 3.68786 12C3.68785 12.2778 3.53592 12.5538 3.26217 12.7258C2.92169 12.9397 2.62121 13.1587 2.39007 13.4599C1.94607 14.0385 1.75012 14.7698 1.84531 15.4929C1.88634 15.8045 1.99571 16.0873 2.13552 16.3727C2.26983 16.6469 2.45535 16.9682 2.67758 17.3531L2.70284 17.3969C2.92507 17.7818 3.11058 18.1031 3.28089 18.3565C3.45817 18.6203 3.64833 18.8564 3.89769 19.0477C4.47632 19.4917 5.20763 19.6877 5.93073 19.5925C6.30717 19.5429 6.647 19.3922 7.0025 19.2043C7.28833 19.0532 7.60329 19.0596 7.8439 19.1986C8.08452 19.3375 8.24756 19.607 8.25964 19.9301C8.27467 20.3319 8.31403 20.7016 8.45932 21.0524C8.73843 21.7262 9.27379 22.2616 9.94761 22.5407C10.238 22.661 10.5375 22.7076 10.8546 22.7292C11.1592 22.75 11.5303 22.75 11.9747 22.75H12.0252C12.4697 22.75 12.8407 22.75 13.1454 22.7292C13.4625 22.7076 13.762 22.661 14.0524 22.5407C14.7262 22.2616 15.2616 21.7262 15.5407 21.0524C15.686 20.7016 15.7253 20.3319 15.7403 19.93C15.7524 19.607 15.9154 19.3375 16.156 19.1985C16.3966 19.0596 16.7116 19.0532 16.9974 19.2042C17.3529 19.3921 17.6927 19.5429 18.0692 19.5924C18.7923 19.6876 19.5236 19.4917 20.1022 19.0477C20.3516 18.8563 20.5417 18.6203 20.719 18.3565C20.8893 18.1031 21.0748 17.7818 21.297 17.3969L21.3223 17.3531C21.5445 16.9682 21.7301 16.6468 21.8644 16.3726C22.0042 16.0872 22.1135 15.8045 22.1546 15.4929C22.2498 14.7697 22.0538 14.0384 21.6098 13.4598C21.3787 13.1586 21.0782 12.9397 20.7378 12.7258C20.464 12.5538 20.3121 12.2778 20.3121 11.9999C20.3121 11.7221 20.464 11.4462 20.7377 11.2742C21.0783 11.0603 21.3788 10.8414 21.6099 10.5401C22.0539 9.96149 22.2499 9.23019 22.1547 8.50708C22.1136 8.19546 22.0043 7.91274 21.8645 7.6273C21.7302 7.35313 21.5447 7.03183 21.3224 6.64695L21.2972 6.60318C21.0749 6.21825 20.8894 5.89688 20.7191 5.64347C20.5418 5.37967 20.3517 5.1436 20.1023 4.95225C19.5237 4.50826 18.7924 4.3123 18.0692 4.4075C17.6928 4.45706 17.353 4.60782 16.9975 4.79572C16.7117 4.94679 16.3967 4.94036 16.1561 4.80144C15.9155 4.66253 15.7524 4.39297 15.7403 4.06991C15.7253 3.66808 15.686 3.2984 15.5407 2.94762C15.2616 2.27379 14.7262 1.73844 14.0524 1.45933C13.762 1.33905 13.4625 1.29241 13.1454 1.27077C12.8407 1.24999 12.4697 1.24999 12.0252 1.25H11.9747ZM10.5216 2.84515C10.5988 2.81319 10.716 2.78372 10.9567 2.76729C11.2042 2.75041 11.5238 2.75 12 2.75C12.4762 2.75 12.7958 2.75041 13.0432 2.76729C13.284 2.78372 13.4012 2.81319 13.4783 2.84515C13.7846 2.97202 14.028 3.21536 14.1548 3.52165C14.1949 3.61826 14.228 3.76887 14.2414 4.12597C14.271 4.91835 14.68 5.68129 15.4061 6.10048C16.1321 6.51968 16.9974 6.4924 17.6984 6.12188C18.0143 5.9549 18.1614 5.90832 18.265 5.89467C18.5937 5.8514 18.9261 5.94047 19.1891 6.14228C19.2554 6.19312 19.3395 6.27989 19.4741 6.48016C19.6125 6.68603 19.7726 6.9626 20.0107 7.375C20.2488 7.78741 20.4083 8.06438 20.5174 8.28713C20.6235 8.50382 20.6566 8.62007 20.6675 8.70287C20.7108 9.03155 20.6217 9.36397 20.4199 9.62698C20.3562 9.70995 20.2424 9.81399 19.9397 10.0041C19.2684 10.426 18.8122 11.1616 18.8121 11.9999C18.8121 12.8383 19.2683 13.574 19.9397 13.9959C20.2423 14.186 20.3561 14.29 20.4198 14.373C20.6216 14.636 20.7107 14.9684 20.6674 15.2971C20.6565 15.3799 20.6234 15.4961 20.5173 15.7128C20.4082 15.9355 20.2487 16.2125 20.0106 16.6249C19.7725 17.0373 19.6124 17.3139 19.474 17.5198C19.3394 17.72 19.2553 17.8068 19.189 17.8576C18.926 18.0595 18.5936 18.1485 18.2649 18.1053C18.1613 18.0916 18.0142 18.045 17.6983 17.8781C16.9973 17.5075 16.132 17.4803 15.4059 17.8995C14.68 18.3187 14.271 19.0816 14.2414 19.874C14.228 20.2311 14.1949 20.3817 14.1548 20.4784C14.028 20.7846 13.7846 21.028 13.4783 21.1549C13.4012 21.1868 13.284 21.2163 13.0432 21.2327C12.7958 21.2496 12.4762 21.25 12 21.25C11.5238 21.25 11.2042 21.2496 10.9567 21.2327C10.716 21.2163 10.5988 21.1868 10.5216 21.1549C10.2154 21.028 9.97201 20.7846 9.84514 20.4784C9.80512 20.3817 9.77195 20.2311 9.75859 19.874C9.72896 19.0817 9.31997 18.3187 8.5939 17.8995C7.86784 17.4803 7.00262 17.5076 6.30158 17.8781C5.98565 18.0451 5.83863 18.0917 5.73495 18.1053C5.40626 18.1486 5.07385 18.0595 4.81084 17.8577C4.74458 17.8069 4.66045 17.7201 4.52586 17.5198C4.38751 17.314 4.22736 17.0374 3.98926 16.625C3.75115 16.2126 3.59171 15.9356 3.4826 15.7129C3.37646 15.4962 3.34338 15.3799 3.33248 15.2971C3.28921 14.9684 3.37828 14.636 3.5801 14.373C3.64376 14.2901 3.75761 14.186 4.0602 13.9959C4.73158 13.5741 5.18782 12.8384 5.18786 12.0001C5.18791 11.1616 4.73165 10.4259 4.06021 10.004C3.75769 9.81389 3.64385 9.70987 3.58019 9.62691C3.37838 9.3639 3.28931 9.03149 3.33258 8.7028C3.34348 8.62001 3.37656 8.50375 3.4827 8.28707C3.59181 8.06431 3.75125 7.78734 3.98935 7.37493C4.22746 6.96253 4.3876 6.68596 4.52596 6.48009C4.66055 6.27983 4.74468 6.19305 4.81093 6.14222C5.07395 5.9404 5.40636 5.85133 5.73504 5.8946C5.83873 5.90825 5.98576 5.95483 6.30173 6.12184C7.00273 6.49235 7.86791 6.51962 8.59394 6.10045C9.31998 5.68128 9.72896 4.91837 9.75859 4.12602C9.77195 3.76889 9.80512 3.61827 9.84514 3.52165C9.97201 3.21536 10.2154 2.97202 10.5216 2.84515Z" fill="#1C274C"></path> </g></svg>
                            </div>
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
                                        <button className="add-city"
                                            onClick={() => {
                                                setIsAddWindowOpen(true)
                                            }}
                                        >Добавить город</button>
                                    </div>
                                </div>
                                <div className="modal-map-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>{savedCities.length}</th>
                                                <th>Населенный пункт</th>
                                                <th>Численность населения</th>
                                                <th>Свойства</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {savedCities.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{item.city}</td>
                                                    <td>{item.population}</td>
                                                </tr>
                                            ))}
                                        </tbody>
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
                <table>
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

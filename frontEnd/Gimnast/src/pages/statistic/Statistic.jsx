import axios from 'axios'
import './Statistic.css'
import { useEffect, useState, useRef } from 'react';

export default function Statistic() {

    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedDistricts, setExpandedDistricts] = useState({});
    const [selectedItem, setSelectedItem] = useState(null); // { type: 'district' | 'city', district: string, city?: string }
    const districtRefs = useRef({});

    // Сброс выбора при загрузке новых городов
    useEffect(() => {
        if (cities && Object.keys(cities).length > 0) {
            setSelectedItem(null);
            setExpandedDistricts({});
        }
    }, [cities]);

    // Обновление состояния радио-кнопок районов
    useEffect(() => {
        if (!cities) return;

        Object.keys(cities).forEach(district => {
            const radio = districtRefs.current[district];
            if (radio) {
                radio.checked = selectedItem?.type === 'district' && selectedItem?.district === district;
            }
        });
    }, [selectedItem, cities]);

    // Обработка выбора района
    const handleDistrictChange = (district) => {
        if (selectedItem?.type === 'district' && selectedItem?.district === district) {
            // Если уже выбран этот район, снимаем выбор
            setSelectedItem(null);
        } else {
            // Выбираем район
            setSelectedItem({
                type: 'district',
                district: district
            });
        }
    };

    // Обработка выбора города
    const handleCityChange = (district, city) => {
        if (selectedItem?.type === 'city' && selectedItem?.district === district && selectedItem?.city === city) {
            // Если уже выбран этот город, снимаем выбор
            setSelectedItem(null);
        } else {
            // Выбираем город
            setSelectedItem({
                type: 'city',
                district: district,
                city: city
            });
        }
    };

    const toggleExpand = (district) => {
        setExpandedDistricts(prev => ({
            ...prev,
            [district]: !prev[district]
        }));
    };

    const fetchCitiesStat = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8080/cities');
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
        fetchCitiesStat();
    }, []);

    return (
        <>
            <div className="statistic-grid">
                <div className="statistic-regions">
                    {loading && <p className='loading-stat'>Загрузка...</p>}
                    {error && <p className='error-stat'>{error}</p>}
                    {!loading && !error && cities && Object.keys(cities).map(district => {
                        const citiesList = Object.values(cities[district]).flat();
                        const isExpanded = expandedDistricts[district];
                        const isDistrictSelected = selectedItem?.type === 'district' && selectedItem?.district === district;

                        return (
                            <div key={district} className="district-item stat">
                                <div className="district-header stat">
                                    <p
                                        className="expand-icon stat"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExpand(district);
                                        }}
                                    >
                                        {isExpanded ?
                                            <svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.29289 8.29289C4.68342 7.90237 5.31658 7.90237 5.70711 8.29289L12 14.5858L18.2929 8.29289C18.6834 7.90237 19.3166 7.90237 19.7071 8.29289C20.0976 8.68342 20.0976 9.31658 19.7071 9.70711L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071L4.29289 9.70711C3.90237 9.31658 3.90237 8.68342 4.29289 8.29289Z" fill="#000000" />
                                            </svg> :
                                            <svg fill="#000000" width="16px" height="16px" viewBox="-8.5 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M7.75 16.063l-7.688-7.688 3.719-3.594 11.063 11.094-11.344 11.313-3.5-3.469z" />
                                            </svg>
                                        }
                                    </p>
                                    <input
                                        type="radio"
                                        name="selectedDistrict"
                                        ref={el => districtRefs.current[district] = el}
                                        checked={isDistrictSelected}
                                        onChange={() => handleDistrictChange(district)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <p
                                        className="district-name stat"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDistrictChange(district);
                                        }}
                                    >
                                        {district}
                                    </p>
                                </div>
                                {isExpanded && (
                                    <div className="cities-list stat">
                                        {citiesList.map(city => {
                                            const isCitySelected = selectedItem?.type === 'city' &&
                                                selectedItem?.district === district &&
                                                selectedItem?.city === city;

                                            return (
                                                <div
                                                    key={city}
                                                    className="city-item stat"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCityChange(district, city);
                                                    }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="selectedCity"
                                                        value={`${district}-${city}`}
                                                        checked={isCitySelected}
                                                        onChange={() => handleCityChange(district, city)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <p>{city}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="statistic-top-row">
                    <div className="statistic-form">
                        <label>Форма статистики</label>
                        <select>
                            <option>Форма 1502 стандарт</option>
                            <option>1</option>
                            <option>1</option>
                        </select>
                    </div>
                    <div className="control-date">
                        <p>Контрольная дата:</p>
                    </div>
                </div>
                <div className="statistic-window">
                    window
                </div>
            </div>
        </>
    )
}
import "./Questionnaires.css"
import { useMemo, useState } from "react"
import Select from 'react-select'
import citiesData from './cities.json'

export default function Questionnaires() {

    const [scope, setScope] = useState('regions');
    const [isModalopen, setIsModalOpen] = useState(false);
    const [selectedCities, setSelectedCitied] = useState([]);

    const options = useMemo(() => {
        return citiesData.map((item, index) => ({
            value: `${item.city}_${index}`,
            label: `${item.city},`
        }))
    }, [])

    const handleChange = (selectedOptions) => {
        setSelectedCitied(selectedOptions || []);
    }
    return (
        <>

            {isModalopen && (
                <>
                    <div className="modal-bg"></div>
                    <div className="create-window">
                        <div className="win-title">
                            <h4>Создание анкеты</h4>
                            <div
                                className="close-btn"
                                onClick={(e) => {
                                    e.preventDefault()
                                    setIsModalOpen(false)
                                }}
                            >
                                <svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g clip-path="url(#clip0_429_11083)"> <path d="M7 7.00006L17 17.0001M7 17.0001L17 7.00006" stroke="#292929" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path> </g> <defs> <clipPath id="clip0_429_11083"> <rect width="24" height="24" fill="white"></rect> </clipPath> </defs> </g></svg>                    </div>
                        </div>

                        <form method="post" className="create-form">
                            <label><span>*</span>Название анкеты</label>
                            <input type="text" />

                            <label>Инструкция по проведению интервью</label>
                            <textarea></textarea>

                            <div className="region">
                                <label>Анкета актуальна для</label>
                                <div className="scope-switch">
                                    <button
                                        type="button"
                                        className={`switch-btn ${scope === 'regions' ? 'activ' : ''}`} //if scope === regions{className = 'regions'}
                                        onClick={() => setScope('regions')}
                                    >
                                        Регионов
                                    </button>
                                    <button
                                        type="button"
                                        className={`switch-btn ${scope === 'cities' ? 'activ' : ''}`}
                                        onClick={() => setScope('cities')}
                                    >
                                        Городов
                                    </button>
                                </div>
                            </div>

                            <div className="region-list">
                                {scope === 'regions' ? <>
                                    <div className="region-element"><input type="checkbox" name="" id="" /><p>СЕВЕРО-КАВКАЗСКИЙ</p></div>
                                    <div className="region-element"><input type="checkbox" name="" id="" /><p>ЦЕНТРАЛЬНЫЙ</p></div>
                                    <div className="region-element"><input type="checkbox" name="" id="" /><p>СИБИРСКИЙ</p></div>
                                    <div className="region-element"><input type="checkbox" name="" id="" /><p>СЕВЕРО-ЗАПАДНЫЙ</p></div>
                                    <div className="region-element"><input type="checkbox" name="" id="" /><p>УРАЛЬСКИЙ</p></div>
                                    <div className="region-element"><input type="checkbox" name="" id="" /><p>ЮЖНЫЙ</p></div>
                                    <div className="region-element"><input type="checkbox" name="" id="" /><p>ДАЛЬНЕВОСТОЧНЫЙ</p></div>
                                    <div className="region-element"><input type="checkbox" name="" id="" /><p>ПРИВОЛЖСКИЙ</p></div>
                                </> : ''}
                                {scope === 'cities' ? <>
                                    <div className="cities-list">
                                        <Select
                                            isMulti
                                            name="cities"
                                            options={options}
                                            value={selectedCities}
                                            onChange={handleChange}
                                            placeholder="Начните вводить название..."
                                            noOptionsMessage={() => "Город не найден"}
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        /></div>
                                </> : ''}
                            </div>

                            <div className="submit-form">
                                <button
                                    className="cancel-btn"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setIsModalOpen(false)
                                    }}
                                >
                                    Отменить</button>
                                <button type="submit" className="save-btn">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </>
            )}



            <div className="buttons">
                <button
                    className="create-btn"
                    onClick={() => {
                        setIsModalOpen(true)
                    }}
                >
                    <p>Создать анкету</p>
                </button>
                <button className="update-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21.986"><path d="M19.841 3.24A10.988 10.988 0 0 0 8.54.573l1.266 3.8a7.033 7.033 0 0 1 8.809 9.158L17 11.891v7.092h7l-2.407-2.439A11.049 11.049 0 0 0 19.841 3.24zM1 10.942a11.05 11.05 0 0 0 11.013 11.044 11.114 11.114 0 0 0 3.521-.575l-1.266-3.8a7.035 7.035 0 0 1-8.788-9.22L7 9.891V6.034c.021-.02.038-.044.06-.065L7 5.909V2.982H0l2.482 2.449A10.951 10.951 0 0 0 1 10.942z" /></svg>
                </button>
            </div>

            <div className="questionnaires-table">
                <table>
                    <thead>
                        <th>Название анкеты</th>
                        <th>Код опроса</th>
                        <th>Дата создания</th>
                        <th> </th>
                    </thead>
                    <tbody>

                    </tbody>
                </table>
            </div>
        </>
    )
}
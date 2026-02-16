import './Survey.css'
import { useState } from 'react'

export default function Survey() {

    const [isWindowOpen, setIsWindowOpen] = useState(false);


    return (
        <>
            {isWindowOpen && (
                <>
                    <div className="modal-bg"></div>
                    <div className="survey-window">
                        <form action="#" className="survey-form">
                            <div className="survey-input">
                                <label><span>*</span>Название опроса</label>
                                <input type="text" />
                            </div>
                            <div className="survey-input">
                                <label><span>*</span>Код опроса</label>
                                <input type="text" />
                            </div>
                            <div className="survey-select">
                                <label><span>*</span>Ответсвенный</label>
                                <select>
                                    <option value="" disabled>Выбрать</option>
                                    <option value="">Option1</option>
                                    <option value="">Option2</option>
                                </select>
                            </div>
                        </form>
                    </div>
                </>
            )}
            <div className="buttons" onClick={() => { setIsWindowOpen(true) }}>
                <button className="create-btn">Создать опрос</button>
                <button className="update-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="21.986">
                        <path d="M19.841 3.24A10.988 10.988 0 0 0 8.54.573l1.266 3.8a7.033 7.033 0 0 1 8.809 9.158L17 11.891v7.092h7l-2.407-2.439A11.049 11.049 0 0 0 19.841 3.24zM1 10.942a11.05 11.05 0 0 0 11.013 11.044 11.114 11.114 0 0 0 3.521-.575l-1.266-3.8a7.035 7.035 0 0 1-8.788-9.22L7 9.891V6.034c.021-.02.038-.044.06-.065L7 5.909V2.982H0l2.482 2.449A10.951 10.951 0 0 0 1 10.942z" />
                    </svg>
                </button>
            </div>
        </>
    )
}
import './Auth.css';
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'

export default function Auth() {

    const [login, setLogin] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const response = await axios.post('/api/login', {
                login: login,
                password: password,
            });

            if (response.data.access === 'confirmed') {
                localStorage.setItem('isAuthenticated', 'true')
                navigate('/')
            } else setError('Неверный логин или пароль!')
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setError('Ошибка входа: неверные данные.')
            } else {
                setError('Ошибка при подключении. Повторите попытку.')
            }
            console.error('Ошибка авторизации', err);
        }
    };

    return (
        <div className="authWindow">
            <form className="authForm" onSubmit={handleSubmit}>
                <div className="loginField">
                    <label htmlFor="login">Логин:</label>
                    <input
                        type="text"
                        name="login"
                        value={login}
                        onChange={(e) => {
                            setLogin(e.target.value)
                        }}
                        required
                    />
                </div>
                <div className="passwordField">
                    <label htmlFor="password">Пароль:</label>
                    <input
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                        }}
                        required
                    />
                </div>
                <button type="submit" className='formBtn'>Войти</button>
                {error && <p className='errorText'>{error}</p>}
            </form>
        </div>
    )
}
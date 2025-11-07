import { useState } from 'react'
import './App.css'
import axios from 'axios';

function App() {

  const [userLogin, setUserLogin] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:8080/', {
        login: userLogin,
        password: userPassword,
      });
      setUserLogin('');
      setUserPassword('');
      return response.data
    } catch (error) {
      setError('Ошибка при подключении к серверу')
      return error
    }
  }

  return (
    <>
      <form method="post" onSubmit={handleSubmit}>
        <h4>Добавить пользователя</h4>
        <label htmlFor="userLogin"><p>Логин:</p></label>
        <input
          type="text"
          name="userLogin"
          value={userLogin}
          required
          onChange={(e) => {
            setUserLogin(e.target.value)
          }}
        />
        <label htmlFor="userPassword"><p>Пароль:</p></label>
        <input
          type="text"
          name="userPassword"
          required
          value={userPassword}
          onChange={(e) => {
            setUserPassword(e.target.value)
          }}
        />
        <button type="submit">Добавить</button>
        {error && <p>{error}</p>}
      </form>
    </>
  )
}

export default App

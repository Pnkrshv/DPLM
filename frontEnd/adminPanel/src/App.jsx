import { useEffect, useState } from 'react'
import './App.css'
import axios from 'axios';

function App() {

  const [userLogin, setUserLogin] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setisLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8080/');
      setUsers(response.data)
    } catch (error) {
      console.error("Ошибка загрузки пользователей: ", error);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [])

  // Обработчик формы

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    setisLoading(true)
    try {
      const response = await axios.post('http://localhost:8080/', {
        login: userLogin,
        password: userPassword,
      });
      setUserLogin('');
      setUserPassword('');
      setSuccess(response.data.message);
      await fetchUsers();
      return response.data
    } catch (error) {
      if (axios.isAxiosError) {
        if (error.response) { //сервер ответил, но с ошибкой
          if (error.response.data && error.response.data.error) {
            setError(error.response.data.error)
          } else {
            setError(`Ошибка, статус: ${error.response.status}`)
          }
        }

        else if (error.request) { //ошибка при подключении к серверу (запрос ушел, а ответа нет)
          setError('Ошибка при подключении к серверу')
        }
      }
      return error
    } finally {
      setisLoading(false);
    }
  }

  //Обработчик удаления

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить пользователя?')) {
      return;
    }

    setisLoading(true)

    try {
      const response = await axios.delete(`http://localhost:8080/${id}`);
      fetchUsers();
      return response.data
    } catch (error) {
      console.error('Ошибка удаления: ', error)
    } finally {
      setisLoading(false)
    }
  }

  return (
    <div className='panel'>
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
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
        <div className="added">
          {error && <p className='error'>{error}</p>}
          {success && <p className='success'>{success}</p>}
        </div>
      </form>

      <div className="users-table">
        <h3>Список пользователей</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Логин</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.ID}>
                  <td>{user.id}</td>
                  <td>{user.login}</td>
                  <td><button
                    onClick={() => { handleDelete(user.id) }}
                    className='delete-btn'
                  >
                    <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6" />
                    </svg>

                  </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td>Нет пользователей</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App

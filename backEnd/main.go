package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func initDB() {
	dsn := "host=94.156.180.244 user=postgres password=Cergey27249 dbname=postgres port=5432 sslmode=disable"
	var err error

	db, err = gorm.Open(postgres.Open(dsn))
	if err != nil {
		log.Fatalf("Ошибка при подключении к БД: %v", err)
	}

	if err := db.AutoMigrate(&UserData{}); err != nil {
		log.Fatalf("Ошибка миграции БД: %v", err)
	}
}

type City struct {
	Name   string `json:"city"`
	Region string `json:"region"`
}

//Добавление пользователей из админки:

type UserData struct {
	ID           string `gorm:"primaryKey" json:"id"`
	Login        string `json:"login"`
	Password     string `json:"password,omitempty" gorm:"-"`
	HashPassword string `json:"-"`
}

func addUser(c echo.Context) error {
	user := new(UserData)

	if err := c.Bind(user); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Внутренняя ошибка на сервере",
		})
	}

	user.HashPassword = string(hash)
	user.ID = uuid.NewString()

	result := db.Create(user)

	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось создать пользователя",
		})
	}

	return c.JSON(http.StatusCreated, echo.Map{
		"id":      user.ID,
		"login":   user.Login,
		"message": "Пользователь успешно зарегистрирован",
	})
}

// Удаление пользователей из админки:
func deleteUser(c echo.Context) error {
	id := c.Param("id")

	result := db.Delete(&UserData{}, "id = ?", id)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Пользователь не был удален",
		})
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusOK, echo.Map{
			"error": "Пользователь не найден",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "Пользователь успешно удален",
	})
}

// вывод всех пользователей:
func getAllUsers(c echo.Context) error {
	var users []UserData

	result := db.Find(&users)

	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка при получении списка пользователей",
		})
	}

	return c.JSON(http.StatusOK, users)

}

//Авторизация:

type loginData struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

func getAuth(c echo.Context) error {
	data := new(loginData)

	if err := c.Bind(data); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid request"})
	}

	var user UserData
	result := db.Where("login = ?", data.Login).First(&user)

	if result.Error != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{
			"error":  "Неверный логин или пароль.",
			"access": "denied",
		})
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.HashPassword), []byte(data.Password))

	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{
			"access": "denied",
			"error":  "Неверный логин или пароль.",
		})
	}
	//Успешная авторизация:
	return c.JSON(http.StatusOK, echo.Map{
		"access": "confirmed",
		"id":     user.ID,
		"login":  user.Login,
	})

}

// Структура для городов
type Cities struct {
	Region string `json:"region"`
	City   string `json:"city`
}

func loadingCities() ([]Cities, error) {
	var cities []Cities

	//Читаем json
	data, err := os.ReadFile("cities.json")
	if err != nil {
		log.Printf("Файл не найден!")
		return getTestCities(), err
	}

	if err := json.Unmarshal(data, &cities); err != nil {
		return nil, err
	}

	return cities, nil
}

//Тестовый набор городов
func getTestCities() []Cities {
	return []Cities{
		{Region: "Москва и Московская область", City: "Москва"},
		{Region: "Санкт-Петербург и область", City: "Санкт-Петербург"},
		{Region: "Орловская область", City: "Орёл"},
	}
}

//Выгрузка городов в фронт
func getCities(c echo.Context) error {
	cities, err := loadingCities()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка загрузки городова...",
		})
	}
	 return c.JSON(http.StatusOK, cities)
}

func main() {
	initDB()
	e := echo.New()
	e.Use(middleware.CORS())
	e.POST("/login", getAuth)
	e.POST("/", addUser)
	e.GET("/", getAllUsers)
	e.DELETE("/:id", deleteUser)
	e.GET("/cities", getCities)
	e.Start(":8080")
}

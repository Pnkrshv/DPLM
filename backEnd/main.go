package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func initDB() {
	dsn := "host=150.241.74.20 user=postgres password=Cergey27249 dbname=dplm_db port=5432 sslmode=disable"
	var err error

	db, err = gorm.Open(postgres.Open(dsn))
	if err != nil {
		log.Fatalf("Ошибка при подключении к БД: %v", err)
	}

	if err := db.AutoMigrate(&UserData{}, &SampleData{}); err != nil {
		log.Fatalf("Ошибка миграции БД: %v", err)
	}
}

// Добавление пользователей из админки:
type UserData struct {
	ID           string `gorm:"primaryKey" json:"id"`
	Login        string `json:"login"`
	Password     string `json:"password,omitempty" gorm:"-"`
	HashPassword string `json:"-"`
}

// Модель для выборок:
type SampleData struct {
	ID               string    `gorm:"primaryKey" json:"id"`
	Name             string    `json:"name"`
	HardQuotas       string    `json:"hard_quotas" gorm:"type:jsonb"`
	SoftQuotas       string    `json:"soft_quotas" gorm:"type:jsonb"`
	RespondentsCount int       `json:"respondents_count"`
	SampleType       string    `json:"sample_type"`
	UpdatedAt        time.Time `json:"updated_at"`
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

// Авторизация:
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

// Выгрузка ФО и регионов:
type FederalDistricts map[string]map[string][]string

func loadingCities() (FederalDistricts, error) {
	var districts FederalDistricts

	data, err := os.ReadFile("data/cities.json")
	if err != nil {
		log.Printf("File is not find: %s", err)
		return nil, err
	}

	if err := json.Unmarshal(data, &districts); err != nil {
		log.Printf("Error of parsing: %s", err)
		return nil, err
	}

	return districts, nil
}

func getCities(c echo.Context) error {
	cities, err := loadingCities()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка загрузки городов",
		})
	}

	return c.JSON(http.StatusOK, cities)
}

type CityResult struct {
	City     string `json:"city"`
	Region   string `json:"region"`
	District string `json:"district"`
}

func searchCities(c echo.Context) error {

	query := strings.ToLower(c.QueryParam("q"))

	if query == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "query param q is required",
		})
	}

	data, err := loadingCities()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка загрузки городов",
		})
	}

	var results []CityResult

	for district, regions := range data {
		for region, cities := range regions {
			for _, city := range cities {

				if strings.Contains(strings.ToLower(city), query) {
					results = append(results, CityResult{
						City:     city,
						Region:   region,
						District: district,
					})
				}

				if len(results) >= 10 {
					return c.JSON(http.StatusOK, results)
				}
			}
		}
	}

	return c.JSON(http.StatusOK, results)
}

// Создание выборки:
func createSample(c echo.Context) error {
	sample := new(SampleData)

	if err := c.Bind(sample); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}

	sample.ID = uuid.NewString()
	sample.UpdatedAt = time.Now()

	result := db.Create(sample)

	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось создать выборку",
		})
	}

	return c.JSON(http.StatusCreated, echo.Map{
		"id":      sample.ID,
		"name":    sample.Name,
		"message": "Выборка успешно создана",
	})
}

// Получение всех выборок:
func getAllSamples(c echo.Context) error {
	var samples []SampleData

	result := db.Order("updated_at DESC").Find(&samples)

	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка при получении списка выборок",
		})
	}

	return c.JSON(http.StatusOK, samples)
}

// Получение выборки по ID:
func getSampleByID(c echo.Context) error {
	id := c.Param("id")

	var sample SampleData
	result := db.Where("id = ?", id).First(&sample)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, echo.Map{
				"error": "Выборка не найдена",
			})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка при получении выборки",
		})
	}

	return c.JSON(http.StatusOK, sample)
}

// Обновление выборки:
func updateSample(c echo.Context) error {
	id := c.Param("id")
	sample := new(SampleData)

	if err := c.Bind(sample); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}

	sample.UpdatedAt = time.Now()

	result := db.Model(&SampleData{}).Where("id = ?", id).Updates(sample)

	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось обновить выборку",
		})
	}

	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, echo.Map{
			"error": "Выборка не найдена",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"id":      id,
		"message": "Выборка успешно обновлена",
	})
}

// Удаление выборки:
func deleteSample(c echo.Context) error {
	id := c.Param("id")

	result := db.Delete(&SampleData{}, "id = ?", id)

	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Выборка не была удалена",
		})
	}

	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, echo.Map{
			"error": "Выборка не найдена",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "Выборка успешно удалена",
	})
}

func main() {
	initDB()
	e := echo.New()
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
	}))
	e.POST("/login", getAuth)
	e.POST("/", addUser)
	e.GET("/", getAllUsers)
	e.DELETE("/user/:id", deleteUser)
	e.GET("/cities", getCities)
	e.GET("/cities/search", searchCities)
	// Эндпоинты для выборок:
	e.POST("/sample", createSample)
	e.GET("/samples", getAllSamples)
	e.GET("/sample/:id", getSampleByID)
	e.PUT("/sample/:id", updateSample)
	e.DELETE("/sample/:id", deleteSample)
	e.Start(":8080")
}

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

	if err := db.AutoMigrate(&UserData{}, &SampleData{}, &RouteData{}, &SurveyData{}, &QuestionnaireData{}, &Question{}, &Answer{}); err != nil {
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

// Модель для маршрутов:
type RouteData struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description" gorm:"type:text"`
	Status      string    `json:"status" gorm:"default:'черновик'"`
	CitiesCount int       `json:"cities_count"`
	CitiesData  string    `json:"cities_data" gorm:"type:jsonb"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Модель для анкет:
type QuestionnaireData struct {
	ID          string     `gorm:"primaryKey" json:"id"`
	Name        string     `json:"name"`
	Code        string     `json:"code"`
	Description string     `json:"description" gorm:"type:text"`
	Scope       string     `json:"scope" gorm:"default:'regions'"`
	Status      string     `json:"status" gorm:"default:'черновик'"`
	Questions   []Question `gorm:"foreignKey:QuestionnaireID" json:"questions,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// Модель для вопроса анкеты
type Question struct {
	ID              string    `gorm:"primaryKey" json:"id"`
	QuestionnaireID string    `gorm:"type:uuid;not null" json:"questionnaire_id"`
	Type            string    `gorm:"type:varchar(50);not null" json:"type"` // open, closed, mixed, scale, dichotomous
	Text            string    `gorm:"type:text;not null" json:"text"`
	Explanation     string    `gorm:"type:text" json:"explanation"`
	OrderIndex      int       `gorm:"not null;default:0" json:"order_index"`
	BlockType       string    `gorm:"type:varchar(50);default:'main'" json:"block_type"`  // main, passport
	IsRandomized    bool      `gorm:"default:false" json:"is_randomized"`                 // перемешивать ответы
	MaxAnswers      int       `gorm:"default:0" json:"max_answers"`                       // максимум ответов (0 = неограниченно)
	RegionScope     string    `gorm:"type:varchar(50);default:'all'" json:"region_scope"` // для каких регионов
	HideRules       string    `gorm:"type:text" json:"hide_rules"`                        // правила скрытия (JSON)
	TransitionRules string    `gorm:"type:text" json:"transition_rules"`                  // правила перехода (JSON)
	Answers         []Answer  `gorm:"foreignKey:QuestionID" json:"answers,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// Модель для варианта ответа
type Answer struct {
	ID         string    `gorm:"primaryKey" json:"id"`
	QuestionID string    `gorm:"type:uuid;not null" json:"question_id"`
	Type       string    `gorm:"type:varchar(50);not null" json:"type"` // text, no_answer, refuse, other, agree_disagree, like_dislike, custom
	Text       string    `gorm:"type:text" json:"text"`
	OrderIndex int       `gorm:"not null;default:0" json:"order_index"`
	IsRequired bool      `gorm:"default:false" json:"is_required"`
	CreatedAt  time.Time `json:"created_at"`
}

// Модель для опросов:
type SurveyData struct {
	ID              string     `gorm:"primaryKey" json:"id"`
	Name            string     `json:"name"`
	Code            string     `json:"code"`
	Responsible     string     `json:"responsible"`
	StartDate       *time.Time `json:"start_date"`
	EndDate         *time.Time `json:"end_date"`
	Adaptation      bool       `json:"adaptation"`
	AdaptationDate  *time.Time `json:"adaptation_date"`
	Koir            bool       `json:"koir"`
	ExitPoll        bool       `json:"exit_poll"`
	ManualInput     bool       `json:"manual_input"`
	SampleID        string     `json:"sample_id" gorm:"default:''"`
	QuestionnaireID string     `json:"questionnaire_id" gorm:"default:''"`
	RouteID         string     `json:"route_id" gorm:"default:''"`
	Status          string     `json:"status" gorm:"default:'черновик'"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
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
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Invalid request",
		})
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

// Создание маршрута:
func createRoute(c echo.Context) error {
	route := new(RouteData)

	if err := c.Bind(route); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}

	route.ID = uuid.NewString()
	route.CreatedAt = time.Now()
	route.UpdatedAt = time.Now()
	route.Status = "черновик"

	// Проверяем, что название передано
	if route.Name == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Название маршрута обязательно",
		})
	}

	result := db.Create(route)

	if result.Error != nil {
		log.Printf("Ошибка БД: %v", result.Error)
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось создать маршрут",
		})
	}

	log.Printf("Маршрут создан: ID=%s, Name=%s, CitiesCount=%d", route.ID, route.Name, route.CitiesCount)

	return c.JSON(http.StatusCreated, echo.Map{
		"id":           route.ID,
		"name":         route.Name,
		"cities_count": route.CitiesCount,
		"message":      "Маршрут успешно создан",
	})
}

// Получение всех маршрутов:
func getAllRoutes(c echo.Context) error {
	var routes []RouteData

	result := db.Order("created_at DESC").Find(&routes)

	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка при получении списка маршрутов",
		})
	}

	return c.JSON(http.StatusOK, routes)
}

// Получение маршрута по ID:
func getRouteByID(c echo.Context) error {
	id := c.Param("id")

	var route RouteData
	result := db.Where("id = ?", id).First(&route)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, echo.Map{
				"error": "Маршрут не найден",
			})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка при получении маршрута",
		})
	}

	return c.JSON(http.StatusOK, route)
}

// Обновление маршрута:
func updateRoute(c echo.Context) error {
	id := c.Param("id")
	route := new(RouteData)

	if err := c.Bind(route); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}

	route.UpdatedAt = time.Now()

	result := db.Model(&RouteData{}).Where("id = ?", id).Updates(route)

	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось обновить маршрут",
		})
	}

	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, echo.Map{
			"error": "Маршрут не найден",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"id":      id,
		"message": "Маршрут успешно обновлен",
	})
}

// Удаление маршрута:
func deleteRoute(c echo.Context) error {
	id := c.Param("id")

	result := db.Delete(&RouteData{}, "id = ?", id)

	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Маршрут не был удален",
		})
	}

	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, echo.Map{
			"error": "Маршрут не найден",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "Маршрут успешно удален",
	})
}

// Создание опроса:
func createSurvey(c echo.Context) error {
	survey := new(SurveyData)
	if err := c.Bind(survey); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}
	survey.ID = uuid.NewString()
	survey.CreatedAt = time.Now()
	survey.UpdatedAt = time.Now()
	survey.Status = "черновик"
	if survey.Name == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Название опроса обязательно",
		})
	}
	if err := db.Create(survey).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось создать опрос",
		})
	}
	return c.JSON(http.StatusCreated, echo.Map{
		"id":      survey.ID,
		"name":    survey.Name,
		"message": "Опрос успешно создан",
	})
}

// Получение всех опросов:
func getAllSurveys(c echo.Context) error {
	var surveys []SurveyData
	if err := db.Order("created_at DESC").Find(&surveys).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка при получении опросов",
		})
	}
	return c.JSON(http.StatusOK, surveys)
}

// Обновление опроса:
func updateSurvey(c echo.Context) error {
	id := c.Param("id")
	survey := new(SurveyData)
	if err := c.Bind(survey); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}
	survey.UpdatedAt = time.Now()
	if err := db.Model(&SurveyData{}).Where("id = ?", id).Updates(survey).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось обновить опрос",
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"id":      id,
		"message": "Опрос успешно обновлен",
	})
}

// Удаление опроса:
func deleteSurvey(c echo.Context) error {
	id := c.Param("id")
	if err := db.Delete(&SurveyData{}, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось удалить опрос",
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"message": "Опрос успешно удален",
	})
}

// Обновление выборки в опросе:
func updateSurveySample(c echo.Context) error {
	id := c.Param("id")
	data := new(struct {
		SampleID string `json:"sample_id"`
	})
	if err := c.Bind(data); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}
	if err := db.Model(&SurveyData{}).Where("id = ?", id).Update("sample_id", data.SampleID).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось обновить выборку",
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"id":        id,
		"sample_id": data.SampleID,
		"message":   "Выборка обновлена",
	})
}

// Обновление анкеты в опросе:
func updateSurveyQuestionnaire(c echo.Context) error {
	id := c.Param("id")
	data := new(struct {
		QuestionnaireID string `json:"questionnaire_id"`
	})
	if err := c.Bind(data); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}
	if err := db.Model(&SurveyData{}).Where("id = ?", id).Update("questionnaire_id", data.QuestionnaireID).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось обновить анкету",
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"id":               id,
		"questionnaire_id": data.QuestionnaireID,
		"message":          "Анкета обновлена",
	})
}

// Обновление маршрута в опросе:
func updateSurveyRoute(c echo.Context) error {
	id := c.Param("id")
	data := new(struct {
		RouteID string `json:"route_id"`
	})
	if err := c.Bind(data); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}
	if err := db.Model(&SurveyData{}).Where("id = ?", id).Update("route_id", data.RouteID).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось обновить маршрут",
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"id":       id,
		"route_id": data.RouteID,
		"message":  "Маршрут обновлен",
	})
}

// Создание анкеты:
func createQuestionnaire(c echo.Context) error {
	q := new(QuestionnaireData)
	if err := c.Bind(q); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}
	q.ID = uuid.NewString()
	q.CreatedAt = time.Now()
	q.UpdatedAt = time.Now()
	q.Status = "черновик"
	if q.Scope == "" {
		q.Scope = "regions"
	}
	if q.Name == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Название анкеты обязательно",
		})
	}
	if err := db.Create(q).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось создать анкету",
		})
	}
	return c.JSON(http.StatusCreated, echo.Map{
		"id":          q.ID,
		"name":        q.Name,
		"code":        q.Code,
		"description": q.Description,
		"scope":       q.Scope,
		"status":      q.Status,
		"created_at":  q.CreatedAt,
		"updated_at":  q.UpdatedAt,
		"message":     "Анкета успешно создана",
	})
}

// Получение всех анкет:
func getAllQuestionnaires(c echo.Context) error {
	var questionnaires []QuestionnaireData
	if err := db.Order("updated_at DESC").Find(&questionnaires).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка при получении анкет",
		})
	}
	return c.JSON(http.StatusOK, questionnaires)
}

// Получение анкеты по ID:
func getQuestionnaireByID(c echo.Context) error {
	id := c.Param("id")

	var questionnaire QuestionnaireData
	result := db.Where("id = ?", id).First(&questionnaire)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, echo.Map{
				"error": "Анкета не найдена",
			})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка при получении анкеты",
		})
	}

	return c.JSON(http.StatusOK, questionnaire)
}

// Получение полной анкеты с вопросами и ответами
func getQuestionnaireFull(c echo.Context) error {
	id := c.Param("id")

	var questionnaire QuestionnaireData
	result := db.Where("id = ?", id).First(&questionnaire)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, echo.Map{
				"error": "Анкета не найдена",
			})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка при получении анкеты",
		})
	}

	// Загружаем вопросы
	var questions []Question
	if err := db.Where("questionnaire_id = ?", id).Order("order_index ASC").Find(&questions).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка при получении вопросов",
		})
	}

	// Загружаем ответы для каждого вопроса
	for i := range questions {
		if err := db.Where("question_id = ?", questions[i].ID).Order("order_index ASC").Find(&questions[i].Answers).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"error": "Ошибка при получении ответов",
			})
		}
	}
	questionnaire.Questions = questions

	return c.JSON(http.StatusOK, questionnaire)
}

// Обновление анкеты:
func updateQuestionnaire(c echo.Context) error {
	id := c.Param("id")
	q := new(QuestionnaireData)
	if err := c.Bind(q); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}
	q.UpdatedAt = time.Now()
	if err := db.Model(&QuestionnaireData{}).Where("id = ?", id).Updates(q).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось обновить анкету",
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"id":      id,
		"message": "Анкета успешно обновлена",
	})
}

// Удаление анкеты:
func deleteQuestionnaire(c echo.Context) error {
	id := c.Param("id")
	if err := db.Delete(&QuestionnaireData{}, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось удалить анкету",
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"message": "Анкета успешно удалена",
	})
}

// Создание вопроса в анкете
func createQuestion(c echo.Context) error {
	questionnaireID := c.Param("id")

	// Проверяем существование анкеты
	var questionnaire QuestionnaireData
	if err := db.First(&questionnaire, "id = ?", questionnaireID).Error; err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{
			"error": "Анкета не найдена",
		})
	}

	// Структуры для парсинга запроса
	type AnswerPayload struct {
		Type       string `json:"type"`
		Text       string `json:"text"`
		OrderIndex int    `json:"order_index"`
		IsRequired bool   `json:"is_required"`
	}

	type QuestionRequest struct {
		Type            string          `json:"type"`
		Text            string          `json:"text"`
		Explanation     string          `json:"explanation"`
		OrderIndex      int             `json:"order_index"`
		BlockType       string          `json:"block_type"`
		IsRandomized    bool            `json:"is_randomized"`
		MaxAnswers      int             `json:"max_answers"`
		RegionScope     string          `json:"region_scope"`
		HideRules       string          `json:"hide_rules"`
		TransitionRules string          `json:"transition_rules"`
		Answers         []AnswerPayload `json:"answers"`
	}

	var req QuestionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных вопроса",
		})
	}

	if req.Text == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Текст вопроса обязателен",
		})
	}

	// Создаём вопрос
	q := &Question{
		ID:              uuid.NewString(),
		QuestionnaireID: questionnaireID,
		Type:            req.Type,
		Text:            req.Text,
		Explanation:     req.Explanation,
		OrderIndex:      req.OrderIndex,
		BlockType:       req.BlockType,
		IsRandomized:    req.IsRandomized,
		MaxAnswers:      req.MaxAnswers,
		RegionScope:     req.RegionScope,
		HideRules:       req.HideRules,
		TransitionRules: req.TransitionRules,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := db.Create(q).Error; err != nil {
		log.Printf("Ошибка при создании вопроса: %v", err)
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось создать вопрос",
		})
	}

	// Создаём ответы
	for _, ans := range req.Answers {
		answer := &Answer{
			ID:         uuid.NewString(),
			QuestionID: q.ID,
			Type:       ans.Type,
			Text:       ans.Text,
			OrderIndex: ans.OrderIndex,
			IsRequired: ans.IsRequired,
			CreatedAt:  time.Now(),
		}
		if err := db.Create(answer).Error; err != nil {
			log.Printf("Ошибка при создании ответа: %v", err)
		}
	}

	// Загружаем созданные ответы для ответа клиенту
	var answers []Answer
	db.Where("question_id = ?", q.ID).Order("order_index ASC").Find(&answers)
	q.Answers = answers

	return c.JSON(http.StatusCreated, q)
}

// Получение вопросов анкеты
func getQuestionsByQuestionnaireID(c echo.Context) error {
	questionnaireID := c.Param("id")
	var questions []Question
	if err := db.Where("questionnaire_id = ?", questionnaireID).Order("order_index ASC").Find(&questions).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Ошибка при получении вопросов",
		})
	}

	// Загружаем ответы для каждого вопроса
	for i := range questions {
		if err := db.Where("question_id = ?", questions[i].ID).Order("order_index ASC").Find(&questions[i].Answers).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"error": "Ошибка при получении ответов",
			})
		}
	}

	return c.JSON(http.StatusOK, questions)
}

// Обновление вопроса
func updateQuestion(c echo.Context) error {
	questionnaireID := c.Param("questionnaire_id")
	questionID := c.Param("question_id")

	// Проверяем принадлежность вопроса анкете
	var question Question
	if err := db.Where("id = ? AND questionnaire_id = ?", questionID, questionnaireID).First(&question).Error; err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{
			"error": "Вопрос не найден",
		})
	}

	q := new(Question)
	if err := c.Bind(q); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}

	q.UpdatedAt = time.Now()
	if err := db.Model(&Question{}).Where("id = ?", questionID).Updates(q).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось обновить вопрос",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"id":      questionID,
		"message": "Вопрос успешно обновлен",
	})
}

// Удаление вопроса
func deleteQuestion(c echo.Context) error {
	questionnaireID := c.Param("questionnaire_id")
	questionID := c.Param("question_id")

	// Проверяем принадлежность вопроса анкете
	var question Question
	if err := db.Where("id = ? AND questionnaire_id = ?", questionID, questionnaireID).First(&question).Error; err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{
			"error": "Вопрос не найден",
		})
	}

	// Сначала удаляем все ответы, связанные с вопросом
	if err := db.Where("question_id = ?", questionID).Delete(&Answer{}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось удалить ответы вопроса",
		})
	}

	// Затем удаляем сам вопрос
	if err := db.Delete(&Question{}, "id = ?", questionID).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось удалить вопрос",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "Вопрос успешно удален",
	})
}

// Обновление правил скрытия для вопроса
func updateHideRules(c echo.Context) error {
	questionID := c.Param("question_id")

	type HideRulesRequest struct {
		HideRules string `json:"hide_rules"`
	}

	var req HideRulesRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}

	// Проверяем существование вопроса
	var question Question
	if err := db.First(&question, "id = ?", questionID).Error; err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{
			"error": "Вопрос не найден",
		})
	}

	if err := db.Model(&Question{}).Where("id = ?", questionID).Update("hide_rules", req.HideRules).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось обновить правила скрытия",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"id":      questionID,
		"message": "Правила скрытия успешно обновлены",
	})
}

// Обновление правил перехода для вопроса
func updateTransitionRules(c echo.Context) error {
	questionID := c.Param("question_id")

	type TransitionRulesRequest struct {
		TransitionRules string `json:"transition_rules"`
	}

	var req TransitionRulesRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}

	// Проверяем существование вопроса
	var question Question
	if err := db.First(&question, "id = ?", questionID).Error; err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{
			"error": "Вопрос не найден",
		})
	}

	if err := db.Model(&Question{}).Where("id = ?", questionID).Update("transition_rules", req.TransitionRules).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось обновить правила перехода",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"id":      questionID,
		"message": "Правила перехода успешно обновлены",
	})
}

// Добавление ответа к вопросу
func createAnswer(c echo.Context) error {
	questionID := c.Param("question_id")

	// Проверяем существование вопроса
	var question Question
	if err := db.First(&question, "id = ?", questionID).Error; err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{
			"error": "Вопрос не найден",
		})
	}

	a := new(Answer)
	if err := c.Bind(a); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"error": "Неверный формат данных",
		})
	}

	a.ID = uuid.NewString()
	a.QuestionID = questionID
	a.CreatedAt = time.Now()

	if err := db.Create(a).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось создать ответ",
		})
	}

	return c.JSON(http.StatusCreated, a)
}

// Удаление ответа
func deleteAnswer(c echo.Context) error {
	answerID := c.Param("answer_id")

	if err := db.Delete(&Answer{}, "id = ?", answerID).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"error": "Не удалось удалить ответ",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "Ответ успешно удален",
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
	// Эндпоинты для маршрутов:
	e.POST("/route", createRoute)
	e.GET("/routes", getAllRoutes)
	e.GET("/route/:id", getRouteByID)
	e.PUT("/route/:id", updateRoute)
	e.DELETE("/route/:id", deleteRoute)
	// Эндпоинты для опросов:
	e.POST("/survey", createSurvey)
	e.GET("/surveys", getAllSurveys)
	e.PUT("/survey/:id", updateSurvey)
	e.DELETE("/survey/:id", deleteSurvey)
	// PATCH endpoint'ы для обновления связанных данных
	e.PATCH("/survey/:id/sample", updateSurveySample)
	e.PATCH("/survey/:id/questionnaire", updateSurveyQuestionnaire)
	e.PATCH("/survey/:id/route", updateSurveyRoute)
	// Эндпоинты для анкет:
	e.POST("/questionnaire", createQuestionnaire)
	e.GET("/questionnaires", getAllQuestionnaires)
	e.GET("/questionnaire/:id", getQuestionnaireByID)
	e.GET("/questionnaire/:id/full", getQuestionnaireFull)
	e.PUT("/questionnaire/:id", updateQuestionnaire)
	e.DELETE("/questionnaire/:id", deleteQuestionnaire)
	// Эндпоинты для вопросов:
	e.POST("/questionnaire/:id/questions", createQuestion)
	e.GET("/questionnaire/:id/questions", getQuestionsByQuestionnaireID)
	e.PUT("/questionnaire/:questionnaire_id/questions/:question_id", updateQuestion)
	e.PUT("/question/:question_id/hide-rules", updateHideRules)
	e.PUT("/question/:question_id/transition-rules", updateTransitionRules)
	e.DELETE("/questionnaire/:questionnaire_id/questions/:question_id", deleteQuestion)
	// Эндпоинты для ответов:
	e.POST("/question/:question_id/answers", createAnswer)
	e.DELETE("/answer/:answer_id", deleteAnswer)
	e.Start(":8080")
}

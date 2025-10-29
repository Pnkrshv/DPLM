package main

import (
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func initDB() {
	dsn := "host=localhost user=postgres password=Cergey27249 dbname=postgres port=5432 sslmode=disable"
	var err error

	db, err = gorm.Open(postgres.Open(dsn))
	if err != nil {
		log.Fatalf("Ошибка при подключении к базе данных: %v", err)
	}

	if err := db.AutoMigrate(&loginData{}); err != nil {
		log.Fatalf("Ошибка в миграции БД: %v", err)
	}
}

type loginData struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

func getAuth(c echo.Context) error {
	data := new(loginData)

	if err := c.Bind(data); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid request"})
	}

	if data.Login == "admin" && data.Password == "kaf32" {
		return c.JSON(http.StatusOK, echo.Map{
			"access": "confirmed",
		})
	}
	return c.JSON(http.StatusUnauthorized, echo.Map{
		"access": "denied",
		"error":  "Invalid login or password!",
	})
}

func main() {
	e := echo.New()
	e.Use(middleware.CORS())
	e.POST("/login", getAuth)
	e.Start(":8080")
}

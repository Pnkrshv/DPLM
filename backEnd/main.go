package main

import (
	"net/http"
	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/echo/v4"
)

type loginData struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

func requestHandler(c echo.Context) error {
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
	e.POST("/login", requestHandler)
	e.Start(":8080")
}

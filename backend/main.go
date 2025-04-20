package main

import (
	"log"
	"time" // Понадобится для cors.Config

	"github.com/gin-contrib/cors" // <<< 1. Импортируем пакет CORS
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	db "github.com/troodinc/trood-front-hackathon/database"
	_ "github.com/troodinc/trood-front-hackathon/docs" // Импорт для автогенерации Swagger
	"github.com/troodinc/trood-front-hackathon/handlers"
)

// @title Trood Front Hackathon API
// @version 1.0
// @description This is the API documentation for the Trood Front Hackathon. Welcome to hell.
// @host localhost:8080
// @BasePath /

func main() {
	// Инициализация базы данных и, возможно, начальных данных
	db.InitDatabase()
	handlers.InitProjects() // Оставляем, если это нужно для инициализации

	// Создаем экземпляр Gin с логгером и recovery middleware по умолчанию
	r := gin.Default()

	// --- 2. Настройка CORS для локальной разработки ---
	// Создаем конфигурацию CORS. Используем DefaultConfig как основу.
	corsConfig := cors.DefaultConfig()

	// !!! ВАЖНО: Разрешаем запросы ТОЛЬКО от твоего локального фронтенда Vite
	corsConfig.AllowOrigins = []string{"http://localhost:5173"}

	// Оставляем разрешенные методы по умолчанию (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
	// corsConfig.AllowMethods = []string{"GET", "POST", ...}

	// Оставляем разрешенные заголовки по умолчанию (Origin, Content-Type, Accept и т.д.)
	// corsConfig.AllowHeaders = []string{"Origin", "Content-Type", ...}

	// Указываем, как долго браузер может кэшировать результат preflight-запроса (OPTIONS)
	corsConfig.MaxAge = 12 * time.Hour

	// !!! Применяем CORS middleware ко всем маршрутам ДО их определения
	r.Use(cors.New(corsConfig))
	// --- Конец настройки CORS ---

	// --- Маршруты ---
	// Маршрут для Swagger UI
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Маршруты для Проектов
	projectRoutes := r.Group("/projects") // Группируем роуты для проектов
	{
		projectRoutes.GET("", handlers.GetProjects)       // GET /projects
		projectRoutes.POST("", handlers.CreateProject)    // POST /projects
		projectRoutes.GET("/:id", handlers.GetProjectByID) // GET /projects/123
		projectRoutes.PUT("/:id", handlers.EditProject)    // PUT /projects/123
		projectRoutes.DELETE("/:id", handlers.DeleteProject) // DELETE /projects/123

		// Вложенные маршруты для Вакансий конкретного проекта
		projectRoutes.GET("/:id/vacancies", handlers.GetVacancies)    // GET /projects/123/vacancies
		projectRoutes.POST("/:id/vacancies", handlers.CreateVacancy) // POST /projects/123/vacancies
	}

	// Маршруты для Вакансий (независимые от проекта, если такие есть по ТЗ?)
	// Swagger указывает PUT/DELETE для /vacancies/:id, а не /projects/:id/vacancies/:vacancyId
	// Поэтому создаем отдельную группу
	vacancyRoutes := r.Group("/vacancies")
	{
		vacancyRoutes.GET("/:id", handlers.GetVacancyByID) // GET /vacancies/456
		vacancyRoutes.PUT("/:id", handlers.EditVacancy)    // PUT /vacancies/456
		vacancyRoutes.DELETE("/:id", handlers.DeleteVacancy) // DELETE /vacancies/456
	}
	// --- Конец Маршрутов ---


	// --- Запуск сервера ---
	port := "8080"
	// Обновляем лог, чтобы было видно, что CORS настроен
	log.Printf("Server starting on http://localhost:%s with CORS enabled for origin: %s", port, corsConfig.AllowOrigins[0])

	// Запускаем сервер Gin
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}


// package main

// import (
// 	"log"

// 	"github.com/gin-gonic/gin"
// 	swaggerFiles "github.com/swaggo/files"
// 	ginSwagger "github.com/swaggo/gin-swagger"
// 	db "github.com/troodinc/trood-front-hackathon/database"
// 	_ "github.com/troodinc/trood-front-hackathon/docs"
// 	"github.com/troodinc/trood-front-hackathon/handlers"
// )

// // @title Trood Front Hackathon API
// // @version 1.0
// // @description This is the API documentation for the Trood Front Hackathon. Welcome to hell.
// // @host localhost:8080
// // @BasePath /

// func main() {
// 	db.InitDatabase()
// 	handlers.InitProjects()

// 	r := gin.Default()

// 	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

// 	r.GET("/projects", handlers.GetProjects)
// 	r.GET("/projects/:id", handlers.GetProjectByID)
// 	r.POST("/projects", handlers.CreateProject)
// 	r.PUT("/projects/:id", handlers.EditProject)
// 	r.DELETE("/projects/:id", handlers.DeleteProject)

// 	r.GET("/projects/:id/vacancies", handlers.GetVacancies)
// 	r.POST("/projects/:id/vacancies", handlers.CreateVacancy)
// 	r.PUT("/vacancies/:id", handlers.EditVacancy)
// 	r.DELETE("/vacancies/:id", handlers.DeleteVacancy)

// 	port := "8080"
// 	log.Println("Server running on http://localhost:" + port)

// 	if err := r.Run(":" + port); err != nil {
// 		log.Fatalf("Server failed to start: %v", err)
// 	}
// }

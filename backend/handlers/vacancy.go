package handlers

import (
	"database/sql" // Оставляем для sql.ErrNoRows
	"net/http"
	"strconv"

	// "sync" // Удаляем, мьютекс больше не нужен

	"github.com/gin-gonic/gin"
	db "github.com/troodinc/trood-front-hackathon/database" // Импортируем пакет database как db
	// "github.com/troodinc/trood-front-hackathon/models" // Удаляем несуществующий пакет models
)

// --- УДАЛЯЕМ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ ХРАНЕНИЯ В ПАМЯТИ ---
/*
var (
	vacancies     = make(map[int]models.Vacancy)
	nextVacancyID = 1
	vacancyMutex  sync.Mutex
)
*/

// GetVacancyByID godoc
// @Summary Get a single vacancy by ID
// @Description Retrieve details for a specific vacancy using its ID
// @Tags vacancies // Исправлено с Vacancies на vacancies (лучше lowercase)
// @Accept  json
// @Produce  json
// @Param   id   path      int  true  "Vacancy ID"
// @Success 200 {object} database.Vacancy "Successfully retrieved vacancy" // Используем db.Vacancy
// @Failure 400 {object} map[string]string "Invalid ID format"
// @Failure 404 {object} map[string]string "Vacancy not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /vacancies/{id} [get]
func GetVacancyByID(c *gin.Context) {
	idStr := c.Param("id")
	// Используем ParseUint, так как ID обычно unsigned
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vacancy ID format"})
		return
	}

	var vacancy db.Vacancy // Используем тип из пакета db
	query := "SELECT id, project_id, name, description, field, country, experience FROM vacancies WHERE id = ?"
	err = db.DB.Get(&vacancy, query, uint(id)) // Приводим id к uint

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Vacancy not found"})
		} else {
			c.Error(err) // Логируем внутреннюю ошибку
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve vacancy"})
		}
		return
	}

	c.JSON(http.StatusOK, vacancy)
}

// GetVacancies godoc
// @Summary Get all vacancies for a project
// @Description Retrieve all vacancies for a given project by project ID
// @Tags vacancies // Исправлено с Vacancies на vacancies
// @Accept  json
// @Produce  json
// @Param id path int true "Project ID"                  // Это ID проекта из URL /projects/{id}/vacancies
// @Success 200 {array} database.Vacancy "List of vacancies" // Используем db.Vacancy
// @Failure 400 {object} map[string]string "Invalid project ID format"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /projects/{id}/vacancies [get]
func GetVacancies(c *gin.Context) {
	projectIDStr := c.Param("id") // Получаем ID проекта из URL
	projectID, err := strconv.ParseUint(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID format"})
		return
	}

	var vacancyList []db.Vacancy // Используем слайс db.Vacancy
	query := "SELECT id, project_id, name, description, field, country, experience FROM vacancies WHERE project_id = ?"
	// Используем Select для получения нескольких строк
	err = db.DB.Select(&vacancyList, query, uint(projectID))

	if err != nil {
		// Ошибку sql.ErrNoRows здесь обрабатывать не нужно, Select просто вернет пустой слайс
		c.Error(err) // Логируем любую другую ошибку БД
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve vacancies"})
		return
	}

	// Если ошибок нет, vacancyList будет содержать найденные вакансии или будет пустым ([]),
	// если для данного projectID вакансий нет. Gin корректно вернет пустой JSON массив.
	c.JSON(http.StatusOK, vacancyList)
}

// CreateVacancy godoc
// @Summary Create a new vacancy for a project
// @Description Create a new vacancy by providing the vacancy details and the project ID
// @Tags vacancies // Исправлено с Vacancies на vacancies
// @Accept  json
// @Produce  json
// @Param id path int true "Project ID"                     // Это ID проекта из URL /projects/{id}/vacancies
// @Param vacancy body database.Vacancy true "Vacancy data (ID and ProjectID can be omitted or 0)" // Используем db.Vacancy
// @Success 201 {object} database.Vacancy "Vacancy created successfully" // Используем db.Vacancy
// @Failure 400 {object} map[string]string "Invalid project ID format or invalid vacancy data"
// @Failure 404 {object} map[string]string "Project not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /projects/{id}/vacancies [post]
func CreateVacancy(c *gin.Context) {
	projectIDStr := c.Param("id")
	projectID, err := strconv.ParseUint(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID format"})
		return
	}

	// Проверяем, существует ли проект (можно оптимизировать)
	var projectExists bool
	// TODO: Рассмотреть возможность вынести проверку существования проекта в middleware или отдельную функцию
	err = db.DB.Get(&projectExists, "SELECT EXISTS(SELECT 1 FROM projects WHERE id = ?)", uint(projectID))
    if err != nil && err != sql.ErrNoRows { // Проверяем на реальную ошибку БД
        c.Error(err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check project existence"})
        return
    }
    if !projectExists { // Если Get вернул false (т.е. EXISTS вернул 0 или NULL) или была ошибка ErrNoRows
        c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
        return
    }


	var newVacancy db.Vacancy // Используем db.Vacancy
	if err := c.ShouldBindJSON(&newVacancy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vacancy data format", "details": err.Error()})
		return
	}

	// Устанавливаем ID проекта из URL, игнорируя то, что могло прийти в JSON
	newVacancy.ProjectID = uint(projectID)

	// Выполняем INSERT в базу данных
	query := `
		INSERT INTO vacancies (project_id, name, description, field, country, experience)
		VALUES (?, ?, ?, ?, ?, ?);
	`
	result, err := db.DB.Exec(query,
		newVacancy.ProjectID, newVacancy.Name, newVacancy.Description,
		newVacancy.Field, newVacancy.Country, newVacancy.Experience,
	)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create vacancy"})
		return
	}

	// Получаем ID только что вставленной строки
	lastID, err := result.LastInsertId()
	if err != nil {
		c.Error(err)
		// Эта ошибка маловероятна с SQLite при успешном Exec, но лучше обработать
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve ID of created vacancy"})
		return
	}
	newVacancy.ID = uint(lastID) // Присваиваем ID

	// Возвращаем созданную вакансию с присвоенным ID
	c.JSON(http.StatusCreated, newVacancy)
}

// EditVacancy godoc
// @Summary Edit an existing vacancy
// @Description Edit a vacancy by ID
// @Tags vacancies // Исправлено с Vacancies на vacancies
// @Accept  json
// @Produce  json
// @Param id path int true "Vacancy ID"                    // Это ID вакансии из URL /vacancies/{id}
// @Param vacancy body database.Vacancy true "Updated vacancy data (ID and ProjectID in body are ignored)" // Используем db.Vacancy
// @Success 200 {object} database.Vacancy "Vacancy updated successfully" // Используем db.Vacancy
// @Failure 400 {object} map[string]string "Invalid vacancy ID format or invalid vacancy data"
// @Failure 404 {object} map[string]string "Vacancy not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /vacancies/{id} [put]
func EditVacancy(c *gin.Context) {
	vacancyIDStr := c.Param("id")
	vacancyID, err := strconv.ParseUint(vacancyIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vacancy ID format"})
		return
	}

	var updatedVacancyData db.Vacancy // Используем db.Vacancy
	if err := c.ShouldBindJSON(&updatedVacancyData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vacancy data format", "details": err.Error()})
		return
	}

	// Выполняем UPDATE в базе данных
	query := `
		UPDATE vacancies SET
			name = ?,
			description = ?,
			field = ?,
			country = ?,
			experience = ?
			-- project_id обычно не меняется при редактировании вакансии, но можно добавить, если нужно
		WHERE id = ?;
	`
	result, err := db.DB.Exec(query,
		updatedVacancyData.Name,
		updatedVacancyData.Description,
		updatedVacancyData.Field,
		updatedVacancyData.Country,
		updatedVacancyData.Experience,
		uint(vacancyID), // ID вакансии для условия WHERE
	)

	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update vacancy"})
		return
	}

	// Проверяем, была ли запись реально обновлена
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		// Маловероятно получить ошибку здесь, если Exec прошел, но все же
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check rows affected after update"})
		return
	}

	if rowsAffected == 0 {
		// Если ни одна строка не была затронута, значит вакансии с таким ID не существует
		c.JSON(http.StatusNotFound, gin.H{"error": "Vacancy not found"})
		return
	}

	// Если обновление прошло успешно, вернем обновленные данные
    // Мы можем либо вернуть то, что пришло в updatedVacancyData (присвоив ID),
    // либо сделать еще один SELECT, чтобы получить актуальные данные из БД.
    // Вернем пришедшие данные с правильным ID для простоты.
    updatedVacancyData.ID = uint(vacancyID)
    // ProjectID мы не меняли, но в updatedVacancyData его может не быть или он 0.
    // Если нужно вернуть актуальный ProjectID, нужно делать SELECT.
    // Пока не будем усложнять.

	c.JSON(http.StatusOK, updatedVacancyData)
}

// DeleteVacancy godoc
// @Summary Delete a vacancy by ID
// @Description Delete a vacancy by its ID
// @Tags vacancies // Исправлено с Vacancies на vacancies
// @Accept  json
// @Produce  json
// @Param id path int true "Vacancy ID" // Это ID вакансии из URL /vacancies/{id}
// @Success 204 "Vacancy deleted successfully" // Нет тела ответа
// @Failure 400 {object} map[string]string "Invalid vacancy ID format"
// @Failure 404 {object} map[string]string "Vacancy not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /vacancies/{id} [delete]
func DeleteVacancy(c *gin.Context) {
	vacancyIDStr := c.Param("id")
	vacancyID, err := strconv.ParseUint(vacancyIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vacancy ID format"})
		return
	}

	// Выполняем DELETE в базе данных
	query := "DELETE FROM vacancies WHERE id = ?"
	result, err := db.DB.Exec(query, uint(vacancyID))
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete vacancy"})
		return
	}

	// Проверяем, была ли строка удалена
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check rows affected after delete"})
		return
	}

	if rowsAffected == 0 {
		// Если ни одна строка не была затронута, вакансии с таким ID не было
		c.JSON(http.StatusNotFound, gin.H{"error": "Vacancy not found"})
		return
	}

	// При успехе возвращаем статус 204 No Content (без тела ответа)
	c.Status(http.StatusNoContent)
}


// package handlers

// import (
// 	"database/sql" // <--- Нужен для sql.ErrNoRows при работе с базой данных
// 	"net/http"     // <--- Нужен для статус-кодов HTTP
// 	"strconv"      // <--- Нужен для конвертации ID из строки
// 	"sync"         // <--- ВОЗМОЖНО, НЕ НУЖЕН! (Если ты не используешь мьютексы в памяти)

// 	"github.com/gin-gonic/gin"                              // <--- Фреймворк Gin
// 	db "github.com/troodinc/trood-front-hackathon/database" // <--- Пакет для DB соединения и, возможно, моделей
// 	"github.com/troodinc/trood-front-hackathon/models"      // <--- ПРОБЛЕМА: Импорт пакета models, которого, скорее всего, нет
// )

// var (
// 	vacancies     = make(map[int]models.Vacancy)
// 	nextVacancyID = 1
// 	vacancyMutex  sync.Mutex
// )

// // GetVacancies godoc
// // @Summary Get all vacancies for a project
// // @Description Retrieve all vacancies for a given project by project ID
// // @Tags Vacancies
// // @Accept  json
// // @Produce  json
// // @Param id path int true "Project ID"
// // @Success 200 {array} models.Vacancy
// // @Failure 404 {object} map[string]interface{} "Project not found"
// // @Router /projects/{id}/vacancies [get]

// func GetVacancyByID(c *gin.Context) {
// 	// 1. Получаем ID из параметра пути
// 	idStr := c.Param("id")

// 	// 2. Конвертируем ID из строки в число
// 	id, err := strconv.ParseUint(idStr, 10, 64)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vacancy ID format"})
// 		return
// 	}

// 	// 3. Создаем переменную для хранения результата
// 	var vacancy db.Vacancy // Используем тип Vacancy из пакета db

// 	// --- >>> ЗАПРОС К БАЗЕ ДАННЫХ (ЗАМЕНА СТАРОЙ ЛОГИКИ) <<< ---
// 	// SQL-запрос для выбора одной вакансии по ID
// 	query := "SELECT id, project_id, name, description, field, country, experience FROM vacancies WHERE id = ?"
// 	// Используем db.DB.Get для выполнения запроса и маппинга результата в структуру vacancy
// 	err = db.DB.Get(&vacancy, query, uint(id)) // Передаем сам запрос и ID в качестве аргумента
// 	// --- <<< КОНЕЦ ЗАПРОСА К БД >>> ---

// 	// 4. Проверяем результат запроса
// 	if err != nil {
// 		// Проверяем, была ли ошибка "запись не найдена"
// 		if err == sql.ErrNoRows { // <--- Используем sql.ErrNoRows
// 			c.JSON(http.StatusNotFound, gin.H{"error": "Vacancy not found"})
// 		} else {
// 			// Логируем любую другую ошибку БД на сервере
// 			c.Error(err) // Логируем ошибку для отладки
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve vacancy"})
// 		}
// 		return // Выходим после обработки ошибки
// 	}

// 	// 5. Если ошибок нет, вакансия найдена - возвращаем ее
// 	c.JSON(http.StatusOK, vacancy)
// }
// func GetVacancies(c *gin.Context) {
// 	projectIDStr := c.Param("id")
// 	projectID, err := strconv.Atoi(projectIDStr)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
// 		return
// 	}

// 	vacancyMutex.Lock()
// 	defer vacancyMutex.Unlock()

// 	var vacancyList []models.Vacancy
// 	for _, vacancy := range vacancies {
// 		if vacancy.ProjectID == projectID {
// 			vacancyList = append(vacancyList, vacancy)
// 		}
// 	}

// 	// Ensure an empty array is returned if no vacancies are found
// 	if len(vacancyList) == 0 {
// 		c.JSON(http.StatusOK, []models.Vacancy{})
// 		return
// 	}

// 	c.JSON(http.StatusOK, vacancyList)
// }

// // CreateVacancy godoc
// // @Summary Create a new vacancy for a project
// // @Description Create a new vacancy by providing the vacancy details and the project ID
// // @Tags Vacancies
// // @Accept  json
// // @Produce  json
// // @Param id path int true "Project ID"
// // @Param vacancy body models.Vacancy true "Vacancy data"
// // @Success 201 {object} models.Vacancy
// // @Failure 404 {object} map[string]interface{} "Project not found"
// // @Router /projects/{id}/vacancies [post]
// func CreateVacancy(c *gin.Context) {
// 	projectIDStr := c.Param("id")
// 	projectID, err := strconv.Atoi(projectIDStr)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "Invalid project ID"})
// 		return
// 	}

// 	var vacancy models.Vacancy
// 	if err := c.ShouldBindJSON(&vacancy); err != nil {
// 		c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "Invalid input"})
// 		return
// 	}

// 	vacancyMutex.Lock()
// 	defer vacancyMutex.Unlock()

// 	projectFound := false
// 	for _, project := range projects {
// 		if project.ID == projectID {
// 			projectFound = true
// 			break
// 		}
// 	}

// 	if !projectFound {
// 		c.JSON(http.StatusNotFound, map[string]interface{}{"error": "Project not found"})
// 		return
// 	}

// 	vacancy.ID = nextVacancyID
// 	nextVacancyID++
// 	vacancy.ProjectID = projectID
// 	vacancies[vacancy.ID] = vacancy

// 	c.JSON(http.StatusCreated, vacancy)
// }

// // EditVacancy godoc
// // @Summary Edit an existing vacancy
// // @Description Edit a vacancy by ID
// // @Tags Vacancies
// // @Accept  json
// // @Produce  json
// // @Param id path int true "Vacancy ID"
// // @Param vacancy body models.Vacancy true "Updated vacancy data"
// // @Success 200 {object} models.Vacancy
// // @Failure 404 {object} map[string]interface{} "Vacancy not found"
// // @Router /vacancies/{id} [put]
// func EditVacancy(c *gin.Context) {
// 	idStr := c.Param("id")
// 	id, err := strconv.Atoi(idStr)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "Invalid vacancy ID"})
// 		return
// 	}

// 	var vacancy models.Vacancy
// 	if err := c.ShouldBindJSON(&vacancy); err != nil {
// 		c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "Invalid input"})
// 		return
// 	}

// 	vacancyMutex.Lock()
// 	defer vacancyMutex.Unlock()

// 	if existingVacancy, exists := vacancies[id]; exists {
// 		existingVacancy.Name = vacancy.Name
// 		existingVacancy.Description = vacancy.Description
// 		existingVacancy.Field = vacancy.Field
// 		existingVacancy.Country = vacancy.Country
// 		existingVacancy.Experience = vacancy.Experience
// 		vacancies[id] = existingVacancy

// 		c.JSON(http.StatusOK, existingVacancy)
// 	} else {
// 		c.JSON(http.StatusNotFound, map[string]interface{}{"error": "Vacancy not found"})
// 	}
// }

// // DeleteVacancy godoc
// // @Summary Delete a vacancy by ID
// // @Description Delete a vacancy by its ID
// // @Tags Vacancies
// // @Accept  json
// // @Produce  json
// // @Param id path int true "Vacancy ID"
// // @Success 204 {object} map[string]interface{} "No Content"
// // @Failure 404 {object} map[string]interface{} "Vacancy not found"
// // @Router /vacancies/{id} [delete]
// func DeleteVacancy(c *gin.Context) {
// 	idStr := c.Param("id")
// 	id, err := strconv.Atoi(idStr)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "Invalid vacancy ID"})
// 		return
// 	}

// 	vacancyMutex.Lock()
// 	defer vacancyMutex.Unlock()

// 	if _, exists := vacancies[id]; exists {
// 		delete(vacancies, id)

// 		c.JSON(http.StatusNoContent, map[string]interface{}{"message": "Vacancy deleted"})
// 	} else {
// 		c.JSON(http.StatusNotFound, map[string]interface{}{"error": "Vacancy not found"})
// 	}
// }

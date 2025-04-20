package handlers

import (
	"database/sql" // Добавляем для sql.ErrNoRows
	"log"          // Оставляем для InitProjects, если она будет писать в БД
	"net/http"
	"strconv"

	// "sync" // Удаляем

	"github.com/gin-gonic/gin"
	db "github.com/troodinc/trood-front-hackathon/database" // Импортируем пакет database как db
	// "github.com/troodinc/trood-front-hackathon/models" // Удаляем
)

// --- УДАЛЯЕМ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
/*
var (
	projects      = make(map[int]models.Project)
	nextProjectID = 1
	projectMutex  sync.Mutex
)
*/

// InitProjects - Инициализирует проекты, теперь записывает в БД, если проектов нет
// Важно: Эту функцию нужно вызывать ПОСЛЕ db.InitDatabase()
func InitProjects() {
	// Проверим, есть ли уже проекты в БД
	var count int
	err := db.DB.Get(&count, "SELECT COUNT(*) FROM projects")
	if err != nil {
		log.Printf("Warning: Could not check existing projects count: %v. Skipping initialization.", err)
		return // Не можем проверить, лучше не инициализировать
	}

	if count > 0 {
		log.Println("Projects table already has data. Skipping initialization.")
		return // Проекты уже есть, выходим
	}

	// Если проектов нет, добавляем начальные данные
	log.Println("Initializing projects table with sample data...")
	initialProjects := []db.Project{ // Используем db.Project
		// ID можно не указывать, т.к. AUTOINCREMENT
		{Name: "Project Alpha", Description: "A cutting-edge AI project", Deadline: "31.12.2025", Experience: "5+ years"},
		{Name: "Project Beta", Description: "Next-gen cloud platform", Deadline: "30.06.2025", Experience: "3+ years"},
		{Name: "Project Gamma", Description: "Blockchain-based fintech solution", Deadline: "15.09.2025", Experience: "4+ years"},
	}

	// Используем транзакцию для вставки нескольких записей
	tx, err := db.DB.Beginx()
	if err != nil {
		log.Printf("Warning: Failed to begin transaction for project initialization: %v", err)
		return
	}
	defer tx.Rollback() // Откатываем, если что-то пойдет не так

	query := `INSERT INTO projects (name, description, deadline, experience) VALUES (?, ?, ?, ?)`
	for _, p := range initialProjects {
		_, err := tx.Exec(query, p.Name, p.Description, p.Deadline, p.Experience)
		if err != nil {
			log.Printf("Warning: Failed to insert initial project '%s': %v", p.Name, err)
			// Не прерываемся, пытаемся вставить остальные
		}
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Warning: Failed to commit transaction for project initialization: %v", err)
	} else {
		log.Println("Initialized projects with sample data")
	}
}

// GetProjectByID godoc
// @Summary Get a project by ID
// @Description Retrieve a project by its ID
// @Tags Projects
// @Accept  json
// @Produce  json
// @Param id path int true "Project ID"
// @Success 200 {object} database.Project "Successfully retrieved project" // <-- Используем db.Project
// @Failure 400 {object} map[string]string "Invalid project ID format"
// @Failure 404 {object} map[string]string "Project not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /projects/{id} [get]
func GetProjectByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64) // Используем ParseUint
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID format"})
		return
	}

	var project db.Project // <-- Используем db.Project
	query := "SELECT id, name, description, deadline, experience FROM projects WHERE id = ?"
	err = db.DB.Get(&project, query, uint(id)) // <-- Используем db.DB.Get

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		} else {
			c.Error(err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve project"})
		}
		return
	}

	c.JSON(http.StatusOK, project)
}

// GetProjects godoc
// @Summary Get all projects
// @Description Retrieve all projects
// @Tags Projects
// @Accept  json
// @Produce  json
// @Success 200 {array} database.Project "List of projects" // <-- Используем db.Project
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /projects [get]
func GetProjects(c *gin.Context) {
	var projectList []db.Project // <-- Используем db.Project
	query := "SELECT id, name, description, deadline, experience FROM projects"
	err := db.DB.Select(&projectList, query) // <-- Используем db.DB.Select

	if err != nil {
		// Ошибка sql.ErrNoRows здесь не возникает для Select, он вернет пустой слайс
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve projects"})
		return
	}

	// Всегда возвращаем список (пустой или с данными)
	c.JSON(http.StatusOK, projectList)
}

// CreateProject godoc
// @Summary Create a new project
// @Description Create a new project by providing the project details
// @Tags Projects
// @Accept  json
// @Produce  json
// @Param project body database.Project true "Project data (ID can be omitted or 0)" // <-- Используем db.Project
// @Success 201 {object} database.Project "Project created successfully" // <-- Используем db.Project
// @Failure 400 {object} map[string]string "Invalid input data format"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /projects [post]
func CreateProject(c *gin.Context) {
	var newProject db.Project // <-- Используем db.Project
	if err := c.ShouldBindJSON(&newProject); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data format", "details": err.Error()})
		return
	}

	// Выполняем INSERT
	query := `
		INSERT INTO projects (name, description, deadline, experience)
		VALUES (?, ?, ?, ?);
	`
	result, err := db.DB.Exec(query,
		newProject.Name, newProject.Description, newProject.Deadline, newProject.Experience,
	)
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}

	lastID, err := result.LastInsertId()
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get last insert ID"})
		return
	}
	newProject.ID = uint(lastID) // Присваиваем ID

	c.JSON(http.StatusCreated, newProject)
}

// EditProject godoc
// @Summary Edit an existing project
// @Description Edit a project by ID
// @Tags Projects
// @Accept  json
// @Produce  json
// @Param id path int true "Project ID"
// @Param project body database.Project true "Updated project data (ID in body is ignored)" // <-- Используем db.Project
// @Success 200 {object} database.Project "Project updated successfully" // <-- Используем db.Project
// @Failure 400 {object} map[string]string "Invalid project ID format or invalid input data"
// @Failure 404 {object} map[string]string "Project not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /projects/{id} [put]
func EditProject(c *gin.Context) {
	projectIDStr := c.Param("id")
	projectID, err := strconv.ParseUint(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID format"})
		return
	}

	var updatedProjectData db.Project // <-- Используем db.Project
	if err := c.ShouldBindJSON(&updatedProjectData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data format", "details": err.Error()})
		return
	}

	// Выполняем UPDATE
	query := `
		UPDATE projects SET
			name = ?,
			description = ?,
			deadline = ?,
			experience = ?
		WHERE id = ?;
	`
	result, err := db.DB.Exec(query,
		updatedProjectData.Name,
		updatedProjectData.Description,
		updatedProjectData.Deadline,
		updatedProjectData.Experience,
		uint(projectID), // ID проекта для условия WHERE
	)

	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check rows affected after update"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// Возвращаем обновленные данные (присваиваем ID для полноты)
	updatedProjectData.ID = uint(projectID)
	c.JSON(http.StatusOK, updatedProjectData)
}

// DeleteProject godoc
// @Summary Delete an existing project
// @Description Delete a project by ID (Note: This might fail if vacancies reference this project due to FOREIGN KEY constraint)
// @Tags Projects
// @Accept  json
// @Produce  json
// @Param id path int true "Project ID"
// @Success 204 "Project deleted successfully" // <-- Нет тела
// @Failure 400 {object} map[string]string "Invalid project ID format"
// @Failure 404 {object} map[string]string "Project not found"
// @Failure 500 {object} map[string]string "Internal server error (e.g., due to foreign key constraint)"
// @Router /projects/{id} [delete]
func DeleteProject(c *gin.Context) {
	projectIDStr := c.Param("id")
	projectID, err := strconv.ParseUint(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID format"})
		return
	}

	// Выполняем DELETE
	// ВНИМАНИЕ: Если существуют вакансии, ссылающиеся на этот project_id,
	// стандартный FOREIGN KEY constraint не даст удалить проект.
	// Нужно либо сначала удалить вакансии, либо настроить каскадное удаление (ON DELETE CASCADE) в схеме БД.
	query := "DELETE FROM projects WHERE id = ?"
	result, err := db.DB.Exec(query, uint(projectID))
	if err != nil {
		// Здесь может быть ошибка SQLite FOREIGN KEY constraint failed
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project", "details": err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.Error(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check rows affected after delete"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	// Успех - возвращаем 204 No Content
	c.Status(http.StatusNoContent)
}



// package handlers

// import (
// 	"log"
// 	"net/http"
// 	"strconv"
// 	"sync"

// 	"github.com/gin-gonic/gin"
// 	"github.com/troodinc/trood-front-hackathon/models"
// )

// var (
// 	projects      = make(map[int]models.Project)
// 	nextProjectID = 1
// 	projectMutex  sync.Mutex
// )

// func InitProjects() {
// 	projectMutex.Lock()
// 	defer projectMutex.Unlock()

// 	projects[1] = models.Project{
// 		ID:          1,
// 		Name:        "Project Alpha",
// 		Description: "A cutting-edge AI project",
// 		Deadline:    "31.12.2025",
// 		Experience:  "5+ years",
// 	}
// 	projects[2] = models.Project{
// 		ID:          2,
// 		Name:        "Project Beta",
// 		Description: "Next-gen cloud platform",
// 		Deadline:    "30.06.2025",
// 		Experience:  "3+ years",
// 	}
// 	projects[3] = models.Project{
// 		ID:          3,
// 		Name:        "Project Gamma",
// 		Description: "Blockchain-based fintech solution",
// 		Deadline:    "15.09.2025",
// 		Experience:  "4+ years",
// 	}

// 	nextProjectID = 4

// 	log.Println("Initialized projects with sample data")
// }

// // GetProjectByID godoc
// // @Summary Get a project by ID
// // @Description Retrieve a project from the database by its ID
// // @Tags Projects
// // @Accept  json
// // @Produce  json
// // @Param id path int true "Project ID"
// // @Success 200 {object} models.Project
// // @Failure 404 {object} map[string]interface{} "Project not found"
// // @Router /projects/{id} [get]
// func GetProjectByID(c *gin.Context) {
// 	idStr := c.Param("id")
// 	id, err := strconv.Atoi(idStr)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "Invalid project ID"})
// 		return
// 	}

// 	projectMutex.Lock()
// 	defer projectMutex.Unlock()

// 	if project, exists := projects[id]; exists {
// 		c.JSON(http.StatusOK, project)
// 	} else {
// 		c.JSON(http.StatusNotFound, map[string]interface{}{"error": "Project not found"})
// 	}
// }

// // GetProjects godoc
// // @Summary Get all projects
// // @Description Retrieve all projects from the database
// // @Tags Projects
// // @Accept  json
// // @Produce  json
// // @Success 200 {array} models.Project
// // @Router /projects [get]
// func GetProjects(c *gin.Context) {
// 	projectMutex.Lock()
// 	defer projectMutex.Unlock()

// 	var projectList []models.Project
// 	for _, project := range projects {
// 		projectList = append(projectList, project)
// 	}

// 	if len(projectList) == 0 {
// 		c.JSON(http.StatusOK, []models.Project{})
// 		return
// 	}

// 	c.JSON(http.StatusOK, projectList)
// }

// // CreateProject godoc
// // @Summary Create a new project
// // @Description Create a new project by providing the project details
// // @Tags Projects
// // @Accept  json
// // @Produce  json
// // @Param project body models.Project true "Project data"
// // @Success 201 {object} models.Project
// // @Router /projects [post]
// func CreateProject(c *gin.Context) {
// 	var project models.Project
// 	if err := c.ShouldBindJSON(&project); err != nil {
// 		c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "Invalid input"})
// 		return
// 	}

// 	projectMutex.Lock()
// 	defer projectMutex.Unlock()

// 	project.ID = nextProjectID
// 	nextProjectID++
// 	projects[project.ID] = project

// 	c.JSON(http.StatusCreated, project)
// }

// // EditProject godoc
// // @Summary Edit an existing project
// // @Description Edit a project by ID
// // @Tags Projects
// // @Accept  json
// // @Produce  json
// // @Param id path int true "Project ID"
// // @Param project body models.Project true "Updated project data"
// // @Success 200 {object} models.Project
// // @Failure 404 {object} map[string]interface{} "Project not found"
// // @Router /projects/{id} [put]
// func EditProject(c *gin.Context) {
// 	idStr := c.Param("id")
// 	id, err := strconv.Atoi(idStr)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "Invalid project ID"})
// 		return
// 	}

// 	var project models.Project
// 	if err := c.ShouldBindJSON(&project); err != nil {
// 		c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "Invalid input"})
// 		return
// 	}

// 	projectMutex.Lock()
// 	defer projectMutex.Unlock()

// 	if existingProject, exists := projects[id]; exists {
// 		existingProject.Name = project.Name
// 		existingProject.Description = project.Description
// 		existingProject.Deadline = project.Deadline
// 		existingProject.Experience = project.Experience
// 		projects[id] = existingProject

// 		c.JSON(http.StatusOK, existingProject)
// 	} else {
// 		c.JSON(http.StatusNotFound, map[string]interface{}{"error": "Project not found"})
// 	}
// }

// // DeleteProject godoc
// // @Summary Delete an existing project
// // @Description Delete a project by ID
// // @Tags Projects
// // @Accept  json
// // @Produce  json
// // @Param id path int true "Project ID"
// // @Success 204 {object} map[string]interface{} "No Content"
// // @Failure 404 {object} map[string]interface{} "Project not found"
// // @Router /projects/{id} [delete]
// func DeleteProject(c *gin.Context) {
// 	idStr := c.Param("id")
// 	id, err := strconv.Atoi(idStr)
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, map[string]interface{}{"error": "Invalid project ID"})
// 		return
// 	}

// 	projectMutex.Lock()
// 	defer projectMutex.Unlock()

// 	if _, exists := projects[id]; exists {
// 		// Delete the project
// 		delete(projects, id)

// 		c.JSON(http.StatusNoContent, map[string]interface{}{"message": "Project deleted"})
// 	} else {
// 		c.JSON(http.StatusNotFound, map[string]interface{}{"error": "Project not found"})
// 	}
// }

// Файл: database/models.go

package database

// Vacancy структура для соответствия таблице vacancies
// Используем nullable типы или указатели для полей, которые могут быть NULL в БД,
// или оставляем как есть, если они всегда NOT NULL (кроме description)
type Vacancy struct {
	ID          uint   `db:"id" json:"id"`                     // Для sqlx используем db тег, для JSON - json
	ProjectID   uint   `db:"project_id" json:"project_id"` // Имя поля совпадает с колонкой
	Name        string `db:"name" json:"name"`
	Description string `db:"description" json:"description"` // Оставляем string, sqlx справится с NULL -> ""
	Field       string `db:"field" json:"field"`
	Country     string `db:"country" json:"country"`
	Experience  string `db:"experience" json:"experience"`
}

// Можешь также определить здесь структуру Project, если она нужна в обработчиках
type Project struct {
    ID          uint   `db:"id" json:"id"`
    Name        string `db:"name" json:"name"`
    Description string `db:"description" json:"description"`
    Deadline    string `db:"deadline" json:"deadline"`
    Experience  string `db:"experience" json:"experience"`
}
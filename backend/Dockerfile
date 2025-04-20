# backend/Dockerfile

# --- Этап 1: Сборка ---
# Используем образ Alpine, в котором есть GCC (нужен для CGO)
FROM golang:1.23-alpine AS builder
# Или FROM golang:alpine

# Устанавливаем инструменты сборки C, если их нет в образе по умолчанию
# Для Alpine это пакет build-base
RUN apk add --no-cache build-base

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .

# --- УБИРАЕМ CGO_ENABLED=0 ---
# Собираем приложение, CGO будет включен по умолчанию
RUN GOOS=linux go build -ldflags="-w -s" -o /app/main .

# --- Этап 2: Запуск ---
# Используем Alpine, он содержит нужные C-библиотеки (libc)
FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/main /app/main

# Важно: Если go-sqlite3 или другие C-зависимости требуют
# еще какие-то библиотеки во время выполнения, их нужно установить сюда
# RUN apk add --no-cache sqlite-libs # Например, если нужны библиотеки sqlite
# Обычно достаточно базового alpine, но это зависит от драйвера

EXPOSE 8080
CMD ["/app/main"]
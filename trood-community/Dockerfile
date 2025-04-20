# ./trood-community/Dockerfile

# --- Этап 1: Сборка приложения ---
	FROM node:20-alpine AS builder

	WORKDIR /app
	
	# --- Принимаем аргумент сборки ---
	ARG VITE_API_BASE_URL
	# --- Устанавливаем его как переменную окружения для процесса сборки ---
	ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
	
	COPY package.json yarn.lock* package-lock.json* ./
	RUN npm install
	COPY . .
	
	# Теперь Vite будет использовать переменную окружения при сборке
	RUN npm run build
	
	# --- Этап 2: Запуск на веб-сервере Nginx ---
	FROM nginx:stable-alpine
	RUN rm /etc/nginx/conf.d/default.conf
	COPY nginx.conf /etc/nginx/conf.d/default.conf
	COPY --from=builder /app/dist /usr/share/nginx/html
	EXPOSE 80
	CMD ["nginx", "-g", "daemon off;"]
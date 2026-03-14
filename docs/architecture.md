# Архитектура Quizzy

## Стек
- `client`: React + Vite + TypeScript + Socket.IO client
- `server`: Node.js + Express + Prisma + PostgreSQL + Socket.IO
- `docker-compose`: `postgres`, `server`, `client`

## Модель
- Пользователь имеет роль `player` или `organizer`.
- Организатор создаёт викторины и запускает комнаты.
- Комната хранит текущее состояние игры, активный вопрос и таймер.
- Игроки подключаются к комнате по коду и отправляют ответы через WebSocket.
- Баллы и лидерборд считаются только на сервере.

## Realtime
- Ведущий и игроки подключаются к Socket.IO с JWT.
- Сервер отправляет `room:state`, `question:started`, `leaderboard:updated`, `room:finished`.
- Клиент только отображает актуальное состояние и инициирует действия.

## Хранение изображений
- Изображения вопросов загружаются через REST endpoint.
- Файлы сохраняются в `server/uploads/questions`.
- В Docker хранение вынесено в volume `quizzy-uploads`.

# Broker Trading Client

Клиентское приложение для брокерской торговой платформы на Vue 3.

## Требования

- Node.js 16+
- npm или yarn

## Установка

```bash
npm install
```

## Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

## Сборка для продакшн

```bash
npm run build
```

## Предпросмотр продакшн сборки

```bash
npm run preview
```

## Backend API

Убедитесь, что backend запущен на http://localhost:3000

Для запуска backend:
```bash
cd ../LAB_5/broker-exchange/backend
npm run start:dev
```

## Функциональность

### Страница входа (/)
- Выбор брокера из существующих
- Вход как администратор

### Страница брокера (/broker/:id)
- Просмотр баланса и портфеля
- Покупка/продажа акций
- Просмотр прибыли/убытка по каждой акции
- Графики изменения цен акций
- Real-time обновление через WebSocket

### Панель администратора (/admin)
- Просмотр всех брокеров
- Информация о портфелях всех брокеров
- Прибыль/убыток по каждому брокеру

## E2E Тесты

```bash
npx playwright test
```

## Технологии

- Vue 3 (Composition API)
- TypeScript
- Vue Router
- Axios
- Socket.io Client
- Chart.js + vue-chartjs
- Vite
- Playwright (E2E тесты)


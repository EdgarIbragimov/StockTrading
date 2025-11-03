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

## E2E Тесты (Playwright)

### Установка браузеров для Playwright (первый раз)

```bash
npx playwright install
```

### Запуск тестов

**Headless режим (без отображения браузера):**

```bash
npm run test:e2e
```

**С UI интерфейсом (интерактивный режим):**

```bash
npm run test:e2e:ui
```

**С отображением браузера (headed mode):**

```bash
npm run test:e2e:headed
```

**Просмотр последнего отчета:**

```bash
npm run test:e2e:report
```

### Перед запуском тестов:

1. **Запустите backend** на http://localhost:3000

   ```bash
   cd ../LAB_5/broker-exchange/backend
   npm run start:dev
   ```

2. **⚠️ ВАЖНО: Сбросьте данные торгов перед каждым запуском тестов!**

   ```bash
   curl -X POST http://localhost:3000/trading/reset
   ```

   Или через Swagger UI: http://localhost:3000/api → `POST /trading/reset`

   Это восстановит исходные данные брокеров и акций к начальному состоянию.

3. **Frontend НЕ запускать** (Playwright запустит его автоматически)

## Технологии

- Vue 3 (Composition API)
- TypeScript
- Vue Router
- Axios
- Socket.io Client
- Chart.js + vue-chartjs
- Vite
- Playwright (E2E тесты)

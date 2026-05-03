/**
 * Локальный фронт (ng serve) с API и WebSocket продакшена.
 * Запуск: npx ng serve --configuration=local-prod
 */
export const environment = {
  production: false,
  apiUrl: 'https://healthstep.ru/api/v1',
  wsUrl: 'wss://healthstep.ru/ws',
  siteUrl: 'http://localhost:4200',
};

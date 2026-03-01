/**
 * Bezpieczny logger - w produkcji nie wyświetla logów w konsoli.
 * Użyj zamiast bezpośrednich wywołań console.error/console.log.
 */
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args) => { if (isDev) console.log(...args); },
  warn: (...args) => { if (isDev) console.warn(...args); },
  error: (...args) => { if (isDev) console.error(...args); },
};

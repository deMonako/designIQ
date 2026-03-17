/**
 * Centralny generator ID — zamiast `t-${Date.now()}` wszędzie.
 * Dodaje losowy sufiks, żeby uniknąć kolizji przy szybkim klikaniu.
 *
 * Użycie:
 *   import { genId } from '../utils/id';
 *   const id = genId('task');   // np. "task-1741027234567-a3f2"
 *   const id = genId('proj');   // np. "proj-1741027234568-b9c1"
 */
export const genId = (prefix = "id") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

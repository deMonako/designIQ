/**
 * Publiczne API modułu shoppingList.
 * Importuj stąd — nie bezpośrednio z plików wewnętrznych.
 *
 * Przykład użycia:
 *   import { generateShoppingList, formatShoppingList } from "./shoppingList/index.js";
 *   const result = generateShoppingList("DOKTOR");
 *   console.log(formatShoppingList(result));
 */

export { generateShoppingList, formatShoppingList } from "./generator.js";
export { loadInstallationPoints }                   from "./installationData.js";
export { loadProductCatalog, getProductsForResource } from "./productCatalog.js";
export { aggregateResourceDemand, demandSummary }   from "./aggregator.js";
export { calculateShoppingList, calculateLineItems } from "./calculator.js";
export { RESOURCE, RESOURCE_LABEL }                 from "./resourceTypes.js";

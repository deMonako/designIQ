/**
 * Definicje typów JSDoc dla modułu shoppingList.
 * (Nie eksportuje żadnego kodu wykonywalnego — tylko dokumentacja typów.)
 *
 * @typedef {Object} InstallationPoint
 * @property {string}  id           — unikalny identyfikator punktu (np. "SA-BLD-01")
 * @property {string}  room         — nazwa pomieszczenia
 * @property {string}  function     — funkcja punktu (ludzki opis)
 * @property {string}  resourceType — wymagany typ zasobu (z RESOURCE)
 * @property {number}  [outputCount=1] — liczba wymaganych wyjść tego zasobu
 * @property {number}  [X]          — współrzędna X z DWG (opcjonalna)
 * @property {number}  [Y]          — współrzędna Y z DWG (opcjonalna)
 * @property {string}  [tag]        — handle z AutoCAD (opcjonalny)
 */

/**
 * @typedef {Object} ProductDefinition
 * @property {string}  id              — unikalny ID produktu
 * @property {string}  name            — pełna nazwa handlowa
 * @property {string}  partNumber      — numer katalogowy
 * @property {string}  resourceType    — obsługiwany typ zasobu (z RESOURCE)
 * @property {number}  outputsPerUnit  — liczba wyjść obsługiwana przez 1 szt.
 * @property {string}  unit            — jednostka miary
 * @property {string}  [notes]         — uwagi techniczne
 */

/**
 * @typedef {Object} ResourceDemand
 * @property {string}             resourceType   — typ zasobu
 * @property {number}             totalOutputs   — suma wymaganych wyjść
 * @property {InstallationPoint[]} points        — punkty składające się na zapotrzebowanie
 */

/**
 * @typedef {Object} ShoppingLineItem
 * @property {string}  productId       — ID produktu z katalogu
 * @property {string}  productName     — nazwa produktu
 * @property {string}  partNumber      — numer katalogowy
 * @property {string}  resourceType    — typ zasobu
 * @property {number}  totalOutputs    — wymagana łączna liczba wyjść
 * @property {number}  outputsPerUnit  — wyjść na urządzenie
 * @property {number}  quantity        — ceil(totalOutputs / outputsPerUnit)
 * @property {string}  unit            — "szt." itp.
 * @property {string}  [notes]         — uwagi
 */

/**
 * @typedef {Object} ShoppingListResult
 * @property {string}                  projectCode      — kod projektu
 * @property {string}                  generatedAt      — ISO timestamp
 * @property {number}                  totalPoints      — liczba punktów instalacji
 * @property {Record<string,{totalOutputs:number,pointCount:number}>} demandSummary
 * @property {ShoppingLineItem[]}      items            — lista zakupów
 */

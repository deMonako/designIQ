/**
 * Kalkulator ilości urządzeń.
 *
 * Wzór:
 *   ilość = ceil( suma_wyjść / wyjść_na_urządzenie )
 *
 * Ta warstwa łączy zapotrzebowanie (aggregator) z bazą produktów (catalog).
 * Nie wie nic o tym, skąd pochodzi baza ani skąd dane instalacji.
 */

import { getProductsForResource } from "./productCatalog.js";

/**
 * Dla jednego typu zasobu i liczby wymaganych wyjść
 * zwraca listę pozycji zakupu z ilościami.
 *
 * Jeśli dla danego resourceType istnieje kilka produktów w katalogu
 * (np. kilka modeli), funkcja generuje pozycję dla każdego z nich
 * (w przyszłości można dodać logikę wyboru „najlepszego" dopasowania).
 *
 * @param {string}   resourceType
 * @param {number}   totalOutputs
 * @returns {ShoppingLineItem[]}
 */
export function calculateLineItems(resourceType, totalOutputs) {
  const products = getProductsForResource(resourceType);

  if (products.length === 0) {
    console.warn(`[calculator] Brak produktu dla resourceType: ${resourceType}`);
    return [];
  }

  // Na razie wybieramy pierwszy pasujący produkt.
  // Punkt rozszerzenia: tu można dodać logikę wyboru (np. najtańszy, preferowany).
  const product = products[0];
  const quantity = Math.ceil(totalOutputs / product.outputsPerUnit);

  return [{
    productId:      product.id,
    productName:    product.name,
    partNumber:     product.partNumber,
    resourceType,
    totalOutputs,
    outputsPerUnit: product.outputsPerUnit,
    quantity,
    unit:           product.unit,
    notes:          product.notes,
  }];
}

/**
 * Oblicza pełną listę zakupów na podstawie mapy zapotrzebowania.
 *
 * @param {Map<string, ResourceDemand>} demand
 * @returns {ShoppingLineItem[]}
 */
export function calculateShoppingList(demand) {
  const items = [];

  for (const [resourceType, { totalOutputs }] of demand) {
    const lineItems = calculateLineItems(resourceType, totalOutputs);
    items.push(...lineItems);
  }

  // Sortuj: najpierw wyjścia, potem wejścia (opcjonalnie)
  items.sort((a, b) => a.productName.localeCompare(b.productName, "pl"));

  return items;
}

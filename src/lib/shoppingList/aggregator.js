/**
 * Agregator zapotrzebowania na zasoby.
 *
 * Wejście:  lista punktów instalacji
 * Wyjście:  mapa  resourceType → { totalOutputs, points[] }
 *
 * Ta warstwa NIE wie nic o produktach — tylko sumuje zasoby.
 */

/**
 * @param {InstallationPoint[]} points
 * @returns {Map<string, ResourceDemand>}
 */
export function aggregateResourceDemand(points) {
  /** @type {Map<string, ResourceDemand>} */
  const demand = new Map();

  for (const point of points) {
    const { resourceType, outputCount = 1 } = point;

    if (!resourceType) {
      console.warn(`[aggregator] Punkt ${point.id} nie ma resourceType — pomijam`);
      continue;
    }

    const existing = demand.get(resourceType);
    if (existing) {
      existing.totalOutputs += outputCount;
      existing.points.push(point);
    } else {
      demand.set(resourceType, {
        resourceType,
        totalOutputs: outputCount,
        points: [point],
      });
    }
  }

  return demand;
}

/**
 * Pomocnicza: zwraca agregat jako zwykły obiekt do logowania / serializacji.
 * @param {Map<string, ResourceDemand>} demand
 * @returns {Record<string, { totalOutputs: number, pointCount: number }>}
 */
export function demandSummary(demand) {
  const result = {};
  for (const [type, d] of demand) {
    result[type] = { totalOutputs: d.totalOutputs, pointCount: d.points.length };
  }
  return result;
}

export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const k = keyFn(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

// (opcionales, por si te sirven)
export function mapBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T> {
  return items.reduce((acc, item) => {
    acc[keyFn(item)] = item;
    return acc;
  }, {} as Record<K, T>);
}

export function groupByMany<T>(
  items: T[],
  ...keys: Array<(item: T) => string | number>
): any {
  if (keys.length === 0) return items;
  const [first, ...rest] = keys;
  const grouped = groupBy(items, first);
  for (const k of Object.keys(grouped)) {
    grouped[k as keyof typeof grouped] = groupByMany(grouped[k as any], ...rest);
  }
  return grouped;
}
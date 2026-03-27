/** Единицы из бэкенда (en) и короткие латинские — в читаемый русский вид для UI. */
export function formatUnitRu(raw: string | undefined | null): string {
  if (raw == null) return 'шт';
  const s = String(raw).trim().toLowerCase();
  if (!s) return 'шт';

  if (s === 'm2' || s === 'sqm' || s === 'sq.m' || s === 'sq m' || s === 'м2' || s === 'm^2' || s === 'м^2') {
    return 'м²';
  }
  if (s === 'm3' || s === 'cbm' || s === 'м3' || s === 'm^3' || s === 'м^3' || s === 'cum') {
    return 'м³';
  }
  if (
    s === 'unit'
    || s === 'units'
    || s === 'pcs'
    || s === 'pc'
    || s === 'piece'
    || s === 'pieces'
    || s === 'ea'
    || s === 'each'
    || s === 'qty'
  ) {
    return 'шт';
  }
  if (s === 'm' || s === 'meter' || s === 'meters' || s === 'lm' || s === 'linear_m' || s === 'п.м' || s === 'пм') {
    return 'м';
  }
  if (s === 'kg' || s === 'kilogram' || s === 'kilograms') {
    return 'кг';
  }
  if (s === 'l' || s === 'liter' || s === 'liters' || s === 'litre' || s === 'litres') {
    return 'л';
  }

  // Уже по-русски или неизвестный код — показываем как прислали
  return String(raw).trim();
}

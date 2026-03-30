import type { Order, PriceLine } from '../types/order';
import { CALC_TYPE_LABELS } from '../types/order';
import { formatUnitRu } from './units';

function escapeCsvCell(s: string): string {
  if (/[;"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}


function qtyToCsv(n: number): string {
  if (!Number.isFinite(n)) return '';
  return String(n).replace('.', ',');
}

function minorToRub(minor: number): string {
  if (!Number.isFinite(minor) || minor <= 0) return '';
  return String(Math.round(minor / 100));
}

export interface EstimateExportOptions {

  clientEmail?: string | null;
}


export function downloadOrderEstimateCsv(
  order: Order,
  lines: PriceLine[],
  options?: EstimateExportOptions,
): void {
  const typeLabel = CALC_TYPE_LABELS[order.calc_type]?.label ?? order.calc_type;
  const clientCell =
    (options?.clientEmail && String(options.clientEmail).trim()) || order.client_id;
  const sep = ';';
  const rows: string[][] = [
    ['Смета расчёта'],
    ['Номер заказа', order.id],
    ['Клиент', clientCell],
    ['Тип расчёта', typeLabel],
    ['Создан', new Date(order.created_at).toLocaleString('ru-RU')],
    ['Версия', String(order.calc_version)],
    [],
    ['Наименование', 'Количество', 'Ед.', 'Цена за ед., ₽', 'Сумма, ₽'],
  ];

  if (lines.length === 0) {
    rows.push(['(нет позиций в смете)', '', '', '', '']);
  } else {
    for (const line of lines) {
      rows.push([
        line.name,
        qtyToCsv(line.quantity),
        formatUnitRu(line.unit),
        minorToRub(line.unit_price_minor),
        minorToRub(line.total_minor),
      ]);
    }
  }

  rows.push([]);
  rows.push([
    'Итого',
    '',
    '',
    '',
    String(Math.round(order.total_cost_minor / 100)),
  ]);

  const bom = '\uFEFF';
  const body = rows
    .map((r) => r.map((c) => escapeCsvCell(c)).join(sep))
    .join('\r\n');

  const blob = new Blob([bom + body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `smeta_${order.id.slice(0, 8)}_${stamp}.csv`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

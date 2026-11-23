export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parsePagination(
  pageValue: number | string | undefined,
  limitValue: number | string | undefined,
  defaultLimit = 10,
  maxLimit = 100
) {
  const page = pageValue === undefined ? 1 : Number(pageValue);
  const limit = limitValue === undefined ? defaultLimit : Number(limitValue);
  if (!Number.isInteger(page) || page < 1) throw new Error('Page must be a positive whole number');
  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    throw new Error(`Limit must be a whole number between 1 and ${maxLimit}`);
  }
  return { page, limit, skip: (page - 1) * limit };
}

export function parseDateRange(startDate?: string, endDate?: string) {
  const parse = (value: string, isEnd: boolean) => {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const date = new Date(isDateOnly ? `${value}T${isEnd ? '23:59:59.999' : '00:00:00.000'}Z` : value);
    if (Number.isNaN(date.getTime())) throw new Error('Date filter must use a valid ISO date');
    return date;
  };

  const range: { $gte?: Date; $lte?: Date } = {};
  if (startDate) range.$gte = parse(startDate, false);
  if (endDate) range.$lte = parse(endDate, true);
  if (range.$gte && range.$lte && range.$gte > range.$lte) {
    throw new Error('Start date must be before or equal to end date');
  }
  return range;
}

export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

// src/utils/dateUtils.test.js
import { describe, expect, it } from 'vitest'; // Импортируем явно (или используем globals: true)
import { parseAndFormatDate_DDMMYYYY_to_YYYYMMDD } from './dateUtils'; // Импортируем функцию

describe('parseAndFormatDate_DDMMYYYY_to_YYYYMMDD', () => {
  it('should correctly format valid DD.MM.YYYY dates', () => {
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('31.12.2025')).toBe('2025-12-31');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('01.01.2024')).toBe('2024-01-01');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('15.06.2023')).toBe('2023-06-15');
  });

  it('should return empty string for invalid formats', () => {
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('31-12-2025')).toBe(''); // Неправильный разделитель
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('2025.12.31')).toBe(''); // Неправильный порядок/разделитель
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('1.1.2024')).toBe('2024-01-01'); // Должен работать с padStart
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('31.12')).toBe('');      // Не хватает года
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('abc')).toBe('');        // Не дата
  });

  it('should return empty string for invalid date values', () => {
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('32.12.2025')).toBe(''); // Неправильный день
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('31.13.2025')).toBe(''); // Неправильный месяц
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('31.02.2025')).toBe(''); // Неправильная дата (31 фев)
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('00.01.2024')).toBe(''); // Неправильный день (0)
  });

  it('should return empty string for non-string inputs', () => {
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD(null)).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD(undefined)).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD(123)).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD({})).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD([])).toBe('');
  });
});
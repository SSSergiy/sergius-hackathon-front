import { describe, expect, it } from 'vitest';
import { parseAndFormatDate_DDMMYYYY_to_YYYYMMDD } from './dateUtils';

describe('parseAndFormatDate_DDMMYYYY_to_YYYYMMDD', () => {
  it('should correctly format valid DD.MM.YYYY dates', () => {
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('31.12.2025')).toBe('2025-12-31');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('01.01.2024')).toBe('2024-01-01');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('15.06.2023')).toBe('2023-06-15');
  });

  it('should return empty string for invalid formats', () => {
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('31-12-2025')).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('2025.12.31')).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('1.1.2024')).toBe('2024-01-01');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('31.12')).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('abc')).toBe('');
  });

  it('should return empty string for invalid date values', () => {
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('32.12.2025')).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('31.13.2025')).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('31.02.2025')).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD('00.01.2024')).toBe('');
  });

  it('should return empty string for non-string inputs', () => {
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD(null)).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD(undefined)).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD(123)).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD({})).toBe('');
    expect(parseAndFormatDate_DDMMYYYY_to_YYYYMMDD([])).toBe('');
  });
});
// src/hooks/useEditableProject.test.js

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getProjectById, updateProject } from '../services/api';
import { useEditableProject } from './useEditableProject';

// Мокируем API
vi.mock('../services/api', () => ({
  getProjectById: vi.fn(),
  updateProject: vi.fn(),
}));

// Тестовые данные - ТЕПЕРЬ С YYYY-MM-DD СРАЗУ
const testProjectId = 'project-abc';
const initialProjectDataFromApi = { // Что вернет getProjectById
  id: testProjectId,
  name: 'Initial Name',
  description: 'Initial Desc',
  deadline: '2024-01-01', // API возвращает YYYY-MM-DD
  experience: 'Initial Exp',
};

// Что ожидается в состоянии ПОСЛЕ ЗАГРУЗКИ
const expectedInitialEditableState = { ...initialProjectDataFromApi };

const updatedProjectDataFromApi = { // Что вернет updateProject
  id: testProjectId,
  name: 'Updated Name',
  description: 'Updated Desc',
  deadline: '2024-02-02', // API возвращает YYYY-MM-DD
  experience: 'Updated Exp',
};

describe('useEditableProject Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Мок getProjectById возвращает данные с YYYY-MM-DD
    getProjectById.mockResolvedValue({ ...initialProjectDataFromApi });
    // Мок updateProject возвращает обновленные данные
    updateProject.mockResolvedValue({ ...updatedProjectDataFromApi });
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with loading state and fetch data correctly', async () => {
    const { result } = renderHook(() => useEditableProject(testProjectId));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.editableProject).toBeNull();

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getProjectById).toHaveBeenCalledTimes(1);
    expect(getProjectById).toHaveBeenCalledWith(testProjectId);

    expect(result.current.error).toBeNull();
    // Проверяем, что editableProject равен данным из API (конвертации нет)
    expect(result.current.editableProject).toEqual(expectedInitialEditableState);
    // Project тоже равен данным из API
    expect(result.current.project).toEqual(initialProjectDataFromApi);
  });

  it('should handle error during initial fetch', async () => {
     const fetchError = new Error('Failed to fetch');
     getProjectById.mockRejectedValue(fetchError);
     const { result } = renderHook(() => useEditableProject(testProjectId));
     await vi.waitFor(() => expect(result.current.isLoading).toBe(false));
     expect(result.current.error).toBe(fetchError.message);
     expect(result.current.editableProject).toBeNull();
  });

  it('should update editableProject immediately on handleChange', async () => {
      const { result } = renderHook(() => useEditableProject(testProjectId));
      await vi.waitFor(() => expect(result.current.isLoading).toBe(false));

      const event = { target: { name: 'name', value: 'New Name' } };
      act(() => { result.current.handleChange(event); });

      expect(result.current.editableProject?.name).toBe('New Name');
      expect(updateProject).not.toHaveBeenCalled();
  });

  // Этот тест теперь покрывает и успешное сохранение после debounce
  it('should call updateProject with debounce after handleChange with latest data', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useEditableProject(testProjectId));
      await vi.waitFor(() => expect(result.current.isLoading).toBe(false));

      const event1 = { target: { name: 'name', value: 'First Change' } };
      const event2 = { target: { name: 'description', value: 'Second Change' } };
      const finalEvent = { target: { name: 'name', value: 'Final Name' } };

      act(() => { result.current.handleChange(event1); });
      act(() => { result.current.handleChange(event2); });
      act(() => { result.current.handleChange(finalEvent); }); // Последнее изменение name

      expect(updateProject).not.toHaveBeenCalled(); // Сразу не вызывается

      // Перематываем таймер
      await act(async () => {
         vi.advanceTimersByTime(1500);
         await Promise.resolve(); // Даем промису updateProject разрешиться
      });

      expect(updateProject).toHaveBeenCalledTimes(1);
      // Проверяем, что отправлены ПОСЛЕДНИЕ данные
      expect(updateProject).toHaveBeenCalledWith(testProjectId, expect.objectContaining({
          name: 'Final Name', // Последнее значение name
          description: 'Second Change', // Последнее значение description
          deadline: '2024-01-01', // Значение из начального состояния
          experience: 'Initial Exp', // Значение из начального состояния
      }));

      // Проверяем состояние ПОСЛЕ успешного сохранения
      expect(result.current.isSaving).toBe(false);
      expect(result.current.saveError).toBeNull();
      expect(result.current.lastSavedStatus).toContain('Saved at');
      // Проверяем, что состояние обновилось данными, которые ВЕРНУЛ мок updateProject
      expect(result.current.editableProject).toEqual(updatedProjectDataFromApi);
      expect(result.current.project).toEqual(updatedProjectDataFromApi);

      vi.useRealTimers();
  });


  // УДАЛЯЕМ этот тест, так как saveChanges не возвращается и его логика
  // проверяется в тесте на debounce
  // it('should handle successful saveChanges', async () => { ... });

  // ИСПРАВЛЯЕМ этот тест: симулируем ошибку через handleChange и debounce
	it('should handle failed saveChanges after handleChange', async () => {
		vi.useFakeTimers();
		const saveErrorMsg = 'Failed to update';
		updateProject.mockRejectedValue(new Error(saveErrorMsg)); // Мокируем ошибку

		const { result } = renderHook(() => useEditableProject(testProjectId));
		await vi.waitFor(() => expect(result.current.isLoading).toBe(false));

		const event = { target: { name: 'name', value: 'Failed Save Attempt' } };

		act(() => {
			 result.current.handleChange(event); // Вызываем изменение
		});

		expect(result.current.editableProject?.name).toBe('Failed Save Attempt'); // Проверяем немедленное обновление

		// Перематываем таймер, чтобы запустить saveChanges
		// Оборачиваем в act, так как advanceTimers вызывает обновление состояния (isSaving=true)
		act(() => {
			 vi.advanceTimersByTime(1500);
		});

		// --- Ждем завершения ВСЕХ промисов, запущенных предыдущим act ---
		// Это включает промис updateProject, который должен завершиться с ошибкой
		await act(async () => {
			 await Promise.resolve(); // Даем циклу событий шанс обработать промисы
		});
		// --- Конец ожидания ---


		// Проверяем, что API был вызван ОДИН раз
		expect(updateProject).toHaveBeenCalledTimes(1);
		expect(updateProject).toHaveBeenCalledWith(testProjectId, expect.objectContaining({
				name: 'Failed Save Attempt'
		}));

		// Проверяем состояние после ОШИБКИ сохранения
		expect(result.current.isSaving).toBe(false);
		expect(result.current.saveError).toBe(saveErrorMsg);
		expect(result.current.lastSavedStatus).toBe('');
		expect(result.current.editableProject).toEqual({
				...expectedInitialEditableState,
				name: 'Failed Save Attempt'
		});
		expect(result.current.project).toEqual(initialProjectDataFromApi);

		vi.useRealTimers();
	});

});
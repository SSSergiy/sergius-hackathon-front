// src/hooks/useProjectDeletion.test.js

import { act, renderHook } from '@testing-library/react';
import { useNavigate } from 'react-router-dom'; // Импортируем для мокирования
import { beforeEach, describe, expect, it, vi } from 'vitest'; // Импортируем из vitest
import { deleteProject } from '../services/api'; // Импортируем для мокирования
import { useProjectDeletion } from './useProjectDeletion'; // Импортируем наш хук

// --- Мокируем зависимости ---
vi.mock('react-router-dom', async (importOriginal) => {
	const actual = await importOriginal(); // Получаем реальный модуль
	return {
		...actual, // Возвращаем все из реального модуля
		useNavigate: vi.fn(), // Заменяем useNavigate на мок-функцию Vitest
	};
});

vi.mock('../services/api', () => ({
	deleteProject: vi.fn(), // Заменяем deleteProject на мок-функцию Vitest
}));
// --- Конец мокирования ---

describe('useProjectDeletion Hook', () => {
	// Создаем мок для функции navigate перед каждым тестом
	const mockNavigate = vi.fn();
	const testProjectId = 'project-123'; // Пример ID проекта

	beforeEach(() => {
		// Сбрасываем вызовы моков перед каждым тестом
		vi.clearAllMocks();
		// Настраиваем мок useNavigate, чтобы он возвращал наш mockNavigate
		useNavigate.mockReturnValue(mockNavigate);
		// Настраиваем базовое поведение мока deleteProject (успешное выполнение)
		deleteProject.mockResolvedValue(undefined); // Успешный delete часто ничего не возвращает
	});

	it('should initialize with correct default state', () => {
		const { result } = renderHook(() => useProjectDeletion(testProjectId));

		expect(result.current.isDeleting).toBe(false);
		expect(result.current.deleteError).toBeNull();
		expect(typeof result.current.handleDelete).toBe('function');
	});

	it('should set isDeleting to true when handleDelete starts and then false on completion', async () => {
    // Мок deleteProject, который не завершается мгновенно
    let resolveDelete;
    const deletePromise = new Promise(resolve => { resolveDelete = resolve; });
    deleteProject.mockReturnValue(deletePromise); // Теперь deleteProject вернет промис, который мы контролируем

    const { result } = renderHook(() => useProjectDeletion(testProjectId));

    // Запускаем handleDelete внутри act
    act(() => {
      result.current.handleDelete();
    });

    // --- Проверяем НЕМЕДЛЕННОЕ состояние ---
    // Сразу после синхронного вызова setIsDeleting(true)
    expect(result.current.isDeleting).toBe(true);
    expect(result.current.deleteError).toBeNull();

    // --- Теперь ждем ЗАВЕРШЕНИЯ асинхронной операции внутри act ---
    // Разрешаем промис deleteProject и ждем обновления состояния
    await act(async () => {
      resolveDelete(); // Завершаем мок API вызова
      // Даем React возможность обработать завершение промиса и обновление состояния в finally
      await deletePromise.catch(() => {}); // Дожидаемся завершения промиса (ловим ошибку на всякий случай)
    });

    // --- Проверяем КОНЕЧНОЕ состояние ---
    // После выполнения блока finally isDeleting должно стать false
    expect(result.current.isDeleting).toBe(false);
    expect(result.current.deleteError).toBeNull(); // Ошибки не было

    // Проверяем, что API и навигация были вызваны
    expect(deleteProject).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledTimes(1); // Навигация должна была произойти
  });


	it('should call deleteProject with correct projectId and navigate on success', async () => {
		const { result } = renderHook(() => useProjectDeletion(testProjectId));

		// Выполняем handleDelete и дожидаемся завершения
		await act(async () => {
			await result.current.handleDelete();
		});

		// Проверяем вызов API
		expect(deleteProject).toHaveBeenCalledTimes(1);
		expect(deleteProject).toHaveBeenCalledWith(testProjectId);

		// Проверяем вызов навигации
		expect(mockNavigate).toHaveBeenCalledTimes(1);
		expect(mockNavigate).toHaveBeenCalledWith('/');

		// Проверяем финальное состояние
		expect(result.current.isDeleting).toBe(false);
		expect(result.current.deleteError).toBeNull();
	});

	it('should call handleDelete with default project name if none provided', async () => {
		const { result } = renderHook(() => useProjectDeletion(testProjectId));

		// Вызываем без аргумента имени
		await act(async () => {
			await result.current.handleDelete();
		});

		// Проверки вызовов API и навигации (как в предыдущем тесте)
		expect(deleteProject).toHaveBeenCalledWith(testProjectId);
		expect(mockNavigate).toHaveBeenCalledWith('/');
		// Здесь не проверяем сам аргумент projectName, т.к. он используется только внутри,
		// но тест подтверждает, что функция работает без него.
	});


	it('should set deleteError and keep isDeleting false on API failure', async () => {
		const errorMessage = 'Network Error';
		// Переопределяем мок deleteProject, чтобы он возвращал ошибку
		deleteProject.mockRejectedValue(new Error(errorMessage));

		const { result } = renderHook(() => useProjectDeletion(testProjectId));

		// Выполняем handleDelete и дожидаемся завершения (ошибки)
		await act(async () => {
			await result.current.handleDelete();
		});

		// Проверяем, что API был вызван
		expect(deleteProject).toHaveBeenCalledTimes(1);
		expect(deleteProject).toHaveBeenCalledWith(testProjectId);

		// Проверяем, что навигация НЕ была вызвана
		expect(mockNavigate).not.toHaveBeenCalled();

		// Проверяем финальное состояние при ошибке
		expect(result.current.isDeleting).toBe(false);
		expect(result.current.deleteError).toBe(errorMessage);
	});

	it('should use provided project name (although not used in current logic)', async () => {
		const { result } = renderHook(() => useProjectDeletion(testProjectId));
		const customProjectName = 'My Test Project';

		// Вызываем с аргументом имени
		await act(async () => {
			await result.current.handleDelete(customProjectName);
		});

		// Проверки вызовов API и навигации (как в успешном тесте)
		expect(deleteProject).toHaveBeenCalledWith(testProjectId);
		expect(mockNavigate).toHaveBeenCalledWith('/');
		// Сам customProjectName ни на что не влияет в текущей реализации handleDelete,
		// но тест проверяет, что функция принимает аргумент без ошибок.
	});

});
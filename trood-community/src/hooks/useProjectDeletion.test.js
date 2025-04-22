// src/hooks/useProjectDeletion.test.js

import { act, renderHook } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteProject } from '../services/api';
import { useProjectDeletion } from './useProjectDeletion';

vi.mock('react-router-dom', async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		useNavigate: vi.fn(),
	};
});

vi.mock('../services/api', () => ({
	deleteProject: vi.fn(),
}));

describe('useProjectDeletion Hook', () => {
	const mockNavigate = vi.fn();
	const testProjectId = 'project-123';

	beforeEach(() => {
		vi.clearAllMocks();
		useNavigate.mockReturnValue(mockNavigate);
		deleteProject.mockResolvedValue(undefined);
	});

	it('should initialize with correct default state', () => {
		const { result } = renderHook(() => useProjectDeletion(testProjectId));

		expect(result.current.isDeleting).toBe(false);
		expect(result.current.deleteError).toBeNull();
		expect(typeof result.current.handleDelete).toBe('function');
	});

	it('should set isDeleting to true when handleDelete starts and then false on completion', async () => {
		let resolveDelete;
		const deletePromise = new Promise(resolve => { resolveDelete = resolve; });
		deleteProject.mockReturnValue(deletePromise);

		const { result } = renderHook(() => useProjectDeletion(testProjectId));

		act(() => {
			result.current.handleDelete();
		});

		expect(result.current.isDeleting).toBe(true);
		expect(result.current.deleteError).toBeNull();

		await act(async () => {
			resolveDelete();
			await deletePromise.catch(() => { });
		});

		expect(result.current.isDeleting).toBe(false);

		expect(deleteProject).toHaveBeenCalledTimes(1);
		expect(mockNavigate).toHaveBeenCalledTimes(1);
	});


	it('should call deleteProject with correct projectId and navigate on success', async () => {
		const { result } = renderHook(() => useProjectDeletion(testProjectId));

		await act(async () => {
			await result.current.handleDelete();
		});

		expect(deleteProject).toHaveBeenCalledTimes(1);
		expect(deleteProject).toHaveBeenCalledWith(testProjectId);

		expect(mockNavigate).toHaveBeenCalledTimes(1);
		expect(mockNavigate).toHaveBeenCalledWith('/');

		expect(result.current.isDeleting).toBe(false);
		expect(result.current.deleteError).toBeNull();
	});

	it('should call handleDelete with default project name if none provided', async () => {
		const { result } = renderHook(() => useProjectDeletion(testProjectId));

		await act(async () => {
			await result.current.handleDelete();
		});

		expect(deleteProject).toHaveBeenCalledWith(testProjectId);
		expect(mockNavigate).toHaveBeenCalledWith('/');
	});


	it('should set deleteError and keep isDeleting false on API failure', async () => {
		const errorMessage = 'Network Error';
		deleteProject.mockRejectedValue(new Error(errorMessage));

		const { result } = renderHook(() => useProjectDeletion(testProjectId));

		await act(async () => {
			await result.current.handleDelete();
		});

		expect(deleteProject).toHaveBeenCalledTimes(1);
		expect(deleteProject).toHaveBeenCalledWith(testProjectId);

		expect(mockNavigate).not.toHaveBeenCalled();

		expect(result.current.isDeleting).toBe(false);
		expect(result.current.deleteError).toBe(errorMessage);
	});

	it('should use provided project name (although not used in current logic)', async () => {
		const { result } = renderHook(() => useProjectDeletion(testProjectId));
		const customProjectName = 'My Test Project';

		await act(async () => {
			await result.current.handleDelete(customProjectName);
		});

		expect(deleteProject).toHaveBeenCalledWith(testProjectId);
		expect(mockNavigate).toHaveBeenCalledWith('/');
	});

});
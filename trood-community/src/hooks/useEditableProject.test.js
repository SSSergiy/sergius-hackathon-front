// src/hooks/useEditableProject.test.js

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getProjectById, updateProject } from '../services/api';
import { useEditableProject } from './useEditableProject';

vi.mock('../services/api', () => ({
  getProjectById: vi.fn(),
  updateProject: vi.fn(),
}));

const testProjectId = 'project-abc';
const initialProjectDataFromApi = {
  id: testProjectId,
  name: 'Initial Name',
  description: 'Initial Desc',
  deadline: '2024-01-01',
  experience: 'Initial Exp',
};

const expectedInitialEditableState = { ...initialProjectDataFromApi };

const updatedProjectDataFromApi = {
  id: testProjectId,
  name: 'Updated Name',
  description: 'Updated Desc',
  deadline: '2024-02-02',
  experience: 'Updated Exp',
};

describe('useEditableProject Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProjectById.mockResolvedValue({ ...initialProjectDataFromApi });
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
    expect(result.current.editableProject).toEqual(expectedInitialEditableState);
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

  it('should call updateProject with debounce after handleChange with latest data', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useEditableProject(testProjectId));
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false));

    const event1 = { target: { name: 'name', value: 'First Change' } };
    const event2 = { target: { name: 'description', value: 'Second Change' } };
    const finalEvent = { target: { name: 'name', value: 'Final Name' } };

    act(() => { result.current.handleChange(event1); });
    act(() => { result.current.handleChange(event2); });
    act(() => { result.current.handleChange(finalEvent); });

    expect(updateProject).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    expect(updateProject).toHaveBeenCalledTimes(1);
    expect(updateProject).toHaveBeenCalledWith(testProjectId, expect.objectContaining({
      name: 'Final Name',
      description: 'Second Change',
      deadline: '2024-01-01',
      experience: 'Initial Exp',
    }));

    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveError).toBeNull();
    expect(result.current.lastSavedStatus).toContain('Saved at');
    expect(result.current.editableProject).toEqual(updatedProjectDataFromApi);
    expect(result.current.project).toEqual(updatedProjectDataFromApi);

    vi.useRealTimers();
  });


  it('should handle failed saveChanges after handleChange', async () => {
    vi.useFakeTimers();
    const saveErrorMsg = 'Failed to update';
    updateProject.mockRejectedValue(new Error(saveErrorMsg));

    const { result } = renderHook(() => useEditableProject(testProjectId));
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false));

    const event = { target: { name: 'name', value: 'Failed Save Attempt' } };

    act(() => {
      result.current.handleChange(event);
    });

    expect(result.current.editableProject?.name).toBe('Failed Save Attempt');

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    await act(async () => {
      await Promise.resolve();
    });


    expect(updateProject).toHaveBeenCalledTimes(1);
    expect(updateProject).toHaveBeenCalledWith(testProjectId, expect.objectContaining({
      name: 'Failed Save Attempt'
    }));

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
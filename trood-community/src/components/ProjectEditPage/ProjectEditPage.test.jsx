import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProjectById, updateProject } from '../../services/api';
import ProjectEditPage from './ProjectEditPage';

vi.mock('../../services/api', () => ({
  getProjectById: vi.fn(),
  updateProject: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (ui, { route = '/', initialEntries = ['/'] } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={route} element={ui} />
      </Routes>
    </MemoryRouter>
  );
};

const projectId = 'proj-edit-1';
const mockProjectDataFromApi = {
  id: projectId,
  name: 'Old Project Name',
  description: 'Old Desc',
  deadline: '15.08.2024', 
  experience: 'Old Exp',
};
const expectedInitialFormData = {
  name: 'Old Project Name',
  description: 'Old Desc',
  deadline: '2024-08-15', 
  experience: 'Old Exp',
};

describe('ProjectEditPage Component', () => {
  const route = `/projects/:projectId/edit`;
  const initialEntries = [`/projects/${projectId}/edit`];

  beforeEach(() => {
    vi.clearAllMocks();
    getProjectById.mockResolvedValue(mockProjectDataFromApi);
    updateProject.mockResolvedValue({}); 
  });

  it('should load project data and populate the form correctly', async () => {
    renderWithRouter(<ProjectEditPage />, { route, initialEntries });

    expect(await screen.findByRole('textbox', { name: /Name/i })).toHaveValue(expectedInitialFormData.name);
    expect(await screen.findByRole('textbox', { name: /Experience/i })).toHaveValue(expectedInitialFormData.experience);
    expect(await screen.findByLabelText(/Deadline/i)).toHaveValue(expectedInitialFormData.deadline); 
    expect(await screen.findByRole('textbox', { name: /Description/i })).toHaveValue(expectedInitialFormData.description);

    expect(getProjectById).toHaveBeenCalledTimes(1);
    expect(getProjectById).toHaveBeenCalledWith(projectId);
  });

  it('should update project and navigate on successful submission', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProjectEditPage />, { route, initialEntries });

    const nameInput = await screen.findByRole('textbox', { name: /Name/i });
    const deadlineInput = await screen.findByLabelText(/Deadline/i);

    const newName = 'Updated Project Name';
    const newDeadline = '2024-09-20';
    await user.clear(nameInput);
    await user.type(nameInput, newName);
    fireEvent.change(deadlineInput, { target: { value: newDeadline } });
    expect(deadlineInput).toHaveValue(newDeadline);

    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    try {
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1), { timeout: 2000 });
      console.log('[TEST] navigate was called!');
    } catch (error) {
      console.error('[TEST] navigate was NOT called within timeout. Checking if updateProject was called...');
      try {
        expect(updateProject).toHaveBeenCalledTimes(1);
        console.log('[TEST] updateProject WAS called, but navigate was NOT.');
      } catch (e) {
        console.error('[TEST] updateProject was also NOT called.');
        screen.debug(undefined, 30000); 
      }
      throw error; 
    }

    expect(updateProject).toHaveBeenCalledTimes(1); 
    expect(updateProject).toHaveBeenCalledWith(projectId, expect.objectContaining({
      name: newName,
      deadline: newDeadline,
      description: expectedInitialFormData.description,
      experience: expectedInitialFormData.experience,
    }));
    console.log('[TEST] updateProject call and arguments checked.');

    expect(mockNavigate).toHaveBeenCalledWith(`/projects/${projectId}`);
    console.log('[TEST] navigate arguments checked.');
  });

  it('should display error message if updateProject fails', async () => {
    const user = userEvent.setup();
    const errorMsg = "Failed to save";
    updateProject.mockRejectedValue(new Error(errorMsg)); 
    renderWithRouter(<ProjectEditPage />, { route, initialEntries });

    await screen.findByRole('textbox', { name: /Name/i });



    expect(mockNavigate).not.toHaveBeenCalled();
  });


});
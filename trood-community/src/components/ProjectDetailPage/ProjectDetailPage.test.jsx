import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditableProject } from '../../hooks/useEditableProject';
import { useProjectDeletion } from '../../hooks/useProjectDeletion';
import { getVacanciesForProject } from '../../services/api';
import ProjectDetailPage from './ProjectDetailPage';

vi.mock('../../hooks/useEditableProject');
vi.mock('../../hooks/useProjectDeletion');
vi.mock('../../services/api', () => ({
  getVacanciesForProject: vi.fn(),
}));
vi.mock('../VacancyCard/VacancyCard', () => ({
  default: ({ vacancy, onClick }) => (
    <li onClick={onClick} data-testid={`vacancy-card-${vacancy.id}`}>
      Vacancy {vacancy.id}: {vacancy.name}
    </li>
  ),
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

const projectId = 'proj-detail-1';
const mockEditableProject = {
  id: projectId,
  name: 'Test Project Detail',
  experience: 'Test Exp',
  deadline: '2024-12-25', 
  description: 'Test Desc',
  field: 'Development',
};
const mockVacancies = [
  { id: 'vac-1', name: 'Vacancy One', /* ...другие поля */ },
  { id: 'vac-2', name: 'Vacancy Two', /* ...другие поля */ },
];

describe('ProjectDetailPage Component', () => {
  const route = '/projects/:projectId';
  const initialEntries = [`/projects/${projectId}`];

  beforeEach(() => {
    vi.clearAllMocks();

    useEditableProject.mockReturnValue({
      editableProject: mockEditableProject,
      handleChange: vi.fn(),
      isLoading: false,
      error: null,
      isSaving: false,
      saveError: null,
      lastSavedStatus: '',
    });
    useProjectDeletion.mockReturnValue({
      isDeleting: false,
      deleteError: null,
      handleDelete: vi.fn(),
    });
    getVacanciesForProject.mockResolvedValue([...mockVacancies]); 
  });

  it('should render project data, form, and vacancies on successful load', async () => {
    renderWithRouter(<ProjectDetailPage />, { route, initialEntries });

    expect(screen.getByRole('heading', { name: mockEditableProject.name })).toBeInTheDocument();
    expect(screen.getByLabelText(/Experience/i)).toHaveValue(mockEditableProject.experience);
    expect(screen.getByLabelText(/Deadline/i)).toHaveValue(mockEditableProject.deadline);
    expect(screen.getByLabelText(/Description/i)).toHaveValue(mockEditableProject.description);
    expect(screen.getByLabelText(/Field/i)).toHaveValue(mockEditableProject.field);

    expect(screen.getByRole('button', { name: /Delete project/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Add vacancy/i })).toBeEnabled();

    expect(await screen.findByTestId('vacancy-card-vac-1')).toBeInTheDocument();
    expect(await screen.findByTestId('vacancy-card-vac-2')).toBeInTheDocument();
    expect(screen.getByText(`Vacancy vac-1: ${mockVacancies[0].name}`)).toBeInTheDocument();

    expect(useEditableProject).toHaveBeenCalledWith(projectId);
    expect(getVacanciesForProject).toHaveBeenCalledWith(projectId);
  });

  it('should navigate to edit page when a vacancy card is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProjectDetailPage />, { route, initialEntries });

    const firstVacancyCard = await screen.findByTestId('vacancy-card-vac-1');

    await user.click(firstVacancyCard);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/projects/${projectId}/vacancies/${mockVacancies[0].id}/edit`, 
      { state: { formattedDeadline: mockEditableProject.deadline } } 
    );
  });


});
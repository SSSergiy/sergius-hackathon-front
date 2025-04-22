// src/components/VacancyCreatePage/VacancyCreatePage.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVacancy } from '../../services/api';
import VacancyCreatePage from './VacancyCreatePage';

vi.mock('../../services/api', () => ({
  createVacancy: vi.fn(),
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


describe('VacancyCreatePage Component', () => {
  const projectId = 'project-42';
  const route = `/projects/:projectId/vacancies/new`; 
  const initialEntries = [`/projects/${projectId}/vacancies/new`]; 

  const testData = {
    name: 'New Test Vacancy',
    field: 'Marketing',
    experience: '2 years',
    country: 'Testlandia',
    description: 'Create amazing tests',
  };

  const mockApiResponse = { id: 101, project_id: 42, ...testData };

  beforeEach(() => {
    vi.clearAllMocks(); 
    createVacancy.mockResolvedValue(mockApiResponse); 
  });

  it('should render the form correctly', () => {
    renderWithRouter(<VacancyCreatePage />, { route, initialEntries });

    expect(screen.getByRole('heading', { name: /Create vacancy/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Field/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Experience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create vacancy/i })).toBeInTheDocument();
  });

  it('should allow typing in fields and update state', async () => {
    const user = userEvent.setup();
    renderWithRouter(<VacancyCreatePage />, { route, initialEntries });

    const nameInput = screen.getByLabelText(/Name/i);
    const experienceInput = screen.getByLabelText(/Experience/i);
    const countryInput = screen.getByLabelText(/Country/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const fieldSelect = screen.getByLabelText(/Field/i);

    await user.type(nameInput, testData.name);
    await user.type(experienceInput, testData.experience);
    await user.type(countryInput, testData.country);
    await user.type(descriptionInput, testData.description);
    await user.selectOptions(fieldSelect, testData.field);

    expect(nameInput).toHaveValue(testData.name);
    expect(experienceInput).toHaveValue(testData.experience);
    expect(countryInput).toHaveValue(testData.country);
    expect(descriptionInput).toHaveValue(testData.description);
    expect(fieldSelect).toHaveValue(testData.field);
  });

  it('should call createVacancy and navigate on successful submission', async () => {
    const user = userEvent.setup();
    renderWithRouter(<VacancyCreatePage />, { route, initialEntries });

    await user.type(screen.getByLabelText(/Name/i), testData.name);
    await user.selectOptions(screen.getByLabelText(/Field/i), testData.field);
    await user.type(screen.getByLabelText(/Experience/i), testData.experience);
    await user.type(screen.getByLabelText(/Country/i), testData.country);
    await user.type(screen.getByLabelText(/Description/i), testData.description);

    const submitButton = screen.getByRole('button', { name: /Create vacancy/i });
    await user.click(submitButton);


    await waitFor(() => {
      expect(createVacancy).toHaveBeenCalledTimes(1);
      expect(createVacancy).toHaveBeenCalledWith(projectId, testData);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(`/projects/${projectId}`);
    });
  });

  it('should display error message if createVacancy fails', async () => {
      const user = userEvent.setup();
      const errorMsg = "Server error";
      createVacancy.mockRejectedValue(new Error(errorMsg));
      renderWithRouter(<VacancyCreatePage />, { route, initialEntries });

      await user.type(screen.getByLabelText(/Name/i), testData.name);
      await user.selectOptions(screen.getByLabelText(/Field/i), testData.field);
      await user.type(screen.getByLabelText(/Experience/i), testData.experience);
      await user.type(screen.getByLabelText(/Country/i), testData.country);
      await user.type(screen.getByLabelText(/Description/i), testData.description);

      const submitButton = screen.getByRole('button', { name: /Create vacancy/i });
      await user.click(submitButton);


      expect(mockNavigate).not.toHaveBeenCalled();

      expect(screen.getByRole('button', { name: /Create vacancy/i })).toBeEnabled();
  });

});
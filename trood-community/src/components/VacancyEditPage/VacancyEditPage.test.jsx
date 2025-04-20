import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteVacancy, getVacancyById, updateVacancy } from '../../services/api';
import VacancyEditPage from './VacancyEditPage';

vi.mock('../../services/api', () => ({
  getVacancyById: vi.fn(),
  updateVacancy: vi.fn(),
  deleteVacancy: vi.fn(),
}));


const mockVacancyData = {
  id: 2,
  project_id: 1,
  name: 'Test Vacancy Name',
  field: 'Marketing',
  experience: '5 years',
  country: 'Testland',
  description: 'Test description here',
};

const renderWithRouter = (ui, { route = '/', initialEntries = ['/'], state = null } = {}) => {
  window.history.pushState(state, '', initialEntries[0]); 
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={route} element={ui} />
      </Routes>
    </MemoryRouter>
  );
};


describe('VacancyEditPage Component', () => {
  const projectId = 'project-1';
  const vacancyId = '2'; // ID из mockVacancyData
  const route = `/projects/:projectId/vacancies/:vacancyId/edit`;
  const initialEntries = [`/projects/${projectId}/vacancies/${vacancyId}/edit`];
  const locationState = { formattedDeadline: '2025-12-31' }; 

  beforeEach(() => {
    vi.clearAllMocks();
    getVacancyById.mockResolvedValue(mockVacancyData); 
    updateVacancy.mockResolvedValue({}); 
    deleteVacancy.mockResolvedValue(null); 
  });

  it('should load vacancy data and populate the form on mount', async () => {
    getVacancyById.mockResolvedValue(mockVacancyData); 
    renderWithRouter(<VacancyEditPage />, { route, initialEntries, state: locationState });


    expect(await screen.findByLabelText(/Description/i)).toHaveValue(mockVacancyData.description);
    expect(await screen.findByLabelText(/Field/i)).toHaveValue(mockVacancyData.field);
    expect(await screen.findByLabelText(/Experience/i)).toHaveValue(mockVacancyData.experience);

    expect(getVacancyById).toHaveBeenCalledTimes(1);
    expect(getVacancyById).toHaveBeenCalledWith(vacancyId);

  });

  // В файле VacancyEditPage.test.jsx

it('should display error message if fetching data fails', async () => {
  const errorMsg = 'Failed to fetch';
  getVacancyById.mockRejectedValue(new Error(errorMsg));

  renderWithRouter(<VacancyEditPage />, { route, initialEntries, state: locationState });

  // Ищем сообщение об ошибке (это правильно)
  const errorElement = await screen.findByRole('alert');
  expect(errorElement).toBeInTheDocument();
  expect(errorElement).toHaveTextContent(`Error: ${errorMsg}`);

  // --- Проверяем ОТСУТСТВИЕ полей формы ---
  // Используем queryBy..., чтобы не было ошибки, если элемент не найден
  expect(screen.queryByRole('combobox', { name: /Field/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /Experience/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: /Description/i })).not.toBeInTheDocument();
  // Добавь сюда проверки отсутствия для других полей, если они есть в твоей форме
  // expect(screen.queryByRole('textbox', { name: /Vacancy Name/i })).not.toBeInTheDocument();
  // expect(screen.queryByRole('textbox', { name: /Country/i })).not.toBeInTheDocument();

  // Проверяем, что API был вызван
  expect(getVacancyById).toHaveBeenCalledTimes(1);
});


});
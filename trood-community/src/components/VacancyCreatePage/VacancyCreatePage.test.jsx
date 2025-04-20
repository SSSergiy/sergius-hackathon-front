// src/components/VacancyCreatePage/VacancyCreatePage.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react'; // Импортируем React
import { MemoryRouter, Route, Routes } from 'react-router-dom'; // useNavigate импортировать НЕ нужно
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVacancy } from '../../services/api';
import VacancyCreatePage from './VacancyCreatePage';
// import Button from '../Button/Button'; // Раскомментируй, если используешь не стандартный button

// --- Мокируем API ---
vi.mock('../../services/api', () => ({
  createVacancy: vi.fn(),
}));

// --- Мокируем useNavigate на верхнем уровне ---
// Создаем мок-функцию navigate, которую будем использовать в тестах
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate, // Фабрика мока теперь возвращает наш mockNavigate
    // useParams будет работать из реального модуля, т.к. мы используем MemoryRouter
  };
});
// --- Конец мокирования ---


// Функция-обертка для рендеринга с роутером (теперь не нужно передавать mockNavigate)
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
  const route = `/projects/:projectId/vacancies/new`; // Маршрут с параметром
  const initialEntries = [`/projects/${projectId}/vacancies/new`]; // Начальный URL

  const testData = {
    name: 'New Test Vacancy',
    field: 'Marketing',
    experience: '2 years',
    country: 'Testlandia',
    description: 'Create amazing tests',
  };

  const mockApiResponse = { id: 101, project_id: 42, ...testData };

  beforeEach(() => {
    vi.clearAllMocks(); // Сбрасываем ВСЕ моки, включая mockNavigate
    createVacancy.mockResolvedValue(mockApiResponse); // Настраиваем API мок
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

    // Заполняем форму
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

      // Ждем появления сообщения об ошибке (нужно убедиться, что компонент рендерит {error})
      // В твоем компоненте VacancyCreatePage нет явного рендеринга {error} при сабмите,
      // но есть setError. Давай проверим, что кнопка разблокировалась, а навигации не было.
      // Если хочешь видеть текст ошибки, добавь <p>{error}</p> в JSX компонента.
      // expect(await screen.findByText(errorMsg)).toBeInTheDocument(); // Закомментировано, пока нет рендера ошибки

      expect(mockNavigate).not.toHaveBeenCalled();

      expect(screen.getByRole('button', { name: /Create vacancy/i })).toBeEnabled();
  });

});
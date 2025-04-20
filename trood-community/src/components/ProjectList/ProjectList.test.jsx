// src/components/ProjectList/ProjectList.test.jsx

import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom'; // Нужен для Link
import { describe, expect, it, vi } from 'vitest';
import ProjectList from './ProjectList';

// Мокируем дочерний компонент ProjectCard, чтобы не тестировать его реализацию здесь
vi.mock('../ProjectCard/ProjectCard', () => ({
  // Мок по умолчанию возвращает div с ID проекта для простой проверки
  default: ({ project }) => <div data-testid={`project-card-${project.id}`}>{project.name}</div>,
}));

// Мокируем Button, если он сложный, или используем реальный
vi.mock('../Button/Button', () => ({
    default: ({ children }) => <button>{children}</button>
}));


// Тестовые данные
const mockProjects = [
  { id: 'proj-1', name: 'Project One', description: 'Desc 1' },
  { id: 'proj-2', name: 'Project Two', description: 'Desc 2' },
];

describe('ProjectList Component', () => {

  it('should render title, create button, and project cards for active projects', () => {
    const title = "Active projects";
    render(
      <MemoryRouter> {/* Обертка для Link */}
        <ProjectList title={title} projects={mockProjects} />
      </MemoryRouter>
    );

    // Проверяем заголовок
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();

    // Проверяем кнопку "Create project" (ищем кнопку внутри ссылки)
    const createButton = screen.getByRole('button', { name: /Create project/i });
    expect(createButton).toBeInTheDocument();
    // Проверяем, что кнопка находится внутри ссылки на /projects/new
    expect(createButton.closest('a')).toHaveAttribute('href', '/projects/new');

    // Проверяем наличие карточек проектов (по test-id из мока)
    expect(screen.getByTestId('project-card-proj-1')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-proj-2')).toBeInTheDocument();
    expect(screen.getByText('Project One')).toBeInTheDocument(); // Проверяем и текст
    expect(screen.getByText('Project Two')).toBeInTheDocument();

    // Проверяем отсутствие сообщения о пустом списке
    expect(screen.queryByText(/No projects in this category/i)).not.toBeInTheDocument();
  });

  it('should render title and project cards but NO create button for non-active projects', () => {
    const title = "Archived Projects";
     render(
      <MemoryRouter>
        <ProjectList title={title} projects={mockProjects} />
      </MemoryRouter>
    );

    // Проверяем заголовок
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();

    // Проверяем ОТСУТСТВИЕ кнопки "Create project"
    expect(screen.queryByRole('button', { name: /Create project/i })).not.toBeInTheDocument();

     // Проверяем наличие карточек проектов
    expect(screen.getByTestId('project-card-proj-1')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-proj-2')).toBeInTheDocument();

     // Проверяем отсутствие сообщения о пустом списке
    expect(screen.queryByText(/No projects in this category/i)).not.toBeInTheDocument();
  });

  it('should render title, create button, and empty message for active projects with empty list', () => {
    const title = "Active projects";
     render(
      <MemoryRouter>
        <ProjectList title={title} projects={[]} /> {/* Пустой массив */}
      </MemoryRouter>
    );

     // Проверяем заголовок
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();

     // Проверяем кнопку "Create project"
    expect(screen.getByRole('button', { name: /Create project/i })).toBeInTheDocument();

     // Проверяем НАЛИЧИЕ сообщения о пустом списке
    expect(screen.getByText(/No projects in this category/i)).toBeInTheDocument();

    // Проверяем ОТСУТСТВИЕ карточек
    expect(screen.queryByTestId(/project-card-/i)).not.toBeInTheDocument();
  });

   it('should render correctly when projects prop is null or undefined', () => {
     const title = "Some Projects";
     const { rerender } = render(
       <MemoryRouter>
         <ProjectList title={title} projects={null} />
       </MemoryRouter>
     );

     expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
     // Сообщение о пустом списке не должно рендериться для null/undefined, если логика Array.isArray
     expect(screen.queryByText(/No projects in this category/i)).not.toBeInTheDocument();
     expect(screen.queryByTestId(/project-card-/i)).not.toBeInTheDocument();

     // Перерендерим с undefined
     rerender(
        <MemoryRouter>
         <ProjectList title={title} projects={undefined} />
       </MemoryRouter>
     );
     expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
     expect(screen.queryByText(/No projects in this category/i)).not.toBeInTheDocument();
     expect(screen.queryByTestId(/project-card-/i)).not.toBeInTheDocument();

   });

});
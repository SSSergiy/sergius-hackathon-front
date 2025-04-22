
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProjectList from './ProjectList';

vi.mock('../ProjectCard/ProjectCard', () => ({
  default: ({ project }) => <div data-testid={`project-card-${project.id}`}>{project.name}</div>,
}));

vi.mock('../Button/Button', () => ({
    default: ({ children }) => <button>{children}</button>
}));


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

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: /Create project/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton.closest('a')).toHaveAttribute('href', '/projects/new');

    expect(screen.getByTestId('project-card-proj-1')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-proj-2')).toBeInTheDocument();
    expect(screen.getByText('Project One')).toBeInTheDocument(); 
    expect(screen.getByText('Project Two')).toBeInTheDocument();

    expect(screen.queryByText(/No projects in this category/i)).not.toBeInTheDocument();
  });

  it('should render title and project cards but NO create button for non-active projects', () => {
    const title = "Archived Projects";
     render(
      <MemoryRouter>
        <ProjectList title={title} projects={mockProjects} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /Create project/i })).not.toBeInTheDocument();

    expect(screen.getByTestId('project-card-proj-1')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-proj-2')).toBeInTheDocument();

    expect(screen.queryByText(/No projects in this category/i)).not.toBeInTheDocument();
  });

  it('should render title, create button, and empty message for active projects with empty list', () => {
    const title = "Active projects";
     render(
      <MemoryRouter>
        <ProjectList title={title} projects={[]} /> {/* Пустой массив */}
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Create project/i })).toBeInTheDocument();

    expect(screen.getByText(/No projects in this category/i)).toBeInTheDocument();

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
     expect(screen.queryByText(/No projects in this category/i)).not.toBeInTheDocument();
     expect(screen.queryByTestId(/project-card-/i)).not.toBeInTheDocument();

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
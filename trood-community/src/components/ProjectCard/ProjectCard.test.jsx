import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ProjectCard from './ProjectCard';

vi.mock('./FiBell', () => ({ default: () => <svg data-testid="bell-icon" /> }));
vi.mock('./FiMessageSquare', () => ({ default: () => <svg data-testid="message-icon" /> }));
vi.mock('./FiUser', () => ({ default: () => <svg data-testid="user-icon" /> }));


const renderWithRouter = (ui) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

const mockProject = {
  id: 'prj-123',
  name: 'Super Project',
  description: 'A very detailed description.',
  deadline: '2024-12-31', 
  experience: '3-5 years',
};

const expectedFormattedDate = '31.12.2024';

describe('ProjectCard Component', () => {

  it('should render correctly when active', () => {
    renderWithRouter(<ProjectCard project={mockProject} isActive={true} />);

    const linkElement = screen.getByRole('link');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', `/projects/${mockProject.id}`);

    expect(screen.getByRole('heading', { name: mockProject.name })).toBeInTheDocument();
    expect(screen.getByText(mockProject.description)).toBeInTheDocument();
    expect(screen.getByText(`Experience:`)).toBeInTheDocument();
    expect(screen.getByText(mockProject.experience)).toBeInTheDocument();
    expect(screen.getByText(`Deadline:`)).toBeInTheDocument();
    expect(screen.getByText(expectedFormattedDate)).toBeInTheDocument();

    expect(screen.getByTestId('user-icon')).toBeInTheDocument(); 
    expect(screen.getByText(/Anna Lenram/i)).toBeInTheDocument();
    expect(screen.getByTestId('message-icon')).toBeInTheDocument();
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-dot')).not.toBeInTheDocument();

  });

  it('should render correctly when NOT active', () => {
    renderWithRouter(<ProjectCard project={mockProject} isActive={false} />);

    const linkElement = screen.getByRole('link');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', `/projects/${mockProject.id}`);

    expect(screen.getByRole('heading', { name: mockProject.name })).toBeInTheDocument();

    expect(screen.queryByText(mockProject.description)).not.toBeInTheDocument();
    expect(screen.queryByText(`Experience:`)).not.toBeInTheDocument();
    expect(screen.queryByText(`Deadline:`)).not.toBeInTheDocument();
    expect(screen.queryByText(expectedFormattedDate)).not.toBeInTheDocument();


    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.getByText(/Anna Lenram/i)).toBeInTheDocument();
    expect(screen.getByTestId('message-icon')).toBeInTheDocument();
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
  });

  it('should display fallback text for missing data', () => {
    const partialProject = { id: 'prj-partial' }; 
    renderWithRouter(<ProjectCard project={partialProject} isActive={true} />);

    expect(screen.getByRole('heading', { name: /Unnamed Project/i })).toBeInTheDocument();
    expect(screen.getByText(/No description provided/i)).toBeInTheDocument();
    expect(screen.getByText(/Experience:/i)).toBeInTheDocument();
    expect(screen.getByText(/Not specified/i)).toBeInTheDocument();
    expect(screen.getByText(/Deadline:/i)).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument(); 
  });

   it('should display invalid date string as is', () => {
    const projectWithInvalidDate = { ...mockProject, deadline: 'Invalid Date String' };
    renderWithRouter(<ProjectCard project={projectWithInvalidDate} isActive={true} />);

    expect(screen.getByText('Invalid Date String')).toBeInTheDocument();
     expect(screen.queryByText(expectedFormattedDate)).not.toBeInTheDocument();

  });

  it('should display error message for invalid project prop', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithRouter(<ProjectCard project={null} isActive={true} />);
    expect(screen.getByText(/Invalid project data/i)).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

});
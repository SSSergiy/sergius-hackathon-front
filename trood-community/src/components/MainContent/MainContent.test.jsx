
import { render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getProjects } from '../../services/api';
import MainContent from './MainContent';

vi.mock('../../services/api', () => ({
  getProjects: vi.fn(),
}));

vi.mock('../ProjectList/ProjectList', () => ({
  default: ({ title, projects }) => (
    <div data-testid={`project-list-${title.toLowerCase().replace(' ', '-')}`}>
      <h2>{title}</h2>
      <span data-testid="project-count">Count: {projects?.length ?? 0}</span>
      <ul>
        {projects?.map(p => <li key={p.id}>{p.id}</li>)}
      </ul>
    </div>
  ),
}));


const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const formatDateForTest = (date) => date.toISOString().split('T')[0];

const mockApiProjects = [
  { id: 'p1', name: 'Active Future', deadline: formatDateForTest(tomorrow) },
  { id: 'p2', name: 'Active No Deadline', deadline: null },
  { id: 'p3', name: 'Passed Yesterday', deadline: formatDateForTest(yesterday) },
  { id: 'p4', name: 'Active Invalid Date', deadline: 'не дата' },
  { id: 'p5', name: 'Active Today', deadline: formatDateForTest(today) },
];

const expectedActiveIds = ['p1', 'p2', 'p4'];
const expectedPassedIds = ['p3', 'p5'];


describe('MainContent Component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    getProjects.mockResolvedValue([...mockApiProjects]);
  });

  it('should display loading state initially', () => {
    render(<MainContent />);
    expect(screen.getByText(/Loading projects.../i)).toBeInTheDocument();
  });

  it('should fetch projects and render active/passed lists correctly on success', async () => {
    render(<MainContent />);

    await waitFor(() => expect(screen.queryByText(/Loading projects.../i)).not.toBeInTheDocument());

    expect(getProjects).toHaveBeenCalledTimes(1);

    const activeListContainer = screen.getByTestId('project-list-active-projects');
    const passedListContainer = screen.getByTestId('project-list-passed-projects');

    expect(within(activeListContainer).getByRole('heading', { name: /Active projects/i })).toBeInTheDocument();
    expect(within(passedListContainer).getByRole('heading', { name: /Passed projects/i })).toBeInTheDocument();

    expect(within(activeListContainer).getByTestId('project-count')).toHaveTextContent(`Count: ${expectedActiveIds.length}`); 
    expect(within(passedListContainer).getByTestId('project-count')).toHaveTextContent(`Count: ${expectedPassedIds.length}`); 

    expectedActiveIds.forEach(id => {
      expect(within(activeListContainer).getByText(id)).toBeInTheDocument();
    });
    expectedPassedIds.forEach(id => {
      expect(within(passedListContainer).getByText(id)).toBeInTheDocument();
    });
  });

  it('should display error message if fetching projects fails', async () => {
    const errorMsg = "Network Error";
    getProjects.mockRejectedValue(new Error(errorMsg));
    render(<MainContent />);

    expect(await screen.findByText(`Error: ${errorMsg}`)).toBeInTheDocument();

    expect(screen.queryByTestId('project-list-active-projects')).not.toBeInTheDocument();
    expect(screen.queryByTestId('project-list-passed-projects')).not.toBeInTheDocument();
    expect(getProjects).toHaveBeenCalledTimes(1);
  });

  it('should handle non-array API response gracefully', async () => {
    getProjects.mockResolvedValue({ message: "This is not an array" });
    render(<MainContent />);

    await waitFor(() => expect(screen.queryByText(/Loading projects.../i)).not.toBeInTheDocument());

    expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument();

    const activeListContainer = screen.getByTestId('project-list-active-projects');
    const passedListContainer = screen.getByTestId('project-list-passed-projects');

    expect(within(activeListContainer).getByTestId('project-count')).toHaveTextContent('Count: 0');
    expect(within(passedListContainer).getByTestId('project-count')).toHaveTextContent('Count: 0');
  });

});
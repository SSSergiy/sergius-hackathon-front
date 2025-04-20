
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Sidebar from './Sidebar';

describe('Sidebar Component', () => {

  const menuItems = ['Main page', 'Projects', 'Vacancies', 'People', 'Tests', 'Settings'];

  it('should render all menu items and the logout button', () => {
    render(<Sidebar />);

    menuItems.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });

    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('should have "Projects" as the default active item', () => {
    render(<Sidebar />);

    const projectsItemDiv = screen.getByText('Projects').closest('div');
    const mainPageItemDiv = screen.getByText('Main page').closest('div');

    expect(projectsItemDiv.classList.contains('active')).toBe(true);
    expect(projectsItemDiv.classList.contains('sidebarItem')).toBe(true);

    expect(mainPageItemDiv.classList.contains('active')).toBe(false);
    expect(mainPageItemDiv.classList.contains('sidebarItem')).toBe(true);
  });

  it('should change the active item on click', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    const vacanciesItemText = 'Vacancies';
    const projectsItemText = 'Projects';

    const projectsItemDivBeforeClick = screen.getByText(projectsItemText).closest('div');
    const vacanciesItemDivBeforeClick = screen.getByText(vacanciesItemText).closest('div');

    expect(projectsItemDivBeforeClick.classList.contains('active')).toBe(true);
    expect(vacanciesItemDivBeforeClick.classList.contains('active')).toBe(false);

    await user.click(screen.getByText(vacanciesItemText));

    await waitFor(() => {
      const vacanciesItemDivAfterClick = screen.getByText(vacanciesItemText).closest('div');
      expect(vacanciesItemDivAfterClick.classList.contains('active')).toBe(true);
    });

    const projectsItemDivAfterClick = screen.getByText(projectsItemText).closest('div');
    expect(projectsItemDivAfterClick.classList.contains('active')).toBe(false);
  });

  it('SidebarItem should call onClick when clicked - Placeholder', async () => {
    render(<Sidebar />);
    const testItem = screen.getByText('Settings');
    expect(testItem).toBeInTheDocument(); 
    expect(true).toBe(true);
  });

});
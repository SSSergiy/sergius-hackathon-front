import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import VacancyCard from './VacancyCard';
import styles from './VacancyCard.module.css';

const mockVacancy = {
  id: 101,
  project_id: 1,
  name: 'Senior React Developer',
  field: 'Development',
  experience: '5+ years',
  country: 'Remote',
  description: 'Building awesome UI components.',
};

const mockOnClick = vi.fn();

describe('VacancyCard Component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render vacancy data correctly', () => {
    render(
      <ul>
        <VacancyCard vacancy={mockVacancy} onClick={mockOnClick} />
      </ul>
    );

    expect(screen.getByText(mockVacancy.field)).toBeInTheDocument();
    expect(screen.getByText(mockVacancy.name)).toBeInTheDocument();
    expect(screen.getByText(mockVacancy.experience)).toBeInTheDocument();
    expect(screen.getByText(mockVacancy.country)).toBeInTheDocument();
    expect(screen.getByText(mockVacancy.description)).toBeInTheDocument();
  });

  it('should call onClick handler when the card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ul>
        <VacancyCard vacancy={mockVacancy} onClick={mockOnClick} />
      </ul>
    );

    const cardElement = screen.getByRole('listitem'); 

    await user.click(cardElement);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should render nothing if vacancy prop is not provided', () => {
    const { container } = render(
      <ul>
        <VacancyCard vacancy={null} onClick={mockOnClick} />
      </ul>
    );

     const listItem = container.querySelector(`.${styles.vacancyCard}`); 
    expect(listItem).toBeNull();
  });

});
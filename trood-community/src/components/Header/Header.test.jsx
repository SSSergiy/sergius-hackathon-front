
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import Header from './Header';

vi.mock('./FiBell', () => ({ default: () => <svg data-testid="bell-icon" /> }));
vi.mock('./FiMessageSquare', () => ({ default: () => <svg data-testid="message-icon" /> }));


describe('Header Component', () => {

  it('should render logo, icons, and user name', () => {
    render(<Header />);

    expect(screen.getByText(/TROOD COMMUNITY/i)).toBeInTheDocument();

    expect(screen.getByTestId('message-icon')).toBeInTheDocument();
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();

    expect(screen.getByText(/Alex Smith/i)).toBeInTheDocument();

    const avatar = document.querySelector('.avatar'); 
    expect(avatar).toBeInTheDocument();
  });

});
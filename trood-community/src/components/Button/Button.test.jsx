
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button';
import styles from './Button.module.css';

describe('Button Component', () => {

  it('should render children correctly', () => {
    const buttonText = 'Click Me!';
    render(<Button>{buttonText}</Button>);

    const buttonElement = screen.getByRole('button', { name: buttonText });
    expect(buttonElement).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn(); 
    const buttonText = 'Submit';

    render(<Button onClick={handleClick}>{buttonText}</Button>);

    const buttonElement = screen.getByRole('button', { name: buttonText });

    await user.click(buttonElement);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply base and custom classNames', () => {
    const buttonText = 'Custom Style';
    const customClass = 'my-custom-button-class'; 

    render(<Button className={customClass}>{buttonText}</Button>);

    const buttonElement = screen.getByRole('button', { name: buttonText });

    expect(buttonElement.classList.contains(styles.button)).toBe(true);

    expect(buttonElement.classList.contains(customClass)).toBe(true);

  });

 

});
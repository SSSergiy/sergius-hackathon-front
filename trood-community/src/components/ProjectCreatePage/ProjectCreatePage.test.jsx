import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '../../services/api';
import ProjectCreatePage from './ProjectCreatePage';

vi.mock('../../services/api', () => ({
  createProject: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderWithRouter = (ui) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

const testFormData = {
  name: 'Awesome New Project',
  field: 'Development', 
  experience: '10 years',
  deadline: '2025-12-31', 
  description: 'This project will be amazing',
};
const expectedApiData = {
  name: testFormData.name,
  experience: testFormData.experience,
  deadline: testFormData.deadline,
  description: testFormData.description,
};
const mockApiResponse = { id: 'proj-new-1', ...expectedApiData };


describe('ProjectCreatePage Component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    createProject.mockResolvedValue(mockApiResponse); 
  });

  it('should render the form correctly', () => {
    renderWithRouter(<ProjectCreatePage />);

    expect(screen.getByRole('heading', { name: /Creating project/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Field/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Experience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Deadline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create project/i })).toBeInTheDocument();
  });

  it('should allow data entry and update form state', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProjectCreatePage />);

    const nameInput = screen.getByLabelText(/Name/i);
    const fieldSelect = screen.getByLabelText(/Field/i);
    const experienceInput = screen.getByLabelText(/Experience/i);
    const deadlineInput = screen.getByLabelText(/Deadline/i);
    const descriptionInput = screen.getByLabelText(/Description/i);

    await user.type(nameInput, testFormData.name);
    await user.selectOptions(fieldSelect, testFormData.field);
    await user.type(experienceInput, testFormData.experience);
    fireEvent.change(deadlineInput, { target: { value: testFormData.deadline } });
    await user.type(descriptionInput, testFormData.description);

    expect(nameInput).toHaveValue(testFormData.name);
    expect(fieldSelect).toHaveValue(testFormData.field);
    expect(experienceInput).toHaveValue(testFormData.experience);
    expect(deadlineInput).toHaveValue(testFormData.deadline);
    expect(descriptionInput).toHaveValue(testFormData.description);
  });

  it('should call createProject with correct data (excluding field) and navigate on successful submission', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProjectCreatePage />);

    await user.type(screen.getByLabelText(/Name/i), testFormData.name);
    await user.selectOptions(screen.getByLabelText(/Field/i), testFormData.field); 
    await user.type(screen.getByLabelText(/Experience/i), testFormData.experience);
    fireEvent.change(screen.getByLabelText(/Deadline/i), { target: { value: testFormData.deadline } });
    await user.type(screen.getByLabelText(/Description/i), testFormData.description);

    const submitButton = screen.getByRole('button', { name: /Create project/i });
    await user.click(submitButton);


    await waitFor(() => {
      expect(createProject).toHaveBeenCalledTimes(1);
      expect(createProject).toHaveBeenCalledWith(expectedApiData); 
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/'); 
    });
  });

  it('should display error message if createProject fails', async () => {
      const user = userEvent.setup();
      const errorMsg = "Creation failed";
      createProject.mockRejectedValue(new Error(errorMsg));
      renderWithRouter(<ProjectCreatePage />);

      await user.type(screen.getByLabelText(/Name/i), testFormData.name);
      fireEvent.change(screen.getByLabelText(/Deadline/i), { target: { value: testFormData.deadline } });

      const submitButton = screen.getByRole('button', { name: /Create project/i });
      await user.click(submitButton);

      expect(await screen.findByText(errorMsg)).toBeInTheDocument();

      expect(mockNavigate).not.toHaveBeenCalled();

      expect(screen.getByRole('button', { name: /Create project/i })).toBeEnabled();
  });

});
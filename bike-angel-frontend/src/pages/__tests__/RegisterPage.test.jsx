import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';
import * as authService from '../../services/authService';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  register: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RegisterPage - Form Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderRegisterPage = () => {
    return render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
  };

  it('should display validation error when name is empty', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
  });

  it('should display validation error when email is empty', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
  });

  it('should display validation error when email does not end with @ucsd.edu', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const emailInput = screen.getByLabelText(/ucsd email/i);
    await user.type(emailInput, 'test@gmail.com');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(await screen.findByText('Please use your @ucsd.edu email address')).toBeInTheDocument();
  });

  it('should accept valid @ucsd.edu email', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const emailInput = screen.getByLabelText(/ucsd email/i);
    await user.type(emailInput, 'test@ucsd.edu');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    // Should not show email error
    expect(screen.queryByText('Please use your @ucsd.edu email address')).not.toBeInTheDocument();
  });

  it('should display validation error when password is too short', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'short');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('should display validation error when password lacks uppercase letter', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(await screen.findByText('Password must contain at least 1 uppercase letter')).toBeInTheDocument();
  });

  it('should display validation error when password lacks number', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'Password');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(await screen.findByText('Password must contain at least 1 number')).toBeInTheDocument();
  });

  it('should display validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password456');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  it('should clear field error when user starts typing', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    // Trigger validation error
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(await screen.findByText('Email is required')).toBeInTheDocument();

    // Start typing in email field
    const emailInput = screen.getByLabelText(/ucsd email/i);
    await user.type(emailInput, 't');

    // Error should be cleared
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    authService.register.mockResolvedValue({ message: 'Registration successful' });

    renderRegisterPage();

    // Fill in valid form data
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/ucsd email/i), 'john@ucsd.edu');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        email: 'john@ucsd.edu',
        password: 'Password123',
        name: 'John Doe',
      });
    });
  });

  it('should display error message when registration fails', async () => {
    const user = userEvent.setup();
    authService.register.mockRejectedValue({
      response: { data: { message: 'Email already exists' } },
    });

    renderRegisterPage();

    // Fill in valid form data
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/ucsd email/i), 'john@ucsd.edu');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    authService.register.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderRegisterPage();

    // Fill in valid form data
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/ucsd email/i), 'john@ucsd.edu');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });
  });
});

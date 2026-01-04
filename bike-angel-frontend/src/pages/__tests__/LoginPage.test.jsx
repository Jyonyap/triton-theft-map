import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import * as authService from '../../services/authService';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  login: vi.fn(),
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

describe('LoginPage - Form Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  it('should display validation error when email is empty', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
  });

  it('should display validation error when password is empty', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });

  it('should clear field error when user starts typing', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // Trigger validation error
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(await screen.findByText('Email is required')).toBeInTheDocument();

    // Start typing in email field
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 't');

    // Error should be cleared
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('should submit form with valid credentials', async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValue({ token: 'fake-token', user: { id: '1' } });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'test@ucsd.edu');
    await user.type(screen.getByLabelText(/password/i), 'Password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@ucsd.edu',
        password: 'Password123',
      });
    });
  });

  it('should navigate to map page on successful login', async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValue({ token: 'fake-token', user: { id: '1' } });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'test@ucsd.edu');
    await user.type(screen.getByLabelText(/password/i), 'Password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/map');
    });
  });

  it('should display error message when login fails', async () => {
    const user = userEvent.setup();
    authService.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'test@ucsd.edu');
    await user.type(screen.getByLabelText(/password/i), 'WrongPassword');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    authService.login.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'test@ucsd.edu');
    await user.type(screen.getByLabelText(/password/i), 'Password123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });
  });
});

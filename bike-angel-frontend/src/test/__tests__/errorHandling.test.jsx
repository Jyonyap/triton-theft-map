import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../../pages/RegisterPage';
import LoginPage from '../../pages/LoginPage';
import ReportParkingPage from '../../pages/ReportParkingPage';
import * as authService from '../../services/authService';
import * as reportService from '../../services/reportService';
import * as zoneService from '../../services/zoneService';

// Mock services
vi.mock('../../services/authService', () => ({
  register: vi.fn(),
  login: vi.fn(),
}));

vi.mock('../../services/reportService', () => ({
  createParkingReport: vi.fn(),
}));

vi.mock('../../services/zoneService', () => ({
  getAllZones: vi.fn(),
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

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Network Errors', () => {
    it('should handle network error during registration', async () => {
      const user = userEvent.setup();
      authService.register.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/ucsd email/i), 'john@ucsd.edu');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(await screen.findByText(/registration failed/i)).toBeInTheDocument();
    });

    it('should handle network error during login', async () => {
      const user = userEvent.setup();
      authService.login.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/email address/i), 'test@ucsd.edu');
      await user.type(screen.getByLabelText(/password/i), 'Password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
    });

    it('should handle network error when loading zones', async () => {
      zoneService.getAllZones.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <ReportParkingPage />
        </BrowserRouter>
      );

      expect(await screen.findByText(/failed to load parking zones/i)).toBeInTheDocument();
    });
  });

  describe('API Error Responses', () => {
    it('should display specific error message from API', async () => {
      const user = userEvent.setup();
      authService.register.mockRejectedValue({
        response: { 
          data: { message: 'Email already registered' } 
        },
      });

      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/ucsd email/i), 'john@ucsd.edu');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    });

    it('should handle 401 unauthorized error', async () => {
      const user = userEvent.setup();
      authService.login.mockRejectedValue({
        response: { 
          status: 401,
          data: { message: 'Invalid credentials' } 
        },
      });

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/email address/i), 'test@ucsd.edu');
      await user.type(screen.getByLabelText(/password/i), 'WrongPassword');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    });

    it('should handle 500 server error', async () => {
      const user = userEvent.setup();
      authService.login.mockRejectedValue({
        response: { 
          status: 500,
          data: { message: 'Internal server error' } 
        },
      });

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/email address/i), 'test@ucsd.edu');
      await user.type(screen.getByLabelText(/password/i), 'Password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(await screen.findByText('Internal server error')).toBeInTheDocument();
    });
  });

  describe('Validation Errors', () => {
    it('should prevent submission with invalid email format', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/ucsd email/i), 'invalid-email');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Should not call the API
      expect(authService.register).not.toHaveBeenCalled();
      
      // Should show validation error
      expect(await screen.findByText(/please use your @ucsd.edu email address/i)).toBeInTheDocument();
    });

    it('should prevent submission with weak password', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/ucsd email/i), 'john@ucsd.edu');
      await user.type(screen.getByLabelText(/^password$/i), 'weak');
      await user.type(screen.getByLabelText(/confirm password/i), 'weak');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Should not call the API
      expect(authService.register).not.toHaveBeenCalled();
      
      // Should show validation error
      expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('should prevent submission with mismatched passwords', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/ucsd email/i), 'john@ucsd.edu');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password456');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Should not call the API
      expect(authService.register).not.toHaveBeenCalled();
      
      // Should show validation error
      expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  describe('File Upload Errors', () => {
    beforeEach(() => {
      zoneService.getAllZones.mockResolvedValue({ 
        zones: [{ id: '1', name: 'Zone A' }] 
      });
    });

    it('should reject non-image files', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <ReportParkingPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
      });

      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/parking zone/i).closest('form').querySelector('input[type="file"]');
      
      await user.upload(fileInput, file);

      expect(await screen.findByText(/please select an image file/i)).toBeInTheDocument();
    });

    it('should reject files larger than 5MB', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <ReportParkingPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
      });

      // Create a large file
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
      
      const fileInput = screen.getByLabelText(/parking zone/i).closest('form').querySelector('input[type="file"]');
      await user.upload(fileInput, largeFile);

      expect(await screen.findByText(/image must be less than 5mb/i)).toBeInTheDocument();
    });

    it('should handle upload failure gracefully', async () => {
      const user = userEvent.setup();
      reportService.createParkingReport.mockRejectedValue(
        new Error('Upload failed')
      );

      render(
        <BrowserRouter>
          <ReportParkingPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
      });

      // Upload valid photo
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/parking zone/i).closest('form').querySelector('input[type="file"]');
      await user.upload(fileInput, file);

      // Select zone
      const zoneSelect = screen.getByLabelText(/parking zone/i);
      await user.selectOptions(zoneSelect, '1');

      // Submit
      const submitButton = screen.getByRole('button', { name: /submit report/i });
      await user.click(submitButton);

      expect(await screen.findByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after failed submission', async () => {
      const user = userEvent.setup();
      
      // First attempt fails
      authService.login.mockRejectedValueOnce(new Error('Network error'));
      // Second attempt succeeds
      authService.login.mockResolvedValueOnce({ token: 'fake-token', user: { id: '1' } });

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/email address/i), 'test@ucsd.edu');
      await user.type(screen.getByLabelText(/password/i), 'Password123');

      // First attempt
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(await screen.findByText(/login failed/i)).toBeInTheDocument();

      // Retry
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/map');
      });
    });

    it('should clear errors when user modifies input', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(await screen.findByText('Email is required')).toBeInTheDocument();

      // Start typing
      const emailInput = screen.getByLabelText(/ucsd email/i);
      await user.type(emailInput, 't');

      // Error should be cleared
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });
});

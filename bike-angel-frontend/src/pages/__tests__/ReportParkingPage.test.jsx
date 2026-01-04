import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ReportParkingPage from '../ReportParkingPage';
import * as reportService from '../../services/reportService';
import * as zoneService from '../../services/zoneService';

// Mock the services
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

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

describe('ReportParkingPage - Photo Upload Flow', () => {
  const mockZones = [
    { id: '1', name: 'Zone A', latitude: 32.88, longitude: -117.23 },
    { id: '2', name: 'Zone B', latitude: 32.88, longitude: -117.24 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    zoneService.getAllZones.mockResolvedValue({ zones: mockZones });
  });

  const renderReportParkingPage = () => {
    return render(
      <BrowserRouter>
        <ReportParkingPage />
      </BrowserRouter>
    );
  };

  it('should load parking zones on mount', async () => {
    renderReportParkingPage();

    await waitFor(() => {
      expect(zoneService.getAllZones).toHaveBeenCalled();
    });

    // Check that zones are loaded in the dropdown
    const zoneSelect = await screen.findByLabelText(/parking zone/i);
    expect(zoneSelect).toBeInTheDocument();
  });

  it('should display privacy warning about faces', () => {
    renderReportParkingPage();

    expect(screen.getByText(/avoid capturing people's faces/i)).toBeInTheDocument();
  });

  it('should show error when submitting without photo', async () => {
    const user = userEvent.setup();
    renderReportParkingPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);

    expect(await screen.findByText(/please take or select a photo/i)).toBeInTheDocument();
  });

  it('should show error when submitting without zone selection', async () => {
    const user = userEvent.setup();
    renderReportParkingPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
    });

    // Create a mock file
    const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/parking zone/i).closest('form').querySelector('input[type="file"]');
    
    // Simulate file selection
    await user.upload(fileInput, file);

    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);

    expect(await screen.findByText(/please select a parking zone/i)).toBeInTheDocument();
  });

  it('should validate file type', async () => {
    const user = userEvent.setup();
    renderReportParkingPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
    });

    // Create a non-image file
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/parking zone/i).closest('form').querySelector('input[type="file"]');
    
    await user.upload(fileInput, file);

    expect(await screen.findByText(/please select an image file/i)).toBeInTheDocument();
  });

  it('should validate file size (max 5MB)', async () => {
    const user = userEvent.setup();
    renderReportParkingPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
    });

    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
    
    const fileInput = screen.getByLabelText(/parking zone/i).closest('form').querySelector('input[type="file"]');
    await user.upload(fileInput, largeFile);

    expect(await screen.findByText(/image must be less than 5mb/i)).toBeInTheDocument();
  });

  it('should display photo preview after selection', async () => {
    const user = userEvent.setup();
    renderReportParkingPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
    });

    const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/parking zone/i).closest('form').querySelector('input[type="file"]');
    
    await user.upload(fileInput, file);

    await waitFor(() => {
      const preview = screen.getByAltText('Preview');
      expect(preview).toBeInTheDocument();
    });
  });

  it('should allow removing selected photo', async () => {
    const user = userEvent.setup();
    renderReportParkingPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
    });

    const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/parking zone/i).closest('form').querySelector('input[type="file"]');
    
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
    });

    const removeButton = screen.getByLabelText(/remove photo/i);
    await user.click(removeButton);

    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
  });

  it('should submit report with valid photo and zone', async () => {
    const user = userEvent.setup();
    reportService.createParkingReport.mockResolvedValue({ 
      reportId: '123', 
      timestamp: new Date().toISOString() 
    });

    renderReportParkingPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
    });

    // Upload photo
    const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/parking zone/i).closest('form').querySelector('input[type="file"]');
    await user.upload(fileInput, file);

    // Select zone
    const zoneSelect = screen.getByLabelText(/parking zone/i);
    await user.selectOptions(zoneSelect, '1');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(reportService.createParkingReport).toHaveBeenCalledWith(
        expect.any(File),
        '1'
      );
    });
  });

  it('should show upload progress during submission', async () => {
    const user = userEvent.setup();
    reportService.createParkingReport.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ reportId: '123' }), 1000))
    );

    renderReportParkingPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
    });

    // Upload photo
    const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/parking zone/i).closest('form').querySelector('input[type="file"]');
    await user.upload(fileInput, file);

    // Select zone
    const zoneSelect = screen.getByLabelText(/parking zone/i);
    await user.selectOptions(zoneSelect, '1');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
  });

  it('should display success message after successful submission', async () => {
    const user = userEvent.setup();
    reportService.createParkingReport.mockResolvedValue({ 
      reportId: '123', 
      timestamp: new Date().toISOString() 
    });

    renderReportParkingPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
    });

    // Upload photo
    const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/parking zone/i).closest('form').querySelector('input[type="file"]');
    await user.upload(fileInput, file);

    // Select zone
    const zoneSelect = screen.getByLabelText(/parking zone/i);
    await user.selectOptions(zoneSelect, '1');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);

    expect(await screen.findByText(/success/i)).toBeInTheDocument();
  });

  it('should display error message when submission fails', async () => {
    const user = userEvent.setup();
    reportService.createParkingReport.mockRejectedValue(
      new Error('Upload failed')
    );

    renderReportParkingPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/parking zone/i)).toBeInTheDocument();
    });

    // Upload photo
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

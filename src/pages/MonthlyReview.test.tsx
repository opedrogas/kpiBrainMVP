import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { MonthlyReview } from './MonthlyReview';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { ReviewService } from '../services/reviewService';
import { FileUploadService } from '../services/fileUploadService';

// Mock the context providers and services
jest.mock('../contexts/DataContext');
jest.mock('../contexts/AuthContext');
jest.mock('../services/reviewService');
jest.mock('../services/fileUploadService');
jest.mock('../utils/nameFormatter', () => ({
  useNameFormatter: () => (name: string) => name
}));

const mockUseData = useData as jest.MockedFunction<typeof useData>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockReviewService = ReviewService as jest.Mocked<typeof ReviewService>;
const mockFileUploadService = FileUploadService as jest.Mocked<typeof FileUploadService>;

// Mock data
const mockKpis = [
  {
    id: 'kpi-1',
    title: 'Patient Satisfaction',
    description: 'Maintain high patient satisfaction scores',
    weight: 20,
    floor: 85,
    active: true
  },
  {
    id: 'kpi-2',
    title: 'Clinical Documentation',
    description: 'Complete documentation within required timeframes',
    weight: 15,
    floor: 95,
    active: true
  }
];

const mockProfiles = [
  {
    id: 'clinician-1',
    name: 'Dr. Jane Smith',
    username: 'jane.smith',
    role: 'clinician',
    accept: true
  },
  {
    id: 'director-1',
    name: 'Dr. John Director',
    username: 'john.director',
    role: 'director',
    accept: true
  }
];

const mockDirectorUser = {
  id: 'director-1',
  role: 'director',
  name: 'Dr. John Director'
};

const mockClinicianUser = {
  id: 'clinician-1',
  role: 'clinician',
  name: 'Dr. Jane Smith'
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('MonthlyReview - Director Review File Upload Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseData.mockReturnValue({
      profiles: mockProfiles,
      kpis: mockKpis,
      loading: false,
      error: null
    } as any);

    mockReviewService.getReviewsByPeriod.mockResolvedValue([]);
    mockReviewService.getClinicianReviews.mockResolvedValue([]);
  });

  describe('When director leaves a review for a clinician', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockDirectorUser,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      // Mock URL params for reviewing another clinician
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/review/clinician-1'
        },
        writable: true
      });
    });

    test('File upload input is visible when KPI is marked as not met', async () => {
      renderWithRouter(<MonthlyReview />);

      await waitFor(() => {
        expect(screen.getByText('Patient Satisfaction')).toBeInTheDocument();
      });

      // Mark KPI as not met
      const notMetButton = screen.getByRole('button', { name: /not met/i });
      fireEvent.click(notMetButton);

      // File upload should be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/supporting files/i)).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/supporting files/i);
      expect(fileInput).toBeEnabled();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('multiple');
      expect(fileInput).toHaveAttribute('accept', '.pdf,.png,.jpg,.jpeg,.doc,.docx,.txt');
    });

    test('File upload input is not visible when KPI is marked as met', async () => {
      renderWithRouter(<MonthlyReview />);

      await waitFor(() => {
        expect(screen.getByText('Patient Satisfaction')).toBeInTheDocument();
      });

      // Mark KPI as met
      const metButton = screen.getByRole('button', { name: /met.*exceeded/i });
      fireEvent.click(metButton);

      // File upload should not be visible
      expect(screen.queryByLabelText(/supporting files/i)).not.toBeInTheDocument();
    });

    test('File upload works correctly for not met KPIs', async () => {
      const mockFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });
      const mockUploadedFile = {
        url: 'https://example.com/uploaded-file.pdf',
        name: 'test-document.pdf',
        size: 1000
      };

      mockFileUploadService.uploadFiles.mockResolvedValue([mockUploadedFile]);
      mockFileUploadService.getFileInfoFromUrl.mockReturnValue({ name: 'test-document.pdf', size: 1000 });

      renderWithRouter(<MonthlyReview />);

      await waitFor(() => {
        expect(screen.getByText('Patient Satisfaction')).toBeInTheDocument();
      });

      // Mark KPI as not met
      const notMetButton = screen.getByRole('button', { name: /not met/i });
      fireEvent.click(notMetButton);

      // Upload file
      const fileInput = screen.getByLabelText(/supporting files/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // Verify upload service was called
      await waitFor(() => {
        expect(mockFileUploadService.uploadFiles).toHaveBeenCalledWith(
          [mockFile],
          'clinician-1',
          'kpi-1'
        );
      });

      // Check that uploaded file is displayed
      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      });
    });

    test('Shows file upload instructions for director reviewing clinician', async () => {
      renderWithRouter(<MonthlyReview />);

      await waitFor(() => {
        expect(screen.getByText('Patient Satisfaction')).toBeInTheDocument();
      });

      // Mark KPI as not met
      const notMetButton = screen.getByRole('button', { name: /not met/i });
      fireEvent.click(notMetButton);

      // Check file upload instructions
      await waitFor(() => {
        expect(screen.getByText(/upload pdfs, screenshots, or other supporting documents/i)).toBeInTheDocument();
        expect(screen.getByText(/max 10mb per file/i)).toBeInTheDocument();
      });
    });

    test('Can remove uploaded files during review', async () => {
      const mockFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });
      const mockUploadedFile = {
        url: 'https://example.com/uploaded-file.pdf',
        name: 'test-document.pdf',
        size: 1000
      };

      mockFileUploadService.uploadFiles.mockResolvedValue([mockUploadedFile]);
      mockFileUploadService.deleteFile.mockResolvedValue();

      renderWithRouter(<MonthlyReview />);

      await waitFor(() => {
        expect(screen.getByText('Patient Satisfaction')).toBeInTheDocument();
      });

      // Mark KPI as not met and upload file
      const notMetButton = screen.getByRole('button', { name: /not met/i });
      fireEvent.click(notMetButton);

      const fileInput = screen.getByLabelText(/supporting files/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // Wait for file to be uploaded and displayed
      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      });

      // Remove the file
      const removeButton = screen.getByRole('button', { name: /remove file/i });
      fireEvent.click(removeButton);

      // Verify delete service was called
      await waitFor(() => {
        expect(mockFileUploadService.deleteFile).toHaveBeenCalledWith(
          'https://example.com/uploaded-file.pdf'
        );
      });
    });

    test('Displays existing files from previous reviews', async () => {
      const existingReview = {
        id: 'review-1',
        kpi: 'kpi-1',
        clinician: 'clinician-1',
        director: 'director-1',
        met_check: false,
        notes: 'Needs improvement',
        plan: 'Follow up next month',
        score: 0,
        date: '2024-01-15T10:00:00Z',
        file_url: 'https://example.com/existing-file.pdf'
      };

      mockReviewService.getReviewsByPeriod.mockResolvedValue([existingReview]);
      mockFileUploadService.getFileInfoFromUrl.mockReturnValue({ name: 'existing-file.pdf', size: 2000 });

      renderWithRouter(<MonthlyReview />);

      // Wait for existing review to load
      await waitFor(() => {
        expect(screen.getByText('existing-file.pdf')).toBeInTheDocument();
        expect(screen.getByText('Existing')).toBeInTheDocument();
      });

      // Verify the existing file has view and remove buttons
      expect(screen.getByRole('button', { name: /view file/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument();
    });
  });

  describe('When clinician views their own reviews (My Reviews mode)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockClinicianUser,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      // Mock My Reviews mode
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/my-reviews'
        },
        writable: true
      });
    });

    test('File upload input is disabled in My Reviews mode', async () => {
      const existingReview = {
        id: 'review-1',
        kpi: 'kpi-1',
        clinician: 'clinician-1',
        director: 'director-1',
        met_check: false,
        notes: 'Needs improvement',
        plan: 'Follow up next month',
        score: 0,
        date: '2024-01-15T10:00:00Z',
        file_url: null
      };

      mockReviewService.getReviewsByPeriod.mockResolvedValue([existingReview]);

      renderWithRouter(<MonthlyReview />);

      await waitFor(() => {
        expect(screen.getByText('Patient Satisfaction')).toBeInTheDocument();
      });

      // File upload should be visible but disabled
      const fileInput = screen.getByLabelText(/your supporting files/i);
      expect(fileInput).toBeDisabled();
      expect(fileInput).toHaveClass('cursor-not-allowed');
    });

    test('Shows different file upload instructions for clinicians', async () => {
      const existingReview = {
        id: 'review-1',
        kpi: 'kpi-1',
        clinician: 'clinician-1',
        director: 'director-1',
        met_check: false,
        notes: 'Needs improvement',
        plan: 'Follow up next month',
        score: 0,
        date: '2024-01-15T10:00:00Z',
        file_url: null
      };

      mockReviewService.getReviewsByPeriod.mockResolvedValue([existingReview]);

      renderWithRouter(<MonthlyReview />);

      await waitFor(() => {
        expect(screen.getByText(/upload your supporting documents, evidence, or explanations/i)).toBeInTheDocument();
      });
    });

    test('Clinician can view but not remove uploaded files', async () => {
      const existingReview = {
        id: 'review-1',
        kpi: 'kpi-1',
        clinician: 'clinician-1',
        director: 'director-1',
        met_check: false,
        notes: 'Needs improvement',
        plan: 'Follow up next month',
        score: 0,
        date: '2024-01-15T10:00:00Z',
        file_url: 'https://example.com/review-file.pdf'
      };

      mockReviewService.getReviewsByPeriod.mockResolvedValue([existingReview]);
      mockFileUploadService.getFileInfoFromUrl.mockReturnValue({ name: 'review-file.pdf', size: 1500 });

      renderWithRouter(<MonthlyReview />);

      await waitFor(() => {
        expect(screen.getByText('review-file.pdf')).toBeInTheDocument();
      });

      // Should have view button but not remove button in My Reviews mode
      expect(screen.getByRole('button', { name: /view file/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /remove file/i })).not.toBeInTheDocument();
    });
  });

  describe('File upload error handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockDirectorUser,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });

      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/review/clinician-1'
        },
        writable: true
      });
    });

    test('Handles file upload errors gracefully', async () => {
      const mockFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });
      
      mockFileUploadService.uploadFiles.mockRejectedValue(new Error('Upload failed'));

      renderWithRouter(<MonthlyReview />);

      await waitFor(() => {
        expect(screen.getByText('Patient Satisfaction')).toBeInTheDocument();
      });

      // Mark KPI as not met
      const notMetButton = screen.getByRole('button', { name: /not met/i });
      fireEvent.click(notMetButton);

      // Try to upload file
      const fileInput = screen.getByLabelText(/supporting files/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      });
    });

    test('Shows upload progress during file upload', async () => {
      const mockFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });
      
      // Mock a delayed upload
      mockFileUploadService.uploadFiles.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      renderWithRouter(<MonthlyReview />);

      await waitFor(() => {
        expect(screen.getByText('Patient Satisfaction')).toBeInTheDocument();
      });

      // Mark KPI as not met
      const notMetButton = screen.getByRole('button', { name: /not met/i });
      fireEvent.click(notMetButton);

      // Upload file
      const fileInput = screen.getByLabelText(/supporting files/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // Check upload progress
      expect(screen.getByText(/uploading files/i)).toBeInTheDocument();
      expect(fileInput).toBeDisabled();
    });
  });
});
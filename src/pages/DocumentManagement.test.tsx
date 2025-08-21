import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentManagement from './DocumentManagement';
import { DocumentService, DocumentMetadata } from '../services/documentService';

// Mock the DocumentService
jest.mock('../services/documentService');
const mockDocumentService = DocumentService as jest.Mocked<typeof DocumentService>;

// Mock data
const mockDirectors = [
  { id: 'director-1', name: 'Dr. John Director' },
  { id: 'director-2', name: 'Dr. Sarah Manager' }
];

const mockDocuments: DocumentMetadata[] = [
  {
    id: 'doc-1',
    date: '2024-01-15T10:00:00Z',
    file_url: 'https://example.com/document1.pdf',
    file_name: 'Monthly Report January.pdf',
    director: 'director-1',
    director_profile: {
      id: 'director-1',
      name: 'Dr. John Director',
      username: 'john.director'
    }
  },
  {
    id: 'doc-2',
    date: '2024-02-15T10:00:00Z',
    file_url: 'https://example.com/document2.pdf',
    file_name: 'February Summary.pdf',
    director: 'director-2',
    director_profile: {
      id: 'director-2',
      name: 'Dr. Sarah Manager',
      username: 'sarah.manager'
    }
  }
];

describe('DocumentManagement - Admin Document Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDocumentService.getDirectors.mockResolvedValue(mockDirectors);
    mockDocumentService.getDocumentsByMonth.mockResolvedValue(mockDocuments);
    mockDocumentService.getDocumentsByMonthAndDirector.mockResolvedValue([mockDocuments[0]]);
  });

  test('Renders document management interface', async () => {
    render(<DocumentManagement />);

    expect(screen.getByText(/document management/i)).toBeInTheDocument();
    expect(screen.getByText(/upload new document/i)).toBeInTheDocument();
    
    // Wait for directors to load
    await waitFor(() => {
      expect(mockDocumentService.getDirectors).toHaveBeenCalled();
    });
  });

  test('Displays list of documents with director information', async () => {
    render(<DocumentManagement />);

    await waitFor(() => {
      expect(screen.getByText('Monthly Report January.pdf')).toBeInTheDocument();
      expect(screen.getByText('February Summary.pdf')).toBeInTheDocument();
      expect(screen.getByText('Dr. John Director')).toBeInTheDocument();
      expect(screen.getByText('Dr. Sarah Manager')).toBeInTheDocument();
    });
  });

  test('Allows filtering documents by director', async () => {
    render(<DocumentManagement />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('All Directors')).toBeInTheDocument();
    });

    // Select a specific director
    const directorSelect = screen.getByDisplayValue('All Directors');
    fireEvent.change(directorSelect, { target: { value: 'director-1' } });

    await waitFor(() => {
      expect(mockDocumentService.getDocumentsByMonthAndDirector).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'director-1'
      );
    });
  });

  test('Allows filtering documents by month and year', async () => {
    render(<DocumentManagement />);

    // Change month filter
    const monthSelect = screen.getByDisplayValue(/january/i);
    fireEvent.change(monthSelect, { target: { value: '2' } });

    // Change year filter
    const yearSelect = screen.getByDisplayValue(/2024/);
    fireEvent.change(yearSelect, { target: { value: '2023' } });

    await waitFor(() => {
      expect(mockDocumentService.getDocumentsByMonth).toHaveBeenCalledWith(2, 2023);
    });
  });

  test('Handles document upload for directors', async () => {
    const mockFile = new File(['test content'], 'new-document.pdf', { type: 'application/pdf' });
    mockDocumentService.uploadDocument.mockResolvedValue();

    render(<DocumentManagement />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /director/i })).toBeInTheDocument();
    });

    // Select director for upload
    const directorSelect = screen.getByRole('combobox', { name: /director/i });
    fireEvent.change(directorSelect, { target: { value: 'director-1' } });

    // Select file
    const fileInput = screen.getByRole('textbox', { name: /choose file/i }) || 
                      screen.getByLabelText(/file/i);
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    }

    // Upload document
    const uploadButton = screen.getByRole('button', { name: /upload document/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(mockDocumentService.uploadDocument).toHaveBeenCalledWith(
        mockFile,
        'director-1',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  test('Shows success message after successful document upload', async () => {
    const mockFile = new File(['test content'], 'success-document.pdf', { type: 'application/pdf' });
    mockDocumentService.uploadDocument.mockResolvedValue();

    render(<DocumentManagement />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /director/i })).toBeInTheDocument();
    });

    // Perform upload
    const directorSelect = screen.getByRole('combobox', { name: /director/i });
    fireEvent.change(directorSelect, { target: { value: 'director-1' } });

    const uploadButton = screen.getByRole('button', { name: /upload document/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/document uploaded successfully/i)).toBeInTheDocument();
    });
  });

  test('Shows error message when upload fails', async () => {
    const mockFile = new File(['test content'], 'error-document.pdf', { type: 'application/pdf' });
    mockDocumentService.uploadDocument.mockRejectedValue(new Error('Upload failed'));

    render(<DocumentManagement />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /director/i })).toBeInTheDocument();
    });

    // Perform upload that will fail
    const directorSelect = screen.getByRole('combobox', { name: /director/i });
    fireEvent.change(directorSelect, { target: { value: 'director-1' } });

    const uploadButton = screen.getByRole('button', { name: /upload document/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  test('Allows editing document names', async () => {
    mockDocumentService.updateDocumentName.mockResolvedValue();

    render(<DocumentManagement />);

    await waitFor(() => {
      expect(screen.getByText('Monthly Report January.pdf')).toBeInTheDocument();
    });

    // Click edit button for first document
    const editButtons = screen.getAllByLabelText(/edit/i);
    fireEvent.click(editButtons[0]);

    // Should show input field for editing
    const nameInput = screen.getByDisplayValue('Monthly Report January.pdf');
    expect(nameInput).toBeInTheDocument();

    // Change name
    fireEvent.change(nameInput, { target: { value: 'Updated Report January.pdf' } });

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDocumentService.updateDocumentName).toHaveBeenCalledWith(
        'doc-1',
        'Updated Report January.pdf'
      );
    });
  });

  test('Allows deleting documents', async () => {
    mockDocumentService.deleteDocument.mockResolvedValue();
    window.confirm = jest.fn().mockReturnValue(true);

    render(<DocumentManagement />);

    await waitFor(() => {
      expect(screen.getByText('Monthly Report January.pdf')).toBeInTheDocument();
    });

    // Click delete button for first document
    const deleteButtons = screen.getAllByLabelText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete "Monthly Report January.pdf"? This action cannot be undone.'
    );

    await waitFor(() => {
      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith('doc-1');
    });
  });

  test('Allows downloading documents', async () => {
    mockDocumentService.getDownloadUrl.mockReturnValue('https://example.com/download/document1.pdf');
    window.open = jest.fn();

    render(<DocumentManagement />);

    await waitFor(() => {
      expect(screen.getByText('Monthly Report January.pdf')).toBeInTheDocument();
    });

    // Click download button for first document
    const downloadButtons = screen.getAllByLabelText(/download/i);
    fireEvent.click(downloadButtons[0]);

    expect(mockDocumentService.getDownloadUrl).toHaveBeenCalledWith(
      'https://example.com/document1.pdf'
    );
    expect(window.open).toHaveBeenCalledWith(
      'https://example.com/download/document1.pdf',
      '_blank'
    );
  });

  test('Shows loading state while fetching documents', async () => {
    // Mock delayed response
    mockDocumentService.getDocumentsByMonth.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(mockDocuments), 100))
    );

    render(<DocumentManagement />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Monthly Report January.pdf')).toBeInTheDocument();
    });
  });

  test('Shows empty state when no documents exist', async () => {
    mockDocumentService.getDocumentsByMonth.mockResolvedValue([]);

    render(<DocumentManagement />);

    await waitFor(() => {
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument();
    });
  });

  test('Validates required fields before upload', async () => {
    render(<DocumentManagement />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
    });

    // Try to upload without selecting director or file
    const uploadButton = screen.getByRole('button', { name: /upload document/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/please select a file and director/i)).toBeInTheDocument();
    });

    expect(mockDocumentService.uploadDocument).not.toHaveBeenCalled();
  });
});
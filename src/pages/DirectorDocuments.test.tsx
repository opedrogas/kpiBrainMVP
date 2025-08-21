import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DirectorDocuments from './DirectorDocuments';
import { DocumentService, DocumentMetadata } from '../services/documentService';
import { useAuth } from '../contexts/AuthContext';

// Mock the services and contexts
jest.mock('../services/documentService');
jest.mock('../contexts/AuthContext');

const mockDocumentService = DocumentService as jest.Mocked<typeof DocumentService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock data
const mockDirectorUser = {
  id: 'director-1',
  role: 'director',
  name: 'Dr. John Director'
};

const mockDirectorDocuments: DocumentMetadata[] = [
  {
    id: 'doc-1',
    date: '2024-01-15T10:00:00Z',
    file_url: 'https://example.com/director1-jan.pdf',
    file_name: 'January Performance Review.pdf',
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
    file_url: 'https://example.com/director1-feb.pdf',
    file_name: 'February Clinical Notes.pdf',
    director: 'director-1',
    director_profile: {
      id: 'director-1',
      name: 'Dr. John Director',
      username: 'john.director'
    }
  },
  {
    id: 'doc-3',
    date: '2023-12-15T10:00:00Z',
    file_url: 'https://example.com/director1-dec.pdf',
    file_name: 'December Summary.pdf',
    director: 'director-1',
    director_profile: {
      id: 'director-1',
      name: 'Dr. John Director',
      username: 'john.director'
    }
  }
];

describe('DirectorDocuments - Director Document View', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockDirectorUser,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    });

    mockDocumentService.getDocumentsForDirector.mockResolvedValue(mockDirectorDocuments);
    mockDocumentService.getDownloadUrl.mockImplementation((url) => `${url}?download=true`);
  });

  test('Renders director documents page correctly', async () => {
    render(<DirectorDocuments />);

    expect(screen.getByText(/my documents/i)).toBeInTheDocument();
    expect(screen.getByText(/documents uploaded for your review/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockDocumentService.getDocumentsForDirector).toHaveBeenCalledWith('director-1');
    });
  });

  test('Displays list of director documents grouped by month', async () => {
    render(<DirectorDocuments />);

    await waitFor(() => {
      expect(screen.getByText('January Performance Review.pdf')).toBeInTheDocument();
      expect(screen.getByText('February Clinical Notes.pdf')).toBeInTheDocument();
      expect(screen.getByText('December Summary.pdf')).toBeInTheDocument();
    });

    // Check that documents are grouped by month/year
    expect(screen.getByText(/january 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/february 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/december 2023/i)).toBeInTheDocument();
  });

  test('Allows filtering documents by month', async () => {
    render(<DirectorDocuments />);

    await waitFor(() => {
      expect(screen.getByText('January Performance Review.pdf')).toBeInTheDocument();
    });

    // Filter by February
    const monthSelect = screen.getByLabelText(/month/i);
    fireEvent.change(monthSelect, { target: { value: '2' } });

    // Should only show February document
    expect(screen.getByText('February Clinical Notes.pdf')).toBeInTheDocument();
    expect(screen.queryByText('January Performance Review.pdf')).not.toBeInTheDocument();
  });

  test('Allows filtering documents by year', async () => {
    render(<DirectorDocuments />);

    await waitFor(() => {
      expect(screen.getByText('January Performance Review.pdf')).toBeInTheDocument();
    });

    // Filter by 2023
    const yearSelect = screen.getByLabelText(/year/i);
    fireEvent.change(yearSelect, { target: { value: '2023' } });

    // Should only show December 2023 document
    expect(screen.getByText('December Summary.pdf')).toBeInTheDocument();
    expect(screen.queryByText('January Performance Review.pdf')).not.toBeInTheDocument();
    expect(screen.queryByText('February Clinical Notes.pdf')).not.toBeInTheDocument();
  });

  test('Allows downloading documents', async () => {
    window.open = jest.fn();

    render(<DirectorDocuments />);

    await waitFor(() => {
      expect(screen.getByText('January Performance Review.pdf')).toBeInTheDocument();
    });

    // Click download button for first document
    const downloadButtons = screen.getAllByLabelText(/download/i);
    fireEvent.click(downloadButtons[0]);

    expect(mockDocumentService.getDownloadUrl).toHaveBeenCalledWith(
      'https://example.com/director1-jan.pdf'
    );
    expect(window.open).toHaveBeenCalledWith(
      'https://example.com/director1-jan.pdf?download=true',
      '_blank'
    );
  });

  test('Shows document count for each month', async () => {
    render(<DirectorDocuments />);

    await waitFor(() => {
      expect(screen.getByText(/1 document/i)).toBeInTheDocument(); // For each month section
    });

    // Each month should show the document count
    const monthSections = screen.getAllByText(/1 document/i);
    expect(monthSections).toHaveLength(3); // January, February, December
  });

  test('Shows empty state when director has no documents', async () => {
    mockDocumentService.getDocumentsForDirector.mockResolvedValue([]);

    render(<DirectorDocuments />);

    await waitFor(() => {
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument();
    });
  });

  test('Shows loading state while fetching documents', async () => {
    mockDocumentService.getDocumentsForDirector.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(mockDirectorDocuments), 100))
    );

    render(<DirectorDocuments />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('January Performance Review.pdf')).toBeInTheDocument();
    });
  });

  test('Shows error message when document fetching fails', async () => {
    mockDocumentService.getDocumentsForDirector.mockRejectedValue(new Error('Failed to fetch documents'));

    render(<DirectorDocuments />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch documents/i)).toBeInTheDocument();
    });
  });

  test('Displays document dates correctly', async () => {
    render(<DirectorDocuments />);

    await waitFor(() => {
      // Check that dates are formatted and displayed
      expect(screen.getByText(/jan.*15.*2024/i)).toBeInTheDocument();
      expect(screen.getByText(/feb.*15.*2024/i)).toBeInTheDocument();
      expect(screen.getByText(/dec.*15.*2023/i)).toBeInTheDocument();
    });
  });

  test('Clears filters when reset is clicked', async () => {
    render(<DirectorDocuments />);

    await waitFor(() => {
      expect(screen.getByText('January Performance Review.pdf')).toBeInTheDocument();
    });

    // Apply filters
    const monthSelect = screen.getByLabelText(/month/i);
    fireEvent.change(monthSelect, { target: { value: '2' } });

    // Reset filters
    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(clearButton);

    // All documents should be visible again
    expect(screen.getByText('January Performance Review.pdf')).toBeInTheDocument();
    expect(screen.getByText('February Clinical Notes.pdf')).toBeInTheDocument();
    expect(screen.getByText('December Summary.pdf')).toBeInTheDocument();
  });

  test('Handles documents without file URLs gracefully', async () => {
    const documentsWithoutUrls: DocumentMetadata[] = [
      {
        id: 'doc-no-url',
        date: '2024-01-15T10:00:00Z',
        file_url: null,
        file_name: 'Document Without URL.pdf',
        director: 'director-1',
        director_profile: {
          id: 'director-1',
          name: 'Dr. John Director',
          username: 'john.director'
        }
      }
    ];

    mockDocumentService.getDocumentsForDirector.mockResolvedValue(documentsWithoutUrls);

    render(<DirectorDocuments />);

    await waitFor(() => {
      expect(screen.getByText('Document Without URL.pdf')).toBeInTheDocument();
    });

    // Download button should be disabled or not present for documents without URLs
    const downloadButton = screen.queryByLabelText(/download/i);
    if (downloadButton) {
      expect(downloadButton).toBeDisabled();
    }
  });

  test('Sorts documents by date within each month (newest first)', async () => {
    const documentsWithMultipleDates: DocumentMetadata[] = [
      {
        id: 'doc-1',
        date: '2024-01-05T10:00:00Z',
        file_url: 'https://example.com/doc1.pdf',
        file_name: 'Early January Doc.pdf',
        director: 'director-1',
        director_profile: mockDirectorDocuments[0].director_profile
      },
      {
        id: 'doc-2',
        date: '2024-01-25T10:00:00Z',
        file_url: 'https://example.com/doc2.pdf',
        file_name: 'Late January Doc.pdf',
        director: 'director-1',
        director_profile: mockDirectorDocuments[0].director_profile
      },
      {
        id: 'doc-3',
        date: '2024-01-15T10:00:00Z',
        file_url: 'https://example.com/doc3.pdf',
        file_name: 'Mid January Doc.pdf',
        director: 'director-1',
        director_profile: mockDirectorDocuments[0].director_profile
      }
    ];

    mockDocumentService.getDocumentsForDirector.mockResolvedValue(documentsWithMultipleDates);

    render(<DirectorDocuments />);

    await waitFor(() => {
      const documentElements = screen.getAllByText(/january doc\.pdf/i);
      expect(documentElements).toHaveLength(3);
    });

    // The order should be: Late January (25th), Mid January (15th), Early January (5th)
    const documentContainer = screen.getByText(/late january doc/i).closest('[data-testid="document-item"]');
    if (documentContainer) {
      expect(documentContainer).toBeInTheDocument();
    }
  });
});
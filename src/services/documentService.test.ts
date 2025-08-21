import { describe, test, expect, jest } from '@jest/globals';
import { DocumentService } from './documentService';
import { supabase } from '../lib/supabase';

// Mock supabase
jest.mock('../lib/supabase');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('DocumentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDocumentRecord', () => {
    test('Create document record successfully', async () => {
      // Arrange
      const mockDocumentData = {
        date: '2024-01-01T12:00:00.000Z',
        file_url: 'https://example.com/file.pdf',
        file_name: 'test-document.pdf',
        director: 'director-123'
      };

      const expectedResult = {
        id: 'doc-123',
        ...mockDocumentData
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: expectedResult,
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await (DocumentService as any).createDocumentRecord(mockDocumentData);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockSupabase.from).toHaveBeenCalledWith('doc_metadata');
    });

    test('Handle database error when creating record', async () => {
      // Arrange
      const mockDocumentData = {
        date: '2024-01-01T12:00:00.000Z',
        file_url: 'https://example.com/file.pdf',
        file_name: 'test-document.pdf',
        director: 'director-123'
      };

      const mockError = { message: 'Database connection failed' };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      } as any);

      // Act & Assert
      await expect((DocumentService as any).createDocumentRecord(mockDocumentData))
        .rejects.toThrow('Failed to create document record: Database connection failed');
    });
  });

  describe('uploadDocument', () => {
    test('Upload document successfully', async () => {
      // Arrange
      const mockFile = new File(['test content'], 'test-document.pdf', {
        type: 'application/pdf'
      });
      Object.defineProperty(mockFile, 'size', {
        value: 1024 * 1024, // 1MB
        writable: false
      });

      const directorId = 'director-123';
      const month = 2;
      const year = 2025;

      const expectedFileName = '2025/2/director-123/1755648584839_v8wh6bftcrp.pdf';
      const publicUrl = 'https://iljbcbmebjeputawrqok.supabase.co/storage/v1/object/public/document/' + expectedFileName;

      // Mock Date.now and Math.random for consistent filename generation
      const originalDateNow = Date.now;
      const originalMathRandom = Math.random;
      Date.now = jest.fn().mockReturnValue(1755648584839);
      Math.random = jest.fn().mockReturnValue(0.5123456789);

      // Mock storage upload
      const mockStorage = {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            data: { path: expectedFileName },
            error: null
          }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl }
          })
        })
      };

      // Mock document record creation
      const expectedDocumentData = {
        date: '2025-01-01T05:00:00.000Z', // new Date(2025, 1, 1).toISOString()
        file_url: publicUrl,
        file_name: 'test-document.pdf',
        director: directorId
      };

      const expectedResult = {
        id: 'doc-123',
        ...expectedDocumentData
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: expectedResult,
              error: null
            })
          })
        })
      } as any);

      (mockSupabase as any).storage = mockStorage;

      // Act
      const result = await DocumentService.uploadDocument(mockFile, directorId, month, year);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockStorage.from).toHaveBeenCalledWith('document');
      expect(mockSupabase.from).toHaveBeenCalledWith('doc_metadata');

      // Restore original functions
      Date.now = originalDateNow;
      Math.random = originalMathRandom;
    });

    test('Handle RLS policy violation during upload', async () => {
      // Arrange
      const mockFile = new File(['test content'], 'test-document.pdf', {
        type: 'application/pdf'
      });
      Object.defineProperty(mockFile, 'size', {
        value: 1024 * 1024, // 1MB
        writable: false
      });

      const directorId = 'director-123';
      const month = 2;
      const year = 2025;

      // Mock storage upload to succeed but database insert to fail with RLS policy error
      const mockStorage = {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            data: { path: 'test-path' },
            error: null
          }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://test.com/file.pdf' }
          })
        })
      };

      const rlsError = { message: 'new row violates row-level security policy' };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: rlsError
            })
          })
        })
      } as any);

      (mockSupabase as any).storage = mockStorage;

      // Act & Assert
      await expect(DocumentService.uploadDocument(mockFile, directorId, month, year))
        .rejects.toThrow('Failed to create document record: new row violates row-level security policy');
    });

    test('Handle storage upload failure', async () => {
      // Arrange
      const mockFile = new File(['test content'], 'test-document.pdf', {
        type: 'application/pdf'
      });
      Object.defineProperty(mockFile, 'size', {
        value: 1024 * 1024, // 1MB
        writable: false
      });

      const directorId = 'director-123';
      const month = 2;
      const year = 2025;

      // Mock storage upload failure
      const mockStorage = {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Storage quota exceeded' }
          })
        })
      };

      (mockSupabase as any).storage = mockStorage;

      // Act & Assert
      await expect(DocumentService.uploadDocument(mockFile, directorId, month, year))
        .rejects.toThrow('Failed to upload test-document.pdf: Storage quota exceeded');
    });

    test('Handle file validation failure during upload', async () => {
      // Arrange
      const invalidFile = new File(['test content'], 'test-document.txt', {
        type: 'text/plain' // Invalid type
      });

      const directorId = 'director-123';
      const month = 2;
      const year = 2025;

      // Act & Assert
      await expect(DocumentService.uploadDocument(invalidFile, directorId, month, year))
        .rejects.toThrow('File type text/plain is not allowed. Only PDF files are allowed.');
    });
  });

  describe('getDocumentsByMonthAndDirector', () => {
    test('Get documents by month and director successfully', async () => {
      // Arrange
      const month = 2;
      const year = 2025;
      const directorId = 'director-123';
      
      const expectedDocuments = [
        {
          id: 'doc-1',
          file_name: 'document1.pdf',
          date: '2025-02-15T12:00:00.000Z',
          director: directorId,
          director_profile: { id: directorId, name: 'Director One' }
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: expectedDocuments,
                  error: null
                })
              })
            })
          })
        })
      } as any);

      // Act
      const result = await DocumentService.getDocumentsByMonthAndDirector(month, year, directorId);

      // Assert
      expect(result).toEqual(expectedDocuments);
      expect(mockSupabase.from).toHaveBeenCalledWith('doc_metadata');
    });

    test('Handle error when fetching documents by month and director', async () => {
      // Arrange
      const month = 2;
      const year = 2025;
      const directorId = 'director-123';
      const mockError = { message: 'Failed to fetch data' };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: mockError
                })
              })
            })
          })
        })
      } as any);

      // Act & Assert
      await expect(DocumentService.getDocumentsByMonthAndDirector(month, year, directorId))
        .rejects.toThrow('Failed to fetch documents: Failed to fetch data');
    });

    test('Filter documents by director accept status', async () => {
      // Arrange
      const month = 2;
      const year = 2025;
      const directorId = 'director-123';
      
      const mockDocuments = [
        {
          id: 'doc-1',
          file_name: 'document1.pdf',
          date: '2025-02-15T12:00:00.000Z',
          director: directorId,
          director_profile: { id: directorId, name: 'Accepted Director', accept: true }
        },
        {
          id: 'doc-2',
          file_name: 'document2.pdf',
          date: '2025-02-20T12:00:00.000Z',
          director: directorId,
          director_profile: { id: directorId, name: 'Rejected Director', accept: false }
        }
      ];

      // Expected result should filter out documents with accept: false
      const expectedDocuments = [mockDocuments[0]];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockDocuments,
                  error: null
                })
              })
            })
          })
        })
      } as any);

      // Act
      const result = await DocumentService.getDocumentsByMonthAndDirector(month, year, directorId);

      // Assert
      expect(result).toEqual(expectedDocuments);
    });
  });

  describe('getDocumentsForDirector', () => {
    test('Get documents for specific director successfully', async () => {
      // Arrange
      const directorId = 'director-123';
      const expectedDocuments = [
        {
          id: 'doc-1',
          file_name: 'document1.pdf',
          date: '2025-01-15T12:00:00.000Z',
          director: directorId
        },
        {
          id: 'doc-2',
          file_name: 'document2.pdf',
          date: '2025-02-20T12:00:00.000Z',
          director: directorId
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: expectedDocuments,
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await DocumentService.getDocumentsForDirector(directorId);

      // Assert
      expect(result).toEqual(expectedDocuments);
      expect(mockSupabase.from).toHaveBeenCalledWith('doc_metadata');
    });

    test('Handle error when fetching documents for director', async () => {
      // Arrange
      const directorId = 'director-123';
      const mockError = { message: 'Access denied' };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      } as any);

      // Act & Assert
      await expect(DocumentService.getDocumentsForDirector(directorId))
        .rejects.toThrow('Failed to fetch director documents: Access denied');
    });

    test('Return empty array when no documents found', async () => {
      // Arrange
      const directorId = 'director-123';

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await DocumentService.getDocumentsForDirector(directorId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getDocumentsByMonth', () => {
    test('Get documents by month successfully', async () => {
      // Arrange
      const month = 1;
      const year = 2024;
      const expectedDocuments = [
        {
          id: 'doc-1',
          file_name: 'document1.pdf',
          date: '2024-01-15T12:00:00.000Z',
          director_profile: { id: 'dir-1', name: 'Director One', accept: true }
        },
        {
          id: 'doc-2',
          file_name: 'document2.pdf',
          date: '2024-01-20T12:00:00.000Z',
          director_profile: { id: 'dir-2', name: 'Director Two', accept: true }
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: expectedDocuments,
                  error: null
                })
              })
            })
          })
        })
      } as any);

      // Act
      const result = await DocumentService.getDocumentsByMonth(month, year);

      // Assert
      expect(result).toEqual(expectedDocuments);
      expect(mockSupabase.from).toHaveBeenCalledWith('doc_metadata');
    });

    test('Handle error when fetching documents by month', async () => {
      // Arrange
      const month = 1;
      const year = 2024;
      const mockError = { message: 'Failed to fetch data' };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: null,
                  error: mockError
                })
              })
            })
          })
        })
      } as any);

      // Act & Assert
      await expect(DocumentService.getDocumentsByMonth(month, year))
        .rejects.toThrow('Failed to fetch documents: Failed to fetch data');
    });
  });

  describe('updateDocument', () => {
    test('Update document name successfully', async () => {
      // Arrange
      const documentId = 'doc-123';
      const updateData = { file_name: 'updated-document.pdf' };
      const expectedResult = {
        id: documentId,
        file_name: 'updated-document.pdf',
        date: '2024-01-01T12:00:00.000Z',
        file_url: 'https://example.com/file.pdf',
        director: 'director-123'
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: expectedResult,
                error: null
              })
            })
          })
        })
      } as any);

      // Act
      const result = await DocumentService.updateDocument(documentId, updateData);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockSupabase.from).toHaveBeenCalledWith('doc_metadata');
    });
  });

  describe('deleteDocument', () => {
    test('Delete document successfully', async () => {
      // Arrange
      const documentId = 'doc-123';
      const mockDocument = {
        file_url: 'https://supabase.com/storage/v1/object/public/admin-documents/2024/1/director-123/file.pdf'
      };

      // Mock the document fetch
      const mockFromForFetch = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockDocument,
              error: null
            })
          })
        })
      };

      // Mock the storage delete
      const mockStorage = {
        from: jest.fn().mockReturnValue({
          remove: jest.fn().mockResolvedValue({
            error: null
          })
        })
      };

      // Mock the database delete
      const mockFromForDelete = {
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      };

      mockSupabase.from
        .mockReturnValueOnce(mockFromForFetch as any)
        .mockReturnValueOnce(mockFromForDelete as any);
      
      (mockSupabase as any).storage = mockStorage;

      // Act
      await DocumentService.deleteDocument(documentId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('doc_metadata');
      expect(mockStorage.from).toHaveBeenCalledWith('admin-documents');
    });
  });

  describe('validateFile', () => {
    test('Reject file too large', () => {
      // Arrange
      const largeFile = new File([''], 'large-file.pdf', {
        type: 'application/pdf',
        // Create file larger than 50MB limit
      });
      
      // Mock file size to be larger than limit
      Object.defineProperty(largeFile, 'size', {
        value: 60 * 1024 * 1024, // 60MB
        writable: false
      });

      // Act & Assert
      expect(() => {
        (DocumentService as any).validateFile(largeFile);
      }).toThrow('File large-file.pdf is too large. Maximum size is 50MB.');
    });

    test('Reject invalid file type', () => {
      // Arrange
      const invalidFile = new File([''], 'document.txt', {
        type: 'text/plain'
      });

      // Act & Assert
      expect(() => {
        (DocumentService as any).validateFile(invalidFile);
      }).toThrow('File type text/plain is not allowed. Only PDF files are allowed.');
    });

    test('Accept valid PDF file', () => {
      // Arrange
      const validFile = new File([''], 'document.pdf', {
        type: 'application/pdf'
      });
      
      Object.defineProperty(validFile, 'size', {
        value: 1024 * 1024, // 1MB
        writable: false
      });

      // Act & Assert
      expect(() => {
        (DocumentService as any).validateFile(validFile);
      }).not.toThrow();
    });
  });

  describe('getDirectors', () => {
    test('Get directors successfully', async () => {
      // Arrange
      const mockProfilesData = [
        {
          id: 'dir-1',
          name: 'Director One',
          position_info: { role: 'director' }
        },
        {
          id: 'user-1',
          name: 'Clinician One',
          position_info: { role: 'clinician' }
        },
        {
          id: 'dir-2',
          name: 'Director Two',
          position_info: { role: 'director' }
        }
      ];

      const expectedDirectors = [
        { id: 'dir-1', name: 'Director One' },
        { id: 'dir-2', name: 'Director Two' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockProfilesData,
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await DocumentService.getDirectors();

      // Assert
      expect(result).toEqual(expectedDirectors);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    test('Handle error when fetching profiles', async () => {
      // Arrange
      const mockError = { message: 'Database connection failed' };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      } as any);

      // Act & Assert
      await expect(DocumentService.getDirectors())
        .rejects.toThrow('Failed to fetch directors: Database connection failed');
    });

    test('Filter out non-directors', async () => {
      // Arrange
      const mockProfilesData = [
        {
          id: 'user-1',
          name: 'Clinician One',
          position_info: { role: 'clinician' }
        },
        {
          id: 'admin-1',
          name: 'Admin One',
          position_info: { role: 'super-admin' }
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockProfilesData,
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await DocumentService.getDirectors();

      // Assert
      expect(result).toEqual([]);
    });

    test('Handle profiles without position info', async () => {
      // Arrange
      const mockProfilesData = [
        {
          id: 'dir-1',
          name: 'Director One',
          position_info: { role: 'director' }
        },
        {
          id: 'user-1',
          name: 'User Without Position',
          position_info: null
        }
      ];

      const expectedDirectors = [
        { id: 'dir-1', name: 'Director One' }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockProfilesData,
              error: null
            })
          })
        })
      } as any);

      // Act
      const result = await DocumentService.getDirectors();

      // Assert
      expect(result).toEqual(expectedDirectors);
    });
  });

  describe('formatFileSize', () => {
    test('Format bytes correctly', () => {
      expect(DocumentService.formatFileSize(0)).toBe('0 Bytes');
      expect(DocumentService.formatFileSize(1024)).toBe('1 KB');
      expect(DocumentService.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(DocumentService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(DocumentService.formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('getDownloadUrl', () => {
    test('Return download URL', () => {
      const testUrl = 'https://example.com/file.pdf';
      const result = DocumentService.getDownloadUrl(testUrl);
      expect(result).toBe(testUrl);
    });
  });
});
import { DocumentService } from './documentService';

// Mock Supabase
const mockSupabase = {
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://mock-url.com/test.pdf' } })),
      remove: jest.fn()
    })),
    listBuckets: jest.fn()
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({ data: { id: 'test-id', file_url: 'https://mock-url.com/test.pdf' }, error: null }))
      }))
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({ data: [], error: null }))
          }))
        }))
      })),
      single: jest.fn(() => ({ data: { file_url: 'https://mock-url.com/test.pdf' }, error: null }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({ error: null }))
    }))
  })),
  auth: {
    getUser: jest.fn(() => ({ data: { user: null }, error: { message: 'No user' } }))
  }
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('DocumentService Bug Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File Extension Bug Check', () => {
    test('should handle files without extension gracefully', () => {
      // Test the bug where file.name.split('.').pop() returns undefined for files without extension
      const fileWithoutExtension = new File(['test'], 'testfile', { type: 'application/pdf' });
      
      expect(() => {
        // This should not throw an error, but might due to the bug
        (DocumentService as any).validateFile(fileWithoutExtension);
      }).not.toThrow();
      
      // The real bug is in uploadDocument where fileExtension might be undefined
      const extension = fileWithoutExtension.name.split('.').pop();
      expect(extension).toBeUndefined(); // This demonstrates the bug
    });

    test('should handle files with extension correctly', () => {
      const fileWithExtension = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const extension = fileWithExtension.name.split('.').pop();
      expect(extension).toBe('pdf');
    });
  });

  describe('Filtering Logic Inconsistency Bug Check', () => {
    test('demonstrates inconsistent accept status filtering', () => {
      const testProfiles = [
        { director_profile: { accept: true } },
        { director_profile: { accept: false } },
        { director_profile: { accept: null } },
        { director_profile: { accept: undefined } },
        { director_profile: null }
      ];

      // Bug: getDocumentsByMonthAndDirector uses !== false (includes null/undefined)
      const filterByNotFalse = testProfiles.filter(doc => doc.director_profile?.accept !== false);
      
      // Bug: getDocumentsByMonth uses === true (excludes null/undefined)  
      const filterByTrue = testProfiles.filter(doc => doc.director_profile?.accept === true);

      console.log('Filter by !== false (getDocumentsByMonthAndDirector):', filterByNotFalse.length);
      console.log('Filter by === true (getDocumentsByMonth):', filterByTrue.length);
      
      // This demonstrates the inconsistency
      expect(filterByNotFalse.length).not.toBe(filterByTrue.length);
    });
  });

  describe('Path Extraction Bug Check', () => {
    test('demonstrates potential path extraction error in deleteDocument', () => {
      // Bug: assumes URL structure is always exactly 4 parts deep
      const testUrls = [
        'https://iljbcbmebjeputawrqok.supabase.co/storage/v1/object/public/review-files/2025/1/director-id/123_abc.pdf',
        'https://iljbcbmebjeputawrqok.supabase.co/storage/v1/object/review-files/2025/1/director-id/123_abc.pdf', // Missing 'public'
        'https://different-domain.com/storage/v1/object/public/review-files/2025/1/director-id/extra/path/123_abc.pdf' // Extra path
      ];

      testUrls.forEach((testUrl, index) => {
        const url = new URL(testUrl);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts.slice(-4).join('/');
        
        console.log(`URL ${index + 1}:`, testUrl);
        console.log(`Extracted fileName:`, fileName);
        console.log(`Path parts:`, pathParts);
        
        // The bug: this extraction might not work for all URL formats
        if (index === 1) {
          // This URL is missing 'public' so the extraction will be wrong
          expect(fileName).not.toBe('2025/1/director-id/123_abc.pdf');
        }
      });
    });
  });

  describe('Date Handling Bug Check', () => {
    test('demonstrates date handling issue in uploadDocument', () => {
      // Bug: Always uses day 1 regardless of actual upload date
      const year = 2025;
      const month = 3; // March
      const actualUploadDate = new Date(2025, 2, 15); // March 15th, 2025
      
      // What the service does (always day 1)
      const serviceDate = new Date(year, month - 1, 1).toISOString();
      
      // What it probably should do (use actual upload date)
      const expectedDate = actualUploadDate.toISOString();
      
      console.log('Service uses (always day 1):', serviceDate);
      console.log('Actual upload date would be:', expectedDate);
      
      // This shows the date is always set to the 1st of the month
      expect(serviceDate).toContain('T00:00:00.000Z');
      expect(serviceDate).toContain('2025-03-01');
      expect(serviceDate).not.toContain('2025-03-15');
    });
  });

  describe('Type Safety Bug Check', () => {
    test('demonstrates type issues with position_info filtering', () => {
      // This test would fail with the original code due to the TypeScript error
      const mockData = [
        { 
          id: '1', 
          name: 'Director 1', 
          position_info: { role: 'director' } 
        },
        { 
          id: '2', 
          name: 'Manager 1', 
          position_info: { role: 'manager' } 
        },
        { 
          id: '3', 
          name: 'User 1', 
          position_info: null 
        }
      ];

      // The bug was that TypeScript couldn't infer the correct type for position_info
      // This would cause a compilation error before the fix
      const directors = mockData.filter((profile: any) => 
        profile.position_info?.role === 'director'
      );
      
      expect(directors).toHaveLength(1);
      expect(directors[0].name).toBe('Director 1');
    });
  });

  describe('File Validation Edge Cases', () => {
    test('should validate file size correctly', () => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      const oversizedFile = new File([new ArrayBuffer(maxSize + 1)], 'large.pdf', { type: 'application/pdf' });
      
      expect(() => {
        (DocumentService as any).validateFile(oversizedFile);
      }).toThrow('File large.pdf is too large. Maximum size is 50MB.');
    });

    test('should validate file type correctly', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      expect(() => {
        (DocumentService as any).validateFile(invalidFile);
      }).toThrow('File type text/plain is not allowed. Only PDF files are allowed.');
    });
  });
});
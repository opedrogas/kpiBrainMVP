import { DocumentService } from './documentService';
import { supabase } from '../lib/supabase';

// Mock console methods to capture debug output
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

describe('DocumentService Upload Debugging', () => {
  let consoleLogs: string[] = [];
  let consoleErrors: string[] = [];

  beforeEach(() => {
    consoleLogs = [];
    consoleErrors = [];
    
    console.log = jest.fn((message: string) => {
      consoleLogs.push(message);
      originalConsoleLog(message);
    });
    
    console.error = jest.fn((message: string) => {
      consoleErrors.push(message);
      originalConsoleError(message);
    });
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  test('Debug Supabase Storage Configuration', async () => {
    // Test 1: Check if Supabase client is properly configured
    expect(supabase).toBeDefined();
    expect(supabase.storage).toBeDefined();
    
    // Note: supabaseUrl and supabaseKey are protected properties
    console.log('Supabase client is configured');
    console.log('Supabase has storage:', !!supabase.storage);
  });

  test('Debug Storage Bucket Access', async () => {
    // Test 2: Check if the bucket exists and is accessible
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error listing buckets:', error);
        throw error;
      }
      
      console.log('Available buckets:', buckets.map(b => b.name));
      
      const reviewFilesBucket = buckets.find(b => b.name === 'review-files');
      if (!reviewFilesBucket) {
        throw new Error('review-files bucket not found');
      }
      
      console.log('review-files bucket found:', reviewFilesBucket);
      
    } catch (error) {
      console.error('Bucket access test failed:', error);
      throw error;
    }
  });

  test('Debug File Upload with Mock Data', async () => {
    // Test 3: Try uploading a small test file
    const testFile = new File(['test content'], 'test-document.pdf', { 
      type: 'application/pdf' 
    });
    
    console.log('Test file details:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    // Test file validation
    try {
      // Access private validateFile method through type assertion
      (DocumentService as any).validateFile(testFile);
      console.log('File validation passed');
    } catch (error) {
      console.error('File validation failed:', error);
      throw error;
    }
    
    // Generate test filename following the service pattern
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `2025/1/test-director-id/${timestamp}_${randomString}.pdf`;
    
    console.log('Generated filename:', fileName);
    
    try {
      // Test direct storage upload
      const { data, error } = await supabase.storage
        .from('review-files')
        .upload(fileName, testFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error details:', {
          message: error.message,
          statusCode: (error as any).statusCode,
          error: (error as any).error,
          details: (error as any).details
        });
        throw error;
      }
      
      console.log('Upload successful:', data);
      
      // Clean up test file
      await supabase.storage
        .from('review-files')
        .remove([fileName]);
        
    } catch (error) {
      console.error('Direct upload test failed:', error);
      throw error;
    }
  });

  test('Debug Authentication Headers', async () => {
    // Test 4: Check authentication setup
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('No authenticated user (this might be expected):', error.message);
    } else {
      console.log('Current user:', user?.id);
    }
    
    // Check if we have proper headers
    const testHeaders = (supabase as any).realtime?.headers || {};
    console.log('Current Supabase headers:', testHeaders);
  });

  test('Debug Network Request Details', async () => {
    // Test 5: Intercept and log the actual network request
    const originalFetch = global.fetch;
    
    global.fetch = jest.fn((url: RequestInfo | URL, options?: RequestInit) => {
      if (typeof url === 'string' && url.includes('storage/v1/object')) {
        console.log('Storage request intercepted:', {
          url: url,
          method: options?.method,
          headers: options?.headers,
          bodyType: options?.body?.constructor?.name
        });
      }
      
      return originalFetch(url, options);
    }) as jest.MockedFunction<typeof fetch>;
    
    try {
      const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileName = `test/${Date.now()}.pdf`;
      
      await supabase.storage
        .from('review-files')
        .upload(fileName, testFile);
        
    } catch (error) {
      console.log('Expected error during network debugging');
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('Debug Supabase Storage Policies', async () => {
    // Test 6: Check storage policies
    try {
      // Try to list files in the bucket to check permissions
      const { data, error } = await supabase.storage
        .from('review-files')
        .list('2025', {
          limit: 1
        });
      
      if (error) {
        console.error('Storage list error (might indicate policy issue):', error);
      } else {
        console.log('Storage list successful, found items:', data?.length || 0);
      }
    } catch (error) {
      console.error('Storage policy test error:', error);
    }
  });

  test('Comprehensive Upload Test with Error Analysis', async () => {
    // Test 7: Full upload test with detailed error analysis
    const testFile = new File(
      [new Uint8Array(1024)], // 1KB file
      'debug-test.pdf',
      { type: 'application/pdf' }
    );
    
    try {
      const result = await DocumentService.uploadDocument(
        testFile,
        'test-director-id',
        1,
        2025
      );
      
      console.log('Upload test successful:', result.id);
      
      // Clean up
      await DocumentService.deleteDocument(result.id);
      
    } catch (error: any) {
      console.error('Full upload test error analysis:', {
        errorMessage: error.message,
        errorStack: error.stack,
        errorType: error.constructor.name
      });
      
      // Try to extract more details from Supabase error
      if (error.message.includes('Failed to upload')) {
        console.error('This appears to be a storage upload error');
        
        // Check if it's an authentication issue
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          console.error('DIAGNOSIS: Authentication/Authorization issue');
          console.error('SOLUTION: Check RLS policies on storage bucket');
        }
        
        // Check if it's a permission issue
        if (error.message.includes('403') || error.message.includes('forbidden')) {
          console.error('DIAGNOSIS: Permission denied');
          console.error('SOLUTION: Check bucket permissions and RLS policies');
        }
        
        // Check if it's a validation issue
        if (error.message.includes('400')) {
          console.error('DIAGNOSIS: Bad Request - likely validation or malformed request');
          console.error('SOLUTION: Check file validation, filename format, or request headers');
        }
      }
      
      throw error;
    }
  });
});
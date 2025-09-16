import { supabase } from '../lib/supabase';

/**
 * Debug script to help diagnose the 400 Bad Request error
 */
export class UploadDebugger {
  
  /**
   * Test Supabase connection and bucket access
   */
  static async testSupabaseConnection() {
    console.log('🔍 Testing Supabase Connection...');
    
    try {
      // Test 1: Check if we can list buckets
      console.log('1. Testing bucket access...');
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.error('❌ Bucket list error:', bucketError);
        return false;
      }
      
      console.log('✅ Available buckets:', buckets?.map(b => b.name));
      
      // Test 2: Check if 'review-files' bucket exists
      const reviewFilesBucket = buckets?.find(bucket => bucket.name === 'review-files');
      if (!reviewFilesBucket) {
        console.error('❌ review-files bucket not found!');
        return false;
      }
      
      console.log('✅ review-files bucket found:', reviewFilesBucket);
      
      // Test 3: Check bucket permissions
      console.log('2. Testing bucket permissions...');
      const { data: files, error: listError } = await supabase.storage
        .from('review-files')
        .list('', { limit: 1 });
        
      if (listError) {
        console.error('❌ Bucket permission error:', listError);
        console.log('This could be the cause of your 400 error - insufficient permissions');
        return false;
      }
      
      console.log('✅ Bucket permissions OK, found files:', files?.length || 0);
      
      return true;
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  /**
   * Test upload with a small dummy file
   */
  static async testUpload() {
    console.log('🔍 Testing File Upload...');
    
    try {
      // Create a small test file
      const testContent = new Blob(['Test file content'], { type: 'application/pdf' });
      const testFile = new File([testContent], 'test-upload.pdf', { type: 'application/pdf' });
      
      const timestamp = Date.now();
      const testPath = `debug-test/${timestamp}-test.pdf`;
      
      console.log('Testing upload with path:', testPath);
      
      const { data, error } = await supabase.storage
        .from('review-files')
        .upload(testPath, testFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        });
        
      if (error) {
        // Log full error without referencing non-existent typed properties
        console.error('❌ Upload test failed:', error);
        
        // Analyze the error by inspecting the message
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('400') || msg.includes('bad request')) {
          console.log('🔍 400 Error Analysis:');
          console.log('- This matches your reported error');
          console.log('- Possible causes:');
          console.log('  * Invalid file path or filename');
          console.log('  * Missing authentication');
          console.log('  * Bucket policy restrictions');
          console.log('  * File type not allowed');
        }
        
        return false;
      }
      
      console.log('✅ Upload test successful:', data);
      
      // Clean up test file
      await supabase.storage.from('review-files').remove([testPath]);
      console.log('✅ Test file cleaned up');
      
      return true;
      
    } catch (error) {
      console.error('❌ Upload test exception:', error);
      return false;
    }
  }

  /**
   * Analyze the specific URL that's failing
   */
  static analyzeFailingUrl(url: string) {
    console.log('🔍 Analyzing failing URL:', url);
    
    // Your failing URL: https://iljbcbmebjeputawrqok.supabase.co/storage/v1/object/review-files/2025/8/817218fa-0715-4eb3-b0d7-cd0ecbdb6c45/1755652492859_0zhvauswnz2b.pdf
    
    const expectedPattern = /https:\/\/[^\/]+\/storage\/v1\/object\/(public\/)?([^\/]+)\/(.*)/;
    const match = url.match(expectedPattern);
    
    if (!match) {
      console.error('❌ URL does not match expected Supabase storage pattern');
      return;
    }
    
    const [, publicSegment, bucket, path] = match;
    
    console.log('URL Analysis:');
    console.log('- Public segment:', publicSegment || 'MISSING (This could be the issue!)');
    console.log('- Bucket:', bucket);
    console.log('- File path:', path);
    
    // Check for issues
    if (!publicSegment) {
      console.log('🚨 ISSUE FOUND: Missing "public" segment in URL');
      console.log('Expected: /storage/v1/object/public/review-files/...');
      console.log('Actual:   /storage/v1/object/review-files/...');
      console.log('This is likely causing your 400 error!');
    }
    
    if (bucket !== 'review-files') {
      console.log('🚨 ISSUE: Unexpected bucket name:', bucket);
    }
    
    // Reconstruct correct URL
    const correctUrl = url.replace('/storage/v1/object/review-files/', '/storage/v1/object/public/review-files/');
    console.log('✅ Corrected URL should be:', correctUrl);
  }

  /**
   * Run all diagnostics
   */
  static async runFullDiagnostics() {
    console.log('🚀 Starting Full Upload Diagnostics...\n');
    
    // Test connection
    const connectionOk = await this.testSupabaseConnection();
    console.log('\n');
    
    // Test upload
    const uploadOk = await this.testUpload();
    console.log('\n');
    
    // Analyze your specific failing URL
    const failingUrl = 'https://iljbcbmebjeputawrqok.supabase.co/storage/v1/object/review-files/2025/8/817218fa-0715-4eb3-b0d7-cd0ecbdb6c45/1755652492859_0zhvauswnz2b.pdf';
    this.analyzeFailingUrl(failingUrl);
    
    console.log('\n📋 Summary:');
    console.log('Connection:', connectionOk ? '✅' : '❌');
    console.log('Upload Test:', uploadOk ? '✅' : '❌');
    
    if (!connectionOk || !uploadOk) {
      console.log('\n🔧 Recommended Actions:');
      console.log('1. Check Supabase bucket permissions');
      console.log('2. Verify authentication token');
      console.log('3. Check if RLS (Row Level Security) is blocking uploads');
      console.log('4. Review bucket policy settings');
    }
  }
}

// Export for use in console or tests
export default UploadDebugger;
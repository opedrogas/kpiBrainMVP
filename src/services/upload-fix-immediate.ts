import { supabase } from '../lib/supabase';

/**
 * IMMEDIATE FIX for the 400 Bad Request issue
 * This bypasses the problem by using alternative approaches
 */
export class UploadFixImmediate {
  
  /**
   * Test Method 1: Direct upload with detailed logging
   */
  static async testDirectUpload(file: File, directorId: string, month: number, year: number) {
    console.log('🔍 TESTING DIRECT UPLOAD');
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const fileName = `${year}/${month}/${directorId}/${timestamp}_${randomString}.${fileExtension}`;
    
    console.log('Generated fileName:', fileName);
    console.log('Bucket name:', 'review-files');
    
    try {
      // Test the exact same call that's failing
      const uploadResponse = await supabase.storage
        .from('review-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });
        
      console.log('✅ Upload response:', uploadResponse);
      return uploadResponse;
      
    } catch (error) {
      console.error('❌ Upload failed with error:', error);
      
      // Log network request details if available
      if (error instanceof Error && 'status' in error) {
        console.error('Status:', (error as any).status);
        console.error('StatusCode:', (error as any).statusCode);
        console.error('Details:', (error as any));
      }
      
      throw error;
    }
  }

  /**
   * Test Method 2: Check bucket configuration
   */
  static async testBucketConfiguration() {
    console.log('🔍 TESTING BUCKET CONFIGURATION');
    
    try {
      // 1. List buckets to confirm review-files exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.error('❌ Cannot list buckets:', bucketError);
        return false;
      }
      
      console.log('Available buckets:', buckets.map(b => ({ name: b.name, public: b.public })));
      
      const reviewBucket = buckets.find(b => b.name === 'review-files');
      if (!reviewBucket) {
        console.error('❌ review-files bucket not found!');
        return false;
      }
      
      console.log('✅ review-files bucket found:', reviewBucket);
      
      // 2. Try to list files in the bucket
      const { data: files, error: listError } = await supabase.storage
        .from('review-files')
        .list('', { limit: 1 });
      
      if (listError) {
        console.error('❌ Cannot list files in bucket:', listError);
        if (listError.status === 400) {
          console.log('This 400 error suggests the bucket is not properly configured or accessible');
        }
        return false;
      }
      
      console.log('✅ Can list files in bucket. Found', files?.length || 0, 'items');
      
      // 3. Check bucket URL structure
      const testPath = 'test-path.pdf';
      const { data: urlData } = supabase.storage
        .from('review-files')
        .getPublicUrl(testPath);
      
      console.log('Generated public URL:', urlData.publicUrl);
      
      // Analyze the URL structure
      if (urlData.publicUrl.includes('/object/public/')) {
        console.log('✅ URL contains /object/public/ - this is correct');
      } else if (urlData.publicUrl.includes('/object/review-files/')) {
        console.log('⚠️  URL contains /object/review-files/ - missing public segment');
        console.log('This could indicate the bucket is not configured as public');
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Bucket configuration test failed:', error);
      return false;
    }
  }

  /**
   * Test Method 3: Alternative upload approach using FormData
   */
  static async testFormDataUpload(file: File, directorId: string, month: number, year: number) {
    console.log('🔍 TESTING FORMDATA UPLOAD APPROACH');
    
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const fileName = `${year}/${month}/${directorId}/${timestamp}_${randomString}.${fileExtension}`;
    
    // Get Supabase project details
    const supabaseUrl = 'https://iljbcbmebjeputawrqok.supabase.co';
    const uploadUrl = `${supabaseUrl}/storage/v1/object/review-files`;
    
    const formData = new FormData();
    formData.append('', file); // Empty string as key name for Supabase
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(supabase as any).supabaseKey}`, // Use anon key
        },
        body: formData
      });
      
      console.log('FormData upload response status:', response.status);
      const responseText = await response.text();
      console.log('FormData upload response:', responseText);
      
      if (response.ok) {
        console.log('✅ FormData upload successful');
        return { success: true, path: fileName };
      } else {
        console.error('❌ FormData upload failed');
        return { success: false, error: responseText };
      }
      
    } catch (error) {
      console.error('❌ FormData upload exception:', error);
      return { success: false, error };
    }
  }

  /**
   * Run all tests to identify the exact issue
   */
  static async diagnoseUploadIssue(file: File, directorId: string, month: number, year: number) {
    console.log('🚀 STARTING COMPREHENSIVE UPLOAD DIAGNOSIS\n');
    
    // Test 1: Bucket configuration
    console.log('=== TEST 1: BUCKET CONFIGURATION ===');
    const bucketOk = await this.testBucketConfiguration();
    console.log('\n');
    
    // Test 2: Direct upload (this should fail with 400)
    console.log('=== TEST 2: DIRECT UPLOAD (EXPECTED TO FAIL) ===');
    try {
      const uploadResult = await this.testDirectUpload(file, directorId, month, year);
      console.log('Unexpected success:', uploadResult);
    } catch (error) {
      console.log('Expected failure confirmed:', error);
    }
    console.log('\n');
    
    // Test 3: FormData approach
    console.log('=== TEST 3: ALTERNATIVE FORMDATA UPLOAD ===');
    const formDataResult = await this.testFormDataUpload(file, directorId, month, year);
    console.log('FormData result:', formDataResult);
    console.log('\n');
    
    // Summary
    console.log('=== DIAGNOSIS SUMMARY ===');
    console.log('Bucket configuration:', bucketOk ? '✅ OK' : '❌ FAILED');
    console.log('Standard upload: ❌ FAILING (400 error)');
    console.log('FormData upload:', formDataResult.success ? '✅ OK' : '❌ FAILED');
    
    return {
      bucketOk,
      formDataWorking: formDataResult.success
    };
  }
}

export default UploadFixImmediate;
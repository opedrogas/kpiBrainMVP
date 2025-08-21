import { supabase } from '../lib/supabase';

// Fixed version of DocumentService with bug fixes

export class DocumentServiceFixed {
  private static readonly BUCKET_NAME = 'review-files';
  private static readonly TABLE_NAME = 'doc_metadata';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for admin documents
  private static readonly ALLOWED_TYPES = [
    'application/pdf'
  ];

  /**
   * Fixed Upload a document file to Supabase Storage
   */
  static async uploadDocument(
    file: File,
    directorId: string,
    month: number,
    year: number
  ): Promise<any> {
    try {
      // Validate file
      this.validateFile(file);
      
      // FIX 1: Handle file extension properly
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      
      // Fixed: Handle files without extension
      let fileExtension = '';
      const nameParts = file.name.split('.');
      if (nameParts.length > 1) {
        fileExtension = nameParts[nameParts.length - 1];
      } else {
        // Default extension for files without extension
        fileExtension = 'pdf'; // or throw error
      }
      
      const fileName = `${year}/${month}/${directorId}/${timestamp}_${randomString}.${fileExtension}`;
      
      // FIX 2: Debug the upload process
      console.log('Upload Details:', {
        bucket: this.BUCKET_NAME,
        fileName: fileName,
        fileSize: file.size,
        fileType: file.type,
        directorId: directorId
      });

      // Upload file to Supabase Storage with proper error handling
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        console.error('Supabase upload error details:', {
          error: error,
          message: error.message,
          status: error.status,
          statusCode: error.statusCode
        });
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log('Public URL generated:', urlData.publicUrl);

      // FIX 3: Use actual upload date instead of first of month
      const documentDate = new Date().toISOString(); // Use current timestamp

      const documentData = {
        date: documentDate,
        file_url: urlData.publicUrl,
        file_name: file.name,
        director: directorId
      };

      return await this.createDocumentRecord(documentData);

    } catch (error) {
      console.error(`Error uploading document ${file.name}:`, error);
      
      // FIX 4: Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('413')) {
          throw new Error(`File ${file.name} is too large for upload.`);
        } else if (error.message.includes('401')) {
          throw new Error(`Authentication failed. Please log in again.`);
        } else if (error.message.includes('400')) {
          throw new Error(`Invalid file format or upload parameters for ${file.name}.`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Fixed validateFile method with negative size check
   */
  private static validateFile(file: File): void {
    // FIX 5: Check for negative or zero file size
    if (file.size <= 0) {
      throw new Error(`File ${file.name} appears to be empty or corrupted.`);
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`);
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Only PDF files are allowed.`);
    }
  }

  /**
   * Fixed path extraction for deleteDocument
   */
  static extractFilePathFromUrl(fileUrl: string): string {
    try {
      const url = new URL(fileUrl);
      const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
      
      // FIX 6: More robust path extraction
      // Look for the bucket name and extract everything after it
      const bucketIndex = pathSegments.findIndex(segment => segment === this.BUCKET_NAME);
      
      if (bucketIndex === -1) {
        throw new Error('Could not find bucket name in URL');
      }
      
      // Extract path after bucket name
      const filePath = pathSegments.slice(bucketIndex + 1).join('/');
      
      if (!filePath) {
        throw new Error('Could not extract file path from URL');
      }
      
      return filePath;
    } catch (error) {
      console.error('Error extracting file path from URL:', fileUrl, error);
      throw new Error('Invalid file URL format');
    }
  }

  private static async createDocumentRecord(documentData: any): Promise<any> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(documentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create document record: ${error.message}`);
    }

    return data;
  }
}

export default DocumentServiceFixed;
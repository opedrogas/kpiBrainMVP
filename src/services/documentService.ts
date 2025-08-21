import { supabase } from '../lib/supabase';

export interface DocumentMetadata {
  id: string;
  date: string | null;
  file_url: string | null;
  file_name: string | null;
  director: string | null; // UUID reference to profiles(id)
  director_profile?: {
    id: string;
    name: string;
  };
}

export interface CreateDocumentData {
  date: string;
  file_url: string;
  file_name: string;
  director: string;
}

export interface UpdateDocumentData {
  file_name?: string;
}

export class DocumentService {
  private static readonly BUCKET_NAME = 'review-files';
  private static readonly TABLE_NAME = 'doc_metadata';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for admin documents
  private static readonly ALLOWED_TYPES = [
    // Common safe types; expand as needed
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/plain', // .txt
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint', // .ppt
    'image/png',
    'image/jpeg'
  ];

  /**
   * Upload a document file to Supabase Storage
   */
  static async uploadDocument(
    file: File,
    directorId: string,
    month: number,
    year: number
  ): Promise<DocumentMetadata> {
    try {
      // Enhanced file validation
      this.validateFile(file);
      
      // Additional validation for 400 Bad Request prevention
      if (!file || file.size === 0) {
        throw new Error('File is empty or invalid');
      }
      
      // Generate unique filename with better randomization
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop() || 'pdf';
      const fileName = `${year}_${month}_${directorId}_${timestamp}_${randomString}.${fileExtension}`;
      
      // Determine content type with safe fallback
      const contentType = (file && typeof file.type === 'string' && file.type.trim().length > 0)
        ? file.type
        : 'application/octet-stream';
      
      console.log('Upload attempt starting:', { 
        fileName, 
        fileSize: file.size, 
        bucket: this.BUCKET_NAME,
        originalType: file.type,
        resolvedType: contentType
      });
      
      // Upload file to Supabase Storage with enhanced configuration
      const uploadOptions = {
        cacheControl: '3600',
        upsert: false, // Allow overwriting to prevent 400 on duplicate paths
        contentType: contentType
      };
      
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, uploadOptions);
      
      // Enhanced error logging
      if (error) {
        console.error('Upload error details:', {
          error: error,
          message: error.message,
          status: error.status,
          statusCode: error.statusCode,
          fileName: fileName,
          fileSize: file.size,
          fileType: file.type,
          resolvedContentType: contentType,
          uploadOptions: uploadOptions
        });
        
        // Provide specific error messages for common 400 errors
        let errorMessage = `Failed to upload ${file.name}: ${error.message}`;
        
        if (error.status === 400 || error.statusCode === 400) {
          if (error.message.includes('not found')) {
            errorMessage = `Storage bucket '${this.BUCKET_NAME}' not found. Please check bucket configuration.`;
          } else if (error.message.includes('duplicate')) {
            errorMessage = `File with similar name already exists. Please rename your file and try again.`;
          } else if (error.message.includes('payload')) {
            errorMessage = `File upload failed due to invalid file format or corrupted file.`;
          } else {
            errorMessage = `Upload failed with error 400. File: ${file.name}, Size: ${this.formatFileSize(file.size)}`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      // Create document metadata record - use UTC to avoid timezone shifts
      console.log('Date creation debug:', {
        originalYear: year,
        originalMonth: month,
        monthMinus1: month - 1,
        dateUTCArgs: [year, month - 1, 1]
      });
      
      const utcDate = new Date(Date.UTC(year, month - 1, 1));
      const documentDate = utcDate.toISOString();
      
      console.log('Created date:', {
        utcDate: utcDate,
        isoString: documentDate,
        utcYear: utcDate.getUTCFullYear(),
        utcMonth: utcDate.getUTCMonth() + 1,
        utcDay: utcDate.getUTCDate()
      });
      
      const documentData: CreateDocumentData = {
        date: documentDate,
        file_url: urlData.publicUrl,
        file_name: file.name,
        director: directorId
      };

      return await this.createDocumentRecord(documentData);

    } catch (error) {
      console.error(`Error uploading document ${file?.name || 'unknown'}:`, error);
      throw error;
    }
  }

  /**
   * Create document record in database
   */
  private static async createDocumentRecord(documentData: CreateDocumentData): Promise<DocumentMetadata> {
    console.log('Inserting document data:', documentData);
    
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert(documentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create document record: ${error.message}`);
    }

    console.log('Document inserted, returned data:', data);

    return data;
  }

  /**
   * Get documents by month and director
   */
  static async getDocumentsByMonthAndDirector(
    month: number,
    year: number,
    directorId: string
  ): Promise<DocumentMetadata[]> {
    // Use UTC dates to match the UTC storage format
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    console.log('DocumentService.getDocumentsByMonthAndDirector Debug:', {
      month,
      year,
      directorId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select(`
        *,
        director_profile:profiles(id, name)
      `)
      .eq('director', directorId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    // Filter by director's accept status in the application layer
    const filteredData = data?.filter(doc => doc.director_profile?.accept !== false) || [];
    return filteredData;
  }

  /**
   * Get documents by month (all directors)
   */
  static async getDocumentsByMonth(
    month: number,
    year: number
  ): Promise<DocumentMetadata[]> {
    // Use UTC dates to match the UTC storage format
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    console.log('DocumentService.getDocumentsByMonth Debug:', {
      month,
      year,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select(`
        *,
        director_profile:profiles(id, name, accept)
      `)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    // Filter by director's accept status in the application layer
    const filteredData = data?.filter(doc => doc.director_profile?.accept === true) || [];
    return filteredData;
  }

  /**
   * Get documents for a specific director (for director role)
   */
  static async getDocumentsForDirector(directorId: string): Promise<DocumentMetadata[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('director', directorId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch director documents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update document name (rename)
   */
  static async updateDocument(id: string, updateData: UpdateDocumentData): Promise<DocumentMetadata> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a document (both from storage and database)
   */
  static async deleteDocument(id: string): Promise<void> {
    try {
      // First get the document record to get the file URL
      const { data: document, error: fetchError } = await supabase
        .from(this.TABLE_NAME)
        .select('file_url')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch document: ${fetchError.message}`);
      }

      if (document.file_url) {
        // Extract file path from URL and delete from storage
        const url = new URL(document.file_url);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts.slice(-4).join('/'); // Get year/month/director/filename
        
        const { error: storageError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove([fileName]);

        if (storageError) {
          console.warn(`Failed to delete file from storage: ${storageError.message}`);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);

      if (dbError) {
        throw new Error(`Failed to delete document record: ${dbError.message}`);
      }

    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Download a document (returns the URL for download)
   */
  static getDownloadUrl(fileUrl: string): string {
    return fileUrl;
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`);
    }

    // Check file type (allow unknown types with fallback):
    // If file.type is empty or not in the allowlist, we still allow the upload
    // but will store as application/octet-stream via the upload options above.
    if (file.type && this.ALLOWED_TYPES.length > 0 && !this.ALLOWED_TYPES.includes(file.type)) {
      // Not blocking; log a warning for visibility while permitting upload
      console.warn(`Warning: Unlisted MIME type '${file.type}' for file '${file.name}'. Proceeding with upload.`);
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get all directors for dropdown selection
   */
  static async getDirectors(): Promise<Array<{id: string, name: string}>> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        position_info:position(role)
      `)
      .eq('accept', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch directors: ${error.message}`);
    }

    // Filter for directors on the client side since we can't filter by joined table fields directly
    const directors = (data || []).filter((profile: any) => 
      profile.position_info?.role === 'director'
    );

    return directors.map(director => ({
      id: director.id,
      name: director.name
    }));
  }
}

export default DocumentService;
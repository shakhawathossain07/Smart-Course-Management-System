import { supabase } from '../lib/supabase';

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export class FileUploadService {
  private static readonly STORAGE_BUCKET = 'course-files';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  
  /**
   * Upload a file to Supabase storage
   */
  static async uploadFile(
    file: File,
    path: string,
    userId: string,
    options?: {
      allowedTypes?: string[];
      maxSize?: number;
    }
  ): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file, options);

      // Generate unique file name
      const timestamp = new Date().getTime();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const fullPath = `${path}/${fileName}`;

      // Upload file
      const { error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(fullPath);

      // Log upload activity
      await this.logUploadActivity({
        fileName: file.name,
        filePath: fullPath,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString()
      });

      return {
        url: urlData.publicUrl,
        path: fullPath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      };
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(
    files: FileList | File[],
    basePath: string,
    userId: string,
    options?: {
      allowedTypes?: string[];
      maxSize?: number;
      maxFiles?: number;
    }
  ): Promise<UploadResult[]> {
    try {
      const fileArray = Array.from(files);
      
      // Validate file count
      if (options?.maxFiles && fileArray.length > options.maxFiles) {
        throw new Error(`Cannot upload more than ${options.maxFiles} files at once`);
      }

      // Upload files in parallel
      const uploadPromises = fileArray.map(file => 
        this.uploadFile(file, basePath, userId, options)
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Failed to upload multiple files:', error);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(filePath: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([filePath]);

      if (error) throw error;

      // Log deletion activity
      await this.logUploadActivity({
        fileName: filePath.split('/').pop() || 'unknown',
        filePath,
        fileSize: 0,
        mimeType: '',
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        action: 'deleted'
      });

      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Get download URL for a file
   */
  static async getDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;
      
      return data.signedUrl;
    } catch (error) {
      console.error('Failed to get download URL:', error);
      throw error;
    }
  }

  /**
   * List files in a directory
   */
  static async listFiles(path: string): Promise<Array<{
    name: string;
    id?: string;
    size?: number;
    created_at?: string;
    updated_at?: string;
    last_accessed_at?: string;
    metadata?: Record<string, unknown>;
  }>> {
    try {
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .list(path);

      if (error) throw error;
      
      return (data || []).map(file => ({
        name: file.name,
        id: file.id,
        size: (file.metadata as Record<string, unknown>)?.size as number | undefined,
        created_at: file.created_at,
        updated_at: file.updated_at,
        last_accessed_at: file.last_accessed_at,
        metadata: file.metadata as Record<string, unknown>
      }));
    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(filePath: string) {
    try {
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .list(filePath.substring(0, filePath.lastIndexOf('/')));

      if (error) throw error;
      
      const fileName = filePath.split('/').pop();
      return data?.find(file => file.name === fileName);
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail for images
   */
  static async generateThumbnail(
    filePath: string, 
    width: number = 200, 
    height: number = 200
  ): Promise<string> {
    try {
      const { data } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(filePath, {
          transform: {
            width,
            height,
            resize: 'cover'
          }
        });

      return data.publicUrl;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  private static validateFile(
    file: File, 
    options?: {
      allowedTypes?: string[];
      maxSize?: number;
    }
  ): void {
    // Check file size
    const maxSize = options?.maxSize || this.MAX_FILE_SIZE;
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${this.formatFileSize(maxSize)} limit`);
    }

    // Check file type
    if (options?.allowedTypes && options.allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type.toLowerCase();
      
      const isAllowedExtension = options.allowedTypes.some(type => 
        type.startsWith('.') ? type.substring(1) === fileExtension : false
      );
      
      const isAllowedMimeType = options.allowedTypes.some(type => 
        type.includes('/') ? type === mimeType : false
      );

      if (!isAllowedExtension && !isAllowedMimeType) {
        throw new Error(`File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
      }
    }

    // Check for malicious file names
    if (this.isMaliciousFileName(file.name)) {
      throw new Error('File name contains invalid characters');
    }
  }

  /**
   * Check for malicious file names
   */
  private static isMaliciousFileName(fileName: string): boolean {
    const maliciousPatterns = [
      /\.\./,  // Directory traversal
      /[<>:"\\|?*]/,  // Invalid Windows characters
      /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\.|$)/i,  // Reserved Windows names
      /^\./,  // Hidden files on Unix
    ];

    return maliciousPatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Log upload activity
   */
  private static async logUploadActivity(activity: {
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    uploadedAt: string;
    action?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('file_uploads')
        .insert({
          file_name: activity.fileName,
          file_path: activity.filePath,
          file_size: activity.fileSize,
          mime_type: activity.mimeType,
          uploaded_by: activity.uploadedBy,
          uploaded_at: activity.uploadedAt,
          action: activity.action || 'uploaded'
        });

      if (error) {
        console.error('Failed to log upload activity:', error);
      }
    } catch (error) {
      console.error('Failed to log upload activity:', error);
    }
  }

  /**
   * Clean up old temporary files
   */
  static async cleanupTempFiles(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from('file_uploads')
        .select('file_path')
        .lt('uploaded_at', cutoffDate.toISOString())
        .like('file_path', '%/temp/%');

      if (error) throw error;

      let cleanedCount = 0;
      if (data && data.length > 0) {
        const filePaths = data.map(item => item.file_path);
        
        const { error: deleteError } = await supabase.storage
          .from(this.STORAGE_BUCKET)
          .remove(filePaths);

        if (!deleteError) {
          cleanedCount = filePaths.length;
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
      throw error;
    }
  }
}

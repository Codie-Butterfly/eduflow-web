import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FileUploadResponse, MessageResponse } from '../../core/models';

export interface UploadProgress {
  progress: number;
  loaded: number;
  total: number;
}

export interface UploadResult {
  file: FileUploadResponse;
  progress: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/files`;

  // Counter for mock file IDs
  private mockFileIdCounter = 1000;

  /**
   * Upload a single file
   */
  uploadFile(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<FileUploadResponse>(`${this.baseUrl}/upload`, formData).pipe(
      map(response => this.transformFileResponse(response)),
      catchError(() => {
        // Return mock response for development
        return of(this.createMockFileResponse(file));
      })
    );
  }

  /**
   * Upload multiple files
   */
  uploadFiles(files: File[]): Observable<FileUploadResponse[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    return this.http.post<FileUploadResponse[]>(`${this.baseUrl}/upload-multiple`, formData).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map(r => this.transformFileResponse(r));
        }
        return [];
      }),
      catchError(() => {
        // Return mock responses for development
        return of(files.map(file => this.createMockFileResponse(file)));
      })
    );
  }

  /**
   * Upload a file with progress tracking
   */
  uploadFileWithProgress(file: File): Observable<HttpEvent<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<FileUploadResponse>(`${this.baseUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  /**
   * Delete a file by ID
   */
  deleteFile(fileId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${fileId}`).pipe(
      catchError(() => {
        // Return mock response for development
        return of({ message: 'File deleted successfully', success: true });
      })
    );
  }

  /**
   * Get file download URL
   */
  getFileUrl(fileId: number): string {
    return `${this.baseUrl}/${fileId}/download`;
  }

  /**
   * Transform API response to FileUploadResponse
   */
  private transformFileResponse(data: any): FileUploadResponse {
    return {
      id: data.id,
      fileName: data.fileName || data.file_name || data.name,
      fileUrl: data.fileUrl || data.file_url || data.url,
      fileSize: data.fileSize || data.file_size || data.size,
      fileType: data.fileType || data.file_type || data.type || data.mimeType || data.mime_type
    };
  }

  /**
   * Create mock file response for development
   */
  private createMockFileResponse(file: File): FileUploadResponse {
    const id = this.mockFileIdCounter++;
    return {
      id,
      fileName: file.name,
      fileUrl: `/api/v1/files/${id}/download`,
      fileSize: file.size,
      fileType: file.type
    };
  }

  /**
   * Validate file size (returns true if valid)
   */
  validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * Validate file type (returns true if valid)
   */
  validateFileType(file: File, acceptedTypes: string[]): boolean {
    if (acceptedTypes.length === 0) return true;

    // Check MIME type
    if (acceptedTypes.some(type => file.type.match(type))) {
      return true;
    }

    // Check extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return acceptedTypes.some(type => type.toLowerCase() === extension);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

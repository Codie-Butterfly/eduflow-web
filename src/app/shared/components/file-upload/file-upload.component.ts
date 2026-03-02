import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

import { FileUploadService } from '../../services/file-upload.service';
import { FileUploadResponse } from '../../../core/models';

export interface UploadedFile {
  id?: number;
  file?: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {
  private fileUploadService = inject(FileUploadService);

  @Input() multiple = true;
  @Input() maxFiles = 5;
  @Input() maxSizeMB = 10;
  @Input() acceptedTypes: string[] = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
  @Input() existingFiles: FileUploadResponse[] = [];

  @Output() filesUploaded = new EventEmitter<FileUploadResponse[]>();
  @Output() fileRemoved = new EventEmitter<number>();

  files = signal<UploadedFile[]>([]);
  isDragOver = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Initialize with existing files if provided
    if (this.existingFiles.length > 0) {
      const existingUploadedFiles: UploadedFile[] = this.existingFiles.map(f => ({
        id: f.id,
        fileName: f.fileName,
        fileSize: f.fileSize,
        fileType: f.fileType,
        fileUrl: f.fileUrl,
        progress: 100,
        status: 'success' as const
      }));
      this.files.set(existingUploadedFiles);
    }
  }

  get acceptedTypesString(): string {
    return this.acceptedTypes.join(',');
  }

  get uploadedFiles(): FileUploadResponse[] {
    return this.files()
      .filter(f => f.status === 'success' && f.id !== undefined)
      .map(f => ({
        id: f.id!,
        fileName: f.fileName,
        fileUrl: f.fileUrl || '',
        fileSize: f.fileSize,
        fileType: f.fileType
      }));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) {
      this.handleFiles(Array.from(droppedFiles));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = ''; // Reset input
    }
  }

  private handleFiles(newFiles: File[]): void {
    this.errorMessage.set(null);

    // Check max files limit
    const currentCount = this.files().filter(f => f.status !== 'error').length;
    const remainingSlots = this.maxFiles - currentCount;

    if (remainingSlots <= 0) {
      this.errorMessage.set(`Maximum ${this.maxFiles} files allowed`);
      return;
    }

    const filesToProcess = newFiles.slice(0, remainingSlots);
    if (filesToProcess.length < newFiles.length) {
      this.errorMessage.set(`Only ${remainingSlots} more file(s) can be uploaded`);
    }

    filesToProcess.forEach(file => {
      // Validate file size
      if (!this.fileUploadService.validateFileSize(file, this.maxSizeMB)) {
        this.addFileWithError(file, `File size exceeds ${this.maxSizeMB}MB limit`);
        return;
      }

      // Validate file type
      if (!this.fileUploadService.validateFileType(file, this.acceptedTypes)) {
        this.addFileWithError(file, 'File type not supported');
        return;
      }

      // Add file and start upload
      this.uploadFile(file);
    });
  }

  private addFileWithError(file: File, error: string): void {
    const uploadedFile: UploadedFile = {
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      progress: 0,
      status: 'error',
      errorMessage: error
    };
    this.files.update(files => [...files, uploadedFile]);
  }

  private uploadFile(file: File): void {
    const uploadedFile: UploadedFile = {
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      progress: 0,
      status: 'uploading'
    };

    this.files.update(files => [...files, uploadedFile]);
    const fileIndex = this.files().length - 1;

    this.fileUploadService.uploadFile(file).subscribe({
      next: (response) => {
        this.files.update(files => {
          const updated = [...files];
          updated[fileIndex] = {
            ...updated[fileIndex],
            id: response.id,
            fileUrl: response.fileUrl,
            progress: 100,
            status: 'success'
          };
          return updated;
        });
        this.emitFilesUploaded();
      },
      error: (error) => {
        this.files.update(files => {
          const updated = [...files];
          updated[fileIndex] = {
            ...updated[fileIndex],
            progress: 0,
            status: 'error',
            errorMessage: 'Upload failed. Please try again.'
          };
          return updated;
        });
      }
    });

    // Simulate progress for better UX (since we don't have actual progress tracking)
    this.simulateProgress(fileIndex);
  }

  private simulateProgress(fileIndex: number): void {
    let progress = 0;
    const interval = setInterval(() => {
      const currentFile = this.files()[fileIndex];
      if (!currentFile || currentFile.status !== 'uploading') {
        clearInterval(interval);
        return;
      }

      progress += Math.random() * 30;
      if (progress > 90) progress = 90; // Cap at 90% until actual completion

      this.files.update(files => {
        const updated = [...files];
        if (updated[fileIndex]?.status === 'uploading') {
          updated[fileIndex] = {
            ...updated[fileIndex],
            progress: Math.round(progress)
          };
        }
        return updated;
      });
    }, 200);
  }

  removeFile(index: number): void {
    const file = this.files()[index];

    if (file.id) {
      // If file was uploaded, emit removal event
      this.fileRemoved.emit(file.id);
    }

    this.files.update(files => files.filter((_, i) => i !== index));
    this.emitFilesUploaded();
  }

  retryUpload(index: number): void {
    const file = this.files()[index];
    if (file.file) {
      this.files.update(files => files.filter((_, i) => i !== index));
      this.uploadFile(file.file);
    }
  }

  private emitFilesUploaded(): void {
    this.filesUploaded.emit(this.uploadedFiles);
  }

  formatFileSize(bytes: number): string {
    return this.fileUploadService.formatFileSize(bytes);
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('word') || fileType.includes('doc')) return 'description';
    if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('xls')) return 'table_chart';
    if (fileType.includes('image')) return 'image';
    return 'insert_drive_file';
  }
}

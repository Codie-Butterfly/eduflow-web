import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import {
  Announcement,
  TargetType,
  AnnouncementPriority,
  TARGET_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  SchoolClass,
  FileUploadResponse
} from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { AnnouncementService } from '../../services/announcement.service';
import { ClassService } from '../../services/class.service';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';

@Component({
  selector: 'app-announcement-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
    FileUploadComponent
  ],
  templateUrl: './announcement-form.component.html',
  styleUrl: './announcement-form.component.scss'
})
export class AnnouncementFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private announcementService = inject(AnnouncementService);
  private classService = inject(ClassService);
  private notification = inject(NotificationService);

  announcementForm!: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  announcementId = signal<number | null>(null);

  // Data
  classes = signal<SchoolClass[]>([]);
  uploadedFiles = signal<FileUploadResponse[]>([]);
  existingAttachments = signal<FileUploadResponse[]>([]);

  // Options
  targetTypes = TARGET_TYPES;
  priorities = ANNOUNCEMENT_PRIORITIES;

  // Available grades for selection
  availableGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  minDate = new Date();

  ngOnInit(): void {
    this.initForm();
    this.loadClasses();
    this.checkEditMode();
  }

  private initForm(): void {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
      priority: ['NORMAL', [Validators.required]],
      targetType: ['STUDENTS', [Validators.required]],
      targetClassIds: [[]],
      targetGrades: [[]],
      expiresAt: [null],
      scheduledAt: [null],
      publishNow: [true]
    });

    // Watch for targetType changes
    this.announcementForm.get('targetType')?.valueChanges.subscribe(type => {
      const targetClassIds = this.announcementForm.get('targetClassIds');
      const targetGrades = this.announcementForm.get('targetGrades');

      // Clear and reset validators based on target type
      targetClassIds?.clearValidators();
      targetGrades?.clearValidators();
      targetClassIds?.setValue([]);
      targetGrades?.setValue([]);

      if (type === 'CLASS') {
        targetClassIds?.setValidators([Validators.required]);
      } else if (type === 'GRADE') {
        targetGrades?.setValidators([Validators.required]);
      }

      targetClassIds?.updateValueAndValidity();
      targetGrades?.updateValueAndValidity();
    });
  }

  private loadClasses(): void {
    this.classService.getClasses(0, 100).subscribe({
      next: (response) => {
        this.classes.set(response.content);
      },
      error: () => {
        console.error('Failed to load classes');
      }
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.announcementId.set(parseInt(id, 10));
      this.loadAnnouncement(parseInt(id, 10));
    }
  }

  private loadAnnouncement(id: number): void {
    this.isLoading.set(true);

    this.announcementService.getAnnouncementById(id).subscribe({
      next: (announcement) => {
        this.populateForm(announcement);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load announcement');
        this.router.navigate(['/admin/announcements']);
      }
    });
  }

  private populateForm(announcement: Announcement): void {
    // Map legacy recipientType to new targetType if needed
    let targetType = announcement.targetType;
    if (!targetType && announcement.recipientType) {
      switch (announcement.recipientType) {
        case 'ALL_STUDENTS': targetType = 'STUDENTS'; break;
        case 'ALL_TEACHERS': targetType = 'TEACHERS'; break;
        case 'ALL_PARENTS': targetType = 'PARENTS'; break;
        case 'CLASS': targetType = 'CLASS'; break;
        default: targetType = 'ALL';
      }
    }

    this.announcementForm.patchValue({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetType: targetType || 'STUDENTS',
      targetClassIds: announcement.targetClassIds || announcement.targetClasses?.map(c => c.id) || [],
      targetGrades: announcement.targetGrades || [],
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt) : null,
      scheduledAt: announcement.scheduledAt ? new Date(announcement.scheduledAt) : null,
      publishNow: announcement.status === 'PUBLISHED'
    });

    // Set existing attachments for the file upload component
    if (announcement.attachments?.length) {
      this.existingAttachments.set(announcement.attachments);
      this.uploadedFiles.set(announcement.attachments);
    }
  }

  onFilesUploaded(files: FileUploadResponse[]): void {
    this.uploadedFiles.set(files);
  }

  onFileRemoved(fileId: number): void {
    // Handle file removal (could call API to delete)
    console.log('File removed:', fileId);
  }

  onSubmit(publishNow: boolean = false): void {
    // Override publishNow if called with a specific value
    this.announcementForm.patchValue({ publishNow });

    if (this.announcementForm.invalid) {
      this.announcementForm.markAllAsTouched();
      this.notification.warning('Please fill in all required fields');
      return;
    }

    this.isSaving.set(true);
    const formValue = this.announcementForm.value;

    const data: any = {
      title: formValue.title,
      content: formValue.content,
      priority: formValue.priority as AnnouncementPriority,
      targetType: formValue.targetType as TargetType,
      attachments: this.uploadedFiles().map(f => f.fileUrl),
      expiresAt: formValue.expiresAt
        ? new Date(formValue.expiresAt).toISOString()
        : undefined,
      scheduledAt: formValue.scheduledAt && !formValue.publishNow
        ? new Date(formValue.scheduledAt).toISOString()
        : undefined
    };

    // Add target-specific IDs based on target type
    if (formValue.targetType === 'CLASS' && formValue.targetClassIds?.length) {
      data.targetClassIds = formValue.targetClassIds;
    } else if (formValue.targetType === 'GRADE' && formValue.targetGrades?.length) {
      data.targetGrades = formValue.targetGrades;
    }

    // If publishing now, don't include scheduledAt
    if (formValue.publishNow) {
      delete data.scheduledAt;
    }

    if (this.isEditMode()) {
      this.updateAnnouncement(data);
    } else {
      this.createAnnouncement(data);
    }
  }

  private createAnnouncement(data: any): void {
    this.announcementService.createAnnouncement(data).subscribe({
      next: (announcement) => {
        const message = data.publishNow
          ? 'Announcement published successfully'
          : 'Announcement saved as draft';
        this.notification.success(message);
        this.router.navigate(['/admin/announcements', announcement.id]);
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('Failed to create announcement');
      }
    });
  }

  private updateAnnouncement(data: any): void {
    this.announcementService.updateAnnouncement(this.announcementId()!, data).subscribe({
      next: (announcement) => {
        this.notification.success('Announcement updated successfully');
        this.router.navigate(['/admin/announcements', announcement.id]);
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('Failed to update announcement');
      }
    });
  }

  // Form getters
  get title() { return this.announcementForm.get('title'); }
  get content() { return this.announcementForm.get('content'); }
  get priority() { return this.announcementForm.get('priority'); }
  get targetType() { return this.announcementForm.get('targetType'); }
  get targetClassIds() { return this.announcementForm.get('targetClassIds'); }
  get targetGrades() { return this.announcementForm.get('targetGrades'); }
  get expiresAt() { return this.announcementForm.get('expiresAt'); }
  get scheduledAt() { return this.announcementForm.get('scheduledAt'); }

  showClassSelector(): boolean {
    return this.announcementForm.get('targetType')?.value === 'CLASS';
  }

  showGradeSelector(): boolean {
    return this.announcementForm.get('targetType')?.value === 'GRADE';
  }
}

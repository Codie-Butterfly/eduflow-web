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
import { MatDividerModule } from '@angular/material/divider';

import {
  Announcement,
  AnnouncementPriority,
  ANNOUNCEMENT_PRIORITIES,
  SchoolClass,
  FileUploadResponse
} from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { TeacherAnnouncementService } from '../../services/teacher-announcement.service';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';

@Component({
  selector: 'app-teacher-announcement-form',
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
    MatDividerModule,
    FileUploadComponent
  ],
  templateUrl: './teacher-announcement-form.component.html',
  styleUrl: './teacher-announcement-form.component.scss'
})
export class TeacherAnnouncementFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private announcementService = inject(TeacherAnnouncementService);
  private notification = inject(NotificationService);

  announcementForm!: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  announcementId = signal<number | null>(null);

  // Data
  myClasses = signal<SchoolClass[]>([]);
  uploadedFiles = signal<FileUploadResponse[]>([]);
  existingAttachments = signal<FileUploadResponse[]>([]);

  // Options
  priorities = ANNOUNCEMENT_PRIORITIES;

  minDate = new Date();

  ngOnInit(): void {
    this.initForm();
    this.loadMyClasses();
    this.checkEditMode();
  }

  private initForm(): void {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
      priority: ['NORMAL', [Validators.required]],
      targetClassIds: [[], [Validators.required]],
      includeParents: [true],
      expiresAt: [null]
    });
  }

  private loadMyClasses(): void {
    this.announcementService.getMyClasses().subscribe({
      next: (classes) => {
        this.myClasses.set(classes);
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
        this.router.navigate(['/teacher/announcements']);
      }
    });
  }

  private populateForm(announcement: Announcement): void {
    this.announcementForm.patchValue({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetClassIds: announcement.targetClasses?.map(c => c.id) || [],
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt) : null
    });

    // Set existing attachments
    if (announcement.attachments?.length) {
      this.existingAttachments.set(announcement.attachments);
      this.uploadedFiles.set(announcement.attachments);
    }
  }

  onFilesUploaded(files: FileUploadResponse[]): void {
    this.uploadedFiles.set(files);
  }

  onFileRemoved(fileId: number): void {
    console.log('File removed:', fileId);
  }

  onSubmit(publishNow: boolean = false): void {
    if (this.announcementForm.invalid) {
      this.announcementForm.markAllAsTouched();
      this.notification.warning('Please fill in all required fields');
      return;
    }

    this.isSaving.set(true);
    const formValue = this.announcementForm.value;

    const data = {
      title: formValue.title,
      content: formValue.content,
      priority: formValue.priority as AnnouncementPriority,
      recipientType: 'CLASS' as const,
      targetClassIds: formValue.targetClassIds,
      attachmentIds: this.uploadedFiles().map(f => f.id),
      publishNow,
      expiresAt: formValue.expiresAt
        ? new Date(formValue.expiresAt).toISOString()
        : undefined
    };

    if (this.isEditMode()) {
      this.updateAnnouncement(data);
    } else {
      this.createAnnouncement(data);
    }
  }

  private createAnnouncement(data: any): void {
    this.announcementService.createAnnouncement(data).subscribe({
      next: () => {
        const message = data.publishNow
          ? 'Announcement published successfully'
          : 'Announcement saved as draft';
        this.notification.success(message);
        this.router.navigate(['/teacher/announcements']);
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('Failed to create announcement');
      }
    });
  }

  private updateAnnouncement(data: any): void {
    this.announcementService.updateAnnouncement(this.announcementId()!, data).subscribe({
      next: () => {
        this.notification.success('Announcement updated successfully');
        this.router.navigate(['/teacher/announcements']);
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
  get targetClassIds() { return this.announcementForm.get('targetClassIds'); }
  get expiresAt() { return this.announcementForm.get('expiresAt'); }
}

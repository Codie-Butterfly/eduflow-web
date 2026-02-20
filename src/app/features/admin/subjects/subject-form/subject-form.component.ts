import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { Subject } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { SubjectService } from '../../services/subject.service';

@Component({
  selector: 'app-subject-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule
  ],
  templateUrl: './subject-form.component.html',
  styleUrl: './subject-form.component.scss'
})
export class SubjectFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subjectService = inject(SubjectService);
  private notification = inject(NotificationService);

  subjectForm!: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  subjectId = signal<number | null>(null);

  departments = ['Science', 'Languages', 'Humanities', 'Technology', 'Arts', 'Sports', 'Business'];

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.subjectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10), Validators.pattern(/^[A-Z0-9]+$/)]],
      description: ['', [Validators.maxLength(500)]],
      department: [''],
      credits: [null, [Validators.min(1), Validators.max(10)]],
      active: [true]
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.subjectId.set(parseInt(id, 10));
      this.loadSubject(parseInt(id, 10));
    }
  }

  private loadSubject(id: number): void {
    this.isLoading.set(true);

    this.subjectService.getSubjectById(id).subscribe({
      next: (subject) => {
        this.populateForm(subject);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load subject');
        this.router.navigate(['/admin/subjects']);
      }
    });
  }

  private populateForm(subject: Subject): void {
    this.subjectForm.patchValue({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      department: subject.department,
      credits: subject.credits,
      active: subject.active
    });
  }

  onSubmit(): void {
    if (this.subjectForm.invalid) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const data = this.subjectForm.value;

    if (this.isEditMode()) {
      this.updateSubject(data);
    } else {
      this.createSubject(data);
    }
  }

  private createSubject(data: any): void {
    this.subjectService.createSubject(data).subscribe({
      next: () => {
        this.notification.success('Subject created successfully');
        this.router.navigate(['/admin/subjects']);
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('Failed to create subject');
      }
    });
  }

  private updateSubject(data: any): void {
    this.subjectService.updateSubject(this.subjectId()!, data).subscribe({
      next: () => {
        this.notification.success('Subject updated successfully');
        this.router.navigate(['/admin/subjects']);
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('Failed to update subject');
      }
    });
  }

  // Form getters
  get name() { return this.subjectForm.get('name'); }
  get code() { return this.subjectForm.get('code'); }
  get description() { return this.subjectForm.get('description'); }
  get department() { return this.subjectForm.get('department'); }
  get credits() { return this.subjectForm.get('credits'); }
}
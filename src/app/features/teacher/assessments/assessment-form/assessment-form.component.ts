import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  TeacherService,
  TeacherClass,
  ClassSubject,
  ASSESSMENT_TYPES,
  TERMS,
  CreateAssessmentRequest
} from '../../services/teacher.service';
import { NotificationService } from '../../../../core/services';

@Component({
  selector: 'app-assessment-form',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './assessment-form.component.html',
  styleUrl: './assessment-form.component.scss'
})
export class AssessmentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private teacherService = inject(TeacherService);
  private notification = inject(NotificationService);

  assessmentForm!: FormGroup;
  isLoading = signal(false);
  isLoadingSubjects = signal(false);
  isSaving = signal(false);

  // Data
  classes = signal<TeacherClass[]>([]);
  subjects = signal<ClassSubject[]>([]);

  // Options
  assessmentTypes = ASSESSMENT_TYPES;
  terms = TERMS;

  // Get current academic year
  currentAcademicYear = this.getCurrentAcademicYear();

  ngOnInit(): void {
    this.initForm();
    this.loadClasses();
  }

  private initForm(): void {
    this.assessmentForm = this.fb.group({
      classId: [null, [Validators.required]],
      subjectId: [null, [Validators.required]],
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      type: ['TEST', [Validators.required]],
      date: [new Date(), [Validators.required]],
      maxScore: [100, [Validators.required, Validators.min(1), Validators.max(1000)]],
      term: ['TERM_1', [Validators.required]],
      academicYear: [this.currentAcademicYear, [Validators.required]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  private loadClasses(): void {
    this.isLoading.set(true);
    this.teacherService.getMyClasses().subscribe({
      next: (data) => {
        this.classes.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load classes');
        this.isLoading.set(false);
      }
    });
  }

  onClassChange(classId: number): void {
    // Reset subject selection
    this.assessmentForm.patchValue({ subjectId: null });
    this.subjects.set([]);

    if (!classId) return;

    this.isLoadingSubjects.set(true);
    this.teacherService.getClassSubjects(classId).subscribe({
      next: (data) => {
        this.subjects.set(data);
        this.isLoadingSubjects.set(false);

        // Auto-select if only one subject
        if (data.length === 1) {
          this.assessmentForm.patchValue({ subjectId: data[0].id });
        }
      },
      error: () => {
        this.notification.error('Failed to load subjects');
        this.isLoadingSubjects.set(false);
      }
    });
  }

  private getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    return `${year}`;
  }

  getSelectedClass(): TeacherClass | undefined {
    const id = this.assessmentForm.get('classId')?.value;
    return this.classes().find(c => c.id === id);
  }

  getSelectedSubject(): ClassSubject | undefined {
    const id = this.assessmentForm.get('subjectId')?.value;
    return this.subjects().find(s => s.id === id);
  }

  onSubmit(): void {
    if (this.assessmentForm.invalid) {
      this.assessmentForm.markAllAsTouched();
      this.notification.warning('Please fill in all required fields');
      return;
    }

    this.isSaving.set(true);
    const formValue = this.assessmentForm.value;

    const request: CreateAssessmentRequest = {
      title: formValue.title,
      type: formValue.type,
      classId: formValue.classId,
      subjectId: formValue.subjectId,
      date: this.formatDate(formValue.date),
      maxScore: formValue.maxScore,
      term: formValue.term,
      academicYear: formValue.academicYear,
      description: formValue.description || undefined
    };

    this.teacherService.createAssessment(request).subscribe({
      next: (assessment) => {
        this.notification.success('Assessment created successfully');
        this.router.navigate(['/teacher/assessments', assessment.id]);
      },
      error: (error) => {
        this.isSaving.set(false);
        this.notification.error(error.message || 'Failed to create assessment');
      }
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Form getters
  get classId() { return this.assessmentForm.get('classId'); }
  get subjectId() { return this.assessmentForm.get('subjectId'); }
  get title() { return this.assessmentForm.get('title'); }
  get type() { return this.assessmentForm.get('type'); }
  get date() { return this.assessmentForm.get('date'); }
  get maxScore() { return this.assessmentForm.get('maxScore'); }
  get term() { return this.assessmentForm.get('term'); }
  get academicYear() { return this.assessmentForm.get('academicYear'); }
  get description() { return this.assessmentForm.get('description'); }
}

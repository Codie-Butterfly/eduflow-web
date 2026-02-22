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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { Subject } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { StaffService, Teacher, CreateTeacherRequest } from '../../services/staff.service';
import { SubjectService } from '../../services/subject.service';

@Component({
  selector: 'app-teacher-form',
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
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './teacher-form.component.html',
  styleUrl: './teacher-form.component.scss'
})
export class TeacherFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private staffService = inject(StaffService);
  private subjectService = inject(SubjectService);
  private notification = inject(NotificationService);

  teacherForm!: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  teacherId = signal<number | null>(null);

  availableSubjects = signal<Subject[]>([]);

  departments = ['Mathematics', 'Science', 'Languages', 'Humanities', 'Commerce', 'Technology', 'Arts', 'Sports'];
  genders = ['MALE', 'FEMALE'];

  ngOnInit(): void {
    this.initForm();
    this.loadSubjects();
    this.checkEditMode();
  }

  private initForm(): void {
    this.teacherForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      gender: [''],
      dateOfBirth: [null],
      hireDate: [null],
      department: [''],
      qualification: [''],
      specialization: [''],
      subjectIds: [[]],
      active: [true]
    });
  }

  private loadSubjects(): void {
    this.subjectService.getAllSubjects().subscribe({
      next: (subjects) => {
        this.availableSubjects.set(subjects);
      },
      error: () => {
        console.error('Failed to load subjects');
      }
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.teacherId.set(parseInt(id, 10));
      this.loadTeacher(parseInt(id, 10));
    }
  }

  private loadTeacher(id: number): void {
    this.isLoading.set(true);

    this.staffService.getTeacherById(id).subscribe({
      next: (teacher) => {
        this.populateForm(teacher);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load teacher');
        this.router.navigate(['/admin/teachers']);
      }
    });
  }

  private populateForm(teacher: Teacher): void {
    this.teacherForm.patchValue({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      gender: teacher.gender,
      dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth) : null,
      hireDate: teacher.hireDate ? new Date(teacher.hireDate) : null,
      department: teacher.department,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
      active: teacher.active !== false
    });

    if (teacher.subjects && teacher.subjects.length > 0) {
      const ids = teacher.subjects.map(s => s.id);
      this.teacherForm.get('subjectIds')?.setValue(ids);
    }
  }

  onSubmit(): void {
    if (this.teacherForm.invalid) {
      this.teacherForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.teacherForm.value;

    const data: CreateTeacherRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone || undefined,
      gender: formValue.gender || undefined,
      dateOfBirth: formValue.dateOfBirth ? this.formatDate(formValue.dateOfBirth) : undefined,
      hireDate: formValue.hireDate ? this.formatDate(formValue.hireDate) : undefined,
      department: formValue.department || undefined,
      qualification: formValue.qualification || undefined,
      specialization: formValue.specialization || undefined,
      subjectIds: formValue.subjectIds || []
    };

    if (this.isEditMode()) {
      this.updateTeacher({ ...data, active: formValue.active });
    } else {
      this.createTeacher(data);
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private createTeacher(data: CreateTeacherRequest): void {
    this.staffService.createTeacher(data).subscribe({
      next: () => {
        this.notification.success('Teacher created successfully');
        this.router.navigate(['/admin/teachers']);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Create teacher error:', err);
        this.notification.error('Failed to create teacher');
      }
    });
  }

  private updateTeacher(data: any): void {
    this.staffService.updateTeacher(this.teacherId()!, data).subscribe({
      next: () => {
        this.notification.success('Teacher updated successfully');
        this.router.navigate(['/admin/teachers']);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Update teacher error:', err);
        this.notification.error('Failed to update teacher');
      }
    });
  }

  // Form getters
  get firstName() { return this.teacherForm.get('firstName'); }
  get lastName() { return this.teacherForm.get('lastName'); }
  get email() { return this.teacherForm.get('email'); }
}
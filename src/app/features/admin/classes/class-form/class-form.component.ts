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
import { MatChipsModule } from '@angular/material/chips';

import { SchoolClass, Subject } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { ClassService } from '../../services/class.service';
import { SubjectService } from '../../services/subject.service';
import { StaffService, Teacher } from '../../services/staff.service';

@Component({
  selector: 'app-class-form',
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
    MatChipsModule
  ],
  templateUrl: './class-form.component.html',
  styleUrl: './class-form.component.scss'
})
export class ClassFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private classService = inject(ClassService);
  private subjectService = inject(SubjectService);
  private staffService = inject(StaffService);
  private notification = inject(NotificationService);

  classForm!: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  classId = signal<number | null>(null);

  availableSubjects = signal<Subject[]>([]);
  availableTeachers = signal<Teacher[]>([]);
  selectedSubjectIds = signal<number[]>([]);

  grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  sections = ['A', 'B', 'C', 'D', 'E'];
  academicYears = ['2024', '2025', '2026'];

  ngOnInit(): void {
    this.initForm();
    this.loadSubjects();
    this.loadTeachers();
    this.checkEditMode();
  }

  private initForm(): void {
    this.classForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      grade: [null, [Validators.required]],
      section: [''],
      academicYear: ['2024', [Validators.required]],
      capacity: [null, [Validators.min(1), Validators.max(100)]],
      classTeacherId: [null],
      description: ['', [Validators.maxLength(500)]],
      active: [true],
      subjectIds: [[]]
    });

    // Auto-generate name when grade and section change
    this.classForm.get('grade')?.valueChanges.subscribe(() => this.updateClassName());
    this.classForm.get('section')?.valueChanges.subscribe(() => this.updateClassName());
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

  private loadTeachers(): void {
    this.staffService.getTeachers().subscribe({
      next: (teachers) => {
        this.availableTeachers.set(teachers);
      },
      error: () => {
        console.error('Failed to load teachers');
      }
    });
  }

  private updateClassName(): void {
    const grade = this.classForm.get('grade')?.value;
    const section = this.classForm.get('section')?.value;

    if (grade) {
      const name = section ? `Grade ${grade}${section}` : `Grade ${grade}`;
      this.classForm.get('name')?.setValue(name, { emitEvent: false });
    }
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.classId.set(parseInt(id, 10));
      this.loadClass(parseInt(id, 10));
    }
  }

  private loadClass(id: number): void {
    this.isLoading.set(true);

    this.classService.getClassById(id).subscribe({
      next: (cls) => {
        this.populateForm(cls);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load class');
        this.router.navigate(['/admin/classes']);
      }
    });
  }

  private populateForm(cls: SchoolClass): void {
    this.classForm.patchValue({
      name: cls.name,
      grade: cls.grade,
      section: cls.section,
      academicYear: cls.academicYear,
      capacity: cls.capacity,
      classTeacherId: cls.classTeacher?.id || null,
      description: cls.description,
      active: cls.active !== false
    });

    // Handle subjects - they might be IDs or names
    if (cls.subjects && cls.subjects.length > 0) {
      // If subjects are objects with IDs
      if (typeof cls.subjects[0] === 'object') {
        const ids = (cls.subjects as any[]).map(s => s.id);
        this.classForm.get('subjectIds')?.setValue(ids);
      } else {
        // If subjects are names, try to match with available subjects
        const subjectNames = cls.subjects as string[];
        this.subjectService.getAllSubjects().subscribe(allSubjects => {
          const ids = allSubjects
            .filter(s => subjectNames.includes(s.name))
            .map(s => s.id);
          this.classForm.get('subjectIds')?.setValue(ids);
        });
      }
    }
  }

  onSubmit(): void {
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.classForm.value;

    const data = {
      name: formValue.name,
      grade: formValue.grade,
      section: formValue.section || null,
      academicYear: formValue.academicYear,
      maxCapacity: formValue.capacity || null,
      classTeacherId: formValue.classTeacherId || null,
      description: formValue.description || null,
      active: formValue.active,
      subjectIds: formValue.subjectIds || []
    };

    if (this.isEditMode()) {
      this.updateClass(data);
    } else {
      this.createClass(data);
    }
  }

  private createClass(data: any): void {
    this.classService.createClass(data).subscribe({
      next: (cls) => {
        this.notification.success('Class created successfully');
        this.router.navigate(['/admin/classes']);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Create class error:', err);
        this.notification.error('Failed to create class');
      }
    });
  }

  private updateClass(data: any): void {
    this.classService.updateClass(this.classId()!, data).subscribe({
      next: (cls) => {
        this.notification.success('Class updated successfully');
        this.router.navigate(['/admin/classes']);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Update class error:', err);
        this.notification.error('Failed to update class');
      }
    });
  }

  // Form getters
  get name() { return this.classForm.get('name'); }
  get grade() { return this.classForm.get('grade'); }
  get section() { return this.classForm.get('section'); }
  get academicYear() { return this.classForm.get('academicYear'); }
  get capacity() { return this.classForm.get('capacity'); }
  get description() { return this.classForm.get('description'); }
}
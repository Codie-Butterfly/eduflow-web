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

import { Student, Gender, StudentStatus } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-student-form',
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
  templateUrl: './student-form.component.html',
  styleUrl: './student-form.component.scss'
})
export class StudentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private studentService = inject(StudentService);
  private notification = inject(NotificationService);

  studentForm!: FormGroup;
  isEditMode = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);
  studentId = signal<number | null>(null);

  genderOptions: { value: Gender; label: string }[] = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' }
  ];

  statusOptions: { value: StudentStatus; label: string }[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'GRADUATED', label: 'Graduated' },
    { value: 'TRANSFERRED', label: 'Transferred' },
    { value: 'EXPELLED', label: 'Expelled' }
  ];

  bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  maxDate = new Date();

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.studentForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phone: ['', [Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      dateOfBirth: [null, [Validators.required]],
      gender: ['', [Validators.required]],
      address: ['', [Validators.maxLength(500)]],
      bloodGroup: [''],
      medicalConditions: ['', [Validators.maxLength(1000)]],
      status: ['ACTIVE']
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.studentId.set(parseInt(id, 10));
      this.loadStudent(parseInt(id, 10));
    }
  }

  private loadStudent(id: number): void {
    this.isLoading.set(true);

    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
        this.populateForm(student);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load student');
        this.router.navigate(['/admin/students']);
      }
    });
  }

  private populateForm(student: Student): void {
    this.studentForm.patchValue({
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
      gender: student.gender,
      address: student.address,
      bloodGroup: student.bloodGroup,
      medicalConditions: student.medicalConditions,
      status: student.status
    });
  }

  onSubmit(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.studentForm.value;

    // Format date for API
    const data = {
      ...formValue,
      dateOfBirth: formValue.dateOfBirth
        ? new Date(formValue.dateOfBirth).toISOString().split('T')[0]
        : null
    };

    if (this.isEditMode()) {
      this.updateStudent(data);
    } else {
      this.createStudent(data);
    }
  }

  private createStudent(data: any): void {
    this.studentService.createStudent(data).subscribe({
      next: (student) => {
        this.notification.success('Student created successfully');
        this.router.navigate(['/admin/students', student.id]);
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('Failed to create student');
      }
    });
  }

  private updateStudent(data: any): void {
    this.studentService.updateStudent(this.studentId()!, data).subscribe({
      next: (student) => {
        this.notification.success('Student updated successfully');
        this.router.navigate(['/admin/students', student.id]);
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('Failed to update student');
      }
    });
  }

  // Form getters
  get email() { return this.studentForm.get('email'); }
  get firstName() { return this.studentForm.get('firstName'); }
  get lastName() { return this.studentForm.get('lastName'); }
  get phone() { return this.studentForm.get('phone'); }
  get dateOfBirth() { return this.studentForm.get('dateOfBirth'); }
  get gender() { return this.studentForm.get('gender'); }
  get address() { return this.studentForm.get('address'); }
}
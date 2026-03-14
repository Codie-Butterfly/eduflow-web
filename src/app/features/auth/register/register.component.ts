import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService, NotificationService } from '../../../core/services';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  registerForm: FormGroup;
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  isLoading = signal(false);
  studentIds = signal<string[]>([]);
  currentStudentId = '';

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  addStudentId(): void {
    const id = this.currentStudentId.trim();
    if (id && !this.studentIds().includes(id)) {
      this.studentIds.update(ids => [...ids, id]);
      this.currentStudentId = '';
    }
  }

  removeStudentId(id: string): void {
    this.studentIds.update(ids => ids.filter(s => s !== id));
  }

  onStudentIdKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addStudentId();
    }
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.studentIds().length === 0) {
      this.notification.error('Please add at least one student ID');
      return;
    }

    this.isLoading.set(true);
    const { firstName, lastName, email, phone, password } = this.registerForm.value;

    const registerData = {
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'PARENT' as const,
      studentIds: this.studentIds()
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.notification.success('Registration successful! Welcome to EduFlow.');
        const route = this.authService.getDefaultRoute();
        this.router.navigate([route]);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 409) {
          this.notification.error('An account with this email already exists');
        } else if (error.status === 404) {
          this.notification.error('One or more Student IDs not found. Please check and try again.');
        } else if (error.error?.message) {
          this.notification.error(error.error.message);
        } else {
          this.notification.error('Registration failed. Please try again.');
        }
      }
    });
  }

  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get phone() { return this.registerForm.get('phone'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
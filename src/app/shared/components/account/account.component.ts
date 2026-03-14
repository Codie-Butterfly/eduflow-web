import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService, NotificationService } from '../../../core/services';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss'
})
export class AccountComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  passwordForm: FormGroup;
  isLoading = signal(false);
  hideCurrentPassword = signal(true);
  hideNewPassword = signal(true);
  hideConfirmPassword = signal(true);

  currentUser = this.authService.currentUser;

  constructor() {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  toggleCurrentPasswordVisibility(): void {
    this.hideCurrentPassword.update(v => !v);
  }

  toggleNewPasswordVisibility(): void {
    this.hideNewPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.notification.success('Password changed successfully!');
        this.passwordForm.reset();
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 400 || error.status === 401) {
          this.notification.error('Current password is incorrect');
        } else {
          this.notification.error('Failed to change password. Please try again.');
        }
      }
    });
  }

  get currentPassword() { return this.passwordForm.get('currentPassword'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }
}

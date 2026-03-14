import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../core/services';
import { User } from '../../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);

  user = signal<User | null>(null);

  ngOnInit(): void {
    this.user.set(this.authService.currentUser());
  }

  getPrimaryRole(user: User): string {
    if (!user.roles || user.roles.length === 0) return 'USER';
    // Get primary role (without ROLE_ prefix if present)
    const role = user.roles[0].replace('ROLE_', '');
    return role;
  }

  getRoleLabel(user: User): string {
    const role = this.getPrimaryRole(user);
    const labels: Record<string, string> = {
      'ADMIN': 'Administrator',
      'TEACHER': 'Teacher',
      'PARENT': 'Parent',
      'STUDENT': 'Student'
    };
    return labels[role] || role;
  }

  getRoleColor(user: User): string {
    const role = this.getPrimaryRole(user);
    const colors: Record<string, string> = {
      'ADMIN': 'primary',
      'TEACHER': 'accent',
      'PARENT': 'primary',
      'STUDENT': 'primary'
    };
    return colors[role] || 'primary';
  }

  getInitials(user: User): string {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }
}

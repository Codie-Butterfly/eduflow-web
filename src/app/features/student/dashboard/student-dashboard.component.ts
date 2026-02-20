import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { StudentPortalService, StudentProfile, StudentDashboardStats } from '../services/student-portal.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StudentFee } from '../../../core/models';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    CurrencyPipe,
    DatePipe,
    StatCardComponent
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss'
})
export class StudentDashboardComponent implements OnInit {
  private studentService = inject(StudentPortalService);

  isLoading = signal(true);
  profile = signal<StudentProfile | null>(null);
  stats = signal<StudentDashboardStats | null>(null);
  fees = signal<StudentFee[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);

    this.studentService.getProfile().subscribe({
      next: (data) => this.profile.set(data)
    });

    this.studentService.getDashboardStats().subscribe({
      next: (data) => this.stats.set(data)
    });

    this.studentService.getMyFees().subscribe({
      next: (data) => {
        this.fees.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PAID': return 'primary';
      case 'PARTIAL': return 'accent';
      case 'OVERDUE': return 'warn';
      default: return '';
    }
  }

  getPendingFees(): StudentFee[] {
    return this.fees().filter(f => f.balance > 0);
  }
}
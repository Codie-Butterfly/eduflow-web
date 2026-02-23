import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { DashboardService, DashboardStats, RecentPayment } from '../services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    DatePipe,
    CurrencyPipe,
    StatCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  currentUser = this.authService.currentUser;

  // Loading states
  statsLoading = signal(true);
  paymentsLoading = signal(true);

  // Data from API
  stats = signal<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    feesCollected: 0,
    outstandingFees: 0,
    totalFeesDue: 0,
    collectionRate: 0
  });

  recentPayments = signal<RecentPayment[]>([]);

  displayedColumns = ['studentName', 'amount', 'method', 'status', 'date'];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loadStats();
    this.loadRecentPayments();
  }

  private loadStats(): void {
    this.statsLoading.set(true);
    this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        console.log('Dashboard stats loaded:', data);
        this.stats.set(data);
        this.statsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard stats:', err);
        this.statsLoading.set(false);
      }
    });
  }

  private loadRecentPayments(): void {
    this.paymentsLoading.set(true);
    this.dashboardService.getRecentPayments(5).subscribe({
      next: (payments) => {
        console.log('Recent payments loaded:', payments);
        this.recentPayments.set(payments);
        this.paymentsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load recent payments:', err);
        this.paymentsLoading.set(false);
      }
    });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'primary';
      case 'pending': return 'accent';
      case 'failed': return 'warn';
      default: return 'primary';
    }
  }
}
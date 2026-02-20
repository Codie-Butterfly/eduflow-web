import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '../../../core/services';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

interface RecentPayment {
  id: number;
  studentName: string;
  amount: number;
  method: string;
  status: 'completed' | 'pending' | 'failed';
  date: Date;
}

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
    DatePipe,
    CurrencyPipe,
    StatCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;

  // Mock data for dashboard
  stats = {
    totalStudents: 1234,
    totalTeachers: 56,
    feesCollected: 2450000,
    outstandingFees: 850000
  };

  recentPayments: RecentPayment[] = [
    { id: 1, studentName: 'John Mwanza', amount: 5000, method: 'Mobile Money', status: 'completed', date: new Date() },
    { id: 2, studentName: 'Mary Banda', amount: 3500, method: 'Bank Transfer', status: 'completed', date: new Date(Date.now() - 86400000) },
    { id: 3, studentName: 'Peter Phiri', amount: 2500, method: 'Cash', status: 'pending', date: new Date(Date.now() - 172800000) },
    { id: 4, studentName: 'Sarah Tembo', amount: 5000, method: 'Mobile Money', status: 'completed', date: new Date(Date.now() - 259200000) },
    { id: 5, studentName: 'James Zulu', amount: 4000, method: 'Card', status: 'failed', date: new Date(Date.now() - 345600000) }
  ];

  displayedColumns = ['studentName', 'amount', 'method', 'status', 'date'];

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'primary';
      case 'pending': return 'accent';
      case 'failed': return 'warn';
      default: return 'primary';
    }
  }
}
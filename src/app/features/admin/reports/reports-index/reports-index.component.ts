import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface ReportItem {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-reports-index',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './reports-index.component.html',
  styleUrl: './reports-index.component.scss'
})
export class ReportsIndexComponent {
  reports: ReportItem[] = [
    {
      title: 'Student Report',
      description: 'Enrollment statistics, demographics, and student distribution by class and grade',
      icon: 'school',
      route: '/admin/reports/students',
      color: 'primary'
    },
    {
      title: 'Fee Collection Report',
      description: 'Overview of fees collected, outstanding balances, and collection rates',
      icon: 'payments',
      route: '/admin/reports/fee-collection',
      color: 'success'
    },
    {
      title: 'Payment History',
      description: 'Complete record of all payments received with filtering by date and method',
      icon: 'receipt_long',
      route: '/admin/reports/payment-history',
      color: 'info'
    },
    {
      title: 'Overdue Fees Report',
      description: 'List of students with fees past their due date',
      icon: 'warning',
      route: '/admin/reports/overdue-fees',
      color: 'error'
    },
    {
      title: 'Pending Payments Report',
      description: 'Students with outstanding fee balances requiring payment',
      icon: 'pending_actions',
      route: '/admin/reports/pending-payments',
      color: 'warning'
    }
  ];
}
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { StudentFee } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { FeeService } from '../../services/fee.service';

// Aggregated student payment summary
export interface StudentPaymentSummary {
  studentId: number;
  studentCode: string;
  studentName: string;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  dueDate: Date | null;
  feeCount: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  fees: StudentFee[];
}

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.scss'
})
export class PaymentListComponent implements OnInit {
  private feeService = inject(FeeService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // Student payment summaries
  studentPayments = signal<StudentPaymentSummary[]>([]);
  filteredPayments = signal<StudentPaymentSummary[]>([]);
  isLoading = signal(true);

  // Pagination
  totalElements = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);

  // Filters
  statusFilter = '';
  searchQuery = '';

  // Summary stats
  totalOutstanding = signal(0);
  totalCollected = signal(0);
  studentsWithBalance = signal(0);

  displayedColumns = ['student', 'dueDate', 'amount', 'paid', 'balance', 'status', 'actions'];

  statusOptions = [
    { value: '', label: 'All Students' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'PAID', label: 'Paid' }
  ];

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading.set(true);

    // Fetch all fee assignments
    this.feeService.getAllStudentFees(0, 1000).subscribe({
      next: (response) => {
        console.log('All fees loaded:', response);
        const aggregated = this.aggregateByStudent(response.content);
        this.studentPayments.set(aggregated);
        this.calculateSummaryStats(aggregated);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load fees:', err);
        this.isLoading.set(false);
        this.notification.error('Failed to load payments');
      }
    });
  }

  private aggregateByStudent(fees: StudentFee[]): StudentPaymentSummary[] {
    const studentMap = new Map<number, StudentPaymentSummary>();

    fees.forEach(fee => {
      const studentId = fee.student?.id;
      if (!studentId) return;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          studentId: studentId,
          studentCode: fee.student?.studentId || '',
          studentName: fee.student?.fullName || 'Unknown',
          totalAmount: 0,
          totalPaid: 0,
          balance: 0,
          dueDate: null,
          feeCount: 0,
          status: 'PAID',
          fees: []
        });
      }

      const summary = studentMap.get(studentId)!;
      summary.totalAmount += fee.netAmount || 0;
      summary.totalPaid += fee.amountPaid || 0;
      summary.balance += fee.balance || 0;
      summary.feeCount++;
      summary.fees.push(fee);

      // Track the furthest (latest) due date
      if (fee.dueDate) {
        const feeDueDate = new Date(fee.dueDate);
        if (!summary.dueDate || feeDueDate > summary.dueDate) {
          summary.dueDate = feeDueDate;
        }
      }
    });

    // Calculate status for each student
    studentMap.forEach(summary => {
      summary.status = this.calculateStatus(summary);
    });

    // Sort by balance descending (students owing most first)
    return Array.from(studentMap.values()).sort((a, b) => b.balance - a.balance);
  }

  private calculateStatus(summary: StudentPaymentSummary): 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' {
    if (summary.balance <= 0) {
      return 'PAID';
    }

    // Check if any fee is overdue
    const hasOverdue = summary.fees.some(fee => {
      if (fee.status === 'OVERDUE') return true;
      if (fee.dueDate && fee.balance > 0) {
        return new Date(fee.dueDate) < new Date();
      }
      return false;
    });

    if (hasOverdue) {
      return 'OVERDUE';
    }

    if (summary.totalPaid > 0) {
      return 'PARTIAL';
    }

    return 'PENDING';
  }

  private calculateSummaryStats(summaries: StudentPaymentSummary[]): void {
    let outstanding = 0;
    let collected = 0;
    let withBalance = 0;

    summaries.forEach(s => {
      outstanding += s.balance;
      collected += s.totalPaid;
      if (s.balance > 0) {
        withBalance++;
      }
    });

    this.totalOutstanding.set(outstanding);
    this.totalCollected.set(collected);
    this.studentsWithBalance.set(withBalance);
  }

  applyFilters(): void {
    let filtered = this.studentPayments();

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(s => s.status === this.statusFilter);
    }

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.studentName.toLowerCase().includes(query) ||
        s.studentCode.toLowerCase().includes(query)
      );
    }

    this.totalElements.set(filtered.length);

    // Apply pagination
    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    this.filteredPayments.set(filtered.slice(start, end));
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.currentPage.set(0);
    this.applyFilters();
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage.set(0);
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PAID': return 'primary';
      case 'PARTIAL': return 'accent';
      case 'PENDING': return 'primary';
      case 'OVERDUE': return 'warn';
      default: return 'primary';
    }
  }

  viewStudentDetails(summary: StudentPaymentSummary): void {
    this.router.navigate(['/admin/students', summary.studentId]);
  }

  recordPayment(summary: StudentPaymentSummary): void {
    // TODO: Open payment dialog
    this.notification.info('Payment recording feature coming soon');
  }

  sendReminder(summary: StudentPaymentSummary): void {
    // TODO: Send payment reminder
    this.notification.info('Payment reminder feature coming soon');
  }

  isOverdue(summary: StudentPaymentSummary): boolean {
    return summary.status === 'OVERDUE';
  }

  getDaysUntilDue(summary: StudentPaymentSummary): number {
    if (!summary.dueDate) return 0;
    const today = new Date();
    const diffTime = summary.dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  refreshData(): void {
    this.loadPayments();
  }
}
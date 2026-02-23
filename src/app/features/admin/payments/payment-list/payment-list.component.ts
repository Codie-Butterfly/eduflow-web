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
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';

import { StudentFee, Payment } from '../../../../core/models';
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
  paymentCount: number;
  lastPaymentDate: Date | null;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  fees: StudentFee[];
  payments: Payment[];
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
    MatTabsModule,
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

  // Pending payments tab (aggregated by student)
  pendingPayments = signal<StudentPaymentSummary[]>([]);
  pendingLoading = signal(true);
  pendingTotalElements = signal(0);
  pendingPageSize = signal(10);
  pendingCurrentPage = signal(0);

  // All payments tab (aggregated by student)
  allPayments = signal<StudentPaymentSummary[]>([]);
  allFilteredPayments = signal<StudentPaymentSummary[]>([]);
  allLoading = signal(false);
  allTotalElements = signal(0);
  allPageSize = signal(10);
  allCurrentPage = signal(0);

  // Raw data
  allFeeAssignments = signal<StudentFee[]>([]);
  allPaymentRecords = signal<Payment[]>([]);

  // Filters
  statusFilter = '';
  searchQuery = '';

  // Summary stats
  totalOutstanding = signal(0);
  totalCollected = signal(0);
  overdueCount = signal(0);

  displayedColumns = ['student', 'dueDate', 'amount', 'paid', 'balance', 'status', 'actions'];

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'PAID', label: 'Paid' }
  ];

  selectedTabIndex = 0;

  ngOnInit(): void {
    this.loadAllData();
  }

  // Load data from both tables
  loadAllData(): void {
    this.pendingLoading.set(true);

    forkJoin({
      feeAssignments: this.feeService.getAllStudentFees(0, 1000),
      payments: this.feeService.getPayments(0, 1000)
    }).subscribe({
      next: (results) => {
        console.log('Fee assignments loaded:', results.feeAssignments);
        console.log('Payments loaded:', results.payments);

        this.allFeeAssignments.set(results.feeAssignments.content);
        this.allPaymentRecords.set(results.payments.content);

        // Process and aggregate data
        this.processData();
        this.pendingLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load data:', err);
        this.pendingLoading.set(false);
        this.notification.error('Failed to load payment data');
      }
    });
  }

  private processData(): void {
    const feeAssignments = this.allFeeAssignments();
    const payments = this.allPaymentRecords();

    // Aggregate by student combining both data sources
    const aggregated = this.aggregateByStudent(feeAssignments, payments);

    // Set all payments
    this.allPayments.set(aggregated);

    // Filter for pending (students with balance > 0)
    const pending = aggregated.filter(s => s.balance > 0);
    this.pendingPayments.set(pending);
    this.pendingTotalElements.set(pending.length);

    // Calculate summary stats
    this.calculateSummaryStats(aggregated);

    // Apply filters for "All" tab
    this.applyAllPaymentsFilter();
  }

  private aggregateByStudent(fees: StudentFee[], payments: Payment[]): StudentPaymentSummary[] {
    const studentMap = new Map<number, StudentPaymentSummary>();

    // Process fee assignments
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
          paymentCount: 0,
          lastPaymentDate: null,
          status: 'PAID',
          fees: [],
          payments: []
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

      // Add payments from fee assignment
      if (fee.payments && fee.payments.length > 0) {
        summary.paymentCount += fee.payments.length;
      }
    });

    // Process standalone payments (from payments table)
    payments.forEach(payment => {
      const studentId = payment.studentFee?.studentId;
      if (!studentId) return;

      // Try to find student by studentFee info
      const studentNumId = this.findStudentIdByCode(studentMap, studentId);
      if (studentNumId && studentMap.has(studentNumId)) {
        const summary = studentMap.get(studentNumId)!;

        // Check if this payment is not already counted in fee assignments
        const alreadyCounted = summary.fees.some(fee =>
          fee.payments?.some(p => p.id === payment.id)
        );

        if (!alreadyCounted) {
          summary.payments.push(payment);
          summary.paymentCount++;

          // Track last payment date
          if (payment.paidAt) {
            const paymentDate = new Date(payment.paidAt);
            if (!summary.lastPaymentDate || paymentDate > summary.lastPaymentDate) {
              summary.lastPaymentDate = paymentDate;
            }
          }
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

  private findStudentIdByCode(studentMap: Map<number, StudentPaymentSummary>, studentCode: string): number | null {
    for (const [id, summary] of studentMap) {
      if (summary.studentCode === studentCode) {
        return id;
      }
    }
    return null;
  }

  private calculateStatus(summary: StudentPaymentSummary): 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' {
    if (summary.balance <= 0) {
      return 'PAID';
    }

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
    let overdue = 0;

    summaries.forEach(s => {
      outstanding += s.balance;
      collected += s.totalPaid;
      if (s.status === 'OVERDUE') {
        overdue++;
      }
    });

    this.totalOutstanding.set(outstanding);
    this.totalCollected.set(collected);
    this.overdueCount.set(overdue);
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    if (index === 1 && this.allFilteredPayments().length === 0) {
      this.applyAllPaymentsFilter();
    }
  }

  applyAllPaymentsFilter(): void {
    let filtered = this.allPayments();

    if (this.statusFilter) {
      filtered = filtered.filter(s => s.status === this.statusFilter);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.studentName.toLowerCase().includes(query) ||
        s.studentCode.toLowerCase().includes(query)
      );
    }

    this.allTotalElements.set(filtered.length);

    // Apply pagination
    const start = this.allCurrentPage() * this.allPageSize();
    const end = start + this.allPageSize();
    this.allFilteredPayments.set(filtered.slice(start, end));
  }

  onPendingPageChange(event: PageEvent): void {
    this.pendingCurrentPage.set(event.pageIndex);
    this.pendingPageSize.set(event.pageSize);
  }

  onAllPageChange(event: PageEvent): void {
    this.allCurrentPage.set(event.pageIndex);
    this.allPageSize.set(event.pageSize);
    this.applyAllPaymentsFilter();
  }

  onStatusFilterChange(): void {
    this.allCurrentPage.set(0);
    this.applyAllPaymentsFilter();
  }

  onSearch(): void {
    this.allCurrentPage.set(0);
    this.applyAllPaymentsFilter();
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
    this.notification.info('Payment recording feature coming soon');
  }

  sendReminder(summary: StudentPaymentSummary): void {
    this.notification.info('Payment reminder feature coming soon');
  }

  isOverdue(summary: StudentPaymentSummary): boolean {
    return summary.status === 'OVERDUE';
  }

  getDaysOverdue(summary: StudentPaymentSummary): number {
    if (!summary.dueDate || summary.balance <= 0) return 0;
    const today = new Date();
    const diffTime = today.getTime() - summary.dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  getPaginatedPendingPayments(): StudentPaymentSummary[] {
    const start = this.pendingCurrentPage() * this.pendingPageSize();
    const end = start + this.pendingPageSize();
    return this.pendingPayments().slice(start, end);
  }

  refreshData(): void {
    this.loadAllData();
  }
}
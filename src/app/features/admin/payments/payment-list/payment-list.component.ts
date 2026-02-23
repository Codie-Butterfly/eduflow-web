import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
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

import { StudentFee, FEE_CATEGORIES } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { FeeService } from '../../services/fee.service';

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
  private dialog = inject(MatDialog);

  // Pending fees tab
  pendingFees = signal<StudentFee[]>([]);
  pendingLoading = signal(true);
  pendingTotalElements = signal(0);
  pendingPageSize = signal(10);
  pendingCurrentPage = signal(0);

  // All fees tab
  allFees = signal<StudentFee[]>([]);
  allLoading = signal(false);
  allTotalElements = signal(0);
  allPageSize = signal(10);
  allCurrentPage = signal(0);

  // Filters
  statusFilter = '';
  searchQuery = '';

  // Summary stats
  totalOutstanding = signal(0);
  totalCollected = signal(0);
  overdueCount = signal(0);

  displayedColumns = ['student', 'fee', 'dueDate', 'amount', 'paid', 'balance', 'status', 'actions'];
  categories = FEE_CATEGORIES;

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'PAID', label: 'Paid' },
    { value: 'WAIVED', label: 'Waived' }
  ];

  selectedTabIndex = 0;

  ngOnInit(): void {
    this.loadPendingFees();
    this.loadSummaryStats();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    if (index === 0) {
      this.loadPendingFees();
    } else {
      this.loadAllFees();
    }
  }

  // Load pending/partial/overdue fees
  loadPendingFees(): void {
    this.pendingLoading.set(true);

    // Fetch fees with pending status (PENDING, PARTIAL, OVERDUE)
    this.feeService.getAllStudentFees(
      this.pendingCurrentPage(),
      this.pendingPageSize(),
      'PENDING,PARTIAL,OVERDUE'
    ).subscribe({
      next: (response) => {
        console.log('Pending fees loaded:', response);
        this.pendingFees.set(response.content);
        this.pendingTotalElements.set(response.totalElements);
        this.pendingLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load pending fees:', err);
        this.pendingLoading.set(false);
        this.notification.error('Failed to load pending fees');
      }
    });
  }

  // Load all fees with optional status filter
  loadAllFees(): void {
    this.allLoading.set(true);

    this.feeService.getAllStudentFees(
      this.allCurrentPage(),
      this.allPageSize(),
      this.statusFilter || undefined
    ).subscribe({
      next: (response) => {
        console.log('All fees loaded:', response);
        this.allFees.set(response.content);
        this.allTotalElements.set(response.totalElements);
        this.allLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load fees:', err);
        this.allLoading.set(false);
        this.notification.error('Failed to load fee assignments');
      }
    });
  }

  loadSummaryStats(): void {
    // Calculate summary from pending fees
    this.feeService.getAllStudentFees(0, 1000, 'PENDING,PARTIAL,OVERDUE').subscribe({
      next: (response) => {
        const fees = response.content;
        let outstanding = 0;
        let overdue = 0;

        fees.forEach(fee => {
          outstanding += fee.balance || 0;
          if (fee.status === 'OVERDUE') {
            overdue++;
          }
        });

        this.totalOutstanding.set(outstanding);
        this.overdueCount.set(overdue);
      }
    });

    // Get total collected
    this.feeService.getAllStudentFees(0, 1000, 'PAID').subscribe({
      next: (response) => {
        const fees = response.content;
        let collected = 0;
        fees.forEach(fee => {
          collected += fee.amountPaid || 0;
        });
        this.totalCollected.set(collected);
      }
    });
  }

  onPendingPageChange(event: PageEvent): void {
    this.pendingCurrentPage.set(event.pageIndex);
    this.pendingPageSize.set(event.pageSize);
    this.loadPendingFees();
  }

  onAllPageChange(event: PageEvent): void {
    this.allCurrentPage.set(event.pageIndex);
    this.allPageSize.set(event.pageSize);
    this.loadAllFees();
  }

  onStatusFilterChange(): void {
    this.allCurrentPage.set(0);
    this.loadAllFees();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PAID': return 'primary';
      case 'PARTIAL': return 'accent';
      case 'PENDING': return 'primary';
      case 'OVERDUE': return 'warn';
      case 'WAIVED': return 'accent';
      default: return 'primary';
    }
  }

  getCategoryLabel(category: string): string {
    return this.categories.find(c => c.value === category)?.label || category;
  }

  recordPayment(fee: StudentFee): void {
    // TODO: Open payment dialog
    this.notification.info('Payment recording feature coming soon');
  }

  viewStudent(fee: StudentFee): void {
    // Navigate to student detail
    if (fee.student?.id) {
      window.location.href = `/admin/students/${fee.student.id}`;
    }
  }

  sendReminder(fee: StudentFee): void {
    // TODO: Send payment reminder
    this.notification.info('Payment reminder feature coming soon');
  }

  isOverdue(fee: StudentFee): boolean {
    if (fee.status === 'OVERDUE') return true;
    if (fee.dueDate && fee.balance > 0) {
      return new Date(fee.dueDate) < new Date();
    }
    return false;
  }

  getDaysOverdue(fee: StudentFee): number {
    if (!fee.dueDate) return 0;
    const dueDate = new Date(fee.dueDate);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }
}
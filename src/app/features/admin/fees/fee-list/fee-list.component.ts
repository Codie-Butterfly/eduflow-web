import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Fee, FeeCategory, FEE_CATEGORIES, StudentFee } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { FeeService } from '../../services/fee.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDialogModule,
    CurrencyPipe
  ],
  templateUrl: './fee-list.component.html',
  styleUrl: './fee-list.component.scss'
})
export class FeeListComponent implements OnInit {
  private feeService = inject(FeeService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  // Fee structures tab
  fees = signal<Fee[]>([]);
  feesLoading = signal(false);
  feesTotalElements = signal(0);
  feesPageSize = signal(10);
  feesCurrentPage = signal(0);
  academicYearFilter = '2024';

  // Fee assignments tab
  assignments = signal<StudentFee[]>([]);
  assignmentsLoading = signal(false);
  assignmentsTotalElements = signal(0);
  assignmentsPageSize = signal(10);
  assignmentsCurrentPage = signal(0);
  statusFilter = '';

  feeColumns = ['name', 'category', 'amount', 'term', 'mandatory', 'status', 'actions'];
  assignmentColumns = ['student', 'fee', 'amount', 'paid', 'balance', 'status', 'actions'];

  categories = FEE_CATEGORIES;
  academicYears = ['2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'];
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'PAID', label: 'Paid' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'WAIVED', label: 'Waived' }
  ];

  selectedTabIndex = 0;

  ngOnInit(): void {
    this.loadFees();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    if (index === 0) {
      this.loadFees();
    } else {
      this.loadAssignments();
    }
  }

  // Fee structures methods
  loadFees(): void {
    this.feesLoading.set(true);

    this.feeService.getFees(
      this.feesCurrentPage(),
      this.feesPageSize(),
      this.academicYearFilter || undefined
    ).subscribe({
      next: (response) => {
        this.fees.set(response.content);
        this.feesTotalElements.set(response.totalElements);
        this.feesLoading.set(false);
      },
      error: () => {
        this.feesLoading.set(false);
        this.notification.error('Failed to load fees');
      }
    });
  }

  onFeesPageChange(event: PageEvent): void {
    this.feesCurrentPage.set(event.pageIndex);
    this.feesPageSize.set(event.pageSize);
    this.loadFees();
  }

  onAcademicYearChange(): void {
    this.feesCurrentPage.set(0);
    this.loadFees();
  }

  deleteFee(fee: Fee): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Fee',
        message: `Are you sure you want to delete "${fee.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.feeService.deleteFee(fee.id).subscribe({
          next: () => {
            this.notification.success('Fee deleted successfully');
            this.loadFees();
          },
          error: () => {
            this.notification.error('Failed to delete fee');
          }
        });
      }
    });
  }

  // Fee assignments methods
  loadAssignments(): void {
    this.assignmentsLoading.set(true);

    this.feeService.getAllStudentFees(
      this.assignmentsCurrentPage(),
      this.assignmentsPageSize(),
      this.statusFilter || undefined
    ).subscribe({
      next: (response) => {
        this.assignments.set(response.content);
        this.assignmentsTotalElements.set(response.totalElements);
        this.assignmentsLoading.set(false);
      },
      error: () => {
        this.assignmentsLoading.set(false);
        this.notification.error('Failed to load fee assignments');
      }
    });
  }

  onAssignmentsPageChange(event: PageEvent): void {
    this.assignmentsCurrentPage.set(event.pageIndex);
    this.assignmentsPageSize.set(event.pageSize);
    this.loadAssignments();
  }

  onStatusFilterChange(): void {
    this.assignmentsCurrentPage.set(0);
    this.loadAssignments();
  }

  getCategoryLabel(category: FeeCategory): string {
    return this.categories.find(c => c.value === category)?.label || category;
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

  getTermLabel(term?: string): string {
    if (!term) return '-';
    switch (term) {
      case 'TERM_1': return 'Term 1';
      case 'TERM_2': return 'Term 2';
      case 'TERM_3': return 'Term 3';
      case 'ANNUAL': return 'Annual';
      default: return term;
    }
  }
}
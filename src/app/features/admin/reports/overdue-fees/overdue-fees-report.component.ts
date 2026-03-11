import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ReportService, OverdueFeesReportData, OverdueFeeRecord } from '../../services/report.service';
import { FeeService } from '../../services/fee.service';
import { NotificationService } from '../../../../core/services';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-overdue-fees-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
    DatePipe,
    CurrencyPipe,
    StatCardComponent
  ],
  templateUrl: './overdue-fees-report.component.html',
  styleUrl: './overdue-fees-report.component.scss'
})
export class OverdueFeesReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private feeService = inject(FeeService);
  private notification = inject(NotificationService);

  loading = signal(true);
  reportData = signal<OverdueFeesReportData | null>(null);

  searchQuery = '';
  filteredRecords = signal<OverdueFeeRecord[]>([]);
  paginatedRecords = signal<OverdueFeeRecord[]>([]);

  pageSize = 10;
  currentPage = 0;
  totalElements = 0;

  displayedColumns = ['studentName', 'className', 'feeName', 'category', 'balance', 'dueDate', 'daysOverdue', 'actions'];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.reportService.getOverdueFeesReport().subscribe({
      next: (data) => {
        console.log('Overdue fees report loaded:', data);
        this.reportData.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load overdue fees report:', err);
        this.notification.error('Failed to load overdue fees report');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    const data = this.reportData();
    if (!data) return;

    let filtered = data.records;

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.studentName.toLowerCase().includes(query) ||
        r.studentCode.toLowerCase().includes(query) ||
        r.feeName.toLowerCase().includes(query) ||
        r.className.toLowerCase().includes(query)
      );
    }

    this.filteredRecords.set(filtered);
    this.totalElements = filtered.length;
    this.currentPage = 0;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedRecords.set(this.filteredRecords().slice(start, end));
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  onSearch(): void {
    this.applyFilters();
  }

  refreshReport(): void {
    this.loadReport();
  }

  getOverdueSeverity(days: number): string {
    if (days > 60) return 'critical';
    if (days > 30) return 'high';
    if (days > 14) return 'medium';
    return 'low';
  }

  getOverdueSeverityColor(days: number): string {
    if (days > 60) return 'warn';
    if (days > 30) return 'warn';
    return 'accent';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'TUITION': 'Tuition',
      'TRANSPORT': 'Transport',
      'BOARDING': 'Boarding',
      'EXAM': 'Examination',
      'ACTIVITY': 'Activity',
      'LIBRARY': 'Library',
      'LABORATORY': 'Laboratory',
      'UNIFORM': 'Uniform',
      'BOOKS': 'Books',
      'OTHER': 'Other'
    };
    return labels[category] || category;
  }

  sendReminder(record: OverdueFeeRecord): void {
    this.notification.info('Sending payment reminder...');
    this.feeService.sendReminderToStudent(record.studentId).subscribe({
      next: () => {
        this.notification.success(`Payment reminder sent to ${record.studentName}'s parent`);
      },
      error: (err) => {
        console.error('Failed to send reminder:', err);
        this.notification.error('Failed to send payment reminder');
      }
    });
  }

  sendAllReminders(): void {
    this.notification.info('Sending reminders for all overdue fees...');
    this.feeService.sendOverdueReminders().subscribe({
      next: (response) => {
        this.notification.success('Payment reminders sent to all parents with overdue fees');
      },
      error: (err) => {
        console.error('Failed to send reminders:', err);
        this.notification.error('Failed to send payment reminders');
      }
    });
  }
}
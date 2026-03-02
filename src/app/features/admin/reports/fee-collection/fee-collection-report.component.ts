import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { ReportService, FeeCollectionReportData } from '../../services/report.service';
import { NotificationService } from '../../../../core/services';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-fee-collection-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    MatChipsModule,
    DecimalPipe,
    PercentPipe,
    CurrencyPipe,
    StatCardComponent
  ],
  templateUrl: './fee-collection-report.component.html',
  styleUrl: './fee-collection-report.component.scss'
})
export class FeeCollectionReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private notification = inject(NotificationService);

  loading = signal(true);
  reportData = signal<FeeCollectionReportData | null>(null);

  selectedAcademicYear = '';
  academicYears = ['2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'];

  classColumns = ['className', 'studentCount', 'totalDue', 'totalCollected', 'outstanding', 'collectionRate'];
  categoryColumns = ['category', 'totalDue', 'totalCollected', 'outstanding', 'collectionRate'];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.reportService.getFeeCollectionReport(this.selectedAcademicYear || undefined).subscribe({
      next: (data) => {
        console.log('Fee collection report loaded:', data);
        this.reportData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load fee collection report:', err);
        this.notification.error('Failed to load fee collection report');
        this.loading.set(false);
      }
    });
  }

  onAcademicYearChange(): void {
    this.loadReport();
  }

  refreshReport(): void {
    this.loadReport();
  }

  getMaxCollection(): number {
    const data = this.reportData();
    if (!data || data.byMonth.length === 0) return 1;
    return Math.max(...data.byMonth.map(m => m.collected + m.outstanding), 1);
  }

  getCollectedHeight(collected: number): number {
    return (collected / this.getMaxCollection()) * 100;
  }

  getOutstandingHeight(outstanding: number): number {
    return (outstanding / this.getMaxCollection()) * 100;
  }

  getCollectionRateColor(rate: number): string {
    if (rate >= 80) return 'primary';
    if (rate >= 50) return 'accent';
    return 'warn';
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
}
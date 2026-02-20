import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { TeacherService, TeacherClass, TeacherDashboardStats } from '../services/teacher.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    DatePipe,
    StatCardComponent
  ],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.scss'
})
export class TeacherDashboardComponent implements OnInit {
  private teacherService = inject(TeacherService);

  isLoading = signal(true);
  stats = signal<TeacherDashboardStats | null>(null);
  classes = signal<TeacherClass[]>([]);
  today = new Date();

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);

    this.teacherService.getDashboardStats().subscribe({
      next: (data) => this.stats.set(data)
    });

    this.teacherService.getMyClasses().subscribe({
      next: (data) => {
        this.classes.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getAttendancePercentage(): number {
    const s = this.stats();
    if (!s || s.totalClasses === 0) return 0;
    return Math.round((s.todayAttendance / s.totalClasses) * 100);
  }
}
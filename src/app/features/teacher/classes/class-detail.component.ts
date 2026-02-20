import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

import { TeacherService, TeacherClass } from '../services/teacher.service';
import { NotificationService } from '../../../core/services';
import { Student } from '../../../core/models';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule
  ],
  templateUrl: './class-detail.component.html',
  styleUrl: './class-detail.component.scss'
})
export class ClassDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private teacherService = inject(TeacherService);
  private notification = inject(NotificationService);

  classId!: number;
  isLoading = signal(true);
  classInfo = signal<TeacherClass | null>(null);
  students = signal<Student[]>([]);

  displayedColumns = ['studentId', 'name', 'gender', 'status'];

  ngOnInit(): void {
    this.classId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadClassData();
  }

  private loadClassData(): void {
    this.isLoading.set(true);

    this.teacherService.getClassDetails(this.classId).subscribe({
      next: (data) => this.classInfo.set(data),
      error: () => {
        this.notification.error('Failed to load class details');
        this.router.navigate(['/teacher/classes']);
      }
    });

    this.teacherService.getClassStudents(this.classId).subscribe({
      next: (data) => {
        this.students.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getInitials(student: Student): string {
    return `${student.firstName[0]}${student.lastName[0]}`;
  }
}
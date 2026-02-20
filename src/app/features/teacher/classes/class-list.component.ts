import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TeacherService, TeacherClass } from '../services/teacher.service';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './class-list.component.html',
  styleUrl: './class-list.component.scss'
})
export class ClassListComponent implements OnInit {
  private teacherService = inject(TeacherService);

  isLoading = signal(true);
  classes = signal<TeacherClass[]>([]);

  ngOnInit(): void {
    this.loadClasses();
  }

  private loadClasses(): void {
    this.isLoading.set(true);
    this.teacherService.getMyClasses().subscribe({
      next: (data) => {
        this.classes.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
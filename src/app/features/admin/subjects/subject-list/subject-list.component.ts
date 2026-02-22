import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Subject as RxSubject } from 'rxjs';

import { Subject } from '../../../../core/models';
import { NotificationService } from '../../../../core/services';
import { SubjectService } from '../../services/subject.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-subject-list',
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
    MatInputModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './subject-list.component.html',
  styleUrl: './subject-list.component.scss'
})
export class SubjectListComponent implements OnInit {
  private subjectService = inject(SubjectService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  subjects = signal<Subject[]>([]);
  isLoading = signal(true);
  totalElements = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);

  searchQuery = '';
  private searchSubject = new RxSubject<string>();

  displayedColumns = ['code', 'name', 'department', 'credits', 'status', 'actions'];

  ngOnInit(): void {
    this.loadSubjects();
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage.set(0);
      this.loadSubjects();
    });
  }

  loadSubjects(): void {
    this.isLoading.set(true);

    this.subjectService.getSubjects(
      this.currentPage(),
      this.pageSize(),
      this.searchQuery || undefined
    ).subscribe({
      next: (response) => {
        this.subjects.set(response.content);
        this.totalElements.set(response.totalElements);
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load subjects');
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadSubjects();
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage.set(0);
    this.loadSubjects();
  }

  deleteSubject(subject: Subject): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Subject',
        message: `Are you sure you want to delete "${subject.name}"?`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.subjectService.deleteSubject(subject.id).subscribe({
          next: () => {
            this.notification.success('Subject deleted successfully');
            this.loadSubjects();
          },
          error: () => {
            this.notification.error('Failed to delete subject');
          }
        });
      }
    });
  }
}
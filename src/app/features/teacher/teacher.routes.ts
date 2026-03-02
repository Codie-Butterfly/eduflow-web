import { Routes } from '@angular/router';

export const TEACHER_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent)
  },
  {
    path: 'classes',
    children: [
      {
        path: '',
        loadComponent: () => import('./classes/class-list.component').then(m => m.ClassListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./classes/class-detail.component').then(m => m.ClassDetailComponent)
      }
    ]
  },
  {
    path: 'attendance',
    loadComponent: () => import('./attendance/attendance.component').then(m => m.AttendanceComponent)
  },
  {
    path: 'announcements',
    children: [
      {
        path: '',
        loadComponent: () => import('./announcements/teacher-announcement-list/teacher-announcement-list.component').then(m => m.TeacherAnnouncementListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./announcements/teacher-announcement-form/teacher-announcement-form.component').then(m => m.TeacherAnnouncementFormComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./announcements/teacher-announcement-form/teacher-announcement-form.component').then(m => m.TeacherAnnouncementFormComponent)
      }
    ]
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

export default TEACHER_ROUTES;
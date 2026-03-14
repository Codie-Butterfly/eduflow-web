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
    path: 'attendance/history',
    loadComponent: () => import('./attendance/attendance-history.component').then(m => m.AttendanceHistoryComponent)
  },
  {
    path: 'assessments',
    children: [
      {
        path: '',
        loadComponent: () => import('./assessments/assessment-list/assessment-list.component').then(m => m.AssessmentListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./assessments/assessment-form/assessment-form.component').then(m => m.AssessmentFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./assessments/assessment-detail/assessment-detail.component').then(m => m.AssessmentDetailComponent)
      }
    ]
  },
  {
    path: 'announcements',
    children: [
      {
        path: '',
        loadComponent: () => import('./announcements/teacher-announcement-list/teacher-announcement-list.component').then(m => m.TeacherAnnouncementListComponent)
      },
      {
        path: 'inbox',
        loadComponent: () => import('./announcements/teacher-announcement-inbox/teacher-announcement-inbox.component').then(m => m.TeacherAnnouncementInboxComponent)
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
    path: 'profile',
    loadComponent: () => import('../../shared/components/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'account',
    loadComponent: () => import('../../shared/components/account/account.component').then(m => m.AccountComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

export default TEACHER_ROUTES;
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'students',
    children: [
      {
        path: '',
        loadComponent: () => import('./students/student-list/student-list.component').then(m => m.StudentListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./students/student-form/student-form.component').then(m => m.StudentFormComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./students/student-form/student-form.component').then(m => m.StudentFormComponent)
      },
      {
        path: ':id/grades',
        loadComponent: () => import('./students/student-grades/student-grades.component').then(m => m.StudentGradesComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./students/student-detail/student-detail.component').then(m => m.StudentDetailComponent)
      }
    ]
  },
  {
    path: 'teachers',
    children: [
      {
        path: '',
        loadComponent: () => import('./teachers/teacher-list/teacher-list.component').then(m => m.TeacherListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./teachers/teacher-form/teacher-form.component').then(m => m.TeacherFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./teachers/teacher-detail/teacher-detail.component').then(m => m.TeacherDetailComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./teachers/teacher-form/teacher-form.component').then(m => m.TeacherFormComponent)
      }
    ]
  },
  {
    path: 'classes',
    children: [
      {
        path: '',
        loadComponent: () => import('./classes/class-list/class-list.component').then(m => m.ClassListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./classes/class-form/class-form.component').then(m => m.ClassFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./classes/class-detail/class-detail.component').then(m => m.ClassDetailComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./classes/class-form/class-form.component').then(m => m.ClassFormComponent)
      }
    ]
  },
  {
    path: 'subjects',
    children: [
      {
        path: '',
        loadComponent: () => import('./subjects/subject-list/subject-list.component').then(m => m.SubjectListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./subjects/subject-form/subject-form.component').then(m => m.SubjectFormComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./subjects/subject-form/subject-form.component').then(m => m.SubjectFormComponent)
      }
    ]
  },
  {
    path: 'fees',
    children: [
      {
        path: '',
        loadComponent: () => import('./fees/fee-list/fee-list.component').then(m => m.FeeListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./fees/fee-form/fee-form.component').then(m => m.FeeFormComponent)
      },
      {
        path: 'assign',
        loadComponent: () => import('./fees/fee-assignment/fee-assignment.component').then(m => m.FeeAssignmentComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./fees/fee-form/fee-form.component').then(m => m.FeeFormComponent)
      }
    ]
  },
  {
    path: 'payments',
    loadComponent: () => import('./payments/payment-list/payment-list.component').then(m => m.PaymentListComponent)
  },
  {
    path: 'reports',
    children: [
      {
        path: '',
        loadComponent: () => import('./reports/reports-index/reports-index.component').then(m => m.ReportsIndexComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./reports/student-report/student-report.component').then(m => m.StudentReportComponent)
      },
      {
        path: 'fee-collection',
        loadComponent: () => import('./reports/fee-collection/fee-collection-report.component').then(m => m.FeeCollectionReportComponent)
      },
      {
        path: 'payment-history',
        loadComponent: () => import('./reports/payment-history/payment-history-report.component').then(m => m.PaymentHistoryReportComponent)
      },
      {
        path: 'overdue-fees',
        loadComponent: () => import('./reports/overdue-fees/overdue-fees-report.component').then(m => m.OverdueFeesReportComponent)
      },
      {
        path: 'pending-payments',
        loadComponent: () => import('./reports/pending-payments/pending-payments-report.component').then(m => m.PendingPaymentsReportComponent)
      }
    ]
  },
  {
    path: 'announcements',
    children: [
      {
        path: '',
        loadComponent: () => import('./announcements/announcement-list/announcement-list.component').then(m => m.AnnouncementListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./announcements/announcement-form/announcement-form.component').then(m => m.AnnouncementFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./announcements/announcement-detail/announcement-detail.component').then(m => m.AnnouncementDetailComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./announcements/announcement-form/announcement-form.component').then(m => m.AnnouncementFormComponent)
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

export default ADMIN_ROUTES;
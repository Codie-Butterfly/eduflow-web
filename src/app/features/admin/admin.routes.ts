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
        path: ':id',
        loadComponent: () => import('./students/student-detail/student-detail.component').then(m => m.StudentDetailComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./students/student-form/student-form.component').then(m => m.StudentFormComponent)
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
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

export default ADMIN_ROUTES;
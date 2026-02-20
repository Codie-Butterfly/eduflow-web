import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent)
  },
  {
    path: 'fees',
    loadComponent: () => import('./fees/student-fees.component').then(m => m.StudentFeesComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

export default STUDENT_ROUTES;
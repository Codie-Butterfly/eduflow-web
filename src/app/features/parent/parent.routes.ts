import { Routes } from '@angular/router';

export const PARENT_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/parent-dashboard.component').then(m => m.ParentDashboardComponent)
  },
  {
    path: 'children',
    children: [
      {
        path: '',
        loadComponent: () => import('./children/children-list.component').then(m => m.ChildrenListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./children/child-detail.component').then(m => m.ChildDetailComponent)
      },
      {
        path: ':id/grades',
        loadComponent: () => import('./children/child-grades.component').then(m => m.ChildGradesComponent)
      }
    ]
  },
  {
    path: 'payments',
    loadComponent: () => import('./payments/payment-history.component').then(m => m.PaymentHistoryComponent)
  },
  {
    path: 'announcements',
    loadComponent: () => import('./announcements/parent-announcement-inbox.component').then(m => m.ParentAnnouncementInboxComponent)
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

export default PARENT_ROUTES;
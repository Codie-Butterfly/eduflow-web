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
      }
    ]
  },
  {
    path: 'payments',
    loadComponent: () => import('./payments/payment-history.component').then(m => m.PaymentHistoryComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

export default PARENT_ROUTES;
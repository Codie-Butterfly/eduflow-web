import { Routes } from '@angular/router';
import { authGuard, roleGuard, noAuthGuard } from './core/guards';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { ParentLayoutComponent } from './layouts/parent-layout/parent-layout.component';
import { TeacherLayoutComponent } from './layouts/teacher-layout/teacher-layout.component';
import { StudentLayoutComponent } from './layouts/student-layout/student-layout.component';

export const routes: Routes = [
  // Auth routes (accessible when NOT logged in)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes'),
    canActivate: [noAuthGuard]
  },

  // Admin routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () => import('./features/admin/admin.routes')
  },

  // Parent routes
  {
    path: 'parent',
    component: ParentLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['PARENT'] },
    loadChildren: () => import('./features/parent/parent.routes')
  },

  // Teacher routes
  {
    path: 'teacher',
    component: TeacherLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['TEACHER'] },
    loadChildren: () => import('./features/teacher/teacher.routes')
  },

  // Student routes
  {
    path: 'student',
    component: StudentLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['STUDENT'] },
    loadChildren: () => import('./features/student/student.routes')
  },

  // Default redirect
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // Catch-all redirect
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
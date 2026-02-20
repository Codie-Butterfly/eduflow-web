import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static routes can be prerendered
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'auth/login',
    renderMode: RenderMode.Prerender
  },
  // Admin static routes
  {
    path: 'admin/dashboard',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'admin/students',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'admin/students/new',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'admin/fees',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'admin/fees/new',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'admin/fees/assign',
    renderMode: RenderMode.Prerender
  },
  // Parent static routes
  {
    path: 'parent/dashboard',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'parent/children',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'parent/payments',
    renderMode: RenderMode.Prerender
  },
  // Teacher static routes
  {
    path: 'teacher/dashboard',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'teacher/classes',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'teacher/attendance',
    renderMode: RenderMode.Prerender
  },
  // Student static routes
  {
    path: 'student/dashboard',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'student/fees',
    renderMode: RenderMode.Prerender
  },
  // Dynamic routes use server-side rendering
  {
    path: 'admin/students/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'admin/students/:id/edit',
    renderMode: RenderMode.Server
  },
  {
    path: 'admin/fees/:id/edit',
    renderMode: RenderMode.Server
  },
  {
    path: 'parent/children/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'teacher/classes/:id',
    renderMode: RenderMode.Server
  },
  // Fallback for all other routes
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
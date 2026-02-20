import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent, SidebarItem } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  sidebarOpen = signal(true);

  sidebarItems: SidebarItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Students', icon: 'school', route: '/admin/students' },
    { label: 'Teachers', icon: 'person', route: '/admin/teachers' },
    { label: 'Classes', icon: 'class', route: '/admin/classes' },
    { label: 'Subjects', icon: 'menu_book', route: '/admin/subjects' },
    { label: 'Fees', icon: 'payments', route: '/admin/fees' },
    { label: 'Payments', icon: 'receipt_long', route: '/admin/payments', badge: 5 },
    { label: 'Reports', icon: 'assessment', route: '/admin/reports' },
    { label: 'Announcements', icon: 'campaign', route: '/admin/announcements' },
    { label: 'Settings', icon: 'settings', route: '/admin/settings' }
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  onSidebarItemClick(): void {
    // On mobile, close sidebar after navigation
    if (window.innerWidth < 600) {
      this.sidebarOpen.set(false);
    }
  }
}
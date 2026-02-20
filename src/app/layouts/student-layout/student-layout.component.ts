import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent, SidebarItem } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './student-layout.component.html',
  styleUrl: './student-layout.component.scss'
})
export class StudentLayoutComponent {
  sidebarOpen = signal(true);

  sidebarItems: SidebarItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/student/dashboard' },
    { icon: 'receipt_long', label: 'My Fees', route: '/student/fees' }
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  onSidebarItemClick(): void {
    if (window.innerWidth < 768) {
      this.sidebarOpen.set(false);
    }
  }
}
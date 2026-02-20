import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent, SidebarItem } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-teacher-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './teacher-layout.component.html',
  styleUrl: './teacher-layout.component.scss'
})
export class TeacherLayoutComponent {
  sidebarOpen = signal(true);

  sidebarItems: SidebarItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/teacher/dashboard' },
    { icon: 'class', label: 'My Classes', route: '/teacher/classes' },
    { icon: 'fact_check', label: 'Attendance', route: '/teacher/attendance' }
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
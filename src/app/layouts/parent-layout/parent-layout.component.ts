import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent, SidebarItem } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-parent-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './parent-layout.component.html',
  styleUrl: './parent-layout.component.scss'
})
export class ParentLayoutComponent {
  sidebarOpen = signal(true);

  sidebarItems: SidebarItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/parent/dashboard' },
    { icon: 'people', label: 'My Children', route: '/parent/children' },
    { icon: 'receipt_long', label: 'Payments', route: '/parent/payments' }
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  onSidebarItemClick(): void {
    // Close sidebar on mobile after clicking
    if (window.innerWidth < 768) {
      this.sidebarOpen.set(false);
    }
  }
}
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss'
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  slides = [
    'assets/images/slides/slide1.jpg',
    'assets/images/slides/slide2.jpg',
    'assets/images/slides/slide3.jpg',
    'assets/images/slides/slide4.jpg',
    'assets/images/slides/slide5.jpg',
    'assets/images/slides/slide6.jpg',
    'assets/images/slides/slide7.jpg',
    'assets/images/slides/slide8.jpg'
  ];

  currentSlide = signal(0);
  private intervalId: any;

  ngOnInit(): void {
    this.startSlideshow();
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
  }

  private startSlideshow(): void {
    this.intervalId = setInterval(() => {
      this.currentSlide.update(current => (current + 1) % this.slides.length);
    }, 5000); // Change slide every 5 seconds
  }

  private stopSlideshow(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
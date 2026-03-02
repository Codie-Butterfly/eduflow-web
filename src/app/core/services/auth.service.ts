import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  MessageResponse
} from '../models';

const REFRESH_TOKEN_KEY = 'eduflow_refresh_token';
const TOKEN_EXPIRY_KEY = 'eduflow_token_expiry';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);

  private readonly baseUrl = `${environment.apiUrl}/v1/auth`;

  // Signals for reactive state
  private currentUserSignal = signal<User | null>(null);
  private accessTokenSignal = signal<string | null>(null);
  private isLoadingSignal = signal<boolean>(false);

  // Public computed signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());

  // Observable for components that prefer RxJS
  readonly currentUser$ = toObservable(this.currentUserSignal);
  readonly isAuthenticated$ = toObservable(this.isAuthenticated);

  // For token refresh queue
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private isRefreshing = false;

  constructor() {
    this.initializeFromStorage();
  }

  private initializeFromStorage(): void {
    const refreshToken = this.storage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      this.refreshToken().subscribe({
        error: () => {
          this.clearAuth();
        }
      });
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);

    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);

    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, data).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.storage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    if (this.isRefreshing) {
      return new Observable(observer => {
        this.refreshTokenSubject.subscribe(token => {
          if (token) {
            observer.next({ accessToken: token } as AuthResponse);
            observer.complete();
          }
        });
      });
    }

    this.isRefreshing = true;

    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, { refreshToken }).pipe(
      tap(response => {
        this.handleAuthResponse(response);
        this.isRefreshing = false;
        this.refreshTokenSubject.next(response.accessToken);
      }),
      catchError(error => {
        this.isRefreshing = false;
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    const refreshToken = this.storage.getItem(REFRESH_TOKEN_KEY);

    if (refreshToken) {
      this.http.post(`${this.baseUrl}/logout`, { refreshToken }).subscribe({
        complete: () => this.clearAuth(),
        error: () => this.clearAuth()
      });
    } else {
      this.clearAuth();
    }
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/reset-password`, { token, newPassword });
  }

  // Helper methods
  hasRole(role: string): boolean {
    const user = this.currentUserSignal();
    if (!user?.roles) return false;
    // Check both formats: 'ADMIN' and 'ROLE_ADMIN'
    return user.roles.includes(role) || user.roles.includes(`ROLE_${role}`);
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserSignal();
    if (!user?.roles) return false;
    // Check both formats for each role
    return roles.some(role =>
      user.roles.includes(role) || user.roles.includes(`ROLE_${role}`)
    );
  }

  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  isTokenExpired(): boolean {
    const expiry = this.storage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return true;

    const expiryTime = parseInt(expiry, 10);
    const now = Date.now();
    const threshold = environment.tokenRefreshThreshold;

    return now >= expiryTime - threshold;
  }

  private handleAuthResponse(response: AuthResponse): void {
    this.accessTokenSignal.set(response.accessToken);

    // Ensure user has roles - derive from email if not provided by API
    const user = response.user;
    if (!user.roles || user.roles.length === 0 || (user.roles.length === 1 && user.roles[0] === '')) {
      user.roles = this.deriveRolesFromEmail(user.email);
    }

    this.currentUserSignal.set(user);
    this.storage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    this.storage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + response.expiresIn).toString());
    this.isLoadingSignal.set(false);
  }

  private deriveRolesFromEmail(email: string): string[] {
    const emailLower = email.toLowerCase();
    if (emailLower.includes('admin')) return ['ADMIN'];
    if (emailLower.includes('teacher')) return ['TEACHER'];
    if (emailLower.includes('parent')) return ['PARENT'];
    if (emailLower.includes('student')) return ['STUDENT'];
    // Default fallback
    return ['STUDENT'];
  }

  private clearAuth(): void {
    this.accessTokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.storage.removeItem(REFRESH_TOKEN_KEY);
    this.storage.removeItem(TOKEN_EXPIRY_KEY);
    this.router.navigate(['/auth/login']);
  }

  // Get the default route based on user role
  getDefaultRoute(): string {
    const user = this.currentUserSignal();
    if (!user) return '/auth/login';

    // Check both formats: 'ADMIN' and 'ROLE_ADMIN'
    if (this.hasRole('ADMIN')) return '/admin';
    if (this.hasRole('TEACHER')) return '/teacher';
    if (this.hasRole('PARENT')) return '/parent';
    if (this.hasRole('STUDENT')) return '/student';

    return '/auth/login';
  }
}
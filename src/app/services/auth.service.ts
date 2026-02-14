/**
 * PURPOSE: Manages user session and authentication.
 * CONTENT: Functions for login(), signup(), logout(), and token storage in localStorage.
 */
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
    id: number;
    name: string;
    email: string;
    role?: 'user' | 'admin';
    created_at: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: User;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = environment.PHP_API_URL;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) platformId: any
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        // Check if user is already logged in
        if (this.isBrowser) {
            this.loadUserFromStorage();
            this.checkAuth();
        }
    }

    private loadUserFromStorage(): void {
        const savedUser = this.getSavedUser();
        if (savedUser) {
            this.currentUserSubject.next(savedUser);
        }
    }

    /**
     * Check if user is authenticated on app init
     */
    private checkAuth(): void {
        const token = this.getToken();
        if (token) {
            this.verifyToken().subscribe({
                next: (response) => {
                    if (response.success) {
                        this.currentUserSubject.next(response.data.user);
                        this.saveUser(response.data.user);
                    }
                },
                error: () => {
                    // this.logout(); // Disabled during debug
                }
            });
        }
    }

    /**
     * Get saved user from localStorage
     */
    private getSavedUser(): User | null {
        if (this.isBrowser) {
            const saved = localStorage.getItem('auth_user') || localStorage.getItem('current_user');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return null;
                }
            }
        }
        return null;
    }

    /**
     * Save user to localStorage
     */
    private saveUser(user: User): void {
        if (this.isBrowser) {
            localStorage.setItem('auth_user', JSON.stringify(user));
            // Keep both for compatibility during transition if needed
            localStorage.setItem('current_user', JSON.stringify(user));
        }
    }

    /**
     * Signup new user
     */
    signup(name: string, email: string, password: string, phone: string = ''): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/signup.php`, {
            name,
            email,
            password,
            phone
        }).pipe(
            tap(response => {
                if (response.success) {
                    this.setToken(response.data.token);
                    this.saveUser(response.data.user);
                    this.currentUserSubject.next(response.data.user);
                }
            })
        );
    }

    /**
     * Login user
     */
    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login.php`, {
            email,
            password
        }).pipe(
            tap(response => {
                if (response.success) {
                    this.setToken(response.data.token);
                    this.saveUser(response.data.user);
                    this.currentUserSubject.next(response.data.user);
                }
            })
        );
    }

    /**
     * Verify JWT token
     */
    verifyToken(): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/verify.php`, {});
    }

    /**
     * Logout user
     */
    logout(): void {
        if (this.isBrowser) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('current_user');
        }
        this.currentUserSubject.next(null);
    }

    /**
     * Get stored token
     */
    getToken(): string | null {
        if (this.isBrowser) {
            return localStorage.getItem('auth_token');
        }
        return null;
    }

    /**
     * Store token
     */
    private setToken(token: string): void {
        if (this.isBrowser) {
            localStorage.setItem('auth_token', token);
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.getToken();
    }


    /**
     * Get current user value
     */
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    /**
     * Check if current user is admin
     */
    isAdmin(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'admin';
    }
}

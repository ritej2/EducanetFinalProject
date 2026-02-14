import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminStats {
    users: number;
    children: number;
    conversations: number;
}

export interface UserDetails {
    profile: {
        id: number;
        name: string;
        email: string;
        role: string;
        created_at: string;
        phone?: string;
        is_active: boolean;
    };
    children: any[];
    stats: {
        conversations_count: number;
        messages_sent_count: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private apiUrl = environment.PHP_API_URL + '/admin';

    constructor(private http: HttpClient) { }

    getStats(): Observable<{ success: boolean; data: AdminStats }> {
        return this.http.get<{ success: boolean; data: AdminStats }>(`${this.apiUrl}/stats.php`);
    }

    getUsers(): Observable<{ success: boolean; data: any[] }> {
        return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/users.php`);
    }

    getUserDetails(id: number): Observable<UserDetails | null> {
        return this.http.get<any>(`${this.apiUrl}/user_details.php?id=${id}`).pipe(
            map(res => res.success ? res.data : null)
        );
    }


    deleteUser(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users.php?id=${id}`);
    }

    addUser(userData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/users.php`, userData);
    }

    toggleUserStatus(id: number, status: boolean): Observable<any> {
        return this.http.patch(`${this.apiUrl}/users.php`, { id, is_active: status });
    }
}

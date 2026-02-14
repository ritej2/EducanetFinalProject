import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/app.models';

@Injectable({
    providedIn: 'root'
})
export class AccountService {
    private apiUrl = `${environment.PHP_API_URL}/account.php`;

    constructor(private http: HttpClient) { }

    getAccount(): Observable<User | null> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => response.success ? response.data : null)
        );
    }

    updateAccount(updatedUser: User): Observable<any> {
        return this.http.post<any>(this.apiUrl, updatedUser);
    }

    deleteAccount(): Observable<any> {
        return this.http.delete<any>(this.apiUrl);
    }
}

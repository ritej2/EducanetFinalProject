import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Tip } from '../models/app.models';

@Injectable({
    providedIn: 'root'
})
export class TipService {
    private apiUrl = `${environment.PHP_API_URL}/tips.php`;

    constructor(private http: HttpClient) { }

    getTips(category?: string): Observable<Tip[]> {
        const url = category && category !== 'all'
            ? `${this.apiUrl}?category=${category}`
            : this.apiUrl;
        return this.http.get<any>(url).pipe(
            map(response => response.success ? response.data : [])
        );
    }

    createTip(tip: Tip): Observable<any> {
        return this.http.post<any>(this.apiUrl, tip);
    }

    updateTip(id: number, tip: Tip): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}?id=${id}`, tip);
    }

    deleteTip(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}?id=${id}`);
    }
}

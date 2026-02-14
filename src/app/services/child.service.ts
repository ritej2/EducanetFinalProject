import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Child } from '../models/app.models';

@Injectable({
    providedIn: 'root'
})
export class ChildService {
    private apiUrl = environment.PHP_API_URL + '/children.php';

    constructor(private http: HttpClient) { }

    getChildren(): Observable<Child[]> {
        return this.http.get<{ success: boolean, data: any[] }>(this.apiUrl).pipe(
            map(res => res.data.map(child => this.mapToChild(child)))
        );
    }

    getChild(id: string): Observable<Child> {
        return this.http.get<{ success: boolean, data: any }>(`${this.apiUrl}?id=${id}`).pipe(
            map(res => this.mapToChild(res.data))
        );
    }

    addChild(child: Omit<Child, 'id'> | Partial<Child>): Observable<Child> {
        return this.http.post<{ success: boolean, data: any }>(this.apiUrl, this.mapToApi(child)).pipe(
            map(res => this.mapToChild(res.data))
        );
    }

    updateChild(child: Child | Partial<Child>): Observable<Child> {
        return this.http.post<{ success: boolean, data: any }>(this.apiUrl, this.mapToApi(child)).pipe(
            map(res => this.mapToChild(res.data))
        );
    }

    deleteChild(id: string): Observable<void> {
        return this.http.delete<any>(`${this.apiUrl}?id=${id}`).pipe(
            map(() => undefined)
        );
    }

    private mapToChild(data: any): Child {
        return {
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            birthDate: new Date(data.birth_date),
            gender: data.gender,
            schoolYear: data.school_year,
            schoolName: data.school_name,
            address: data.address
        };
    }

    private mapToApi(child: any): any {
        return {
            ...child,
            first_name: child.firstName,
            last_name: child.lastName,
            birth_date: child.birthDate instanceof Date ? child.birthDate.toISOString().split('T')[0] : child.birthDate,
            school_year: child.schoolYear,
            school_name: child.schoolName
        };
    }
}

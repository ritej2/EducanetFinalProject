import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface LibraryDocument {
    id: number;
    homeworkId: number;
    title: string;
    subject: string;
    fileName: string;
    downloadUrl: string;
    dateAdded: Date;
}

@Injectable({
    providedIn: 'root'
})
export class LibraryService {
    private documentsSubject = new BehaviorSubject<LibraryDocument[]>([]);
    public documents$ = this.documentsSubject.asObservable();
    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) platformId: Object) {
        this.isBrowser = isPlatformBrowser(platformId);
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        if (this.isBrowser) {
            const saved = localStorage.getItem('parent_library');
            if (saved) {
                try {
                    this.documentsSubject.next(JSON.parse(saved));
                } catch (e) {
                    console.error('Error loading library', e);
                }
            }
        }
    }

    private saveToStorage(docs: LibraryDocument[]): void {
        if (this.isBrowser) {
            localStorage.setItem('parent_library', JSON.stringify(docs));
        }
    }

    addDocument(doc: LibraryDocument): void {
        const current = this.documentsSubject.value;
        // Check for duplicates
        if (!current.find(d => d.id === doc.id)) {
            const updated = [doc, ...current];
            this.documentsSubject.next(updated);
            this.saveToStorage(updated);
        }
    }

    clearLibrary(): void {
        this.documentsSubject.next([]);
        if (this.isBrowser) {
            localStorage.removeItem('parent_library');
        }
    }
}

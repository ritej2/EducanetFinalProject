/**
 * PURPOSE: Manages family events and calendar data.
 * CONTENT: Functions to fetch, create, and manage events scheduled by parents.
 */
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    description: string;
}

@Injectable({
    providedIn: 'root'
})
export class EventService {
    private events: CalendarEvent[] = [
        {
            id: '1',
            title: 'Rendez-vous pédiatre',
            date: new Date('2024-06-15'), // Future date example
            description: 'Visite de contrôle pour Léo'
        },
        {
            id: '2',
            title: 'Kermesse de l\'école',
            date: new Date('2024-06-25'),
            description: 'Apporter un gâteau'
        }
    ];

    getEvents(): Observable<CalendarEvent[]> {
        return of([...this.events]).pipe(delay(400));
    }

    addEvent(event: Omit<CalendarEvent, 'id'>): Observable<CalendarEvent> {
        return new Observable(observer => {
            setTimeout(() => {
                const newEvent: CalendarEvent = {
                    ...event,
                    id: Date.now().toString(),
                    date: new Date(event.date)
                };
                this.events.push(newEvent);
                observer.next(newEvent);
                observer.complete();
            }, 500);
        });
    }

    deleteEvent(id: string): Observable<void> {
        return new Observable(observer => {
            setTimeout(() => {
                const index = this.events.findIndex(e => e.id === id);
                if (index !== -1) {
                    this.events.splice(index, 1);
                    observer.next();
                    observer.complete();
                } else {
                    observer.error('Événement non trouvé');
                }
            }, 300);
        });
    }
}

/**
 * PURPOSE: Interactive calendar for managing family schedules.
 * CONTENT: Allows viewing, adding, and deleting family events.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService, CalendarEvent } from '../../services/event.service';

@Component({
    selector: 'app-calendrier',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './calendrier.component.html',
    styleUrls: ['./calendrier.component.css']
})
export class CalendrierComponent implements OnInit {
    loading = true;
    events: CalendarEvent[] = [];
    calendarWeeks: any[][] = [];
    currentDate = new Date();

    // Modal state
    showModal = false;
    newEvent: any = {};
    isSaving = false;

    constructor(private eventService: EventService) { }

    ngOnInit(): void {
        this.loadEvents();
    }

    loadEvents(): void {
        this.eventService.getEvents().subscribe({
            next: (data) => {
                this.events = data;
                this.generateCalendar();
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    generateCalendar(): void {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // First day of current month
        const startOfMonth = new Date(year, month, 1);
        // Last day of current month
        const endOfMonth = new Date(year, month + 1, 0);

        // Start date for grid (start of week - Monday)
        // Day 0 is Sunday, 1 is Monday.
        let startDayOfWeek = startOfMonth.getDay();
        // If it's Sunday (0), we want to go back 6 days to get previous Monday.
        // If it's Monday (1), we go back 0 days.
        // effective index: Sunday=7, Mon=1...
        let effectiveStartDay = startDayOfWeek === 0 ? 7 : startDayOfWeek;

        const startDate = new Date(startOfMonth);
        startDate.setDate(startDate.getDate() - (effectiveStartDay - 1));

        // Calculate end date for grid to fill full weeks
        // We want 6 rows usually to cover all scenarios
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (6 * 7) - 1);

        const weeks = [];
        let week = [];
        let day = new Date(startDate);

        // We generate exactly 6 weeks to keep grid stable
        for (let i = 0; i < 42; i++) {
            // Find events
            const dayEvents = this.events.filter(e => {
                const eDate = new Date(e.date);
                return eDate.getDate() === day.getDate() &&
                    eDate.getMonth() === day.getMonth() &&
                    eDate.getFullYear() === day.getFullYear();
            });

            week.push({
                date: new Date(day),
                dayNum: day.getDate(),
                isCurrentMonth: day.getMonth() === month,
                isToday: this.isSameDate(day, new Date()),
                events: dayEvents
            });

            if (week.length === 7) {
                weeks.push(week);
                week = [];
            }
            day.setDate(day.getDate() + 1);
        }
        this.calendarWeeks = weeks;
    }

    isSameDate(d1: Date, d2: Date): boolean {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    }

    prevMonth(): void {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.generateCalendar();
    }

    nextMonth(): void {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.generateCalendar();
    }

    openAddModal(): void {
        const today = new Date();
        // Format for input type=date
        const year = today.getFullYear();
        const month = ('0' + (today.getMonth() + 1)).slice(-2);
        const day = ('0' + today.getDate()).slice(-2);

        this.newEvent = { date: `${year}-${month}-${day}` };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.newEvent = {};
    }

    saveEvent(): void {
        if (this.newEvent.title && this.newEvent.date) {
            this.isSaving = true;
            this.eventService.addEvent(this.newEvent).subscribe({
                next: () => {
                    this.isSaving = false;
                    this.closeModal();
                    this.loadEvents();
                },
                error: (err) => {
                    console.error(err);
                    this.isSaving = false;
                }
            });
        }
    }

    deleteEvent(id: string): void {
        if (confirm('Supprimer cet événement ?')) {
            this.eventService.deleteEvent(id).subscribe(() => {
                this.loadEvents();
            });
        }
    }
}

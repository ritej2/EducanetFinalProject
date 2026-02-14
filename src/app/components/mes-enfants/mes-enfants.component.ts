/**
 * PURPOSE: Lists all child profiles registered by the parent.
 * CONTENT: Displays cards for each child with summary information.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChildService } from '../../services/child.service';
import { Child } from '../../models/app.models';

@Component({
    selector: 'app-mes-enfants',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './mes-enfants.component.html',
    styleUrls: ['./mes-enfants.component.css']
})
export class MesEnfantsComponent implements OnInit {
    loading = true;
    children: Child[] = [];

    constructor(private childService: ChildService) { }

    ngOnInit(): void {
        this.loadChildren();
    }

    loadChildren(): void {
        this.childService.getChildren().subscribe({
            next: (data) => {
                this.children = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading children', err);
                this.loading = false;
            }
        });
    }

    getAge(birth_date: string | Date): number {
        if (!birth_date) return 0;
        const today = new Date();
        const dob = new Date(birth_date);
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    }

    deleteChild(id: string): void {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet enfant ?')) {
            this.childService.deleteChild(id).subscribe(() => {
                this.loadChildren();
            });
        }
    }
}

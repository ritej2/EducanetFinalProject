/**
 * PURPOSE: The main dashboard showing a summary of children and upcoming events.
 * CONTENT: Visual overview of the parent's space with links to key features.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChildService } from '../../services/child.service';

@Component({
    selector: 'app-accueil',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './accueil.component.html',
    styleUrls: ['./accueil.component.css']
})
export class AccueilComponent implements OnInit {
    loading = true;
    childrenCount = 0;

    constructor(
        private childService: ChildService
    ) { }

    ngOnInit(): void {
        this.childService.getChildren().subscribe({
            next: (children) => {
                this.childrenCount = children.length;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading dashboard data', err);
                this.loading = false;
            }
        });
    }
}

/**
 * PURPOSE: Navigation menu for the application.
 * CONTENT: Provides links to main features and handles user logout.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
    currentUser$ = this.authService.currentUser$;

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    isAdmin(): boolean {
        return this.authService.isAdmin();
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}

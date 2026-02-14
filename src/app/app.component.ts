import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ContextService } from './services/context.service';
import { HomeworkService } from './services/homework.service';
import { AiChatService } from './services/ai-chat.service';

import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  mobileMenuOpen = false;
  currentUser$ = this.authService.currentUser$;
  isLoginPage = false;

  constructor(
    private authService: AuthService,
    private contextService: ContextService,
    private homeworkService: HomeworkService,
    private aiChatService: AiChatService,
    private router: Router
  ) {
    // Check initial URL on page load
    this.isLoginPage = this.router.url === '/login' || this.router.url === '/signup' || this.router.url === '/';

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLoginPage = event.url === '/login' || event.url === '/signup' || event.urlAfterRedirects === '/login';
    });
  }

  ngOnInit(): void {

    const user = this.authService.getCurrentUser();
    if (user) {
      this.contextService.loadProfileForUser(user.id);
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}

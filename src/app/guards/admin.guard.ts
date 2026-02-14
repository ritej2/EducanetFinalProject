import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
        take(1),
        map(user => {
            if (user && user.role === 'admin') {
                return true;
            }

            // Redirect based on status
            if (user) {
                // Logged in but not admin
                return router.createUrlTree(['/accueil']);
            } else {
                // Not logged in
                return router.createUrlTree(['/login']);
            }
        })
    );
};

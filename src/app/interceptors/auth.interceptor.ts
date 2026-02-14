import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Use Injector to break circular dependency: HttpClient -> Interceptor -> AuthService -> HttpClient
    const injector = inject(Injector);
    const authService = injector.get(AuthService);
    const token = authService.getToken();



    // Only add token to PHP API requests and External API via Proxy
    // We check for the PHP_API_URL and Proxy paths
    if (token && (
        req.url.includes('/api/php') ||
        req.url.includes('/backend/php') ||
        req.url.includes('/api/external') ||
        req.url.includes('/api/direct')
    )) {

        const cloned = req.clone({
            setHeaders: {
                'Authorization': `Bearer ${token}`,
                'X-Authorization': `Bearer ${token}`,
                'X-Token': token
            }
        });
        return next(cloned);
    }

    return next(req);
};

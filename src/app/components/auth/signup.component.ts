import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css']
})
export class SignupComponent {
    name = '';
    email = '';
    password = '';
    confirmPassword = '';
    phone = '';
    errorMessage = '';
    errors: any = {};
    isLoading = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    onSubmit(): void {
        this.errors = {};
        this.errorMessage = '';

        // Validate form
        if (!this.name) {
            this.errors.name = 'Le nom est requis';
        }

        if (!this.email) {
            this.errors.email = 'L\'email est requis';
        }

        if (!this.password) {
            this.errors.password = 'Le mot de passe est requis';
        } else if (this.password.length < 6) {
            this.errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        }

        if (this.password !== this.confirmPassword) {
            this.errors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        if (Object.keys(this.errors).length > 0) {
            return;
        }

        this.isLoading = true;

        this.authService.signup(this.name, this.email, this.password, this.phone).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response.success) {
                    this.router.navigate(['/accueil']);
                }
            },
            error: (error) => {
                this.isLoading = false;
                if (error.error?.errors) {
                    this.errors = error.error.errors;
                } else {
                    this.errorMessage = error.error?.message || 'Erreur lors de l\'inscription. Veuillez réessayer.';
                }
            }
        });
    }
}

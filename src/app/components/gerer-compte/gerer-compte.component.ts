import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { User } from '../../models/app.models';

@Component({
    selector: 'app-gerer-compte',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gerer-compte.component.html',
    styleUrls: ['./gerer-compte.component.css']
})
export class GererCompteComponent implements OnInit {
    user: any = {};
    loading = true;
    saving = false;
    deleting = false;
    message = {
        text: '',
        type: '' // 'success' or 'error'
    };

    constructor(
        private accountService: AccountService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.accountService.getAccount().subscribe(data => {
            this.user = data || {};
            this.loading = false;
        });
    }

    updateAccount(form: any): void {
        if (form.valid) {
            // Validate password if provided
            if (this.user.newPassword) {
                if (this.user.newPassword.length < 6) {
                    this.message.text = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
                    this.message.type = 'error';
                    return;
                }
                if (this.user.newPassword !== this.user.confirmPassword) {
                    this.message.text = 'Les mots de passe ne correspondent pas.';
                    this.message.type = 'error';
                    return;
                }
            }

            this.saving = true;
            this.message.text = '';

            this.accountService.updateAccount(this.user).subscribe({
                next: () => {
                    this.saving = false;
                    this.message.text = 'Modifications enregistrées avec succès.';
                    this.message.type = 'success';
                    // Reset password fields
                    this.user.newPassword = '';
                    this.user.confirmPassword = '';
                },
                error: (error) => {
                    this.saving = false;
                    this.message.text = error.error?.message || 'Erreur lors de la sauvegarde.';
                    this.message.type = 'error';
                }
            });
        }
    }

    // deleteAccount() is disabled as per user request
}

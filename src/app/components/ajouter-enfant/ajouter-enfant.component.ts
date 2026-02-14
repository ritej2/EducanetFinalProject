/**
 * PURPOSE: Form to add or edit a child's details (Name, Age, School level).
 * CONTENT: Handles input validation and communication with ChildService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ChildService } from '../../services/child.service';
import { Child } from '../../models/app.models';

@Component({
    selector: 'app-ajouter-enfant',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ajouter-enfant.component.html',
    styleUrls: ['./ajouter-enfant.component.css']
})
export class AjouterEnfantComponent implements OnInit {

    child: Partial<Child> = {
        gender: 'garçon'
    };
    isSubmitting = false;
    successMessage = '';
    isEditMode = false;
    futureDateError = false;

    constructor(
        private childService: ChildService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.childService.getChild(id).subscribe({
                next: (data) => {
                    this.child = data;
                    // Format date for input[type=date] which needs yyyy-MM-dd
                    if (this.child.birthDate) {
                        const d = new Date(this.child.birthDate);
                        const year = d.getFullYear();
                        const month = ('0' + (d.getMonth() + 1)).slice(-2);
                        const day = ('0' + d.getDate()).slice(-2);
                        // Typescript might complain about assigning string to Date, 
                        // but for ngModel input[type=date] calls, it needs string yyyy-mm-dd.
                        // However, we declared birthDate as Date.
                        // Let's use 'as any' for this temporary assignment or handle it via a separate property.
                        (this.child.birthDate as any) = `${year}-${month}-${day}`;
                    }
                },
                error: (err) => {
                    console.error("Erreur chargement enfant:", err);
                    this.router.navigate(['/mes-enfants']);
                }
            });
        }
    }

    validateDate(): void {
        if (!this.child.birthDate) return;
        const date = new Date(this.child.birthDate);
        const now = new Date();
        if (date > now) {
            this.futureDateError = true;
        } else {
            this.futureDateError = false;
        }
    }

    submitForm(form: any): void {
        if (form.valid && !this.futureDateError) {
            this.isSubmitting = true;
            let obs;
            if (this.isEditMode) {
                obs = this.childService.updateChild(this.child);
            } else {
                obs = this.childService.addChild(this.child);
            }

            obs.subscribe({
                next: () => {
                    this.successMessage = this.isEditMode ? "Modifications enregistrées !" : "Enfant ajouté avec succès !";
                    this.isSubmitting = false;
                    setTimeout(() => {
                        this.router.navigate(['/mes-enfants']);
                    }, 1500);
                },
                error: (err) => {
                    console.error("Erreur complète:", err);
                    console.error("Status:", err.status);
                    console.error("Message:", err.message);
                    console.error("Error body:", err.error);
                    this.isSubmitting = false;
                    alert(`Erreur lors de l'ajout: ${err.error?.message || err.message || 'Erreur inconnue'}`);
                }
            });
        }
    }
}

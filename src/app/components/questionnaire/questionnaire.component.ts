import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContextService } from '../../services/context.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-questionnaire',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './questionnaire.component.html',
    styleUrls: ['./questionnaire.component.css']
})
export class QuestionnaireComponent implements OnInit {
    currentLang: 'fr' | 'ar' = 'fr';
    currentStep: number = 1;
    totalSteps: number = 4;

    formData: any = {
        q_nom: '',
        q_age: null,
        q_niveau: '',
        // Section 1 - Résultats scolaires
        q_moyenne: null,
        q_math: null,
        q_science: null,
        q_anglais: null,
        q_lecture_ar: null,
        q_prod_ar: null,
        q_dessin_musique: null,
        q_eps: null,
        q_lecture_fr: null,
        q_prod_fr: null,
        q_obs: '',
        q_lecture_attachement: null, // 0 ou 1
        q_lecture_activites: null,   // 0-3
        // Section 2 - Comportement
        q_punitions: null,           // 0-5
        q_rel_enseignant: null,      // 0-5
        q_rel_camarades: null,       // 0-5
        q_comportement_gen: null,    // 0-5
        q_responsable_objets: '',    // oui/non
        q_pedopsychiatre: '',        // oui/non
        q_interets: '',
        // Section 3 - Biographie
        q_rang_famille: null,
        q_qualite_rel_famille: null, // 0-5
        q_situation_familiale: '',   // Stable/Divorcés/Séparés
        q_comportement: ''           // Legacy field
    };

    constructor(
        private contextService: ContextService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const user = this.authService.getCurrentUser();
        if (user) {
            this.contextService.loadProfileForUser(user.id);
            const existing = this.contextService.getChildProfile();
            if (existing) {
                this.formData = { ...this.formData, ...existing };
            }
        }
    }

    resetForm(): void {
        this.formData = {
            q_nom: '',
            q_age: null,
            q_niveau: '',
            q_moyenne: null,
            q_math: null,
            q_science: null,
            q_anglais: null,
            q_lecture_ar: null,
            q_prod_ar: null,
            q_dessin_musique: null,
            q_eps: null,
            q_lecture_fr: null,
            q_prod_fr: null,
            q_obs: '',
            q_lecture_attachement: null,
            q_lecture_activites: null,
            q_punitions: null,
            q_rel_enseignant: null,
            q_rel_camarades: null,
            q_comportement_gen: null,
            q_responsable_objets: '',
            q_pedopsychiatre: '',
            q_interets: '',
            q_rang_famille: null,
            q_qualite_rel_famille: null,
            q_situation_familiale: '',
            q_comportement: ''
        };
    }

    nextStep(): void {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            window.scrollTo(0, 0);
        }
    }

    prevStep(): void {
        if (this.currentStep > 1) {
            this.currentStep--;
            window.scrollTo(0, 0);
        }
    }

    goToStep(step: number): void {
        this.currentStep = step;
        window.scrollTo(0, 0);
    }

    getAnsweredCount(): number {
        const fields = Object.values(this.formData);
        return fields.filter(v => v !== null && v !== '' && v !== undefined).length;
    }

    getTotalQuestions(): number {
        return Object.keys(this.formData).length;
    }

    toggleLanguage(): void {
        this.currentLang = this.currentLang === 'fr' ? 'ar' : 'fr';
    }

    onSubmit(): void {
        // Validation du nom de l'enfant
        if (!this.formData.q_nom || this.formData.q_nom.trim() === '') {
            alert(this.currentLang === 'fr'
                ? 'Veuillez saisir le nom de l\'enfant.'
                : 'يرجى إدخال اسم الطفل');
            return;
        }

        // Validation de l'âge (Strictement entre 5 et 15 ans)
        if (this.formData.q_age === null || this.formData.q_age < 5 || this.formData.q_age > 15) {
            alert(this.currentLang === 'fr'
                ? 'L\'âge doit être compris strictement entre 5 et 15 ans.'
                : 'يجب أن يكون العمر بين 5 و15 سنة');
            return;
        }

        // Validation des notes s'il y en a
        const grades = [
            this.formData.q_moyenne, this.formData.q_math, this.formData.q_science, this.formData.q_anglais,
            this.formData.q_lecture_ar, this.formData.q_prod_ar, this.formData.q_lecture_fr, this.formData.q_prod_fr
        ];

        for (const grade of grades) {
            if (grade !== null && (grade < 0 || grade > 20)) {
                alert(this.currentLang === 'fr'
                    ? 'Les notes doivent être comprises entre 0 et 20.'
                    : 'يجب أن تكون الملاحظات بين 0 و 20');
                return;
            }
        }

        const user = this.authService.getCurrentUser();
        if (user) {

            console.log('📝 Saving Child Profile (Questionnaire Data):', this.formData);
            this.contextService.updateChildProfile(this.formData, user.id);

            const childName = this.formData.q_nom;
            alert(this.currentLang === 'fr'
                ? `Profil de ${childName} enregistré avec succès ! L'assistant va analyser ses besoins.`
                : `تم تسجيل ملف ${childName} بنجاح! سيقوم المساعد بتحليل احتياجاته.`);

            this.router.navigate(['/chat']);
        } else {
            alert(this.currentLang === 'fr' ? 'Erreur: Utilisateur non connecté' : 'خطأ: المستخدم غير متصل');
        }
    }
}

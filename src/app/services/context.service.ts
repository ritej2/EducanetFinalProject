import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

/**
 * Interface representing the processed child profile used for AI context.
 * Kept for compatibility with HomeworkService.
 */
export interface ChildProfile {
    niveauScolaire: string;
    matieresEnDifficulte: string[]; // Support multiple subjects
    pointsAAmeliorer: string;
    // Raw fields for API calls
    rawNiveau?: string;
    rawMatiere?: string;
    rawDifficulte?: string;
    q_nom?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ContextService {
    private childProfileSubject = new BehaviorSubject<any[]>([]);
    public childProfile$ = this.childProfileSubject.asObservable();
    private isBrowser: boolean;

    constructor(
        @Inject(PLATFORM_ID) platformId: Object
        // Ideally we would inject AuthService here, but that causes a circular dependency.
        // Instead, we will pass the userId when updating/loading.
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        // We defer loading to when we have a user context, or we rely on the component to pass the user ID.
    }

    private getStorageKey(userId: number | string): string {
        return `child_profile_${userId}`;
    }

    loadProfileForUser(userId: number): void {
        if (this.isBrowser) {
            const savedProfile = localStorage.getItem(this.getStorageKey(userId));
            if (savedProfile) {
                try {
                    const data = JSON.parse(savedProfile);
                    this.childProfileSubject.next(Array.isArray(data) ? data : [data]);
                } catch (e) {
                    console.error('Error parsing saved child profile', e);
                    this.childProfileSubject.next([]);
                }
            } else {
                this.childProfileSubject.next([]);
            }
        }
    }

    clearProfile(): void {
        this.childProfileSubject.next([]);
    }

    /**
     * Processes raw questionnaire data (Legacy/Mock adapter)
     */
    setProfileFromForm(rawData: any, userId?: number): void {
        this.updateChildProfile(rawData, userId);
    }

    updateChildProfile(profile: any, userId?: number): void {
        const cleanProfile = this.filterEmptyFields(profile);
        const currentProfiles = this.childProfileSubject.value;

        let updatedProfiles: any[];
        // Si on a un nom, on essaie de mettre à jour l'enfant existant
        if (cleanProfile.q_nom) {
            const index = currentProfiles.findIndex(p => p.q_nom === cleanProfile.q_nom);
            if (index !== -1) {
                updatedProfiles = [...currentProfiles];
                updatedProfiles[index] = cleanProfile;
            } else {
                updatedProfiles = [...currentProfiles, cleanProfile];
            }
        } else {
            // Sinon on remplace tout (legacy)
            updatedProfiles = [cleanProfile];
        }

        this.childProfileSubject.next(updatedProfiles);

        if (this.isBrowser && userId) {
            console.log('💾 Profile Updated in Storage for User:', userId);
            console.log('📂 Current Profiles:', updatedProfiles);
            localStorage.setItem(this.getStorageKey(userId), JSON.stringify(updatedProfiles));
        }

    }

    private filterEmptyFields(obj: any): any {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        return Object.keys(obj).reduce((acc: any, key: string) => {
            const value = obj[key];
            if (value !== null && value !== undefined && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {});
    }

    getChildProfile(): any {
        const profiles = this.childProfileSubject.value;
        return profiles.length > 0 ? profiles[profiles.length - 1] : null;
    }

    getAllProfiles(): any[] {
        return this.childProfileSubject.value;
    }

    /**
     * Adapter: Returns a compatible ChildProfile for the HomeworkService.
     * Maps the new "Questionnaire" data (q_niveau, etc.) to the old format.
     */
    getProfile(): ChildProfile | null {
        const p = this.getChildProfile();
        if (!p) return null;
        return this.formatChildSummary(p);
    }

    public formatChildSummary(p: any): ChildProfile {
        const analysis = this.analyzeSingleProfile(p);
        const matieres = (analysis?.matieres_a_renforcer && analysis.matieres_a_renforcer.length > 0)
            ? analysis.matieres_a_renforcer
            : (p.q_matiere ? [p.q_matiere] : (p.matiere ? [p.matiere] : ['Général']));

        const niveau = p.q_niveau ? this.formatNiveau(p.q_niveau) : (p.niveau || '3ème année');

        return {
            niveauScolaire: niveau,
            matieresEnDifficulte: matieres,
            pointsAAmeliorer: p.q_obs || p.q_comportement || 'Aucune observation',
            rawNiveau: niveau,
            rawMatiere: matieres[0],
            rawDifficulte: (p.q_math ?? 20) < 12 ? 'Faible' : 'Normal',
            q_nom: p.q_nom || ''
        };
    }

    /**
     * For verification: Simulates receiving the mock data provided by the user.
     */
    simulateMockData(): void {
        const mockData = {
            "q_age": 8,
            "q_niveau": "4", // CE1/CE2 approx
            "q_math": 8, // Faible en math -> devrait déclencher la recherche Math
            "q_science": 14,
            "q_anglais": 12,
            "q_obs": "Manque de concentration"
        };
        this.updateChildProfile(mockData);
    }

    formatNiveau(val: string): string {
        const niveaux: { [key: string]: string } = {
            '0': 'Maternelle',
            '1': '1ère année',
            '2': '2ème année',
            '3': '3ème année',
            '4': '4ème année',
            '5': '5ème année',
            '6': '6ème année',
            '7': '7ème année',
            '8': '8ème année',
            '9': '9ème année'
        };
        return niveaux[val] || val;
    }

    analyzeProfile(): any {
        const profile = this.getChildProfile();
        if (!profile) return null;
        return this.analyzeSingleProfile(profile);
    }

    private analyzeSingleProfile(profile: any): any {
        // Support both old keys (math) and new keys (q_math) if needed, but prioritizing new
        const getScore = (key: string) => profile[key] !== undefined ? Number(profile[key]) : undefined;

        const subjects = [
            { id: 'math', name: 'Mathématiques', score: getScore('q_math') },
            { id: 'science', name: 'Éveil scientifique', score: getScore('q_science') },
            { id: 'anglais', name: 'Anglais', score: getScore('q_anglais') },
            { id: 'lecture_ar', name: 'Lecture Arabe', score: getScore('q_lecture_ar') },
            { id: 'prod_ar', name: 'Production Arabe', score: getScore('q_prod_ar') },
            { id: 'dessin_musique', name: 'Dessin/Musique', score: getScore('q_dessin_musique') },
            { id: 'eps', name: 'Education Physique', score: getScore('q_eps') },
            { id: 'lecture_fr', name: 'Lecture Français', score: getScore('q_lecture_fr') },
            { id: 'prod_fr', name: 'Production Français', score: getScore('q_prod_fr') }
        ];

        // Identifier les matières nécessitant un renforcement (score < 12)
        const weakSubjects = subjects
            .filter(s => s.score !== undefined && s.score !== null && s.score < 12)
            .map(s => s.name);

        return {
            niveau_scolaire: profile.q_niveau ? this.formatNiveau(profile.q_niveau) : '',
            matieres_a_renforcer: weakSubjects,
            besoin_aide: weakSubjects.length > 0
        };
    }

    hasData(): boolean {
        const profile = this.getChildProfile();
        return profile && Object.keys(profile).length > 0;
    }

    /**
     * Retourne un JSON propre et léger pour le chatbot.
     */
    getAnalysisJSON(): string {
        const allProfiles = this.getAllProfiles();
        const analyses = allProfiles.map(p => ({
            donnees_parents: p,
            analyse_automatique: this.analyzeSingleProfile(p)
        }));

        return JSON.stringify({
            enfants: analyses
        }, null, 2);
    }
}

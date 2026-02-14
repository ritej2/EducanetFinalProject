import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipService } from '../../services/tip.service';
import { Tip } from '../../models/app.models';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-conseils',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './conseils.component.html',
    styleUrls: ['./conseils.component.css']
})
export class ConseilsComponent implements OnInit {
    categories = [
        { id: 'all', name: 'Tous', icon: '✨' },
        { id: 'sante', name: 'Santé', icon: '💉' },
        { id: 'alimentation', name: 'Alimentation', icon: '🥗' },
        { id: 'sommeil', name: 'Sommeil', icon: '😴' },
        { id: 'education', name: 'Éducation', icon: '📚' },
        { id: 'developpement', name: 'Développement', icon: '🎨' },
        { id: 'securite', name: 'Sécurité', icon: '🏠' }
    ];

    tips: Tip[] = [];
    filteredTips: Tip[] = [];
    selectedCategory = 'all';
    loading = true;

    // Admin State
    isAdmin = false;
    showModal = false;
    isEditing = false;
    currentTip: Tip = this.getEmptyTip();

    constructor(
        private tipService: TipService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.isAdmin = this.authService.isAdmin();
        this.loadTips();
    }

    loadTips(): void {
        this.loading = true;
        this.tipService.getTips().subscribe({
            next: (data) => {
                this.tips = data;
                this.filterByCategory(this.selectedCategory);
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading tips', err);
                this.loading = false;
            }
        });
    }

    filterByCategory(category: string): void {
        this.selectedCategory = category;
        if (category === 'all') {
            this.filteredTips = [...this.tips];
        } else {
            this.filteredTips = this.tips.filter(tip => tip.category === category);
        }
    }

    getGradientClass(color: string): string {
        return color;
    }

    // Admin Actions
    openAddModal(): void {
        this.isEditing = false;
        this.currentTip = this.getEmptyTip();
        this.showModal = true;
    }

    openEditModal(tip: Tip): void {
        this.isEditing = true;
        this.currentTip = { ...tip };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
    }

    getEmptyTip(): Tip {
        return {
            category: 'sante',
            title: '',
            description: '',
            icon: 'lightbulb',
            color: 'gradient-sante-1'
        };
    }

    saveTip(): void {
        if (this.isEditing && this.currentTip.id) {
            this.tipService.updateTip(this.currentTip.id, this.currentTip).subscribe({
                next: () => {
                    this.loadTips();
                    this.closeModal();
                },
                error: (err) => console.error('Error updating tip', err)
            });
        } else {
            this.tipService.createTip(this.currentTip).subscribe({
                next: () => {
                    this.loadTips();
                    this.closeModal();
                },
                error: (err) => console.error('Error creating tip', err)
            });
        }
    }

    deleteTip(id: number | undefined): void {
        if (!id) return;
        if (confirm('Êtes-vous sûr de vouloir supprimer cette astuce ?')) {
            this.tipService.deleteTip(id).subscribe({
                next: () => this.loadTips(),
                error: (err) => console.error('Error deleting tip', err)
            });
        }
    }
}


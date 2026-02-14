import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserDetails } from '../../../services/admin.service';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
    users: any[] = [];
    filteredUsers: any[] = [];
    searchTerm: string = '';
    selectedUser: UserDetails | null = null;
    selectedUserId: number | null = null;
    showSidePanel: boolean = false;
    isAddingUser: boolean = false;
    loadingDetails: boolean = false;
    newUser = { name: '', email: '', password: '', role: 'user', phone: '' };

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.adminService.getUsers().subscribe({
            next: (res) => {
                if (res.success) {
                    // Force boolean cast for is_active which might come as "1"/"0" string from PHP
                    this.users = res.data.map(u => ({
                        ...u,
                        is_active: (u.is_active == 1 || u.is_active === '1' || u.is_active === true)
                    }));
                    this.filteredUsers = this.users;
                }
            }
        });
    }

    onSearch() {
        if (!this.searchTerm) {
            this.filteredUsers = this.users;
            return;
        }
        const term = this.searchTerm.toLowerCase();
        this.filteredUsers = this.users.filter(u =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term)
        );
    }

    toggleStatus(user: any, event: Event) {
        event.stopPropagation();
        const newStatus = !user.is_active;
        this.adminService.toggleUserStatus(user.id, newStatus).subscribe({
            next: (res) => {
                user.is_active = newStatus;
            }
        });
    }

    // Basculer vers l'affichage du formulaire d'ajout
    showAddUserForm() {
        this.isAddingUser = true;
        this.selectedUser = null; // Désélectionner l'utilisateur courant
        this.selectedUserId = null;
        this.newUser = { name: '', email: '', password: '', role: 'user', phone: '' };
    }

    // Annuler l'ajout
    cancelAddUser() {
        this.isAddingUser = false;
        this.newUser = { name: '', email: '', password: '', role: 'user', phone: '' };
    }

    handleAddUser() {
        this.adminService.addUser(this.newUser).subscribe({
            next: (res) => {
                this.loadUsers();
                this.cancelAddUser(); // Revenir à l'état initial
            }
        });
    }

    viewDetails(userId: number) {
        this.isAddingUser = false;
        this.showSidePanel = true;
        this.loadingDetails = true;
        this.selectedUser = null;
        this.selectedUserId = userId;

        this.adminService.getUserDetails(userId).subscribe({
            next: (user) => {
                if (user) {
                    this.selectedUser = user;
                } else {
                    console.error('User not found');
                }
                this.loadingDetails = false;
            },
            error: (err) => {
                console.error(err);
                this.loadingDetails = false;
            }
        });
    }



    closePanel() {
        this.selectedUserId = null;
        this.showSidePanel = false;
        setTimeout(() => this.selectedUser = null, 300);
    }

    deleteUser(userId: number, event: Event) {
        event.stopPropagation();
        if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
            this.adminService.deleteUser(userId).subscribe({
                next: (res) => {
                    this.loadUsers();
                    if (this.selectedUser?.profile.id === userId) {
                        this.closePanel();
                    }
                }
            });
        }
    }
}

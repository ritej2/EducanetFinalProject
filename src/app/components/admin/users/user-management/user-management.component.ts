import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AdminService } from '../../../../services/admin.service';
import { environment } from '../../../../../environments/environment';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface UserDetails {
  user: User;
  children: any[];
  stats: {
    children_count: number;
    conversation_count: number;
  }
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  searchTerm: string = '';
  loading = false;
  error = '';
  selectedUser: UserDetails | null = null;
  loadingDetails = false;
  private apiUrl = environment.PHP_API_URL;

  constructor(
    private http: HttpClient,
    private adminService: AdminService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  get filteredUsers(): User[] {
    const nonAdmins = this.users.filter(user => user.role !== 'admin');

    if (!this.searchTerm) {
      return nonAdmins;
    }

    const term = this.searchTerm.toLowerCase();
    return nonAdmins.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }

  loadUsers(): void {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/admin/users.php`).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.users = response.data;
        } else {
          this.error = response.message || 'Erreur lors du chargement des utilisateurs';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = `Erreur réseau: ${err.status} - ${err.message}`;
      }
    });
  }

  viewDetails(id: number): void {
    this.loadingDetails = true;
    this.selectedUser = null;
    this.http.get<any>(`${this.apiUrl}/admin/user_details.php?id=${id}`).subscribe({
      next: (response) => {
        this.loadingDetails = false;
        if (response.success) {
          this.selectedUser = response.data;
        }
      },
      error: () => {
        this.loadingDetails = false;
      }
    });
  }

  closeDetails(): void {
    this.selectedUser = null;
  }

  deleteUser(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    this.http.delete<any>(`${this.apiUrl}/admin/users.php?id=${id}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = this.users.filter(u => u.id !== id);
          if (this.selectedUser?.user.id === id) {
            this.selectedUser = null;
          }
        } else {
          alert(response.message);
        }
      },
      error: () => alert('Erreur lors de la suppression')
    });
  }
}

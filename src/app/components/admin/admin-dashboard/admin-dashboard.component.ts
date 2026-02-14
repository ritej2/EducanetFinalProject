import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminStatsComponent } from '../admin-stats/admin-stats.component';
import { UserManagementComponent } from '../user-management/user-management.component';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, AdminStatsComponent, UserManagementComponent],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent { }

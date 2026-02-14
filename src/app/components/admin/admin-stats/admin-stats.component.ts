import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminStats } from '../../../services/admin.service';

@Component({
    selector: 'app-admin-stats',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-stats.component.html',
    styleUrls: ['./admin-stats.component.css']
})
export class AdminStatsComponent implements OnInit {
    stats: AdminStats | null = null;
    loading = true;

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.adminService.getStats().subscribe({
            next: (response) => {
                if (response.success) {
                    this.stats = response.data;
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load stats', err);
                this.loading = false;
            }
        });
    }
}

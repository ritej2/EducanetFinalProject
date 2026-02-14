import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeworkService, Homework, HomeworkFile } from '../../services/homework.service';
import { Observable, map } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bibliotheque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bibliotheque-container">
      <div class="header-section">
        <h1 class="main-title">Ma Bibliothèque Éducative</h1>
        <p class="subtitle">Retrouvez tous les documents recommandés pour le parcours de votre enfant.</p>
      </div>

      <!-- Top Filtering Row -->
      <div class="top-filter-row" *ngIf="(documents$ | async) as allDocs">
        <div class="filter-row-container" *ngIf="allDocs.length > 0">
          
          <!-- Left: Search Bar (30%) -->
          <div class="search-section">
            <div class="filter-label"><i class="fa fa-search"></i> Recherche</div>
            <div class="search-box">
              <input 
                type="text" 
                class="search-input" 
                placeholder="Rechercher un document ou un enfant..." 
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange()"
              >
              <i class="fa fa-search search-icon"></i>
            </div>
          </div>

          <!-- Right: Subject Selection (70%) -->
          <div class="subject-picker-section">
            <div class="filter-label"><i class="fa fa-book"></i> Filtrer par matière</div>
            <div class="subject-pills">
              <button 
                *ngFor="let filter of filters" 
                class="subject-pill" 
                [class.active]="currentFilter === filter.value"
                (click)="setFilter(filter.value)"
              >
                <ng-container [ngSwitch]="filter.icon">
                  <div *ngSwitchCase="'eiffel'" class="custom-icon-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2L12 4M9 4L12 2L15 4M10 22V19C10 17.8954 10.8954 17 12 17C13.1046 17 14 17.8954 14 19V22M2 22L22 22M7 22L9 11L15 11L17 22M9 11L10 7L14 7L15 11"/>
                    </svg>
                  </div>
                  <div *ngSwitchCase="'bigben'" class="custom-icon-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="4" width="6" height="14" rx="1"/><path d="M12 2L12 4M9 4L12 2L15 4M12 18L12 22M8 22L16 22"/><circle cx="12" cy="8" r="1.5"/>
                    </svg>
                  </div>
                  <i *ngSwitchDefault [class]="filter.icon"></i>
                </ng-container>
                <span>{{ filter.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Full Width Content Area -->
      <div class="content-full-width">
        <div *ngIf="filteredDocuments$ | async as docs" class="content-area">
          
          <div class="empty-state" *ngIf="docs.length === 0">
            <div class="icon-circle">
              <i class="fa fa-search"></i>
            </div>
            <h2>Aucun document trouvé</h2>
            <p>Essayez de modifier votre recherche ou vos filtres.</p>
            <button class="btn-action" (click)="resetFilters()">Tout afficher</button>
          </div>

          <div class="child-sections" *ngIf="docs.length > 0">
            <div class="child-section" *ngFor="let group of getGroupedDocuments(docs)">
              <div class="child-header">
                <div class="child-avatar">
                  <i class="fa fa-child"></i>
                </div>
                <div class="child-info">
                  <h2 class="child-name">{{ group.name }}</h2>
                  <div class="child-meta">
                    <span class="meta-item"><i class="fa fa-graduation-cap"></i> {{ group.level }}</span>
                    <span class="meta-item"><i class="fa fa-book-open"></i> {{ group.subjects.join(', ') }}</span>
                  </div>
                </div>
              </div>

              <div class="documents-grid">
                <div class="doc-card" *ngFor="let doc of group.documents">
                  <button class="delete-icon" (click)="deleteDocument(doc.id, doc.childName)" title="Supprimer">
                    <i class="fa fa-times"></i>
                  </button>
                  <div class="card-content">
                    <div class="card-header">
                      <span class="subject-badge">{{ doc.subject || 'Général' }}</span>
                      <span class="date-badge" *ngIf="doc.addedAt">
                        <i class="fa fa-calendar-alt"></i> {{ doc.addedAt | date:'dd/MM/yyyy' }}
                      </span>
                    </div>
                    
                    <h3 class="doc-title">{{ doc.title }}</h3>
                    
                    <div class="files-container">
                      <div class="file-row" *ngFor="let file of doc.files">
                        <div class="file-info" (click)="download(file)" style="cursor: pointer;">
                          <div class="file-icon">
                            <i class="fa fa-file-pdf"></i>
                          </div>
                          <span class="file-name">{{ file.nom }}</span>
                        </div>
                        <button class="download-trigger" (click)="download(file)">
                          <i class="fa fa-cloud-download-alt"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="section-divider"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');

    :host {
      display: block;
      font-family: 'Outfit', sans-serif;
      --primary: #6366f1;
      --primary-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      --bg-color: #f8fafc;
      --card-bg: rgba(255, 255, 255, 0.8);
    }

    .bibliotheque-container {
      padding: 40px 24px;
      min-height: 100vh;
      background: var(--bg-color);
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.1) 0, transparent 50%), 
        radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.1) 0, transparent 50%);
    }

    .top-filter-row {
      max-width: 1400px;
      margin: 0 auto 40px;
      padding: 0 24px;
    }

    .filter-row-container {
      display: flex;
      gap: 24px;
      background: white;
      padding: 24px;
      border-radius: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.03);
      border: 1px solid rgba(255,255,255,0.8);
      backdrop-filter: blur(10px);
    }

    .search-section {
      flex: 0 0 30%;
      border-right: 1px solid #f1f5f9;
      padding-right: 24px;
    }

    .search-box {
      position: relative;
      width: 100%;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px 12px 40px;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      color: #1e293b;
      transition: all 0.2s;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    .subject-picker-section {
      flex: 1;
      padding-left: 10px;
    }

    .filter-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-label i {
      color: var(--primary);
    }

    .subject-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .subject-pill {
      padding: 8px 16px;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .subject-pill:hover {
      border-color: var(--primary);
      color: var(--primary);
      background: rgba(99, 102, 241, 0.05);
    }

    .subject-pill.active {
      background: var(--primary-gradient);
      color: white;
      border-color: transparent;
      box-shadow: 0 8px 15px rgba(99, 102, 241, 0.2);
      transform: translateY(-2px);
    }

    .custom-icon-pill {
      width: 18px;
      height: 18px;
    }

    .custom-icon-pill svg {
      width: 100%; height: 100%; stroke: currentColor;
    }

    .content-full-width {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .header-section {
      text-align: center;
      margin-bottom: 50px;
    }

    .main-title {
      font-size: 2.8rem;
      font-weight: 700;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
    }

    .subtitle {
      color: #64748b;
      font-size: 1.1rem;
    }

    /* Sections Style */
    .child-section {
      margin-bottom: 60px;
    }

    .child-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      padding: 0 10px;
    }

    .child-avatar {
      width: 60px;
      height: 60px;
      background: var(--primary-gradient);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      box-shadow: 0 10px 15px rgba(99, 102, 241, 0.2);
    }

    .child-name {
      font-size: 1.8rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .child-meta {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .meta-item {
      color: #64748b;
      font-size: 0.95rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .meta-item i {
      color: var(--primary);
    }

    .section-divider {
      margin-top: 50px;
      border-bottom: 2px dashed #e2e8f0;
      max-width: 200px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Grid Layout */
    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 30px;
      margin: 0 auto;
    }

    /* Card Design */
    .doc-card {
      position: relative;
      border-radius: 24px;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 1px solid rgba(255,255,255,0.4);
      background: var(--card-bg);
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
    }

    .doc-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.2);
    }

    .delete-icon {
      position: absolute;
      top: 15px;
      right: 15px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: all 0.2s;
      opacity: 0;
    }

    .doc-card:hover .delete-icon {
      opacity: 1;
    }

    .delete-icon:hover {
      background: #ef4444;
      color: white;
      transform: scale(1.1);
    }

    .card-content {
      position: relative;
      z-index: 2;
      padding: 24px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .subject-badge {
      padding: 6px 14px;
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary);
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .date-badge {
      color: #94a3b8;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .doc-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 12px;
      line-height: 1.3;
    }

    /* Files Section */
    .files-container {
      border-top: 1px solid rgba(0,0,0,0.05);
      padding-top: 20px;
    }

    .file-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: rgba(255,255,255,0.5);
      border-radius: 16px;
      margin-bottom: 10px;
      transition: background 0.2s;
    }

    .file-row:hover {
      background: white;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-icon {
      width: 36px;
      height: 36px;
      background: #fee2e2;
      color: #ef4444;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .file-name {
      font-weight: 500;
      color: #475569;
      font-size: 0.9rem;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .download-trigger {
      width: 36px;
      height: 36px;
      border: none;
      background: #f1f5f9;
      color: #64748b;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .download-trigger:hover {
      background: var(--primary);
      color: white;
      transform: scale(1.1);
    }

    /* Empty State */
    .empty-state {
      max-width: 500px;
      margin: 100px auto;
      text-align: center;
      padding: 60px 40px;
      background: white;
      border-radius: 32px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.05);
    }

    .empty-state .icon-circle {
      width: 100px;
      height: 100px;
      background: var(--primary-gradient);
      color: white;
      font-size: 40px;
      margin: 0 auto 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
    }

    .btn-action {
      margin-top: 30px;
      padding: 14px 28px;
      background: var(--primary-gradient);
      color: white;
      border: none;
      border-radius: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 10px 15px rgba(99, 102, 241, 0.2);
      transition: all 0.2s;
    }

    .btn-action:hover {
      transform: scale(1.05);
      box-shadow: 0 15px 25px rgba(99, 102, 241, 0.3);
    }
  `]
})
export class BibliothequeComponent implements OnInit {
  documents$: Observable<Homework[]>;
  filteredDocuments$: Observable<Homework[]>;

  currentFilter: string = 'all';
  searchQuery: string = '';

  filters = [
    { label: 'Toutes', value: 'all', icon: 'fa fa-th-large' },
    { label: 'Mathématiques', value: 'mathematiques', icon: 'fa fa-calculator' },
    { label: 'Français', value: 'francais', icon: 'eiffel' },
    { label: 'Anglais', value: 'anglais', icon: 'bigben' },
    { label: 'Arabe', value: 'arabe', icon: 'fa fa-pen-nib' },
    { label: 'Éveil', value: 'eveil scientifique', icon: 'fa fa-flask' }
  ];

  constructor(private homeworkService: HomeworkService, private router: Router) {
    // Note: We need to use shareReplay or similar if we want to avoid multiple HTTP calls, 
    // but for now relying on service behavior is fine.
    this.documents$ = this.homeworkService.recommendedDocuments$;
    this.filteredDocuments$ = this.documents$;
  }

  ngOnInit(): void { }

  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredDocuments$ = this.documents$.pipe(
      map(docs => docs.filter(doc => {
        // Search Filter (Title or Child Name)
        const query = this.searchQuery.toLowerCase().trim();
        const titleMatch = !query ||
          (doc.title && doc.title.toLowerCase().includes(query)) ||
          (doc.childName && doc.childName.toLowerCase().includes(query));

        // Subject Filter
        const subject = (doc.subject || '').toLowerCase();
        const subjectMatch = this.currentFilter === 'all' ||
          subject.includes(this.currentFilter) ||
          this.currentFilter.includes(subject);

        return titleMatch && subjectMatch;
      }))
    );
  }

  // Helper kept for grid grouping, but filtering is now more general
  getGroupedDocuments(docs: Homework[]): { name: string, level: string, subjects: string[], documents: Homework[] }[] {
    const groups: { [key: string]: { level: string, subjects: Set<string>, documents: Homework[] } } = {};

    docs.forEach(doc => {
      const name = doc.childName || 'Enfant';
      if (!groups[name]) {
        groups[name] = {
          level: doc.childLevel || 'Niveau inconnu',
          subjects: new Set<string>(),
          documents: []
        };
      }
      groups[name].documents.push(doc);

      if (doc.targetSubjects) {
        doc.targetSubjects.forEach(s => groups[name].subjects.add(s));
      }
      if (doc.subject) groups[name].subjects.add(doc.subject);
    });

    return Object.keys(groups).map(name => ({
      name,
      level: groups[name].level,
      subjects: Array.from(groups[name].subjects).map(s =>
        s.charAt(0).toUpperCase() + s.slice(1)
      ),
      documents: groups[name].documents
    }));
  }

  goToQuestionnaire(): void {
    this.router.navigate(['/questionnaire']);
  }

  deleteDocument(id: number, childName?: string): void {
    if (confirm('Voulez-vous vraiment supprimer ce document ?')) {
      this.homeworkService.removeDocument(id, childName || 'Enfant');
    }
  }

  download(file: HomeworkFile): void {
    this.homeworkService.downloadFile(file).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}

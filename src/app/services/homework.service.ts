import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, forkJoin } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { ChildProfile } from './context.service';
import { environment } from '../../environments/environment';

export interface HomeworkFile {
  fileName: string;
  nom: string;
  fileId: number;
  path?: string; // Original server path if needed
  downloadUrl?: string; // URL pour télécharger via download.php
}

export interface Homework {
  id: number;
  title: string;
  files: HomeworkFile[];
  description?: string;
  subject?: string;
  addedAt?: Date;
  childName?: string;
  childLevel?: string;
  targetSubjects?: string[]; // NEW: Liste des matières ciblées
}

export interface SearchResponse {
  results: {
    homeWork: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class HomeworkService {

  // Bibliothèque personnelle (BehaviorSubject)
  private recommendedDocumentsSubject = new BehaviorSubject<Homework[]>([]);
  public recommendedDocuments$ = this.recommendedDocumentsSubject.asObservable();
  private deletedDocumentIds: Set<number> = new Set();
  private currentUserId: number | null = null;

  private subjectKeywords: { [key: string]: string[] } = {
    'mathematiques': ['math', 'رياضيات'],
    'eveil scientifique': ['science', 'عوم', 'ايقاظ', 'physique', 'chimie'],
    'anglais': ['anglais', 'انقلزية', 'english', 'انجليزية'],
    'francais': ['francais', 'فرنسية', 'french'],
    'arabe': ['arabe', 'عربية']
  };

  private getStorageKey(userId: number): string {
    return `user_library_${userId}`;
  }

  private getBlacklistKey(userId: number): string {
    return `user_library_blacklist_${userId}`;
  }

  // Normalisation des chaînes pour comparaison robuste
  private normalize(str: string): string {
    if (!str) return '';
    return str.toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  /**
   * Charge la bibliothèque pour un utilisateur spécifique
   */
  loadLibrary(userId: number): void {
    this.currentUserId = userId;

    // Load documents
    const saved = localStorage.getItem(this.getStorageKey(userId));
    if (saved) {
      try {
        this.recommendedDocumentsSubject.next(JSON.parse(saved));
      } catch (e) {
        console.error('Erreur chargement bibliothèque', e);
        this.recommendedDocumentsSubject.next([]);
      }
    } else {
      this.recommendedDocumentsSubject.next([]);
    }

    // Load blacklist
    const savedBlacklist = localStorage.getItem(this.getBlacklistKey(userId));
    if (savedBlacklist) {
      try {
        const ids = JSON.parse(savedBlacklist);
        this.deletedDocumentIds = new Set(ids.map((id: any) => Number(id)));
      } catch (e) {
        console.error('Erreur chargement blacklist', e);
        this.deletedDocumentIds = new Set();
      }
    } else {
      this.deletedDocumentIds = new Set();
    }
  }

  /**
   * Vide la bibliothèque (déconnexion)
   */
  clearLibrary(): void {
    this.currentUserId = null;
    this.recommendedDocumentsSubject.next([]);
    this.deletedDocumentIds = new Set();
  }

  // Mapping niveau scolaire → levelId API (Standard Rafi9ni)
  private levelMapping: { [key: string]: number } = {
    '1ère année': 3, 'CP': 3,
    '2ème année': 4, 'CE1': 4,
    '3ème année': 5, 'CE2': 5,
    '4ème année': 6, 'CM1': 6,
    '5ème année': 7, 'CM2': 7,
    '6ème année': 8, '6ème': 8,
    '7ème année': 9, '7ème': 9,
    '8ème année': 10, '8ème': 10,
    '9ème année': 11, '9ème': 11,
    'prepa': 30, 'prépa': 30
  };

  constructor(private http: HttpClient) { }

  // Suppression d'un document spécifique d'un enfant
  removeDocument(id: number, childName: string): void {
    // 1. Add to blacklist to prevent re-adding
    this.deletedDocumentIds.add(Number(id));
    if (this.currentUserId) {
      localStorage.setItem(
        this.getBlacklistKey(this.currentUserId),
        JSON.stringify(Array.from(this.deletedDocumentIds))
      );
    }

    // 2. Remove from current list
    const current = this.recommendedDocumentsSubject.value;
    const updated = current.filter(d => !(d.id === id && d.childName === childName));
    this.setDocuments(updated);
  }

  // Écrase la bibliothèque actuelle (utilisé pour suppression ou chargement initial complet)
  private setDocuments(docs: Homework[]): void {
    this.recommendedDocumentsSubject.next(docs);
    if (this.currentUserId) {
      localStorage.setItem(this.getStorageKey(this.currentUserId), JSON.stringify(docs));
    }
  }

  // Ajoute de nouveaux documents en évitant les doublons
  mergeNewDocuments(docs: Homework[]): void {
    const current = this.recommendedDocumentsSubject.value;

    // 1. Dédupliquer la liste d'entrée elle-même
    const uniqueInput = docs.filter((d, index) =>
      docs.findIndex(od => od.id === d.id) === index
    );

    // 2. Filtrer par rapport à l'existant ET à la blacklist
    const newDocs = uniqueInput.filter(d => {
      // Vérifier la blacklist d'abord (en s'assurant que l'ID est un nombre)
      if (this.deletedDocumentIds.has(Number(d.id))) return false;

      const isDuplicate = current.some(c => {
        const sameChild = c.childName === d.childName;
        const sameId = c.id === d.id;
        const sameTitle = c.title === d.title;
        // Si même titre et mêmes fichiers pour le même enfant, c'est un doublon
        const sameFiles = c.files.length === d.files.length &&
          c.files.every(f => d.files.some(df => df.fileName === f.fileName));

        return sameChild && (sameId || (sameTitle && sameFiles));
      });
      return !isDuplicate;
    });

    if (newDocs.length === 0) return;

    const updated = [...current, ...newDocs];
    this.setDocuments(updated);
  }

  /**
   * 🔹 Flux principal :
   * 1️⃣ Appelle API 1 (SearchHomework) pour récupérer les devoirs
   * 2️⃣ Pour chaque devoir, appelle API 2 (GetHomeworkDetail) pour récupérer les fichiers
   * 3️⃣ Génère downloadUrl pour chaque fichier
   * 4️⃣ Met à jour la bibliothèque personnelle
   */
  performSearch(profile: ChildProfile): void {
    this.searchHomework(profile).pipe(
      map((res: any) => res.results?.homeWork || []),
      switchMap((homeWorks: any[]) => {
        if (!homeWorks.length) return of([]);

        // Filtrer les devoirs correspondant à TOUTES les matières en difficulté
        const rawTargetSubjects = profile.matieresEnDifficulte.map(s => this.normalize(s));
        const targetKeywords: string[] = [];
        rawTargetSubjects.forEach(s => {
          targetKeywords.push(s);
          if (this.subjectKeywords[s]) {
            targetKeywords.push(...this.subjectKeywords[s]);
          }
        });

        const currentYear = profile.niveauScolaire.split(' ')[0]; // "8ème" from "8ème année"

        const matchedHomeworks = targetKeywords.length > 0
          ? homeWorks.filter((h: any) => {
            const hName = this.normalize(h.name || '');
            const cName = this.normalize(h.courseName || '');

            // Exclusion stricte : si le titre contient une autre année (ex: "سنة أولى" alors qu'on est en "ثامنة")
            const otherYears = [
              { key: '1ere', match: 'أولى' },
              { key: '2eme', match: 'ثانية' },
              { key: '3eme', match: 'ثالثة' },
              { key: '4eme', match: 'رابعة' },
              { key: '5eme', match: 'خامسة' },
              { key: '6eme', match: 'سادسة' },
              { key: '7eme', match: 'سابعة' },
              { key: '8eme', match: 'ثامنة' },
              { key: '9eme', match: 'تاسعة' },
              { key: 'prepa', match: 'تحضيرية' }
            ];

            const normalizedNiveau = this.normalize(profile.niveauScolaire);
            const currentYearArabic = otherYears.find(y => normalizedNiveau.includes(y.key))?.match;

            // Si le titre mentionne une année arabe qui n'est PAS la nôtre, on rejette
            const mentionsWrongYear = otherYears.some(y =>
              (hName.includes(y.match) || cName.includes(y.match)) &&
              y.match !== currentYearArabic
            );

            if (mentionsWrongYear && currentYearArabic) return false;

            return targetKeywords.some(s => {
              // Correspondance robuste
              const sShort = s.length > 4 ? s.substring(0, 4) : s;
              return hName.includes(s) || s.includes(hName) ||
                hName.includes(sShort) || cName.includes(sShort);
            });
          })
          : homeWorks;

        // Appel API 2 pour récupérer les fichiers
        const detailCalls: Observable<Homework>[] = matchedHomeworks.map((hw: any) =>
          this.getHomeworkDetail(hw.id).pipe(
            map((detail: any) => {
              const hwDetail = detail.homeWork || detail;
              const files: HomeworkFile[] = (hwDetail.homeworkfiles?.fileEducanet || []).map((f: any) => {
                const fileName = f.fileName;
                const serverPath = f.path || '';

                // On repasse par download.php (Pont CORS)
                // C'est PHP qui ira chercher le fichier sur le serveur distant
                const finalDownloadUrl = `/api/php/download.php?fileName=${encodeURIComponent(fileName)}&path=${encodeURIComponent(serverPath)}`;

                return {
                  nom: f.title || fileName,
                  fileId: f.id,
                  fileName: fileName,
                  path: serverPath,
                  downloadUrl: finalDownloadUrl
                };
              });

              // Détecter quelle matière a matché précisément si courseName est vide
              let detectedSubject = hwDetail.courseName;
              if (!detectedSubject) {
                const hName = this.normalize(hwDetail.name || hwDetail.titre || hw.name || '');
                detectedSubject = rawTargetSubjects.find(subject => {
                  const keywords = [subject, ...(this.subjectKeywords[subject] || [])];
                  return keywords.some(kw => {
                    const kwNorm = this.normalize(kw);
                    const kwShort = kwNorm.length > 4 ? kwNorm.substring(0, 4) : kwNorm;
                    return hName.includes(kwNorm) || hName.includes(kwShort);
                  });
                }) || rawTargetSubjects[0];
              }

              return {
                id: hwDetail.id || hw.id,
                title: hwDetail.name || hwDetail.titre || hw.name,
                subject: detectedSubject || 'Général',
                description: `Ressource recommandée pour vos difficultés en : ${rawTargetSubjects.join(', ')}`,
                addedAt: hwDetail.date_limit ? new Date(hwDetail.date_limit) : new Date(),
                childName: profile.q_nom || 'Enfant',
                childLevel: profile.niveauScolaire,
                targetSubjects: rawTargetSubjects, // NEW: Garder la liste complète
                files
              } as Homework;
            }),
            catchError((err: any) => {
              console.error('Erreur getHomeworkDetail', err);
              return of(null as any);
            })
          )
        );

        return forkJoin(detailCalls);
      }),
      map((docs: any[]) => docs.filter((d: any) => !!d)), // supprimer null
      tap((docs: Homework[]) => this.mergeNewDocuments(docs)),
      catchError((err: any) => {
        console.error('Erreur performSearch', err);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Appelle l’API 1 (SearchHomework)
   */
  private searchHomework(profile: ChildProfile): Observable<SearchResponse> {
    const levelId = this.mapLevelToId(profile.rawNiveau || profile.niveauScolaire);
    const idrole = 3;
    const count = 10;
    // URL: ${environment.api1Url}/{levelId}/{idrole}/{count}
    const url = `${environment.api1Url}/${levelId}/${idrole}/${count}`;
    return this.http.get<SearchResponse>(url);
  }

  /**
   * Appelle l’API 2 (GetHomeworkDetail)
   */
  private getHomeworkDetail(homeworkId: number): Observable<any> {
    // URL: ${environment.api2Url}/{homeworkId}
    const url = `${environment.api2Url}/${homeworkId}`;
    return this.http.get<any>(url);
  }

  /**
   * Télécharger un fichier
   */
  downloadFile(file: HomeworkFile): Observable<Blob> {
    return this.http.get(file.downloadUrl!, { responseType: 'blob' });
  }

  /**
   * Convertit le niveau texte en levelId
   */
  private mapLevelToId(niveau?: string): number {
    if (!niveau) return 0;
    const normalized = niveau.trim();

    // Check mapping first (e.g. "8ème année" -> 10)
    if (this.levelMapping[normalized]) return this.levelMapping[normalized];
    if (this.levelMapping[normalized.toLowerCase()]) return this.levelMapping[normalized.toLowerCase()];

    // If it's just a number string "8", map it if possible
    if (!isNaN(Number(normalized))) {
      const num = Number(normalized);
      // Heuristic: if num is 1-9 (from questionnaire), try mapping it correctly
      // based on 1->3, 2->4 ... 7->9, 8->10, 9->11
      if (num >= 1 && num <= 9) return num + 2;
      return num;
    }

    return 0;
  }
}

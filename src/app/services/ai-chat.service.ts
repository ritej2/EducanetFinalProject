/**
 * PURPOSE: Controls the AI Assistant (Chatbot).
 * CONTENT: Sends messages to Ollama via RAG backend, manages system prompts, and handles streaming responses.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ContextService, ChildProfile } from './context.service';
import { HomeworkService, Homework } from './homework.service';

export interface ChatMessage {
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

@Injectable({
    providedIn: 'root'
})
export class AiChatService {

    private apiUrl = '/api/rag/chatbot.php';
    private homeworkContext: any = null;

    // System prompt to constrain the AI to educational and nutrition topics
    // System prompt pour l'IA adaptée aux parents tunisiens
    // System prompt adapté aux parents tunisiens (Friendly, Structuré, Spécialisé)
    private readonly SYSTEM_PROMPT = `Tu es Rafi9ni, assistant parental tunisien spécialisé dans :

• la nutrition et la santé physique de l’enfant  
• la psychologie, les émotions et la motivation  
• l’éducation et la scolarité selon le programme tunisien

Tu aides les parents avec bienveillance, clarté et respect. Tu es le garant de la culture et du système éducatif tunisien.

━━━━━━━━━━━━━━━━━━
DOMAINES ET RÉFÉRENCES SPÉCIFIQUES
- NUTRITION : Pour toute question sur l'alimentation, la santé ou les produits laitiers, utilise les conseils de "Délice" (Source: دليس.txt).
- LECTURE ET IMAGINAIRE : Pour les contes, le vocabulaire ou le plaisir de lire, réfère-toi à "9isati / قصتي" (Source: قصتي.txt).
- ÉDUCATION : Stick strictement au SYSTÈME TUNISIEN (niveaux : de la 1ère à la 9ème année, matières, examen de la 6ème/9ème, etc.).
- Ne propose JAMAIS de références ou de programmes français/franco-canadiens.
━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━
LANGUE (PRIORITÉ MAXIMALE)
- Question en français → répondre uniquement en français.
- Question en arabe → répondre uniquement en arabe classique.

Interdictions :
- ne jamais mélanger les langues
- ne jamais utiliser l’arabizi

━━━━━━━━━━━━━━━━━━

SUJETS AUTORISÉS
✓ apprentissage (moyennes, notes, matières, devoirs)
✓ vie scolaire et progrès de l'enfant
✓ santé physique et développement
✓ bien-être psychologique

Si la question est VRAIMENT hors sujet (ex: météo, politique, sport), rappelle poliment ta mission d'assistant parental éducatif. Ne refuse jamais de parler des enfants décrits dans tes données.

━━━━━━━━━━━━━━━━━━
UTILISATION DES DOCUMENTS (RAG)
- Utilise le CONTEXTE RAG fourni comme base de vérité. 
- Intègre-le NATURELLEMENT dans tes conseils (pas besoin de citer le fichier à chaque phrase, mais l'information doit être fidèle).
- Ne rien inventer qui contredise les documents locaux.
- Toujours privilégier les marques et programmes cités dans les documents (Délice pour le lait/yaourt, 9isati pour les livres).
━━━━━━━━━━━━━━━━━━

STYLE
- ton rassurant, positif, professionnel
- utiliser : "Votre enfant", "Vous pouvez", "Il est normal que"
- donner des conseils simples et applicables
- pas de ton autoritaire
━━━━━━━━━━━━━━━━━━

SI LA QUESTION EST COMPLEXE
Répondre avec :
1. Points positifs
2. Recommandations pratiques
3. Bref résumé
━━━━━━━━━━━━━━━━━━

Toujours terminer par une phrase complète.`;

    private conversationHistory: Array<{ role: string; content: string }> = [
        { role: 'system', content: this.SYSTEM_PROMPT }
    ];

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private contextService: ContextService,
        private homeworkService: HomeworkService,
        private ngZone: NgZone
    ) {
        this.authService.currentUser$.subscribe(user => {
            if (user) {

                this.contextService.loadProfileForUser(user.id);
                this.homeworkService.loadLibrary(user.id);
                this.updateSystemPromptWithProfile();
            } else {
                this.homeworkService.clearLibrary();
                this.clearHistory();
            }
        });

        // 1. React to Profile Changes -> Trigger Search for each child if needed
        this.contextService.childProfile$.subscribe(profiles => {


            if (profiles && profiles.length > 0) {
                const latestProfile = this.contextService.getProfile();
                if (latestProfile) {
                    this.homeworkService.performSearch(latestProfile);
                }
            }

            this.updateSystemPromptWithProfile();
        });

        // 2. React to Documents Found -> Update Prompt
        this.homeworkService.recommendedDocuments$.subscribe((docs: Homework[]) => {

            this.homeworkContext = docs;
            this.updateSystemPromptWithProfile();
        });
    }

    setHomeworkContext(homeworkData: any): void {
        this.homeworkContext = homeworkData;
        this.updateSystemPromptWithProfile();
    }

    private getSystemPromptWithProfile(): string {
        let fullPrompt = this.SYSTEM_PROMPT;
        const allProfiles = this.contextService.getAllProfiles();

        if (allProfiles && allProfiles.length > 0) {
            fullPrompt += `\n\n### DONNÉES DES ENFANTS (PROFIL & ANALYSE) :`;
            fullPrompt += `\n${this.contextService.getAnalysisJSON()}`;
            fullPrompt += `\n\nINSTRUCTION : Ahmed (ou tout autre enfant listé ci-dessus) est l'enfant de l'utilisateur. Tu as accès à toutes ses notes et moyennes. Analyse ces données pour répondre aux questions du parent.`;
        }

        if (this.homeworkContext?.length > 0) {
            fullPrompt += `\n\n### RESSOURCES DISPONIBLES (TOP 5) :`;
            this.homeworkContext.slice(0, 5).forEach((d: any) => {
                fullPrompt += `\n- "${d.title}" (Matière: ${d.subject})`;
            });
        } else {
            fullPrompt += `\n\n⚠️ AUCUNE RESSOURCE DISPONIBLE.`;
        }

        fullPrompt += `\n\n- Base tes réponses en PRIORITÉ sur les ressources internes (RAG/CONTEXTE) fournies dans le prompt.
- CITATION : Mentionne le nom du fichier source dans ta réponse si pertinent.
- Adresse-toi au parent avec chaleur : "**عزيزي الولي**" ou "**Cher parent**".`;

        return fullPrompt;
    }

    private updateSystemPromptWithProfile(): void {
        const fullPrompt = this.getSystemPromptWithProfile();

        if (this.conversationHistory.length > 0 && this.conversationHistory[0].role === 'system') {
            this.conversationHistory[0].content = fullPrompt;
        } else {
            this.conversationHistory.unshift({ role: 'system', content: fullPrompt });
        }
    }

    sendMessageStream(userMessage: string, conversationId: number | null = null): Observable<string> {
        this.updateSystemPromptWithProfile();

        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        return new Observable(observer => {
            const body = {
                // Handled by backend config
                messages: this.conversationHistory,
                conversation_id: conversationId,
                stream: true,
                options: {
                    temperature: 0.7
                    // num_ctx is not standard for OpenRouter/OpenAI, removing to avoid errors
                }
            };

            console.log('🤖 Sending Full Context to AI:', JSON.stringify(body, null, 2));

            fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
                .then(async response => {
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`RAG Error (${response.status}): ${errorText}`);
                    }

                    if (!response.body) {
                        throw new Error('No response body');
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let fullResponse = '';
                    let buffer = '';

                    const readChunk = (): void => {
                        reader.read().then(({ done, value }) => {
                            if (done) {
                                console.log('✅ Stream Complete. Full buffer processed.');
                                if (buffer.trim()) {
                                    this.processJsonLines(buffer, (content) => {
                                        fullResponse += content;
                                        this.ngZone.run(() => observer.next(content));
                                    });
                                }
                                this.conversationHistory.push({ role: 'assistant', content: fullResponse });
                                this.ngZone.run(() => observer.complete());
                                return;
                            }

                            const chunk = decoder.decode(value, { stream: true });
                            console.log('📦 Raw Chunk:', chunk);
                            buffer += chunk;

                            const lastNewlineIndex = buffer.lastIndexOf('\n');
                            if (lastNewlineIndex !== -1) {
                                const linesToProcess = buffer.substring(0, lastNewlineIndex);
                                buffer = buffer.substring(lastNewlineIndex + 1);

                                this.processJsonLines(linesToProcess, (content) => {
                                    console.log('🧩 Processed Content:', content);
                                    fullResponse += content;
                                    this.ngZone.run(() => observer.next(content));
                                });
                            }
                            readChunk();
                        }).catch(error => {
                            this.ngZone.run(() => observer.error(error));
                        });
                    };

                    readChunk();
                })
                .catch(error => {
                    this.ngZone.run(() => observer.error(error));
                });
        });
    }

    private processJsonLines(text: string, onContent: (content: string) => void): void {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
            try {
                let jsonStr = line.trim();

                // Handle SSE format "data: {...}"
                if (jsonStr.startsWith('data: ')) {
                    jsonStr = jsonStr.substring(6).trim();
                }

                // Skip special SSE messages like [DONE]
                if (jsonStr === '[DONE]') continue;

                const json = JSON.parse(jsonStr);
                let content = '';

                // Handle OpenAI/OpenRouter format
                if (json.choices?.[0]?.delta?.content) {
                    content += json.choices[0].delta.content;
                }

                // Handle Ollama format (backward compatibility)
                if (json.message?.content) {
                    content += json.message.content;
                }

                if (json.message?.thought) {
                    content += `[Pensée : ${json.message.thought}] `;
                }

                if (content) {
                    onContent(content);
                }
            } catch (e) {
                // Ignore parsing errors for partial lines
            }
        }
    }

    clearHistory(): void {
        this.conversationHistory = [
            { role: 'system', content: this.getSystemPromptWithProfile() }
        ];
    }

    setHistory(messages: Array<{ role: string; content: string }>): void {
        this.conversationHistory = [
            { role: 'system', content: this.getSystemPromptWithProfile() },
            ...messages
        ];
    }
}

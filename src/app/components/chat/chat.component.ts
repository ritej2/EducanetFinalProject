/**
 * PURPOSE: Interface for talking to the AI assistant.
 * CONTENT: Displays message bubbles, handles user input, and interacts with AiChatService for streaming responses.
 */
import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService, ChatMessage } from '../../services/ai-chat.service';
import { ChatHistoryService, ChatConversation } from '../../services/chat-history.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HomeworkService } from '../../services/homework.service';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
    @ViewChild('chatHistory') private chatContainer!: ElementRef;

    messages: ChatMessage[] = [];
    userMessage = "";
    isTyping = false;
    private shouldScroll = false;
    private isBrowser: boolean;

    conversations: ChatConversation[] = [];
    currentConversationId: number | null = null;
    isSidebarOpen = true;

    isSending = false;

    constructor(
        private aiChatService: AiChatService,
        private chatHistoryService: ChatHistoryService,
        private authService: AuthService,
        private sanitizer: DomSanitizer,
        private homeworkService: HomeworkService,
        @Inject(PLATFORM_ID) platformId: any
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    ngOnInit(): void {
        if (this.isBrowser) {
            this.loadConversations();
        }
    }

    ngAfterViewChecked(): void {
        if (this.isBrowser && this.shouldScroll) {
            this.scrollToBottom();
            this.shouldScroll = false;
        }
    }

    loadConversations(): void {
        this.chatHistoryService.loadConversations().subscribe({
            next: (res) => {
                if (res.success) {
                    this.conversations = res.data;
                    // Automatically load the latest conversation if available
                    if (this.conversations.length > 0 && this.currentConversationId === null) {
                        this.selectConversation(this.conversations[0].id);
                    } else if (this.conversations.length === 0) {
                        this.startNewChat();
                    }
                }
            }
        });
    }

    selectConversation(id: number): void {
        if (this.isSending) return; // Empêcher le changement pendant l'envoi
        this.currentConversationId = id;
        this.isTyping = true;
        this.messages = [];

        this.chatHistoryService.getMessages(id).subscribe({
            next: (res) => {
                if (res.success) {
                    this.messages = res.data.map((m: any) => ({
                        text: m.message,
                        sender: m.sender === 'user' ? 'user' : 'ai',
                        timestamp: m.sent_at ? new Date(m.sent_at) : new Date()
                    }));
                    // Sync with AI service
                    this.aiChatService.setHistory(res.data.map((m: any) => ({
                        role: m.sender === 'ai' ? 'assistant' : m.sender,
                        content: m.message
                    })));
                }
                this.isTyping = false;
                this.shouldScroll = true;
            },
            error: () => {
                this.isTyping = false;
            }
        });
    }

    startNewChat(): void {
        if (this.isSending) return;
        this.currentConversationId = null;
        this.messages = [
            {
                text: "Bonjour Cher parent ! Je suis l'assistant pédagogique officiel. Je suis prêt à vous aider pour le suivi de votre enfant. Comment puis-je vous assister aujourd'hui ?",
                sender: 'ai',
                timestamp: new Date()
            }
        ];
        this.aiChatService.clearHistory();
    }

    scrollToBottom(): void {
        if (!this.isBrowser) return;
        try {
            if (this.chatContainer) {
                this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
            }
        } catch (err) { }
    }

    sendMessage(): void {
        if (this.isSending || !this.userMessage || this.userMessage.trim() === '') {
            return;
        }

        this.isSending = true;
        const messageText = this.userMessage;
        this.userMessage = ""; // Vider l'input immédiatement

        // If no conversation active, create one first
        if (this.currentConversationId === null) {
            const title = messageText.length > 30 ? messageText.substring(0, 30) + '...' : messageText;
            this.chatHistoryService.createConversation(title).subscribe({
                next: (res) => {
                    if (res.success) {
                        this.currentConversationId = res.data.id;
                        this.conversations = [res.data, ...this.conversations];
                        this.processMessage(messageText);
                    } else {
                        this.isSending = false;
                    }
                },
                error: () => this.isSending = false
            });
        } else {
            this.processMessage(messageText);
        }
    }

    private processMessage(messageText: string): void {
        // Add user message to UI
        const userMsg: ChatMessage = {
            text: messageText,
            sender: 'user',
            timestamp: new Date()
        };
        this.messages.push(userMsg);

        // Save user message to DB
        if (this.currentConversationId) {
            this.chatHistoryService.saveMessage(this.currentConversationId, 'user', messageText).subscribe();
        }

        this.userMessage = "";
        this.isTyping = true;
        this.shouldScroll = true;

        // Create a placeholder for AI response
        const aiMessageIndex = this.messages.length;
        this.messages.push({
            text: '',
            sender: 'ai',
            timestamp: new Date()
        });

        // Call streaming service
        let fullResponse = '';
        let firstChunkReceived = false;

        this.aiChatService.sendMessageStream(messageText, this.currentConversationId).subscribe({
            next: (chunk) => {
                if (!firstChunkReceived) {
                    firstChunkReceived = true;
                    this.isTyping = false;
                }
                fullResponse += chunk;
                this.messages[aiMessageIndex].text = fullResponse;
                this.shouldScroll = true;
            },
            error: (err) => {
                console.error("Erreur chat:", err);
                if (err.status === 200 && err.error && err.error.text) {
                    console.error("Parsing Error - Received non-JSON:", err.error.text);
                }
                this.messages[aiMessageIndex].text = "Désolé, une erreur s'est produite. Veuillez réessayer.";
                this.isTyping = false;
                this.isSending = false;
            },
            complete: () => {
                this.isTyping = false;
                this.isSending = false;
                // Save AI response to DB
                if (this.currentConversationId && fullResponse && fullResponse.trim() !== '') {
                    this.chatHistoryService.saveMessage(this.currentConversationId, 'ai', fullResponse).subscribe({
                        error: (err) => console.error("Erreur sauvegarde message IA:", err)
                    });
                } else {
                    console.warn("Message IA vide ou conversation ID manquant, sauvegarde annulée.");
                }
            }
        });
    }

    deleteConversation(event: Event, id: number): void {
        event.stopPropagation();
        if (this.isBrowser && confirm('Supprimer cette conversation ?')) {
            this.chatHistoryService.deleteConversation(id).subscribe({
                next: () => {
                    this.conversations = this.conversations.filter(c => c.id !== id);
                    if (this.currentConversationId === id) {
                        this.startNewChat();
                    }
                }
            });
        }
    }

    toggleSidebar(): void {
        this.isSidebarOpen = !this.isSidebarOpen;
    }

    renderMessage(text: string): SafeHtml {
        if (!text) return '';

        // 1. Détection des liens Markdown de téléchargement
        // Format supporté : [Nom du fichier](/api/php/download.php?fileId=XX[&path=YY])
        // Regex update: capture ID ($2) allowing any chars until '&', and optional path ($3)
        // This handles cases where fileId is 'undefined', 'NaN', 'null' or empty string
        const rendered = text.replace(/\[([^\]]+)\]\(\/api\/php\/download\.php\?fileId=([^&]*)(?:&path=([^)]*))?\)/g,
            (match, label, id, path) => {
                const escapedLabel = label.replace(/"/g, '&quot;');
                const dataPath = path ? decodeURIComponent(path) : '';
                return `<a href="#" class="chat-download-link" data-id="${id}" data-path="${dataPath}" data-name="${escapedLabel}"><i class="fa fa-download"></i> ${label}</a>`;
            });

        return this.sanitizer.bypassSecurityTrustHtml(rendered);
    }

    downloadFromChat(fileId: number, fileName: string, filePath?: string): void {


        // Construct the HomeworkFile object to match the service signature
        const downloadUrl = `/api/php/download.php?fileName=${encodeURIComponent(fileName)}&path=${encodeURIComponent(filePath || '')}`;

        const fileObj: any = { // Using any to avoid strict type checks if interface imports are missing in this file
            fileId: fileId,
            fileName: fileName,
            nom: fileName,
            path: filePath,
            downloadUrl: downloadUrl
        };

        this.homeworkService.downloadFile(fileObj).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            },
            error: (err) => console.error('Erreur téléchargement chat:', err)
        });
    }

    @HostListener('click', ['$event'])
    onChatClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const link = target.closest('.chat-download-link');

        if (link) {
            event.preventDefault();
            const fileId = link.getAttribute('data-id');
            const fileName = link.getAttribute('data-name');
            const filePath = link.getAttribute('data-path') || undefined;



            // Fix: Allow download if fileName is present AND (fileId OR filePath) is present.
            // This supports legacy files that might have an empty ID but a valid Path.
            if (fileName && (fileId || filePath)) {
                // If ID is missing/invalid, pass 0. The service will rely on filePath.
                const numericId = fileId && !isNaN(Number(fileId)) ? Number(fileId) : 0;
                this.downloadFromChat(numericId, fileName, filePath);
            }
        }
    }

    clearChat(): void {
        this.startNewChat();
    }
}

import { Routes } from '@angular/router';
import { AccueilComponent } from './components/accueil/accueil.component';
import { MesEnfantsComponent } from './components/mes-enfants/mes-enfants.component';
import { AjouterEnfantComponent } from './components/ajouter-enfant/ajouter-enfant.component';
import { CalendrierComponent } from './components/calendrier/calendrier.component';
import { ChatComponent } from './components/chat/chat.component';
import { GererCompteComponent } from './components/gerer-compte/gerer-compte.component';
import { ConseilsComponent } from './components/conseils/conseils.component';
import { BibliothequeComponent } from './components/bibliotheque/bibliotheque.component';
import { LoginComponent } from './components/auth/login.component';
import { SignupComponent } from './components/auth/signup.component';
import { QuestionnaireComponent } from './components/questionnaire/questionnaire.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'questionnaire', component: QuestionnaireComponent, canActivate: [authGuard] },
    { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
    { path: 'accueil', component: AccueilComponent },
    { path: 'mes-enfants', component: MesEnfantsComponent },
    { path: 'ajouter-enfant', component: AjouterEnfantComponent },
    { path: 'modifier-enfant/:id', component: AjouterEnfantComponent },
    { path: 'calendrier', component: CalendrierComponent },
    { path: 'gerer-compte', component: GererCompteComponent },
    { path: 'conseils', component: ConseilsComponent },
    { path: 'bibliotheque', component: BibliothequeComponent, canActivate: [authGuard] },
    {
        path: 'admin',
        loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        canActivate: [adminGuard]
    },
    { path: '**', redirectTo: 'login' }
];

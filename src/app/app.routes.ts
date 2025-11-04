import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Home } from './features/home/home';
import { Welcome } from './features/welcome/welcome';
import { Test } from './features/test/test';
import { Profile } from './features/profile/profile';
import { Settings } from './features/settings/settings';
import { Assistant } from './features/assistant/assistant';
import { publicGuard } from './core/guards/public-guard';
import { onboardingGuard } from './core/guards/onboarding-guard';
import { authGuard } from './core/guards/auth-guard';
import { verifyEntryGuard } from './core/guards/verify-entry-guard';
import { forgotEntryGuard } from './core/guards/forgot-entry-guard';
import { authenticationGuard, completedGuard, onboardingOnlyGuard } from './core/guards/authentication-guard';

export const routes: Routes = [
    { path: 'login', component: Login, canActivate: [publicGuard] },
    { path: 'register', component: Register, canActivate: [publicGuard] },
    
    // nuevas rutas protegidas por "pase"
    { path: 'register/verify-email',
        loadComponent: () => import('./features/auth/verify-email/verify-email').then(m => m.VerifyEmail),
        canActivate: [publicGuard, verifyEntryGuard]
    },
    { path: 'login/forgot',
        loadComponent: () => import('./features/auth/forgot/forgot').then(m => m.Forgot),
        canActivate: [publicGuard, forgotEntryGuard]
    },

    { path: 'welcome', component: Welcome, canMatch: [authenticationGuard, onboardingOnlyGuard] }, 
    { path: 'test', component: Test, canMatch: [authenticationGuard, onboardingOnlyGuard] },
    { path: 'home', component: Home, canMatch: [authenticationGuard, completedGuard] },
    { path: 'topic/:slug',
        loadComponent: () => import('./features/topics/topic-play/topic-play').then(m => m.TopicPlay),
        canMatch: [authenticationGuard, completedGuard]
    },
    { path: 'profile', component: Profile, canMatch: [authenticationGuard, completedGuard] },
    { path: 'settings', component: Settings, canMatch: [authenticationGuard, completedGuard] },
    { path: 'assistant', component: Assistant, canMatch: [authenticationGuard, completedGuard] },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];

import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Home } from './features/home/home';
import { Welcome } from './features/welcome/welcome';
import { firstloginGuard } from './core/guards/firstlogin-guard';
import { Test } from './features/test/test';
import { requiredoneGuard } from './core/guards/requiredone-guard';
import { blockifdoneGuard } from './core/guards/blockifdone-guard';
import { Profile } from './features/profile/profile';
import { Settings } from './features/settings/settings';
import { Assistant } from './features/assistant/assistant';
import { publicGuard } from './core/guards/public-guard';
import { onboardingGuard } from './core/guards/onboarding-guard';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
    { path: 'login', component: Login, canActivate: [publicGuard] },
    { path: 'register', component: Register, canActivate: [publicGuard] },
    { path: 'welcome', component: Welcome, canActivate: [onboardingGuard] }, 
    { path: 'test', component: Test, canActivate: [onboardingGuard] },
    { path: 'home', component: Home, canActivate: [authGuard] },
    { path: 'profile', component: Profile, canActivate: [authGuard] },
    { path: 'settings', component: Settings, canActivate: [authGuard] },
    { path: 'assistant', component: Assistant, canActivate: [authGuard] },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];

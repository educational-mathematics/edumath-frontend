import { Injectable } from '@angular/core';

type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class Theme {
  private key = 'pref_theme';
  private current: ThemeMode = 'light';

  initFromStorage() {
    const saved = (localStorage.getItem(this.key) as ThemeMode) || 'light';
    this.setTheme(saved);
  }

  setTheme(t: ThemeMode) {
    this.current = t;
    localStorage.setItem(this.key, t);
    const root = document.documentElement; // <html>
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${t}`);
  }

  getTheme(): ThemeMode {
    return this.current;
  }
}
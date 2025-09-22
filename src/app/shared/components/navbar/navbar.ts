import { Component, Input, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/auth';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  @Input() appTitle = 'EduMath';
  mobileOpen = false;

  // 👇 en vez de guardar el user “estático”, exponemos el stream
  auth = inject(Auth);
  me$ = this.auth.user$;  // <- Observable<User | null>

  constructor(private router: Router) {}

  toggleMobile() { this.mobileOpen = !this.mobileOpen; }

  logout() {
    // usa tu método centralizado (borra token+user y emite null a user$)
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  onImgError(e: Event) {
    (e.target as HTMLImageElement).src = 'assets/avatar-placeholder.png';
  }
}

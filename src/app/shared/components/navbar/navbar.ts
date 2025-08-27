import { Component, Input } from '@angular/core';
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

  constructor(private auth: Auth, private router: Router) {}

  toggleMobile() { this.mobileOpen = !this.mobileOpen; }

  logout() {
    localStorage.removeItem('user'); // o this.auth.logout() si lo tienes
    this.router.navigateByUrl('/login');
  }
}

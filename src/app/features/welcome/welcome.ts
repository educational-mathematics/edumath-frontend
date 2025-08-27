import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  selector: 'app-welcome',
  imports: [],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css'
})
export class Welcome implements OnInit {
  userName = 'Explorador/a';
  
  constructor(private router: Router, private auth:Auth) {}

  ngOnInit(): void {
    const u = this.auth.getCurrentUser();
    if (u?.name) this.userName = u.name;
  }

  goToTest() {
    this.router.navigate(['/test']); // Aquí asumo que tienes un componente "test"
  }
}

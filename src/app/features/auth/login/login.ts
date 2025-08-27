import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Auth } from '../../../core/auth';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  showNotification = false;
  notificationMessage = '';
  loginAttempted = false;

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    this.loginAttempted = true;

    if (this.loginForm.invalid) {
      this.showError('Campos incompletos');
      return;
    }
    
    const { email, password } = this.loginForm.value;

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError('Formato de correo inválido');
      return;
    }

    this.authService.login(this.loginForm.value).subscribe(user => { 
      if (user && user.email === email && user.password === password) { 
      console.log('✅ Login exitoso, guardando usuario:', user);
        
        // Guardar en localStorage
        localStorage.setItem('user', JSON.stringify(user)); 
        
        // Verificar que se guardó correctamente
        const savedUser = localStorage.getItem('user');
        console.log('💾 Usuario guardado en localStorage:', savedUser);
      
        // ⭐ SOLUCIÓN: Dar tiempo al localStorage y luego navegar
        setTimeout(() => {
          console.log('🚀 Navegando después de guardar usuario');
          
          if (!user.firstLoginDone) { 
            this.router.navigate(['/welcome']);
          } else { 
            this.router.navigate(['/home']);
          } 
        }, 100); // 100ms es suficiente para que se actualice localStorage
        
      } else { 
        this.showError('Correo o contraseña incorrecta'); 
      } 
    }); 
  }
  
  isInvalid(controlName: string) {
    const control = this.loginForm.get(controlName);
    return control?.invalid && this.loginAttempted;
  }

  showError(message: string) {
    this.notificationMessage = message;
    this.showNotification = true;
    setTimeout(() => this.showNotification = false, 3000);
  }

  closeNotification() {
    this.showNotification = false;
  }
}

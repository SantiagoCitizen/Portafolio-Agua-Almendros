import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment'; 

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonInput
} from '@ionic/angular';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonInput
  ]
})
export class AjustesPage {
  passwordActual = '';
  passwordNueva = '';
  confirmarPassword = '';

  constructor(private http: HttpClient, private router: Router) {}

  volverARuta() {
    this.router.navigate(['/ruta']);
  }

  actualizarPassword() {
    if (!this.passwordActual || !this.passwordNueva || !this.confirmarPassword) {
      alert('Por favor completa todos los campos.');
      return;
    }

    if (this.passwordNueva !== this.confirmarPassword) {
      alert('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (this.passwordNueva.length < 6) {
      alert('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Tu sesión expiró. Inicia sesión nuevamente.');
      this.router.navigate(['/home']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const payload = {
      password_actual: this.passwordActual,
      password_nueva: this.passwordNueva
    };

    
    this.http.put(`${environment.apiUrl}/cambiar-password`, payload, { headers })
      .subscribe({
        next: () => {
          alert('Contraseña actualizada exitosamente. Por seguridad, inicia sesión con tu nueva clave.');
          localStorage.removeItem('token');
          this.passwordActual = '';
          this.passwordNueva = '';
          this.confirmarPassword = '';
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('Error al cambiar contraseña:', err);
          const detalle = err.error?.detail || 'No se pudo actualizar la contraseña.';
          alert(`Error: ${detalle}`);
        }
      });
  }
}
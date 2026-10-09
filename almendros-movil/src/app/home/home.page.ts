import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment'; 

import { 
  IonContent, 
  IonCard, 
  IonCardContent, 
  IonList, 
  IonItem, 
  IonInput, 
  IonButton 
} from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonCard, 
    IonCardContent, 
    IonList, 
    IonItem, 
    IonInput, 
    IonButton
  ],
})
export class HomePage {
  telefono = '';
  password = '';

  constructor(private http: HttpClient, private router: Router) {}
  
  irARegistro() {
    this.router.navigate(['/registro']);
  }
  
  iniciarSesion() {
    if (!this.telefono || !this.password) {
      alert('Ingresa tu teléfono y contraseña');
      return;
    }

    // Se arma un JSON simple. 
    const payload = {
      telefono: this.telefono, 
      password: this.password
    };

    // Configuracion de los headers para enviar JSON
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // 
    this.http.post(`${environment.apiUrl}/login`, payload, { headers }).subscribe({
      next: (res: any) => {
        // Se guarda el token en la memoria del dispositivo
        localStorage.setItem('token', res.token);
        
        // Lee el rol que mandó la base de datos
        const rol = res.usuario.id_rol;

        // Redirección basada en el rol
        if (rol === 2) {
          // Si es rol 2 (Repartidor), va a su ruta
          this.router.navigate(['/ruta']);
        } else if (rol === 3) {
          // Si es rol 3 (Cliente), va a su nueva pantalla de inicio
          this.router.navigate(['/inicio-cliente']);
        } else {
          // Si por alguna razón entra un administrador u otro rol
          alert('Tu cuenta no está configurada para usar la aplicación móvil.');
        }
      },
      error: (err) => {
        alert(`Error ${err.status}: Teléfono o contraseña incorrectos`);
        console.error('Detalles del error:', err);
      }
    });
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment'; // <-- 1. Importamos el entorno

import { 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonBackButton, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonInput, 
  IonSelect, 
  IonSelectOption, 
  IonTextarea, 
  IonButton 
} from '@ionic/angular';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonBackButton, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonInput, 
    IonSelect, 
    IonSelectOption, 
    IonTextarea, 
    IonButton
  ]
})
export class RegistroPage implements OnInit {
  
  // Lista que se llenará desde el backend
  colonias: any[] = [];

  cliente = {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    password: '',
    id_colonia: null,
    calle: '',
    numero: '',
    referencias_domicilio: ''
  };

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.cargarColonias();
  }

  cargarColonias() {

    this.http.get(`${environment.apiUrl}/colonias`).subscribe({
      next: (datos: any) => {
        this.colonias = datos;
      },
      error: (err) => {
        console.error('Error al cargar colonias:', err);
        alert('No se pudieron cargar las colonias. Revisa tu conexión.');
      }
    });
  }

  registrarCliente() {
    // Validación básica para que no envíen datos vacíos 
    if (!this.cliente.nombre || !this.cliente.apellido_paterno || !this.cliente.telefono || 
        !this.cliente.password || !this.cliente.id_colonia || !this.cliente.calle || !this.cliente.numero) {
      alert('Por favor, llena todos los campos obligatorios.');
      return;
    }

    //  Prepara la petición
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.http.post(`${environment.apiUrl}/registro`, this.cliente, { headers })
      .subscribe({
        next: (respuesta: any) => {
          // Si el backend dice que todo OK (Status 200)
          alert(respuesta.mensaje || '¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
          this.router.navigate(['/home']); // Lo regresamos al login
        },
        error: (error) => {
          // Si el teléfono ya existe o hay un error, FastAPI nos mandará un detail
          if (error.error && error.error.detail) {
            alert(error.error.detail);
          } else {
            console.error('Error en el registro:', error);
            alert('Ocurrió un error al intentar crear tu cuenta.');
          }
        }
      });
  }
}
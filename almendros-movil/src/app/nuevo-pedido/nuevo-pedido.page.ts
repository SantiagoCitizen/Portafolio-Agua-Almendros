import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonRadioGroup, IonItem, IonLabel, IonRadio,
  IonTextarea 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, removeOutline, cashOutline, cardOutline, informationCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-nuevo-pedido',
  templateUrl: './nuevo-pedido.page.html',
  styleUrls: ['./nuevo-pedido.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonIcon, IonRadioGroup, IonItem, IonLabel, IonRadio,
    IonTextarea 
  ]
})
export class NuevoPedidoPage implements OnInit {
  cantidad: number = 1;
  metodoPago: string = 'Efectivo';
  precioUnitario: number = 0; 
  notasCliente: string = ''; 
  archivoComprobante: File | null = null; 

  constructor(private http: HttpClient, private router: Router) {
    // Registrar los íconos para que se vean en el HTML
    addIcons({ addOutline, removeOutline, cashOutline, cardOutline, informationCircleOutline });
  }

  ngOnInit() {
    this.cargarPrecioCliente();
  }

  cambiarCantidad(valor: number) {
    const nuevaCantidad = this.cantidad + valor;
    if (nuevaCantidad >= 1) {
      this.cantidad = nuevaCantidad;
    }
  }

  cargarPrecioCliente() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get(`${environment.apiUrl}/clientes/mi-tarifa`, { headers }).subscribe({
      next: (res: any) => {
        this.precioUnitario = res.tarifa_especial || res.precio_garrafon;
      },
      error: (err) => {
        console.error('Error al cargar tarifa:', err);
        this.precioUnitario = 15; 
      }
    });
  }

  // Función para atrapar el archivo cuando el cliente lo selecciona
  seleccionarComprobante(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoComprobante = file;
    }
  }

  confirmarPedido() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Tu sesión expiró.');
      this.router.navigate(['/home']);
      return;
    }

    // Validación obligatoria: Si es transferencia, debe subir la imagen
    if (this.metodoPago === 'Transferencia' && !this.archivoComprobante) {
      alert('⚠️ Es obligatorio adjuntar tu comprobante de pago para la transferencia.');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Se usa FormData para poder enviar texto e imágenes juntos
    const formData = new FormData();
    formData.append('cantidad_garrafones', this.cantidad.toString());
    formData.append('tipo_pago', this.metodoPago);
    formData.append('monto_total', (this.cantidad * this.precioUnitario).toString());
    formData.append('notas_cliente', this.notasCliente);
    
    if (this.archivoComprobante) {
      formData.append('comprobante', this.archivoComprobante);
    }

    this.http.post(`${environment.apiUrl}/clientes/pedidos`, formData, { headers }).subscribe({
      next: () => {
        alert('¡Pedido confirmado! En breve un repartidor pasará a tu domicilio.');
        this.router.navigate(['/inicio-cliente']);
      },
      error: (err) => {
        console.error('Error al crear pedido:', err);
        alert('No se pudo procesar el pedido. Intenta nuevamente.');
      }
    });
  }
}
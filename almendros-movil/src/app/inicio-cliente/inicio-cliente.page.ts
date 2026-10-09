import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonBadge, IonIcon, 
  IonSegment, IonSegmentButton, IonLabel 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-inicio-cliente',
  templateUrl: './inicio-cliente.page.html',
  styleUrls: ['./inicio-cliente.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonBadge, IonIcon, 
    IonSegment, IonSegmentButton, IonLabel 
  ]
})
export class InicioClientePage implements OnInit {
  segmentoActual: string = 'activos'; 
  
  pedidosActivos: any[] = [];
  pedidosHistorial: any[] = [];

  constructor(private http: HttpClient, private router: Router) {
    addIcons({ cloudUploadOutline, checkmarkCircleOutline });
  }

  ngOnInit() {
    this.cargarMisPedidos();
  }

  ionViewWillEnter() {
    this.cargarMisPedidos();
  }

  cargarMisPedidos() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get(`${environment.apiUrl}/clientes/mis-pedidos`, { headers }).subscribe({
      next: (res: any) => {
        
        // Filtra los pedidos en curso
        this.pedidosActivos = res.filter((p: any) => 
          p.estatus_entrega === 'Pendiente' || p.estatus_entrega === 'En camino'
        );
        
        // Filtram los pedidos que ya finalizaron 
        this.pedidosHistorial = res.filter((p: any) => 
          ['Entregado', 'Cancelado', 'No Entregado'].includes(p.estatus_entrega)
        );

      },
      error: (err) => console.error('Error al cargar pedidos:', err)
    });
  }

  nuevoPedido() {
    this.router.navigate(['/nuevo-pedido']);
  }

  subirComprobante(idPedido: number) {
    alert('Próximamente: Abrir cámara/galería para el pedido ' + idPedido);
  }

  // Da estilo visual a las etiquetas
  getColorEstatus(estatus: string) {
    switch(estatus) {
      case 'Pendiente': return 'warning';
      case 'En camino': return 'tertiary';
      case 'Entregado': return 'success';
      case 'Cancelado': 
      case 'No Entregado': return 'danger';
      default: return 'medium';
    }
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    this.router.navigate(['/home']);
  }
}
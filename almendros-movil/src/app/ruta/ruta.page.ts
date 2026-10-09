import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { environment } from '../../environments/environment'; 


import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonContent, IonCard, IonCardHeader, IonCardTitle, 
  IonCardSubtitle, IonCardContent, IonBadge, IonIcon
} from '@ionic/angular';


import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-ruta',
  templateUrl: './ruta.page.html',
  styleUrls: ['./ruta.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
    IonContent, IonCard, IonCardHeader, IonCardTitle, 
    IonCardSubtitle, IonCardContent, IonBadge, IonIcon 
  ]
})
export class RutaPage implements OnInit, OnDestroy {
  pedidos: any[] = [];
  
  // Variables para el auto-actualizado y detección de pedidos nuevos
  private intervaloPolling: any;
  private idsConocidos: Set<number> = new Set();
  private primeraCarga: boolean = true;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { 
    addIcons({ alertCircleOutline });
  }

  ngOnInit() {
    this.cargarRutaDelDia();
    this.iniciarAutoActualizacion(); 
  }

  ionViewWillEnter() {
    this.cargarRutaDelDia();
    this.iniciarAutoActualizacion();
  }

  ionViewWillLeave() {
    this.detenerAutoActualizacion();
  }

  ngOnDestroy() {
    this.detenerAutoActualizacion();
  }

  iniciarAutoActualizacion() {
    this.detenerAutoActualizacion();
    this.intervaloPolling = setInterval(() => {
      this.cargarRutaDelDia(true);
    }, 10000);
  }

  detenerAutoActualizacion() {
    if (this.intervaloPolling) {
      clearInterval(this.intervaloPolling);
      this.intervaloPolling = null;
    }
  }

  cargarRutaDelDia(esRevisionAutomatica: boolean = false) {
    const token = localStorage.getItem('token');

    if (!token) {
      this.detenerAutoActualizacion();
      if (!esRevisionAutomatica) {
        alert('Tu sesión expiró. Vuelve a iniciar sesión.');
      }
      this.router.navigate(['/home']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get(`${environment.apiUrl}/repartidores/entregas`, { headers }).subscribe({
      next: (datos: any) => {
        const listaRecibida = Array.isArray(datos) ? datos : [];

        const hayPedidoNuevo = listaRecibida.some(
          (p: any) => !this.idsConocidos.has(p.id_pedido)
        );

        if (!this.primeraCarga && hayPedidoNuevo) {
          console.log('🔔 ¡Nuevo pedido detectado! Reproduciendo alerta...');
          this.reproducirSonidoAlerta();
        }

        this.idsConocidos = new Set(listaRecibida.map((p: any) => p.id_pedido));
        this.primeraCarga = false;

        this.pedidos = listaRecibida;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error al cargar la ruta:', err);
        if (!esRevisionAutomatica) {
          alert('No se pudo cargar la ruta del día.');
        }
      }
    });
  }

  reproducirSonidoAlerta() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); 
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.18); 
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.65);
    } catch (e) {
      console.warn('El navegador bloqueó el audio automático:', e);
    }
  }

  actualizarEstatus(id_pedido: number, nuevoEstatus: string) {
    const token = localStorage.getItem('token');
    if (!token) return;

    let notaRepartidor = null;

    // Si hubo un problema, obligamos al repartidor a justificar por qué
    if (nuevoEstatus === 'Cancelado' || nuevoEstatus === 'No Entregado') {
      const razon = prompt('¿Por qué no se pudo completar la entrega? (Ej. Nadie abrió, No tenían dinero)');
      
      // Si presiona Cancelar, detenemos la actualización
      if (razon === null) return; 
      
      notaRepartidor = razon.trim();
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = { 
      estatus: nuevoEstatus,
      notas_campo: notaRepartidor
    };

    this.http.put(`${environment.apiUrl}/repartidores/entregas/${id_pedido}/estatus`, body, { headers })
      .subscribe({
        next: () => {
          this.cargarRutaDelDia(true);
        },
        error: (error) => {
          if (error.status === 400 && error.error && error.error.detail) {
            alert(error.error.detail);
          } else {
            console.error('Fallo al actualizar el estatus:', error);
            alert('Ocurrió un error al actualizar el pedido.');
          }
        }
      });
  }

  irAAjustes() {
    this.router.navigate(['/ajustes']);
  }

  cerrarSesion() {
    this.detenerAutoActualizacion();
    localStorage.removeItem('token');
    this.pedidos = [];
    this.idsConocidos.clear();
    this.primeraCarga = true;
    this.router.navigate(['/home']);
  }
}
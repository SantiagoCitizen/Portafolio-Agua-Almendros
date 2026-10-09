import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'ruta',
    loadComponent: () => import('./ruta/ruta.page').then( m => m.RutaPage)
  },
  {
    path: 'ajustes',
    loadComponent: () => import('./ajustes/ajustes.page').then( m => m.AjustesPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./registro/registro.page').then( m => m.RegistroPage)
  },
  {
    path: 'inicio-cliente',
    loadComponent: () => import('./inicio-cliente/inicio-cliente.page').then( m => m.InicioClientePage)
  },
  {
    path: 'nuevo-pedido',
    loadComponent: () => import('./nuevo-pedido/nuevo-pedido.page').then( m => m.NuevoPedidoPage)
  },
];

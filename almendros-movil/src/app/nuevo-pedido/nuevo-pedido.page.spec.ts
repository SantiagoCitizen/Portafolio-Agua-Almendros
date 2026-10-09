import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NuevoPedidoPage } from './nuevo-pedido.page';

describe('NuevoPedidoPage', () => {
  let component: NuevoPedidoPage;
  let fixture: ComponentFixture<NuevoPedidoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NuevoPedidoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

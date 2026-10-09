import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InicioClientePage } from './inicio-cliente.page';

describe('InicioClientePage', () => {
  let component: InicioClientePage;
  let fixture: ComponentFixture<InicioClientePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InicioClientePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

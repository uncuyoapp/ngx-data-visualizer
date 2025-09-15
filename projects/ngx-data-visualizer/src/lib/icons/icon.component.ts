import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Componente base abstracto para íconos
 * 
 * Proporciona propiedades comunes para todos los íconos como ancho, alto y color.
 * Este componente debe ser extendido por componentes de íconos específicos.
 */
@Component({
  standalone: true,
  imports: [
    CommonModule
  ],
  template: '',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class IconComponent {
  /** Ancho del ícono en píxeles (por defecto: 30) */
  @Input() width: number = 30;
  
  /** Alto del ícono en píxeles (por defecto: 30) */
  @Input() height: number = 30;
  
  /** Color del ícono en formato válido de CSS (ej: '#FF0000', 'red', 'rgb(255,0,0)') */
  @Input() color!: string;
}

import { Component } from '@angular/core';
import { IconComponent } from '../icon.component';

/**
 * Componente de ícono de flecha hacia adelante
 * 
 * Este componente muestra un ícono de flecha que apunta a la derecha, típicamente
 * utilizado para navegar hacia adelante o avanzar a la siguiente pantalla.
 * 
 * @example
 * ```html
 * <lib-icon-forward [width]="24" [height]="24" color="#000000"></lib-icon-forward>
 * ```
 */
@Component({
  selector: 'lib-icon-forward',
  standalone: true,
  imports: [],
  templateUrl: './forward.component.svg',
  styleUrl: '../icon.component.scss'
})
export class ForwardComponent extends IconComponent {
}

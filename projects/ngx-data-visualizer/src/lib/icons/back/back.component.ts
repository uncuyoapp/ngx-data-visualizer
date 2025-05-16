import { Component } from '@angular/core';
import { IconComponent } from '../icon.component';

/**
 * Componente de ícono de flecha hacia atrás
 * 
 * Este componente muestra un ícono de flecha que apunta a la izquierda, típicamente
 * utilizado para navegar hacia atrás o volver a la pantalla anterior.
 * 
 * @example
 * ```html
 * <lib-icon-back [width]="24" [height]="24" color="#000000"></lib-icon-back>
 * ```
 */
@Component({
  selector: 'lib-icon-back',
  standalone: true,
  imports: [],
  templateUrl: './back.component.svg',
  styleUrl: '../icon.component.scss'
})
export class BackComponent extends IconComponent {
}

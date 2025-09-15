import { Component } from '@angular/core';
import { IconComponent } from '../icon.component';

/**
 * Componente de ícono de cuadrado relleno
 * 
 * Este componente muestra un ícono de cuadrado relleno, que puede ser utilizado
 * para representar selección, casillas de verificación o como elemento decorativo.
 * 
 * @example
 * ```html
 * <lib-icon-square [width]="24" [height]="24" color="#000000"></lib-icon-square>
 * ```
 */
@Component({
  selector: 'lib-icon-square',
  standalone: true,
  imports: [],
  templateUrl: './square.component.svg',
  styleUrl: '../icon.component.scss'
})
export class SquareComponent extends IconComponent {
}

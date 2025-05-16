import { Component } from '@angular/core';
import { IconComponent } from '../icon.component';

/**
 * Componente de ícono de cuadrado con borde
 * 
 * Este componente muestra un ícono de cuadrado sin relleno, que puede ser utilizado
 * para representar opciones no seleccionadas, casillas de verificación o como elemento decorativo.
 * 
 * @example
 * ```html
 * <lib-icon-square-outline [width]="24" [height]="24" color="#000000"></lib-icon-square-outline>
 * ```
 */
@Component({
  selector: 'lib-icon-square-outline',
  standalone: true,
  imports: [],
  templateUrl: './square-outline.component.svg',
  styleUrl: '../icon.component.scss'
})
export class SquareOutlineComponent extends IconComponent {
}

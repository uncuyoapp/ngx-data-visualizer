import { Component } from '@angular/core';
import { IconComponent } from '../icon.component';

/**
 * Componente de ícono de contraer
 * 
 * Este componente muestra un ícono que representa la acción de contraer o minimizar
 * un elemento de la interfaz de usuario.
 * 
 * @example
 * ```html
 * <lib-icon-contract [width]="24" [height]="24" color="#000000"></lib-icon-contract>
 * ```
 */
@Component({
  selector: 'lib-icon-contract',
  standalone: true,
  imports: [],
  templateUrl: './contract.component.svg',
  styleUrl: '../icon.component.scss'
})
export class ContractComponent extends IconComponent {
}

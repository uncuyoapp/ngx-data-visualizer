import { Component } from '@angular/core';
import { IconComponent } from '../icon.component';

/**
 * Componente de ícono de expandir
 * 
 * Este componente muestra un ícono que representa la acción de expandir o maximizar
 * un elemento de la interfaz de usuario.
 * 
 * @example
 * ```html
 * <lib-icon-expand [width]="24" [height]="24" color="#000000"></lib-icon-expand>
 * ```
 */
@Component({
  selector: 'lib-icon-expand',
  standalone: true,
  imports: [],
  templateUrl: './expand.component.svg',
  styleUrl: '../icon.component.scss'
})
export class ExpandComponent extends IconComponent {
}

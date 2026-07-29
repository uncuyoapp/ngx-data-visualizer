import { Component } from '@angular/core';
import { IconComponent } from '../icon.component';

/**
 * Componente de ícono de cerrar / limpiar (X)
 */
@Component({
  selector: 'lib-icon-close',
  standalone: true,
  imports: [],
  templateUrl: './close.component.svg',
  styleUrl: '../icon.component.scss'
})
export class CloseComponent extends IconComponent {
}

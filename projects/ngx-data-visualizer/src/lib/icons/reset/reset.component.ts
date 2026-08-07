import { Component } from '@angular/core';
import { IconComponent } from '../icon.component';

/**
 * Componente de ícono de restablecer / recargar
 */
@Component({
  selector: 'lib-icon-reset',
  standalone: true,
  imports: [],
  templateUrl: './reset.component.svg',
  styleUrl: '../icon.component.scss'
})
export class ResetComponent extends IconComponent {
}

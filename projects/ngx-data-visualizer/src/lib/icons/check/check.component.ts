import { Component } from '@angular/core';
import { IconComponent } from '../icon.component';

/**
 * Componente de ícono de confirmación / check
 */
@Component({
  selector: 'lib-icon-check',
  standalone: true,
  imports: [],
  templateUrl: './check.component.svg',
  styleUrl: '../icon.component.scss'
})
export class CheckComponent extends IconComponent {
}

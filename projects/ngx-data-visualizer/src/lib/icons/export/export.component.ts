import { Component } from '@angular/core';
import { IconComponent } from '../icon.component';

/**
 * Componente de ícono de exportación / descarga
 */
@Component({
  selector: 'lib-icon-export',
  standalone: true,
  imports: [],
  templateUrl: './export.component.svg',
  styleUrl: '../icon.component.scss'
})
export class ExportComponent extends IconComponent {
}

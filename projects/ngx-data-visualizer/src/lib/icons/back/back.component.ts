import { Component } from '@angular/core';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'lib-icon-back',
  standalone: true,
  imports: [],
  templateUrl: './back.component.svg',
  styleUrl: '../icon.component.scss'
})
export class BackComponent extends IconComponent {
}

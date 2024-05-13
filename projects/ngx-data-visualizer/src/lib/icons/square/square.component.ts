import { Component } from '@angular/core';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'lib-icon-square',
  standalone: true,
  imports: [],
  templateUrl: './square.component.svg',
  styleUrl: '../icon.component.scss'
})
export class SquareComponent extends IconComponent {

}

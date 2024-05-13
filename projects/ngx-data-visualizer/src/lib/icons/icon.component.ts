import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  imports: [
    CommonModule
  ],
  template: '',
  styleUrl: './icon.component.scss'
})
export abstract class IconComponent {
  @Input() width: number = 30;
  @Input() height: number = 30;
  @Input() color!: string;
}

import { Component, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-spinner',
  templateUrl: './spinner.html',
})
export class Spinner {
  color = input<string>();
  size = input<string>();
  border = input<string>();

  setSpinnerAppearence() {
    const color = this.color() != undefined ? this.color() : 'border-gray-100';
    const size = this.size() != undefined ? this.size() : 'size-8';
    const borderSize = this.border() != undefined ? this.border() : 'border-2';

    return `${color} ${size} ${borderSize}`;
  }
}

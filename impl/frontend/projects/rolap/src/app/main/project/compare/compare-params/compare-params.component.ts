import { Component, Input } from '@angular/core';

@Component({
  selector: 'rolap-compare-params',
  templateUrl: './compare-params.component.html',
  styleUrls: ['./compare-params.component.scss'],
})
export class CompareParamsComponent {
  @Input() param: { key: any; value: any };
}

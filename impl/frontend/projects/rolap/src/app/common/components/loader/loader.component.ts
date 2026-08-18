import { Component } from '@angular/core';

import { DxLoadIndicatorModule } from 'devextreme-angular';

@Component({
  selector: 'rolap-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  standalone: true,
  imports: [DxLoadIndicatorModule],
})
export class LoaderComponent {}

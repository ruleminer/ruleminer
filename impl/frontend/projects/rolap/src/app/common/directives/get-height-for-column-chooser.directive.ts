import { Directive, HostListener, Input, OnInit } from '@angular/core';

/*
  This directive calculates and updates height of a column chooser.
  The height is calculated based on the minimum of the total columns' height
  or the specified percentage of the viewport's height, whichever is smaller.
  Updates occur on window resizing. 
  
  TS:
    public columnCount: number;
    public onContentReady(e: ContentReadyEvent): void {
      this.columnCount = e.component.columnCount(); 
    }
  HTML:
    <dx-data-grid ...(onContentReady)="onContentReady($event)">
      ...
      <dxo-column-chooser 
        [getHeightForColumnChooser]="100" 
        [columnCount]="columnCount" 
        #calcHeigh="getHeightForColumnChooser"
        [height]="calcHeigh.pixelHeight"
        .../>
    </dx-data-grid>

  Inputs:
  - getHeightForColumnChooser: viewport height for column chooser as percentage.
  - columnCount: number of columns in the column chooser.
*/
@Directive({
  selector: '[getHeightForColumnChooser]',
  exportAs: 'getHeightForColumnChooser',
  standalone: true,
})
export class GetHeightForColumnChooserDirective implements OnInit {
  private vhInPixel: number;
  private scrHeight: number;
  private percentage: number;
  private numberOfColumns: number;
  @Input() set columnCount(count: number) {
    this.numberOfColumns = count;
    this.calculatePixelValue();
  }
  @Input('getHeightForColumnChooser') set vhPercentage(percentage: number) {
    this.percentage = percentage;
    this.calculatePixelValue();
  }

  constructor() {
    this.getScreenSize();
  }

  ngOnInit(): void {
    this.calculatePixelValue();
  }

  @HostListener('window:resize', ['$event'])
  private getScreenSize(): void {
    this.scrHeight = window.innerHeight;
    this.calculatePixelValue();
  }

  private calculatePixelValue(): void {
    if (this.numberOfColumns && this.numberOfColumns > 0) {
      const columnHeightPx = 52;
      const allColumnsHeightPx = columnHeightPx * this.numberOfColumns + 68;
      this.vhInPixel = Math.min(allColumnsHeightPx, (this.percentage / 100) * this.scrHeight);
    } else {
      this.vhInPixel = (this.percentage / 100) * this.scrHeight;
    }
  }

  public get pixelHeight(): number {
    return this.vhInPixel;
  }
}

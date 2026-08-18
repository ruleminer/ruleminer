import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';

import { LoaderComponent } from '../components/loader/loader.component';

@Directive({
  selector: '[rolapLoading]',
  standalone: true,
})
export class LoadingDirective implements OnInit {
  private isLoading: boolean = true;
  @Input()
  set rolapLoading(condition: boolean | null) {
    if (condition === null) {
      condition = true;
    }
    this.isLoading = condition;
    this.updateView();
  }
  constructor(private templateRef: TemplateRef<any>, private viewContainer: ViewContainerRef) {}

  ngOnInit() {
    this.updateView();
  }

  private updateView() {
    this.viewContainer.clear();

    if (this.isLoading) {
      const loader = this.viewContainer.createComponent(LoaderComponent);
      this.viewContainer.insert(loader.hostView);
    } else {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}

import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  public onClick(target: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(target);
    if (clickedInside) return;
    this.clickOutside.emit();
  }

  @HostListener('document:keydown.escape', ['$event'])
  public onEscape() {
    this.clickOutside.emit();
  }
}

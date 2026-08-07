import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Project } from '../models/project';

@Component({
  selector: 'rolap-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent {
  @Input() projects: Project[];
  @Output() projectDeleted: EventEmitter<void> = new EventEmitter<void>();
  @Output() projectUpdated: EventEmitter<void> = new EventEmitter<void>();

  public onProjectDeleted(): void {
    this.projectDeleted.emit();
  }

  public onProjectUpdated(): void {
    this.projectUpdated.emit();
  }
}

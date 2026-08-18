import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { filterOutNullish } from '../../../common/utils/rxjsUtils';
import { Subject, Subscription, filter, switchMap, takeUntil } from 'rxjs';

import { faEllipsis } from '@fortawesome/pro-regular-svg-icons';
import { TranslateService } from '@ngx-translate/core';

import { ModalRef } from '../../../common/services/modal/modal-ref';
import { ModalService } from '../../../common/services/modal/modal.service';
import { ProblemTypes } from '../../data-upload/utils/enums';
import { ProjectAddEditComponent } from '../project-add-edit/project-add-edit.component';
import { DeleteProjectConfirmComponent } from './delete-project-confirm/delete-project-confirm.component';

type ContextMenuItem = { text: string; onClick: () => void };
@Component({
  selector: 'rolap-project-tile',
  templateUrl: './project-tile.component.html',
  styleUrls: ['./project-tile.component.scss'],
})
export class ProjectTileComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('tile', { static: true }) tile: ElementRef<HTMLDivElement>;
  @Input() id: number;
  @Input() name: string;
  @Input() description: string;
  @Input() type: ProblemTypes;
  @Input() created_at: string;
  @Input() updated_at: string;
  @Input() last_opened_at: string;
  @Input() isInformation: boolean = false;
  @Output() projectDeleted: EventEmitter<void> = new EventEmitter<void>();
  @Output() projectUpdated: EventEmitter<void> = new EventEmitter<void>();

  public titleHtmlId: string;
  public threeDots = faEllipsis;
  public nameTruncated: string;
  public title: {
    value: string;
    htmlId: string | null;
  };
  public descriptionData: {
    value: string;
    truncatedValue: string | null;
  };
  public contextMenuItems: ContextMenuItem[];
  private resizeObserver: ResizeObserver;

  private ngUnsubscribe: Subject<void> = new Subject();
  private subscription: Subscription;

  constructor(private modalService: ModalService, private translate: TranslateService, private router: Router) {}

  ngAfterViewInit(): void {
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id']) {
      this.setContextMenuAndTitleHtmlID();
    }

    if (changes['name']) this.setName();
    if (changes['description']) this.setDescription();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    this.subscription?.unsubscribe();
    this.resizeObserver?.disconnect();
  }

  public navigateToProject(id: number): void {
    this.router.navigate(['/projects', id]);
  }

  private onDeleteClick(projectId: number = this.id): void {
    this.modalService
      .open(DeleteProjectConfirmComponent, 'project.delete_project.title', '400px', undefined, {
        projectId: projectId,
      })
      .pipe(
        switchMap((modalRef: ModalRef<ProjectAddEditComponent>) =>
          modalRef.getResult().pipe(filter((res) => res !== undefined)),
        ),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((res: any) => {
        if (!res) return;
        this.projectDeleted.emit();
      });
  }

  public onEditClick(isInformation: boolean = false): void {
    this.modalService
      .open(ProjectAddEditComponent, 'project.information', '400px', undefined, {
        editMode: true,
        projectId: this.id,
        initialTitle: this.name,
        initialDescription: this.descriptionData.value,
        initialPurpose: this.type,
        created_at: this.created_at,
        updated_at: this.updated_at,
        last_opened_at: this.last_opened_at,
        isInformation: isInformation,
      })
      .pipe(
        switchMap((modalRef: ModalRef<ProjectAddEditComponent>) =>
          modalRef.getResult().pipe(filter((res) => res !== undefined)),
        ),
        filterOutNullish(),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe((res: any) => {
        if (res.delete) return this.projectDeleted.emit();
        this.projectUpdated.emit();
      });
  }

  public showProjectInfo(event: Event): void {
    event.stopPropagation();
    this.onEditClick(true);
  }

  /**
   * Context menu data initialization
   */
  private contextMenuInit() {
    this.subscription?.unsubscribe();
    this.subscription = this.translate
      .stream('project')
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((res) => {
        this.contextMenuItems = [
          { text: res.button.edit, onClick: () => this.onEditClick() },
          { text: res.button.delete, onClick: () => this.onDeleteClick() },
        ];
      });
  }

  private setName(): void {
    if (!this.name) throw new Error('Name cannot be empty');
    this.truncateName(this.tile.nativeElement.clientWidth);
  }

  private setContextMenuAndTitleHtmlID(): void {
    this.contextMenuInit();
    if (!this.titleHtmlId) {
      this.titleHtmlId = `project-tile-${this.id}`;
    }
  }

  private setDescription(): void {
    if (!this.description) {
      this.descriptionData = { value: '', truncatedValue: '' };
      return;
    }
    this.truncateDescription(this.tile.nativeElement.clientWidth);
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.truncateDescription(entry.contentRect.width);
        this.truncateName(entry.contentRect.width);
      }
    });
    this.resizeObserver.observe(this.tile.nativeElement);
  }

  private truncateDescription(width: number): void {
    let maxLength;
    if (width < 350) {
      maxLength = 50;
    } else if (width < 420) {
      maxLength = 70;
    } else if (width < 480) {
      maxLength = 100;
    } else if (width < 640) {
      maxLength = 200;
    } else {
      maxLength = 50;
    }

    const value = this.description;
    const truncatedValue = value.length > maxLength ? value.slice(0, maxLength) + '...' : value;
    this.descriptionData = { value, truncatedValue };
  }

  private truncateName(width: number): void {
    let maxLength;
    if (width < 330) {
      maxLength = 22;
    } else if (width < 420) {
      maxLength = 30;
    } else if (width < 480) {
      maxLength = 36;
    } else {
      maxLength = 50;
    }

    const value = this.name;
    const truncatedValue = value.length > maxLength ? value.slice(0, maxLength) + '...' : value;
    this.title = { value: truncatedValue, htmlId: this.titleHtmlId };
  }
}

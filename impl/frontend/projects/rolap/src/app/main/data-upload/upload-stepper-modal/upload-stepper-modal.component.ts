import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subject, debounceTime, map, switchMap, take, takeUntil } from 'rxjs';

import { faArrowsRotate } from '@fortawesome/pro-solid-svg-icons';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as Papa from 'papaparse';

import { StepChangeEvent, StepperComponent } from '../../../common/components/stepper/stepper.component';
import { ErrorResponse } from '../../../common/interfaces/error-response.model';
import { Modal } from '../../../common/services/modal/modal';
import { NotifyService } from '../../../common/services/notify/notify.service';
import { AppState } from '../../../common/store/app-state.model';
import { activeProjectSelector } from '../../../common/store/project/project.selectors';
import { ProjectService } from '../../project/service/project.service';
import { DatasetInfoFormValue } from '../dataset-info/dataset-info.component';
import { FileFormatValues } from '../file-format-form/types';
import { SelectedColumnsUploadService } from '../selected-columns-upload.service';
import { FileExtension, ProblemTypes } from '../utils/enums';
import { AvailableFileExtensions, DataUploadTypes, FormData, ProjectFormValue } from '../utils/types';
import { isFileCsv } from '../utils/utils';

export interface FileMetadata {
  file?: File;
  fileSize?: number;
  hasHeader?: boolean;
  separator?: string;
  encoding?: string;
  purpose?: string;
  columns?: any;
  missingValues?: string;
  decimal?: string;
  dataSource?: any;
}

@Component({
  selector: 'rolap-upload-stepper-modal',
  templateUrl: './upload-stepper-modal.component.html',
  styleUrls: ['./upload-stepper-modal.component.scss'],
  providers: [SelectedColumnsUploadService],
})
export class UploadStepperModalComponent implements OnInit, OnDestroy {
  @ViewChild(StepperComponent) stepper: StepperComponent;
  @Input() isNewProject = true;
  public fileDataAvailable = false;
  public jsonOutput: FileMetadata = {};
  public fileString: string | null;
  public disableNextButton = false;
  public projectInfo: FormData = { purpose: ProblemTypes.Classification, projectName: null, projectDescription: null };
  public datasetInfo: { datasetName: string; datasetDescription: string | null };
  public datasetInfoValid = false;
  public isProjectInfoValid = false;
  public isChooseFileStepValid = false;
  public isDataFormatStepValid = false;
  public isColumnConfigurationValid = false;
  public faArrowsRotate = faArrowsRotate;
  public isSaving = false;
  public extensions: AvailableFileExtensions[] = [FileExtension.csv];

  private columnConfigurationStepData: any;
  private file: File;
  private orginalFile: File;
  private ngUnsubscribe: Subject<void> = new Subject();
  private readonly HANDLED_ERRORS = ['invalid_label_column_values', 'empty_label_column_values'];

  constructor(
    private projectService: ProjectService,
    private modal: Modal<UploadStepperModalComponent>,
    private notifyService: NotifyService,
    private translate: TranslateService,
    private store: Store<AppState>,
    private selectedColumnsUploadService: SelectedColumnsUploadService,
  ) {}

  ngOnInit(): void {
    if (this.isNewProject) return;
    this.store
      .select(activeProjectSelector)
      .pipe(take(1), takeUntil(this.ngUnsubscribe))
      .subscribe((project) => {
        if (!project || !project.id) return;
        this.projectInfo.projectName = project.name;
        this.projectInfo.projectDescription = project.description;
        this.projectInfo.purpose = project.type_of_problem;
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public onFormValues(formValues: FileFormatValues): void {
    if (!formValues.valid || formValues.hasErrors) {
      this.isDataFormatStepValid = false;
      return;
    }
    const { encoding, separator, decimal, missingValues } = formValues;
    this.jsonOutput.encoding = encoding;
    this.jsonOutput.separator = separator;
    this.jsonOutput.decimal = decimal;
    this.jsonOutput.missingValues = missingValues;
    this.jsonOutput.hasHeader = formValues.hasHeader;
    this.jsonOutput.dataSource = formValues.dataSource;

    this.updateFileBasedOnHeader(this.file);
    this.isDataFormatStepValid = true;
  }

  public onFileInfoValues(fileInfoValues: DataUploadTypes | null): void {
    this.fileString = null;
    this.fileDataAvailable = false;
    this.isChooseFileStepValid = false;

    if (!fileInfoValues) return;

    const { file, lines } = fileInfoValues;
    if (file && lines) {
      this.file = file;
      this.orginalFile = file;
      this.jsonOutput.fileSize = file.size / 1024;

      this.fileString = lines;
      this.fileDataAvailable = true;
      this.checkFile();
    }
  }

  public stepBack(): void {
    this.stepper.stepBack();
  }

  public stepNext(): void {
    this.stepper.stepNext();
  }

  public onStepChange(event: StepChangeEvent): void {
    const stepComponent = event.stepComponent;
    stepComponent.allowGoingFurther = true;
  }

  public onFileUploadStepComplete(readyFileValuesToSend: any): void {
    this.jsonOutput.columns = readyFileValuesToSend;
  }

  public save(): void {
    if (this.isNewProject) return this.createAndUploadDatasetForNewProject();
    this.uploadDatasetForExistingProject();
  }

  public onProjectFromChange(data: ProjectFormValue): void {
    this.projectInfo = data.formValue;
    this.isProjectInfoValid = data.isValid;
  }

  public handleDatasetFormData(value: DatasetInfoFormValue): void {
    this.datasetInfoValid = value.isValid;
    this.datasetInfo = value.formValue;
  }

  public handleColumnsChoiceFormData(data: any): void {
    this.isColumnConfigurationValid = data.isValid;
    this.columnConfigurationStepData = data;
  }

  private updateFileBasedOnHeader(file: File) {
    Papa.parse(file, {
      complete: (results) => this.useOriginalFile(),
      error: (error) => console.error('Error while reading the file:', error),
    });
  }

  private useOriginalFile(): void {
    this.file = this.orginalFile;
    this.jsonOutput.fileSize = this.orginalFile.size / 1024;
  }

  private uploadDatasetForExistingProject() {
    this.isSaving = true;
    this.selectedColumnsUploadService.selectedColumns$
      .pipe(
        take(1),
        switchMap((selectedColumns) => {
          const mappedData: any = this.mapToOutputDataSet(selectedColumns);
          return this.store.select(activeProjectSelector).pipe(
            take(1),
            switchMap((project) => {
              return this.projectService.uploadDataset(project.id, this.file, mappedData).pipe(
                map((uploadResponse) => {
                  return { uploadResponse, mappedData };
                }),
              );
            }),
            debounceTime(500),
          );
        }),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe({
        next: ({ uploadResponse, mappedData }) => {
          if (!uploadResponse) return;
          mappedData.name = uploadResponse.name;
          mappedData.description = uploadResponse.description;
          mappedData.project_id = uploadResponse.project_id;
          mappedData.dataset_id = uploadResponse.dataset_id;
          this.modal.close({ projectId: uploadResponse.project_id, file: this.file, mappedData, isNewProject: false });
        },
        error: (error) => this.handleError(error),
      });
  }

  private createAndUploadDatasetForNewProject(): void {
    this.isSaving = true;

    this.selectedColumnsUploadService.selectedColumns$
      .pipe(
        take(1),
        switchMap((selectedColumns) => {
          const mappedData = this.mapToOutputFormat(selectedColumns);
          return this.projectService.createAndUploadProject(this.file, mappedData).pipe(
            map((res) => {
              return { res, mappedData };
            }),
          );
        }),
        debounceTime(500),
        takeUntil(this.ngUnsubscribe),
      )
      .subscribe({
        next: ({ res, mappedData }) => {
          if (res && res.project && res.project.id) {
            const projectId = res.project.id;
            this.modal.close({
              projectId,
              file: this.file,
              mappedData,
              isNewProject: true,
            });
          }
        },
        error: (error) => this.handleError(error),
      });
  }

  private mapToOutputDataSet(selectedColumns: string[]) {
    const columnOrder = this.selectedColumnsUploadService.columnOrder;
    const selected_columns = selectedColumns.map((column) => columnOrder.get(column) as number);
    const assigned_column_types = Object.values(this.columnConfigurationStepData.columnTypesSelected);
    const decisionColumn = this.columnConfigurationStepData.decisionColumn;
    const survivalTimeColumn = this.columnConfigurationStepData.survivalTimeColumn;
    const assigned_column_classes = Object.keys(this.columnConfigurationStepData.columnTypesSelected).map((key) => {
      if (decisionColumn === key) return 'class';
      if (survivalTimeColumn === key) return 'survival_time';
      return 'attr';
    });

    const isMissingValuesDefined = this.jsonOutput.missingValues !== null && this.jsonOutput.missingValues !== '';
    return {
      name: this.datasetInfo.datasetName,
      description: this.datasetInfo.datasetDescription || '',
      delimiter: this.jsonOutput.separator === '\\t' ? '\t' : this.jsonOutput.separator || ',',
      decimal_separator: this.jsonOutput.decimal || '.',
      selected_columns,
      assigned_column_types,
      assigned_column_classes,
      ...(isMissingValuesDefined && { missing_value_sign: this.jsonOutput.missingValues }),
      encoding: this.jsonOutput.encoding,
      header: this.jsonOutput.hasHeader,
    };
  }

  private mapToOutputFormat(selectedColumns: string[]) {
    return {
      project: {
        name: this.projectInfo.projectName,
        description: this.projectInfo.projectDescription || '',
        type_of_problem: this.projectInfo.purpose?.toLowerCase(),
      },
      dataset: this.mapToOutputDataSet(selectedColumns),
    };
  }

  private checkFile(): void {
    if (!this.file) return;
    if (this.file.size === 0 || !isFileCsv(this.file)) return;
    //we will check if the file is valid in the "Data Format Step" when we know the delimiter
    this.isChooseFileStepValid = true;
  }

  private handleError(httpError: HttpErrorResponse) {
    this.isSaving = false;
    const errorCode = (httpError.error as ErrorResponse).err_msg_id;
    const problemType = this.projectInfo.purpose;

    // propagate higher up to the global error handler
    if (!errorCode || !this.HANDLED_ERRORS.includes(errorCode)) throw httpError;

    // this errors requires different user messages for different project problem types
    this.notifyService.showNotify(
      this.translate.instant(`toast_messages.errors.server_messages.${errorCode}.${problemType}`),
      'error',
    );
  }
}

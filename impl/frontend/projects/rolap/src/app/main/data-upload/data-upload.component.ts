import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';

import { faCheck, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { DxFileUploaderComponent } from 'devextreme-angular';

import { AvailableFileExtensions } from './utils/types';
import { checkFileExtension } from './utils/utils';

@Component({
  selector: 'rolap-data-upload',
  templateUrl: './data-upload.component.html',
  styleUrls: ['./data-upload.component.scss'],
})
export class DataUploadComponent {
  @ViewChild('fileUploader', { static: false }) fileUploader: DxFileUploaderComponent;
  @Input() extensions: AvailableFileExtensions[];
  @Output() fileInfoAndData = new EventEmitter<{ lines: string; file: File } | null>();

  public faCheck = faCheck;
  public faXmark = faXmark;
  public messageError = '';
  public dropZoneClasses: string[] = ['dx-theme-border-color'];
  public textVisible = true;
  public progressVisible = false;
  public showStatus = false;
  public progressValue = 0;
  public fileIsUploaded = false;

  public fileName: string;
  public availableExtensionsMessage = '';

  private maxNKBtoLoad = 10;
  private file: File | null;
  public onDropZoneEnter(e: { dropZoneElement: { id: string } }) {
    if (e.dropZoneElement.id === 'dropzone-external') {
      this.dropZoneClasses = ['dx-theme-accent-as-border-color', 'dropzone-active'];
    }
  }

  public onDropZoneLeave(e: { dropZoneElement: { id: string } }) {
    if (e.dropZoneElement.id === 'dropzone-external') {
      this.dropZoneClasses = ['dx-theme-border-color'];
    }
  }

  public onValueChanged(e: any): void {
    this.file = e.value[0];
    const file = e.value[0];
    const fileReader = new FileReader();

    fileReader.onload = () => {
      const fileText = fileReader.result as string;
      const firstNKB = fileText.slice(0, this.maxNKBtoLoad * 1024);
      const lines = firstNKB
        .split('\n')
        .slice(0, 10)
        .map((item) => item.replace(/\r/g, ''))
        .join('\n');

      this.fileIsUploaded = true;

      this.checkFile(file);
      this.fileInfoAndData.emit({ lines, file: file });
    };
    fileReader.readAsText(file);
    this.textVisible = false;
    this.progressVisible = false;
    this.progressValue = 0;
    this.messageError = '';
    this.fileName = file.name;
  }

  public onProgress(e: { bytesLoaded: number; bytesTotal: number }) {
    this.progressValue = (e.bytesLoaded / e.bytesTotal) * 100;
  }

  public onUploadStarted() {
    this.fileIsUploaded = false;
    this.progressVisible = true;
  }

  private checkFile(file: File): void {
    if (!file) return;
    if (file.size === 0) return this.handleEmptyFile();
    if (!checkFileExtension(file, this.extensions)) return this.handleWrongExtension();
    this.messageError = '';
    this.availableExtensionsMessage = '';
  }

  private handleEmptyFile(): void {
    this.messageError = 'toast_messages.errors.empty_file';
  }

  private handleWrongExtension(): void {
    this.messageError = 'toast_messages.errors.wrong_extension';
    this.availableExtensionsMessage = this.extensions.join(', ');
  }

  public clearFileUploader() {
    if (!this.fileUploader) return;

    this.file = null;
    this.fileIsUploaded = false;
    this.textVisible = true;
    this.progressVisible = false;
    this.progressValue = 0;
  }
}

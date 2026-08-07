export class ColumnNameErrors {
  private _hasErrors = false;
  constructor(
    private _patternError: boolean = false,
    private _maxLengthError: boolean = false,
    private _indexColumnPresentError: boolean = false,
    private _columnNameDuplicatedError: boolean = false,
  ) {
    this._hasErrors = this.checkIfHasErrors();
  }

  public set patternError(v: boolean) {
    this._patternError = v;
    this._hasErrors = this.checkIfHasErrors();
  }

  public get patternError(): boolean {
    return this._patternError;
  }
  public set maxLengthError(v: boolean) {
    this._maxLengthError = v;
    this._hasErrors = this.checkIfHasErrors();
  }

  public get maxLengthError(): boolean {
    return this._maxLengthError;
  }

  public set indexColumnPresentError(v: boolean) {
    this._indexColumnPresentError = v;
    this._hasErrors = this.checkIfHasErrors();
  }

  public get indexColumnPresentError(): boolean {
    return this._indexColumnPresentError;
  }

  public set columnNameDuplicatedError(v: boolean) {
    this._columnNameDuplicatedError = v;
    this._hasErrors = this.checkIfHasErrors();
  }

  public get columnNameDuplicatedError(): boolean {
    return this._columnNameDuplicatedError;
  }

  public get hasErrors(): boolean {
    return this._hasErrors;
  }

  public clearAll() {
    this.patternError = false;
    this.maxLengthError = false;
    this.indexColumnPresentError = false;
    this.columnNameDuplicatedError = false;
  }

  public join(otherErrors: ColumnNameErrors) {
    this.patternError = this.patternError || otherErrors.patternError;
    this.maxLengthError = this.maxLengthError || otherErrors.maxLengthError;
    this.indexColumnPresentError = this.indexColumnPresentError || otherErrors.indexColumnPresentError;
    this.columnNameDuplicatedError = this.columnNameDuplicatedError || otherErrors.columnNameDuplicatedError;
  }

  private checkIfHasErrors(): boolean {
    return this.patternError || this.maxLengthError || this.indexColumnPresentError || this.columnNameDuplicatedError;
  }
}

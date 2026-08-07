import { FilterDataType } from "../../filter-builder.types";

export interface RawGroupFormValue {
    condition: 'AND' | 'OR';
    rules: (RawGroupFormValue | RawConditionFormValue)[];
}

export interface RawConditionFormValue {
    field: string | null;
    operator: string | null;
    value: any | null;
    valueEnd?: any | null;
    dataType?: FilterDataType | null | undefined;
}
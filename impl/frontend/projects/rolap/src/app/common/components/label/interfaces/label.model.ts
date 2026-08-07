export interface Label {
  id: number;
  name: string;
  color: string;
}

export interface LabelPost {
  name: string;
  color: string;
}

export interface LabelSelected extends Label {
  selected?: boolean;
}

export type LabelPopupType = 'new' | 'edit' | 'select';

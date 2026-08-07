import { Observable } from 'rxjs';

export enum TourPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
}

export interface TourStep {
  title: string;
  content: string;
  element: string;
  position?: TourPosition;
  route?: string | string[];
  isTreeView?: boolean; // if item must used treeview contextmenu
  isModal?: boolean; // if modal is declared this will reopen modal
  onExitClick?: (arg?: any) => void;
  onNextTriggerAction?: (arg?: any) => void; //This is function after increment current step index
  onPrevTriggerAction?: (arg?: any) => void;
  isViewLoaded: (arg?: any) => Observable<boolean>;
}

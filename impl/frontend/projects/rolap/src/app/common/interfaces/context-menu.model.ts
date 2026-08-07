import { ItemClickEvent } from 'devextreme/ui/context_menu';

export interface ContextMenuItem {
  text: string;
  type?: string;
  disabled?: boolean;
  onItemClick?: (e: ItemClickEvent) => void;
}

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

/**
 * Defines the structure for a single action displayed in the icon bar.
 * Used by action services and consumed by IconsActionBarComponent.
 */
export interface ActionItem {
  /** The FontAwesome icon for the action. */
  icon: IconDefinition;
  /** Tooltip text for the action's icon. */
  title: string;
  /** Function to execute when the action is clicked. */
  action: () => void;
  /** Whether the action button is disabled. */
  disabled: boolean;
}
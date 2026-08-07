import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { sortField } from '../../../common/store/projectSearch/projectSearch.types';

export type SortIcons = {
  [key in sortField]: IconDefinition | null;
};
export { sortField };

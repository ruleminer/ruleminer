export enum sortTypes {
  ASC = 'asc',
  DESC = 'desc',
}

export enum sortField {
  NAME = 'name',
  LAST_OPENING = 'lastOpening',
  LAST_MODIFICATION = 'lastModification',
}

export interface ProjectSearch {
  sortField: sortField | null;
  sortType: sortTypes | null;
  searchValue: string;
}

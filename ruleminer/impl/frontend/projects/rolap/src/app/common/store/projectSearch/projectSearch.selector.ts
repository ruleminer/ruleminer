import { AppState } from '../app-state.model';
import { ProjectSearch } from './projectSearch.types';

export const selectProjectSearch = (state: AppState): ProjectSearch => state.projectSearch;

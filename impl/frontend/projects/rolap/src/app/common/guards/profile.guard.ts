import { inject } from "@angular/core";
import { CanDeactivateFn } from "@angular/router";
import { ModalService } from "../services/modal/modal.service";
import { map, take } from "rxjs";

export const ModalGuard: CanDeactivateFn<any> = () => {
  const modalService = inject(ModalService);
  const activeModals = modalService.getActiveModals();
  if (activeModals.length === 0) return true;
  const modalRef = activeModals[0];
  return modalRef.modal.confirmClose().pipe(
      take(1),
      map((res) => {
        if (!res || res === undefined) {
          return false; 
        }
        modalService.closeAll();
        return true; 
      }
    ));
};
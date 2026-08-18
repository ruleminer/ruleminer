import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { map } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { UserLimits } from '../../project/service/models/account.model';
import { ProfileService } from '../service/profile.service';

@Component({
  selector: 'rolap-subscription-plan',
  templateUrl: './subscription-plan.component.html',
  styleUrls: ['./subscription-plan.component.scss'],
})
export class SubscriptionPlanComponent implements OnInit {
  @Input() plan: string;
  @Input() limits: UserLimits;

  private profileService = inject(ProfileService);
  private translateService = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  public planNames: string[] = [];
  public planUrl: string;

  get setCurrentPlan() {
    return this.planNames.find((plan) => plan === this.plan);
  }

  ngOnInit() {
    this.updateChangePlanUrl(this.translateService.currentLang);
    this.getPlanList();
    this.translateService.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateChangePlanUrl(this.translateService.currentLang);
    });
  }

  private getPlanList() {
    this.profileService
      .getSubscriptionPlans()
      .pipe(
        map((data) => data.map((plan) => plan.name)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((planNames) => {
        this.planNames = planNames;
      });
  }
  private updateChangePlanUrl(currentLang: string): void {
    this.planUrl = currentLang === 'en' ? 'https://ruleminer.ai/access' : `https://ruleminer.ai/${currentLang}/dostep/`;
  }
}

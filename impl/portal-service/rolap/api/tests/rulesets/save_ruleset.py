from django.urls import reverse
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase


class SaveRulesetTestCase(RulesetAbstractTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_save_ruleset(self):
        # not possible - we need to run rules-evaluation-service in test mode
        # with access to the storage
        url = reverse("save-ruleset", kwargs={"ruleset_id": self.ruleset.pk})
        data = {}
        self.client.force_authenticate(self.user)
        pass

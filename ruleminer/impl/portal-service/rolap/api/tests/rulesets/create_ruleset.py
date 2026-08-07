from django.urls import reverse
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase


class CreateRulesetTestCase(RulesetAbstractTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_create_ruleset(self):
        # not possible - we need to run rules-evaluation-service in test mode
        # with access to the storage
        url = reverse("create-ruleset")
        data = {}
        self.client.force_authenticate(self.user)
        pass

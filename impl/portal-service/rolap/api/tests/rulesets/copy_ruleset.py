from django.urls import reverse
from rolap.api.tests.rulesets.ruleset_abstract import RulesetAbstractTestCase


class CopyRulesetTestCase(RulesetAbstractTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_clone_ruleset(self):
        # not possible - we need to run rules-evaluation-service in test mode
        # with access to the storage
        # we would also need to upload a new dataset
        dataset_id = 0
        url = reverse("copy-ruleset",
                      kwargs={"ruleset_id": self.ruleset.pk, "dataset_id": dataset_id})
        self.client.force_authenticate(self.user)
        pass

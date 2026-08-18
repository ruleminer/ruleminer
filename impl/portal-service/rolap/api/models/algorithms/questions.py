from django.db import models


class Question(models.Model):
    algorithm = models.ForeignKey(
        'api.Algorithm',
        on_delete=models.CASCADE,
        related_name='questions',
    )
    question_number = models.IntegerField()
    question_text_pl = models.TextField()
    question_text_en = models.TextField()

    class Meta:
        unique_together = ('algorithm', 'question_number')


class Answer(models.Model):
    answer_number = models.IntegerField()
    answer_text_pl = models.TextField()
    answer_text_en = models.TextField()
    next_question_number = models.IntegerField(null=True)
    question = models.ForeignKey(
        'Question', on_delete=models.CASCADE, related_name='question_answers')


class NAAlgorithmParameters(models.Model):
    id = models.AutoField(primary_key=True)
    algorithm = models.ForeignKey(
        'api.Algorithm',
        on_delete=models.CASCADE,
        related_name='na_algorithm_parameters',
    )
    answer_string = models.CharField(max_length=20)
    params_json = models.JSONField()

    class Meta:
        unique_together = ('algorithm', 'answer_string')

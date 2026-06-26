import uuid
from django.db import models
from django.conf import settings

class Note(models.Model):
    TYPE_CHOICES = (
        ('thought', 'Thought'),
        ('quote', 'Quote'),
        ('article', 'Article'),
        ('question', 'Question'),
        ('idea', 'Idea'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=255)
    content = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='thought')
    source_url = models.URLField(max_length=500, blank=True, null=True)
    tags = models.ManyToManyField('tags.Tag', blank=True, related_name='notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

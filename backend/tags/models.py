import uuid
from django.db import models
from django.conf import settings

class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tags')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#032582')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'name')

    def __str__(self):
        return self.name

import uuid
from django.db import models

class Folder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='folders')
    name = models.CharField(max_length=255)
    icon = models.CharField(max_length=10, default='📁')
    color = models.CharField(max_length=7, default='#06B6D4')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'name')

    def __str__(self):
        return self.name

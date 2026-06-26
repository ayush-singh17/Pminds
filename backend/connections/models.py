import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class Connection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='connections')
    note_from = models.ForeignKey('notes.Note', on_delete=models.CASCADE, related_name='connections_from')
    note_to = models.ForeignKey('notes.Note', on_delete=models.CASCADE, related_name='connections_to')
    reason = models.TextField(blank=True, null=True)
    strength = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(1.0)], default=0.0)
    ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'note_from', 'note_to')

    def __str__(self):
        return f"{self.note_from} -> {self.note_to}"

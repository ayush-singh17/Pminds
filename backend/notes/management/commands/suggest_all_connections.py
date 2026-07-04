from django.core.management.base import BaseCommand
from notes.models import Note
from connections.models import Connection
from django.db import models as db_models
from django.conf import settings
import httpx

class Command(BaseCommand):
    help = 'Suggest connections for all existing notes'

    def handle(self, *args, **kwargs):
        notes = Note.objects.all()
        total = notes.count()
        self.stdout.write(f'Processing {total} notes...')

        for i, target in enumerate(notes):
            candidates = Note.objects.filter(user=target.user).exclude(id=target.id)
            if not candidates.exists():
                continue

            payload = {
                'target': {
                    'id': str(target.id),
                    'title': target.title,
                    'content': target.content,
                },
                'candidates': [
                    {'id': str(n.id), 'title': n.title, 'content': n.content}
                    for n in candidates
                ],
                'threshold': 0.35,
            }

            try:
                resp = httpx.post(
                    f"{settings.AI_SERVICE_URL}/connections/suggest",
                    json=payload,
                    timeout=30
                )
                suggestions = resp.json().get('suggestions', [])
                created = 0
                for s in suggestions:
                    exists = Connection.objects.filter(
                        user=target.user
                    ).filter(
                        db_models.Q(note_from=target, note_to_id=s['id']) |
                        db_models.Q(note_from_id=s['id'], note_to=target)
                    ).exists()
                    if not exists:
                        # Get reason from AI
                        reason = ''
                        try:
                            connected_note = Note.objects.get(id=s['id'])
                            reason_resp = httpx.post(
                                f"{settings.AI_SERVICE_URL}/connections/explain",
                                json={
                                    'note1': {
                                        'id': str(target.id),
                                        'title': target.title,
                                        'content': target.content,
                                    },
                                    'note2': {
                                        'id': s['id'],
                                        'title': connected_note.title,
                                        'content': connected_note.content,
                                    }
                                },
                                timeout=30
                            )
                            reason = reason_resp.json().get('reason', '')
                        except Exception:
                            pass

                        Connection.objects.create(
                            user=target.user,
                            note_from=target,
                            note_to_id=s['id'],
                            strength=s['strength'],
                            reason=reason,
                            ai_generated=True,
                        )
                        created += 1
                self.stdout.write(f'[{i+1}/{total}] {target.title} → {created} connections')
            except Exception as e:
                self.stdout.write(f'[{i+1}/{total}] {target.title} → failed: {e}')

        self.stdout.write(self.style.SUCCESS('Done.'))

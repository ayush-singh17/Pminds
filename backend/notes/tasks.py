from celery import shared_task


@shared_task
def suggest_connections_async(note_id: str, user_id: str):
    from notes.models import Note
    from connections.models import Connection
    from django.db import models as db_models
    from django.conf import settings
    import httpx

    try:
        target = Note.objects.get(id=note_id)
        candidates = Note.objects.filter(user_id=user_id).exclude(id=note_id).prefetch_related('tags')
        if not candidates.exists():
            return

        payload = {
            'target': {
                'id': str(target.id),
                'title': target.title,
                'content': target.content,
                'tags': [tag.name for tag in target.tags.all()],
            },
            'candidates': [
                {
                    'id': str(n.id),
                    'title': n.title,
                    'content': n.content,
                    'tags': [tag.name for tag in n.tags.all()],
                }
                for n in candidates
            ],
            'threshold': 0.35,
        }

        resp = httpx.post(
            f"{settings.AI_SERVICE_URL}/connections/suggest",
            json=payload, timeout=60
        )
        suggestions = resp.json().get('suggestions', [])
        for s in suggestions:
            exists = Connection.objects.filter(user_id=user_id).filter(
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
                    user_id=user_id,
                    note_from=target,
                    note_to_id=s['id'],
                    strength=s['strength'],
                    reason=reason,
                    ai_generated=True,
                )
    except Exception as e:
        print(f"Connection suggestion failed: {e}")

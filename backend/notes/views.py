from rest_framework import generics, permissions, filters
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Note
from .serializers import NoteSerializer
from django.conf import settings
import httpx
from connections.models import Connection
from django.db import models

class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['type']
    search_fields = ['title', 'content']

    def get_queryset(self):
        folder_id = self.request.query_params.get('folder')
        unfiled = self.request.query_params.get('unfiled')
        
        qs = Note.objects.filter(user=self.request.user)
        
        if folder_id:
            qs = qs.filter(folders__id=folder_id)
        elif unfiled == 'true':
            qs = qs.filter(folders__isnull=True)
        
        return qs.distinct()

    def perform_create(self, serializer):
        note = serializer.save(user=self.request.user)
        # Auto-suggest connections after creation
        self._suggest_connections(note)

    def _suggest_connections(self, target):
        from connections.models import Connection
        from django.db import models as db_models
        import httpx
        from django.conf import settings

        candidates = Note.objects.filter(user=target.user).exclude(id=target.id)
        if not candidates.exists():
            return

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
            for s in suggestions:
                exists = Connection.objects.filter(
                    user=target.user
                ).filter(
                    db_models.Q(note_from=target, note_to_id=s['id']) |
                    db_models.Q(note_from_id=s['id'], note_to=target)
                ).exists()
                if not exists:
                    Connection.objects.create(
                        user=target.user,
                        note_from=target,
                        note_to_id=s['id'],
                        strength=s['strength'],
                        ai_generated=True,
                    )
        except Exception:
            pass  # Don't fail note creation if AI is down

class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        note = serializer.save()
        self._suggest_connections(note)

    def _suggest_connections(self, target):
        from connections.models import Connection
        from django.db import models as db_models
        import httpx
        from django.conf import settings

        candidates = Note.objects.filter(user=target.user).exclude(id=target.id)
        if not candidates.exists():
            return

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
            for s in suggestions:
                exists = Connection.objects.filter(
                    user=target.user
                ).filter(
                    db_models.Q(note_from=target, note_to_id=s['id']) |
                    db_models.Q(note_from_id=s['id'], note_to=target)
                ).exists()
                if not exists:
                    Connection.objects.create(
                        user=target.user,
                        note_from=target,
                        note_to_id=s['id'],
                        strength=s['strength'],
                        ai_generated=True,
                    )
        except Exception:
            pass  # Don't fail note creation if AI is down

class NoteSuggestConnectionsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        # Get the target note
        try:
            target = Note.objects.get(id=pk, user=request.user)
        except Note.DoesNotExist:
            return Response({'error': 'Note not found'}, status=404)

        # Get all other notes
        candidates = Note.objects.filter(user=request.user).exclude(id=pk)
        if not candidates.exists():
            return Response({'connections': []})

        payload = {
            'target': {
                'id': str(target.id),
                'title': target.title,
                'content': target.content,
            },
            'candidates': [
                {
                    'id': str(n.id),
                    'title': n.title,
                    'content': n.content,
                }
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

            # Auto-create connections that don't exist yet
            created = []
            for s in suggestions:
                exists = Connection.objects.filter(
                    user=request.user,
                ).filter(
                    models.Q(note_from=target, note_to_id=s['id']) |
                    models.Q(note_from_id=s['id'], note_to=target)
                ).exists()

                if not exists:
                    conn = Connection.objects.create(
                        user=request.user,
                        note_from=target,
                        note_to_id=s['id'],
                        strength=s['strength'],
                        ai_generated=True,
                    )
                    created.append(str(conn.id))

            return Response({
                'suggestions': suggestions,
                'connections_created': len(created),
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

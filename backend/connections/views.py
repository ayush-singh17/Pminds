from rest_framework import generics, permissions
from django.core.cache import cache
from django.db.models import Q
from .models import Connection
from .serializers import ConnectionSerializer

class ConnectionListCreateView(generics.ListCreateAPIView):
    serializer_class = ConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        folder_id = self.request.query_params.get('folder')
        cache_key = f'connections_{self.request.user.id}_{folder_id}'
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        qs = Connection.objects.filter(user=self.request.user).select_related(
            'note_from', 'note_to'
        )
        if folder_id:
            qs = qs.filter(
                note_from__folders__id=folder_id,
                note_to__folders__id=folder_id
            )
        result = list(qs.distinct())
        cache.set(cache_key, result, timeout=300)
        return result

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        cache.delete_pattern(f'connections_{self.request.user.id}_*')

class ConnectionDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Connection.objects.filter(user=self.request.user)

class ConnectionsByNoteView(generics.ListAPIView):
    serializer_class = ConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        note_id = self.kwargs['note_id']
        return Connection.objects.filter(
            user=self.request.user
        ).filter(
            Q(note_from_id=note_id) | Q(note_to_id=note_id)
        )

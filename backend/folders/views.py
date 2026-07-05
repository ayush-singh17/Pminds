from rest_framework import generics, permissions
from django.core.cache import cache
from .models import Folder
from .serializers import FolderSerializer

class FolderListCreateView(generics.ListCreateAPIView):
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        cache_key = f'folders_{self.request.user.id}'
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        qs = Folder.objects.filter(user=self.request.user)
        result = list(qs)
        cache.set(cache_key, result, timeout=300)
        return result

    def perform_create(self, serializer):
        folder = serializer.save(user=self.request.user)
        cache.delete(f'folders_{self.request.user.id}')

class FolderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Folder.objects.filter(user=self.request.user)

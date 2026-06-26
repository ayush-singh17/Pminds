from django.urls import path
from .views import ConnectionListCreateView, ConnectionDetailView, ConnectionsByNoteView

urlpatterns = [
    path('', ConnectionListCreateView.as_view(), name='connection-list-create'),
    path('<uuid:pk>/', ConnectionDetailView.as_view(), name='connection-detail'),
    path('by-note/<uuid:note_id>/', ConnectionsByNoteView.as_view(), name='connections-by-note'),
]

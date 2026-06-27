from django.urls import path
from .views import NoteListCreateView, NoteDetailView, NoteSuggestConnectionsView

urlpatterns = [
    path('', NoteListCreateView.as_view(), name='note-list-create'),
    path('<uuid:pk>/', NoteDetailView.as_view(), name='note-detail'),
    path('<uuid:pk>/suggest-connections/', NoteSuggestConnectionsView.as_view(), name='suggest-connections'),
]

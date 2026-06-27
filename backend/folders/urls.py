from django.urls import path
from .views import FolderListCreateView, FolderDetailView

urlpatterns = [
    path('', FolderListCreateView.as_view(), name='folder-list-create'),
    path('<uuid:pk>/', FolderDetailView.as_view(), name='folder-detail'),
]

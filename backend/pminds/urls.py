from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/notes/', include('notes.urls')),
    path('api/tags/', include('tags.urls')),
    path('api/connections/', include('connections.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

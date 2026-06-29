from rest_framework import serializers
from .models import Note
from tags.serializers import TagSerializer
from tags.models import Tag
from folders.serializers import FolderSerializer
from folders.models import Folder

from utils.sanitize import sanitize_html, sanitize_plain

class NoteSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Tag.objects.all(),
        source='tags', required=False
    )
    folders = FolderSerializer(many=True, read_only=True)
    folder_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Folder.objects.all(),
        source='folders', required=False
    )

    class Meta:
        model = Note
        fields = ['id', 'user', 'title', 'content', 'type', 'source_url',
                  'tags', 'tag_ids', 'folders', 'folder_ids', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate_title(self, value):
        return sanitize_plain(value.strip())

    def validate_content(self, value):
        return sanitize_html(value.strip())

    def validate_source_url(self, value):
        if value and not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError('Invalid URL.')
        return value

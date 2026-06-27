from rest_framework import serializers
from .models import Note
from tags.serializers import TagSerializer
from tags.models import Tag
from folders.serializers import FolderSerializer
from folders.models import Folder

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

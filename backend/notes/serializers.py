from rest_framework import serializers
from .models import Note
from tags.serializers import TagSerializer
from tags.models import Tag

class NoteSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Tag.objects.all(), source='tags', required=False
    )

    class Meta:
        model = Note
        fields = ['id', 'user', 'title', 'content', 'type', 'source_url', 'tags', 'tag_ids', 'created_at', 'updated_at']
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

from rest_framework import serializers
from .models import Folder

from utils.sanitize import sanitize_plain

class FolderSerializer(serializers.ModelSerializer):
    note_count = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = ['id', 'name', 'icon', 'color', 'note_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        return sanitize_plain(value.strip())

    def get_note_count(self, obj):
        return obj.notes.count()

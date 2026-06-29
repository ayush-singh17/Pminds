from rest_framework import serializers
from .models import Tag

from utils.sanitize import sanitize_plain

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'created_at']
        read_only_fields = ('id', 'created_at')

    def validate_name(self, value):
        return sanitize_plain(value.strip())

    def validate_color(self, value):
        import re
        if not re.match(r'^#[0-9A-Fa-f]{6}$', value):
            raise serializers.ValidationError('Invalid hex color.')
        return value

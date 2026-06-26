from rest_framework import serializers
from .models import Connection
from notes.models import Note

class BasicNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title']

class ConnectionSerializer(serializers.ModelSerializer):
    note_from_detail = BasicNoteSerializer(source='note_from', read_only=True)
    note_to_detail = BasicNoteSerializer(source='note_to', read_only=True)
    
    note_from = serializers.PrimaryKeyRelatedField(queryset=Note.objects.all())
    note_to = serializers.PrimaryKeyRelatedField(queryset=Note.objects.all())

    class Meta:
        model = Connection
        fields = ['id', 'note_from', 'note_to', 'note_from_detail', 'note_to_detail', 'reason', 'strength', 'ai_generated', 'created_at']
        read_only_fields = ('id', 'created_at')

    def validate(self, attrs):
        if attrs.get('note_from') == attrs.get('note_to'):
            raise serializers.ValidationError("A note cannot be connected to itself.")
        return attrs

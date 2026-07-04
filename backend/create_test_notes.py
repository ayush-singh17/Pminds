import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pminds.settings')
django.setup()

from django.contrib.auth import get_user_model
from notes.models import Note
from notes.tasks import suggest_connections_async

User = get_user_model()
user = User.objects.first()

if not user:
    print("No user found!")
    exit(1)

notes_data = [
    {
        "title": "Stoic Philosophy",
        "content": "Stoicism teaches the development of self-control and fortitude as a means of overcoming destructive emotions. The philosophy holds that becoming a clear and unbiased thinker allows one to understand the universal reason (logos).",
        "type": "thought"
    },
    {
        "title": "Machine Learning Fundamentals",
        "content": "At its core, machine learning is about teaching computers to learn from data. Instead of writing explicit rules, we train models using algorithms like gradient descent to minimize a loss function.",
        "type": "article"
    },
    {
        "title": "The Roman Empire",
        "content": "The Roman Empire was one of the largest in history. It began with Augustus Caesar in 27 BC and spanned across Europe, North Africa, and the Middle East, heavily influencing modern law and architecture.",
        "type": "idea"
    },
    {
        "title": "Deep Neural Networks",
        "content": "Deep learning models are based on artificial neural networks with multiple layers. They are highly effective at tasks like image recognition, natural language processing, and pattern detection.",
        "type": "idea"
    },
    {
        "title": "Seneca on Time",
        "content": "Seneca argued that life is long enough if we know how to use it. People waste time on trivialities instead of focusing on what truly matters, which is living a virtuous and meaningful life.",
        "type": "quote"
    }
]

for nd in notes_data:
    note = Note.objects.create(user=user, title=nd["title"], content=nd["content"], type=nd["type"])
    suggest_connections_async(str(note.id), str(user.id))
    print(f"Created note: {note.title}")

print("Done creating test notes.")

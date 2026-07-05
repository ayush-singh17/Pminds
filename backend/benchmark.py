import os
import django
import time
import statistics

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pminds.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from notes.views import NoteListCreateView
from rest_framework.test import APIClient

User = get_user_model()

def benchmark(label, fn, runs=20):
    times = []
    for _ in range(runs):
        start = time.perf_counter()
        fn()
        end = time.perf_counter()
        times.append((end - start) * 1000)  # ms
    
    avg = statistics.mean(times)
    median = statistics.median(times)
    print(f"\n{label}")
    print(f"  Avg:    {avg:.2f}ms")
    print(f"  Median: {median:.2f}ms")
    print(f"  Min:    {min(times):.2f}ms")
    print(f"  Max:    {max(times):.2f}ms")
    return avg

client = APIClient(SERVER_NAME='localhost')
user = User.objects.first()
client.force_authenticate(user=user)

def fetch_notes():
    response = client.get('/api/notes/')
    assert response.status_code == 200

def fetch_folders():
    response = client.get('/api/folders/')
    assert response.status_code == 200

def fetch_connections():
    response = client.get('/api/connections/')
    assert response.status_code == 200

print("=" * 50)
print("PMinds API Benchmark")
print("=" * 50)

avg_notes = benchmark("GET /api/notes/", fetch_notes)
avg_folders = benchmark("GET /api/folders/", fetch_folders)
avg_connections = benchmark("GET /api/connections/", fetch_connections)

print(f"\nOverall average: {statistics.mean([avg_notes, avg_folders, avg_connections]):.2f}ms")

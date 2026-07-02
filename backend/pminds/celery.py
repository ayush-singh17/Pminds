import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pminds.settings')

app = Celery('pminds')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

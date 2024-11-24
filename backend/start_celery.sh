celery -A services.celery worker --pool=solo --loglevel=info --concurrency=1

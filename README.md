# Akash Image Generator!


# Docker image building

```bash
docker build -t jh3141/akash-images:0.0.1

docker push jh3141/akash-images:0.0.1
```

```bash
docker run -p 5000:5000 --gpus=all --env-file .env.local --name fastapi jh3141/akash-images:0.0.1
```


# Local development

```
uvicorn main:app --reload --port 5000

celery -A services.celery worker --pool=solo --loglevel=info --concurrency=1
```

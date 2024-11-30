# Akash Image Generator!

Generate Images using GPU's and CPU's from the Akash Network!

Witness images materialize before your eyes in real time as the Diffusion's latent data streams in via websockets!


0. [Quickstart Docker Build](#quickstart-docker-build)
1. [Quickstart Deployment to Akash Network](#quickstart-deployment-to-akash-network)
2. [Running locally](#running-locally-without-docker)
3. [Akash customizations on top of Huggingface](#akash-customizations-on-top-of-huggingface)


## Quickstart Docker Build

Here are the instructions for building your own Docker image from this repository and pushing it to Docker Hub.

**Step 1 (Install dependencies)**

Install the following programs if necessary:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- git

Clone this repository:

```bash
git clone https://github.com/jhuang314/akash-images
cd akash-images
```

Build the docker image:

```bash
docker build -t my-username/my-image:my-tag .

# An explicit example:
docker build -t jh3141/akash-images:0.0.10 .
```

Push the docker image to docker hub

```bash
docker push my-username/my-image:my-tag

# An explicit example:
docker push jh3141/akash-images:0.0.10
```

## Quickstart Deployment to Akash Network

Here are the instructions for taking a Docker image and deploying it to the Akash Network!

### Step 1 (Copy the YAML SDL config)

Here are 2 sample YAML SDL's, depending on if you want to use CPU's vs GPU's. The CPU version uses `lambdalabs/miniSD-diffusers`
to expedite image generation at the expense of quality, while the GPU version uses `stabilityai/stable-diffusion-3.5-medium`.
The actual models can be modified in `backend/services.py`.

For either SDL, replace `<YOUR_HF_TOKEN>` with your actual [HuggingFace token](https://huggingface.co/docs/hub/en/security-tokens)).

If you built and pushed your own Docker image, feel free to replace `jh3141/images:0.0.9` with your own.

**CPU version**
```yaml
---
version: "2.0"
services:
  redis:
    image: redis:alpine
    expose:
      - port: 6379
        proto: tcp
        to:
          - global: false
          - service: web
          - service: worker
  web:
    image: jh3141/akash-images:0.0.9
    expose:
      - port: 5000
        as: 80
        to:
          - global: true
    command:
      - bash
      - "-c"
    args:
      - "/app/backend/start_web.sh"
    env:
      - HF_TOKEN=<YOUR_HF_TOKEN>
      - REDIS_URL=redis:6379
  worker:
    image: jh3141/akash-images:0.0.9
    expose:
      - port: 80
        as: 80
        to:
          - global: true
    command:
      - bash
      - "-c"
    args:
      - "/app/backend/start_celery.sh"
    env:
      - HF_TOKEN=<YOUR_HF_TOKEN>
      - REDIS_URL=redis:6379
profiles:
  compute:
    redis:
      resources:
        cpu:
          units: 1
        memory:
          size: 1Gi
        storage:
          - size: 1Gi
    web:
      resources:
        cpu:
          units: 1
        memory:
          size: 4Gi
        storage:
          - size: 10Gi
    worker:
      resources:
        cpu:
          units: 8
        memory:
          size: 32Gi
        storage:
          - size: 25Gi
  placement:
    akash:
      pricing:
        redis:
          denom: uakt
          amount: 10000
        web:
          denom: uakt
          amount: 10000
        worker:
          denom: uakt
          amount: 10000
deployment:
  redis:
    akash:
      profile: redis
      count: 1
  web:
    akash:
      profile: web
      count: 1
  worker:
    akash:
      profile: worker
      count: 1
```


**GPU version**
```yaml
---
version: "2.0"
services:
  redis:
    image: redis:alpine
    expose:
      - port: 6379
        proto: tcp
        to:
          - global: false
          - service: web
          - service: worker
  web:
    image: jh3141/akash-images:0.0.9
    expose:
      - port: 5000
        as: 80
        to:
          - global: true
    command:
      - bash
      - "-c"
    args:
      - "/app/backend/start_web.sh"
    env:
      - HF_TOKEN=<YOUR_HF_TOKEN>
      - REDIS_URL=redis:6379
  worker:
    image: jh3141/akash-images:0.0.9
    expose:
      - port: 80
        as: 80
        to:
          - global: true
    command:
      - bash
      - "-c"
    args:
      - "/app/backend/start_celery.sh"
    env:
      - HF_TOKEN=<YOUR_HF_TOKEN>
      - REDIS_URL=redis:6379
profiles:
  compute:
    redis:
      resources:
        cpu:
          units: 1
        memory:
          size: 1Gi
        storage:
          - size: 1Gi
    web:
      resources:
        cpu:
          units: 1
        memory:
          size: 2Gi
        storage:
          - size: 10Gi
    worker:
      resources:
        cpu:
          units: 8
        memory:
          size: 16Gi
        storage:
          - size: 30Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
  placement:
    akash:
      pricing:
        redis:
          denom: uakt
          amount: 10000
        web:
          denom: uakt
          amount: 10000
        worker:
          denom: uakt
          amount: 10000
deployment:
  redis:
    akash:
      profile: redis
      count: 1
  web:
    akash:
      profile: web
      count: 1
  worker:
    akash:
      profile: worker
      count: 1
```


### Step 2 (Deploy to Akash console)

1. Go to the Akash console: https://console.akash.network/, and click on Deploy. Feel free to activate the $10 trial to get some funds.
1. Click on Deploy
1. Choose "Run Custom Container"
1. Switch from "Builder" tab to "YAML" tab
1. Paste the whole YAML SDL file from above. (Be sure to add your HF_TOKEN)
1. Click "Create Deployment ->", and Confirm
1. Pick a provider, and "Accept Bid ->"
1. Wait a bit
1. On the "Leases" tab, open the URI(s) link
1. Enjoy using Akash Image Generator, powered by Akash Network!


## Running Locally (without Docker)

### Step 1 (make sure you have Redis running locally):

```bash
docker run -p 6379:6379 --name some-redis -d redis
```

### Step 2 (clone this repo if you haven't already):

```bash
git clone https://github.com/jhuang314/akash-images
cd akash-images
```

### Step 3 (update .env):

Create a `.env` file within the `backend` directory of this repo:

```bash
touch backend/.env
echo 'HF_TOKEN=<YOUR_HF_TOKEN>' >> backend/.env
echo 'REDIS_URL=localhost:6379' >> backend/.env
```

NOTE: docker compose requires `REDIS_URL=redis:6379`, while local requires `REDIS_URL=localhost:6379`


### Step 4 (install dependencies)

The following commands assumes you are in the base directory of this repo.

```bash
cd frontend
npm install
```

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Step 5 (start ui, web and celery):

There are 3 different processes to run: the React UI, FastAPI web server, and Celery task.

The following commands assumes you are in the base directory of this repo.


**Starting the React UI**

If you don't already have npm dependencies installed in step 4, do that step.

```bash
cd frontend
npm run start
```


**Starting the FastAPI server**

If you don't already have virtual environment setup in step 4, do that step.

Otherwise, activate the environment if you haven't already:

```bash
cd backend
source .venv/bin/activate
```


```bash
uvicorn main:app --reload --port 5000
```

**Starting the Celery server server**

If you don't already have virtual environment setup in step 4, do that step.

Otherwise, activate the environment if you haven't already:

```bash
cd backend
source .venv/bin/activate
```


```bash
celery -A services.celery worker --pool=solo --loglevel=info --concurrency=1
```

## Running Locally (using Docker Compose)

### Step 1 (clone this repo if you haven't already):

```bash
git clone https://github.com/jhuang314/akash-images
cd akash-images
```

### Step 2 (update .env):

Create a `.env` file within the `backend` directory of this repo:

```bash
touch backend/.env
echo 'HF_TOKEN=<YOUR_HF_TOKEN>' >> backend/.env
echo 'REDIS_URL=redis:6379' >> backend/.env
```

NOTE: docker compose requires `REDIS_URL=redis:6379`, while local requires `REDIS_URL=localhost:6379`

### Step 3 (docker compose!)

```bash
docker compose up
```


# Important env vars

You can obtain your own [`HF_TOKEN` here](https://huggingface.co/docs/hub/en/security-tokens)

```
HF_TOKEN=<hugging face token used to download transformer models>
REDIS_URL=instance of redis (localhost:6379 if running locally, or redis:6379 if deployed or using docker compose)
```


# Technical Details

## Frontend

The frontend uses React, Bulma CSS, SocketIO, and FontAwesome. In a nutshell, the frontend provides

 - a form for the user to enter image generation requests
 - a queued image placeholder while the generation request is queued in the backend
 - an image component for showing partially generated images
 - an image component for showing fully generated images with generation details
 - column vs grid layouts
 - dark vs light modes
 - ability to download generated images

## FastAPI

The `main.py` provies a FastAPI interface for accepting API requests to generate images. In a nutshell:

 - GET /api/generate tells the server to create a new Celery task with the request parameters, and return task_id.
 - GET /task_status/{task_id} responds with the latest task_id
 - GET /image/{task_id} responds with the genereated image
 - GET /{rest_of_path:path} responds with the frontend static files (serves the React UI assets)

## Celery worker

The `services.py` provides a Celery worker for processing image generation requests. In a nutshell:

 - `generate_image_task` uses the given diffuse model to generate an image. For coolness factor, it also captures the latent images and sends the image to the frontend through websockets.
 - `task_success_notifier` hooks into the Celery complete lifecycle, and notifies the frontend with websockets that the generation task is complete

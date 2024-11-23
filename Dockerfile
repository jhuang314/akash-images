FROM nikolaik/python-nodejs:python3.11-nodejs16

ENV PYTHONPATH="$PYTHONPATH:/app"

EXPOSE 5000

# Multi-stage build for separation
# Stage 1: Build environment
WORKDIR /app/backend

COPY ./backend/requirements.txt ./
RUN pip install -r requirements.txt


WORKDIR /app/frontend

COPY ./frontend/package.json ./
COPY ./frontend/package-lock.json ./

RUN npm install



WORKDIR /

COPY . /app
#COPY . .  # Copy everything here (includes frontend and backend)


WORKDIR /app/frontend

RUN npm run build


WORKDIR /app/backend
#ENTRYPOINT ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]

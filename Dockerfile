FROM nikolaik/python-nodejs:python3.11-nodejs16

ENV PYTHONPATH="$PYTHONPATH:/app"

EXPOSE 5000

COPY . /app
WORKDIR /app/frontend

RUN npm install
RUN npm run build

WORKDIR /app/backend

RUN pip install -r requirements.txt


ENTRYPOINT ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]

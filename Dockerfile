FROM python:3.9-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

WORKDIR /app

COPY . ./

# Install dependencies
RUN pip install Flask flask-cors

# Cloud Run expects port 8080. The script defaults to 9090, so we patch it.
RUN sed -i 's/9090/8080/g' serve-live-dashboard.py || true

ENV PORT=8080

CMD ["python", "serve-live-dashboard.py"]
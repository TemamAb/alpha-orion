FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY engine/ /app/engine/
CMD ["python", "engine/calibration_engine.py"]

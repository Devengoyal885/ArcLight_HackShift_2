FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

# CPU-only PyTorch
RUN pip install --no-cache-dir \
    torch==2.3.1 \
    --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    sentence-transformers \
    transformers \
    numpy \
    pandas \
    scikit-learn \
    huggingface_hub

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

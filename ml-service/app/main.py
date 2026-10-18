
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

from .inference import infer_capabilities


app = FastAPI(
    title="AccessHire Skills Discovery API",
    description="AI-powered capability discovery from non-traditional experience.",
    version="2.0.0"
)


class InferenceRequest(BaseModel):

    text: str

    top_k: Optional[int] = 8


@app.get("/")
def root():

    return {
        "service": "AccessHire Skills Discovery API",
        "status": "online",
        "version": "2.0.0"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model_loaded": True,
        "service": "accesshire-ml"
    }


@app.get("/capabilities")
def capabilities():

    try:

        from .inference import capability_names

        return {
            "count": len(capability_names),
            "capabilities": capability_names
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post("/infer-capabilities")
def infer(request: InferenceRequest):

    if not request.text.strip():

        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty."
        )

    if request.top_k is None:

        top_k = 8

    else:

        top_k = max(
            1,
            min(
                int(request.top_k),
                20
            )
        )

    try:

        results = infer_capabilities(
            request.text,
            top_k=top_k
        )

        return {
            "success": True,
            "capabilities": results
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

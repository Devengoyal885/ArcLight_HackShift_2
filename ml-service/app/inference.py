
# ============================================================
# ACCESSHIRE — PRODUCTION INFERENCE ENGINE
# ============================================================

import os
import re

import numpy as np
import pandas as pd

from sentence_transformers import SentenceTransformer


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

HF_MODEL_ID = "Devengoyal/accesshire-mpnet-final"

CAPABILITY_FILE = os.path.join(
    BASE_DIR,
    "data",
    "accesshire_capabilities.csv"
)

SEMANTIC_WEIGHT = 0.70
KEYWORD_WEIGHT = 0.15
EVIDENCE_WEIGHT = 0.15

CONFIDENCE_THRESHOLD = 55.0
DEFAULT_TOP_K = 8


# ============================================================
# DEVICE
# ============================================================

try:

    import torch

    DEVICE = (
        "cuda"
        if torch.cuda.is_available()
        else "cpu"
    )

except Exception:

    DEVICE = "cpu"


# ============================================================
# MODEL LOADING
# ============================================================

print("=" * 70)
print("ACCESSHIRE MPNet MODEL")
print("=" * 70)

print("\nHugging Face model:")
print(HF_MODEL_ID)

print("\nDevice:")
print(DEVICE)

print("\nLoading AccessHire model...")

accesshire_model = SentenceTransformer(
    HF_MODEL_ID,
    device=DEVICE
)

print("✓ AccessHire MPNet loaded")


# ============================================================
# CAPABILITY TAXONOMY
# ============================================================

if not os.path.exists(
    CAPABILITY_FILE
):

    raise FileNotFoundError(
        "Capability file not found: "
        + CAPABILITY_FILE
    )


accesshire_capabilities = pd.read_csv(
    CAPABILITY_FILE
)


if "capability" not in accesshire_capabilities.columns:

    raise ValueError(
        "Capability CSV must contain a "
        "'capability' column."
    )


accesshire_capability_names = (
    accesshire_capabilities["capability"]
    .astype(str)
    .str.strip()
    .drop_duplicates()
    .tolist()
)


print(
    "\n✓ Capabilities loaded:",
    len(accesshire_capability_names)
)


# ============================================================
# CAPABILITY EMBEDDINGS
# ============================================================

print(
    "\nCreating capability embeddings..."
)

accesshire_capability_embeddings = (
    accesshire_model.encode(
        accesshire_capability_names,
        batch_size=64,
        normalize_embeddings=True,
        show_progress_bar=False
    )
)


print(
    "✓ Capability embeddings created"
)

print(
    "Embedding shape:",
    accesshire_capability_embeddings.shape
)


# ============================================================
# TEXT CHUNKING
# ============================================================

def split_into_chunks(text):

    text = re.sub(
        r"\s+",
        " ",
        str(text)
    ).strip()

    if not text:
        return []

    chunks = re.split(
        r"(?<=[.!?])\s+",
        text
    )

    return [
        chunk.strip()
        for chunk in chunks
        if chunk.strip()
    ]


# ============================================================
# KEYWORD OVERLAP
# ============================================================

def keyword_overlap(
    text,
    capability
):

    text_tokens = set(
        re.findall(
            r"\b[a-zA-Z0-9]+\b",
            text.lower()
        )
    )

    capability_tokens = set(
        re.findall(
            r"\b[a-zA-Z0-9]+\b",
            capability.lower()
        )
    )

    if not capability_tokens:

        return 0.0

    overlap = (
        text_tokens
        &
        capability_tokens
    )

    return (
        len(overlap)
        /
        len(capability_tokens)
    )


# ============================================================
# EVIDENCE STRENGTH
# ============================================================

def evidence_strength(text):

    if not text:

        return 0.0

    text_lower = text.lower()

    score = 0.0

    action_words = [
        "manage",
        "managed",
        "organize",
        "organized",
        "coordinate",
        "coordinated",
        "lead",
        "led",
        "build",
        "built",
        "develop",
        "developed",
        "create",
        "created",
        "design",
        "designed",
        "implement",
        "implemented",
        "handle",
        "handled",
        "plan",
        "planned",
        "deliver",
        "delivered"
    ]

    for word in action_words:

        if re.search(
            r"\b" + re.escape(word) + r"\b",
            text_lower
        ):

            score += 0.10

    # Numerical evidence
    if re.search(
        r"\b\d[\d,]*\b",
        text
    ):

        score += 0.20

    # Duration evidence
    if re.search(
        r"\b\d+\s*"
        r"(year|years|month|months)\b",
        text_lower
    ):

        score += 0.15

    return min(
        score,
        1.0
    )


# ============================================================
# CONFIDENCE
# ============================================================

def calculate_confidence(
    semantic_score,
    keyword_score,
    evidence_score
):

    semantic_normalized = (
        semantic_score + 1
    ) / 2

    semantic_normalized = max(
        0.0,
        min(
            1.0,
            semantic_normalized
        )
    )

    confidence = (
        SEMANTIC_WEIGHT
        *
        semantic_normalized
        +
        KEYWORD_WEIGHT
        *
        keyword_score
        +
        EVIDENCE_WEIGHT
        *
        evidence_score
    )

    return round(
        confidence * 100,
        2
    )


# ============================================================
# CAPABILITY DEDUPLICATION
# ============================================================

def deduplicate_results(
    results
):

    final_results = []

    seen = set()

    for result in results:

        capability = (
            result["capability"]
            .strip()
            .lower()
        )

        if capability in seen:

            continue

        seen.add(
            capability
        )

        final_results.append(
            result
        )

    return final_results


# ============================================================
# INFERENCE
# ============================================================

def infer_capabilities(
    text,
    top_k=DEFAULT_TOP_K
):

    if not text or not str(text).strip():

        return []

    chunks = split_into_chunks(
        text
    )

    if not chunks:

        return []

    # --------------------------------------------------------
    # Encode input chunks
    # --------------------------------------------------------

    chunk_embeddings = (
        accesshire_model.encode(
            chunks,
            normalize_embeddings=True,
            show_progress_bar=False
        )
    )

    # --------------------------------------------------------
    # Semantic similarity
    # --------------------------------------------------------

    similarity_matrix = (
        chunk_embeddings
        @
        accesshire_capability_embeddings.T
    )

    results = []

    # --------------------------------------------------------
    # Score each capability
    # --------------------------------------------------------

    for capability_idx, capability in enumerate(
        accesshire_capability_names
    ):

        capability_scores = (
            similarity_matrix[
                :,
                capability_idx
            ]
        )

        best_chunk_idx = int(
            np.argmax(
                capability_scores
            )
        )

        best_chunk = chunks[
            best_chunk_idx
        ]

        semantic_score = float(
            capability_scores[
                best_chunk_idx
            ]
        )

        keyword_score = keyword_overlap(
            best_chunk,
            capability
        )

        evidence_score = evidence_strength(
            best_chunk
        )

        confidence = calculate_confidence(
            semantic_score,
            keyword_score,
            evidence_score
        )

        if confidence < CONFIDENCE_THRESHOLD:

            continue

        results.append({

            "capability":
                capability,

            "confidence":
                confidence,

            "semantic_score":
                round(
                    semantic_score,
                    4
                ),

            "keyword_score":
                round(
                    keyword_score,
                    4
                ),

            "evidence_score":
                round(
                    evidence_score,
                    4
                ),

            "evidence_snippet":
                best_chunk

        })

    # --------------------------------------------------------
    # Sort by confidence
    # --------------------------------------------------------

    results.sort(
        key=lambda x:
            x["confidence"],
        reverse=True
    )

    # --------------------------------------------------------
    # Remove duplicate capability names
    # --------------------------------------------------------

    results = deduplicate_results(
        results
    )

    return results[
        :top_k
    ]

import os
import re
import numpy as np
from typing import List

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import faiss
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader

from openai import OpenAI


# -------------------------------
# OpenAI client (NEW 2025 SDK)
# -------------------------------
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# -------------------------------
# FastAPI setup
# -------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# RAG Model + Index
# -------------------------------
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
EMBEDDING_DIM = 384

index = faiss.IndexFlatL2(EMBEDDING_DIM)
documents: List[str] = []


# -------------------------------
# Request Models
# -------------------------------
class ProcessRequest(BaseModel):
    filePath: str


class AskRequest(BaseModel):
    question: str
    top_k: int = 5
    model: str = "gpt-4o-mini"  # default: cheap and fast


# -------------------------------
# Utility Functions
# -------------------------------
def clean_text(t: str) -> str:
    return re.sub(r"\s+", " ", t).strip()


def extract_text(path: str) -> str:
    try:
        r = PdfReader(path)
        text = ""
        for p in r.pages:
            c = p.extract_text()
            if c:
                text += c + "\n"
        return clean_text(text)
    except Exception as e:
        print("PDF Error:", e)
        return ""


def chunk_text(text: str, size=500, overlap=100):
    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = start + size
        chunks.append(" ".join(words[start:end]))
        start += max(size - overlap, 1)

    return chunks


def build_prompt(context: str, question: str):
    return f"""
You are a research assistant. Use ONLY the context below to answer accurately.

Context:
\"\"\"{context}\"\"\"

Question:
{question}

Answer:
"""


# -------------------------------
# Routes
# -------------------------------
@app.post("/process")
def process(req: ProcessRequest):
    path = req.filePath

    if not os.path.exists(path):
        return {"status": "error", "message": f"File not found: {path}"}

    text = extract_text(path)
    if not text:
        return {"status": "error", "message": "No text extracted"}

    chunks = chunk_text(text)
    embeddings = embedding_model.encode(chunks).astype("float32")

    index.add(embeddings)
    documents.extend(chunks)

    return {
        "status": "processed",
        "filePath": path,
        "num_chunks": len(chunks),
        "index_size": index.ntotal,
    }


@app.post("/ask")
def ask(req: AskRequest):

    if index.ntotal == 0:
        return {"status": "error", "message": "No documents indexed"}

    q_embed = embedding_model.encode([req.question]).astype("float32")
    distances, ids = index.search(q_embed, min(req.top_k, index.ntotal))

    retrieved = [documents[i] for i in ids[0]]
    context = "\n\n----\n\n".join(retrieved)
    prompt = build_prompt(context, req.question)

    try:
        response = client.chat.completions.create(
            model=req.model,    # gpt-4o, gpt-4o-mini, o3-mini, etc.
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300
        )

        # Correct property access (2025 SDK)
        answer = response.choices[0].message.content

        # Correct token usage fields
        prompt_tokens = response.usage.prompt_tokens
        completion_tokens = response.usage.completion_tokens
        total_tokens = response.usage.total_tokens

        return {
            "status": "ok",
            "answer": answer,
            "context_used": context,
            "token_usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens
            },
            "distances": distances[0].tolist(),
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}




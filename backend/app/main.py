from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

from .routers import metro, config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(title="Amsterdam Metro Tracker API")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(metro.router)
app.include_router(config.router)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {
        "message": "Amsterdam Metro Tracker API",
        "docs": "/docs",
        "endpoints": [
            "/api/metro-lines",
            "/api/stations",
            "/api/train-positions"
        ]
    }

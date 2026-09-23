"""QRShield FastAPI Application Entry Point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(
    title="QRShield API",
    description="Real-time threat detection engine for scam QR codes and deceptive payment links.",
    version="1.0.0"
)

# Enable CORS for Vite frontend and local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for hackathon development & demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": "QRShield - Scam QR Code & Payment Link Analyzer",
        "team": "DARKBYTE",
        "hackathon": "Presidency University x ISACA Bangalore Chapter Hackathon",
        "status": "operational",
        "docs_url": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

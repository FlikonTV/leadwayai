from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
import logging

from database import client
from routes.core import router as core_router
from routes.admin import router as admin_router
from routes.post_eval import router as post_eval_router

app = FastAPI()

# Register all route modules under /api prefix
for r in [core_router, admin_router, post_eval_router]:
    app.include_router(r, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

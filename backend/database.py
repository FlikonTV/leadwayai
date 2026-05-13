from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'leadway2026')

COHORTS = {
    "cohort_1_lagos": {"label": "Cohort 1 \u2014 Lagos", "dates": "April 13-15, 2026", "city": "Lagos"},
    "cohort_2_abuja": {"label": "Cohort 2 \u2014 Abuja", "dates": "May 15-18, 2026", "city": "Abuja"},
}

SUBSIDIARIES = [
    "Leadway Assurance", "Leadway Pensure", "Leadway Health",
    "Leadway Asset Management", "Leadway Trustees", "Shared Services", "Other"
]

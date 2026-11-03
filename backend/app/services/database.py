import json
import os
import uuid
from datetime import datetime
from typing import Any
import pymongo
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure

from app.config import settings

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_connected_to_mongo = False
        self.fallback_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        self.fallback_file = os.path.join(self.fallback_dir, "history.json")
        os.makedirs(self.fallback_dir, exist_ok=True)
        self._init_connection()

    def _init_connection(self):
        """Attempts connection to MongoDB; falls back smoothly if not running."""
        try:
            self.client = pymongo.MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=1200,
                connectTimeoutMS=1200
            )
            # Trigger server selection check
            self.client.admin.command("ping")
            self.db = self.client[settings.DB_NAME]
            self.is_connected_to_mongo = True
            print(f"[DATABASE] Connected to MongoDB: {settings.MONGODB_URI} (DB: {settings.DB_NAME})")
        except (ServerSelectionTimeoutError, ConnectionFailure, Exception) as e:
            self.is_connected_to_mongo = False
            self.client = None
            self.db = None
            print(f"[DATABASE] MongoDB offline or unreachable ({e}). Active storage mode: Local JSON Persistence ({self.fallback_file})")

    def get_status(self) -> dict[str, Any]:
        return {
            "mode": "MongoDB" if self.is_connected_to_mongo else "Local Persistent JSON",
            "connected": self.is_connected_to_mongo,
            "database_name": settings.DB_NAME if self.is_connected_to_mongo else None,
            "fallback_file": self.fallback_file if not self.is_connected_to_mongo else None
        }

    def _read_local_history(self) -> list[dict]:
        if not os.path.exists(self.fallback_file):
            return []
        try:
            with open(self.fallback_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_local_history(self, history: list[dict]):
        with open(self.fallback_file, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, default=str)

    def save_analysis(self, record: dict) -> str:
        """Saves a resume-job match analysis record and returns its ID."""
        record_id = str(uuid.uuid4())
        record["_id"] = record_id
        record["id"] = record_id
        record["created_at"] = datetime.utcnow().isoformat()

        if self.is_connected_to_mongo and self.db is not None:
            try:
                self.db["matches"].insert_one(record)
                return record_id
            except Exception as e:
                print(f"[DATABASE] Error inserting into MongoDB, falling back: {e}")

        # Local fallback
        history = self._read_local_history()
        history.insert(0, record)
        # Keep last 50 analyses
        history = history[:50]
        self._write_local_history(history)
        return record_id

    def get_recent_analyses(self, limit: int = 15) -> list[dict]:
        """Fetches recent analyses."""
        if self.is_connected_to_mongo and self.db is not None:
            try:
                cursor = self.db["matches"].find().sort("created_at", pymongo.DESCENDING).limit(limit)
                results = []
                for doc in cursor:
                    doc["id"] = str(doc.get("_id", doc.get("id")))
                    doc.pop("_id", None)
                    results.append(doc)
                return results
            except Exception as e:
                print(f"[DATABASE] Error querying MongoDB, falling back: {e}")

        history = self._read_local_history()
        return history[:limit]

    def get_analysis_by_id(self, analysis_id: str) -> dict | None:
        """Finds analysis record by ID."""
        if self.is_connected_to_mongo and self.db is not None:
            try:
                doc = self.db["matches"].find_one({"$or": [{"id": analysis_id}, {"_id": analysis_id}]})
                if doc:
                    doc["id"] = str(doc.get("_id", doc.get("id")))
                    doc.pop("_id", None)
                    return doc
            except Exception:
                pass

        history = self._read_local_history()
        for item in history:
            if item.get("id") == analysis_id:
                return item
        return None

    def clear_history(self) -> bool:
        """Clears all stored analyses."""
        if self.is_connected_to_mongo and self.db is not None:
            try:
                self.db["matches"].delete_many({})
            except Exception:
                pass
        self._write_local_history([])
        return True

db_manager = DatabaseManager()

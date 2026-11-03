import os
import sys
from pathlib import Path

import uvicorn


backend_directory = Path(__file__).parent / "backend"
os.chdir(backend_directory)
sys.path.insert(0, str(backend_directory))


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
    )

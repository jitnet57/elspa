import os

# Bind to 0.0.0.0 on the PORT environment variable (Railway provides this)
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"

# Use uvicorn workers for ASGI (FastAPI) support
worker_class = "uvicorn.workers.UvicornWorker"

# Number of worker processes
workers = int(os.getenv("WEB_CONCURRENCY", "2"))

# Timeout for worker processes (seconds)
timeout = 120

# Access log - use stdout
accesslog = "-"

# Error log - use stderr
errorlog = "-"

# Log level
loglevel = os.getenv("LOG_LEVEL", "info")

# Preload app for faster worker startup
preload_app = True

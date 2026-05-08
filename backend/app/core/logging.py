"""
Logging configuration for the application
"""

import logging
import os
from datetime import datetime
from app.core.config import settings


def setup_logging():
    """Configure application logging"""
    log_dir = settings.LOG_DIR
    os.makedirs(log_dir, exist_ok=True)
    os.makedirs(os.path.join(log_dir, "api_logs"), exist_ok=True)
    os.makedirs(os.path.join(log_dir, "workflow_logs"), exist_ok=True)
    os.makedirs(os.path.join(log_dir, "error_logs"), exist_ok=True)

    # Root logger
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(
                os.path.join(log_dir, f"app_{datetime.now().strftime('%Y%m%d')}.log")
            ),
        ],
    )

    # Error logger
    error_handler = logging.FileHandler(
        os.path.join(log_dir, "error_logs", f"errors_{datetime.now().strftime('%Y%m%d')}.log")
    )
    error_handler.setLevel(logging.ERROR)
    logging.getLogger().addHandler(error_handler)


def get_logger(name: str) -> logging.Logger:
    """Get a named logger"""
    return logging.getLogger(name)

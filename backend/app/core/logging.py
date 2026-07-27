"""Logging configuration."""

import logging
import sys
from datetime import UTC, datetime
from logging.handlers import RotatingFileHandler

_CONFIGURED = False

LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"


def setup_logging() -> None:
    """Configure root logging. Idempotent — safe to call from the lifespan."""
    global _CONFIGURED
    if _CONFIGURED:
        return

    # Imported lazily so this module stays importable from app.core.config's
    # dependents without a circular import.
    from app.core.config import settings

    log_dir = settings.LOG_DIR
    log_dir.mkdir(parents=True, exist_ok=True)

    formatter = logging.Formatter(LOG_FORMAT)
    root = logging.getLogger()
    root.setLevel(getattr(logging, settings.LOG_LEVEL, logging.INFO))

    # stdout is the only stream most container platforms collect.
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    root.addHandler(stream_handler)

    today = datetime.now(UTC).strftime("%Y%m%d")

    # Rotating, so a long-running container cannot fill its disk with logs.
    app_handler = RotatingFileHandler(
        log_dir / f"app_{today}.log", maxBytes=10 * 1024 * 1024, backupCount=3
    )
    app_handler.setFormatter(formatter)
    root.addHandler(app_handler)

    error_handler = RotatingFileHandler(
        log_dir / f"errors_{today}.log", maxBytes=10 * 1024 * 1024, backupCount=3
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    root.addHandler(error_handler)

    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Get a named logger."""
    return logging.getLogger(name)

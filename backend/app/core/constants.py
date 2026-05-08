"""
Application-wide constants
"""

# AI Models
SUPPORTED_CHAT_MODELS = [
    "gpt-4o",
    "gpt-4-turbo",
    "claude-3.5-sonnet",
    "gemini-pro",
]

SUPPORTED_EMBEDDING_MODELS = [
    "text-embedding-3-small",
    "text-embedding-3-large",
    "text-embedding-ada-002",
]

# File types
ALLOWED_FILE_EXTENSIONS = {
    "pdf", "docx", "doc", "txt", "csv", "xlsx", "xls",
    "png", "jpg", "jpeg", "gif", "svg",
    "md", "json", "yaml", "yml",
}

MAX_CHUNK_SIZE = 2000
MIN_CHUNK_SIZE = 100

# Workflow statuses
WORKFLOW_STATUSES = ["active", "completed", "failed", "paused", "pending"]

# Memory categories
MEMORY_CATEGORIES = [
    "User Preference",
    "Project Context",
    "Technical Note",
    "Workflow Pattern",
    "Code Pattern",
    "General Knowledge",
]

# Log levels
LOG_LEVELS = ["info", "warning", "error", "success", "debug"]

"""Application-level exception types."""


class WorkspaceError(Exception):
    """Base class for errors this application raises deliberately."""

    status_code = 500

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class AIUnavailableError(WorkspaceError):
    """Raised when an AI call cannot be served.

    The most common cause is a missing GEMINI_API_KEY. The app deliberately
    still boots without one so that every non-AI endpoint keeps working; AI
    routes surface this as a 503 instead of a traceback.
    """

    status_code = 503


class FeatureDisabledError(WorkspaceError):
    """Raised when a feature-flagged capability is invoked while switched off."""

    status_code = 403


class InvalidUploadError(WorkspaceError):
    """Raised for a rejected file upload (bad type, too large, unreadable)."""

    status_code = 400

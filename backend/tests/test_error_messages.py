"""Provider errors must be readable, not raw JSON documents."""

import pytest

from app.services.gemini_service import friendly_error

QUOTA_ERROR = (
    "429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'You exceeded "
    "your current quota, please check your plan and billing details. For more "
    "information on this error, head to: https://ai.google.dev/gemini-api/docs/"
    "rate-limits.', 'status': 'RESOURCE_EXHAUSTED', 'details': [{'@type': "
    "'type.googleapis.com/google.rpc.QuotaFailure', 'violations': [{'quotaMetric': "
    "'generativelanguage.googleapis.com/generate_content_free_tier_requests', "
    "'quotaId': 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', "
    "'quotaValue': '20'}]}, {'@type': 'type.googleapis.com/google.rpc.RetryInfo', "
    "'retryDelay': '52s'}]}}"
)


def test_quota_error_becomes_actionable():
    message = friendly_error(Exception(QUOTA_ERROR))

    assert message == "Gemini quota exceeded (free-tier limit: 20 requests/day). Retry in 52s."
    # The JSON document must not survive into the UI.
    assert "quotaMetric" not in message
    assert "@type" not in message
    assert len(message) < 120


@pytest.mark.parametrize(
    ("raw", "expected_fragment"),
    [
        ("400 API_KEY_INVALID: bad key", "rejected"),
        ("403 PERMISSION_DENIED", "permissions"),
        ("504 DEADLINE_EXCEEDED", "timed out"),
    ],
)
def test_known_errors_are_translated(raw, expected_fragment):
    assert expected_fragment in friendly_error(Exception(raw))


def test_unknown_errors_are_capped_not_dropped():
    long_error = "Something unexpected. " * 100
    message = friendly_error(Exception(long_error))

    assert message.startswith("Something unexpected.")
    assert len(message) <= 201  # 200 chars plus the ellipsis


def test_short_unknown_errors_pass_through_intact():
    assert friendly_error(Exception("Connection reset")) == "Connection reset"

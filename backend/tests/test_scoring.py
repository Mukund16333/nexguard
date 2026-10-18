"""Unit tests for deterministic scoring engine."""

from datetime import datetime, timezone

from app.core.scoring import calculate_score
from app.models.domain import CheckResult, CheckStatus


def _create_mock_check(check_id: str, status: CheckStatus, weight: float) -> CheckResult:
    return CheckResult(
        check_id=check_id,
        category="generic",
        status=status,
        weight=weight,
        started_at=datetime.now(timezone.utc),
        duration_ms=10.0,
        summary="Test summary",
        rule_version="1.0.0",
    )


class TestScoringEngine:
    """Tests for calculate_score()."""

    def test_all_pass_returns_100_score_and_coverage(self):
        results = [
            _create_mock_check("dns", CheckStatus.PASS, 0.10),
            _create_mock_check("http", CheckStatus.PASS, 0.15),
            _create_mock_check("tls", CheckStatus.PASS, 0.25),
            _create_mock_check("headers", CheckStatus.PASS, 0.20),
            _create_mock_check("freshness", CheckStatus.PASS, 0.15),
            _create_mock_check("cdn", CheckStatus.PASS, 0.10),
        ]
        score, coverage = calculate_score(results)
        assert score == 100.0
        assert coverage == 100.0

    def test_all_fail_returns_0_score_and_100_coverage(self):
        results = [
            _create_mock_check("dns", CheckStatus.FAIL, 0.10),
            _create_mock_check("http", CheckStatus.FAIL, 0.15),
            _create_mock_check("tls", CheckStatus.FAIL, 0.25),
            _create_mock_check("headers", CheckStatus.FAIL, 0.20),
            _create_mock_check("freshness", CheckStatus.FAIL, 0.15),
            _create_mock_check("cdn", CheckStatus.FAIL, 0.10),
        ]
        score, coverage = calculate_score(results)
        assert score == 0.0
        assert coverage == 100.0

    def test_warning_awards_half_credit(self):
        # 0.50 PASS (0.50 credit) + 0.50 WARNING (0.25 credit) = 0.75 / 1.0 = 75.0%
        results = [
            _create_mock_check("check1", CheckStatus.PASS, 0.50),
            _create_mock_check("check2", CheckStatus.WARNING, 0.50),
        ]
        score, coverage = calculate_score(results)
        assert score == 75.0
        assert coverage == 100.0

    def test_skipped_check_excluded_from_denominator(self):
        # Total configured weight = 0.10 + 0.15 + 0.25 + 0.20 + 0.15 + 0.15 = 1.00
        # Freshness is SKIPPED (0.15 weight)
        # Applicable weight = 0.85
        # All applicable checks pass: score should be 100.0, coverage should be 85.0%
        results = [
            _create_mock_check("dns", CheckStatus.PASS, 0.10),
            _create_mock_check("http", CheckStatus.PASS, 0.15),
            _create_mock_check("tls", CheckStatus.PASS, 0.25),
            _create_mock_check("headers", CheckStatus.PASS, 0.20),
            _create_mock_check("freshness", CheckStatus.SKIPPED, 0.15),
            _create_mock_check("cdn", CheckStatus.PASS, 0.15),
        ]
        score, coverage = calculate_score(results)
        assert score == 100.0
        assert coverage == 85.0

    def test_empty_results_returns_zeros(self):
        score, coverage = calculate_score([])
        assert score == 0.0
        assert coverage == 0.0

    def test_mixed_statuses_deterministic(self):
        # Total weight: 0.20 + 0.20 + 0.20 + 0.20 + 0.20 = 1.00
        # check1: PASS (0.20 * 1.0 = 0.20)
        # check2: WARNING (0.20 * 0.5 = 0.10)
        # check3: FAIL (0.20 * 0.0 = 0.00)
        # check4: ERROR (0.20 * 0.0 = 0.00)
        # check5: SKIPPED (excluded, 0.20 excluded)
        # Total configured = 1.00
        # Applicable weight = 0.80
        # Earned credit = 0.30
        # Score = (0.30 / 0.80) * 100 = 37.5%
        # Coverage = (0.80 / 1.00) * 100 = 80.0%
        results = [
            _create_mock_check("c1", CheckStatus.PASS, 0.20),
            _create_mock_check("c2", CheckStatus.WARNING, 0.20),
            _create_mock_check("c3", CheckStatus.FAIL, 0.20),
            _create_mock_check("c4", CheckStatus.ERROR, 0.20),
            _create_mock_check("c5", CheckStatus.SKIPPED, 0.20),
        ]
        score, coverage = calculate_score(results)
        assert score == 37.5
        assert coverage == 80.0

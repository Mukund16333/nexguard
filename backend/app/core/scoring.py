"""Deterministic scoring engine for NexGuard security & reliability checks."""

from __future__ import annotations

from typing import TYPE_CHECKING, List, Tuple

if TYPE_CHECKING:
    from app.models.domain import CheckResult

RULESET_VERSION = "1.0.0"

# Credit multiplier for each check outcome
STATUS_CREDIT_MULTIPLIER = {
    "PASS": 1.0,
    "WARNING": 0.5,
    "FAIL": 0.0,
    "ERROR": 0.0,
    "SKIPPED": 0.0,  # Excluded from calculation
}


def calculate_score(results: List[CheckResult]) -> Tuple[float, float]:
    """
    Calculate deterministic security/reliability score and test coverage.
    
    Formula:
      - PASS = 1.0 * weight
      - WARNING = 0.5 * weight
      - FAIL = 0.0
      - ERROR = 0.0
      - SKIPPED = excluded from applicable denominator
      
      Score = (sum(earned_weight) / sum(applicable_weights)) * 100
      Coverage = (sum(applicable_weights) / sum(total_configured_weights)) * 100
      
    Returns:
      (score, coverage) rounded to 2 decimal places.
    """
    if not results:
        return 0.0, 0.0

    total_configured_weight = 0.0
    applicable_weight = 0.0
    earned_weight = 0.0

    for result in results:
        weight = float(result.weight)
        status_str = result.status.value if hasattr(result.status, "value") else str(result.status)
        total_configured_weight += weight

        if status_str == "SKIPPED":
            # Skipped checks do not penalize score or count toward applicable denominator
            continue

        applicable_weight += weight
        multiplier = STATUS_CREDIT_MULTIPLIER.get(status_str, 0.0)
        earned_weight += weight * multiplier

    if applicable_weight > 0.0:
        score = round((earned_weight / applicable_weight) * 100.0, 2)
    else:
        # All checks skipped or none applicable
        score = 100.0

    if total_configured_weight > 0.0:
        coverage = round((applicable_weight / total_configured_weight) * 100.0, 2)
    else:
        coverage = 0.0

    return score, coverage

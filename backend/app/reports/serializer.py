"""Report generation and serialization into JSON and HTML formats."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.models.domain import Run, TargetConfig

TEMPLATES_DIR = Path(__file__).parent / "templates"

_jinja_env: Environment | None = None


def _get_jinja_env() -> Environment:
    """Get or create singleton Jinja2 template environment."""
    global _jinja_env
    if _jinja_env is None:
        _jinja_env = Environment(
            loader=FileSystemLoader(str(TEMPLATES_DIR)),
            autoescape=select_autoescape(["html", "xml"]),
        )
        # Custom filter to serialize evidence dict to formatted JSON
        _jinja_env.filters["tojson"] = lambda obj, indent=2: json.dumps(
            obj, indent=indent, default=str
        )
    return _jinja_env


def generate_json_report(run: Run, target: TargetConfig | None = None) -> dict[str, Any]:
    """
    Generate structured JSON report payload containing run outcome, target info, and checks.
    """
    report_dict: dict[str, Any] = {
        "report_type": "NexGuard Validation Report",
        "generated_at": run.completed_at.isoformat() if run.completed_at else None,
        "run": run.model_dump(mode="json"),
        "target": target.model_dump(mode="json") if target else None,
        "summary": {
            "score": run.score,
            "coverage": run.coverage,
            "status": run.status.value if hasattr(run.status, "value") else str(run.status),
            "total_checks": len(run.check_results),
            "duration_ms": run.duration_ms,
        },
    }
    return report_dict


def generate_html_report(run: Run, target: TargetConfig | None = None) -> str:
    """
    Render standalone HTML report using Jinja2 template.
    """
    env = _get_jinja_env()
    template = env.get_template("report.html")
    return template.render(run=run, target=target)

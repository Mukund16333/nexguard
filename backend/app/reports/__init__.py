"""Report serialization and template rendering."""

from app.reports.serializer import generate_html_report, generate_json_report

__all__ = ["generate_html_report", "generate_json_report"]

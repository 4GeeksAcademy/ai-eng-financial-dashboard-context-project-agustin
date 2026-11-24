from datetime import date

from fastapi.testclient import TestClient

from app.main import app
from app.routes import (
    FinancialMovement,
    MetricsSummaryItem,
    build_alert_summary,
    detect_outcome_alerts,
    filter_movements_by_date,
    generate_mock_movements,
)


client = TestClient(app)


def test_generate_mock_movements_returns_full_year_sorted_data():
    movements = generate_mock_movements(seed=42)

    assert len(movements) == 360
    assert movements == sorted(movements, key=lambda item: item.create_date)


def test_filter_movements_by_date_includes_range_edges():
    movements = generate_mock_movements(seed=42)
    target_date = movements[0].create_date

    filtered = filter_movements_by_date(movements, target_date, target_date)

    assert filtered
    assert all(movement.create_date == target_date for movement in filtered)


def test_health_endpoint_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_metrics_endpoint_respects_date_filters():
    base_response = client.get("/api/metrics")
    assert base_response.status_code == 200
    first_date = base_response.json()[0]["create_date"]

    response = client.get(
        "/api/metrics",
        params={"start_date": first_date, "end_date": first_date},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["create_date"] == first_date for item in payload)


def test_b2b_endpoint_only_returns_b2b_records():
    response = client.get("/api/metrics/b2b")

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["business_type"] == "B2B" for item in payload)
    assert payload == sorted(payload, key=lambda item: item["create_date"])


def test_b2c_endpoint_only_returns_b2c_records():
    response = client.get("/api/metrics/b2c")

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["business_type"] == "B2C" for item in payload)
    assert payload == sorted(payload, key=lambda item: item["create_date"])


def test_metrics_endpoint_filters_by_category():
    response = client.get("/api/metrics", params={"category": "sales"})

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["category"] == "sales" for item in payload)


def test_metrics_endpoint_filters_by_operation_type():
    response = client.get("/api/metrics", params={"operation_type": "income"})

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["operation_type"] == "income" for item in payload)


def test_b2b_endpoint_combines_new_filters():
    response = client.get(
        "/api/metrics/b2b",
        params={"operation_type": "outcome", "category": "suppliers"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["business_type"] == "B2B" for item in payload)
    assert all(item["operation_type"] == "outcome" for item in payload)
    assert all(item["category"] == "suppliers" for item in payload)


def test_metrics_facets_returns_filter_options_and_date_range():
    response = client.get("/api/metrics/facets")

    assert response.status_code == 200
    payload = response.json()
    assert sorted(payload["operation_types"]) == ["income", "outcome"]
    assert payload["business_types"] == ["B2B", "B2C"]
    assert payload["categories"] == [
        "administrative",
        "operational",
        "others",
        "sales",
        "suppliers",
    ]
    assert payload["min_date"] <= payload["max_date"]


def test_metrics_facets_can_filter_categories_by_business_type():
    response = client.get("/api/metrics/facets", params={"business_type": "B2B"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["business_types"] == ["B2B"]
    assert payload["categories"]


def test_build_alert_summary_fills_empty_months_inside_selected_range():
    movements = [
        FinancialMovement(
            create_date="2025-01-10",
            amount=100,
            operation_type="outcome",
            category="suppliers",
            business_type="B2B",
        ),
        FinancialMovement(
            create_date="2025-03-10",
            amount=300,
            operation_type="outcome",
            category="suppliers",
            business_type="B2B",
        ),
    ]

    summary = build_alert_summary(
        movements, date(2025, 1, 1), date(2025, 4, 30)
    )

    assert [(item.period, item.outcome) for item in summary] == [
        ("2025-01", 100),
        ("2025-02", 0),
        ("2025-03", 300),
        ("2025-04", 0),
    ]


def test_detect_outcome_alerts_uses_only_previous_three_periods():
    summary = [
        MetricsSummaryItem(period=f"2025-{month:02}", income=0, outcome=value, net=-value)
        for month, value in enumerate([10, 0, 20, 60, 100], start=1)
    ]

    alerts = detect_outcome_alerts(summary, threshold=0.3)

    assert [alert.period for alert in alerts] == ["2025-04", "2025-05"]
    assert alerts[0].baseline_average == 10
    assert alerts[0].increase_ratio == 5
    assert alerts[1].baseline_average == round((0 + 20 + 60) / 3, 2)


def test_detect_outcome_alerts_skips_zero_baseline():
    summary = [
        MetricsSummaryItem(period=f"2025-{month:02}", income=0, outcome=value, net=-value)
        for month, value in enumerate([0, 0, 0, 100], start=1)
    ]

    assert detect_outcome_alerts(summary, threshold=0.3) == []


def test_alert_endpoint_uses_only_selected_range_and_three_month_average(monkeypatch):
    movements = [
        FinancialMovement(
            create_date=movement_date,
            amount=amount,
            operation_type="outcome",
            category="suppliers",
            business_type="B2B",
        )
        for movement_date, amount in [
            ("2024-12-15", 10000),
            ("2025-01-15", 10),
            ("2025-03-15", 20),
            ("2025-04-15", 60),
            ("2025-05-15", 80),
        ]
    ]
    monkeypatch.setattr("app.routes.generate_mock_movements", lambda seed: movements)

    response = client.get(
        "/api/metrics/alerts",
        params={
            "start_date": "2025-01-01",
            "end_date": "2025-05-31",
            "threshold": 0.3,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert [item["period"] for item in payload] == ["2025-04", "2025-05"]
    assert payload[0]["baseline_average"] == 10
    assert payload[1]["baseline_average"] == round((0 + 20 + 60) / 3, 2)


def test_alert_endpoint_rejects_threshold_outside_configured_range():
    assert client.get("/api/metrics/alerts", params={"threshold": 0}).status_code == 422
    assert client.get("/api/metrics/alerts", params={"threshold": 1.01}).status_code == 422


def test_metrics_summary_by_month_returns_balances():
    response = client.get("/api/metrics/summary", params={"group_by": "month"})

    assert response.status_code == 200
    payload = response.json()
    assert payload
    first = payload[0]
    assert set(first.keys()) == {"period", "income", "outcome", "net"}
    assert all(item["income"] >= 0 for item in payload)
    assert all(item["outcome"] >= 0 for item in payload)


def test_metrics_summary_by_week_honors_business_type_filter():
    response = client.get(
        "/api/metrics/summary",
        params={"group_by": "week", "business_type": "B2C"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload


def test_top_categories_returns_limited_sorted_categories():
    response = client.get(
        "/api/metrics/categories/top",
        params={"operation_type": "outcome", "limit": 3},
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 3
    assert payload[0]["total_amount"] >= payload[1]["total_amount"]
    assert all(item["operation_type"] == "outcome" for item in payload)


def test_metrics_comparison_returns_delta_fields():
    response = client.get(
        "/api/metrics/comparison",
        params={"start_date": "2025-03-01", "end_date": "2025-03-31"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert set(payload.keys()) == {
        "current_period",
        "previous_period",
        "delta_abs",
        "delta_pct",
    }


def test_metrics_alerts_returns_anomaly_candidates():
    response = client.get(
        "/api/metrics/alerts",
        params={"threshold": 0.2, "group_by": "month"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    if payload:
        first = payload[0]
        assert set(first.keys()) == {
            "period",
            "outcome_total",
            "baseline_average",
            "increase_ratio",
        }

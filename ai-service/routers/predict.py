"""
Predictive Maintenance & Inventory Forecasting router
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
import logging
import traceback
import math

import numpy as np
import pandas as pd

from models.schemas import (
    MaintenancePredictRequest, MaintenancePredictResponse, PartPrediction, RiskLevel,
    InventoryForecastRequest, InventoryForecastResponse,
)

router = APIRouter(prefix="/predict", tags=["predict"])
logger = logging.getLogger("predict")


# ─── Helpers ─────────────────────────────────────────────────────────────────

SERVICE_INTERVALS_DAYS = {
    "oil change":          90,
    "brake pad":           365,
    "tire rotation":       180,
    "air filter":          365,
    "transmission":        730,
    "battery":             730,
    "coolant flush":       730,
    "spark plug":          365,
    "belt":                730,
    "inspection":          180,
    "default":             180,
}

def normalise_service(service_type: str) -> str:
    st = service_type.lower()
    for key in SERVICE_INTERVALS_DAYS:
        if key in st:
            return key
    return "default"


def compute_risk(days: int) -> RiskLevel:
    if days <= 7:
        return RiskLevel.CRITICAL
    elif days <= 21:
        return RiskLevel.HIGH
    elif days <= 60:
        return RiskLevel.MEDIUM
    elif days <= 120:
        return RiskLevel.LOW
    return RiskLevel.HEALTHY


def health_score_from_predictions(predictions: list[PartPrediction]) -> int:
    if not predictions:
        return 80
    min_days = min(p.daysUntilFailure for p in predictions)
    # 0 days → score 0, 365+ days → score 100
    score = max(0, min(100, int((min_days / 180) * 100)))
    return score


def _prophet_predict(df: pd.DataFrame, periods: int = 1) -> tuple[datetime, int]:
    """Try Prophet, fall back to linear extrapolation."""
    try:
        from prophet import Prophet
        m = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
        m.fit(df)
        future = m.make_future_dataframe(periods=periods, freq="D")
        forecast = m.predict(future)
        last = forecast.iloc[-1]
        predicted_date = pd.to_datetime(last["yhat1"] if "yhat1" in last else last["ds"] + timedelta(days=int(last["yhat"])))
        confidence_days = max(7, int((last.get("yhat_upper", last["yhat"]) - last.get("yhat_lower", last["yhat"])) / 2))
        return predicted_date, confidence_days
    except Exception:
        logger.warning("Prophet unavailable, using linear extrapolation")
        return _linear_predict(df)


def _linear_predict(df: pd.DataFrame) -> tuple[datetime, int]:
    """Simple linear regression fallback."""
    dates = (df["ds"] - df["ds"].min()).dt.days.values
    y = df["y"].values
    if len(dates) < 2:
        # Just use default interval
        return datetime.now() + timedelta(days=90), 30
    # Fit line: y = a*x + b  (y = interval between services in days)
    coeffs = np.polyfit(dates, y, 1)
    next_x = dates[-1] + (dates[-1] - dates[-2]) if len(dates) >= 2 else dates[-1] + 90
    avg_interval = max(14, int(np.polyval(coeffs, next_x)))
    last_date = df["ds"].max()
    predicted = last_date + timedelta(days=avg_interval)
    return predicted, 21


# ─── Maintenance Prediction ───────────────────────────────────────────────────

@router.post("/maintenance", response_model=MaintenancePredictResponse)
async def predict_maintenance(req: MaintenancePredictRequest):
    if not req.history:
        raise HTTPException(status_code=422, detail="No maintenance history provided")

    # Group events by normalised service type
    groups: dict[str, list[datetime]] = {}
    for event in req.history:
        key = normalise_service(event.serviceType)
        try:
            dt = datetime.fromisoformat(event.date.replace("Z", "+00:00"))
        except Exception:
            continue
        groups.setdefault(key, []).append(dt)

    predictions: list[PartPrediction] = []
    today = datetime.utcnow()

    for service_key, dates in groups.items():
        dates.sort()
        label = service_key.title()
        default_interval = SERVICE_INTERVALS_DAYS.get(service_key, 180)

        if len(dates) == 1:
            # Only one record — use default interval
            last = dates[0]
            predicted_date = last + timedelta(days=default_interval)
            confidence = 30
            avg_interval = default_interval
        else:
            # Build interval series for Prophet/linear
            intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
            avg_interval = int(np.mean(intervals))

            # Build DataFrame for forecasting
            df = pd.DataFrame({
                "ds": pd.to_datetime(dates[:-1]),
                "y": intervals,
            })

            try:
                predicted_date, confidence = _prophet_predict(df)
                # predicted_date from Prophet is in the interval domain — convert back
                # to actual calendar date from last service
                last = dates[-1]
                predicted_date = last + timedelta(days=avg_interval)
            except Exception as e:
                logger.error(f"Prediction error for {service_key}: {e}")
                last = dates[-1]
                predicted_date = last + timedelta(days=avg_interval)
                confidence = 30

        days_until = max(0, (predicted_date.replace(tzinfo=None) - today.replace(tzinfo=None)).days)
        risk = compute_risk(days_until)

        predictions.append(PartPrediction(
            partType=label,
            lastServiceDate=dates[-1].isoformat() if dates else None,
            expectedFailureDate=predicted_date.strftime("%Y-%m-%d"),
            daysUntilFailure=days_until,
            confidenceDays=confidence,
            riskLevel=risk,
            avgIntervalDays=avg_interval,
        ))

    # Also add any unserviced common parts as defaults
    serviced_keys = set(groups.keys())
    for default_key, interval in SERVICE_INTERVALS_DAYS.items():
        if default_key == "default" or default_key in serviced_keys:
            continue
        # Skip if no history at all for this vehicle means we have zero context
        pass

    predictions.sort(key=lambda p: p.daysUntilFailure)

    health = health_score_from_predictions(predictions)
    overall = predictions[0].riskLevel if predictions else RiskLevel.HEALTHY

    return MaintenancePredictResponse(
        vehicleId=req.vehicleId,
        healthScore=health,
        overallRisk=overall,
        predictions=predictions,
        generatedAt=today.isoformat(),
    )


# ─── Inventory Forecasting ────────────────────────────────────────────────────

@router.post("/inventory", response_model=InventoryForecastResponse)
async def forecast_inventory(req: InventoryForecastRequest):
    if len(req.usageHistory) < 2:
        # Not enough data — return conservative estimate
        return InventoryForecastResponse(
            partId=req.partId,
            partName=req.partName,
            forecastedDemand30d=1,
            suggestedOrderQty=max(3, (req.currentStock or 0) + 3),
            suggestedOrderDate=(datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d"),
            trend="stable",
            confidenceScore=0.3,
            forecastPoints=[],
        )

    # Build usage time series
    records = sorted(req.usageHistory, key=lambda r: r.date)
    try:
        df = pd.DataFrame({
            "ds": pd.to_datetime([r.date for r in records]),
            "y":  [float(r.quantity) for r in records],
        })
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid date format: {e}")

    # Compute 30-day rolling demand
    df = df.set_index("ds").resample("D").sum().fillna(0).reset_index()

    total_days = (df["ds"].max() - df["ds"].min()).days or 1
    total_usage = df["y"].sum()
    daily_avg = total_usage / total_days

    # Simple trend detection
    mid = len(df) // 2
    first_half_avg = df["y"][:mid].mean() if mid > 0 else daily_avg
    second_half_avg = df["y"][mid:].mean() if mid > 0 else daily_avg
    if second_half_avg > first_half_avg * 1.1:
        trend = "increasing"
        projected_daily = daily_avg * 1.15
    elif second_half_avg < first_half_avg * 0.9:
        trend = "decreasing"
        projected_daily = daily_avg * 0.9
    else:
        trend = "stable"
        projected_daily = daily_avg

    forecast_30d = max(1, int(math.ceil(projected_daily * 30)))
    current_stock = req.currentStock or 0
    deficit = forecast_30d - current_stock
    suggested_qty = max(0, deficit + int(forecast_30d * 0.2))  # 20% buffer

    # Days until stockout
    days_until_stockout = int(current_stock / daily_avg) if daily_avg > 0 else 999
    order_date = datetime.utcnow() + timedelta(days=max(1, days_until_stockout - 7))

    # Generate forecast points for chart
    forecast_points = []
    for i in range(1, 31):
        forecast_points.append({
            "date": (datetime.utcnow() + timedelta(days=i)).strftime("%Y-%m-%d"),
            "predicted_qty": round(projected_daily, 2),
        })

    confidence = min(0.95, 0.5 + (len(records) / 100))

    return InventoryForecastResponse(
        partId=req.partId,
        partName=req.partName,
        forecastedDemand30d=forecast_30d,
        suggestedOrderQty=suggested_qty,
        suggestedOrderDate=order_date.strftime("%Y-%m-%d"),
        trend=trend,
        confidenceScore=round(confidence, 2),
        forecastPoints=forecast_points,
    )

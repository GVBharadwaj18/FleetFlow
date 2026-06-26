"""
VMS AI Microservice — Pydantic Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Shared ──────────────────────────────────────────────────────────────────

class RiskLevel(str, Enum):
    CRITICAL = "critical"
    HIGH     = "high"
    MEDIUM   = "medium"
    LOW      = "low"
    HEALTHY  = "healthy"


# ─── Predictive Maintenance ───────────────────────────────────────────────────

class MaintenanceEvent(BaseModel):
    date:        str            # ISO date string
    serviceType: str            # e.g. "Oil Change", "Brake Pad Replacement"
    cost:        float
    mileage:     Optional[int]  = None


class MaintenancePredictRequest(BaseModel):
    vehicleId:   str
    vehicleInfo: Optional[dict] = None
    history:     List[MaintenanceEvent]


class PartPrediction(BaseModel):
    partType:            str
    lastServiceDate:     Optional[str]
    expectedFailureDate: str
    daysUntilFailure:    int
    confidenceDays:      int     # ± margin
    riskLevel:           RiskLevel
    avgIntervalDays:     int


class MaintenancePredictResponse(BaseModel):
    vehicleId:        str
    healthScore:      int        # 0–100
    overallRisk:      RiskLevel
    predictions:      List[PartPrediction]
    generatedAt:      str


# ─── Inventory Forecasting ────────────────────────────────────────────────────

class UsageDataPoint(BaseModel):
    date:     str
    quantity: int


class InventoryForecastRequest(BaseModel):
    partId:       str
    partName:     str
    usageHistory: List[UsageDataPoint]
    currentStock: Optional[int] = 0


class InventoryForecastResponse(BaseModel):
    partId:              str
    partName:            str
    forecastedDemand30d: int
    suggestedOrderQty:   int
    suggestedOrderDate:  str
    trend:               str   # "increasing" | "decreasing" | "stable"
    confidenceScore:     float # 0.0 – 1.0
    forecastPoints:      List[dict]  # [{date, predicted_qty}]


# ─── RAG / Knowledge Base ─────────────────────────────────────────────────────

class RAGQueryRequest(BaseModel):
    question:     str
    vehicleModel: Optional[str] = None
    topK:         Optional[int] = 5


class RAGSource(BaseModel):
    documentName: str
    pageNumber:   Optional[int]
    excerpt:      str
    relevance:    float


class RAGQueryResponse(BaseModel):
    answer:    str
    sources:   List[RAGSource]
    modelUsed: str


class IngestResponse(BaseModel):
    success:       bool
    chunksIndexed: int
    documentName:  str
    message:       str

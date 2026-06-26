// backend/src/routes/aiRoutes.js
// Proxy routes that bridge the Express API to the Python FastAPI microservice.
// All routes require authentication (enforced by the authMiddleware in app.js).
import express from 'express';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import Part              from '../models/Part.js';

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_TIMEOUT_MS  = 30_000;

// ─── In-memory cache (1-hour TTL per vehicle) ────────────────────────────────
const predictionCache = new Map(); // vehicleId → { data, expiresAt }

function getCached(vehicleId) {
  const entry = predictionCache.get(vehicleId);
  if (entry && entry.expiresAt > Date.now()) return entry.data;
  predictionCache.delete(vehicleId);
  return null;
}
function setCache(vehicleId, data) {
  predictionCache.set(vehicleId, { data, expiresAt: Date.now() + 3_600_000 });
}

// ─── Helper: call FastAPI with a timeout ─────────────────────────────────────
async function callAI(path, method = 'POST', body = null, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(`${AI_SERVICE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `AI service error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── GET /api/ai/health ───────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const data = await callAI('/health', 'GET');
    res.json({ available: true, ...data });
  } catch {
    res.json({ available: false, message: 'AI service offline' });
  }
});

// ─── POST /api/ai/predict-maintenance/:vehicleId ──────────────────────────────
// Fetches maintenance history from Mongo, sends to FastAPI, caches result.
router.post('/predict-maintenance/:vehicleId', async (req, res) => {
  const { vehicleId } = req.params;
  const { forceRefresh } = req.query;

  // Return cached result if still fresh
  if (!forceRefresh) {
    const cached = getCached(vehicleId);
    if (cached) return res.json({ ...cached, cached: true });
  }

  try {
    // Pull all maintenance records for this vehicle
    const records = await MaintenanceRecord.find({ vehicleId })
      .populate('vehicleId', 'brand model year plateNumber')
      .sort({ serviceDate: 1 })
      .lean();

    if (!records.length) {
      return res.json({
        vehicleId,
        healthScore: 80,
        overallRisk: 'healthy',
        predictions: [],
        message: 'No maintenance history found — AI prediction requires at least one record.',
        available: true,
      });
    }

    const history = records.flatMap(r =>
      r.services.map(s => ({
        date:        new Date(r.serviceDate).toISOString(),
        serviceType: s.description,
        cost:        s.cost,
      }))
    );

    const vehicleInfo = records[0]?.vehicleId
      ? { brand: records[0].vehicleId.brand, model: records[0].vehicleId.model, year: records[0].vehicleId.year }
      : null;

    const prediction = await callAI('/predict/maintenance', 'POST', {
      vehicleId,
      vehicleInfo,
      history,
    });

    setCache(vehicleId, prediction);
    res.json({ ...prediction, available: true, cached: false });

  } catch (err) {
    console.error('[AI] predict-maintenance error:', err.message);
    res.json({
      available: false,
      vehicleId,
      message: 'AI service unavailable — predictions are temporarily offline.',
      error: err.message,
    });
  }
});

// ─── POST /api/ai/inventory-forecast ─────────────────────────────────────────
router.post('/inventory-forecast', async (req, res) => {
  const { partId } = req.body;
  if (!partId) return res.status(400).json({ message: 'partId is required' });

  try {
    const part = await Part.findById(partId).lean();
    if (!part) return res.status(404).json({ message: 'Part not found' });

    // Build usage history from orderHistory (orders = restocks; infer usage as depletion)
    const usageHistory = (part.orderHistory || [])
      .filter(o => o.orderDate && o.amount)
      .map(o => ({
        date:     new Date(o.orderDate).toISOString().split('T')[0],
        quantity: Number(o.amount),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const forecast = await callAI('/predict/inventory', 'POST', {
      partId:       partId.toString(),
      partName:     part.name,
      usageHistory,
      currentStock: part.quantity || 0,
    });

    res.json({ ...forecast, available: true });

  } catch (err) {
    console.error('[AI] inventory-forecast error:', err.message);
    res.json({ available: false, message: 'AI service unavailable', error: err.message });
  }
});

// ─── POST /api/ai/rag-query ───────────────────────────────────────────────────
router.post('/rag-query', async (req, res) => {
  const { question, vehicleModel, topK } = req.body;
  if (!question) return res.status(400).json({ message: 'question is required' });

  try {
    const answer = await callAI('/rag/query', 'POST', { question, vehicleModel, topK });
    res.json({ ...answer, available: true });
  } catch (err) {
    console.error('[AI] rag-query error:', err.message);
    res.json({ available: false, message: 'AI service unavailable', error: err.message });
  }
});

// ─── POST /api/ai/ingest-manual (admin only) ──────────────────────────────────
router.post('/ingest-manual', async (req, res) => {
  // Role guard — only admins/mechanics can upload manuals
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'mechanic') {
    return res.status(403).json({ message: 'Forbidden: admin role required' });
  }

  // We forward the raw multipart request to FastAPI
  // Using node-fetch's FormData approach via re-streaming
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120_000); // 2 min for large PDFs

    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];

    const response = await fetch(`${AI_SERVICE_URL}/rag/ingest`, {
      method: 'POST',
      headers,
      body:   req,   // stream the request body directly
      signal: controller.signal,
      duplex: 'half',
    });
    clearTimeout(timer);

    const data = await response.json();
    res.status(response.ok ? 200 : response.status).json(data);
  } catch (err) {
    console.error('[AI] ingest-manual error:', err.message);
    res.json({ available: false, message: 'AI service unavailable', error: err.message });
  }
});

// ─── GET /api/ai/fleet-health ─────────────────────────────────────────────────
// Returns cached predictions for all vehicles that have been queried before,
// so the Dashboard Insight Panel doesn't need to call predict one-by-one.
router.get('/fleet-health', async (req, res) => {
  const entries = [];
  for (const [vehicleId, { data }] of predictionCache.entries()) {
    entries.push({ vehicleId, ...data });
  }
  res.json({ available: true, predictions: entries });
});

export default router;

# API Setup Guide

## Architecture

Your app uses **two different API systems** depending on the environment:

### 🏠 Local Development
- **Next.js API Routes** (TypeScript) in `app/api/*/route.ts`
- These proxy to your **FastAPI backend** running on `localhost:8000`
- Works with `npm run dev`

### 🚀 Production (Vercel)
- **Python Serverless Functions** in `app/api/*.py`
- Automatically used by Vercel when deployed
- No FastAPI backend needed

---

## Local Development Setup

### 1. Start FastAPI Backend
```bash
cd app/loan_angel_backend
python -m uvicorn main:app --reload --port 8000
```

### 2. Start Next.js Frontend (in another terminal)
```bash
npm run dev
```

### 3. Test Endpoints

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Analyze Transactions:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"transactions": [{"description": "SALARY CREDIT TCS", "amount": 90000}, {"description": "UPI/SWIGGY", "amount": 500}]}'
```

**Predict Category:**
```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"description": "UPI/SWIGGY"}'
```

---

## API Endpoints

### `/api/health` (GET)
Returns API health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "Credx Loan Angel API",
  "version": "1.0.0"
}
```

### `/api/analyze` (POST)
Analyzes multiple transactions and provides financial advice.

**Request:**
```json
{
  "transactions": [
    {"description": "SALARY CREDIT TCS", "amount": 90000},
    {"description": "UPI/SWIGGY", "amount": 500},
    {"description": "RENT TRANSFER", "amount": 20000}
  ]
}
```

**Response:**
```json
{
  "total_savings": 69500,
  "advice": "You have ₹69500.00 extra! Prepay this to your loan to save interest."
}
```

### `/api/predict` (POST)
Predicts category for a single transaction.

**Request:**
```json
{
  "description": "UPI/SWIGGY"
}
```

**Response:**
```json
{
  "description": "UPI/SWIGGY",
  "category": "Food"
}
```

---

## File Structure

```
app/
├── api/
│   ├── health/
│   │   └── route.ts          # Next.js API route (local dev)
│   ├── analyze/
│   │   └── route.ts          # Next.js API route (local dev)
│   ├── predict/
│   │   └── route.ts          # Next.js API route (local dev)
│   ├── health.py             # Python serverless (Vercel)
│   ├── analyze.py            # Python serverless (Vercel)
│   ├── predict.py            # Python serverless (Vercel)
│   ├── utils/
│   │   └── loan_angel.py     # Shared LoanAngel class
│   ├── saved_models/
│   │   └── expense_classifier.pkl
│   └── requirements.txt
└── loan_angel_backend/
    └── main.py               # FastAPI backend (local dev)
```

---

## Troubleshooting

### 404 Error on `/api/health`
- ✅ **Fixed!** Next.js API routes are now created
- Make sure Next.js dev server is running: `npm run dev`
- Restart dev server if you just added the routes

### Backend Not Available (503 Error)
- Make sure FastAPI is running: `python -m uvicorn main:app --reload --port 8000`
- Check if port 8000 is available
- Verify the model file exists: `app/api/saved_models/expense_classifier.pkl`

### Python Serverless Functions Not Working Locally
- **This is expected!** Python serverless functions only work on Vercel
- Use Next.js API routes for local development
- They automatically proxy to FastAPI backend

---

## Deployment

When you deploy to Vercel:
1. ✅ Python serverless functions (`*.py`) will be used automatically
2. ✅ Next.js API routes will be ignored (Vercel prefers Python functions)
3. ✅ No FastAPI backend needed in production
4. ✅ Model file must be committed to git

---

## Environment Variables

Create `.env.local` for local development:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

In production (Vercel), this is not needed as Python functions run directly.

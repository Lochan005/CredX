from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from loan_angel import LoanAngel
import uvicorn

# Initialize FastAPI app
app = FastAPI(title="Loan Angel API", description="Financial analysis API")

# Initialize LoanAngel instance
angel = LoanAngel()

# Request/Response models
class Transaction(BaseModel):
    description: str
    amount: float

class AnalyzeRequest(BaseModel):
    transactions: List[Transaction]

class AnalyzeResponse(BaseModel):
    total_savings: float
    advice: str

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_transactions(request: AnalyzeRequest):
    """
    Analyze a list of transactions and provide financial advice.
    
    Args:
        request: JSON object with a list of transactions containing description and amount
    
    Returns:
        JSON object with total_savings (surplus) and advice
    """
    # Convert transactions to the format expected by analyze_finances
    transactions_list = [
        {'desc': tx.description, 'amount': tx.amount}
        for tx in request.transactions
    ]
    
    # Analyze finances
    analysis = angel.analyze_finances(transactions_list)
    
    # Get advice
    advice = angel.get_advice(analysis['surplus'], analysis['category_breakdown'])
    
    # Return response
    return AnalyzeResponse(
        total_savings=analysis['surplus'],
        advice=advice if advice else 'No specific advice at this time.'
    )

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Loan Angel API is running", "endpoints": ["/analyze"]}

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

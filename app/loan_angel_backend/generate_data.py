import pandas as pd
import random
from datetime import datetime, timedelta
import os

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, "data")

# Ensure the data directory exists
os.makedirs(data_dir, exist_ok=True)

# Configuration for synthetic data
NUM_TRANSACTIONS = 5000
START_DATE = datetime(2023, 1, 1)

# Categories and their typical descriptions & amount ranges (in INR)
CATEGORIES = {
    "Food": {
        "descriptions": ["UPI/SWIGGY", "UPI/ZOMATO", "STARBUCKS", "MCDONALDS", "DOMINOS PIZZA", "UPI/KFC", "GROCERY STORE", "BLINKIT"],
        "min": 150, "max": 2500
    },
    "Salary": {
        "descriptions": ["SALARY CREDIT - TCS", "INFOSYS SALARY", "ACCENTURE PAYROLL", "CREDIT - SALARY"],
        "min": 80000, "max": 150000
    },
    "Rent": {
        "descriptions": ["UPI/RENT TRANSFER", "TO LANDLORD", "HOUSE RENT", "NOBROKER RENT"],
        "min": 15000, "max": 35000
    },
    "EMI": {
        "descriptions": ["ACH DEBIT - HDFC HOME LOAN", "SBI HOME LOAN EMI", "ICICI CAR LOAN", "BAJAJ FINSERV EMI"],
        "min": 25000, "max": 45000
    },
    "Shopping": {
        "descriptions": ["AMAZON INDIA", "FLIPKART", "MYNTRA", "UPI/DECATHLON", "ZARA", "UNIQLO"],
        "min": 500, "max": 8000
    },
    "Entertainment": {
        "descriptions": ["NETFLIX SUB", "SPOTIFY PREMIUM", "PVR CINEMAS", "BOOKMYSHOW", "DISNEY+ HOTSTAR"],
        "min": 199, "max": 1500
    },
    "Investment": {
        "descriptions": ["ZERODHA BROKING", "GROWW SIP", "PPF TRANSFER", "NPS CONTRIBUTION"],
        "min": 5000, "max": 20000
    },
    "Utilities": {
        "descriptions": ["BESCOM BILL", "JIO FIBER", "AIRTEL POSTPAID", "IGL GAS BILL"],
        "min": 500, "max": 3000
    }
}

data = []

for _ in range(NUM_TRANSACTIONS):
    # Pick a random category weighted slightly towards frequent purchases (Food, Shopping)
    category = random.choices(
        list(CATEGORIES.keys()), 
        weights=[30, 2, 2, 2, 20, 15, 5, 10], 
        k=1
    )[0]
    
    details = CATEGORIES[category]
    description = random.choice(details["descriptions"])
    
    # Generate random amount
    amount = round(random.uniform(details["min"], details["max"]), 2)
    
    # Generate random date
    days_offset = random.randint(0, 365 * 2)
    date = (START_DATE + timedelta(days=days_offset)).strftime("%Y-%m-%d")
    
    data.append([date, description, amount, category])

# Create DataFrame
df = pd.DataFrame(data, columns=["Date", "Description", "Amount", "Category"])

# Save to CSV
file_path = os.path.join(data_dir, "transactions.csv")
df.to_csv(file_path, index=False)

print(f"Success! Generated {NUM_TRANSACTIONS} transactions at: {file_path}")
print(df.head())
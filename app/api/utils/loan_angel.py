import os
import joblib

class LoanAngel:
    def __init__(self):
        """Initialize LoanAngel by loading the trained expense classifier model."""
        # Path relative to this file's location
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, "..", "saved_models", "expense_classifier.pkl")
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at: {model_path}")
        
        self.model = joblib.load(model_path)
    
    def predict_category(self, description):
        """
        Predict the category for a given transaction description.
        
        Args:
            description (str): Transaction description
            
        Returns:
            str: Predicted category
        """
        # Clean the description (lowercase and strip)
        description_clean = description.lower().strip()
        
        # Predict category using the loaded model
        category = self.model.predict([description_clean])[0]
        
        return category
    
    def analyze_finances(self, transactions_list):
        """
        Analyze a list of transactions and calculate income, expenses, and surplus.
        
        Args:
            transactions_list (list): List of dictionaries with 'desc' and 'amount' keys
                Example: [{'desc': 'SALARY - TCS', 'amount': 50000}, ...]
        
        Returns:
            dict: Dictionary containing 'income', 'expenses', 'surplus', and 'category_breakdown'
        """
        income = 0.0
        expenses = 0.0
        category_breakdown = {}
        
        # Loop through transactions
        for transaction in transactions_list:
            desc = transaction.get('desc', '')
            amount = float(transaction.get('amount', 0))
            
            # Predict category for this transaction
            category = self.predict_category(desc)
            
            # Initialize category in breakdown if not exists
            if category not in category_breakdown:
                category_breakdown[category] = 0.0
            
            # Add amount to category breakdown
            category_breakdown[category] += amount
            
            # Categorize as Income (Salary) or Expense (everything else)
            if category == 'Salary':
                income += amount
            else:
                expenses += amount
        
        # Calculate surplus
        surplus = income - expenses
        
        return {
            'income': income,
            'expenses': expenses,
            'surplus': surplus,
            'category_breakdown': category_breakdown
        }
    
    def get_advice(self, surplus, expenses):
        """
        Get financial advice based on surplus and expense category breakdown.
        
        Args:
            surplus (float): Surplus amount (income - expenses)
            expenses (dict): Dictionary with category breakdown from analyze_finances
        
        Returns:
            str: Advice message
        """
        advice_messages = []
        
        # Check if surplus > 10000
        if surplus > 10000:
            advice_messages.append(f'You have ₹{surplus:.2f} extra! Prepay this to your loan to save interest.')
        
        # Check if Food expense > 30% of total expense
        # Exclude Salary from total expenses calculation
        expenses_dict = {k: v for k, v in expenses.items() if k != 'Salary'}
        total_expenses = sum(expenses_dict.values())
        
        if total_expenses > 0:
            food_expense = expenses_dict.get('Food', 0)
            food_percentage = (food_expense / total_expenses) * 100
            
            if food_percentage > 30:
                advice_messages.append('Warning: High spending on Food this month.')
        
        # Return advice messages joined, or empty string if no advice
        return ' '.join(advice_messages) if advice_messages else ''

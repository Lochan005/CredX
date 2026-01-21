# api/predict.py
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add utils to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'utils'))

from loan_angel import LoanAngel

# Initialize model (loaded once per cold start)
angel = None

def get_angel():
    global angel
    if angel is None:
        angel = LoanAngel()
    return angel

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """Predict category for a single transaction"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            # Validate request
            description = data.get('description', '')
            if not description:
                self._send_error(400, "No description provided")
                return
            
            # Predict
            angel = get_angel()
            category = angel.predict_category(description)
            
            # Build response
            response = {
                'description': description,
                'category': category
            }
            
            self._send_json(200, response)
            
        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON")
        except Exception as e:
            self._send_error(500, str(e))
    
    def _send_json(self, status_code, data):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def _send_error(self, status_code, message):
        """Send error response"""
        self._send_json(status_code, {'error': message})

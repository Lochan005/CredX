import pandas as pd
import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, "data")
models_dir = os.path.join(script_dir, "saved_models")

# Ensure the saved_models directory exists
os.makedirs(models_dir, exist_ok=True)

# Load data from CSV
csv_path = os.path.join(data_dir, "transactions.csv")
print(f"Loading data from {csv_path}...")
df = pd.read_csv(csv_path)

print(f"Loaded {len(df)} transactions")
print(f"Categories: {df['Category'].unique()}")
print(f"\nCategory distribution:")
print(df['Category'].value_counts())

# Clean the 'Description' text (lowercase)
print("\nCleaning descriptions...")
df['Description_clean'] = df['Description'].str.lower().str.strip()

# Prepare features and target
X = df['Description_clean']
y = df['Category']

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\nTraining set: {len(X_train)} samples")
print(f"Test set: {len(X_test)} samples")

# Create pipeline with TfidfVectorizer and RandomForestClassifier
print("\nTraining model...")
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=1000, ngram_range=(1, 2))),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1))
])

# Train the model
pipeline.fit(X_train, y_train)

# Make predictions on test set
y_pred = pipeline.predict(X_test)

# Calculate and print accuracy
accuracy = accuracy_score(y_test, y_pred)
print(f"\nModel Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")

# Print detailed classification report
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Save the trained pipeline
model_path = os.path.join(models_dir, "expense_classifier.pkl")
joblib.dump(pipeline, model_path)
print(f"\nModel saved to: {model_path}")

print("\nTraining completed successfully!")

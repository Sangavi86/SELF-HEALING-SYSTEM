import os
import pandas as pd
from pymongo import MongoClient
from sklearn.ensemble import IsolationForest
import joblib

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/cognitive_self_healing")

def fetch_data():
    client = MongoClient(MONGO_URI)
    db = client.get_database()
    collection = db.systemmetrics
    
    # Fetch all records
    data = list(collection.find({}, {
        "cpuUsage": 1, 
        "memoryUsage": 1, 
        "diskUsage": 1, 
        "networkUsage": 1,
        "_id": 0
    }))
    return data

def train_model():
    print("Fetching training data from MongoDB...")
    data = fetch_data()
    
    if not data or len(data) < 10:
        print("Not enough data to train. generating dummy data.")
        # Generate some dummy data if we don't have enough real data yet
        data = [
            {"cpuUsage": 10, "memoryUsage": 50, "diskUsage": 30, "networkUsage": 100},
            {"cpuUsage": 12, "memoryUsage": 52, "diskUsage": 30, "networkUsage": 150},
            {"cpuUsage": 15, "memoryUsage": 55, "diskUsage": 30, "networkUsage": 120},
            {"cpuUsage": 9,  "memoryUsage": 49, "diskUsage": 30, "networkUsage": 110},
            {"cpuUsage": 99, "memoryUsage": 98, "diskUsage": 95, "networkUsage": 9999}, # Anomaly
            {"cpuUsage": 11, "memoryUsage": 51, "diskUsage": 30, "networkUsage": 105},
            {"cpuUsage": 10, "memoryUsage": 50, "diskUsage": 30, "networkUsage": 100},
            {"cpuUsage": 12, "memoryUsage": 52, "diskUsage": 30, "networkUsage": 150},
            {"cpuUsage": 15, "memoryUsage": 55, "diskUsage": 30, "networkUsage": 120},
            {"cpuUsage": 9,  "memoryUsage": 49, "diskUsage": 30, "networkUsage": 110},
            {"cpuUsage": 99, "memoryUsage": 98, "diskUsage": 95, "networkUsage": 9999}, # Anomaly
        ]

    df = pd.DataFrame(data)
    # Fill any NaNs with 0
    df.fillna(0, inplace=True)
    
    print(f"Training Isolation Forest on {len(df)} samples...")
    # contamination is the proportion of outliers in the dataset
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(df[['cpuUsage', 'memoryUsage', 'diskUsage', 'networkUsage']])
    
    # Save the model
    joblib.dump(model, 'model.pkl')
    print("Model saved to model.pkl successfully.")

if __name__ == "__main__":
    train_model()

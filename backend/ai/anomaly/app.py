from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = 'model.pkl'
model = None

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print("Model loaded successfully.")
    else:
        print("Warning: model.pkl not found. Please run train.py first.")

load_model()

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json
    try:
        # Expecting cpuUsage, memoryUsage, diskUsage, networkUsage
        df = pd.DataFrame([{
            'cpuUsage': data.get('cpuUsage', 0),
            'memoryUsage': data.get('memoryUsage', 0),
            'diskUsage': data.get('diskUsage', 0),
            'networkUsage': data.get('networkUsage', 0)
        }])
        
        # 1 means normal, -1 means anomaly
        prediction = model.predict(df)[0]
        # Get anomaly score (negative means anomaly)
        score = model.decision_function(df)[0]
        
        is_anomaly = bool(prediction == -1)
        
        # Simple heuristic to determine type
        anomaly_type = "UNKNOWN"
        if is_anomaly:
            if data.get('cpuUsage', 0) > 85:
                anomaly_type = "HIGH_CPU"
            elif data.get('memoryUsage', 0) > 85:
                anomaly_type = "HIGH_MEMORY"
            elif data.get('networkUsage', 0) > 1000000:
                anomaly_type = "HIGH_NETWORK"
            else:
                anomaly_type = "GENERIC_ANOMALY"
        
        # Map score to a pseudo-confidence (0 to 1)
        # Score is typically between -0.5 and 0.5. More negative = more anomalous.
        confidence = min(max(abs(score) * 2, 0.5), 0.99) if is_anomaly else 0.99
        
        return jsonify({
            "anomaly": is_anomaly,
            "confidence": round(float(confidence), 2),
            "anomalyType": anomaly_type if is_anomaly else "NONE",
            "score": float(score)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model_loaded": model is not None})

if __name__ == '__main__':
    # Run on port 5002
    app.run(host='0.0.0.0', port=5002)

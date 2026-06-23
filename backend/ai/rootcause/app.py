import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import numpy as np

app = Flask(__name__)
CORS(app)

MODEL_PATH = 'rootcause_model.pkl'
model_data = None
embedder = None
clf = None

def load_model():
    global model_data, embedder, clf
    if os.path.exists(MODEL_PATH):
        model_data = joblib.load(MODEL_PATH)
        clf = model_data['classifier']
        # Load the embedder model (cached locally usually)
        embedder = SentenceTransformer(model_data['embedder_name'])
        print("Model loaded successfully.")
    else:
        print("Warning: rootcause_model.pkl not found.")

load_model()

@app.route('/analyze', methods=['POST'])
def analyze():
    if embedder is None or clf is None:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json
    logs = data.get('logs', []) # List of strings or dicts
    metrics = data.get('metrics', {})
    anomaly_type = data.get('anomalyType', "GENERIC_ANOMALY")
    historical_accuracy = data.get('historicalAccuracy', 0.8)

    metric_evidence = []
    log_evidence = []
    historical_evidence = []
    
    # 1. NLP Similarity (Process Logs)
    nlp_score = 0.0
    predicted_cause_from_logs = "Unknown Cause"
    
    if logs:
        # Extract text from logs if they are objects
        log_texts = [l if isinstance(l, str) else l.get('message', '') for l in logs]
        # Concatenate recent logs into a single block, or score them individually.
        # Let's score the most relevant log. We can embed all logs and find max similarity.
        log_embeddings = embedder.encode(log_texts)
        
        # Predict cause and get probabilities. KNN with cosine metric gives distance.
        distances, indices = clf.kneighbors(log_embeddings)
        
        # Find the log with the smallest distance (highest similarity)
        best_idx = np.argmin(distances[:, 0])
        best_distance = distances[best_idx][0]
        best_log = log_texts[best_idx]
        
        # Cosine distance to similarity: sim = 1 - distance
        best_sim = 1.0 - best_distance
        
        predicted_cause_from_logs = clf.classes_[clf._y[indices[best_idx][0]]]
        
        # Normalize NLP score
        nlp_score = max(0.0, min(best_sim, 1.0))
        log_evidence.append(f"Log match: '{best_log}' -> {predicted_cause_from_logs} (Sim: {nlp_score:.2f})")
    else:
        log_evidence.append("No logs provided for NLP analysis.")

    # 2. Metric Correlation
    metric_score = 0.0
    predicted_cause_from_metrics = "Unknown Cause"
    
    cpu = metrics.get('cpuUsage', 0)
    mem = metrics.get('memoryUsage', 0)
    disk = metrics.get('diskUsage', 0)
    net = metrics.get('networkUsage', 0)
    
    if cpu > 90:
        predicted_cause_from_metrics = "High CPU Process"
        metric_score = cpu / 100.0
        metric_evidence.append(f"CPU critically high: {cpu}%")
    elif mem > 90:
        predicted_cause_from_metrics = "Memory Leak"
        metric_score = mem / 100.0
        metric_evidence.append(f"Memory critically high: {mem}%")
    elif disk > 95:
        predicted_cause_from_metrics = "Disk Saturation"
        metric_score = disk / 100.0
        metric_evidence.append(f"Disk almost full: {disk}%")
    elif net > 1000000:
        predicted_cause_from_metrics = "Network Congestion"
        metric_score = 0.85
        metric_evidence.append(f"Abnormal network traffic: {net}")
    else:
        metric_evidence.append(f"Metrics appear nominal. CPU: {cpu}%, Mem: {mem}%")
        # If anomaly type gives us a hint
        if "HIGH_CPU" in anomaly_type:
            predicted_cause_from_metrics = "High CPU Process"
            metric_score = 0.8
        elif "HIGH_MEMORY" in anomaly_type:
            predicted_cause_from_metrics = "Memory Leak"
            metric_score = 0.8

    # 3. Combine and calculate RCCS
    # Determine the winning root cause. If NLP is strong, use it. Otherwise fallback to metrics.
    final_root_cause = "Unknown Cause"
    
    if nlp_score > 0.6:
        final_root_cause = predicted_cause_from_logs
    elif metric_score > 0.6:
        final_root_cause = predicted_cause_from_metrics
    else:
        # Fallback to anomaly type inference
        if anomaly_type == "HIGH_CPU": final_root_cause = "High CPU Process"
        elif anomaly_type == "HIGH_MEMORY": final_root_cause = "Memory Leak"
        else: final_root_cause = "Unknown Cause"

    historical_evidence.append(f"Historical accuracy baseline applied: {historical_accuracy:.2f}")

    # Calculate RCCS based on formula
    rccs = (0.5 * nlp_score) + (0.3 * metric_score) + (0.2 * historical_accuracy)
    
    # Cap confidence between 0 and 1
    rccs = max(0.0, min(rccs, 1.0))
    
    # In some cases where neither metric nor logs give strong signal, but we have a fallback:
    if rccs < 0.3 and final_root_cause != "Unknown Cause":
        rccs = 0.4 # Baseline confidence if inferred

    return jsonify({
        "rootCause": final_root_cause,
        "confidence": round(float(rccs), 2),
        "rccs": round(float(rccs), 2),
        "evidence": log_evidence + metric_evidence + historical_evidence,
        "metricEvidence": metric_evidence,
        "logEvidence": log_evidence,
        "historicalEvidence": historical_evidence
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model_loaded": embedder is not None})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004)

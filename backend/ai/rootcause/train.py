import joblib
from sentence_transformers import SentenceTransformer
from sklearn.neighbors import KNeighborsClassifier
import numpy as np

# Define our root cause categories and sample phrases mapping to them
categories = [
    "Memory Leak",
    "High CPU Process",
    "Database Connection Failure",
    "Connection Pool Exhaustion",
    "API Timeout",
    "Network Congestion",
    "Disk Saturation",
    "Service Crash",
    "Unknown Cause"
]

training_data = [
    # Memory Leak
    ("OutOfMemoryError: Java heap space", "Memory Leak"),
    ("Cannot allocate memory", "Memory Leak"),
    ("Memory usage exceeded 95%", "Memory Leak"),
    ("GC overhead limit exceeded", "Memory Leak"),
    
    # High CPU
    ("CPU 99%", "High CPU Process"),
    ("CPU load average is abnormally high", "High CPU Process"),
    ("Process hogging CPU resources", "High CPU Process"),
    ("Thread starvation", "High CPU Process"),

    # Database Connection
    ("connection timeout", "Database Connection Failure"),
    ("failed to connect to database", "Database Connection Failure"),
    ("MongoTimeoutError", "Database Connection Failure"),
    ("SQL server gone away", "Database Connection Failure"),

    # Connection Pool
    ("Connection pool exhausted", "Connection Pool Exhaustion"),
    ("No available connections in pool", "Connection Pool Exhaustion"),
    ("Timeout waiting for connection from pool", "Connection Pool Exhaustion"),

    # API Timeout
    ("API gateway timeout", "API Timeout"),
    ("Request timed out", "API Timeout"),
    ("504 Gateway Timeout", "API Timeout"),
    ("upstream request timeout", "API Timeout"),

    # Network Congestion
    ("Network unreachable", "Network Congestion"),
    ("High latency detected", "Network Congestion"),
    ("Packet loss high", "Network Congestion"),
    ("SocketTimeoutException", "Network Congestion"),

    # Disk Saturation
    ("No space left on device", "Disk Saturation"),
    ("Disk usage 100%", "Disk Saturation"),
    ("IOError: write failed", "Disk Saturation"),

    # Service Crash
    ("ECONNREFUSED", "Service Crash"),
    ("Segmentation fault", "Service Crash"),
    ("Service exited with code 1", "Service Crash"),
    ("Application panicked", "Service Crash"),
]

def train_model():
    print("Loading SentenceTransformer model (this may take a moment)...")
    # Using a fast, lightweight model
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
    
    phrases = [item[0] for item in training_data]
    labels = [item[1] for item in training_data]
    
    print("Generating embeddings...")
    embeddings = embedder.encode(phrases)
    
    print("Training KNN classifier...")
    # Use distance-based neighbor logic
    clf = KNeighborsClassifier(n_neighbors=1, metric='cosine')
    clf.fit(embeddings, labels)
    
    print("Saving model and embeddings...")
    model_data = {
        'classifier': clf,
        'embedder_name': 'all-MiniLM-L6-v2',
        # Saving embeddings if we want manual cosine sim later
        'anchors': embeddings,
        'labels': labels
    }
    joblib.dump(model_data, 'rootcause_model.pkl')
    print("Saved to rootcause_model.pkl successfully!")

if __name__ == "__main__":
    train_model()

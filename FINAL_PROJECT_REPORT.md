# Cognitive Self-Healing Ecosystem - Final Project Report

The **Cognitive Self-Healing Ecosystem** is an advanced agentic AIOps environment designed to automatically detect, diagnose, remediate, and learn from system anomalies in real time. By leveraging closed-loop telemetry analytics and transformer-based semantic NLP models, the system minimizes human operational overhead.

---

## 1. System Architecture

The ecosystem consists of five node-based microservices, two Python Flask-based AI engines, a centralized API Gateway, and a React-based Dashboard.

```mermaid
graph TD
    Client[React Frontend] -->|HTTP / WebSockets| Gateway[API Gateway :5000]
    Gateway -->|Proxy /metrics| MonAgent[Monitoring Agent :5001]
    Gateway -->|Proxy /anomalies| AnomAgent[Anomaly Agent :5003]
    Gateway -->|Proxy /rootcause| RCAAgent[Root Cause Agent :5005]
    Gateway -->|Proxy /healing| HealAgent[Healing Agent :5006]
    Gateway -->|Proxy /learning| LearnAgent[Learning Agent :5007]

    MonAgent -->|Write Metrics| MongoDB[(MongoDB :27017)]
    AnomAgent -->|Query Metrics / Write Anomalies| MongoDB
    AnomAgent -->|Predict request| FlaskAnom[Flask Anomaly AI :5002]
    
    RCAAgent -->|Correlate Logs & Metrics| MongoDB
    RCAAgent -->|Analyze request| FlaskRCA[Flask RCA AI :5004]

    HealAgent -->|Check Incidents / Apply action| MongoDB
    HealAgent -->|Query best strategies| LearnAgent

    LearnAgent -->|Evaluate histories & optimize SHEI| MongoDB
```

---

## 2. Sequence Workflow Diagram

This sequence diagram illustrates the lifecycle of a detected system anomaly:

```mermaid
sequenceDiagram
    autonumber
    loop Every 10 seconds
        MonAgent->>OS: Read cpu, memory, disk, network
        MonAgent->>MongoDB: Save SystemMetrics
    end
    
    loop Every 10 seconds
        AnomAgent->>MongoDB: Fetch recent SystemMetrics
        AnomAgent->>FlaskAnom: POST /predict (metrics payload)
        FlaskAnom-->>AnomAgent: Return Prediction (anomaly: true/false)
        alt Anomaly Detected
            AnomAgent->>MongoDB: Save Anomaly & Create Open Incident (Pending RCA)
        end
    end

    loop Every 10 seconds
        RCAAgent->>MongoDB: Query Incidents (Status: OPEN, rootCause: Pending)
        RCAAgent->>MongoDB: Fetch correlating Logs & SystemMetrics
        RCAAgent->>FlaskRCA: POST /analyze (logs, metrics, context)
        FlaskRCA-->>RCAAgent: Return rootCause, confidence, RCCS score & evidence
        RCAAgent->>MongoDB: Save RootCauseAnalysis & Enrich Incident
    end

    loop Every 10 seconds
        HealAgent->>MongoDB: Fetch Incidents (rootCause found, Healing pending)
        HealAgent->>LearnAgent: GET /best-action/:rootCause (Feedback loop)
        LearnAgent-->>HealAgent: Return optimized healing action & success rate
        HealAgent->>HealAgent: Run Safety Layer risk evaluation
        alt Low Risk / Auto-Approved
            HealAgent->>HealAgent: Run simulated action & recovery verification
            HealAgent->>MongoDB: Create HealingAction (SUCCESS/FAILED) & update Incident
            HealAgent->>MongoDB: Save to HealingKnowledgeBase
        else High Risk
            HealAgent->>MongoDB: Create HealingAction (status: REQUIRES_APPROVAL)
        end
    end

    loop Every 30 seconds
        LearnAgent->>MongoDB: Aggregate HealingKnowledgeBase & RCA history
        LearnAgent->>LearnAgent: Calculate Recommendation Confidence & SHEI
        LearnAgent->>MongoDB: Save LearningInsight & LearningHistory log
    end
```

---

## 3. Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    SystemMetrics {
        ObjectId id PK
        Date timestamp
        Number cpuUsage
        Number memoryUsage
        Number diskUsage
        Object networkUsage
        Number uptime
        String hostName
        String osPlatform
    }
    
    Anomalies {
        ObjectId id PK
        Date timestamp
        Number cpuUsage
        Number memoryUsage
        Number diskUsage
        Number networkUsage
        Boolean anomaly
        Number confidence
        String anomalyType
    }

    Incidents {
        ObjectId id PK
        String title
        String description
        String severity
        String status
        String rootCause
        Number confidence
        Number rccs
        StringArray evidence
        Date analysisTimestamp
        StringArray resolutionSteps
        ObjectIdArray relatedAnomalies
        Date timestamp
    }

    RootCauseAnalyses {
        ObjectId id PK
        ObjectId incidentId FK
        ObjectId anomalyId FK
        String rootCause
        Number confidence
        Number rccs
        Object evidence
        Date timestamp
    }

    HealingActions {
        ObjectId id PK
        ObjectId incidentId FK
        String rootCause
        String action
        String recommendedAction
        String riskLevel
        Number successProbability
        String rollbackPlan
        Boolean approvalRequired
        String status
        Date startedAt
        Date completedAt
        String result
        Number verificationScore
        Number metricRecovery
        Number serviceHealth
        Number errorReduction
        Number historicalHealingSuccess
    }

    HealingKnowledgeBase {
        ObjectId id PK
        String rootCause
        String action
        String riskLevel
        Number successProbability
        Number verificationScore
        String result
        Date timestamp
    }

    LearningInsights {
        ObjectId id PK
        String rootCause
        String recommendedAction
        Number totalExecutions
        Number successfulExecutions
        Number failedExecutions
        Number rootCauseFrequency
        Number averageRecoveryTime
        Number averageVerificationScore
        Number successRate
        Number historicalFrequency
        Number recencyFactor
        Number recommendationConfidence
        Number shei
        String trendDirection
        Date lastUpdated
    }

    LearningHistory {
        ObjectId id PK
        Date timestamp
        String rootCause
        String action
        Number previousConfidence
        Number newConfidence
        String reason
        Number shei
    }

    Incidents ||--o{ RootCauseAnalyses : "has"
    Incidents ||--o{ HealingActions : "triggers"
    Anomalies ||--o{ Incidents : "associates"
```

---

## 4. Key Features & Telemetry Capabilities

1. **Self-Monitoring Agent**: Real-time Node-level metrics collector extracting platform OS variables directly using standard OS calls.
2. **Machine Learning Anomaly Detection**: Isolation Forest model trained dynamically to flag out-of-bounds resources.
3. **Semantic Log RCA (Sentence Transformers)**: Matches real stack traces and app warnings against known failure profiles using k-Nearest Neighbors text vector classification.
4. **Safety-Fenced Automated Healing**: Evaluates action risk configurations. Restarts and cleanups execute automatically on safe zones, while Critical/High actions are staged inside an Approval Queue.
5. **Continuous Optimization Loop**: Derives recommendation probabilities using historical rates to update policy weights.

---

## 5. Completed Verification & API Checklist

### API Endpoints
- **Gateway (`:5000`)**: `/health`
- **Monitoring (`:5001`)**: `GET /metrics`, `GET /metrics/latest`, `GET /metrics/stats`
- **Anomaly Detection (`:5003`)**: `GET /anomalies`, `GET /anomalies/latest`, `POST /predict-anomaly`
- **Flask Anomaly Service (`:5002`)**: `POST /predict`
- **Root Cause Analysis (`:5005`)**: `GET /rootcauses`, `GET /rootcauses/latest`
- **Flask RCA Service (`:5004`)**: `POST /analyze`
- **Healing Agent (`:5006`)**: `GET /healing-actions`, `POST /execute-healing`
- **Learning Agent (`:5007`)**: `GET /learning-insights`, `GET /learning-insights/latest`, `GET /best-action/:rootCause`, `POST /retrain-learning`

### Math and Scoring Formulas Verified
1. **Root Cause Confidence Score (RCCS)**:
   $$\text{RCCS} = 0.5 \times \text{NLP Similarity} + 0.3 \times \text{Metric Score} + 0.2 \times \text{Historical Accuracy}$$
2. **Verification Score**:
   $$\text{VerificationScore} = 0.4 \times \text{MetricRecovery} + 0.3 \times \text{ServiceHealth} + 0.2 \times \text{ErrorReduction} + 0.1 \times \text{HistoricalHealingSuccess}$$
3. **Recommendation Confidence**:
   $$\text{Confidence} = 0.4 \times \text{SuccessRate} + 0.3 \times \text{AvgVerificationScore} + 0.2 \times \text{HistoricalFrequency} + 0.1 \times \text{RecencyFactor}$$
4. **Self-Healing Effectiveness Index (SHEI)**:
   $$\text{SHEI} = 0.35 \times \text{SuccessRate} + 0.25 \times \text{AvgVerificationScore} + 0.20 \times \text{RootCauseAccuracy} + 0.20 \times \text{RecoveryEfficiency}$$

---

## 6. Future Enhancements
- **Dynamic Training Pipeline**: Implement auto-retraining triggers for the Isolation Forest anomaly detector when Metric collection grows by $10,000$ points.
- **Multi-Agent Consensus**: Introduce consensus-voting protocols across multiple monitoring endpoints to eliminate single-point false positives.
- **Rollback Automation**: Automatically execute rollback plans if `verificationScore` drops below $0.4$ within 10 seconds of healing completion.

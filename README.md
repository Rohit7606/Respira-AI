# Respira-AI

**AI-Driven Asthma Risk Prediction & Management System**

Respira-AI is an advanced healthcare application designed to predict asthma exacerbation risks in real-time. By combining patient physiology, environmental telemetry, and machine learning, it offers a "Safety First" approach to chronic respiratory disease management.

## 🚀 Key Features

*   **Real-Time Risk Analysis**: Utilizes XGBoost to predict the probability of asthma attacks based on FEV1, PEF, SpO2, and demographic data.
*   **Hybrid Safety Layer**: Implements a "Two-Brain" system where clinical guardrails (Old Brain) override ML predictions (New Brain) in critical physiological states (e.g., SpO2 < 90%).
*   **Environmental Integration**: Automatically fetches AQI, PM2.5, and humidity data based on patient location to contextualize risk.
*   **Anomaly Detection**: Identifies outlier health metrics using Isolation Forest to flag potentially unreliable inputs or medical emergencies.
*   **Interactive Explainer**: A built-in chatbot powered by LLMs to explain risk scores and suggest actionable health measures to patients.

## 🛠️ Tech Stack

### Frontend (User & Dashboard)
*   **Next.js 16**: App Router, Server Components.
*   **TailwindCSS v4**: Modern, utility-first styling.
*   **Shadcn/UI**: Accessible, high-quality component implementations.
*   **Recharts**: Data visualization for health history.

### Backend (Model & Logic)
*   **FastAPI**: High-performance Python API.
*   **XGBoost**: Gradient boosting framework for classification.
*   **Supabase**: PostgreSQL database for persistence and real-time history.
*   **Scikit-Learn**: For preprocessing and anomaly detection.

## 📦 Project Structure

```
Respira-AI/
├── apps/
│   ├── web/      # Next.js Frontend Application
│   └── api/      # FastAPI Backend & ML Service
├── ml/           # Model Artifacts (saved models, encoders)
└── README.md     # Project Documentation
```

## 🔧 Getting Started

1.  **Backend**:
    ```bash
    cd apps/api
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```

2.  **Frontend**:
    ```bash
    cd apps/web
    npm run dev
    ```

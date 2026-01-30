# PROJ-RESPIRA: Master Ledger

## Squad Status
| Agent | Task | Status |
| :--- | :--- | :--- |
| **Audit** | **Visual & Functional Quality Gate** | **Verified & Polished** |
| **DevOps** | **Production Deployment (Vercel + Render)** | **Live ✅** |
| Builder | Phase 2 - Advanced Model Refinement | In Progress |

## Current Trajectory: Phase 2 - Advanced Model Refinement

### 1. The Strategy: "From Rules to Intelligence"
The user wants to remove the "Safety Nets" (e.g., `if spo2 < 90: risk = 0.99`) and trust the model implicitly. To do this, the model must understand **physiological context**, not just raw numbers.

#### The Problem with Raw Numbers
- A 3.0L FEV1 is **Healthy** for a 5'2" Female (65yo).
- A 3.0L FEV1 is **Severe Obstruction** for a 6'2" Male (25yo).
- **Current Model:** Has to "learn" this complex non-linear relationship (Height/Age/Gender -> Volume) from scratch. This makes it "wobbly" and necessitates the safety net.

#### The Solution: Feature Engineering (Medical Standard)
We will implement **"Percent Predicted"** calculations *before* the model.
Instead of feeding raw `Age, Height, Gender, FEV1`, we feed:
1.  `FEV1_Percent_Predicted` (Actual / Predicted)
2.  `PEF_Percent_Predicted`

If `FEV1_Percent_Predicted < 50%`, the model *instantly* knows it's high risk, regardless of age/gender. This linearizes the problem and allows us to remove the hardcoded overrides.

### 2. Architecture Changes

#### A. The "Smart" Data Engine (`data_engine.py` & `synthetic_generator.py`)
- **Action:** Update generator to calculate `Predicted_FEV1` using simplified Hankinson equations (or comparable heuristic) to generate *realistic* `Percent_Predicted` values.
- **Action:** Train the model on `Percent_Predicted` instead of (or in addition to) raw values.

#### B. The "Clean" API (`main.py`)
- **Action:** Remove `if request.spo2 < 90` (Safety Net).
- **Action:** Remove `if env_data.pm25 > 50` (Environmental Penalty).
    - *Why?* The model already takes `Pollution` as input. If trained correctly, it will learn the penalty naturally.
- **Action:** Remove manual `uncertainty_range` heuristics.
    - *Replace with:* **XGBoost Probabilities**. If the model is robust, `model.predict_proba()` *is* the uncertainty.

### 3. Execution Plan (The Builder)
1.  **Refine Generator:** Update `synthetic_generator.py` to standardizing inputs (calculate % predicted).
2.  **Retrain:** Train on these "Medical Features".
3.  **Calibrate:** Ensure `predict_proba()` is accurate (e.g., 90% probability actually means 90% risk).
4.  **Purge:** Delete the `if/else` blocks in `main.py`.
5.  **Verify:** Show that `spO2=88` *naturally* yields >0.95 Risk.

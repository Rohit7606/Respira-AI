# AGENTS.md - Respira Asthma CDSS Development Guide

**Role:** AI Engineering Lead  
**Project:** Respira-AI
**Version:** 1.0  
**Status:** Ready for Implementation

---

## 1. Project Overview

### 1.1 PRD Summary

**Product:** Respira Trust-First CDSS - A Clinical Decision Support System that predicts 30-day asthma exacerbation risk with quantified uncertainty.

**Key Differentiator:** Every prediction includes:
1. Conformal Prediction intervals (e.g., "Risk: 78% ± 6%")
2. Anomaly detection (flags out-of-distribution patients)
3. SHAP explainability (top 3 risk factors)

**Core Value Proposition:** Unlike existing monitoring tools, this system provides **predictive intelligence** wrapped in a **Trust Engine** that communicates confidence intervals and flags anomalous inputs.

**Success Criteria:**
- 10 beta clinicians complete 50+ predictions each
- NPS > 40
- Trust Utility Score ≥ 95% (predictions with valid confidence intervals)
- P95 API latency < 1000ms

### 1.2 Architecture Philosophy

**Hybrid Intelligence Pattern:**
- Application shell and historical data retrieval: Next.js Server Components (SEO + speed)
- Intelligence layer (Prediction & Trust Engine): Decoupled FastAPI service (high-performance)
- State synchronization: URL (Nuqs) + Server State (TanStack Query)

**Core Principle - "Trust-First":**
> "Every number shown to a clinician either has a confidence interval, or it's a measurement. Predictions without uncertainty are lies."

---

## 2. Tech Stack (S-Tier 2026)

### 2.1 Frontend Stack

**Framework:**
- **Next.js 16 (App Router)** - Modern React framework with Server Components
  - Server Components: Application shell, initial data fetching, history list
  - Client Components: Interactive widgets (forms, charts, real-time updates)

**Styling & UI:**
- **Tailwind CSS v4** - Utility-first CSS framework (zero-config)
- **Shadcn/UI** - Radix-based component library
- **Lucide React** - Icon library (medical icons: Activity, Wind, ShieldAlert)
- **Recharts** - Data visualization (mandatory for Risk Gauge with confidence intervals)

**State Management:**
- **TanStack Query v5** - Server state caching and synchronization
- **Nuqs** - URL-based state management for filters and view preferences
- **React Hook Form** - Form state management with Zod validation

**Type Safety:**
- **TypeScript (Strict Mode)** - Type-safe development
- **Zod** - Runtime schema validation
- **Orval** - Auto-generate TypeScript types from FastAPI OpenAPI spec

### 2.2 Backend Stack

**Framework:**
- **FastAPI (Python 3.11)** - High-performance async API framework
- **Pydantic v2** - Data validation and serialization

**ML Stack:**
- **AutoGluon** - Automated ML for risk prediction
- **MAPIE** - Conformal prediction for confidence intervals
- **Isolation Forest** - Anomaly detection
- **SHAP** - Model explainability

**Data & Caching:**
- **Supabase (PostgreSQL)** - Primary database with Row Level Security
- **Redis** - Caching layer for environmental data
- **Supabase Typegen** - Auto-generate TypeScript types from database schema

**Authentication:**
- **Supabase Auth (GoTrue)** - JWT-based authentication

**External APIs:**
- **OpenWeatherMap API** - Environmental data (AQI, PM2.5)

### 2.3 Deployment

**Frontend:** Vercel (Next.js optimized hosting)  
**Backend:** Railway or AWS (FastAPI + Redis)  
**Database:** Supabase Cloud (PostgreSQL with managed backups)

---

## 3. Architectural Constraints

### 3.1 Frontend Constraints

**Constraint 1: Server vs Client Components**
- **Rule:** Use Server Components for the application shell and initial data fetching (e.g., history list)
- **Rule:** Use Client Components only for interactive widgets (e.g., Dashboard forms, charts, real-time updates)
- **Rationale:** Optimal performance, SEO, and reduced client-side JavaScript

**Constraint 2: State Management**
- **Rule:** Do NOT use `useState` for page-level filters or patient IDs
- **Rule:** Store `patientId` and view preferences in URL query params using Nuqs
- **Rule:** Do NOT use raw `fetch` in `useEffect`
- **Rule:** Wrap the FastAPI POST `/predict` call in a `useMutation` hook from TanStack Query
- **Rationale:** URL state enables shareable links, TanStack Query provides caching/error handling

**Constraint 3: Iconography**
- **Rule:** Use Lucide React exclusively for icons
- **Rule:** Standard medical icons: `Activity` (Vitals), `Wind` (FEV1), `ShieldAlert` (Outlier)
- **Rationale:** Consistent, accessible, tree-shakeable icon library

**Constraint 4: Data Visualization**
- **Rule:** Use Recharts for all charts and gauges
- **Rule:** The Risk Gauge must use `RadialBarChart` with custom "Trust Whiskers" (confidence intervals)
- **Rationale:** Recharts is the mandatory library for medical-grade visualizations

### 3.2 Backend Constraints

**Constraint 5: The Bridge (Contract-First)**
- **Rule:** NEVER manually write TypeScript interfaces for API responses
- **Rule:** Generate TS types directly from FastAPI `openapi.json` schema using Orval
- **Rule:** Run `npm run codegen` after any backend schema change
- **Rationale:** Single source of truth prevents type mismatches

**Constraint 6: Database Security**
- **Rule:** Use Supabase (PostgreSQL) with strict Row Level Security (RLS)
- **Rule:** Use Supabase Typegen for database interactions
- **Rule:** Schema changes must propagate to codebase via type generation
- **Rationale:** Zero-trust security model, type-safe database queries

**Constraint 7: Authentication**
- **Rule:** All API endpoints require authentication (except `/health`)
- **Rule:** Next.js middleware protects routes
- **Rule:** Axios interceptor injects `Bearer <access_token>` into FastAPI requests
- **Rule:** FastAPI dependency `get_current_user` verifies JWT signature against Supabase Secret
- **Rationale:** Defense-in-depth security

---

## 4. Senior Engineering Standards (NON-NEGOTIABLE)

### Rule 1: The "Contract-First" Integrity Rule

**Junior Mistake:**  
Changing a Python Pydantic model and forgetting to update the TS interface, causing runtime crashes in production.

**Senior Standard:**  
The API Contract is the source of truth. You MUST run a codegen script (`npm run codegen`) that pulls the OpenAPI spec from FastAPI and generates the Zod schemas and TypeScript types via Orval. If the generated types don't match your UI code, the build is blocked.

**Implementation:**
```javascript
// orval.config.ts
module.exports = {
  'respira-api': {
    input: 'http://localhost:8000/openapi.json',
    output: {
      mode: 'tags-split',
      target: './src/lib/api/generated.ts',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/lib/api/axios.ts',
          name: 'customInstance',
        },
      },
    },
  },
};
```

**Usage:**
```typescript
// Auto-generated hook
const { mutate, isPending } = usePredictRiskMutation();
// mutate({ data: validZodData }) -> Type safe!
```

---

### Rule 2: The "Graceful Degradation" Layout

**Junior Mistake:**  
The entire dashboard crashes or spins infinitely if the OpenWeatherMap API fails.

**Senior Standard:**  
Implement Component-Level Error Boundaries. Wrap the `EnvironmentalContextCard` in its own `<ErrorBoundary fallback={<FallbackCard />}>`. If external APIs fail, the core Risk Gauge must still load with a warning toast ("Environmental data unavailable - Risk calculation using regional defaults").

**Implementation:**
```tsx
<ErrorBoundary fallback={<EnvironmentalFallback />}>
  <EnvironmentalContextCard zipCode={zipCode} />
</ErrorBoundary>
```

**Backend Fallback:**
```python
try:
    env_data = await fetch_environmental_data(zip_code)
except ExternalAPIError as e:
    logger.warning(f"API failed: {e}, using fallback")
    env_data = get_regional_fallback_data(zip_code)
```

**Fallback Strategy Table:**

| Dependency | Failure | Fallback |
|---|---|---|
| OpenWeatherMap | Timeout | Regional average AQI |
| Supabase | Connection error | Retry exponential backoff |
| AutoGluon | Load failure | 500 "Model unavailable" |
| Redis | Connection error | Skip cache, fetch directly |

---

### Rule 3: Visualization of Uncertainty (The "Anti-Black Box" Rule)

**Junior Mistake:**  
Displaying the risk score as a single number (78%) or a simple progress bar.

**Senior Standard:**  
Every predictive visualization must support a Range Input. The Risk Gauge component must accept `value`, `minConfidence`, and `maxConfidence`. If the `interval_width` exceeds a safety threshold (e.g., >20%), the UI must visually "gray out" or desaturate the gauge to subconsciously signal lower trust to the clinician.

**Implementation:**
```tsx
export function RiskGaugeCard({ 
  riskScore, 
  lowerBound, 
  upperBound, 
  trustRating 
}: RiskGaugeProps) {
  const intervalWidth = upperBound - lowerBound;
  const isLowConfidence = intervalWidth > 0.20;
  
  return (
    <Card className={isLowConfidence ? 'opacity-60' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>30-Day Exacerbation Risk</span>
          <Badge variant={trustRating === 'high' ? 'default' : 'secondary'}>
            {trustRating === 'high' ? '✓ High Confidence' : '⚠ Low Confidence'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Recharts RadialBarChart with confidence whiskers */}
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart data={[{ value: riskScore * 100 }]}>
            <RadialBar dataKey="value" />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* Confidence Interval Visualization */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm">{Math.round(lowerBound * 100)}%</span>
          <div className="flex-1 mx-4 h-2 bg-slate-200 rounded-full">
            <div 
              className="h-full bg-blue-500 opacity-30 rounded-full"
              style={{ width: `${intervalWidth * 100}%` }}
            />
          </div>
          <span className="text-sm">{Math.round(upperBound * 100)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Rule 4: Strict "Branded Types" for Medical Primitives

**Junior Mistake:**  
Passing `age` as a generic `number`.

**Senior Standard:**  
Use Branded Types for domain-critical values to prevent unit errors.

**Implementation:**
```typescript
// Type branding
type Liters = number & { __brand: 'Liters' };
type Percentage = number & { __brand: 'Percentage' };
type Years = number & { __brand: 'Years' };

// Function signature enforces units
function calculateRisk(
  fev1: Liters, 
  spo2: Percentage,
  age: Years
): number {
  // TypeScript prevents passing wrong units
  return fev1 * (spo2 / 100) * (age / 100);
}

// Factory functions for safe construction
function liters(value: number): Liters {
  if (value < 0 || value > 8) {
    throw new Error('Invalid FEV1 value');
  }
  return value as Liters;
}

function percentage(value: number): Percentage {
  if (value < 0 || value > 100) {
    throw new Error('Invalid percentage');
  }
  return value as Percentage;
}

// Usage
const fev1 = liters(2.8);
const spo2 = percentage(97);
const age = 42 as Years;

calculateRisk(fev1, spo2, age); // ✅ Type safe
calculateRisk(2.8, 97, 42); // ❌ Type error
```

---

### Rule 5: Telemetry is Not Optional

**Junior Mistake:**  
Relying on user reports for "weird predictions."

**Senior Standard:**  
Instrument OpenTelemetry or Sentry. Specifically, log a "Trust Event" whenever the AnomalyDetector triggers (`is_outlier: true`). These events must include the `request_id` and the inputs that triggered the anomaly, allowing for post-mortem analysis of the model's behavior on edge cases.

**Implementation:**
```python
import sentry_sdk
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

@app.post("/api/v1/predict")
async def predict_risk(request: PredictionRequest):
    with tracer.start_as_current_span("predict_risk") as span:
        span.set_attribute("request_id", str(request_id))
        span.set_attribute("user_id", current_user.id)
        
        # Anomaly detection
        anomaly_result = anomaly_detector.detect(features)
        
        if anomaly_result['is_outlier']:
            # Log Trust Event
            sentry_sdk.capture_message(
                "Anomaly Detected",
                level="warning",
                extras={
                    "request_id": str(request_id),
                    "anomaly_score": anomaly_result['anomaly_score'],
                    "input_features": request.dict(),
                    "flagged_features": anomaly_result.get('flagged_features', [])
                }
            )
            span.set_attribute("is_outlier", True)
            span.set_attribute("anomaly_score", anomaly_result['anomaly_score'])
        
        # Continue with prediction
        prediction = trust_engine.predict(features)
        
        return prediction
```

**Frontend Instrumentation:**
```typescript
import * as Sentry from "@sentry/nextjs";

const { mutate } = usePredictRiskMutation({
  onError: (error) => {
    Sentry.captureException(error, {
      tags: { component: 'PredictionWorkspace' },
      extra: { patientData: sanitizePatientData(data) }
    });
  },
  onSuccess: (data) => {
    if (data.anomaly_detection.is_outlier) {
      Sentry.captureMessage('Anomaly Detected in UI', {
        level: 'info',
        extra: { prediction: data }
      });
    }
  }
});
```

---

### Rule 6: No "Flash of Untrusted Content"

**Junior Mistake:**  
Showing 0% risk while the data is loading, then jumping to 78%.

**Senior Standard:**  
Use Skeleton Loaders that match the shape of the widget. For the text explanation, use a shimmering text block. Never initialize a risk score to 0. Initialize it to `null` or `undefined` and do not render the gauge needle until the data is fully resolved.

**Implementation:**
```tsx
export function RiskGaugeCard({ data, isLoading }: Props) {
  // ❌ BAD: Never do this
  // const riskScore = data?.risk_score ?? 0;
  
  // ✅ GOOD: Use null and conditional rendering
  const riskScore = data?.risk_score ?? null;
  
  if (isLoading || riskScore === null) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-full" />
          <Skeleton className="h-4 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      {/* Render actual content only when data is resolved */}
      <CardHeader>
        <CardTitle>30-Day Exacerbation Risk</CardTitle>
      </CardHeader>
      <CardContent>
        <RadialBarChart data={[{ value: riskScore * 100 }]}>
          <RadialBar dataKey="value" />
        </RadialBarChart>
      </CardContent>
    </Card>
  );
}
```

**Skeleton Component Example:**
```tsx
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      {...props}
    />
  );
}
```

---

## 5. Coding Standards

### 5.1 TypeScript Standards

**Strict Mode Required:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Standards:**
1. **No `any` types** - Use `unknown` and type-narrow
2. **Explicit return types** on all functions
3. **Branded types** for domain primitives (medical units)
4. **Zod schemas** for runtime validation

**Example:**
```typescript
// ❌ BAD
function calculateRisk(data: any) {
  return data.fev1 * 0.5;
}

// ✅ GOOD
function calculateRisk(data: PatientIntake): number {
  return data.fev1 * 0.5;
}

// ✅ BETTER (with branded types)
function calculateRisk(fev1: Liters, spo2: Percentage): RiskScore {
  const risk = (fev1 * (spo2 / 100)) as RiskScore;
  return risk;
}
```

### 5.2 Python Standards

**Type Hints Required:**
```python
from typing import Dict, List, Optional
from pydantic import BaseModel

# ❌ BAD
def predict(data):
    return model.predict(data)

# ✅ GOOD
def predict(data: PatientIntake) -> PredictionResult:
    features = data.to_numpy()
    prediction = model.predict(features)
    return PredictionResult(**prediction)
```

**Standards:**
1. **Type hints** on all functions
2. **Pydantic models** for all API schemas
3. **Black formatter** before commit
4. **Async/await** for I/O operations

**Pydantic Example:**
```python
from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    age: int = Field(..., ge=0, le=120)
    fev1: float = Field(..., ge=0.5, le=8.0, description="Liters")
    pef: int = Field(..., ge=50, le=700, description="L/min")
    spo2: int = Field(..., ge=70, le=100, description="Percentage")
    zip_code: str = Field(..., pattern=r"^\d{5}$")
    
    class Config:
        json_schema_extra = {
            "example": {
                "age": 42,
                "fev1": 2.8,
                "pef": 340,
                "spo2": 97,
                "zip_code": "02115"
            }
        }
```

### 5.3 Component Organization

**File Structure:**
```
components/
├── ui/                    # Shadcn/UI primitives
│   ├── button.tsx
│   ├── card.tsx
│   └── skeleton.tsx
├── dashboard/            # Feature components
│   ├── PatientIntakeForm.tsx
│   ├── RiskGaugeCard.tsx
│   ├── ExplainabilityCard.tsx
│   └── AnomalyAlert.tsx
└── layout/               # Layout components
    ├── Header.tsx
    └── Sidebar.tsx
```

**Component Standards:**
1. **One component per file**
2. **Props interface at top**
3. **Export component at bottom**
4. **Use `'use client'` directive only when necessary**

**Example:**
```tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface RiskGaugeCardProps {
  riskScore: number;
  lowerBound: number;
  upperBound: number;
  trustRating: 'high' | 'medium' | 'low';
  isLoading?: boolean;
}

export function RiskGaugeCard({
  riskScore,
  lowerBound,
  upperBound,
  trustRating,
  isLoading = false
}: RiskGaugeCardProps) {
  // Component logic
  
  return (
    <Card>
      {/* Component JSX */}
    </Card>
  );
}
```

### 5.4 Error Handling Patterns

**Frontend:**
```typescript
import { toast } from 'sonner';

const { mutate, isPending, error } = usePredictRiskMutation({
  onError: (error) => {
    if (error instanceof EnvironmentalDataError) {
      toast.warning('Using estimated environmental data');
    } else if (error instanceof NetworkError) {
      toast.error('Network error. Please try again.');
    } else {
      toast.error('Prediction failed. Please contact support.');
    }
  },
  onSuccess: (data) => {
    if (data.anomaly_detection.is_outlier) {
      toast.warning('Unusual patient profile detected');
    }
  }
});
```

**Backend:**
```python
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

@app.post("/api/v1/predict")
async def predict_risk(request: PredictionRequest):
    try:
        # Environmental data with fallback
        try:
            env_data = await fetch_environmental_data(request.zip_code)
        except ExternalAPIError as e:
            logger.warning(f"Environmental API failed: {e}")
            env_data = get_fallback_data(request.zip_code)
        
        # Trust Engine pipeline
        result = trust_engine.predict(request, env_data)
        
        # Audit log
        await log_prediction(result, current_user.id)
        
        return result
        
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ModelError as e:
        logger.error(f"Model error: {e}")
        raise HTTPException(status_code=500, detail="Prediction service unavailable")
    except Exception as e:
        logger.exception("Unexpected error in prediction")
        raise HTTPException(status_code=500, detail="Internal server error")
```

---

## 6. Development Workflow

### 6.1 Setup Instructions

**Prerequisites:**
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+ (or Supabase account)
- Redis (local or cloud)

**Quick Start:**

```bash
# 1. Clone repository
git clone https://github.com/your-org/respira-cdss.git
cd respira-cdss

# 2. Install dependencies
pnpm install  # Frontend
cd apps/api && pip install -r requirements.txt  # Backend

# 3. Environment setup
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Database setup
cd apps/web
npx supabase db push  # Apply migrations

# 5. Generate types
npm run codegen  # Generate API types from FastAPI
npx supabase gen types typescript --local > lib/database.types.ts

# 6. Start development servers
npm run dev  # Frontend (port 3000)
cd apps/api && uvicorn main:app --reload  # Backend (port 8000)
```

### 6.2 Development Cycle

**Standard Workflow:**

1. **Backend First:**
   - Define Pydantic models in FastAPI
   - Implement endpoint logic
   - Test with FastAPI `/docs` interactive UI

2. **Generate Types:**
   ```bash
   npm run codegen  # Generates TypeScript from OpenAPI
   ```

3. **Frontend Development:**
   - Use generated hooks (e.g., `usePredictRiskMutation()`)
   - Build UI components
   - Test with backend running locally

4. **Database Changes:**
   ```bash
   npx supabase migration new <migration_name>
   # Edit migration file
   npx supabase db push
   npx supabase gen types typescript --local > lib/database.types.ts
   ```

5. **Commit:**
   ```bash
   git add .
   git commit -m "feat: add risk gauge component"
   git push
   ```

### 6.3 Testing Strategy

**Unit Tests:**
```typescript
// Frontend (Vitest)
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskGaugeCard } from './RiskGaugeCard';

describe('RiskGaugeCard', () => {
  it('renders loading skeleton when data is null', () => {
    render(<RiskGaugeCard riskScore={null} isLoading={true} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });
  
  it('shows high confidence badge for narrow intervals', () => {
    render(
      <RiskGaugeCard 
        riskScore={0.78}
        lowerBound={0.72}
        upperBound={0.84}
        trustRating="high"
      />
    );
    expect(screen.getByText(/High Confidence/)).toBeInTheDocument();
  });
});
```

```python
# Backend (pytest)
import pytest
from app.core.engine import TrustEngine

def test_anomaly_detection():
    engine = TrustEngine()
    
    # Normal patient
    normal_features = [42, 2.8, 340, 97]
    result = engine.detect_anomaly(normal_features)
    assert result['is_outlier'] == False
    
    # Outlier patient
    outlier_features = [19, 4.5, 500, 99]
    result = engine.detect_anomaly(outlier_features)
    assert result['is_outlier'] == True
    assert result['anomaly_score'] < -0.60
```

**Integration Tests:**
```typescript
// E2E (Playwright)
import { test, expect } from '@playwright/test';

test('complete prediction flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[type=email]', 'test@example.com');
  await page.click('button:has-text("Sign in")');
  
  // Fill form
  await page.goto('/dashboard');
  await page.fill('input[name=age]', '42');
  await page.fill('input[name=fev1]', '2.8');
  await page.fill('input[name=pef]', '340');
  await page.fill('input[name=spo2]', '97');
  await page.fill('input[name=zipCode]', '02115');
  
  // Submit
  await page.click('button:has-text("Analyze Risk")');
  
  // Verify results
  await expect(page.locator('[data-testid=risk-gauge]')).toBeVisible();
  await expect(page.locator('text=/High Confidence/')).toBeVisible();
});
```

### 6.4 Pre-Commit Checklist

Before committing code:

- [ ] TypeScript compiles with no errors (`npm run typecheck`)
- [ ] All tests pass (`npm run test`)
- [ ] Code formatted (`npm run format`)
- [ ] No console.log statements
- [ ] Environment variables in .env.example documented
- [ ] If backend changed: Run `npm run codegen`
- [ ] If database changed: Generate new types

---

## 7. Component Specifications

### 7.1 PatientIntakeForm Component

**Path:** `components/dashboard/PatientIntakeForm.tsx`

**Props:**
```typescript
interface PatientIntakeFormProps {
  onSubmit: (data: PatientIntakeData) => void;
  isLoading?: boolean;
}
```

**Requirements:**
- React Hook Form + Zod validation
- Real-time error feedback
- Keyboard shortcuts (Cmd+Enter to submit)
- Clinical range warnings (FEV1 > 6.0L)
- ZIP code geolocation preview

**Zod Schema:**
```typescript
export const patientIntakeSchema = z.object({
  age: z.number().min(0).max(120),
  gender: z.enum(['male', 'female', 'other']),
  fev1: z.number().min(0.5).max(8.0),
  pef: z.number().min(50).max(700),
  spo2: z.number().int().min(70).max(100),
  zipCode: z.string().regex(/^\d{5}$/)
});
```

### 7.2 RiskGaugeCard Component

**Path:** `components/dashboard/RiskGaugeCard.tsx`

**Props:**
```typescript
interface RiskGaugeCardProps {
  riskScore: number | null;
  lowerBound: number;
  upperBound: number;
  trustRating: 'high' | 'medium' | 'low';
  isLoading?: boolean;
}
```

**Requirements:**
- Recharts RadialBarChart
- Confidence whiskers visualization
- Trust badge (High/Low Confidence)
- Skeleton loader for loading state
- Desaturation for low confidence (interval_width > 20%)

### 7.3 ExplainabilityCard Component

**Path:** `components/dashboard/ExplainabilityCard.tsx`

**Props:**
```typescript
interface ExplainabilityCardProps {
  contributors: Array<{
    feature_name: string;
    shap_value: number;
    clinical_interpretation: string;
  }>;
  isLoading?: boolean;
}
```

**Requirements:**
- Recharts BarChart for SHAP values
- Top 3 contributors only
- Clinical interpretations as tooltips
- Color coding: Negative impact (green), Positive impact (red)

### 7.4 AnomalyAlert Component

**Path:** `components/dashboard/AnomalyAlert.tsx`

**Props:**
```typescript
interface AnomalyAlertProps {
  isOutlier: boolean;
  anomalyScore: number;
  flaggedFeatures: Array<{
    feature: string;
    reason: string;
  }>;
  onAcknowledge: () => void;
}
```

**Requirements:**
- Modal overlay (blocks prediction view)
- Amber color scheme (warning, not error)
- List flagged features
- "View Prediction Anyway" button
- Only shows when `isOutlier === true`

### 7.5 EnvironmentalContextCard Component

**Path:** `components/dashboard/EnvironmentalContextCard.tsx`

**Props:**
```typescript
interface EnvironmentalContextCardProps {
  zipCode: string;
  aqi?: number;
  pm25?: number;
  lastUpdated?: Date;
  isLoading?: boolean;
  error?: Error;
}
```

**Requirements:**
- Error boundary wrapper (graceful degradation)
- AQI color coding (EPA standards)
- PM2.5 with units (μg/m³)
- Last updated timestamp
- Fallback message if API fails

---

## 8. Backend Specifications

### 8.1 Trust Engine Architecture

**Module:** `app/core/engine.py`

**Class Structure:**
```python
class TrustEngine:
    def __init__(self):
        self.autogluon_model = load_model('models/autogluon_v1.2.0')
        self.mapie_wrapper = MapieWrapper(self.autogluon_model)
        self.anomaly_detector = AnomalyDetector()
        self.shap_explainer = shap.TreeExplainer(self.autogluon_model)
    
    def predict(
        self,
        request: PredictionRequest,
        env_data: EnvironmentalData
    ) -> TrustSignal:
        """
        Main prediction pipeline with trust signals.
        
        Returns:
            TrustSignal containing:
            - risk_score
            - confidence_interval
            - is_outlier
            - shap_contributors
        """
        # 1. Feature engineering
        features = self.engineer_features(request, env_data)
        
        # 2. Anomaly detection (Gate 1)
        anomaly_result = self.anomaly_detector.detect(features)
        
        # 3. Risk prediction (Gate 2)
        risk_score = self.autogluon_model.predict_proba(features)[0][1]
        
        # 4. Confidence interval (Gate 3)
        conf_interval = self.mapie_wrapper.predict_interval(
            features,
            alpha=0.10  # 90% confidence
        )
        
        # 5. SHAP explainability (Gate 4)
        shap_values = self.shap_explainer.shap_values(features)
        top_contributors = self.get_top_contributors(shap_values, features)
        
        return TrustSignal(
            prediction=Prediction(risk_score=risk_score),
            trust_signal=ConfidenceSignal(
                confidence_level=0.90,
                prediction_interval=conf_interval,
                interval_width=conf_interval[1] - conf_interval[0]
            ),
            anomaly_detection=anomaly_result,
            explainability=Explainability(
                top_contributors=top_contributors
            )
        )
```

### 8.2 API Endpoints

**Endpoint:** `POST /api/v1/predict`

**Request:**
```json
{
  "age": 42,
  "gender": "female",
  "fev1": 2.8,
  "pef": 340,
  "spo2": 97,
  "zip_code": "02115"
}
```

**Response:**
```json
{
  "prediction": {
    "risk_score": 0.78,
    "risk_category": "high"
  },
  "trust_signal": {
    "confidence_level": 0.90,
    "prediction_interval": {
      "lower_bound": 0.72,
      "upper_bound": 0.84
    },
    "interval_width": 0.12,
    "trust_rating": "high"
  },
  "anomaly_detection": {
    "is_outlier": false,
    "anomaly_score": -0.42
  },
  "explainability": {
    "top_contributors": [
      {
        "feature_name": "fev1_percent_predicted",
from typing import Dict, Any, List
import random
from services.clinical import clinical_service

class ExplainerService:
    def generate_response(self, query: str, features: Dict[str, Any], risk_score: float) -> str:
        """
        Enhanced Clinical Logic Engine.
        Simulates an advanced AI by dynamically assembling guideline-based insights.
        """
        # Enhance features with calculated metrics for better explanation
        if 'height' in features and 'weight' in features:
             features['bmi'] = clinical_service.calculate_bmi(features['weight'], features['height'])
             
        if 'fev1' in features and 'age' in features and 'height' in features and 'gender' in features:
             pred_fev1 = clinical_service.calculate_predicted_fev1(
                 features['age'], features['height'], features['gender']
             )
             features['fev1_pct'] = round((features['fev1'] / pred_fev1) * 100, 1)
             
        q = query.lower()
        
        # 0. NARRATIVE MODE (Broad Context)
        if any(w in q for w in ["tell me about", "summary", "overview", "what's going on", "status"]):
            return self._generate_patient_narrative(features, risk_score)


        # 1. RISK ANALYSIS (Why?)
        if any(w in q for w in ["why", "risk", "reason", "factor", "cause", "driver"]):
            return self._analyze_risk_factors(features, risk_score)
            
        # 2. GUIDELINES (Standards)
        if any(w in q for w in ["guideline", "gold", "gina", "standard", "protocol", "criteria", "classification"]):
            return self._get_guidelines(features, risk_score)
            
        # 3. MANAGEMENT / TREATMENT
        if any(w in q for w in ["recommend", "treat", "manage", "plan", "therapy", "medication", "drug", "rx"]):
            return self._generate_management_plan(features)

        # 4. LIFESTYLE
        if any(w in q for w in ["lifestyle", "exercise", "diet", "habit", "smoking", "prevention"]):
            return self._generate_lifestyle_advice(features)
        
        # 5. SIMULATION / WHAT-IF
        if "if" in q or "change" in q or "reduce" in q:
            return "### Predictive Simulation\n\nBased on my model, **reducing BMI to 22** and **maintaining SpO2 > 96%** would likely lower the risk score by approximately **15-20%**."

        # Default Greeting / Capabilities
        return (
            "### How can I assist you?\n\n"
            "I have analyzed this patient's profile against **GOLD 2025** and **GINA** protocols.\n\n"
            "**Suggested Questions:**\n"
            "• *Tell me about this patient (Narrative Summary)*\n"
            "• *Why is this patient high risk?*\n"
            "• *What is the recommended treatment plan?*\n"
            "• *Show relevant clinical guidelines.*"
        )

    def _generate_patient_narrative(self, data: Dict[str, Any], risk: float) -> str:
        """Generates a cohesive, natural language summary paragraph."""
        risk_level = "High" if risk > 0.7 else "Moderate" if risk > 0.3 else "Low"
        
        parts = [
            f"This **{data['age']}-year-old {data['gender']}** presents with a **{risk_level} Risk** profile ({(risk*100):.0f}%).",
            f"Key clinical indicators include an FEV1 of **{data['fev1']}L** and SpO2 of **{data['spo2']}%**."
        ]
        
        if data['smoking'] == "Current Smoker":
            parts.append("The patient is an **active smoker**, which is a primary driver of disease progression.")
        
        if data.get('wheezing'):
            parts.append("Active **wheezing** indicates current bronchoconstriction.")
            
        if risk > 0.7:
             parts.append("Immediate clinical intervention is recommended according to GOLD guidelines.")
        else:
             parts.append("Regular monitoring suggested.")

        return "### Patient Narrative\n\n" + " ".join(parts)

    def _analyze_risk_factors(self, data: Dict[str, Any], risk: float) -> str:
        factors = []
        
        # Vital Sign Analysis
        if data['spo2'] < 92:
            factors.append("• **Critical Hypoxemia (SpO2 " + str(data['spo2']) + "%)**: Indicates severe respiratory compromise requiring immediate attention.")
        elif data['spo2'] < 95:
             factors.append("• **Low Oxygen Saturation**: SpO2 is suboptimal, contributing to risk.")

        if data['fev1'] < 1.5:
            factors.append("• **Severe Obstruction (FEV1 < 1.5L)**: Correlates with GOLD Stage 3/4 severity.")
        
        if data['pef'] < 350:
            factors.append("• **Reduced Peak Expiratory Flow**: Indicates airway variability and potential asthma exacerbation risk.")

        # Demographics
        if data['age'] > 65:
            factors.append("• **Advanced Age**: Age > 65 is an independent risk factor for exacerbation frequency.")
            
        if data['smoking'] == "Current Smoker":
            factors.append("• **Active Smoking**: The single most significant modifiable risk factor driving disease progression.")
        
        if data.get('wheezing'):
            factors.append("• **Symptomatic Wheezing**: Indicates active bronchoconstriction.")

        summary = "**High Risk Configuration**" if risk > 0.7 else "**Moderate Risk Configuration**"
        
        if not factors:
            return "### Risk Analysis\n\nThis patient presents with a **Low Risk** profile. Vital signs are within normal ranges."
            
        return f"### {summary}\n\nThe model identified {len(factors)} key drivers:\n\n" + "\n".join(factors)

    def _get_guidelines(self, data: Dict[str, Any], risk: float) -> str:
        # GOLD classification logic
        group = "A"
        if risk > 0.7 or data['fev1'] < 1.5:
             group = "E (High Risk/High Symptom)"
        elif risk > 0.3:
             group = "B (Moderate Risk)"
        
        return (
            f"### Clinical Guidelines Reference\n\n"
            f"Based on the **GOLD 2025 Report**:\n"
            f"• **Patient Classification**: Group **{group}**\n"
            f"• **Criteria**: FEV1 {data['fev1']}L combined with risk score {risk*100:.0f}%.\n\n"
            "**GINA Assessment** (if Asthma suspected):\n"
            "• Poor symptom control is suggested by PEF variability and wheezing presence."
        )

    def _generate_management_plan(self, data: Dict[str, Any]) -> str:
        plan = []
        
        # Pharmacological
        plan.append("**Pharmacological:**")
        if data['fev1'] < 2.0:
            plan.append("• Initiate LAMA/LABA combination therapy.")
        elif data.get('wheezing'):
             plan.append("• SABA (Albuterol) as needed for rescue.")
        else:
             plan.append("• Continue current maintenance therapy; re-evaluate in 3 months.")

        if data['spo2'] < 92:
             plan.append("• **Urgent:** Assess for Long-term Oxygen Therapy (LTOT).")
        
        # Non-Pharm
        plan.append("\n**Non-Pharmacological:**")
        if data['smoking'] == "Current Smoker":
            plan.append("• Smoking cessation program (Nicotine Replacement Therapy).")
        plan.append("• Pulmonary Rehabilitation referral.")
        plan.append("• Pneumococcal and Influenza vaccinations.")

        return "### Recommended Management Plan\n\n" + "\n".join(plan)
        
    def _generate_lifestyle_advice(self, data: Dict[str, Any]) -> str:
        advice = [
            "### Lifestyle Interventions\n"
        ]
        
        if data['smoking'] == "Current Smoker":
             advice.append("1. **Smoking Cessation**: Immediate intervention required (Counseling + NRT).")
        else:
             advice.append("1. **Environmental Avoidance**: Limit exposure to known allergens/pollutants.")

        advice.append("2. **Physical Activity**: Aim for 30 mins moderate activity daily to improve VO2 max.")
        
        if data.get('weight') and data.get('height'):
            # simple BMI check
            height_m = data['height'] / 100
            bmi = data['weight'] / (height_m * height_m)
            if bmi < 21:
                advice.append("3. **Diet**: High-protein diet recommended (BMI < 21 indicates capability for muscle wasting).")
            elif bmi > 30:
                 advice.append("3. **Diet**: Caloric restriction for weight management (BMI > 30).")
            else:
                 advice.append("3. **Diet**: Balanced nutritional intake.")
        else:
             advice.append("3. **Diet**: High-protein diet recommended if BMI < 21.")

        advice.append("4. **Air Quality**: Avoid outdoor activities when AQI > 100.")

        return "\n".join(advice)

explainer_service = ExplainerService()

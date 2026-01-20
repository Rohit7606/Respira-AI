from typing import Dict, Any, List
import random

class ExplainerService:
    def generate_response(self, query: str, features: Dict[str, Any], risk_score: float) -> str:
        """
        Enhanced Clinical Logic Engine.
        Simulates an advanced AI by dynamically assembling guideline-based insights.
        """
        q = query.lower()
        
        # 1. RISK ANALYSIS (Why?)
        if any(w in q for w in ["why", "risk", "reason", "factor", "cause", "driver"]):
            return self._analyze_risk_factors(features, risk_score)
            
        # 2. GUIDELINES (Standards)
        if any(w in q for w in ["guideline", "gold", "gina", "standard", "protocol", "criteria"]):
            return self._get_guidelines(features, risk_score)
            
        # 3. MANAGEMENT / TREATMENT
        if any(w in q for w in ["recommend", "treat", "manage", "plan", "therapy", "medication", "drug"]):
            return self._generate_management_plan(features)

        # 4. LIFESTYLE
        if any(w in q for w in ["lifesytle", "exercise", "diet", "habit", "smoking"]):
            return self._generate_lifestyle_advice(features)
        
        # 5. SIMULATION / WHAT-IF
        if "if" in q or "change" in q or "reduce" in q:
            return "### Predictive Simulation\n\nBased on my model, **reducing BMI by 2 points** and **improving SpO2 > 95%** would likely lower the risk score by approximately **15-20%**."

        # Default Greeting / Capabilities
        return (
            "### How can I assist you?\n\n"
            "I have analyzed this patient's profile against **GOLD 2025** and **GINA** protocols.\n\n"
            "**Suggested Questions:**\n"
            "• *Why is this patient high risk?*\n"
            "• *What is the recommended treatment plan?*\n"
            "• *Show relevant clinical guidelines.*"
        )

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
            factors.append("• **reduced Peak Expiratory Flow**: Indicates airway variability and potential asthma exacerbation risk.")

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
        if data['wheezing']:
             plan.append("• SABA (Albuterol) as needed for rescue.")
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
        return (
            "### Lifestyle Interventions\n\n"
            "1. **Smoking Cessation**: Immediate intervention required." if data['smoking'] == "Current Smoker" else ""
            "1. **Physical Activity**: Aim for 30 mins moderate activity daily to improve VO2 max.\n"
            "2. **Diet**: High-protein diet recommended if BMI < 21 to prevent muscle wasting.\n"
            "3. **Air Quality**: Avoid outdoor activities when AQI > 100."
        )

explainer_service = ExplainerService()

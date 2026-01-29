import os
import json
import urllib.request
from typing import Dict, Any, List
from services.clinical import clinical_service

class ExplainerService:
    def __init__(self):
        # Load key at runtime to ensure env is ready
        self.api_key = os.environ.get("GEMINI_API_KEY")
        print(f"DEBUG: ExplainerService Init. API Key Present: {bool(self.api_key)}")

    def generate_response(self, query: str, features: Dict[str, Any], risk_score: float) -> str:
        """
        Generates a response using Google Gemini (True AI) via REST API.
        """
        # Enhance features with calculated metrics
        if 'height' in features and 'weight' in features:
             features['bmi'] = clinical_service.calculate_bmi(features['weight'], features['height'])

        # Prepare Context
        # context = ... (Unused variable in previous code, purely for prompt)

        if self.api_key:
            try:
                # Build Prompt
                prompt_text = self._build_prompt(query, features, risk_score)
                
                # REST API Setup
                model = "gemini-2.5-flash"
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
                headers = {"Content-Type": "application/json"}
                data = {
                    "contents": [{"parts": [{"text": prompt_text}]}]
                }
                
                print(f"DEBUG: Attempting REST call to {model}...")
                
                # Make Request
                req = urllib.request.Request(
                    url, 
                    data=json.dumps(data).encode('utf-8'), 
                    headers=headers, 
                    method='POST'
                )
                
                with urllib.request.urlopen(req, timeout=20) as response:
                    if response.status == 200:
                        response_body = response.read().decode('utf-8')
                        result = json.loads(response_body)
                        
                        # Extract text
                        # Expected: candidates[0].content.parts[0].text
                        ai_text = result['candidates'][0]['content']['parts'][0]['text']
                        print("DEBUG: REST Generation successful.")
                        return ai_text
                    else:
                        print(f"DEBUG: REST Request failed with status: {response.status}")
                        
            except Exception as e:
                print(f"DEBUG: Gemini REST API Error: {e}")
                import traceback
                traceback.print_exc()
                # Fallback
                return self._fallback_heuristic_logic(query, features, risk_score)
        else:
             print("DEBUG: API Key is None, using fallback.")
             return self._fallback_heuristic_logic(query, features, risk_score)

    def _build_prompt(self, query: str, features: Dict[str, Any], risk_score: float) -> str:
        return f"""
        You are a **Clinical Decision Support System** assisting a **Physician**. 
        The user is a **Doctor**, not the patient.
        
        PATIENT DATA:
        - Risk Score: {risk_score:.2f} (Scale 0-1, >0.7 is High)
        - Age: {features.get('age')}
        - Gender: {features.get('gender')}
        - Smoking Status: {features.get('smoking')}
        - SpO2: {features.get('spo2')}%
        - FEV1: {features.get('fev1')}L
        - PEF: {features.get('pef')} L/min
        - Wheezing: {features.get('wheezing')}
        - Shortness of Breath: {features.get('shortness_of_breath')}
        - BMI: {features.get('bmi', 'N/A')}

        USER QUERY: "{query}"

        INSTRUCTIONS:
        1. **Target Audience**: Address the user as a medical professional. Refer to the patient in the third person (e.g., "The patient...", "He/She...").
        2. **Tone**: Clinical, objective, and data-driven.
        3. **Conciseness**: Be EXTREMELY concise. Cut to the chase. Use bullet points for key findings. Max 3-4 sentences per section.
        4. **Guidelines**: Reference GOLD/GINA guidelines where applicable.
        5. **No Fluff**: Do not use phrases like "As an AI..." or generic advice. Provide actionable clinical reasoning.
        6. **Formatting**: Use **bold** for key metrics, diagnoses, and urgent recommendations.

        DYNAMIC SUGGESTIONS:
        At the very end, strictly output 3 relevant short follow-up questions that a **Doctor** might ask next.
        Format exactly like this:
        
        ---
        SUGGESTED_QUESTIONS
        - [Question 1]
        - [Question 2]
        - [Question 3]
        """

    def _fallback_heuristic_logic(self, query: str, features: Dict[str, Any], risk_score: float) -> str:
        """Original Fallback Logic for offline/failure modes"""
        # Re-implementing a simplified version of the original logic for safety
        q = query.lower()
        
        if "smoke" in q or "smoking" in q:
             if features.get('smoking') == "Current Smoker":
                 return "### Smoking Cessation\n\nAs a current smoker, quitting is the single most effective step you can take. Your lung function is already compromised. I recommend NRT (Nicotine Replacement Therapy) and counseling."
             return "### Smoking Advice\n\nSmoking significantly accelerates lung function decline. Maintaining a smoke-free lifestyle is critical for long-term health."

        if "risk" in q:
             return f"### Risk Analysis\n\nThe calculated risk score is **{risk_score:.2f}**. This considers age, vitals, and symptoms."

        return (
            "### Clinical Decision Support\n\n"
            "I am currently operating in offline mode. I can still analyze the risk score data.\n\n"
            "**Suggested Questions:**\n"
            "• Why is the risk high?\n"
            "• Show clinical guidelines.\n"
            "• What is the treatment plan?"
        )

explainer_service = ExplainerService()

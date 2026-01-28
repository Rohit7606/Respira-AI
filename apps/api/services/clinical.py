import math

class ClinicalService:
    """
    Standard Medical Formulas for Respiratory Health.
    Uses simplified Hankinson (NHANES III) approximations for predicted values.
    """
    
    @staticmethod
    def calculate_predicted_fev1(age: int, height_cm: float, gender: str, ethnicity: str = "Caucasian") -> float:
        """
        Calculates predicted FEV1 (Liters) based on demographics.
        Source: Approximation of Hankinson et al.
        """
        height_m = height_cm / 100.0
        
        # Coefficients (Simplified for general use)
        if gender == "Male":
            # Male: -0.1933 + (0.00064 * age) + (-0.000269 * age^2) + (4.37 * height) ... simplified
            # Rule of thumb: Height is dominant. Age reduces it.
            # Base: ~4.0L for avg male.
            predicted = (4.3 * height_m) - (0.029 * age) - 2.0
        else: # Female
            # Female generally 15-20% lower lung volume
            predicted = (3.95 * height_m) - (0.025 * age) - 2.6
            
        return max(1.5, round(predicted, 2))

    @staticmethod
    def calculate_predicted_pef(age: int, height_cm: float, gender: str) -> int:
        """
        Calculates predicted PEF (L/min).
        Standard: ~400-600 L/min varies by height/age.
        """
        height_m = height_cm / 100.0
        
        if gender == "Male":
            # Peak at age 30, decline after.
            age_factor = -1.5 * abs(age - 30)
            predicted = (5.5 * height_m * 100) + age_factor - 80
        else:
            age_factor = -1.2 * abs(age - 30)
            predicted = (4.2 * height_m * 100) + age_factor - 50
            
        return int(max(200, predicted))

    @staticmethod
    def calculate_bmi(weight_kg: float, height_cm: float) -> float:
        if height_cm <= 0: return 22.0
        h_m = height_cm / 100.0
        return round(weight_kg / (h_m * h_m), 1)

clinical_service = ClinicalService()

import sys
import os

sys.path.append(os.getcwd())

try:
    from services.clinical import clinical_service
    print("Import Successful")
except Exception as e:
    print(f"Import Failed: {e}")
    sys.exit(1)

try:
    print("Testing Calculations...")
    age = 55
    height = 175
    gender = "Male"
    weight = 80
    
    bmi = clinical_service.calculate_bmi(weight, height)
    print(f"BMI: {bmi}")
    
    fev1 = clinical_service.calculate_predicted_fev1(age, height, gender)
    print(f"Pred FEV1: {fev1}")
    
    pef = clinical_service.calculate_predicted_pef(age, height, gender)
    print(f"Pred PEF: {pef}")
    
    # Test None handling (Crash check)
    try:
        clinical_service.calculate_predicted_fev1(age, None, gender)
    except Exception as e:
        print(f"Correctly caught None height error: {e}")

except Exception as e:
    print(f"Logic Failed: {e}")

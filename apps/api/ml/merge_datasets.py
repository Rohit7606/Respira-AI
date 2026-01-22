
import pandas as pd
import numpy as np
import os

# Define Paths
BASE_DIR = r"d:\College\College Projects\Respira-AI"
DATASET_DIR = os.path.join(BASE_DIR, "Dataset")
OLD_DATASET_PATH = os.path.join(BASE_DIR, "final_asthma_dataset.csv")

OUTPUT_PATH = os.path.join(DATASET_DIR, "master_dataset.csv")

def load_datasets():
    print("Loading datasets...")
    
    # 1. Existing Dataset
    try:
        df_old = pd.read_csv(OLD_DATASET_PATH)
        print(f"Loaded Old Dataset: {df_old.shape}")
    except FileNotFoundError:
        print(f"Warning: Old dataset not found at {OLD_DATASET_PATH}")
        df_old = pd.DataFrame()

    # 2. Asthma 2011-2012
    try:
        df_2011 = pd.read_csv(os.path.join(DATASET_DIR, "asthma_2011_2012.csv"))
        print(f"Loaded 2011-2012 Dataset: {df_2011.shape}")
    except FileNotFoundError:
        print("Warning: asthma_2011_2012.csv not found")
        df_2011 = pd.DataFrame()

    # 3. Asthma Disease Data
    try:
        df_disease = pd.read_csv(os.path.join(DATASET_DIR, "asthma_disease_data.csv"))
        print(f"Loaded Disease Dataset: {df_disease.shape}")
    except FileNotFoundError:
        print("Warning: asthma_disease_data.csv not found")
        df_disease = pd.DataFrame()

    # 4. NHANES 2012 Risk
    try:
        df_nhanes = pd.read_csv(os.path.join(DATASET_DIR, "asthma_risk_nhanes_2012.csv"))
        print(f"Loaded NHANES Dataset: {df_nhanes.shape}")
    except FileNotFoundError:
        print("Warning: asthma_risk_nhanes_2012.csv not found")
        df_nhanes = pd.DataFrame()

    return df_old, df_2011, df_disease, df_nhanes

def standardize_and_merge(df_old, df_2011, df_disease, df_nhanes):
    print("\nStandardizing columns...")
    
    # Target Columns to keep
    # We focus on: Age, Gender, BMI, Smoking, Wheezing, Diagnosis (Target)
    # Other potential: ShortnessOfBreath, PhysicalActivity (if available)
    
    # --- 1. Old Dataset ---
    # Cols: Age, Gender, BMI, Smoking, Wheezing, Exacerbation(Target)
    df_old_std = pd.DataFrame()
    if not df_old.empty:
        df_old_std['Age'] = df_old['Age']
        df_old_std['Gender'] = df_old['Gender'] # Assuming encoded or text
        df_old_std['BMI'] = df_old['BMI']
        df_old_std['Smoking'] = df_old['Smoking']
        df_old_std['Wheezing'] = df_old['Wheezing']
        df_old_std['Diagnosis'] = df_old['Exacerbation'] # Target mapping
        # Normalize
        # Check if Gender is 0/1 or M/F. Usually 0/1 in processed checks.
        
    # --- 2. Asthma 2011-2012 (NHANES style) ---
    # Cols likely: RIDAGEYR (Age), RIAGENDR (Gender), BMXBMI (BMI), ...
    # Have to guess/check column names from context or assume standard NHANES
    df_2011_std = pd.DataFrame()
    if not df_2011.empty:
        # Map columns - adjust based on actual file inspection if needed, but using standard NHANES keys
        # If keys fail, we catch error or fill nan
        df_2011_std['Age'] = df_2011.get('RIDAGEYR', df_2011.get('Age', np.nan))
        df_2011_std['Gender'] = df_2011.get('RIAGENDR', df_2011.get('Gender', np.nan)) # 1=Male, 2=Female often
        df_2011_std['BMI'] = df_2011.get('BMXBMI', df_2011.get('BMI', np.nan))
        df_2011_std['Smoking'] = df_2011.get('LBXCOT', np.nan) # Cotinine as proxy? Or questionnaire. 
        # Actually usually SMQ020 or similar. If not present, we might have to drop or fill 0.
        # Let's try to find a 'smoking' related column if mapped manually before, else fill 0
        
        # Checking for asthma diagnosis
        # MCQ010 = "Has a doctor or other health professional ever told you that you have asthma?"
        df_2011_std['Diagnosis'] = df_2011.get('MCQ010', df_2011.get('asthma_diagnosis', np.nan))
        
        # Wheezing
        # RDQ070 = "Wheezing or whistling in the chest in past 12 months"
        df_2011_std['Wheezing'] = df_2011.get('RDQ070', df_2011.get('Wheezing', 0))

        # Standardization Rule: Move 1/2 to 0/1. 
        # NHANES: 1=Yes, 2=No. 
        # We want: 1=Yes, 0=No.
        df_2011_std['Diagnosis'] = df_2011_std['Diagnosis'].apply(lambda x: 1 if x == 1 else 0)
        df_2011_std['Wheezing'] = df_2011_std['Wheezing'].apply(lambda x: 1 if x == 1 else 0)
        df_2011_std['Gender'] = df_2011_std['Gender'].apply(lambda x: 0 if x == 1 else 1) # Arbitrary map: 1(M)->0, 2(F)->1 or similar. 
        # Let's Standardize: 0=Male, 1=Female
        # NHANES: 1=Male, 2=Female -> Map x-1 -> 0, 1
        
    # --- 3. Asthma Disease Data ---
    # Likely cleaner labels
    df_disease_std = pd.DataFrame()
    if not df_disease.empty:
        df_disease_std['Age'] = df_disease.get('Age', np.nan)
        df_disease_std['Gender'] = df_disease.get('Gender', np.nan)
        df_disease_std['BMI'] = df_disease.get('BMI', np.nan)
        df_disease_std['Smoking'] = df_disease.get('Smoking', 0)
        df_disease_std['Wheezing'] = df_disease.get('Wheezing', 0)
        df_disease_std['Diagnosis'] = df_disease.get('Diagnosis', 0)
        
    # --- 4. NHANES 2012 Risk (df_nhanes) ---
    # Cols: AGE, SEX, BMI, WHEEZE_12MO, ASTHMA
    df_nhanes_std = pd.DataFrame()
    if not df_nhanes.empty:
        df_nhanes_std['Age'] = df_nhanes.get('AGE', np.nan)
        df_nhanes_std['Gender'] = df_nhanes.get('SEX', np.nan) # 1=M, 2=F
        df_nhanes_std['BMI'] = df_nhanes.get('BMI', np.nan)
        df_nhanes_std['Smoking'] = df_nhanes.get('LBXCOT', 0) # Use cotinine or other indicator
        df_nhanes_std['Wheezing'] = df_nhanes.get('WHEEZE_12MO', 0) 
        df_nhanes_std['Diagnosis'] = df_nhanes.get('ASTHMA', 0)
        
        # Standardize
        # Assuming 1=Yes, 2=No for NHANES derived data
        df_nhanes_std['Wheezing'] = df_nhanes_std['Wheezing'].apply(lambda x: 1 if x == 1 else 0)
        df_nhanes_std['Diagnosis'] = df_nhanes_std['Diagnosis'].apply(lambda x: 1 if x == 1 else 0)
        df_nhanes_std['Gender'] = df_nhanes_std['Gender'].apply(lambda x: 0 if x == 1 else 1) # 1->0(M), 2->1(F)

    # --- Concatenate ---
    # NOTE: Excluded df_2011_std because it lacks 'Wheezing' column, causing massive data noise.
    master_df = pd.concat([df_old_std, df_disease_std, df_nhanes_std], ignore_index=True)
    
    print(f"\nMerged Shape: {master_df.shape}")
    
    # Cleaning
    # Drop rows where Diagnosis is NaN
    master_df = master_df.dropna(subset=['Diagnosis'])
    
    # Fill NaN features
    master_df['Age'] = master_df['Age'].fillna(master_df['Age'].median())
    master_df['BMI'] = master_df['BMI'].fillna(master_df['BMI'].median())
    master_df['Gender'] = master_df['Gender'].fillna(0) # Default Male
    master_df['Smoking'] = master_df['Smoking'].fillna(0) # Default Non-smoker
    master_df['Wheezing'] = master_df['Wheezing'].fillna(0) # Default No
    
    # Ensure numeric
    cols = ['Age', 'Gender', 'BMI', 'Smoking', 'Wheezing', 'Diagnosis']
    for col in cols:
        master_df[col] = pd.to_numeric(master_df[col], errors='coerce').fillna(0)
        
    print(f"Final Cleaned Shape: {master_df.shape}")
    print(master_df.head())
    print(master_df['Diagnosis'].value_counts())
    
    return master_df

if __name__ == "__main__":
    d1, d2, d3, d4 = load_datasets()
    master = standardize_and_merge(d1, d2, d3, d4)
    master.to_csv(OUTPUT_PATH, index=False)
    print(f"\nSaved Master Dataset to: {OUTPUT_PATH}")

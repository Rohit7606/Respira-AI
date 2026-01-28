import { z } from "zod"

export const patientIntakeSchema = z.object({
    patient_id: z.string().optional(),
    patient_name: z.string().min(1, "Patient name is required"),
    age: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().min(0, "Age must be at least 0").max(120, "Age must be at most 120")
    ),
    fev1: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().min(0.5, "FEV1 must be at least 0.5 L").max(8.0, "FEV1 must be at most 8.0 L")
    ),
    pef: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().min(50, "PEF must be at least 50 L/min").max(700, "PEF must be at most 700 L/min")
    ),
    spo2: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().min(70, "SpO2 must be at least 70%").max(100, "SpO2 must be at most 100%")
    ),
    zip_code: z
        .string()
        .regex(/^\d{6}$/, "Zip code must be exactly 6 digits")
        .min(6)
        .max(6),
    gender: z.enum(["Male", "Female"]),
    smoking: z.enum(["Non-smoker", "Ex-smoker", "Current Smoker"]),
    wheezing: z.boolean().default(false),
    shortness_of_breath: z.boolean().default(false),
    height: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().min(50, "Height must be valid (cm)").max(300).optional()
    ),
    weight: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().min(10, "Weight must be valid (kg)").max(500).optional()
    ),
    medication_use: z.boolean().default(false),
})

export type PatientIntakeValues = z.infer<typeof patientIntakeSchema>


import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
import { useQueryState, parseAsInteger, parseAsFloat, parseAsString } from "nuqs"

import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { patientIntakeSchema, PatientIntakeValues } from "@/lib/schemas"
import { usePredictRiskPredictPost } from "@/lib/api/generated"

import { PredictionResponse } from "@/lib/api/generated"
import { cn } from "@/lib/utils"

interface PatientIntakeFormProps {
    onPredictionSuccess?: (result: PredictionResponse) => void;
    // New prop for Phase 10 to pass feature data
    onPredictionSuccessWithData?: (result: PredictionResponse, features: any) => void;
}

export function PatientIntakeForm({ onPredictionSuccess, onPredictionSuccessWithData }: PatientIntakeFormProps) {
    // URL State Management
    const [age, setAge] = useQueryState("age", parseAsInteger)
    const [name, setName] = useQueryState("name", parseAsString) // Added name query state
    const [zip, setZip] = useQueryState("zip", parseAsString)
    const [fev1, setFev1] = useQueryState("fev1", parseAsFloat)
    const [pef, setPef] = useQueryState("pef", parseAsFloat)
    const [spo2, setSpo2] = useQueryState("spo2", parseAsInteger) // Changed to parseAsInteger as per schema

    const [isPopoverOpen, setIsPopoverOpen] = useState(false) // Added state for popover

    const form = useForm<PatientIntakeValues>({
        resolver: zodResolver(patientIntakeSchema) as any, // Temporary bypass for strict type check
        defaultValues: {
            patient_id: undefined,
            age: age ?? undefined,
            patient_name: name ?? "", // Added patient_name to default values
            fev1: fev1 ?? undefined,
            pef: pef ?? undefined,
            spo2: spo2 ?? undefined,
            zip_code: zip ?? "",
            gender: undefined,
            smoking: undefined,
            wheezing: false,
            shortness_of_breath: false,
            height: undefined,
            weight: undefined,
            medication_use: false,
        },
    })

    // Sync form changes to URL with debounce to prevent focus loss
    useEffect(() => {
        const subscription = form.watch((value) => {
            const timer = setTimeout(() => {
                setAge(value.age ?? null)
                setName(value.patient_name || null)
                setZip(value.zip_code || null)
                setFev1(value.fev1 ?? null)
                setPef(value.pef ?? null)
                setSpo2(value.spo2 ?? null)
            }, 500) // 500ms debounce
            return () => clearTimeout(timer)
        })
        return () => subscription.unsubscribe()
    }, [form.watch, setAge, setName, setZip, setFev1, setPef, setSpo2])

    const { mutate, isPending } = usePredictRiskPredictPost()

    function onSubmit(data: PatientIntakeValues) {
        mutate(
            { data },
            {
                onSuccess: (response) => {
                    console.log("Prediction Result:", response.data)
                    toast.success("Prediction Complete", {
                        description: `Risk Score: ${(response.data.prediction.risk_score * 100).toFixed(0)}%`,
                    })
                    if (onPredictionSuccess) onPredictionSuccess(response.data)

                    if (onPredictionSuccessWithData) {
                        onPredictionSuccessWithData(response.data, { ...data });
                    }
                },
                onError: (error: any) => {
                    console.error("Prediction Error:", error)
                    toast.error("Prediction Failed", {
                        description: "Unable to calculate risk. Please check your inputs.",
                    })
                },
            }
        )
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            form.handleSubmit(onSubmit, onInvalid)()
        }
    }

    function onInvalid(errors: any) {
        console.error("Form Validation Errors:", errors)
        toast.error("Validation Failed", {
            description: "Please correct the highlighted errors in the form.",
        })
    }

    const handleClear = () => {
        form.reset({
            patient_name: "",
            age: undefined,
            zip_code: "",
            fev1: undefined,
            pef: undefined,
            spo2: undefined,
            gender: undefined,
            smoking: undefined,
            wheezing: false,
            shortness_of_breath: false,
            height: undefined,
            weight: undefined,
            medication_use: false,
        })
        setName(null)
        setAge(null)
        setZip(null)
        setFev1(null)
        setPef(null)
        setSpo2(null)
        setIsPopoverOpen(false)
        toast.info("Form cleared")
    }

    const [isReturning, setIsReturning] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Debounced search for patients
    useEffect(() => {
        if (!searchTerm || !isReturning) {
            setSearchResults([])
            return
        }

        const timeout = setTimeout(async () => {
            setIsSearching(true)
            try {
                // In a real app config, use the proper API URL. 
                // Assuming proxy or localhost for now based on context.
                const res = await fetch(`http://localhost:8000/patients?query=${encodeURIComponent(searchTerm)}`)
                if (res.ok) {
                    const data = await res.json()
                    setSearchResults(data)
                }
            } catch (error) {
                console.error("Search failed", error)
            } finally {
                setIsSearching(false)
            }
        }, 300)
        return () => clearTimeout(timeout)
    }, [searchTerm, isReturning])

    const selectPatient = (patient: any) => {
        form.setValue("patient_name", patient.patient_name)
        form.setValue("patient_id", patient.patient_id)
        form.setValue("age", patient.age)
        form.setValue("zip_code", patient.zip_code)

        // Auto-load other fields
        if (patient.gender) form.setValue("gender", patient.gender)
        // if (patient.smoking) form.setValue("smoking", patient.smoking) // User requested to disable this
        if (patient.height) form.setValue("height", patient.height)
        if (patient.weight) form.setValue("weight", patient.weight)

        // Update URL state too
        setName(patient.patient_name)
        setAge(patient.age)
        setZip(patient.zip_code)

        setSearchResults([])
        setSearchTerm("")
        toast.success("Patient details loaded")
    }

    return (
        <Card variant="glass" className="w-full border-teal-200/50 shadow-xl backdrop-blur-xl bg-white/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-teal-100/30">
                <div className="space-y-1">
                    <CardTitle className="text-xl md:text-2xl text-teal-900">Patient Intake</CardTitle>
                    <CardDescription className="text-teal-800/70 font-medium">
                        {isReturning ? "Search existing patient record." : "Enter new patient details."}
                    </CardDescription>
                </div>
                <div className="flex items-center space-x-2 bg-white/30 p-1 rounded-lg border border-teal-100/50 backdrop-blur-md">
                    <Button
                        variant={!isReturning ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => { setIsReturning(false); form.setValue("patient_id", undefined); }}
                        className={cn("transition-all duration-300", !isReturning ? "bg-teal-600 text-white shadow-md hover:bg-teal-700" : "text-teal-600 hover:text-teal-800 hover:bg-teal-50/80")}
                    >
                        New
                    </Button>
                    <Button
                        variant={isReturning ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setIsReturning(true)}
                        className={cn("transition-all duration-300", isReturning ? "bg-teal-600 text-white shadow-md hover:bg-teal-700" : "text-teal-600 hover:text-teal-800 hover:bg-teal-50/80")}
                    >
                        Returning
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                        onKeyDown={handleKeyDown}
                        className="space-y-6"
                    >
                        {isReturning && (
                            <div className="relative mb-6 animate-in slide-in-from-top-2">
                                <FormLabel className="text-base text-teal-900 font-semibold">Search Patient</FormLabel>
                                <Input
                                    placeholder="Type name to search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="mt-1.5 border-teal-200/60 focus-visible:ring-teal-500 bg-white/60 backdrop-blur-sm"
                                />
                                {isSearching && <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-teal-500" />}

                                {searchResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white/90 backdrop-blur-md border border-teal-200/60 rounded-xl shadow-xl max-h-60 overflow-auto custom-scrollbar">
                                        {searchResults.map(p => (
                                            <div
                                                key={p.patient_id}
                                                className="p-3 hover:bg-teal-50/80 cursor-pointer border-b border-teal-50/50 last:border-0 flex justify-between items-center transition-colors"
                                                onClick={() => selectPatient(p)}
                                            >
                                                <div>
                                                    <p className="font-medium text-teal-900">{p.patient_name}</p>
                                                    <p className="text-xs text-muted-foreground">ID: {p.patient_id.slice(0, 8)}...</p>
                                                </div>
                                                <div className="text-right text-xs text-muted-foreground">
                                                    <p>Age: {p.age}</p>
                                                    <p>{p.zip_code}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField
                                control={form.control}
                                name="patient_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base text-teal-900 font-medium">Patient Name <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="John Doe"
                                                className="border-teal-200/60 focus-visible:ring-teal-500 placeholder:text-teal-900/40 bg-white/60 backdrop-blur-sm shadow-sm transition-all hover:bg-white/80 focus:bg-white"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="age"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base text-teal-900 font-medium">Age <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 65"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                className="border-teal-200/60 focus-visible:ring-teal-500 placeholder:text-teal-900/40 bg-white/60 backdrop-blur-sm shadow-sm transition-all hover:bg-white/80 focus:bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />


                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base text-teal-900 font-medium">Gender <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger className="w-full border-teal-200/60 focus:ring-teal-500 bg-white/60 backdrop-blur-sm text-teal-900 shadow-sm transition-all hover:bg-white/80 focus:bg-white [&[data-placeholder]]:text-teal-900/40">
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white/90 border-teal-200/60 backdrop-blur-xl z-[100]">
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="smoking"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base text-teal-900 font-medium">Smoking Status <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger className="w-full border-teal-200/60 focus:ring-teal-500 bg-white/60 backdrop-blur-sm text-teal-900 shadow-sm transition-all hover:bg-white/80 focus:bg-white [&[data-placeholder]]:text-teal-900/40">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white/90 border-teal-200/60 backdrop-blur-xl z-[100]">
                                                <SelectItem value="Non-smoker">Non-smoker</SelectItem>
                                                <SelectItem value="Ex-smoker">Ex-smoker</SelectItem>
                                                <SelectItem value="Current Smoker">Current Smoker</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="height"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base text-teal-900 font-medium">Height (cm)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 175"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                className="border-teal-200/60 focus-visible:ring-teal-500 placeholder:text-teal-900/40 bg-white/60 backdrop-blur-sm shadow-sm transition-all hover:bg-white/80 focus:bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="weight"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base text-teal-900 font-medium">Weight (kg)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 70"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                className="border-teal-200/60 focus-visible:ring-teal-500 placeholder:text-teal-900/40 bg-white/60 backdrop-blur-sm shadow-sm transition-all hover:bg-white/80 focus:bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="zip_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base text-teal-900 font-medium">Zip Code <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. 110001"
                                                maxLength={6}
                                                {...field}
                                                value={field.value || ""}
                                                className="border-teal-200/60 focus-visible:ring-teal-500 placeholder:text-teal-900/40 bg-white/60 backdrop-blur-sm shadow-sm transition-all hover:bg-white/80 focus:bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fev1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base text-teal-900 font-medium">FEV1 (L) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="e.g. 2.5"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    className="border-teal-200/60 focus-visible:ring-teal-500 pr-10 placeholder:text-teal-900/40 bg-white/60 backdrop-blur-sm shadow-sm transition-all hover:bg-white/80 focus:bg-white"
                                                />

                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-teal-600/70 text-sm font-semibold">
                                                    L
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pef"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base text-teal-900 font-medium">PEF (L/min) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 350"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    className="border-teal-200/60 focus-visible:ring-teal-500 pr-14 placeholder:text-teal-900/40 bg-white/60 backdrop-blur-sm shadow-sm transition-all hover:bg-white/80 focus:bg-white"
                                                />
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-teal-600/70 text-sm font-semibold">
                                                    L/min
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="spo2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base text-teal-900 font-medium">SpO2 (%) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 98"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    className="border-teal-200/60 focus-visible:ring-teal-500 pr-10 placeholder:text-teal-900/40 bg-white/60 backdrop-blur-sm shadow-sm transition-all hover:bg-white/80 focus:bg-white"
                                                />
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-teal-600/70 text-sm font-semibold">
                                                    %
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="wheezing"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 shadow-sm border-teal-200/50 bg-white/40 hover:bg-white/60 transition-colors backdrop-blur-sm">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="border-teal-500 text-teal-600 focus:ring-teal-500 data-[state=checked]:bg-teal-600 data-[state=checked]:text-white"
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-base text-teal-900 font-semibold cursor-pointer">
                                                    Wheezing / Whistling
                                                </FormLabel>
                                                <FormDescription className="text-sm text-teal-700/70">
                                                    whistling sound when breathing?
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="shortness_of_breath"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 shadow-sm border-teal-200/50 bg-white/40 hover:bg-white/60 transition-colors backdrop-blur-sm">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="border-teal-500 text-teal-600 focus:ring-teal-500 data-[state=checked]:bg-teal-600 data-[state=checked]:text-white"
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-base text-teal-900 font-semibold cursor-pointer">
                                                    Shortness of Breath
                                                </FormLabel>
                                                <FormDescription className="text-sm text-teal-700/70">
                                                    Trouble breathing or feeling winded?
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="medication_use"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 shadow-sm border-teal-200/50 bg-white/40 hover:bg-white/60 transition-colors backdrop-blur-sm">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="border-teal-500 text-teal-600 focus:ring-teal-500 data-[state=checked]:bg-teal-600 data-[state=checked]:text-white"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-base text-teal-900 font-semibold cursor-pointer">
                                                Currently taking medication?
                                            </FormLabel>
                                            <FormDescription className="text-sm text-teal-700/70">
                                                Select if you are using inhalers (e.g., Budesonide) or other asthma meds.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-1/3 py-6 bg-white/40 border-red-200/60 shadow-lg shadow-red-500/5 hover:bg-red-50/90 hover:border-red-300 hover:shadow-red-500/20 text-red-700/90 hover:text-red-800 transition-all hover:scale-[1.01] font-semibold text-lg backdrop-blur-md"
                                    >
                                        <Trash2 className="mr-2 h-5 w-5 opacity-80" />
                                        Clear
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 border-none shadow-xl bg-white/95 backdrop-blur-xl p-0 overflow-hidden ring-1 ring-black/5">
                                    <div className="bg-red-50/80 p-4 border-b border-red-100 flex items-center gap-3">
                                        <div className="bg-red-100 p-2 rounded-full">
                                            <Trash2 className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-red-900">Clear Form?</h4>
                                            <p className="text-xs text-red-700">This action cannot be undone.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <p className="text-sm text-gray-600">
                                            Are you sure you want to remove all entered patient data?
                                        </p>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setIsPopoverOpen(false)}>Cancel</Button>
                                            <Button variant="destructive" size="sm" onClick={handleClear} className="bg-red-600 hover:bg-red-700 shadow-sm">
                                                Yes, Clear Data
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button type="submit" className="flex-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-500/30 transition-all hover:scale-[1.01] font-semibold text-lg py-6" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                {isPending ? "Analyzing..." : "Generate Prediction"}
                            </Button>
                        </div>
                        <p className="text-xs text-teal-800/50 text-center font-medium">
                            Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-teal-200 bg-white/50 px-1.5 font-mono text-[10px] text-teal-900 opacity-100"><span className="text-xs">⌘</span>Enter</kbd> to submit
                        </p>
                    </form>
                </Form>
            </CardContent>
        </Card >
    )
}

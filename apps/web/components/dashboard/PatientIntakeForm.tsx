
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
        <Card className="w-full border-teal-200 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                    <CardTitle className="text-xl md:text-2xl text-teal-900">Patient Intake</CardTitle>
                    <CardDescription className="text-teal-700/80">
                        {isReturning ? "Search existing patient record." : "Enter new patient details."}
                    </CardDescription>
                </div>
                <div className="flex items-center space-x-2 bg-teal-50 p-1 rounded-lg border border-teal-100">
                    <Button
                        variant={!isReturning ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => { setIsReturning(false); form.setValue("patient_id", undefined); }}
                        className={cn(!isReturning && "bg-white text-teal-900 shadow-sm")}
                    >
                        New
                    </Button>
                    <Button
                        variant={isReturning ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setIsReturning(true)}
                        className={cn(isReturning && "bg-white text-teal-900 shadow-sm")}
                    >
                        Returning
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                        onKeyDown={handleKeyDown}
                        className="space-y-6"
                    >
                        {isReturning && (
                            <div className="relative mb-6 animate-in slide-in-from-top-2">
                                <FormLabel className="text-base text-teal-900">Search Patient</FormLabel>
                                <Input
                                    placeholder="Type name to search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="mt-1.5 border-teal-200 focus-visible:ring-teal-500"
                                />
                                {isSearching && <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-teal-500" />}

                                {searchResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-teal-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {searchResults.map(p => (
                                            <div
                                                key={p.patient_id}
                                                className="p-3 hover:bg-teal-50 cursor-pointer border-b border-teal-50 last:border-0 flex justify-between items-center"
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="patient_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base text-teal-900">Patient Name <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="John Doe"
                                                className="border-teal-200 focus-visible:ring-teal-500 placeholder:text-gray-400 bg-white"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    // Immediately sync name as string doesn't have parse issues
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
                                        <FormLabel className="text-base text-teal-900">Age <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 65"
                                                {...field}
                                                // Value falls back to empty string
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                className="border-teal-200 focus-visible:ring-teal-500 placeholder:text-gray-400 bg-white"
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
                                        <FormLabel className="text-base text-teal-900">Gender <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger className="w-full border-teal-200 focus:ring-teal-500 bg-white text-black [&[data-placeholder]]:text-gray-400">
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-teal-200 z-[100]">
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
                                        <FormLabel className="text-base text-teal-900">Smoking Status <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger className="w-full border-teal-200 focus:ring-teal-500 bg-white text-black [&[data-placeholder]]:text-gray-400">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white border-teal-200 z-[100]">
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
                                        <FormLabel className="text-base text-teal-900">Height (cm)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 175"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                className="border-teal-200 focus-visible:ring-teal-500 placeholder:text-gray-400 bg-white"
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
                                        <FormLabel className="text-base text-teal-900">Weight (kg)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 70"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                className="border-teal-200 focus-visible:ring-teal-500 placeholder:text-gray-400 bg-white"
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
                                        <FormLabel className="text-base text-teal-900">Zip Code <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. 110001"
                                                maxLength={6}
                                                {...field}
                                                value={field.value || ""}
                                                className="border-teal-200 focus-visible:ring-teal-500 placeholder:text-gray-400 bg-white"
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
                                        <FormLabel className="text-base text-teal-900">FEV1 (L) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="e.g. 2.5"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    className="border-teal-200 focus-visible:ring-teal-500 pr-10 placeholder:text-gray-400 bg-white"
                                                />

                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-teal-600/50 text-sm">
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
                                        <FormLabel className="text-base text-teal-900">PEF (L/min) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 350"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    className="border-teal-200 focus-visible:ring-teal-500 pr-14 placeholder:text-gray-400 bg-white"
                                                />
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-teal-600/50 text-sm">
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
                                        <FormLabel className="text-base text-teal-900">SpO2 (%) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 98"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    className="border-teal-200 focus-visible:ring-teal-500 pr-10 placeholder:text-gray-400 bg-white"
                                                />
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-teal-600/50 text-sm">
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
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm border-teal-100 bg-teal-50/50">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="border-teal-500 text-teal-600 focus:ring-teal-500 data-[state=checked]:bg-teal-600 data-[state=checked]:text-white"
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-base text-teal-900">
                                                    Wheezing / Whistling
                                                </FormLabel>
                                                <FormDescription className="text-sm text-teal-600/80">
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
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm border-teal-100 bg-teal-50/50">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="border-teal-500 text-teal-600 focus:ring-teal-500 data-[state=checked]:bg-teal-600 data-[state=checked]:text-white"
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-base text-teal-900">
                                                    Shortness of Breath
                                                </FormLabel>
                                                <FormDescription className="text-sm text-teal-600/80">
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
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm border-teal-100 bg-teal-50/50">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="border-teal-500 text-teal-600 focus:ring-teal-500 data-[state=checked]:bg-teal-600 data-[state=checked]:text-white"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-base text-teal-900">
                                                Currently taking medication?
                                            </FormLabel>
                                            <FormDescription className="text-sm text-teal-600/80">
                                                Select if you are using inhalers (e.g., Budesonide) or other asthma meds.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex gap-4">
                            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="outline" className="w-1/3 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-900 transition-colors">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Clear
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 border-none shadow-xl bg-white p-0 overflow-hidden ring-1 ring-black/5">
                                    <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
                                        <div className="bg-red-100 p-2 rounded-full">
                                            <Trash2 className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-red-900">Clear Form?</h4>
                                            <p className="text-xs text-red-700">This action cannot be undone.</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white space-y-4">
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
                            <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all hover:scale-[1.01]" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isPending ? "Analyzing..." : "Generate Prediction"}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"><span className="text-xs">⌘</span>Enter</kbd> to submit
                        </p>
                    </form>
                </Form>
            </CardContent>
        </Card >
    )
}

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wind, Thermometer, Droplets, CloudFog } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface EnvironmentalData {
    aqi: number
    pm25: number
    temperature: number
    humidity: number
    source: string
}

interface Props {
    data?: EnvironmentalData
    isLoading?: boolean
}

export function EnvironmentalContextCard({ data, isLoading }: Props) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (!data) return null

    // AQI Helper (OWM Scale: 1-5)
    const getAQIColor = (aqi: number) => {
        if (aqi <= 1) return "bg-emerald-500" // Good
        if (aqi === 2) return "bg-green-500"  // Fair
        if (aqi === 3) return "bg-yellow-500" // Moderate
        if (aqi === 4) return "bg-orange-500" // Poor
        if (aqi >= 5) return "bg-red-500"     // Very Poor
        return "bg-slate-500"
    }

    const getAQILabel = (aqi: number) => {
        if (aqi <= 1) return "Good"
        if (aqi === 2) return "Fair"
        if (aqi === 3) return "Moderate"
        if (aqi === 4) return "Poor"
        if (aqi >= 5) return "Very Poor"
        return "Unknown"
    }

    return (
        <Card className={cn("relative overflow-hidden", data.source === 'fallback' && "border-yellow-200 bg-yellow-50/50")}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CloudFog className="h-4 w-4" />
                        Environmental Context
                    </CardTitle>
                    {data.source === 'fallback' && (
                        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200">
                            Estimated
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-4">
                    <div className={cn("h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl ring-4 ring-offset-2", getAQIColor(data.aqi))}>
                        {/* Map 1-5 index to a representative AQI value for clearer UX */}
                        {data.aqi === 1 ? "25" :
                            data.aqi === 2 ? "75" :
                                data.aqi === 3 ? "125" :
                                    data.aqi === 4 ? "175" :
                                        "250+"}
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{getAQILabel(data.aqi)}</div>
                        <div className="text-sm text-muted-foreground">AQI Level (Est.)</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-100 p-2 rounded-lg">
                        <div className="flex justify-center mb-1 text-slate-500"><Wind className="h-4 w-4" /></div>
                        <div className="font-semibold">{data.pm25}</div>
                        <div className="text-[10px] text-muted-foreground">PM2.5</div>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg">
                        <div className="flex justify-center mb-1 text-slate-500"><Thermometer className="h-4 w-4" /></div>
                        <div className="font-semibold">{Math.round(data.temperature)}°</div>
                        <div className="text-[10px] text-muted-foreground">Temp</div>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg">
                        <div className="flex justify-center mb-1 text-slate-500"><Droplets className="h-4 w-4" /></div>
                        <div className="font-semibold">{data.humidity}%</div>
                        <div className="text-[10px] text-muted-foreground">Humidity</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

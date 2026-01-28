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

    // Calculate Real AQI from PM2.5 (Standard US EPA Algo) through linear interpolation
    const calculateRealAQI = (pm25: number) => {
        const c = Math.round(pm25 * 10) / 10
        if (c < 0) return 0
        if (c <= 12.0) return Math.round(((50 - 0) / (12.0 - 0)) * (c - 0) + 0)
        if (c <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (c - 12.1) + 51)
        if (c <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (c - 35.5) + 101)
        if (c <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (c - 55.5) + 151)
        if (c <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (c - 150.5) + 201)
        if (c <= 350.4) return Math.round(((400 - 301) / (350.4 - 250.5)) * (c - 250.5) + 301)
        if (c <= 500.4) return Math.round(((500 - 401) / (500.4 - 350.5)) * (c - 350.5) + 401)
        return 500
    }

    const realAQI = calculateRealAQI(data.pm25)

    // Updated colors based on Real AQI (0-500 scale)
    const getAQIColor = (aqi: number) => {
        if (aqi <= 50) return "bg-emerald-500 ring-emerald-200"
        if (aqi <= 100) return "bg-yellow-500 ring-yellow-200"
        if (aqi <= 150) return "bg-orange-500 ring-orange-200"
        if (aqi <= 200) return "bg-red-500 ring-red-200"
        if (aqi <= 300) return "bg-purple-500 ring-purple-200"
        return "bg-rose-900 ring-rose-200"
    }

    const getAQILabel = (aqi: number) => {
        if (aqi <= 50) return "Good"
        if (aqi <= 100) return "Moderate"
        if (aqi <= 150) return "Unhealthy (Sens.)"
        if (aqi <= 200) return "Unhealthy"
        if (aqi <= 300) return "Very Unhealthy"
        return "Hazardous"
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
                    <div className={cn("h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl ring-4 ring-offset-2 transition-all", getAQIColor(realAQI))}>
                        {realAQI}
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{getAQILabel(realAQI)}</div>
                        <div className="text-sm text-muted-foreground">AQI Level (Real-time)</div>
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

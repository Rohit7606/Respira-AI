import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export function EnvironmentalFallback() {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Environmental data unavailable.</p>
                <p className="text-xs">Using regional averages for risk calculation.</p>
            </CardContent>
        </Card>
    )
}

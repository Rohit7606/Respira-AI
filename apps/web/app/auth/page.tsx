"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ShieldCheck, Mail, Lock, ArrowRight, CheckCircle2, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export default function AuthPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [focusedInput, setFocusedInput] = useState<string | null>(null)

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Artificial delay for smoothness feel
            await new Promise(resolve => setTimeout(resolve, 1000))

            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                toast.success("Welcome back!", {
                    description: "Accessing secure clinical dashboard...",
                    icon: <CheckCircle2 className="h-4 w-4 text-primary" />
                })
                router.push("/dashboard")
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                toast.success("Account created successfully!", {
                    description: "Please sign in with your new credentials.",
                    icon: <CheckCircle2 className="h-4 w-4 text-primary" />
                })
                setIsLogin(true)
            }
        } catch (error: any) {
            toast.error("Authentication failed", {
                description: error.message || "Please check your credentials.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
            {/* Dynamic Mesh Gradient Background */}
            <div className="absolute inset-0 mesh-gradient-light opacity-60 dark:opacity-20" />

            {/* Animated Particles/Orbs */}
            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
            />
            <motion.div
                animate={{
                    x: [0, -40, 0],
                    y: [0, -60, 0],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-[120px]"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                className="w-full max-w-[440px] p-6 relative z-10"
            >
                {/* Main Glass Card */}
                <Card variant="glass" className="overflow-hidden border-white/40 dark:border-white/10 p-0">
                    <div className="p-8 pt-10 relative">
                        {/* Header Section */}
                        <div className="flex flex-col items-center text-center space-y-4 mb-8">
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                className="h-20 w-20 bg-gradient-to-tr from-primary to-emerald-400 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-500/20 mb-2 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-[-150%] transition-transform duration-700 ease-in-out rotate-45" />
                                <Activity className="h-10 w-10 text-white" />
                            </motion.div>

                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    {isLogin ? "Welcome Back" : "Join Respira AI"}
                                </h1>
                                <p className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed">
                                    {isLogin
                                        ? "Secure access to predictive respiratory analytics."
                                        : "Next-generation clinical intelligence platform."}
                                </p>
                            </div>
                        </div>

                        {/* Form Section */}
                        <form onSubmit={handleAuth} className="space-y-6">
                            <div className="space-y-4">
                                <motion.div
                                    animate={focusedInput === 'email' ? { scale: 1.01 } : { scale: 1 }}
                                    className="relative group"
                                >
                                    <Label htmlFor="email" className="sr-only">Email</Label>
                                    <div className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="institutional@email.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedInput('email')}
                                        onBlur={() => setFocusedInput(null)}
                                        className="pl-12 h-12 bg-white/50 border-gray-200 focus:border-primary focus:ring-primary/20 rounded-2xl transition-all placeholder:text-muted-foreground/60"
                                    />
                                </motion.div>

                                <motion.div
                                    animate={focusedInput === 'password' ? { scale: 1.01 } : { scale: 1 }}
                                    className="relative group"
                                >
                                    <Label htmlFor="password" className="sr-only">Password</Label>
                                    <div className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedInput('password')}
                                        onBlur={() => setFocusedInput(null)}
                                        className="pl-12 h-12 bg-white/50 border-gray-200 focus:border-primary focus:ring-primary/20 rounded-2xl transition-all placeholder:text-muted-foreground/60"
                                    />
                                </motion.div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(13, 148, 136, 0.4)" }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className={cn(
                                    "w-full h-12 bg-primary text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 relative overflow-hidden",
                                    isLoading && "opacity-90 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <span className="relative z-10">{isLogin ? "Secure Sign In" : "Create Account"}</span>
                                        <ArrowRight className="h-4 w-4 relative z-10" />
                                        <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-8 text-center bg-gray-50/50 -mx-8 -mb-10 py-4 border-t border-gray-100">
                            <button
                                type="button"
                                className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors"
                                onClick={() => setIsLogin(!isLogin)}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={isLogin ? "signup" : "signin"}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                    >
                                        {isLogin
                                            ? "New to Respira? Create clinical ID"
                                            : "Already verified? Sign in here"}
                                    </motion.span>
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>
                </Card>

                <div className="mt-6 flex justify-center gap-6 text-xs text-muted-foreground/60 font-medium tracking-wide">
                    <span>HIPAA Compliant</span>
                    <span>•</span>
                    <span>End-to-End Encrypted</span>
                </div>
            </motion.div>
        </div>
    )
}

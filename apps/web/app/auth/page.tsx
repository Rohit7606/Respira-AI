"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ShieldCheck, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
            // Artificial delay for smoothness feel if response is too fast
            await new Promise(resolve => setTimeout(resolve, 800))

            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                toast.success("Welcome back!", {
                    description: "Accessing secure clinical dashboard...",
                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
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
                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
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
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/20 blur-[100px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-200/20 blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md p-6 relative z-10"
            >
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                    <div className="p-8">
                        <div className="flex flex-col items-center text-center space-y-2 mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                className="h-16 w-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 mb-4"
                            >
                                <ShieldCheck className="h-8 w-8 text-white" />
                            </motion.div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                                {isLogin ? "Welcome Back" : "Start Journey"}
                            </h1>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                {isLogin
                                    ? "Securely access your patient data and AI predictions."
                                    : "Join the future of respiratory care with AI assistance."}
                            </p>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-5">
                            <div className="space-y-4">
                                <motion.div
                                    animate={focusedInput === 'email' ? { scale: 1.02 } : { scale: 1 }}
                                    className="relative group"
                                >
                                    <Label htmlFor="email" className="sr-only">Email</Label>
                                    <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@hospital.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedInput('email')}
                                        onBlur={() => setFocusedInput(null)}
                                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 transition-all rounded-xl placeholder:text-slate-400"
                                    />
                                </motion.div>

                                <motion.div
                                    animate={focusedInput === 'password' ? { scale: 1.02 } : { scale: 1 }}
                                    className="relative group"
                                >
                                    <Label htmlFor="password" className="sr-only">Password</Label>
                                    <div className="absolute left-3 top-3 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Your password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedInput('password')}
                                        onBlur={() => setFocusedInput(null)}
                                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 transition-all rounded-xl placeholder:text-slate-400"
                                    />
                                </motion.div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className={cn(
                                    "w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2",
                                    isLoading && "opacity-80 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? "Sign In" : "Create Account"}
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-8 text-center">
                            <button
                                type="button"
                                className="text-sm text-slate-500 hover:text-teal-600 font-medium transition-colors"
                                onClick={() => setIsLogin(!isLogin)}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={isLogin ? "signup" : "signin"}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        {isLogin
                                            ? "New here? Create an account"
                                            : "Already have an account? Sign in"}
                                    </motion.span>
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>
                    {/* Decorative bottom bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500" />
                </div>

                <div className="mt-6 text-center text-xs text-slate-400">
                    &copy; 2026 Respira AI. Secure Clinical Environment.
                </div>
            </motion.div>
        </div>
    )
}

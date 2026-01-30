"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Stethoscope, Bot, User, Sparkles, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { explainRisk } from "@/lib/api/generated"
import { cn } from "@/lib/utils"

export interface Message {
    id: string
    role: "user" | "assistant"
    text: string
}

interface ExplainerChatProps {
    isOpen: boolean
    onClose: () => void
    currentPrediction: {
        features: any
        risk_score: number
    } | null
    messages: Message[]
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}

// Enhanced Markdown Parser
const MarkdownText = ({ text }: { text: string }) => {
    const lines = text.split('\n')

    return (
        <div className="space-y-1.5 text-sm leading-relaxed text-slate-800">
            {lines.map((line, i) => {
                const trimmed = line.trim()
                if (!trimmed) return <div key={i} className="h-1.5" />

                // Headers
                if (trimmed.startsWith('### ')) {
                    return (
                        <h4 key={i} className="font-bold text-teal-900 text-[15px] mt-3 mb-1.5 flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-teal-500" />
                            {trimmed.replace('### ', '')}
                        </h4>
                    )
                }

                // Bullet points
                if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                    const content = trimmed.replace(/^[•-]\s*/, '')
                    return (
                        <div key={i} className="flex gap-2.5 items-start pl-1 group">
                            <span className="text-teal-400 mt-[7px] text-[10px] group-hover:text-teal-600 transition-colors">●</span>
                            <span className="text-slate-700" dangerouslySetInnerHTML={{
                                __html: content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
                            }} />
                        </div>
                    )
                }

                // Standard paragraph
                return (
                    <p key={i} className="text-slate-600" dangerouslySetInnerHTML={{
                        __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
                    }} />
                )
            })}
        </div>
    )
}

export function ExplainerChat({ isOpen, onClose, currentPrediction, messages, setMessages }: ExplainerChatProps) {
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen, isLoading])

    const [promptChips, setPromptChips] = useState<string[]>(["Why is the risk high?", "Treatment Plan", "Show Clinical Guidelines", "Lifestyle Advice"])

    const handleSend = async (manualInput?: string) => {
        const textToSend = manualInput || input
        if (!textToSend.trim() || !currentPrediction) return

        const userMsg: Message = { id: Date.now().toString(), role: "user", text: textToSend }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsLoading(true)

        try {
            // Optimistic Update (no delay needed for real AI)

            const response = await explainRisk({
                query: userMsg.text,
                features: currentPrediction.features,
                risk_score: currentPrediction.risk_score
            })

            let fullText = response.data.text || ""

            // Extract Suggested Questions
            const suggestionMarker = "SUGGESTED_QUESTIONS"
            if (fullText.includes(suggestionMarker)) {
                const parts = fullText.split(suggestionMarker)
                const mainText = (parts[0] || "").replace(/---\s*$/, '').trim()
                const suggestionBlock = parts[1] || ""

                // Parse lines starting with - or •
                const newSuggestions = suggestionBlock
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.startsWith('-') || line.startsWith('•'))
                    .map(line => line.substring(1).trim())
                    .slice(0, 4) // Limit to 4

                if (newSuggestions.length > 0) {
                    setPromptChips(newSuggestions)
                }

                fullText = mainText
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                text: fullText
            }
            setMessages(prev => [...prev, botMsg])
        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                text: "### Connection Error\n\nI couldn't reach the clinical engine. Please ensure the backend is running."
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 lg:hidden"
                    />

                    {/* Chat Drawer */}
                    <motion.div
                        initial={{ x: "100%", opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 32, stiffness: 350, mass: 0.8 }}
                        className="fixed right-2 bottom-2 top-2 w-full sm:w-[500px] z-50 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 flex flex-col overflow-hidden"
                        style={{ boxShadow: "0 0 50px -12px rgba(0, 0, 0, 0.15)" }}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/40">
                            <div className="flex items-center gap-3.5">
                                <div className="h-11 w-11 bg-gradient-to-tr from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 ring-4 ring-white/50">
                                    <Activity className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                        Dr. AI
                                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-extrabold uppercase tracking-wider">Beta</span>
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500">Clinical Decision Support System</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-9 w-9 hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50 scroll-smooth">
                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    key={msg.id}
                                    className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                >
                                    {/* Avatar */}
                                    <div className={cn(
                                        "h-9 w-9 rounded-full flex items-center justify-center shrink-0 shadow-md ring-2 ring-white",
                                        msg.role === "assistant" ? "bg-white gradient-mask-t-b" : "bg-gradient-to-br from-teal-500 to-teal-700"
                                    )}>
                                        {msg.role === "assistant" ? <Sparkles className="h-4.5 w-4.5 text-teal-500" /> : <User className="h-4.5 w-4.5 text-white" />}
                                    </div>

                                    {/* Bubble */}
                                    <div className={cn(
                                        "p-4 rounded-2xl text-[15px] max-w-[88%] shadow-sm relative group",
                                        msg.role === "assistant"
                                            ? "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                                            : "bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-tr-none shadow-teal-500/20"
                                    )}>
                                        {msg.role === "assistant" ? (
                                            <MarkdownText text={msg.text} />
                                        ) : (
                                            <p className="leading-relaxed font-medium">{msg.text}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Loading State */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-4"
                                >
                                    <div className="h-9 w-9 rounded-full bg-white ring-2 ring-white flex items-center justify-center shrink-0 shadow-sm">
                                        <Sparkles className="h-4.5 w-4.5 text-teal-400 animate-pulse" />
                                    </div>
                                    <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex gap-2 items-center h-[52px]">
                                        <div className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce" />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Footer / Input */}
                        <div className="p-4 bg-white/60 backdrop-blur-md border-t border-white/50 space-y-4">
                            {/* Chips (Floating) */}
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mask-gradient-right">
                                {promptChips.map((chip, idx) => (
                                    <motion.button
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={chip}
                                        onClick={() => handleSend(chip)}
                                        disabled={isLoading}
                                        className="whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white hover:bg-teal-50 text-xs font-semibold text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-300 transition-all shadow-sm hover:shadow active:scale-95"
                                    >
                                        {chip}
                                    </motion.button>
                                ))}
                            </div>

                            <div className="relative flex items-center gap-2">
                                <Input
                                    placeholder="Type your query here..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    disabled={isLoading}
                                    className="pr-14 py-7 rounded-2xl border-slate-200/80 focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 bg-slate-50/50 shadow-inner font-medium text-slate-700 placeholder:text-slate-400 transition-all"
                                />
                                <Button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isLoading}
                                    size="icon"
                                    className={cn(
                                        "absolute right-2 h-10 w-10 rounded-xl transition-all duration-300",
                                        input.trim()
                                            ? "bg-gradient-to-r from-teal-500 to-teal-600 shadow-lg shadow-teal-500/25 hover:scale-105 active:scale-95"
                                            : "bg-slate-200 text-slate-400"
                                    )}
                                >
                                    <Send className="h-5 w-5 text-white" />
                                </Button>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] uppercase tracking-widest text-slate-300 font-semibold">
                                    AI Generated • Clinical Reference Only
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

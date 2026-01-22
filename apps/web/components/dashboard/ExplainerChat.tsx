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

// Simple Markdown Parser Component
const MarkdownText = ({ text }: { text: string }) => {
    // 1. Headers: ### Header
    // 2. Bold: **text**
    // 3. Bullets: • text
    const lines = text.split('\n')

    return (
        <div className="space-y-2 text-sm leading-relaxed">
            {lines.map((line, i) => {
                if (line.startsWith('### ')) {
                    return <h4 key={i} className="font-bold text-teal-800 text-base mt-2 mb-1">{line.replace('### ', '')}</h4>
                }
                if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                    // Handle Bold within bullets
                    const content = line.replace(/^[•-]\s*/, '')
                    return (
                        <div key={i} className="flex gap-2 items-start pl-1">
                            <span className="text-teal-500 mt-1.5">•</span>
                            <span dangerouslySetInnerHTML={{
                                __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }} />
                        </div>
                    )
                }
                // Standard paragraph with bold support
                if (line.trim() === "") return <div key={i} className="h-2" />

                return (
                    <p key={i} dangerouslySetInnerHTML={{
                        __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
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

    const handleSend = async (manualInput?: string) => {
        const textToSend = manualInput || input
        if (!textToSend.trim() || !currentPrediction) return

        const userMsg: Message = { id: Date.now().toString(), role: "user", text: textToSend }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsLoading(true)

        try {
            await new Promise(r => setTimeout(r, 600)) // UX delay

            const response = await explainRisk({
                query: userMsg.text,
                features: currentPrediction.features,
                risk_score: currentPrediction.risk_score
            })

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                text: response.data.text
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

    const promptChips = ["Why is the risk high?", "Treatment Plan", "Show Clinical Guidelines", "Lifestyle Advice"]

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden"
                    />

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] z-50 bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-white/20 flex flex-col"
                    >
                        {/* Glassy Header */}
                        <div className="p-4 border-b border-slate-100 bg-white/50 backdrop-blur-md flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                                    <Activity className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        Dr. AI
                                        <span className="px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-extrabold uppercase tracking-wider">Beta</span>
                                    </h3>
                                    <p className="text-xs text-slate-500">Clinical Decision Support</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                        msg.role === "assistant" ? "bg-white border border-slate-100" : "bg-teal-600"
                                    )}>
                                        {msg.role === "assistant" ? <Sparkles className="h-4 w-4 text-teal-600" /> : <User className="h-4 w-4 text-white" />}
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm max-w-[85%] shadow-sm",
                                        msg.role === "assistant"
                                            ? "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                                            : "bg-teal-600 text-white rounded-tr-none"
                                    )}>
                                        {msg.role === "assistant" ? (
                                            <MarkdownText text={msg.text} />
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3"
                                >
                                    <div className="h-8 w-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                                        <Sparkles className="h-4 w-4 text-teal-600" />
                                    </div>
                                    <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5 items-center h-12">
                                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100 space-y-3">
                            {/* Chips */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-gradient-right">
                                {promptChips.map(chip => (
                                    <button
                                        key={chip}
                                        onClick={() => handleSend(chip)}
                                        disabled={isLoading}
                                        className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-50 hover:bg-teal-50 text-xs font-medium text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-200 transition-all active:scale-95"
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>

                            <div className="relative flex items-center gap-2">
                                <Input
                                    placeholder="Ask about guidelines, treatments..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    disabled={isLoading}
                                    className="pr-12 py-6 rounded-2xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 bg-slate-50 shadow-inner"
                                />
                                <Button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isLoading}
                                    size="icon"
                                    className="absolute right-1.5 h-9 w-9 bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-600/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400">
                                    AI insights are for decision support only. Always verify with standard protocols.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

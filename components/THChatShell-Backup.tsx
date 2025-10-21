'use client';

import React from "react";
import { motion } from "framer-motion";
import { Menu, Sparkles, Send, Settings, Bot, User, Sun, Moon, Leaf, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

/**
 * Tortoise & Hare Reset — Chat Shell (Brand-colour edition)
 * --------------------------------------------------------
 * Uses a research-backed palette aimed at calm + return engagement.
 * Tailwind config required (see steps in chat):
 *  theme.extend.colors = {
 *    'brand-blue': '#2563eb',
 *    'brand-green': '#16a34a',
 *    'brand-amber': '#f59e0b',
 *    'brand-lavender': '#a78bfa',
 *    'brand-bg-light': '#f8fafc',
 *    'brand-bg-dark': '#0f172a',
 *  }
 */

const mockMessages = [
    { id: 1, role: "assistant", content: "Hey there 👋 Ready to reset? What would help most right now—calm, clarity, or a quick plan?" },
    { id: 2, role: "user", content: "Feeling overwhelmed. I need something immediate, then we can plan." },
    { id: 3, role: "assistant", content: "Totally get it. Let’s try a 60‑second breathing reset. Up for it?" },
];

export default function THChatShell() {
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    const [toolsOpen, setToolsOpen] = React.useState(true);
    const [dark, setDark] = React.useState(true);

    return (
        <div className={"min-h-screen w-full " + (dark ? "dark bg-brand-bg-dark" : "bg-brand-bg-light")}>
            {/* Top Nav */}
            <header className="sticky top-0 z-30 border-b border-white/0 dark:border-white/0 backdrop-blur bg-white/70 dark:bg-slate-900/60">
                <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setSidebarOpen((v) => !v)}>
                        {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-2">
                        <div className="size-8 rounded-xl bg-gradient-to-br from-brand-blue to-brand-green grid place-items-center shadow-sm">
                            <Leaf className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">Tortoise & Hare Reset</h1>
                    </motion.div>
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="rounded-xl gap-2">
                            <Sparkles className="h-4 w-4" /> New session
                        </Button>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-white/20 dark:border-white/10">
                            <Sun className="h-4 w-4" />
                            <Switch checked={dark} onCheckedChange={setDark} />
                            <Moon className="h-4 w-4" />
                        </div>
                        <Button variant="outline" size="icon" className="rounded-xl border-white/20 dark:border-white/10">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
                {/* Brand underline */}
                <div className="h-1 w-full bg-gradient-to-r from-brand-blue via-brand-green to-brand-amber" />
            </header>

            {/* Main Grid */}
            <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
                {/* Left Sidebar */}
                {sidebarOpen && (
                    <motion.aside
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        className="md:col-span-3 lg:col-span-2"
                    >
                        <Card className="rounded-2xl shadow-sm border-white/20 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur">
                            <CardHeader>
                                <CardTitle className="text-base">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button className="w-full rounded-xl bg-brand-green hover:opacity-95 text-white" variant="default">Calm me now</Button>
                                <Button className="w-full rounded-xl border-brand-lavender/40 text-brand-lavender hover:bg-brand-lavender/10" variant="outline">Reframe thought</Button>
                                <Button className="w-full rounded-xl bg-brand-amber/90 hover:bg-brand-amber text-white" variant="default">Plan next step</Button>
                                <div className="pt-2">
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Session type</p>
                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                        <Button variant="outline" className="rounded-xl border-white/20 hover:bg-brand-green/10">Hare</Button>
                                        <Button variant="outline" className="rounded-xl border-white/20 hover:bg-brand-blue/10">Tortoise</Button>
                                        <Button variant="outline" className="rounded-xl border-white/20 hover:bg-brand-amber/10">Both</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-sm mt-4 border-white/20 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Mood meter</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map((n) => (
                                        <button
                                            key={n}
                                            className="h-10 rounded-xl bg-gradient-to-b from-white/70 to-white/40 dark:from-white/5 dark:to-white/0 border border-white/20 dark:border-white/10 text-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-brand-green/50"
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Tap to log current mood</p>
                            </CardContent>
                        </Card>
                    </motion.aside>
                )}

                {/* Chat Column */}
                <section className={`${sidebarOpen && toolsOpen ? "md:col-span-6 lg:col-span-8" : sidebarOpen || toolsOpen ? "md:col-span-9 lg:col-span-10" : "md:col-span-12"}`}>
                    <Card className="rounded-2xl shadow-sm border-white/20 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-base">Session</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex flex-col h-[65vh]">
                                <ScrollArea className="flex-1 pr-2">
                                    <div className="space-y-4">
                                        {mockMessages.map((m) => (
                                            <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                                <div
                                                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm border text-sm leading-relaxed backdrop-blur relative group
                            ${m.role === "user"
                                                            ? "bg-brand-blue text-white border-brand-blue/70"
                                                            : "bg-white/70 text-slate-800 dark:bg-slate-900/60 dark:text-slate-100 border-white/20 dark:border-white/10"}
                          `}
                                                >
                                                    <div className="flex items-center gap-2 mb-1 opacity-80">
                                                        {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                                                        <span className="text-[10px] uppercase tracking-widest">{m.role}</span>
                                                    </div>
                                                    <p>{m.content}</p>
                                                    {/* Subtle completion glow (engagement loop) */}
                                                    {m.id === 1 && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ delay: 0.4, duration: 0.6 }}
                                                            className="absolute -left-2 -top-2 hidden group-hover:flex items-center gap-1 rounded-full bg-brand-green text-white px-2 py-0.5 shadow"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            <span className="text-[10px]">tip</span>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                {/* Composer */}
                                <div className="mt-4">
                                    <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 shadow-sm p-2">
                                        <div className="min-w-0">
                                            <AutoTextarea
                                                placeholder="Type your message…"
                                                maxRows={5}
                                                className="border-0 bg-transparent focus-visible:ring-0"
                                            />
                                        </div>



                                        <div className="flex items-center justify-between px-1 pb-1">
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="ghost" className="rounded-xl hover:bg-brand-lavender/10">
                                                    <Sparkles className="h-4 w-4" /> Nudge
                                                </Button>
                                                <Button size="sm" variant="ghost" className="rounded-xl hover:bg-brand-green/10">
                                                    <Leaf className="h-4 w-4" /> Mindfulness
                                                </Button>
                                            </div>
                                            <Button className="rounded-xl bg-brand-blue hover:opacity-95 text-white" size="sm">
                                                <Send className="h-4 w-4 mr-1" /> Send
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Right Tools */}
                {toolsOpen && (
                    <motion.aside
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        className="md:col-span-3 lg:col-span-2"
                    >
                        <Card className="rounded-2xl shadow-sm border-white/20 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Session summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="rounded-xl border p-3 bg-white/70 dark:bg-slate-900/60 border-white/20 dark:border-white/10">
                                    <p className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Focus</p>
                                    <p>Immediate calm, then plan next step.</p>
                                </div>
                                <div className="rounded-xl border p-3 bg-white/70 dark:bg-slate-900/60 border-white/20 dark:border-white/10">
                                    <p className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Next action</p>
                                    <p>Try 60‑second breath, then choose a micro‑goal.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl shadow-sm mt-4 border-white/20 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Export</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button className="w-full rounded-xl border-brand-blue/40 text-brand-blue hover:bg-brand-blue/10" variant="outline">Download PDF</Button>
                                <Button className="w-full rounded-xl bg-brand-green text-white hover:opacity-95" variant="default">Share link</Button>
                            </CardContent>
                        </Card>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <Button variant="ghost" className="rounded-xl hover:bg-brand-blue/10" onClick={() => setToolsOpen(false)}>
                                Hide panel
                            </Button>
                            <Button variant="ghost" className="rounded-xl hover:bg-brand-blue/10" onClick={() => setSidebarOpen(false)}>
                                Hide nav
                            </Button>
                        </div>
                    </motion.aside>
                )}
            </div>

            {/* Floating pill for toggles on mobile */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
                <div className="rounded-full border border-white/20 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 shadow-lg px-2 py-1 flex items-center gap-1 backdrop-blur">
                    <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setSidebarOpen((v) => !v)}>
                        <Menu className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setToolsOpen((v) => !v)}>
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div style={{ padding: 12, border: "1px dashed #999", margin: 12 }}>
                <textarea
                    placeholder="Sanity test: this MUST wrap and grow."
                    rows={1}
                    onInput={(e) => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = Math.min(el.scrollHeight, 120) + "px";
                    }}
                    style={{
                        display: "block",
                        width: "100%",
                        maxWidth: "100%",
                        minWidth: 0,
                        lineHeight: "1.5",
                        minHeight: 48,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        overflowX: "hidden",
                        resize: "none",
                    }}
                />
            </div>

        </div>
    );
}


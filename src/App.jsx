import { Routes, Route } from 'react-router-dom'
import { EventProvider } from '@/context/EventContext'
import Home from '@/pages/Home'

export default function App() {
    return (
        <EventProvider>
            <div className="min-h-dvh flex flex-col">
                {/* White, blurred header so it blends with the white status bar (theme-color) */}
                <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/70 pt-[env(safe-area-inset-top)]">
                    <div className="mx-auto max-w-3xl h-14 flex items-center pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
                        {/* Full reload so leftover event state doesn't prefill the new form */}
                        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight text-slate-900">
                            <img src="/favicon.svg" alt="" className="w-7 h-7" />
                            TinyTime
                        </a>
                    </div>
                </header>
                <main className="flex-1 w-full mx-auto max-w-3xl flex flex-col sm:justify-center pt-6 sm:py-10 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
                    <Routes>
                        <Route path="/" element={<Home />} />
                    </Routes>
                </main>
            </div>
        </EventProvider>
    )
}

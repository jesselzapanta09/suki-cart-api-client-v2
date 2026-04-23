import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";

const HERO_SLIDES = [
    { tag: "FRESH DAILY", title: "Your Trusted Online", accent: "Palengke", subtitle: "Fresh, affordable groceries from local farmers — delivered to your door.", cta: "Shop Now", bg: "from-green-950 via-green-900 to-green-700" },
    { tag: "LOCAL SELLERS", title: "Support Your", accent: "Neighborhood", subtitle: "Discover sari-sari stores, bakeries, and more — all in one place.", cta: "Find Stores", bg: "from-emerald-950 via-emerald-900 to-teal-700" },
    { tag: "BEST PRICES", title: "Deals You Can", accent: "Trust", subtitle: "Everyday low prices on hundreds of products. No hidden fees.", cta: "View Deals", bg: "from-green-900 via-green-800 to-lime-700" },
];

export default function Slider({ isAuthenticated }) {
    const [active, setActive] = useState(0);
    const timerRef = useRef(null);
    const next = useCallback(() => setActive(a => (a + 1) % HERO_SLIDES.length), []);
    const prev = useCallback(() => setActive(a => (a - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), []);
    useEffect(() => { timerRef.current = setInterval(next, 5000); return () => clearInterval(timerRef.current); }, [next]);
    const resetTimer = (fn) => { clearInterval(timerRef.current); fn(); timerRef.current = setInterval(next, 5000); };
    const slide = HERO_SLIDES[active];
    return (
        <section className={`relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br ${slide.bg} transition-all duration-700`}>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] right-[-10%] w-175 h-175 rounded-full bg-white/5 border border-white/5" />
                <div className="absolute bottom-[-20%] left-[-8%] w-125 h-125 rounded-full bg-green-400/10 border border-white/5" />
                <svg className="absolute inset-0 opacity-[0.03]" width="100%" height="100%">
                    <defs><pattern id="hero-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="white" /></pattern></defs>
                    <rect width="100%" height="100%" fill="url(#hero-dots)" />
                </svg>
            </div>
            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-28 pb-24 w-full">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 bg-white/10 border border-white/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-emerald-200 text-xs font-mono font-medium tracking-widest">{slide.tag}</span>
                    </div>
                    <h1 className="font-bold text-white text-4xl sm:text-5xl md:text-6xl leading-tight mb-4 tracking-tight">
                        {slide.title} <br /><span className="text-emerald-300">{slide.accent}</span>
                    </h1>
                    <p className="text-green-200 text-lg leading-relaxed mb-10 max-w-lg">{slide.subtitle}</p>
                    <div className="flex flex-wrap gap-3">
                        <Link to={isAuthenticated ? "/dashboard" : "/register/customer"} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-green-800 font-bold shadow-xl hover:-translate-y-0.5 transition-all">
                            {slide.cta} <ChevronRight className="w-4 h-4" />
                        </Link>
                        <Link to="/login" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-all">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
            <button onClick={() => resetTimer(prev)} className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer border-none">
                <ChevronLeft size={20} />
            </button>
            <button onClick={() => resetTimer(next)} className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors cursor-pointer border-none">
                <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {HERO_SLIDES.map((_, i) => (
                    <button key={i} onClick={() => resetTimer(() => setActive(i))} className={`rounded-full transition-all cursor-pointer border-none ${i === active ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40"}`} />
                ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full">
                    <path d="M0 30C240 60 480 0 720 30C960 60 1200 0 1440 30V60H0V30Z" fill="#f9fafb" />
                </svg>
            </div>
        </section>
    );
}

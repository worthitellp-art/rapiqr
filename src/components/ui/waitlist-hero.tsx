import React, { useState, useRef } from "react"
import { motion } from "motion/react"
import { QrCode } from "lucide-react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export const WaitlistHero = () => {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus("loading")
    setTimeout(() => {
      setStatus("success")
      setEmail("")
      fireConfetti()
    }, 1500)
  }

  const fireConfetti = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const particles: Particle[] = []
    const colors = ["#0070d1", "#0064b7", "#ffce21", "#ee8e00"]

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const createParticle = (): Particle => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 2) * 10,
      life: 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 2,
    })

    for (let i = 0; i < 50; i++) particles.push(createParticle())

    const animate = () => {
      if (particles.length === 0) { ctx.clearRect(0, 0, canvas.width, canvas.height); return }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.life -= 2
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.life / 100)
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
        if (p.life <= 0) particles.splice(i, 1)
      }
      requestAnimationFrame(animate)
    }
    animate()
  }

  return (
    <>
      <style>{`
        @keyframes success-pulse { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.1); } 70% { transform: scale(0.95); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes success-glow { 0%, 100% { box-shadow: 0 0 20px rgba(0, 112, 209, 0.4); } 50% { box-shadow: 0 0 60px rgba(0, 112, 209, 0.8); } }
        @keyframes checkmark-draw { 0% { stroke-dashoffset: 24; } 100% { stroke-dashoffset: 0; } }
        @keyframes celebration-ring { 0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(2); opacity: 0; } }
        @keyframes bounce-in { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .animate-success-pulse { animation: success-pulse 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-success-glow { animation: success-glow 2s ease-in-out infinite; }
        .animate-checkmark { stroke-dasharray: 24; stroke-dashoffset: 24; animation: checkmark-draw 0.4s ease-out 0.3s forwards; }
        .animate-ring { animation: celebration-ring 0.8s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 font-sans">
        <div className="flex flex-col items-center text-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 font-sans text-[10px] sm:text-xs font-bold uppercase tracking-widest"
            style={{
              background: 'rgba(0,112,209,0.08)',
              borderRadius: '9999px',
              color: '#0070d1',
              border: '1px solid rgba(0,112,209,0.1)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0070d1' }} />
            Privacy-First Vehicle Protection
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif font-light text-4xl sm:text-5xl md:text-7xl leading-tight uppercase"
            style={{ color: '#000000' }}
          >
            Secure Your Car. <span className="font-bold text-[#0070d1]">Contact Privately.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-sans text-sm sm:text-base md:text-lg leading-relaxed max-w-xl font-medium"
            style={{ color: 'rgba(0,0,0,0.6)' }}
          >
            Windshield QR tags let bystanders alert you about parking or emergencies instantly. No phone numbers shared, total privacy.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="w-full max-w-md mt-2 relative h-[60px]"
          >
            <canvas ref={canvasRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none z-50" />

            <div
              className={`absolute inset-0 flex items-center justify-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                status === "success" ? "opacity-100 scale-100 animate-success-pulse animate-success-glow" : "opacity-0 scale-95 pointer-events-none"
              }`}
              style={{ backgroundColor: "#0070d1" }}
            >
              {status === "success" && (
                <>
                  <div className="absolute top-1/2 left-1/2 w-full h-full rounded-full border-2 border-blue-400 animate-ring" style={{ animationDelay: "0s" }} />
                  <div className="absolute top-1/2 left-1/2 w-full h-full rounded-full border-2 border-blue-300 animate-ring" style={{ animationDelay: "0.15s" }} />
                  <div className="absolute top-1/2 left-1/2 w-full h-full rounded-full border-2 border-blue-200 animate-ring" style={{ animationDelay: "0.3s" }} />
                </>
              )}
              <div className={`flex items-center gap-2 text-white font-semibold text-lg ${status === "success" ? "animate-bounce-in" : ""}`}>
                <div className="bg-white/20 p-1 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path className={status === "success" ? "animate-checkmark" : ""} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>You're on the list!</span>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className={`relative w-full h-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                status === "success" ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
              }`}
            >
              <input
                type="email"
                required
                placeholder="Enter your plate number"
                value={email}
                disabled={status === "loading"}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[60px] pl-6 pr-[150px] rounded-full outline-none transition-all duration-200 font-sans font-medium placeholder:text-slate-300 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  color: '#000000',
                  background: '#ffffff',
                  border: '1px solid #cccccc',
                }}
              />
              <div className="absolute top-[6px] right-[6px] bottom-[6px]">
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="h-full px-6 rounded-full font-sans font-bold text-white transition-all active:scale-95 hover:brightness-110 disabled:hover:brightness-100 disabled:active:scale-100 disabled:cursor-wait flex items-center justify-center min-w-[130px] text-sm"
                  style={{
                    background: '#0070d1',
                  }}
                >
                  {status === "loading" ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    "Scan QR"
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-5 sm:gap-8 pt-2 sm:pt-4"
          >
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '99%', label: 'Uptime' },
              { value: '5K+', label: 'Vehicles Protected' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-5 sm:gap-8">
                <div className="text-center">
                  <span className="font-serif font-light text-lg sm:text-2xl tracking-tight" style={{ color: '#000000' }}>{stat.value}</span>
                  <span className="font-sans text-[9px] sm:text-[11px] font-bold block mt-0.5" style={{ color: 'rgba(0,0,0,0.4)' }}>{stat.label}</span>
                </div>
                {i < 2 && <div className="w-px h-8 sm:h-10" style={{ background: '#f3f3f3' }} />}
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-2"
          >
            <span className="font-helvetica text-[10px] sm:text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.4)' }}>
              Or try the live demo
            </span>
            <div className="flex items-center gap-2">
              <button className="clay-btn-white px-6 sm:px-8 py-3 text-[11px] sm:text-xs flex items-center gap-2">
                Scan Demo <QrCode size={13} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}

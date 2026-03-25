import { useEffect, useState, useRef, useCallback } from "react";

const YOUTUBE_VIDEO_ID = "PLACEHOLDER"; // Troque pelo ID do vídeo
const WHATSAPP_LINK = "https://wa.me/5500000000000?text=Quero%20agendar%20meu%20Raio-X%20Financeiro"; // Troque pelo número real

export default function Vsl() {
  const [showCta, setShowCta] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    document.title = "Agende seu Raio-X Financeiro | Delivery no Azul";
  }, []);

  // YouTube Player API integration for 85% watch detection
  useEffect(() => {
    if (YOUTUBE_VIDEO_ID === "PLACEHOLDER") {
      // Show CTA after 5s for demo purposes when no video is set
      const t = setTimeout(() => setShowCta(true), 5000);
      return () => clearTimeout(t);
    }

    // Load YouTube IFrame API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    let player: any;

    (window as any).onYouTubeIframeAPIReady = () => {
      player = new (window as any).YT.Player("yt-player", {
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          controls: 1,
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === 1) {
              // Playing — start polling
              intervalRef.current = setInterval(() => {
                if (player && player.getDuration) {
                  const pct = player.getCurrentTime() / player.getDuration();
                  if (pct >= 0.85) {
                    setShowCta(true);
                    clearInterval(intervalRef.current);
                  }
                }
              }, 1000);
            }
          },
        },
      });
    };

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col">
      {/* ── 1. Header — pulsing beacon ── */}
      <header className="w-full py-4 px-4 flex items-center justify-center gap-2.5">
        <span className="relative flex h-6 w-6">
          <span className="absolute inline-flex h-4 w-4 m-auto inset-0 rounded-full bg-[hsl(var(--brand-royal))] opacity-60 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <span className="relative inline-flex rounded-full h-3 w-3 m-auto bg-[hsl(var(--brand-royal))]" />
        </span>
        <span className="text-sm font-semibold tracking-wide uppercase text-[hsl(var(--brand-royal))]">
          Condição de lançamento
        </span>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center px-4 pb-10 max-w-5xl mx-auto w-full">
        {/* ── 2. Super Manchete ── */}
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-[2rem] font-extrabold text-center leading-tight tracking-tight text-foreground mb-8 max-w-4xl uppercase">
          COMO{" "}
          <span className="underline decoration-2 underline-offset-4" style={{ color: "rgba(255,120,30,1)" }}>
            RESGATAR
          </span>{" "}
          <span className="underline decoration-2 underline-offset-4" style={{ color: "rgba(255,120,30,1)" }}>
            ATÉ 12% DE LUCRO LÍQUIDO
          </span>{" "}
          NO SEU RESTAURANTE E DELIVERY NESTE MÊS
          <br className="hidden sm:block" />
          {" "}
          <span className="underline decoration-2 underline-offset-4" style={{ color: "rgba(255,120,30,1)" }}>
            SEM PRECISAR
          </span>{" "}DE{" "}
          <span className="underline decoration-2 underline-offset-4" style={{ color: "rgba(255,120,30,1)" }}>
            MAIS CLIENTES
          </span>,{" "}
          <span className="underline decoration-2 underline-offset-4" style={{ color: "rgba(255,120,30,1)" }}>
            INVESTIR EM MARKETING
          </span>{" "}
          OU{" "}
          <span className="underline decoration-2 underline-offset-4" style={{ color: "rgba(255,120,30,1)" }}>
            AUMENTAR OS PREÇOS
          </span>{" "}
          DO CARDÁPIO
        </h1>

        {/* ── 3. Vídeo (YouTube) ── */}
        <div className="w-full max-w-4xl rounded-2xl overflow-hidden border border-border/40 bg-card/60 backdrop-blur-sm shadow-2xl mb-8">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            {YOUTUBE_VIDEO_ID === "PLACEHOLDER" ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="h-8 w-8 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="text-xs">
                    Substitua YOUTUBE_VIDEO_ID no código pelo ID do vídeo
                  </span>
                </div>
              </div>
            ) : (
              <div id="yt-player" className="absolute inset-0 w-full h-full" />
            )}
          </div>
        </div>

        {/* ── 4. CTA — Apple glass orange button ── */}
        <div
          className={`transition-all duration-700 ${
            showCta
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-5 rounded-2xl text-base md:text-lg font-bold text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.98]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,140,50,0.85) 0%, rgba(255,90,20,0.9) 100%)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow:
                "0 8px 32px rgba(255,120,30,0.35), inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -1px 1px rgba(0,0,0,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {/* Glass highlight */}
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)",
              }}
            />
            <span className="relative z-10">
              Quero Agendar Meu Raio-X Financeiro Gratuito Agora
            </span>
          </a>
        </div>

        {showCta && (
          <p className="text-xs text-muted-foreground mt-3 animate-in fade-in">
            100% gratuito · Sem compromisso
          </p>
        )}
      </main>

      {/* ── 5. Footer ── */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/30">
        © {new Date().getFullYear()} Delivery no Azul. Todos os direitos reservados.
      </footer>
    </div>
  );
}

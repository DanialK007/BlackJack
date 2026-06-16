import { Link } from "wouter";
import { ChevronRight, Lock, Spade } from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { FadeIn } from "@/components/FadeIn";
import { useAuth } from "@/contexts/AuthContext";

const UPCOMING_GAMES = ["Poker", "Roulette", "Baccarat"];

export default function Lobby() {
  const { user } = useAuth();

  return (
    <main className="h-screen overflow-auto bg-[radial-gradient(ellipse_at_top,hsl(148,48%,22%),hsl(150,42%,11%)_62%)] text-amber-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <FadeIn duration={0.4} popup>
          <header className="flex items-center justify-between gap-4 border-b border-amber-100/10 pb-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-200/45">
                Casino Table
              </p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-amber-100 sm:text-4xl">
                Game Lobby
              </h1>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-amber-400/20 bg-black/25 px-4 py-2 text-xs uppercase tracking-widest text-amber-100/55 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live
            </div>
          </header>
        </FadeIn>

        <div className="grid flex-1 gap-6 py-6 lg:grid-cols-[1fr_340px]">
          <section className="flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <FadeIn duration={0.42} delay={0.08} popup>
                <Link href="/game">
                  <button
                    className="group min-h-70 w-full overflow-hidden rounded-lg border border-amber-400/25 bg-black/25 p-0 text-left shadow-2xl shadow-black/35 transition hover:-translate-y-0.5 hover:border-amber-300/55 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="relative flex h-full min-h-70 flex-col justify-between overflow-hidden p-6">
                      <div className="absolute -right-10 top-6 grid rotate-12 grid-cols-2 gap-3 opacity-80 transition group-hover:rotate-6">
                        {["A", "K", "Q", "J"].map((rank, index) => (
                          <div
                            key={rank}
                            className={`flex h-28 w-20 flex-col justify-between rounded-lg border bg-neutral-50 p-2 text-lg font-bold shadow-xl ${
                              index % 2 ? "text-red-700" : "text-neutral-950"
                            }`}
                          >
                            <span>{rank}</span>
                            <span className="self-center text-3xl">
                              {index % 2 ? "♥" : "♠"}
                            </span>
                            <span className="rotate-180 self-end">{rank}</span>
                          </div>
                        ))}
                      </div>

                      <div className="relative z-10 max-w-md">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-black/30 px-3 py-1 text-xs uppercase tracking-widest text-amber-100/60">
                          <Spade size={14} />
                          Available now
                        </div>
                        <h2 className="font-serif text-4xl font-bold text-amber-100 sm:text-5xl">
                          Blackjack
                        </h2>
                        <p className="mt-3 max-w-sm text-sm leading-6 text-amber-50/65">
                          Play the current table with betting, splits, double
                          down, insurance, sounds, and animated dealing.
                        </p>
                      </div>

                      <div className="relative z-10 mt-8 inline-flex w-fit items-center gap-2 rounded-md bg-amber-400 px-4 py-3 text-sm font-bold text-emerald-950 transition group-hover:bg-amber-300">
                        Play Blackjack
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </button>
                </Link>
              </FadeIn>

              <FadeIn duration={0.42} delay={0.14} popup>
                <div className="rounded-lg border border-amber-400/15 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-widest text-amber-100/45">
                    Session
                  </p>
                  <div className="mt-5 space-y-4 text-sm text-amber-50/65">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span>Status</span>
                      <span className="font-semibold text-amber-100">
                        {user ? "Signed in" : "Guest"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span>Active games</span>
                      <span className="font-semibold text-amber-100">1</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Next unlocks</span>
                      <span className="font-semibold text-amber-100">3</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>

            <FadeIn duration={0.4} delay={0.2} popup>
              <div>
                <p className="mb-3 text-xs uppercase tracking-widest text-amber-100/45">
                  Coming later
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {UPCOMING_GAMES.map((game) => (
                    <div
                      key={game}
                      className="flex min-h-28 flex-col justify-between rounded-lg border border-white/10 bg-black/20 p-4 opacity-75"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-xl font-bold text-amber-100">
                          {game}
                        </h3>
                        <Lock size={16} className="text-amber-100/35" />
                      </div>
                      <p className="text-sm text-amber-50/45">Locked</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </section>

          <FadeIn duration={0.42} delay={0.24} popup>
            <aside className="rounded-lg border border-amber-400/15 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-widest text-amber-100/45">
                Account
              </p>
              <div className="mt-4">
                <AuthPanel />
              </div>
              <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/20 p-3 text-sm">
                  <span className="text-amber-50/60">Status</span>
                  <span className="font-semibold text-amber-100">
                    {user ? "Signed in" : "Guest"}
                  </span>
                </div>

                <div className="rounded-md border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-widest text-amber-100/45">
                    Wallet
                  </p>
                  <p className="mt-2 font-serif text-2xl font-bold text-amber-100">
                    0 Chips
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-widest text-amber-100/45">
                    Achievements
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md border border-white/10 bg-black/20 p-3 text-center">
                      <p className="text-lg font-bold text-amber-100">0</p>
                      <p className="text-[10px] uppercase text-amber-50/45">Wins</p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-black/20 p-3 text-center">
                      <p className="text-lg font-bold text-amber-100">0</p>
                      <p className="text-[10px] uppercase text-amber-50/45">Streak</p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-black/20 p-3 text-center">
                      <p className="text-lg font-bold text-amber-100">0</p>
                      <p className="text-[10px] uppercase text-amber-50/45">Badges</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-amber-400/15 bg-black/20 p-3 text-sm text-amber-50/60">
                  {user
                    ? "Welcome back! Ready for another hand?"
                    : "Sign in to save progress and unlock future games."}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-amber-100/75 transition hover:border-amber-300/40 hover:text-amber-100">
                    Statistics
                  </button>
                  <button className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-amber-100/75 transition hover:border-amber-300/40 hover:text-amber-100">
                    Leaderboard
                  </button>
                </div>
              </div>
            </aside>
          </FadeIn>
        </div>
      </div>
    </main>
  );
}

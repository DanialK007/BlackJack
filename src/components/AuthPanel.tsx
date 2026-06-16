import { useState } from "react";
import { LogIn, LogOut, Mail, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FadeIn } from "@/components/FadeIn";

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.replace("Firebase: ", "");
  }

  return "Authentication failed.";
}

export function AuthPanel() {
  const {
    user,
    loading,
    isConfigured,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submitEmailAuth() {
    setError("");
    setBusy(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (nextError) {
      setError(getAuthErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function submitGoogleAuth() {
    setError("");
    setBusy(true);

    try {
      await signInWithGoogle();
    } catch (nextError) {
      setError(getAuthErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function submitLogout() {
    setError("");
    setBusy(true);

    try {
      await logout();
    } catch (nextError) {
      setError(getAuthErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  if (!isConfigured) {
    return (
      <FadeIn duration={0.28} popup>
        <div className="rounded-lg border border-amber-500/25 bg-black/30 p-4 text-sm text-amber-100/80">
          Add Firebase env vars from{" "}
          <span className="font-semibold">.env.example</span> to enable account
          login.
        </div>
      </FadeIn>
    );
  }

  if (loading) {
    return (
      <FadeIn duration={0.28} popup>
        <div className="rounded-lg border border-white/10 bg-black/30 p-4 text-sm text-white/65">
          Checking account...
        </div>
      </FadeIn>
    );
  }

  if (user) {
    return (
      <FadeIn duration={0.28} popup>
        <div className="flex flex-col gap-3 rounded-lg border border-emerald-400/20 bg-black/30 p-4">
          <div className="flex gap-5">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "Profile"}
                className="h-14 w-14 rounded-full border border-amber-400/20 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/20 bg-black/30 font-serif text-xl font-bold text-amber-100">
                {user.displayName?.[0] || user.email?.[0] || "G"}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-lg font-bold text-amber-100">
                {user.displayName || "Player"}
              </p>
              <p className="truncate text-sm text-amber-50/55">{user.email}</p>
              <p className="mt-1 text-[8px] uppercase tracking-widest text-emerald-300/70">
                Google Account Connected
              </p>
            </div>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-red-400/25 bg-red-950/40 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-900/45 disabled:opacity-50"
            onClick={submitLogout}
            disabled={busy}
          >
            <LogOut size={16} />
            Sign out
          </button>
          {error && <p className="text-xs text-red-200">{error}</p>}
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn duration={0.28} popup>
      <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/30 p-4">
        <div className="grid grid-cols-2 rounded-md bg-black/30 p-1">
          <button
            className={`rounded px-3 py-2 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-amber-400 text-emerald-950"
                : "text-amber-100/65 hover:text-amber-100"
            }`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={`rounded px-3 py-2 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-amber-400 text-emerald-950"
                : "text-amber-100/65 hover:text-amber-100"
            }`}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        {/* <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-amber-100/45">
        Email
        <input
          className="rounded-md border border-white/10 bg-black/35 px-3 py-2 text-sm normal-case tracking-normal text-amber-50 outline-none transition focus:border-amber-400/60"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-amber-100/45">
        Password
        <input
          className="rounded-md border border-white/10 bg-black/35 px-3 py-2 text-sm normal-case tracking-normal text-amber-50 outline-none transition focus:border-amber-400/60"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <button
        className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-3 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-amber-300 disabled:opacity-50"
        onClick={submitEmailAuth}
        disabled={busy || !email || password.length < 6}
      >
        {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
        {mode === "login" ? "Login" : "Create account"}
      </button> */}

        <button
          className="flex items-center justify-center gap-1 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-amber-50 transition hover:bg-white/10 disabled:opacity-50"
          onClick={submitGoogleAuth}
          disabled={busy}
        >
          {/* <Mail size={16} /> */}
          <img
            src="/icons/google.png"
            alt="Play Blackjack"
            className="h-6 w-6 p-0.5 object-cover"
          />
          Continue with Google
        </button>

        {error && <p className="text-xs text-red-200">{error}</p>}
      </div>
    </FadeIn>
  );
}

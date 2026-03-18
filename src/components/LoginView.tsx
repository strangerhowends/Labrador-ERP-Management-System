import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export function LoginView() {
  const { login } = useAuth();
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(dni.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de autenticacion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sand-50 via-white to-sand-100 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-sand-200 bg-white p-8 shadow-soft">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-500">Restaurante Labrador</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-950">Iniciar Sesion</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="dni" className="block text-sm font-medium text-ink-700">DNI</label>
            <input
              id="dni"
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
              placeholder="Ingresa tu DNI"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-700">Contrasena</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500"
              placeholder="Ingresa tu contrasena"
              required
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sage-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-700 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}

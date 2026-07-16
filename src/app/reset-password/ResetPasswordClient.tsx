"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ResetPasswordClientProps = {
  initialEmail: string;
  initialToken: string;
};

type ResetErrors = {
  token?: string[];
  email?: string[];
  password?: string[];
};

export default function ResetPasswordClient({ initialEmail, initialToken }: ResetPasswordClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ResetErrors>({});

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setErrors({});

    if (!initialToken) {
      setMessage("Deze wachtwoordresetlink mist verplichte informatie. Vraag een nieuwe link aan.");
      return;
    }

    if (password !== passwordConfirmation) {
      setErrors({ password: ["De wachtwoorden komen niet overeen."] });
      setMessage("De wachtwoorden komen niet overeen.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reset-password/confirm", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: initialToken,
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || {});
        setMessage(data.message || "Deze wachtwoordresetlink is ongeldig of verlopen.");
        return;
      }

      router.replace("/account/login?reset=success");
    } catch {
      setMessage("Het wachtwoord kon niet worden gewijzigd. Probeer het later opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#F5F5F5] min-h-[80vh] flex items-center justify-center py-10 px-4 font-sans">
      <div className="max-w-[1000px] w-full bg-white rounded-lg shadow-xl overflow-hidden flex flex-col lg:flex-row">
        <div className="lg:w-1/2 p-10 bg-[#0066FF] text-white flex flex-col justify-center">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">Kies een nieuw wachtwoord</h1>
          <p className="text-blue-100 text-lg">
            Stel veilig een nieuw wachtwoord in en ga daarna direct verder in je Bouwbeslag-account.
          </p>
        </div>

        <div className="lg:w-1/2 p-10 lg:p-14">
          <h2 className="text-3xl font-bold text-[#1C2530] mb-2">Wachtwoord opnieuw instellen</h2>
          <p className="text-[#3D4752] mb-8">Vul je e-mailadres in en kies een nieuw wachtwoord.</p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {message && (
              <div className="bg-red-50 text-red-700 p-3 rounded-sm text-sm border border-red-200" role="status">
                {message}
              </div>
            )}

            <fieldset>
              <label htmlFor="reset-email" className="text-[#1C2530] font-medium mb-1 block">E-mailadres</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                autoComplete="email"
                disabled={loading}
                required
              />
              {errors.email?.[0] && <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>}
            </fieldset>

            <fieldset>
              <label htmlFor="new-password" className="text-[#1C2530] font-medium mb-1 block">Nieuw wachtwoord</label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full px-4 pr-24 py-3 border border-gray-200 rounded-sm focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#0050D1]"
                >
                  {showPassword ? "Verberg" : "Toon"}
                </button>
              </div>
              {errors.password?.[0] && <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>}
            </fieldset>

            <fieldset>
              <label htmlFor="password-confirmation" className="text-[#1C2530] font-medium mb-1 block">Bevestig wachtwoord</label>
              <input
                id="password-confirmation"
                type={showPassword ? "text" : "password"}
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]"
                autoComplete="new-password"
                disabled={loading}
                required
              />
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0066FF] hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-sm transition-colors"
            >
              {loading ? "Bezig met instellen..." : "Wachtwoord instellen"}
            </button>
          </form>

          <Link href="/account/login" className="mt-5 block text-center text-sm font-semibold text-[#0050D1] hover:underline">
            Terug naar inloggen
          </Link>
        </div>
      </div>
    </main>
  );
}

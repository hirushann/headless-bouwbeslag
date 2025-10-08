"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await login(username, password);
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res));
      router.push("/account");
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  return (
    <main className="max-w-[1440px] mx-auto p-8">
      <div className="hero w-full">
        <div className="hero-content flex-col w-full">
          <div className="text-center lg:text-left w-2/4">
            <h1 className="text-5xl font-bold text-center mb-3">Login now!</h1>
          </div>
          <div className="card bg-base-100 w-2/4 shrink-0 shadow-sm">
            <div className="card-body w-full">
              <fieldset className="fieldset w-full">
                <label className="label">Email</label>
                <input type="text" className="input w-full focus:!outline-0 focus:!ring-0" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <label className="label">Password</label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input w-full focus:!outline-0 focus:!ring-0"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer select-none text-primary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    )}
                  </span>
                </div>
                <div><a className="link link-hover">Forgot password?</a></div>
                <button className="btn btn-neutral mt-4" onClick={handleLogin}>Login</button>
                {error && <p className="text-red-600 mb-4">{error}</p>}
              </fieldset>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
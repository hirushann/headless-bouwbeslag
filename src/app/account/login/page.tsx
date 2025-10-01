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
      <div className="hero bg-base-200">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <div className="text-center lg:text-left w-2/4">
            <h1 className="text-5xl font-bold">Login now!</h1>
            <p className="py-6">
              Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem
              quasi. In deleniti eaque aut repudiandae et a id nisi.
            </p>
          </div>
          <div className="card bg-base-100 w-2/4 shrink-0 shadow-2xl">
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer select-none text-sm text-primary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
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
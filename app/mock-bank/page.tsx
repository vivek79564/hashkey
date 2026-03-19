"use client";
import { useState } from "react";

// The 3 Hackathon Test Accounts
const BANK_DATABASE = {
  alice: { 
    password: "123", 
    name: "Alice Investor", 
    balance: 250000, 
    status: "Eligible (> $200k)" 
  },
  bob: { 
    password: "123", 
    name: "Bob Builder", 
    balance: 150000, 
    status: "Ineligible (< $200k)" 
  },
  charlie: { 
    password: "123", 
    name: "Charlie Whale", 
    balance: 5500000, 
    status: "Eligible (> $200k)" 
  }
};

export default function MockBank() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const account = BANK_DATABASE[username.toLowerCase() as keyof typeof BANK_DATABASE];
    
    if (account && account.password === password) {
      setUser(account);
      setError("");
    } else {
      setError("Invalid credentials. Try alice/123, bob/123, or charlie/123.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      {!user ? (
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-md"></div>
            <h1 className="text-2xl font-bold text-slate-800">First HashKey Bank</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 ring-blue-500 outline-none"
                placeholder="alice, bob, or charlie"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 ring-blue-500 outline-none"
                placeholder="123"
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Secure Login
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-100 rounded-lg text-sm text-slate-600">
            <strong>Hackathon Test Creds:</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>alice / 123</strong> ($250k)</li>
              <li><strong>bob / 123</strong> ($150k)</li>
              <li><strong>charlie / 123</strong> ($5.5M)</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800">First HashKey Bank</h1>
            <button onClick={() => setUser(null)} className="text-sm text-slate-500 hover:text-slate-800">Logout</button>
          </div>

          <div className="mb-8">
            <h2 className="text-lg text-slate-500 mb-1">Welcome back, {user.name}</h2>
            <p className="text-sm text-slate-400">Account #8472-XXXX</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Balance</h3>
            
            {/* THIS IS THE CRITICAL DIV FOR TLSNOTARY TO PARSE */}
            <div id="zk-proof-target" className="text-5xl font-black text-slate-800 font-mono">
              $<span id="user-balance-value">{user.balance}</span>.00
            </div>
            {/* ----------------------------------------------- */}

          </div>

          <p className="text-sm text-slate-400 text-center">
            Secured by AES-256 and TLS 1.3
          </p>
        </div>
      )}
    </div>
  );
}
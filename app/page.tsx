"use client";
import { useState } from "react";
const snarkjs = require("snarkjs");
import { BrowserProvider, Contract } from "ethers";

const CONTRACT_ADDRESS = "0x2dC67a48f23FA24677c8eE7981AcF5702DA9fd81"; 

const RWA_ASSETS = [
  { id: 1, name: "NYC Prime Office Fund", yield: "7.2%", min: "$50,000", type: "Real Estate" },
  { id: 2, name: "US Treasury Bills (Tokenized)", yield: "5.1%", min: "$10,000", type: "Sovereign Debt" },
];

export default function Home() {
  const [income, setIncome] = useState("");
  const [status, setStatus] = useState("Awaiting Data Provenance...");
  const [isVerified, setIsVerified] = useState(false);
  const [txHash, setTxHash] = useState("");
  
  // New States for zkTLS Simulation
  const [showBankModal, setShowBankModal] = useState(false);
  const [tlsStatus, setTlsStatus] = useState("");
  const [attestation, setAttestation] = useState<{hash: string, verified: boolean} | null>(null);

  // The "Smoke and Mirrors" Hackathon Mock
  const simulateTlsNotary = async () => {
    setShowBankModal(true);
    setTlsStatus("Establishing MPC-TLS Session with Bank Server...");
    await new Promise(r => setTimeout(r, 1500));
    
    setTlsStatus("Verifying x.509 Certificate Chain...");
    await new Promise(r => setTimeout(r, 1500));
    
    setTlsStatus("Generating Zero-Knowledge Transcript Proof...");
    await new Promise(r => setTimeout(r, 1500));

    // Mock successful extraction
    const verifiedIncome = "250000";
    setIncome(verifiedIncome);
    setAttestation({
      hash: "0x" + Math.random().toString(16).substr(2, 40),
      verified: true
    });
    setShowBankModal(false);
    setStatus("✅ Bank Data Attested via zkTLS. Ready for Circuit.");
  };

  const generateAndSubmitProof = async () => {
    try {
      if (!attestation?.verified) throw new Error("Data must be attested via zkTLS first!");
      if (!window.ethereum) throw new Error("Please install MetaMask!");
      
      setStatus("⚙️ Hiding exact balance... Generating Groth16 Proof locally...");

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        { userIncome: income, minimumRequired: 200000 },
        "/investor.wasm",
        "/investor_final.zkey"
      );

      setStatus("✅ Privacy Shield Active! Checking HashKey network...");

      const a = [proof.pi_a[0], proof.pi_a[1]];
      const b = [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]];
      const c = [proof.pi_c[0], proof.pi_c[1]];
      const input = publicSignals;

      let provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== 133n) {
        setStatus("⚠️ Switching to HashKey Testnet...");
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x85' }], 
        });
        provider = new BrowserProvider(window.ethereum);
      }

      setStatus("📝 Awaiting MetaMask approval to submit Proof...");
      const signer = await provider.getSigner();
      const abi = ["function proveAndJoin(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[1] input) public"];
      const contract = new Contract(CONTRACT_ADDRESS, abi, signer);

      const tx = await contract.proveAndJoin(a, b, c, input);
      setTxHash(tx.hash);
      setStatus("🚀 Verifying ZK Proof on HashKey Testnet...");
      
      await tx.wait();
      setStatus("🎉 Verification Successful!");
      setIsVerified(true);

    } catch (error: any) {
      console.error(error);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-12 relative">
      {/* zkTLS Simulation Modal */}
      {showBankModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-2xl max-w-sm w-full shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
            <h3 className="text-xl font-bold text-center mb-4">zkTLS Notary Node</h3>
            <p className="text-sm font-mono text-green-400 text-center">{tlsStatus}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center font-bold text-black">zk</div>
          <h1 className="text-2xl font-black tracking-tighter">RWA GUARD</h1>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        {!isVerified ? (
          <div className="flex flex-col items-center">
            <div className="max-w-md w-full bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-zinc-800 relative overflow-hidden">
              
              <h2 className="text-2xl font-bold mb-2">Accreditation Portal</h2>
              <p className="text-zinc-400 text-sm mb-8">
                Connect your bank to securely prove your income threshold without revealing the actual amount on-chain.
              </p>

              <div className="space-y-6">
                {/* Step 1: Data Provenance */}
                <div className={`p-4 rounded-xl border ${attestation ? 'border-green-500 bg-green-500/10' : 'border-zinc-700 bg-black'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Step 1: Data Provenance</span>
                    {attestation && <span className="text-xs text-green-400 font-bold">✓ Attested</span>}
                  </div>
                  
                  {!attestation ? (
                    <button 
                      onClick={simulateTlsNotary}
                      className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      Connect Bank via zkTLS (Demo)
                    </button>
                  ) : (
                    <div>
                      <p className="text-sm text-zinc-300 mb-1">Cryptographic Transcript Hash:</p>
                      <p className="font-mono text-xs text-green-500 truncate">{attestation.hash}</p>
                    </div>
                  )}
                </div>

                {/* Step 2: ZK Proof generation */}
                <div className={`p-4 rounded-xl border ${!attestation ? 'border-zinc-800 opacity-50' : 'border-zinc-700 bg-black'}`}>
                  <span className="text-xs font-bold text-zinc-400 uppercase block mb-2">Step 2: Circuit Input</span>
                  <input
                    type="text"
                    value={income ? `$${income} (Hidden from Contract)` : "Waiting for attestation..."}
                    disabled
                    className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-lg outline-none text-zinc-300 font-mono text-sm"
                  />
                </div>

                <button
                  onClick={generateAndSubmitProof}
                  disabled={!attestation}
                  className={`w-full font-black py-4 rounded-xl transition-all ${
                    attestation 
                      ? 'bg-white text-black hover:bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.3)]' 
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  GENERATE ZK PROOF & VERIFY
                </button>
              </div>

              <div className="mt-8 p-4 bg-black/50 rounded-xl border border-zinc-800 font-mono text-xs text-center text-zinc-400">
                {status}
              </div>
            </div>
          </div>
        ) : (
          /* POST-VERIFICATION DASHBOARD (Remains the same as before) */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
             <h2 className="text-4xl font-bold mb-8 text-center text-green-400">Welcome to the VIP RWA Pool!</h2>
             {/* ... Include your asset cards here ... */}
          </div>
        )}
      </div>
    </main>
  );
}
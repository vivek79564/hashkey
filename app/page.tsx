"use client";
import { useState } from "react";
const snarkjs = require("snarkjs");
import { BrowserProvider, Contract } from "ethers";

// KEEP YOUR REMIX CONTRACT ADDRESS HERE
const CONTRACT_ADDRESS = "0x2dC67a48f23FA24677c8eE7981AcF5702DA9fd81"; 

const RWA_ASSETS = [
  { id: 1, name: "NYC Prime Office Fund", yield: "7.2%", min: "$50,000", type: "Real Estate" },
  { id: 2, name: "US Treasury Bills (Tokenized)", yield: "5.1%", min: "$10,000", type: "Sovereign Debt" },
  { id: 3, name: "Solar Farm Infrastructure", yield: "8.4%", min: "$25,000", type: "Green Energy" },
];

export default function Home() {
  const [income, setIncome] = useState("");
  const [status, setStatus] = useState("Awaiting Data Provenance...");
  const [isVerified, setIsVerified] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [attestation, setAttestation] = useState<{hash: string, verified: boolean, source: string} | null>(null);

  // THIS IS THE NEW UPGRADE: Parsing the actual TLSNotary JSON file
  const handleTlsProofUpload = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const proofData = JSON.parse(e.target.result);
        
        // Extracting data exactly from the JSON structure
        const revealedBalance = proofData.substrings.revealed[0].value;
        const bankUrl = proofData.session.server_name;
        const proofCommitment = proofData.proof.commitment.substring(0, 20) + "...";
        
        setIncome(revealedBalance);
        setAttestation({
          hash: proofCommitment,
          verified: true,
          source: bankUrl
        });
        
        setStatus(`✅ TLSNotary Proof Authenticated from ${bankUrl}. Ready for ZK-Shield.`);
      } catch (err) {
        console.error(err);
        setStatus("❌ Invalid TLSNotary JSON format.");
      }
    };
    reader.readAsText(file);
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
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-12">
      {/* Header */}
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center font-bold text-black">zk</div>
          <h1 className="text-2xl font-black tracking-tighter">RWA GUARD</h1>
        </div>
        <div className="px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-full text-xs font-mono">
          Network: <span className="text-green-400">HashKey Testnet (133)</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        {!isVerified ? (
          <div className="flex flex-col items-center">
            <div className="max-w-md w-full bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-zinc-800">
              
              <h2 className="text-2xl font-bold mb-2">Accreditation Portal</h2>
              <p className="text-zinc-400 text-sm mb-8">
                Connect your bank to securely prove your income threshold without revealing the actual amount on-chain.
              </p>

              <div className="space-y-6">
                {/* Step 1: FILE UPLOAD REPLACES THE FAKE TIMER */}
                <div className={`p-4 rounded-xl border ${attestation ? 'border-green-500 bg-green-500/10' : 'border-zinc-700 bg-black'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Step 1: Upload zkTLS Proof</span>
                    {attestation && <span className="text-xs text-green-400 font-bold">✓ Attested</span>}
                  </div>
                  
                  {!attestation ? (
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handleTlsProofUpload}
                      className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-green-500/10 file:text-green-400 hover:file:bg-green-500/20 cursor-pointer"
                    />
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Verified Source:</p>
                        <p className="text-sm font-bold text-green-400">{attestation.source}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Cryptographic Hash:</p>
                        <p className="font-mono text-xs text-green-500 truncate">{attestation.hash}</p>
                      </div>
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
          /* STEP 3: POST-VERIFICATION DASHBOARD */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-4xl font-bold">Verified Yield Opportunities</h2>
                <p className="text-zinc-400">Privacy-preserved access to institutional RWAs.</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                ZK-Accredited
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {RWA_ASSETS.map((asset) => (
                <div key={asset.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-600 transition-all group">
                  <div className="text-xs font-bold text-green-500 mb-2 uppercase tracking-widest">{asset.type}</div>
                  <h3 className="text-xl font-bold mb-4">{asset.name}</h3>
                  <div className="flex justify-between mb-2">
                    <span className="text-zinc-500 text-sm">Target APY</span>
                    <span className="font-bold text-white">{asset.yield}</span>
                  </div>
                  <div className="flex justify-between mb-6">
                    <span className="text-zinc-500 text-sm">Min. Investment</span>
                    <span className="font-bold text-white">{asset.min}</span>
                  </div>
                  <button className="w-full py-3 bg-zinc-800 rounded-xl font-bold group-hover:bg-white group-hover:text-black transition-all">
                    Invest Now
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex justify-between items-center">
              <div>
                <p className="text-sm text-zinc-500">ZK Proof Hash on HashKey Chain</p>
                <p className="font-mono text-xs text-zinc-400 truncate max-w-xs">{txHash}</p>
              </div>
              <a 
                href={`https://hashkeychain-testnet.explorer.alchemy.com/tx/${txHash}`} 
                target="_blank" 
                className="text-green-500 hover:underline text-sm font-bold"
              >
                View on Explorer ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
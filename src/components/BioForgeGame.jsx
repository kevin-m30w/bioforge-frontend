import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Thermometer,
  Droplet,
  FlaskConical,
  Activity,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  FileText,
  Crosshair,
  Info,
  CheckCircle2,
  Coins,
} from "lucide-react";

// --- GAME CONTENT & CLUES ---
const CONTRACTS = [
  {
    id: "c1",
    title: "Urban Waste Crisis",
    strainKey: "ecoli",
    target: 1500,
    difficulty: "Standard",
    substrate: "Glucose",
    reward: 500,
    desc: "The city's primary organic waste digester is offline. Cultivate E. coli rapidly to process the backlog.",
    intel:
      "Found naturally in the mammalian lower intestine. Thrives at standard human body temperature and neutral acidity.",
  },
  {
    id: "c2",
    title: "Acid Mine Drainage",
    strainKey: "a_ferrooxidans",
    target: 1200,
    difficulty: "Hard",
    substrate: "Ferrous Iron",
    reward: 1200,
    desc: "Toxic runoff from an abandoned mine is threatening the water table. Deploy this strain to oxidize the iron.",
    intel:
      "An extreme acidophile discovered in dark, cool caves. It requires a highly acidic environment to survive.",
  },
  {
    id: "c3",
    title: "Marine Oil Spill",
    strainKey: "a_borkumensis",
    target: 2000,
    difficulty: "Critical",
    substrate: "Crude Oil",
    reward: 2500,
    desc: "A tanker leak has coated a local reef in crude oil. We need a massive biomass deployed immediately.",
    intel:
      "A marine bacterium. Prefers slightly alkaline ocean water and moderate, warm oceanic temperatures.",
  },
  {
    id: "c4",
    title: "Plastisphere Cleanup",
    strainKey: "i_sakaiensis",
    target: 1800,
    difficulty: "Hard",
    substrate: "PET Plastic",
    reward: 1500,
    desc: "A massive accumulation of PET plastic has been detected. Engineer a controlled bloom to break down the polymers.",
    intel:
      "Discovered outside a bottle recycling facility. Prefers standard ambient room temperatures and a near-neutral pH.",
  },
  {
    id: "c5",
    title: "Nuclear Site Reclamation",
    strainKey: "d_radiodurans",
    target: 800,
    difficulty: "Extreme",
    substrate: "Organic Waste",
    reward: 5000,
    desc: "Radiation levels make standard cleanup impossible. Cultivate this extremophile to digest waste in the irradiated zone.",
    intel:
      "One of the most radiation-resistant organisms known. Highly adaptable, but prefers moderate heat and neutral conditions.",
  },
];

export default function BioForgeGame() {
  const [gameState, setGameState] = useState("MENU");
  const [activeContract, setActiveContract] = useState(null);
  const [bacteriaCatalog, setBacteriaCatalog] = useState({});
  const [countdown, setCountdown] = useState(3);

  // PROGRESS & ECONOMY STATE
  const [completedContracts, setCompletedContracts] = useState([]);
  const [credits, setCredits] = useState(0); // <-- NEW: Bank Account

  // ENGINE STATE
  const [currentHour, setCurrentHour] = useState(0);
  const [realTimeLeft, setRealTimeLeft] = useState(48);
  const [historicalData, setHistoricalData] = useState([]);
  const [currentPop, setCurrentPop] = useState(10);

  // CONTROLS & PATCH STATE
  const [suhu, setSuhu] = useState(37);
  const [ph, setPh] = useState(7.0);
  const [nutrients, setNutrients] = useState(100);
  const [crisisActive, setCrisisActive] = useState(false);
  const [startCoord, setStartCoord] = useState("");
  const [endCoord, setEndCoord] = useState("");
  const [patchLog, setPatchLog] = useState("");
  const [gcBuffActive, setGcBuffActive] = useState(false);

  const slidersRef = useRef({ suhu, ph, nutrients });
  useEffect(() => {
    slidersRef.current = { suhu, ph, nutrients };
  }, [suhu, ph, nutrients]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/bacteria")
      .then((res) => setBacteriaCatalog(res.data))
      .catch((err) => console.error("API Offline:", err));
  }, []);

  const currentStrain =
    activeContract && bacteriaCatalog[activeContract.strainKey]
      ? bacteriaCatalog[activeContract.strainKey]
      : { name: "Loading...", optimal_temp: 37, optimal_ph: 7.0 };

  const handleAcceptContract = (contract) => {
    if (completedContracts.includes(contract.id)) return;
    setActiveContract(contract);
    setSuhu(15);
    setPh(7);
    setNutrients(50);
    setGameState("COUNTDOWN");
    setCountdown(3);
  };

  const handleScanGenome = (e) => {
    e.preventDefault();

    if (gameState !== "RUNNING") return;

    setPatchLog("🔍 Scanning genome for structural density...");

    // Simulate a slight delay for dramatic effect, then reveal a coordinate
    setTimeout(() => {
      // We generate a random even number (which aligns with your Python mock backend's high-GC logic)
      const hintLocus = Math.floor(Math.random() * 450) * 2;
      setPatchLog(
        `✅ SCAN COMPLETE: High density of G-C nucleotide pairs detected near locus ${hintLocus}. Recommend extracting a 50bp - 100bp window.`,
      );
    }, 800);
  };

  useEffect(() => {
    let timer;
    if (gameState === "COUNTDOWN") {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      } else {
        setCurrentHour(0);
        setRealTimeLeft(48);
        setCurrentPop(10);
        setHistoricalData([{ hour: 0, population: 10 }]);
        setCrisisActive(false);
        setGcBuffActive(false);
        setPatchLog("");
        setGameState("RUNNING");
      }
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown]);

  useEffect(() => {
    let ticker = null;
    if (gameState === "RUNNING") {
      ticker = setInterval(() => {
        setRealTimeLeft((prev) => Math.max(0, prev - 1));

        setCurrentHour((prevHour) => {
          const nextHour = prevHour + 1;

          // --- THE CRISIS EVENT UPGRADE ---
          if (nextHour === 8) {
            setCrisisActive(true);
            setPatchLog(
              "⚠️ INCUBATOR MALFUNCTION! Temperature spiking! Sequence a high GC-Content patch immediately to reinforce cell walls!",
            );

            // This actually moves the slider and spikes the heat, forcing the player to react!
            setSuhu((prevTemp) => Math.min(60, prevTemp + 18));
          }

          const {
            suhu: curSuhu,
            ph: curPh,
            nutrients: curNutrients,
          } = slidersRef.current;
          const optTemp = currentStrain.optimal_temp;
          const optPh = currentStrain.optimal_ph;

          const tempModifier = Math.exp(
            -0.5 * Math.pow((curSuhu - optTemp) / 5, 2),
          );
          const phModifier = Math.exp(
            -0.5 * Math.pow((curPh - optPh) / 1.0, 2),
          );
          const r = 0.8 * tempModifier * phModifier;
          const K = curNutrients * 20;

          setCurrentPop((prevPop) => {
            let nextPop = prevPop;
            const maxTolerance = gcBuffActive ? optTemp + 15 : optTemp + 8;

            if (curSuhu > maxTolerance || Math.abs(curPh - optPh) > 3.0) {
              nextPop = Math.max(0, prevPop - Math.round(prevPop * 0.35));
            } else {
              nextPop = Math.round(
                K / (1 + ((K - 10) / 10) * Math.exp(-r * nextHour)),
              );
            }
            setHistoricalData((prevData) => [
              ...prevData,
              { hour: nextHour, population: nextPop },
            ]);
            return nextPop;
          });

          if (nextHour >= 24) {
            clearInterval(ticker);
            setGameState("EVALUATE");
          }
          return nextHour;
        });
      }, 2000);
    }
    return () => clearInterval(ticker);
  }, [gameState, currentStrain, gcBuffActive]);

  useEffect(() => {
    if (gameState === "EVALUATE") {
      if (currentPop >= activeContract.target) {
        setGameState("SUCCESS");
        if (!completedContracts.includes(activeContract.id)) {
          setCompletedContracts((prev) => [...prev, activeContract.id]);
          setCredits((prev) => prev + activeContract.reward); // <-- NEW: Award money!
        }
      } else {
        setGameState("FAILED");
      }
    }
  }, [gameState, currentPop, activeContract, completedContracts]);

  const handleApplyPatch = async (e) => {
    e.preventDefault();
    if (!startCoord || !endCoord) return;
    try {
      setPatchLog("📡 Querying Database...");
      const response = await axios.get(
        `http://127.0.0.1:8000/bacteria/${activeContract.strainKey}/sequence`,
        { params: { start: parseInt(startCoord), end: parseInt(endCoord) } },
      );
      const dna = response.data.sequence.toUpperCase();
      const gcPerc = ((dna.match(/[GC]/g) || []).length / dna.length) * 100;

      if (gcPerc >= 50) {
        setGcBuffActive(true);
        setCrisisActive(false);
        setPatchLog(
          `✅ SUCCESS: GC-Content ${gcPerc.toFixed(1)}%. Cell wall reinforced. Tolerating higher heat!`,
        );
      } else {
        setPatchLog(
          `❌ FAILURE: GC-Content only ${gcPerc.toFixed(1)}%. Too weak.`,
        );
      }
    } catch (err) {
      setPatchLog("❌ ERROR: Connection failed.");
    }
  };

  // ==================== VIEWS ====================

  if (gameState === "MENU") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex flex-col items-center justify-center font-sans relative">
        {/* NEW: CREDIT DISPLAY CORNER */}
        <div className="absolute top-8 right-8 bg-slate-900 border border-emerald-500/50 p-3 rounded-lg shadow-lg flex items-center gap-3">
          <div className="bg-emerald-950 p-2 rounded-full">
            <Coins className="text-emerald-400" size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
              Bio-Credits
            </p>
            <p className="text-xl font-mono font-bold text-emerald-400">
              ${credits.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black text-sky-500 tracking-tighter mb-2">
              BIOFORGE
            </h1>
            <p className="text-lg text-slate-400">
              Tactical Biological Operations & Cultivation Engine
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700 p-5 rounded-lg mb-8 shadow-lg">
            <h2 className="text-lg font-bold text-sky-400 mb-2 flex items-center gap-2">
              <Info size={20} /> Standard Operating Procedure
            </h2>
            <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5">
              <li>
                <strong>Time Limit:</strong> You have exactly 48 real-world
                seconds (24 simulated hours) to hit the target population quota.
              </li>
              <li>
                <strong>Blind Incubation:</strong> Exact environmental optimums
                are classified. Read the biological{" "}
                <strong className="text-emerald-400">Strain Intel</strong>{" "}
                carefully to deduce the correct Temperature and pH.
              </li>
              <li>
                <strong>Live Adjustments:</strong> Watch the graph! If the
                population drops, your sliders are killing the colony. Adjust
                them quickly.
              </li>
              <li>
                <strong>DNA Patching:</strong> Environmental shocks will occur
                at Hour 8. When the temperature spikes uncontrollably, sequence
                a genome slice with high GC-Content (50%) to buff your colony's
                thermal resistance.
              </li>
            </ul>
          </div>

          <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Crosshair className="text-sky-400" /> Active Deployment Contracts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONTRACTS.map((contract) => {
              const isDone = completedContracts.includes(contract.id);
              return (
                <div
                  key={contract.id}
                  className={`border rounded-lg p-5 transition-all relative overflow-hidden ${
                    isDone
                      ? "bg-slate-900/50 border-emerald-900 cursor-not-allowed opacity-60"
                      : "bg-slate-900 border-slate-700 hover:border-sky-500 hover:bg-slate-800 cursor-pointer group"
                  }`}
                  onClick={() => handleAcceptContract(contract)}
                >
                  {isDone && (
                    <div className="absolute top-4 right-4 text-emerald-500 flex items-center gap-1 font-bold text-sm">
                      <CheckCircle2 size={18} /> DONE
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2 pr-24">
                    <h3
                      className={`font-bold text-lg ${isDone ? "text-emerald-500" : "text-white group-hover:text-sky-400"}`}
                    >
                      {contract.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{contract.desc}</p>

                  <div className="bg-slate-950 p-2 rounded text-xs text-slate-300 border border-slate-800 mb-4">
                    <span className="text-emerald-400 font-bold block mb-1">
                      Strain Intel:
                    </span>
                    {contract.intel}
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-slate-700 pt-3">
                    <span className="text-slate-500 font-mono">
                      Target: {contract.target} cells
                    </span>
                    {!isDone && (
                      <span className="text-emerald-400 font-bold font-mono">
                        Reward: ${contract.reward}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "COUNTDOWN") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-sky-400 tracking-widest uppercase mb-4 text-sm font-bold animate-pulse">
            Initializing Bioreactor Array
          </p>
          <div className="text-9xl font-black text-white">{countdown}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans">
      <header className="border-b border-slate-700 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-sky-400 m-0 flex items-center gap-2">
            <Activity size={24} /> BioForge Operational Terminal
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-sm">
            Contract: {activeContract?.title}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          {gameState === "SUCCESS" || gameState === "FAILED" ? (
            <button
              onClick={() => setGameState("MENU")}
              className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded flex items-center gap-2 font-bold"
            >
              <RefreshCw size={16} /> Return to Mission Select
            </button>
          ) : (
            <div className="bg-slate-950 px-4 py-2 rounded border border-red-900 text-right font-mono">
              <span className="text-red-400 font-bold animate-pulse text-sm block">
                SIMULATION ACTIVE
              </span>
              <span className="text-slate-400 text-xs">
                Real-Time Left: {realTimeLeft}s
              </span>
            </div>
          )}
        </div>
      </header>

      {/* POST-GAME OUTCOMES WITH REWARD DISPLAY */}
      {gameState === "SUCCESS" && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-lg flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <CheckCircle2 size={32} />
            <div>
              <strong className="block font-bold text-xl uppercase">
                Contract Executed
              </strong>
              Biological yield met. Payment transferred.
            </div>
          </div>
          <div className="text-right font-mono text-2xl font-bold">
            + ${activeContract?.reward}
          </div>
        </div>
      )}

      {gameState === "FAILED" && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500 text-rose-400 p-4 rounded-lg flex items-center gap-4 shadow-lg">
          <AlertTriangle size={32} />
          <div>
            <strong className="block font-bold text-xl uppercase">
              Contract Failed
            </strong>
            Yield insufficient. Review environmental limits and try again.
          </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg mb-6 text-sm flex gap-4 items-center">
        <Info className="text-emerald-400 min-w-[20px]" size={20} />
        <p>
          <strong className="text-slate-300">Intel Reminder:</strong>{" "}
          <span className="text-slate-400">{activeContract?.intel}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[320px] flex flex-col gap-6">
          <div
            className={`p-6 rounded-lg shadow-lg border transition-all ${crisisActive ? "bg-red-950/20 border-red-500 shadow-red-500/20" : "bg-slate-800 border-slate-700"}`}
          >
            <h2 className="text-lg font-bold mb-6 border-b border-slate-700 pb-2 text-slate-300">
              Environmental Rig
            </h2>

            <div className="mb-6">
              <label className="flex items-center gap-2 mb-2 text-sm">
                <Thermometer
                  size={18}
                  className={
                    crisisActive
                      ? "text-red-500 animate-pulse"
                      : "text-rose-500"
                  }
                />
                Incubator Heat:{" "}
                <strong
                  className={crisisActive ? "text-red-400" : "text-white"}
                >
                  {suhu}°C
                </strong>
              </label>
              <input
                type="range"
                min="0"
                max="60"
                disabled={gameState !== "RUNNING"}
                value={suhu}
                onChange={(e) => setSuhu(Number(e.target.value))}
                className="w-full cursor-pointer accent-sky-500"
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 mb-2 text-sm">
                <Droplet size={18} className="text-blue-500" />
                Substrate pH:{" "}
                <strong className="text-white">{ph.toFixed(1)}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="14"
                step="0.1"
                disabled={gameState !== "RUNNING"}
                value={ph}
                onChange={(e) => setPh(Number(e.target.value))}
                className="w-full cursor-pointer accent-sky-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 text-sm">
                <FlaskConical size={18} className="text-emerald-500" />
                Nutrients:{" "}
                <strong className="text-white">{nutrients} units</strong>
              </label>
              <input
                type="range"
                min="10"
                max="200"
                disabled={gameState !== "RUNNING"}
                value={nutrients}
                onChange={(e) => setNutrients(Number(e.target.value))}
                className="w-full cursor-pointer accent-sky-500"
              />
            </div>
          </div>

          {/* DNA INJECTOR */}
          <div
            className={`p-6 rounded-lg border font-mono transition-all ${crisisActive && !gcBuffActive ? "bg-red-950 border-red-500 shadow-red-500/20" : "bg-slate-950 border-slate-700"}`}
          >
            <h3 className="text-sm font-bold flex items-center gap-2 text-sky-400 mb-4">
              🧬 DNA Sequence Console
            </h3>

            <div className="bg-slate-900 p-3 rounded text-xs text-slate-300 border border-slate-800 mb-4 h-16 overflow-y-auto leading-relaxed">
              {patchLog ||
                "System nominal. Awaiting manual input or system scan..."}
            </div>

            <form className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Start Locus"
                  value={startCoord}
                  disabled={gameState !== "RUNNING" || gcBuffActive}
                  onChange={(e) => setStartCoord(e.target.value)}
                  className="w-1/2 bg-slate-800 border-slate-600 text-white text-sm p-2 rounded disabled:opacity-50 outline-none focus:border-sky-500"
                />
                <input
                  type="number"
                  placeholder="End Locus"
                  value={endCoord}
                  disabled={gameState !== "RUNNING" || gcBuffActive}
                  onChange={(e) => setEndCoord(e.target.value)}
                  className="w-1/2 bg-slate-800 border-slate-600 text-white text-sm p-2 rounded disabled:opacity-50 outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex gap-2">
                {/* THE NEW SCANNER BUTTON */}
                <button
                  type="button"
                  onClick={handleScanGenome}
                  disabled={gameState !== "RUNNING" || gcBuffActive}
                  className="w-1/2 bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white font-bold p-2 rounded text-sm transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  🔍 Quick-Scan
                </button>

                {/* THE EXISTING COMPILE BUTTON */}
                <button
                  type="submit"
                  onClick={handleApplyPatch}
                  disabled={gameState !== "RUNNING" || gcBuffActive}
                  className="w-1/2 bg-sky-600 hover:bg-sky-500 text-slate-900 font-bold p-2 rounded text-sm transition-all disabled:opacity-50"
                >
                  Compile Patch
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="flex-[2] min-w-[400px] flex flex-col gap-6">
          <div
            className={`p-4 rounded-lg border flex justify-between items-center ${gameState === "SUCCESS" ? "bg-emerald-950 border-emerald-500" : gameState === "FAILED" ? "bg-rose-950 border-rose-500" : "bg-slate-800 border-sky-600"}`}
          >
            <div>
              <p className="text-xl font-mono">
                Target:{" "}
                <strong className="text-white">{activeContract?.target}</strong>
                <span className="text-slate-400 mx-3">|</span>
                Current:{" "}
                <strong
                  className={
                    currentPop >= activeContract?.target
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }
                >
                  {currentPop}
                </strong>
              </p>
            </div>
            <div className="text-right font-mono bg-slate-950 p-2 rounded border border-slate-700">
              <p className="text-2xl font-bold text-sky-400">
                {currentHour}h{" "}
                <span className="text-slate-500 text-lg">/ 24h</span>
              </p>
            </div>
          </div>

          <div className="flex-grow bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
            <h2 className="text-lg font-bold mb-4 text-slate-300">
              Biomass Trajectory
            </h2>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="hour"
                    domain={[0, 24]}
                    type="number"
                    stroke="#94a3b8"
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      color: "#e2e8f0",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="population"
                    stroke={
                      currentPop >
                      (historicalData[historicalData.length - 2]?.population ||
                        0)
                        ? "#38bdf8"
                        : "#f43f5e"
                    }
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

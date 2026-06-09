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
  Crosshair,
  Info,
  CheckCircle2,
  Coins,
  Trophy,
  Lock,
  X,
  FileText,
  Skull,
  Zap,
  Clock,
  RotateCcw,
} from "lucide-react";

const CONTRACTS = [
  {
    id: "c1",
    title: "Urban Waste Crisis",
    strainKey: "ecoli",
    target: 1500,
    substrate: "Glucose",
    reward: 600,
    desc: "The city's primary organic waste digester is offline. Cultivate E. coli rapidly to process the backlog.",
    intel:
      "Found naturally in the mammalian lower intestine. Thrives at standard human body temperature (37°C) and neutral acidity (pH 7).",
  },
  {
    id: "c2",
    title: "Acid Mine Drainage",
    strainKey: "a_ferrooxidans",
    target: 1300,
    substrate: "Ferrous Iron",
    reward: 1400,
    desc: "Toxic runoff from an abandoned mine is threatening the water table. Deploy this strain to oxidize the iron.",
    intel:
      "An extreme acidophile discovered in dark, cool caves. It requires a highly acidic environment (pH 2) and cool temps (30°C).",
  },
  {
    id: "c3",
    title: "Marine Oil Spill",
    strainKey: "a_borkumensis",
    target: 2200,
    substrate: "Crude Oil",
    reward: 2800,
    desc: "A tanker leak has coated a local reef in crude oil. We need a massive biomass deployed immediately.",
    intel:
      "A marine bacterium. Prefers slightly alkaline ocean water (pH 7.5) and moderate, warm oceanic temperatures (30°C).",
  },
  {
    id: "c4",
    title: "Plastisphere Cleanup",
    strainKey: "i_sakaiensis",
    target: 1900,
    substrate: "PET Plastic",
    reward: 1800,
    desc: "A massive accumulation of PET plastic has been detected. Engineer a controlled bloom to break down the polymers.",
    intel:
      "Discovered outside a bottle recycling facility. Prefers standard ambient room temperatures (30°C) and a near-neutral pH (7.2).",
  },
  {
    id: "c5",
    title: "Nuclear Site Reclamation",
    strainKey: "d_radiodurans",
    target: 900,
    substrate: "Organic Waste",
    reward: 6000,
    desc: "Radiation levels make standard cleanup impossible. Cultivate this extremophile to digest waste in the irradiated zone.",
    intel:
      "One of the most radiation-resistant organisms known. Highly adaptable, but prefers moderate heat (30°C) and neutral conditions (pH 7).",
  },
];

export default function BioForgeGame() {
  const [gameState, setGameState] = useState("MENU"); // MENU, COUNTDOWN, RUNNING, EVALUATE, SUCCESS, FAILED, SUMMARY
  const [gameMode, setGameMode] = useState("EASY");
  const [activeContract, setActiveContract] = useState(null);
  const [bacteriaCatalog, setBacteriaCatalog] = useState({});
  const [countdown, setCountdown] = useState(3);

  // PROGRESS, METRICS & METADATA STATE TRACKERS
  const [completedContracts, setCompletedContracts] = useState([]);
  const [hardcoreClears, setHardcoreClears] = useState([]); // Tracks contract IDs completed in Hardcore
  const [credits, setCredits] = useState(400);
  const [totalPlayTime, setTotalPlayTime] = useState(0); // In real seconds
  const [milestoneType, setMilestoneType] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // SIMULATION CYCLE ENGINE VARIABLES
  const [currentHour, setCurrentHour] = useState(0);
  const [realTimeLeft, setRealTimeLeft] = useState(48);
  const [historicalData, setHistoricalData] = useState([]);
  const [currentPop, setCurrentPop] = useState(10);

  // INTERFACE SLIDERS & SYSTEMS
  const [suhu, setSuhu] = useState(37);
  const [ph, setPh] = useState(7.0);
  const [nutrients, setNutrients] = useState(100);
  const [crisisActive, setCrisisActive] = useState(false);
  const [crisisType, setCrisisType] = useState("");
  const [startCoord, setStartCoord] = useState("");
  const [endCoord, setEndCoord] = useState("");
  const [patchLog, setPatchLog] = useState("");
  const [gcBuffActive, setGcBuffActive] = useState(false);

  const [driftOffset, setDriftOffset] = useState(0);
  const [starvationMode, setStarvationMode] = useState(false);

  const isHardcoreUnlocked = completedContracts.length >= 3;

  const slidersRef = useRef({ suhu, ph, nutrients });
  useEffect(() => {
    slidersRef.current = { suhu, ph, nutrients };
  }, [suhu, ph, nutrients]);

  // Fetch Bacterial Specs Catalog
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL.replace(/\/$/, "");
    axios
      .get(`${apiBase}/bacteria`)
      .then((res) => setBacteriaCatalog(res.data))
      .catch((err) => console.error("API Offline:", err));
  }, []);

  // GLOBAL METRIC TRACKER: Clock updates play time whenever simulation engine status runs active
  useEffect(() => {
    let globalTimer = null;
    if (gameState === "RUNNING") {
      globalTimer = setInterval(() => {
        setTotalPlayTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(globalTimer);
  }, [gameState]);

  const currentStrain =
    activeContract && bacteriaCatalog[activeContract.strainKey]
      ? bacteriaCatalog[activeContract.strainKey]
      : { name: "Loading...", optimal_temp: 37, optimal_ph: 7.0 };

  const handleAcceptContract = (contract) => {
    if (completedContracts.includes(contract.id)) return;
    setActiveContract(contract);

    if (gameMode === "HARDCORE") {
      setSuhu(15);
      setPh(4.5);
      setNutrients(60);
    } else {
      setSuhu(28);
      setPh(6.0);
      setNutrients(110);
    }

    setDriftOffset(0);
    setStarvationMode(false);
    setGameState("COUNTDOWN");
    setCountdown(3);
  };

  const handleScanGenome = async (e) => {
    e.preventDefault();
    if (gameState !== "RUNNING" || gcBuffActive || currentHour < 8) return;

    if (credits < 150) {
      setPatchLog(
        "❌ INSUFFICIENT FUNDS: Real-time network diagnostic sequence requires $150.",
      );
      return;
    }

    setCredits((prev) => Math.max(0, prev - 150));
    setPatchLog(
      "📡 Querying mainframe. Tracking volatile nucleotide chains...",
    );

    try {
      const apiBase = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const res = await axios.get(
        `${apiBase}/bacteria/${activeContract.strainKey}/scan`,
      );
      const { recommended_start, recommended_end, expected_gc } = res.data;

      if (gameMode === "HARDCORE") {
        const currentDrift = Math.floor((Math.random() - 0.5) * 40);
        setDriftOffset(currentDrift);
        setPatchLog(
          `✅ SCAN COMPLETED (-$150 CR): Mutational noise detected. Compensated base coordinates localized: ${recommended_start + currentDrift} - ${recommended_end + currentDrift} (Expected Density: ${expected_gc}%)`,
        );
      } else {
        setDriftOffset(0);
        setPatchLog(
          `✅ SCAN COMPLETED (-$150 CR): Database extraction target located. Extract window: ${recommended_start} - ${recommended_end} (GC Content: ${expected_gc}%)`,
        );
      }
    } catch (err) {
      setPatchLog("❌ SEQUENCE REFRACTION: Connection dropped.");
    }
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
        setCrisisType("");
        setGcBuffActive(false);
        setPatchLog("");
        setStartCoord("");
        setEndCoord("");
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

        if (gameMode === "HARDCORE") {
          setCredits((prev) => {
            if (prev <= 0) {
              setPatchLog(
                "🚨 EMERGENCY POWER SHUTDOWN: Lab credit account balance depleted! System offline.",
              );
              return 0;
            }
            return prev - 8;
          });
        }

        setCurrentHour((prevHour) => {
          const nextHour = prevHour + 1;

          if (nextHour === 8) {
            if (gcBuffActive) {
              setPatchLog(
                "🛡️ ANOMALY SILENCED: Pre-compiled patch insulated system boundaries.",
              );
            } else {
              setCrisisActive(true);
              if (activeContract.strainKey === "a_ferrooxidans") {
                setCrisisType("ACID");
                setPatchLog(
                  "⚠️ pH VALVE CORROSION SHOCK! Acidity regulator jammed basic! Hardware slider frozen!",
                );
                setPh(9.8);
              } else {
                setCrisisType("HEAT");
                setPatchLog(
                  "⚠️ THERMAL REGULATOR MELTDOWN! Core heat spiking rapidly! Hardware slider frozen!",
                );
                setSuhu(59);
              }
            }
          }

          if (
            nextHour === 14 &&
            gameMode === "HARDCORE" &&
            !gcBuffActive &&
            !crisisActive
          ) {
            setCrisisActive(true);
            setCrisisType("HEAT");
            setPatchLog(
              "☣️ SECONDARY ENVIRONMENTAL FLARE: Auxiliary heat exchanger failure! Hardware controls compromised!",
            );
            setSuhu(56);
          }

          const {
            suhu: curSuhu,
            ph: curPh,
            nutrients: curNutrients,
          } = slidersRef.current;
          const optTemp = currentStrain.optimal_temp;
          const optPh = currentStrain.optimal_ph;

          if (gameMode === "HARDCORE") {
            const nutrientConsumptionRate = Math.floor(currentPop * 0.04);
            setNutrients((prevNut) => {
              const calculatedRemaining = prevNut - nutrientConsumptionRate;
              if (calculatedRemaining <= 5) {
                setStarvationMode(true);
                return 0;
              }
              setStarvationMode(false);
              return calculatedRemaining;
            });
          }

          const tempModifier = Math.exp(
            -0.5 * Math.pow((curSuhu - optTemp) / 5.5, 2),
          );
          const phModifier = Math.exp(
            -0.5 * Math.pow((curPh - optPh) / 1.0, 2),
          );

          const baseGrowthVelocity =
            starvationMode && gameMode === "HARDCORE" ? 0.15 : 0.9;
          const r = baseGrowthVelocity * tempModifier * phModifier;
          const K = curNutrients * 20;

          setCurrentPop((prevPop) => {
            let nextPop = prevPop;

            if (crisisType === "HEAT") {
              const maxTempTolerance = gcBuffActive
                ? optTemp + 13
                : optTemp + 6;
              if (curSuhu > maxTempTolerance) {
                const decayMultiplier = gameMode === "HARDCORE" ? 0.4 : 0.2;
                nextPop = Math.max(
                  0,
                  prevPop - Math.round(prevPop * decayMultiplier),
                );
                return nextPop;
              }
            } else if (crisisType === "ACID") {
              const maxPhTolerance = gcBuffActive ? optPh + 3.0 : optPh + 1.8;
              if (Math.abs(curPh - optPh) > maxPhTolerance) {
                const decayMultiplier = gameMode === "HARDCORE" ? 0.4 : 0.2;
                nextPop = Math.max(
                  0,
                  prevPop - Math.round(prevPop * decayMultiplier),
                );
                return nextPop;
              }
            }

            if (starvationMode && gameMode === "HARDCORE") {
              nextPop = Math.max(0, prevPop - Math.round(prevPop * 0.25));
            } else if (
              Math.abs(curPh - optPh) > 3.0 ||
              Math.abs(curSuhu - optTemp) > 18
            ) {
              nextPop = Math.max(0, prevPop - Math.round(prevPop * 0.2));
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
  }, [
    gameState,
    currentStrain,
    gcBuffActive,
    crisisType,
    activeContract,
    currentPop,
    starvationMode,
    gameMode,
  ]);

  useEffect(() => {
    if (gameState === "RUNNING" && gameMode === "HARDCORE" && credits <= 0) {
      setGameState("EVALUATE");
    }
  }, [credits, gameState, gameMode]);

  useEffect(() => {
    if (gameState === "EVALUATE") {
      const isFinanciallyStable = gameMode === "EASY" || credits > 0;

      if (currentPop >= activeContract?.target && isFinanciallyStable) {
        setGameState("SUCCESS");
        if (!completedContracts.includes(activeContract.id)) {
          const updatedContracts = [...completedContracts, activeContract.id];
          setCompletedContracts(updatedContracts);

          // CRITICAL CHANNELS BOOST: 2x cash payout multipliers if cleared in hardcore mode
          const earnedPayout =
            gameMode === "HARDCORE"
              ? activeContract.reward * 2
              : activeContract.reward;
          setCredits((prev) => prev + earnedPayout);

          if (gameMode === "HARDCORE") {
            setHardcoreClears((prev) => [...prev, activeContract.id]);
          }

          if (updatedContracts.length === 3) {
            setMilestoneType("THREE");
            setShowModal(true);
          } else if (updatedContracts.length === CONTRACTS.length) {
            // Trigger endgame instead of traditional popups if campaign finishes
            setGameState("SUMMARY");
          }
        }
      } else {
        setGameState("FAILED");
      }
    }
  }, [
    gameState,
    currentPop,
    activeContract,
    completedContracts,
    credits,
    gameMode,
  ]);

  const handleApplyPatch = async (e) => {
    e.preventDefault();
    if (!startCoord || !endCoord || currentHour < 8) return;
    try {
      setPatchLog("📡 Accessing genomic matrix. Validating nucleotides...");

      const adjustedStart = parseInt(startCoord) - driftOffset;
      const adjustedEnd = parseInt(endCoord) - driftOffset;

      const apiBase = import.meta.env.VITE_API_URL.replace(/\/$/, "");
      const response = await axios.get(
        `${apiBase}/bacteria/${activeContract.strainKey}/sequence`,
        {
          params: { start: adjustedStart, end: adjustedEnd },
        },
      );

      const dna = response.data.sequence.toUpperCase();
      const gcPerc = ((dna.match(/[GC]/g) || []).length / dna.length) * 100;

      if (gcPerc >= 50) {
        setGcBuffActive(true);
        setCrisisActive(false);
        setPatchLog(
          `✅ IMMUNOLOGICAL SUCCESS: Splice contains ${gcPerc.toFixed(1)}% GC. Structural stability locked. Restoring systems.`,
        );

        if (crisisType === "HEAT") setSuhu(currentStrain.optimal_temp);
        if (crisisType === "ACID") setPh(currentStrain.optimal_ph);
        setCrisisType("");
      } else {
        if (gameMode === "HARDCORE") {
          setDriftOffset(
            (prev) => prev + Math.floor((Math.random() - 0.5) * 30),
          );
          setPatchLog(
            `❌ SPLICE ABORTED: Density only ${gcPerc.toFixed(1)}%. Core rejection triggered secondary shift drift! Adjust targets.`,
          );
        } else {
          setPatchLog(
            `❌ SPLICE ABORTED: Density only ${gcPerc.toFixed(1)}%. Sequence too weak to buffer anomaly.`,
          );
        }
      }
    } catch (err) {
      setPatchLog("❌ STRUCTURAL FAULT: Query link down.");
    }
  };

  // FULL LAB PROFILE SOFT REBOOT ACTION SWITCH
  const handleGlobalSystemReset = () => {
    if (
      window.confirm(
        "⚠️ INSTANCE REBOOT INITIALIZATION: Wipe all active bio-credits, trophy records, and cleared files to reset database?",
      )
    ) {
      setCompletedContracts([]);
      setHardcoreClears([]);
      setCredits(400);
      setTotalPlayTime(0);
      setGameMode("EASY");
      setGameState("MENU");
      setActiveContract(null);
    }
  };

  // ==================== VIEWS LAYER ====================

  // VIEW A: ENDGAME COMPLETE CAMPAIGN PERFORMANCE REPORT SUMMARY
  if (gameState === "SUMMARY") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex items-center justify-center font-sans">
        <div className="max-w-2xl w-full bg-slate-900 border-2 border-amber-500 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Trophy size={180} className="text-amber-400" />
          </div>

          <div className="text-center mb-8 border-b border-slate-800 pb-6">
            <span className="bg-amber-500/10 text-amber-400 font-mono font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/30">
              Lab Diagnostics Final Record
            </span>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight mt-3">
              Campaign Conquered
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              All catalog targets successfully isolated and stabilized.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <p className="text-xs text-slate-500 font-bold uppercase font-mono tracking-wider">
                Total Accumulated Funding
              </p>
              <p className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-2">
                <Coins size={20} /> ${credits.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <p className="text-xs text-slate-500 font-bold uppercase font-mono tracking-wider">
                Total Operations Runtime
              </p>
              <p className="text-2xl font-black text-sky-400 mt-1 flex items-center gap-2">
                <Clock size={20} /> {totalPlayTime}s{" "}
                <span className="text-xs font-normal text-slate-500 lowercase">
                  realtime
                </span>
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <p className="text-xs text-slate-500 font-bold uppercase font-mono tracking-wider">
                Deployments Stabilized
              </p>
              <p className="text-2xl font-black text-white mt-1 font-mono">
                {completedContracts.length} / {CONTRACTS.length}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl border-red-900/40 bg-red-950/5">
              <p className="text-xs text-red-400/70 font-bold uppercase font-mono tracking-wider">
                Hardcore Critical Clear Score
              </p>
              <p className="text-2xl font-black text-red-500 mt-1 font-mono">
                {hardcoreClears.length}{" "}
                <span className="text-xs font-normal text-slate-500 uppercase font-sans">
                  Missions
                </span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
              <Trophy size={14} className="text-amber-400" /> Earned Laboratory
              Credentials
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 bg-slate-900/60 p-2 rounded border border-slate-800">
                <span className="text-xl">📁</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-200">
                    Novice Lab Accession
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Unlocked automatically upon catalog initialization.
                  </p>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 p-2 rounded border transition-all ${hardcoreClears.length >= 3 ? "bg-amber-950/20 border-amber-500/30" : "bg-slate-900/20 border-slate-900 opacity-40"}`}
              >
                <span className="text-xl">🥇</span>
                <div className="text-left">
                  <p
                    className={`text-xs font-bold ${hardcoreClears.length >= 3 ? "text-amber-400" : "text-slate-500"}`}
                  >
                    Veteran Extreme Cultivator
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Requires clearing 3 structural files under severe Hardcore
                    parameters.
                  </p>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 p-2 rounded border transition-all ${hardcoreClears.length === CONTRACTS.length ? "bg-red-950/20 border-red-500/30 animate-pulse" : "bg-slate-900/20 border-slate-900 opacity-40"}`}
              >
                <span className="text-xl">🏆</span>
                <div className="text-left">
                  <p
                    className={`text-xs font-bold ${hardcoreClears.length === CONTRACTS.length ? "text-red-400" : "text-slate-500"}`}
                  >
                    Grandmaster Bio-Engineer
                  </p>
                  <p className="text-[10px] text-slate-500">
                    The ultimate benchmark achievement. Clear 100% of files on
                    Hardcore mode.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setCompletedContracts([]);
              setHardcoreClears([]);
              setCredits(400);
              setTotalPlayTime(0);
              setGameMode("EASY");
              setGameState("MENU");
            }}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <RotateCcw size={16} /> Wipe Campaign Progress & Reboot Array
          </button>
        </div>
      </div>
    );
  }

  // VIEW B: MAIN MISSIONS DASHBOARD SELECT MENU
  if (gameState === "MENU") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-8 flex flex-col items-center justify-center font-sans relative">
        {/* TOP LEFT MASTER SWITCH: Global hard reset trigger hook */}
        <button
          onClick={handleGlobalSystemReset}
          className="absolute top-8 left-8 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-500/40 p-2.5 rounded-lg text-slate-400 hover:text-red-400 transition-all flex items-center gap-2 text-xs font-bold uppercase font-mono"
        >
          <RotateCcw size={14} /> Reset Mainframe
        </button>

        {/* STATS DISPLAYS HEADER */}
        <div className="absolute top-8 right-8 flex gap-4">
          <div className="bg-slate-900 border border-amber-500/40 p-3 rounded-lg shadow-lg flex items-center gap-3">
            <div className="bg-amber-950/60 p-2 rounded-full">
              <Trophy
                className={
                  hardcoreClears.length >= 3
                    ? "text-amber-400 animate-pulse"
                    : "text-slate-600"
                }
                size={22}
              />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                Trophy Tier
              </p>
              <p className="text-xs font-mono font-medium text-slate-300">
                {hardcoreClears.length === CONTRACTS.length
                  ? "🏆 Grandmaster"
                  : hardcoreClears.length >= 3
                    ? "🥇 Veteran"
                    : "📁 Novice"}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-emerald-500/50 p-3 rounded-lg shadow-lg flex items-center gap-3">
            <div className="bg-emerald-950 p-2 rounded-full">
              <Coins className="text-emerald-400" size={22} />
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
        </div>

        <div className="max-w-4xl w-full mt-10">
          <div className="text-center mb-6">
            <h1
              className={`text-5xl font-black tracking-tighter mb-2 ${gameMode === "HARDCORE" ? "text-red-500 animate-pulse" : "text-sky-500"}`}
            >
              BIOFORGE {gameMode === "HARDCORE" && ": HARDCORE"}
            </h1>
            <p className="text-md text-slate-400">
              Tactical Biological Incubation Interface Sandbox
            </p>
          </div>

          {/* CHANNELS MODE SELECT SLIDER */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 mb-6 max-w-sm mx-auto flex gap-2">
            <button
              onClick={() => setGameMode("EASY")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${gameMode === "EASY" ? "bg-sky-600 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              <Zap size={14} /> Easy Mode
            </button>
            <button
              disabled={!isHardcoreUnlocked}
              onClick={() => setGameMode("HARDCORE")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all relative ${
                gameMode === "HARDCORE"
                  ? "bg-red-600 text-white shadow-md font-black"
                  : !isHardcoreUnlocked
                    ? "text-slate-600 cursor-not-allowed opacity-40"
                    : "text-slate-400 hover:text-white"
              }`}
            >
              {!isHardcoreUnlocked && (
                <Lock size={12} className="text-slate-600" />
              )}
              Hardcore Mode
              {!isHardcoreUnlocked && (
                <span className="absolute -bottom-7 right-0 left-0 text-[9px] text-slate-500 text-center lowercase font-normal tracking-tight block">
                  Unlock: clear 3 unique files
                </span>
              )}
            </button>
          </div>

          <div
            className={`border p-5 rounded-lg mb-8 shadow-lg transition-all ${gameMode === "HARDCORE" ? "bg-red-950/10 border-red-900/50" : "bg-slate-900 border-slate-700"}`}
          >
            <h2
              className={`text-lg font-bold mb-2 flex items-center gap-2 ${gameMode === "HARDCORE" ? "text-red-400" : "text-sky-400"}`}
            >
              <Info size={20} /> Operations SOP Directive ({gameMode} MODE)
            </h2>
            {gameMode === "HARDCORE" ? (
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
                <li>
                  <strong>Double Cash Bounty ($x2):</strong> Completing a
                  mission in Hardcore pays out double the listed value.
                </li>
                <li>
                  <strong>Continuous Upkeep ($8/s):</strong> Bank assets decay
                  over execution run cycles.
                </li>
                <li>
                  <strong>Repositioning Noise Drift:</strong> Thermal surges
                  introduce noise distortions into your genome scanner data
                  outputs.
                </li>
              </ul>
            ) : (
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
                <li>
                  <strong>Safe Environments:</strong> Zero system operational
                  upkeep fees and basic single-rate contract payouts.
                </li>
                <li>
                  <strong>Clear Coordinate Ranges:</strong> The diagnostic scan
                  tool yields exact coordinate locations without data refraction
                  noise.
                </li>
              </ul>
            )}
          </div>

          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Crosshair
              className={
                gameMode === "HARDCORE" ? "text-red-400" : "text-sky-400"
              }
            />{" "}
            Missions Registry
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONTRACTS.map((contract) => {
              const isDone = completedContracts.includes(contract.id);
              const isHardCleared = hardcoreClears.includes(contract.id);
              return (
                <div
                  key={contract.id}
                  className={`border rounded-lg p-5 transition-all relative overflow-hidden ${isDone ? "bg-slate-900/50 border-emerald-900 opacity-60 cursor-not-allowed" : "bg-slate-900 border-slate-700 hover:bg-slate-900 cursor-pointer group hover:border-slate-500"}`}
                  onClick={() => handleAcceptContract(contract)}
                >
                  {isDone && (
                    <div className="absolute top-4 right-4 text-emerald-500 flex flex-col items-end gap-0.5 font-black text-xs font-mono tracking-tighter">
                      <span>✓ CLEARED</span>
                      {isHardCleared && (
                        <span className="text-[10px] text-red-400">
                          🔥 HARDCORE BONUS
                        </span>
                      )}
                    </div>
                  )}
                  <h3
                    className={`font-bold text-lg pr-16 ${isDone ? "text-emerald-500" : "text-white group-hover:text-sky-400"}`}
                  >
                    {contract.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">{contract.desc}</p>
                  <div className="bg-slate-950 p-2 rounded text-xs text-slate-300 border border-slate-800 mb-4">
                    <span className="text-emerald-400 font-bold block mb-1">
                      Target Threshold Metrics:
                    </span>
                    {contract.intel}
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-700 pt-3">
                    <span className="text-slate-500 font-mono">
                      Quota: {contract.target} cells
                    </span>
                    {!isDone && (
                      <span className="text-emerald-400 font-bold font-mono">
                        Bounty:{" "}
                        {gameMode === "HARDCORE"
                          ? `$${contract.reward * 2} (x2 Hardcore)`
                          : `$${contract.reward}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STANDARD POPUP LEVEL 3 PROGRESS MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border-2 border-amber-500 max-w-md w-full p-6 rounded-xl shadow-2xl relative text-center">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="bg-amber-950/80 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/50">
                <Trophy className="text-amber-400 animate-bounce" size={36} />
              </div>
              <h2 className="text-2xl font-black text-amber-400 uppercase tracking-tight mb-2">
                🏆 Milestone Achieved 🏆
              </h2>
              <p className="text-slate-200 font-bold mb-3 text-sm font-mono uppercase tracking-wider">
                Trophy Unlocked: Veteran Cultivator
              </p>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Excellent progress. With three operational files successfully
                contained, your account has officially unlocked access to the
                high-attrition <strong>Hardcore Mode</strong> toggle framework.
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-4 rounded-lg transition-all"
              >
                Confirm Credentials
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW C: LIVE GAMEPLAY BIOREACTOR TERMINAL ARRAY
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
          <h1
            className={`text-2xl font-bold m-0 flex items-center gap-2 ${gameMode === "HARDCORE" ? "text-red-500" : "text-sky-400"}`}
          >
            <Activity size={24} /> Bioreactor Operations Console ({gameMode})
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-sm">
            Subject Material: {activeContract?.title}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-slate-950 border border-slate-700 rounded px-3 py-1 font-mono flex items-center gap-2">
            <Coins className="text-emerald-400" size={16} />
            <span className="text-emerald-400 text-sm font-bold">
              ${credits}
            </span>
          </div>
          {gameState === "SUCCESS" || gameState === "FAILED" ? (
            <button
              onClick={() => setGameState("MENU")}
              className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded flex items-center gap-2 font-bold"
            >
              <RefreshCw size={16} /> Secure Deck Exit
            </button>
          ) : (
            <div className="bg-slate-950 px-4 py-2 rounded border border-red-900 text-right font-mono">
              <span className="text-red-400 font-bold animate-pulse text-xs block">
                {gameMode === "HARDCORE"
                  ? "LAB ACCELERATOR DECAYING (-$8/s)"
                  : "SIMULATION MATRIX STABLE"}
              </span>
              <span className="text-slate-400 text-xs">
                Shutdown Window T-Minus: {realTimeLeft}s
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-6 flex items-start gap-3">
        <div className="bg-slate-900 p-2 rounded text-sky-400 mt-0.5">
          <FileText size={18} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">
            Containment Profile Dossier
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            {activeContract?.intel}
          </p>
        </div>
      </div>

      {starvationMode && gameMode === "HARDCORE" && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500 text-amber-400 p-4 rounded-lg flex items-center gap-3 shadow-lg font-mono text-sm animate-pulse">
          <Skull size={20} /> <strong>CRITICAL FAMINE:</strong> Nutrient stores
          depleted! Culture crash underway. Fix Feed Rate loop!
        </div>
      )}

      {gameState === "SUCCESS" && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-lg flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <CheckCircle2 size={32} />
            <div>
              <strong className="block font-bold text-xl uppercase">
                Extraction Success
              </strong>
              Target yield harvested safely. Bounty credited to lab reserves.
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-400">
            +{" "}
            {gameMode === "HARDCORE"
              ? `$${activeContract?.reward * 2} (x2 Bonus)`
              : `$${activeContract?.reward}`}
          </div>
        </div>
      )}

      {gameState === "FAILED" && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500 text-rose-400 p-4 rounded-lg flex items-center gap-4 shadow-lg">
          <AlertTriangle size={32} />
          <div>
            <strong className="block font-bold text-xl uppercase">
              Containment Aborted
            </strong>
            {credits <= 0
              ? "Laboratory account bankruptcy reached."
              : "Bacterial strain reached cellular extinction baseline."}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[320px] flex flex-col gap-6">
          <div
            className={`p-6 rounded-lg shadow-lg border transition-all ${crisisActive ? "bg-red-950/20 border-red-500 shadow-red-500/20" : "bg-slate-800 border-slate-700"}`}
          >
            <h2 className="text-lg font-bold mb-6 border-b border-slate-700 pb-2 text-slate-300">
              Bioreactor Environmental Controls
            </h2>

            <div className="mb-6 relative">
              {crisisActive && crisisType === "HEAT" && (
                <div className="absolute right-0 top-0 bg-red-900 border border-red-400 text-[10px] font-mono px-1 rounded animate-pulse">
                  REGULATOR REGISTRY FROZEN
                </div>
              )}
              <label className="flex items-center gap-2 mb-2 text-sm">
                <Thermometer
                  size={18}
                  className={
                    crisisActive && crisisType === "HEAT"
                      ? "text-red-500 animate-pulse"
                      : "text-rose-500"
                  }
                />
                Bioreactor Heat:{" "}
                <strong
                  className={
                    crisisActive && crisisType === "HEAT"
                      ? "text-red-400"
                      : "text-white"
                  }
                >
                  {suhu}°C
                </strong>
              </label>
              <input
                type="range"
                min="0"
                max="60"
                disabled={
                  gameState !== "RUNNING" ||
                  (crisisActive && crisisType === "HEAT")
                }
                value={suhu}
                onChange={(e) => setSuhu(Number(e.target.value))}
                className={`w-full cursor-pointer accent-sky-500 ${crisisActive && crisisType === "HEAT" && "opacity-20 cursor-not-allowed"}`}
              />
            </div>

            <div className="mb-6 relative">
              {crisisActive && crisisType === "ACID" && (
                <div className="absolute right-0 top-0 bg-red-900 border border-red-400 text-[10px] font-mono px-1 rounded animate-pulse">
                  pH CONTROL VALUE LOCKED
                </div>
              )}
              <label className="flex items-center gap-2 mb-2 text-sm">
                <Droplet
                  size={18}
                  className={
                    crisisActive && crisisType === "ACID"
                      ? "text-red-400 animate-pulse"
                      : "text-blue-500"
                  }
                />
                Substrate Level:{" "}
                <strong
                  className={
                    crisisActive && crisisType === "ACID"
                      ? "text-red-400"
                      : "text-white"
                  }
                >
                  {ph.toFixed(1)} pH
                </strong>
              </label>
              <input
                type="range"
                min="1"
                max="14"
                step="0.1"
                disabled={
                  gameState !== "RUNNING" ||
                  (crisisActive && crisisType === "ACID")
                }
                value={ph}
                onChange={(e) => setPh(Number(e.target.value))}
                className={`w-full cursor-pointer accent-sky-500 ${crisisActive && crisisType === "ACID" && "opacity-20 cursor-not-allowed"}`}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 text-sm">
                <FlaskConical
                  size={18}
                  className={
                    starvationMode && gameMode === "HARDCORE"
                      ? "text-amber-500 animate-bounce"
                      : "text-emerald-500"
                  }
                />{" "}
                Feed Rate Nutrient Bank:{" "}
                <strong
                  className={
                    starvationMode && gameMode === "HARDCORE"
                      ? "text-amber-400 font-bold"
                      : "text-white"
                  }
                >
                  {nutrients} units
                </strong>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                disabled={gameState !== "RUNNING"}
                value={nutrients}
                onChange={(e) => setNutrients(Number(e.target.value))}
                className="w-full cursor-pointer accent-sky-500"
              />
            </div>
          </div>

          <div
            className={`p-6 rounded-lg border font-mono transition-all relative overflow-hidden ${currentHour < 8 ? "bg-slate-900/40 border-slate-800 opacity-50" : crisisActive && !gcBuffActive ? "bg-red-950 border-red-500 shadow-red-500/20" : "bg-slate-950 border-slate-700"}`}
          >
            {currentHour < 8 && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 text-slate-400 text-center p-4">
                <Lock size={22} className="mb-2 text-slate-600" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Sequencer Enclaved
                </p>
                <p className="text-[10px] text-slate-600 max-w-[220px] mt-0.5">
                  Hardware isolated. Diagnostic arrays offline until mutation
                  spikes disrupt systemic code at Hour 8.
                </p>
              </div>
            )}

            <h3 className="text-sm font-bold flex items-center gap-2 text-sky-400 mb-4">
              🧬 Base Mutation Splice Deck
            </h3>
            <div className="bg-slate-900 p-3 rounded text-xs text-slate-300 border border-slate-800 mb-4 h-20 overflow-y-auto leading-relaxed">
              {patchLog || "Awaiting coordinate window insertion loops..."}
            </div>
            <form className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Start Locus"
                  value={startCoord}
                  disabled={
                    gameState !== "RUNNING" || gcBuffActive || currentHour < 8
                  }
                  onChange={(e) => setStartCoord(e.target.value)}
                  className="w-1/2 bg-slate-800 border-slate-600 text-white text-sm p-2 rounded outline-none"
                />
                <input
                  type="number"
                  placeholder="End Locus"
                  value={endCoord}
                  disabled={
                    gameState !== "RUNNING" || gcBuffActive || currentHour < 8
                  }
                  onChange={(e) => setEndCoord(e.target.value)}
                  className="w-1/2 bg-slate-800 border-slate-600 text-white text-sm p-2 rounded outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleScanGenome}
                  disabled={
                    gameState !== "RUNNING" || gcBuffActive || currentHour < 8
                  }
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold p-2 rounded text-xs transition-all"
                >
                  🔍 Run Scanner ($150)
                </button>
                <button
                  type="submit"
                  onClick={handleApplyPatch}
                  disabled={
                    gameState !== "RUNNING" || gcBuffActive || currentHour < 8
                  }
                  className="w-1/2 bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold p-2 rounded text-xs transition-all"
                >
                  Compile Splice
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="flex-[2] min-w-[400px] flex flex-col gap-6">
          <div
            className={`p-4 rounded-lg border flex justify-between items-center ${gameState === "SUCCESS" ? "bg-emerald-950 border-emerald-500" : gameState === "FAILED" ? "bg-rose-950 border-rose-500" : "bg-slate-800 border-sky-900"}`}
          >
            <p className="text-xl font-mono">
              Quota:{" "}
              <strong className="text-white">{activeContract?.target}</strong>{" "}
              <span className="text-slate-500 mx-2">|</span> Biomass:{" "}
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
            <div className="text-right font-mono bg-slate-950 p-2 rounded border border-slate-700">
              <p className="text-2xl font-bold text-sky-400">
                {currentHour}h{" "}
                <span className="text-slate-500 text-lg">/ 24h</span>
              </p>
            </div>
          </div>

          <div className="flex-grow bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
            <h2 className="text-lg font-bold mb-4 text-slate-300">
              Biomass Growth Vectors
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

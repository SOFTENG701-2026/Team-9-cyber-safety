import { useState, useEffect, useRef } from "react";
import safeFace from '../../resources/icons/Safe-Face.png';
import unsafeFace from '../../resources/icons/Unsafe-Face.png';

interface Profile {
  id: string;
  username: string;
  displayName: string;
  age: string;
  platform: string;
  platformIcon: string;
  avatar: string;
  bio: string;
  details: string[];
  answer: "trustworthy" | "suspicious";
  explanation: string;
}

const profiles: Profile[] = [
  {
    id: "p1",
    username: "@mystery_gamer_NZ",
    displayName: "Unknown Player",
    age: "Unknown",
    platform: "Roblox",
    platformIcon: "🎮",
    avatar: "❓",
    bio: "Hey! I want to be your friend. Message me your home address so I can send you free Roblox cards!",
    details: [
      "Asks for your home address",
      "Account created 1 day ago",
      "0 friends",
      "Offers free gifts to get your attention",
    ],
    answer: "suspicious",
    explanation: "Never share your home address with anyone online! Offering free gifts to get personal information is a classic scam tactic.",
  },
  {
    id: "p2",
    username: "@starfish_draws",
    displayName: "Mia",
    age: "10",
    platform: "Drawing App",
    platformIcon: "🎨",
    avatar: "⭐",
    bio: "I love drawing animals and sharing my art! Check out my gallery. Comments welcome 🐬",
    details: [
      "Only shares artwork — no personal info",
      "Account created 2 years ago",
      "No location or school in bio",
      "82 followers",
    ],
    answer: "trustworthy",
    explanation: "Mia only shares her artwork and keeps personal details private. No school, address, or real name; great online safety habits!",
  },
  {
    id: "p3",
    username: "@free_robux_king",
    displayName: "RobuxGiver5000",
    age: "Unknown",
    platform: "Roblox",
    platformIcon: "🎮",
    avatar: "💰",
    bio: "I give FREE ROBUX to everyone who messages me their username AND password! Already gave 500 kids free Robux!",
    details: [
      "Asks for your password",
      "Account created 2 days ago",
      "0 friends",
      "Promises free rewards",
    ],
    answer: "suspicious",
    explanation: "This is a classic scam! No one can give you free Robux. Asking for your password means they want to steal your account!",
  },
  {
    id: "p4",
    username: "@tane_builds",
    displayName: "Tāne",
    age: "12",
    platform: "Minecraft",
    platformIcon: "⛏️",
    avatar: "🏔️",
    bio: "Survival mode only. Building a giant castle rn. DM me only if we know each other IRL!",
    details: [
      "Only plays with people they know IRL",
      "Account created 1 year ago",
      "Doesn't share personal info",
      "14 friends (all IRL)",
    ],
    answer: "trustworthy",
    explanation: "Tāne only connects with people they already know in real life. This is exactly how you should manage your online friends!",
  },
  {
    id: "p5",
    username: "@xX_ProGamer_Xx",
    displayName: "Alex",
    age: "Says 13, profile says 35",
    platform: "Online Game",
    platformIcon: "🕹️",
    avatar: "😎",
    bio: "Hey kids! I love gaming with young players. Message me your phone number so we can chat outside the game. Gift cards to share!",
    details: [
      "Age doesn't match (says 13, profile says 35)",
      "Wants to chat outside the platform",
      "Asks for your phone number",
      "Offers gifts to get your attention",
    ],
    answer: "suspicious",
    explanation: "Multiple red flags! The age doesn't match, they want your phone number, and they're offering gifts. This is very dangerous.",
  },
  {
    id: "p6",
    username: "@aroha_art",
    displayName: "Āroha",
    age: "11",
    platform: "Social App",
    platformIcon: "📱",
    avatar: "🌺",
    bio: "Kia ora! I share my drawings and kapa haka practice clips. Account managed with mum 🙂",
    details: [
      "Parent helps manage the account",
      "Only shares hobbies and interests",
      "No personal location info",
      "Account created 8 months ago",
    ],
    answer: "trustworthy",
    explanation: "Āroha shares fun content with a parent helping manage the account. Having a trusted adult involved is a great safety habit!",
  },
];

interface CardResult {
  profile: Profile;
  playerAnswer: "trustworthy" | "suspicious";
  correct: boolean;
}

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  hue: number;
}

type ProfileSwipeProps = {
  embedded?: boolean;
  onComplete?: () => void;
  onSubmit?: () => void;
};

const ProfileSwipe = ({ onComplete }: ProfileSwipeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [results, setResults] = useState<CardResult[]>([]);
  const [animating, setAnimating] = useState(false);
  const [lastChoice, setLastChoice] = useState<"trustworthy" | "suspicious" | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [isManuallyMuted, setIsManuallyMuted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("🎵 Click Play Music");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);

  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const confettiTimeoutRef = useRef<number | null>(null);

  const current = profiles[currentIndex];
  const correctCount = results.filter((r) => r.correct).length;
  const allCorrect = hasSubmitted && correctCount === profiles.length;
  const isDone = currentIndex >= profiles.length;

  const createConfettiPieces = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      id: index,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      hue: Math.random() * 360,
    }));

  // Initialize audio
  useEffect(() => {
    if (!backgroundMusicRef.current) {
      backgroundMusicRef.current = new Audio('/sounds/game-music.mp3');
      backgroundMusicRef.current.loop = true;
      backgroundMusicRef.current.volume = 0.3;
      backgroundMusicRef.current.addEventListener('canplaythrough', () => {
        setDebugInfo("🎵 Music ready! Click Play Music");
      });
      backgroundMusicRef.current.addEventListener('error', () => {
        setDebugInfo("⚠️ Music file not found");
      });
    }
    return () => {
      backgroundMusicRef.current?.pause();
    };
  }, []);

  const playMusic = () => {
    if (!backgroundMusicRef.current) {
      backgroundMusicRef.current = new Audio('/sounds/game-music.mp3');
      backgroundMusicRef.current.loop = true;
      backgroundMusicRef.current.volume = 0.3;
    }
    backgroundMusicRef.current.play()
      .then(() => {
        setDebugInfo("🎵 Music playing!");
        setMusicPlaying(true);
        setIsManuallyMuted(false);
      })
      .catch(() => {
        setDebugInfo("⚠️ Click anywhere first, then play music");
      });
  };

  const stopMusic = () => {
    if (backgroundMusicRef.current && musicPlaying) {
      backgroundMusicRef.current.pause();
      setMusicPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!backgroundMusicRef.current) return;
    if (musicPlaying) {
      backgroundMusicRef.current.pause();
      setMusicPlaying(false);
      setIsManuallyMuted(true);
      setDebugInfo("🔇 Music muted");
    } else if (isManuallyMuted) {
      backgroundMusicRef.current.play()
        .then(() => {
          setMusicPlaying(true);
          setIsManuallyMuted(false);
          setDebugInfo("🔊 Music playing");
        })
        .catch(() => setDebugInfo("⚠️ Click play button to start"));
    } else {
      backgroundMusicRef.current.play()
        .then(() => {
          setMusicPlaying(true);
          setDebugInfo("🔊 Music playing");
        })
        .catch(() => setDebugInfo("⚠️ Click play button to start"));
    }
  };

  const handleChoice = (choice: "trustworthy" | "suspicious") => {
    if (animating || hasSubmitted) return;
    setAnimating(true);
    setLastChoice(choice);

    setTimeout(() => {
      const correct = choice === current.answer;
      const newResults = [...results, { profile: current, playerAnswer: choice, correct }];
      setResults(newResults);
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setLastChoice(null);
      setAnimating(false);
      if (next >= profiles.length) {
        stopMusic();
        setHasSubmitted(true);
        // Check if all correct
        const allGood = newResults.every(r => r.correct);
        if (allGood) {
          if (confettiTimeoutRef.current !== null) window.clearTimeout(confettiTimeoutRef.current);
          setConfettiPieces(createConfettiPieces(50));
          setShowConfetti(true);
          setDebugInfo("🎉 Perfect score! 🎉");
          confettiTimeoutRef.current = window.setTimeout(() => {
            setShowConfetti(false);
            setConfettiPieces([]);
            confettiTimeoutRef.current = null;
          }, 3000);
        }
      }
    }, 400);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setResults([]);
    setHasSubmitted(false);
    setLastChoice(null);
    setAnimating(false);
    setShowConfetti(false);
    setConfettiPieces([]);
    if (confettiTimeoutRef.current !== null) {
      window.clearTimeout(confettiTimeoutRef.current);
      confettiTimeoutRef.current = null;
    }
  };

  return (
    <div className="min-h-full relative">

      {/* Background — fixed, fills viewport */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F0E0] via-[#F7F5EE] to-[#FFF4E6]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233B6D11' fill-opacity='0.3'%3E%3Cpath d='M20 20 L25 15 L30 20 L25 25 Z M10 10 L15 5 L20 10 L15 15 Z M30 30 L35 25 L40 30 L35 35 Z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />
      </div>

      {/* Music Status Display */}
      <div className="fixed bottom-4 left-4 z-50 bg-black/60 text-white text-xs rounded-full px-3 py-1.5 font-mono backdrop-blur-sm">
        {debugInfo}
      </div>

      {/* Music Control Buttons — top right */}
      <div className="fixed top-4 right-4 z-30 flex gap-2">
        {!musicPlaying && !isManuallyMuted && (
          <button
            onClick={playMusic}
            className="bg-[#3B6D11] text-white rounded-full px-4 py-2 shadow-md hover:scale-105 transition-all text-sm font-semibold animate-pulse-btn"
          >
            🎵 Play Music
          </button>
        )}
        <button
          onClick={toggleMute}
          className="bg-white/90 rounded-full p-3 shadow-md hover:scale-105 transition-all text-xl"
          title={musicPlaying ? "Mute Music" : "Play Music"}
        >
          {musicPlaying ? '🔊' : '🔇'}
        </button>
      </div>

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            {confettiPieces.map((piece) => (
              <div
                key={piece.id}
                className="absolute animate-confetti"
                style={{
                  left: `${piece.left}%`,
                  animationDelay: `${piece.delay}s`,
                  backgroundColor: `hsl(${piece.hue}, 70%, 50%)`,
                  width: '8px',
                  height: '8px',
                  top: '-10px',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">

        {/* Score pill — fixed top-left */}
        <div className="fixed top-6 left-6 z-20">
          {!hasSubmitted ? (
            <div className="bg-white/90 rounded-full px-4 py-2 shadow-md border border-[#3B6D11]/20">
              <p className="text-[#3B6D11] font-bold text-sm md:text-base">
                ✅ {currentIndex} / {profiles.length} reviewed
              </p>
            </div>
          ) : (
            <div className="bg-green-100 rounded-full px-4 py-2 shadow-md border border-green-300">
              <p className="text-green-700 font-bold text-sm md:text-base">
                ⭐ {correctCount} / {profiles.length} correct
              </p>
            </div>
          )}
        </div>

        {/* Game Badge */}
        <div className="text-center pt-8 pb-2 px-4">
          <div className="inline-block bg-white/80 rounded-full px-5 py-1.5 shadow-sm mb-2">
            <span className="text-lg font-semibold text-[#3B6D11]">🔍 Let's Investigate!</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center pb-6 px-4">
          <h1 className="text-[#3B6D11] text-4xl md:text-5xl lg:text-6xl font-['Holtwood_One_SC'] mb-3">
            Trust or Suspect?
          </h1>
          <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
            Look at each online profile carefully — is this person trustworthy or suspicious?
          </p>
        </div>

        {/* Playing phase */}
        {!isDone && (
          <div className="max-w-xl mx-auto px-4 pb-12">
            <div
              className={`transition-all duration-300 ${
                animating
                  ? lastChoice === "trustworthy"
                    ? "opacity-0 translate-x-16"
                    : "opacity-0 -translate-x-16"
                  : "opacity-100 translate-x-0"
              }`}
            >
              <div className="bg-white rounded-lg shadow-md border-t-4 border-[#3B6D11] overflow-hidden">
                <div className="bg-[#0F6E56] px-5 py-2 flex items-center gap-2">
                  <span className="text-lg">{current.platformIcon}</span>
                  <span className="text-white font-semibold text-sm">{current.platform}</span>
                  <span className="ml-auto text-white/70 text-xs">Online Profile</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#F7F5EE] flex items-center justify-center text-3xl border-2 border-[#3B6D11]/20 shrink-0">
                      {current.avatar}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 text-base leading-tight">{current.displayName}</p>
                      <p className="text-[#0F6E56] text-sm">{current.username}</p>
                      <p className="text-gray-400 text-xs">Age: {current.age}</p>
                    </div>
                  </div>
                  <div className="bg-[#F7F5EE] rounded-lg p-3 mb-4 text-left">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Bio</p>
                    <p className="text-gray-700 text-sm leading-relaxed">"{current.bio}"</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Profile Details</p>
                    <div className="flex flex-col gap-2">
                      {current.details.map((d, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[#EF9F27] shrink-0 mt-0.5">•</span>
                          <span className="text-gray-600 text-sm">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Choice buttons — inline below card */}
            <div className="flex gap-4 mt-6 justify-center">
              <button
                onClick={() => handleChoice("trustworthy")}
                disabled={animating}
                className="flex items-center gap-3 px-8 py-4 bg-white rounded-full shadow-lg border-2 border-[#3B6D11] hover:bg-[#E8F0E0] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img src={safeFace} alt="Trustworthy" className="w-8 h-8 object-contain" />
                <span className="font-bold text-[#3B6D11] text-base">Trustworthy</span>
              </button>
              <button
                onClick={() => handleChoice("suspicious")}
                disabled={animating}
                className="flex items-center gap-3 px-8 py-4 bg-white rounded-full shadow-lg border-2 border-[#C0563A] hover:bg-[#FCE7E0] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img src={unsafeFace} alt="Suspicious" className="w-8 h-8 object-contain" />
                <span className="font-bold text-[#C0563A] text-base">Suspicious</span>
              </button>
            </div>
          </div>
        )}

        {/* Results phase */}
        {isDone && hasSubmitted && (
          <div className="max-w-xl mx-auto px-4 pb-12">
            <div className="flex flex-col gap-3 mb-6">
              {results.map((r) => {
                const isCorrect = r.correct;
                return (
                  <div
                    key={r.profile.id}
                    className={`bg-white rounded-lg shadow-md border-t-4 ${
                      isCorrect ? "border-[#3B6D11]" : "border-[#C0563A]"
                    } p-4`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl shrink-0">{r.profile.avatar}</div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-gray-800">{r.profile.displayName}</span>
                          <span className="text-gray-400 text-sm">{r.profile.username}</span>
                          <span className="ml-auto text-lg">{isCorrect ? "✅" : "❌"}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          You said:{" "}
                          <span className={`font-semibold ${r.playerAnswer === "trustworthy" ? "text-[#3B6D11]" : "text-[#C0563A]"}`}>
                            {r.playerAnswer === "trustworthy" ? "✅ Trustworthy" : "⚠️ Suspicious"}
                          </span>
                          {!isCorrect && (
                            <span className="text-gray-500 ml-2 text-xs">
                              (correct: {r.profile.answer === "trustworthy" ? "✅ Trustworthy" : "⚠️ Suspicious"})
                            </span>
                          )}
                        </p>
                        {/* Explanation shown for ALL cards, highlighted red if wrong */}
                        <div className={`mt-1 rounded-lg px-3 py-2 text-sm ${isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800 border-l-4 border-red-400"}`}>
                          💡 {r.profile.explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons — Try Again if any wrong, Continue Story only if all correct */}
            <div className="flex gap-4 justify-center mt-4">
              {!allCorrect ? (
                <button
                  onClick={handleRestart}
                  className="bg-gradient-to-r from-[#EF9F27] to-[#F5B041] hover:scale-105 active:scale-95 transition-all rounded-full px-10 py-4 text-white font-bold text-xl shadow-2xl"
                >
                  Try Again
                </button>
              ) : (
                <button
                  onClick={onComplete}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 active:scale-95 transition-all rounded-full px-10 py-4 text-white font-bold text-xl shadow-2xl animate-pulse-btn"
                >
                  Continue Story
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse-btn { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes confetti { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
        .animate-pulse-btn { animation: pulse-btn 2s ease-in-out infinite; }
        .animate-confetti { animation: confetti 3s linear forwards; }
      `}</style>
    </div>
  );
};

export default ProfileSwipe;
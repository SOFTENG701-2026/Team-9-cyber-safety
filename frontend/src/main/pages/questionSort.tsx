import { useState, useEffect, useRef } from "react";
import { DragDropProvider } from '@dnd-kit/react';

import SortBox from "../components/question-sort/SortBox.tsx";
import Sortable from "../components/question-sort/Sortable.tsx";

import safeFace from '../../resources/icons/Safe-Face.png';
import unsafeFace from '../../resources/icons/Unsafe-Face.png';

interface SortableItem {
  id: string;
  target: 'middle' | 'safe' | 'unsafe';
  answer: 'safe' | 'unsafe';
  label: string;
  icon: string;
  explanation: string;
}

type QuestionSortProps = {
  embedded?: boolean;
  onSubmit?: () => void;
  onComplete?: () => void;
};

const scenarios: SortableItem[] = [
  { 
    id: 'item-1', 
    target: 'middle', 
    answer: 'safe', 
    label: 'Email from your teacher asking you to bring PE gear tomorrow',
    icon: '📧',
    explanation: 'This is safe - it\'s from a known teacher you trust!'
  },
  { 
    id: 'item-2', 
    target: 'middle', 
    answer: 'unsafe', 
    label: 'Text from unknown number with a link to win a free iPhone',
    icon: '📱',
    explanation: 'Unsafe! Unknown numbers with prize links are common scams.'
  },
  { 
    id: 'item-3', 
    target: 'middle', 
    answer: 'unsafe', 
    label: 'A random person you don\'t know sends a friend request in a game',
    icon: '🎮',
    explanation: 'Unsafe - strangers online could be pretending to be someone else.'
  },
  { 
    id: 'item-4', 
    target: 'middle', 
    answer: 'safe', 
    label: 'Your friend messaged you to hang out',
    icon: '👋',
    explanation: 'Safe! This is a real friend you know.'
  },
  { 
    id: 'item-5', 
    target: 'middle', 
    answer: 'unsafe', 
    label: 'A pop-up says "Your computer has a virus! Call this number now!"',
    icon: '⚠️',
    explanation: 'Scam alert! Real antivirus software never uses scary pop-ups.'
  },
  { 
    id: 'item-6', 
    target: 'middle', 
    answer: 'safe', 
    label: 'Your parent helps you create a strong password for your account',
    icon: '🔒',
    explanation: 'Safe! Parents help keep your online accounts secure.'
  },
];

const QuestionSort = ({ embedded = false, onSubmit, onComplete }: QuestionSortProps) => {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [isManuallyMuted, setIsManuallyMuted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("🎵 Click Play Music");
  const [items, setItems] = useState<SortableItem[]>(() => {
    const shuffled = [...scenarios];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });
  
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

  const middleItems = items.filter(i => i.target === 'middle');
  const leftItems = items.filter(i => i.target === 'safe');
  const rightItems = items.filter(i => i.target === 'unsafe');
  const totalCount = items.length;
  const sortedCount = totalCount - middleItems.length;
  const correctCount = items.filter(item => item.target === item.answer).length;
  const allCorrect = correctCount === totalCount;

  useEffect(() => {
    if (allCorrect && hasSubmitted) {
      setShowConfetti(true);
      setDebugInfo("🎉 Perfect score! 🎉");
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
    }
  }, [allCorrect, hasSubmitted]);

  // Initialize audio
  useEffect(() => {
    if (!embedded && !backgroundMusicRef.current) {
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
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
    };
  }, [embedded]);

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

  const startMusic = () => {
    if (backgroundMusicRef.current && !isManuallyMuted && !hasSubmitted) {
      backgroundMusicRef.current.play()
        .then(() => {
          setMusicPlaying(true);
          setDebugInfo("🎵 Music playing!");
        })
        .catch(() => {});
    }
  };

  const getWrongExplanation = (item: SortableItem) => {
    if (!hasSubmitted) return null;
    if (item.target === item.answer) return null;
    return item.explanation;
  };

  const handleSubmit = () => {
    stopMusic();
    setHasSubmitted(true);
    onSubmit?.();
  };

  const resetGame = () => {
    setHasSubmitted(false);
    setShowConfetti(false);
    
    const shuffled = [...scenarios];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setItems(shuffled.map(item => ({ ...item, target: 'middle' })));
    
    setTimeout(() => {
      if (!isManuallyMuted) {
        startMusic();
      } else {
        setDebugInfo("🔇 Music muted - click speaker to unmute");
      }
    }, 100);
  };

  const getItemStyle = (item: SortableItem) => {
    if (!hasSubmitted) return {};
    
    const isCorrect = item.target === item.answer;
    return {
      backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE',
      borderColor: isCorrect ? '#4CAF50' : '#EF5350',
      borderWidth: '2px',
    };
  };

  const handleComplete = () => {
    if (onComplete) onComplete();
  };

  const toggleMute = () => {
    if (backgroundMusicRef.current) {
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
      } else if (!hasSubmitted) {
        backgroundMusicRef.current.play()
          .then(() => {
            setMusicPlaying(true);
            setDebugInfo("🔊 Music playing");
          })
          .catch(() => setDebugInfo("⚠️ Click play button to start"));
      }
    }
  };

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (hasSubmitted) return;
        if (event.canceled) return;

        const sourceId = event.operation.source?.id;
        const targetId = event.operation.target?.id;

        if (!targetId) return;

        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === sourceId 
              ? { ...item, target: targetId as 'middle' | 'safe' | 'unsafe' } 
              : item
          )
        );
      }}
    >
      <div className={`${embedded ? "h-full" : "min-h-screen"} relative`}>
        
        {/* Fun Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8F0E0] via-[#F7F5EE] to-[#FFF4E6]"></div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233B6D11' fill-opacity='0.3'%3E%3Cpath d='M20 20 L25 15 L30 20 L25 25 Z M10 10 L15 5 L20 10 L15 15 Z M30 30 L35 25 L40 30 L35 35 Z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>

        {/* Music Status Display */}
        <div className="fixed bottom-4 left-4 z-50 bg-black/60 text-white text-xs rounded-full px-3 py-1.5 font-mono backdrop-blur-sm">
          {debugInfo}
        </div>

        {/* Music Control Buttons */}
        <div className="fixed top-4 right-4 z-30 flex gap-2">
          {!musicPlaying && !hasSubmitted && !isManuallyMuted && (
            <button
              onClick={playMusic}
              className="bg-[#3B6D11] text-white rounded-full px-4 py-2 shadow-md hover:scale-105 transition-all text-sm font-semibold animate-pulse"
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

        {/* Confetti effect */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
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
          
          {/* Top Left - Score Display */}
          <div className="fixed top-6 left-6 z-20">
            {!hasSubmitted ? (
              <div className="bg-white/90 rounded-full px-4 py-2 shadow-md border border-[#3B6D11]/20">
                <p className="text-[#3B6D11] font-bold text-sm md:text-base">
                  ✅ {sortedCount} / {totalCount} sorted
                </p>
              </div>
            ) : (
              <div className="bg-green-100 rounded-full px-4 py-2 shadow-md border border-green-300">
                <p className="text-green-700 font-bold text-sm md:text-base">
                  ⭐ {correctCount} / {totalCount} correct
                </p>
              </div>
            )}
          </div>

          {/* Game Badge */}
          <div className="text-center pt-8 pb-2 px-4">
            <div className="inline-block bg-white/80 rounded-full px-5 py-1.5 shadow-sm mb-2">
              <span className="text-lg font-semibold text-[#3B6D11]">🎮 Let's Play!</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center pb-6 px-4">
            <h1 className="text-[#3B6D11] text-4xl md:text-5xl lg:text-6xl font-['Holtwood_One_SC'] mb-3">
              Sort These Out!
            </h1>
            <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
              Help Kōro drag each card to Safe or Unsafe so he can avoid being scammed.
            </p>
          </div>

          {/* Main Game Area - All columns have fixed width */}
          <div className="max-w-7xl mx-auto px-4 py-6 pb-32">
            <div className="flex flex-col lg:flex-row justify-center items-start gap-6 lg:gap-8">
              
              {/* SAFE COLUMN */}
              <div className="w-full lg:w-1/3 flex flex-col items-center">
                <div className="flex items-center gap-3 mb-4">
                  <img src={safeFace} alt="Safe" className="w-12 h-12 md:w-14 md:h-14 object-contain animate-float" />
                  <h2 className="text-[#3B6D11] text-3xl md:text-4xl font-['Holtwood_One_SC']">Safe</h2>
                </div>
                <SortBox id="safe">
                  <div className="w-full min-h-[450px] bg-white/80 rounded-2xl shadow-lg border-2 border-green-200 p-4">
                    <div className="flex flex-col items-center gap-3">
                      {leftItems.length === 0 && !hasSubmitted && (
                        <div className="text-center py-12 text-gray-400">Drop cards here</div>
                      )}
                      {leftItems.map(item => {
                        const explanation = getWrongExplanation(item);
                        const isCorrect = item.target === item.answer;
                        return (
                          <div key={item.id} className="w-full max-w-md relative">
                            <Sortable id={item.id} disabled={hasSubmitted}>
                              <div
                                className="rounded-xl border-2 border-green-400 bg-white shadow-md hover:shadow-lg transition-all cursor-move hover:scale-102"
                                style={getItemStyle(item)}
                              >
                                <div className="p-3 flex items-center gap-3">
                                  <span className="text-2xl">{item.icon}</span>
                                  <p className="text-gray-800 text-sm md:text-base leading-relaxed flex-1">
                                    {item.label}
                                  </p>
                                  {hasSubmitted && (
                                    <span className="text-xl font-bold">
                                      {isCorrect ? '✅' : '❌'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Sortable>
                            {explanation && (
                              <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 translate-x-full hidden xl:block w-48 ml-2">
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded text-xs shadow-md">
                                  <p className="text-yellow-800">💡 {explanation}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SortBox>
              </div>

              {/* MIDDLE COLUMN - Always visible with fixed width */}
              <div className="w-full lg:w-1/3 flex flex-col items-center">
                <div className="w-full min-h-[450px] bg-white/60 rounded-2xl shadow-lg border-2 border-gray-200 p-4">
                  <div className="flex flex-col items-center gap-3">
                    {middleItems.length === 0 && !hasSubmitted && (
                      <div className="text-center py-12 text-gray-400">
                        ✨ All sorted! ✨
                      </div>
                    )}
                    {middleItems.map(item => (
                      <Sortable key={item.id} id={item.id} disabled={hasSubmitted}>
                        <div className="w-full max-w-md rounded-xl border-2 border-gray-300 bg-white shadow-md hover:shadow-lg transition-all cursor-move hover:scale-102">
                          <div className="p-3 flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <p className="text-gray-800 text-sm md:text-base leading-relaxed flex-1">
                              {item.label}
                            </p>
                          </div>
                        </div>
                      </Sortable>
                    ))}
                  </div>
                </div>
              </div>

              {/* UNSAFE COLUMN */}
              <div className="w-full lg:w-1/3 flex flex-col items-center">
                <div className="flex items-center gap-3 mb-4">
                  <img src={unsafeFace} alt="Unsafe" className="w-12 h-12 md:h-14 md:w-14 object-contain animate-shake-slow" />
                  <h2 className="text-[#C0563A] text-3xl md:text-4xl font-['Holtwood_One_SC']">Unsafe</h2>
                </div>
                <SortBox id="unsafe">
                  <div className="w-full min-h-[450px] bg-white/80 rounded-2xl shadow-lg border-2 border-red-200 p-4">
                    <div className="flex flex-col items-center gap-3">
                      {rightItems.length === 0 && !hasSubmitted && (
                        <div className="text-center py-12 text-gray-400">Drop cards here</div>
                      )}
                      {rightItems.map(item => {
                        const explanation = getWrongExplanation(item);
                        const isCorrect = item.target === item.answer;
                        return (
                          <div key={item.id} className="w-full max-w-md relative">
                            <Sortable id={item.id} disabled={hasSubmitted}>
                              <div
                                className="rounded-xl border-2 border-red-400 bg-white shadow-md hover:shadow-lg transition-all cursor-move hover:scale-102"
                                style={getItemStyle(item)}
                              >
                                <div className="p-3 flex items-center gap-3">
                                  <span className="text-2xl">{item.icon}</span>
                                  <p className="text-gray-800 text-sm md:text-base leading-relaxed flex-1">
                                    {item.label}
                                  </p>
                                  {hasSubmitted && (
                                    <span className="text-xl font-bold">
                                      {isCorrect ? '✅' : '❌'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Sortable>
                            {explanation && (
                              <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 -translate-x-full hidden xl:block w-48 ml-2">
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded text-xs shadow-md">
                                  <p className="text-yellow-800">💡 {explanation}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SortBox>
              </div>
            </div>
          </div>

          {/* Submit Button - Shows when all cards are sorted */}
          {!hasSubmitted && middleItems.length === 0 && (
            <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-30 animate-bounce-in">
              <button onClick={handleSubmit} className="bg-gradient-to-r from-[#3B6D11] to-[#5BA32B] hover:scale-105 active:scale-95 transition-all rounded-full px-10 py-4 text-white font-bold text-xl shadow-2xl">
                Submit Answers
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {hasSubmitted && (
            <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-30">
              {!allCorrect ? (
                <button onClick={resetGame} className="bg-gradient-to-r from-[#EF9F27] to-[#F5B041] hover:scale-105 active:scale-95 transition-all rounded-full px-10 py-4 text-white font-bold text-xl shadow-2xl">
                  Try Again
                </button>
              ) : (
                <button onClick={handleComplete} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 active:scale-95 transition-all rounded-full px-10 py-4 text-white font-bold text-xl shadow-2xl animate-pulse">
                  Continue Story
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
        @keyframes shake-slow { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(2deg); } 75% { transform: rotate(-2deg); } }
        @keyframes bounce-in { 0% { transform: translate(-50%, 30px); opacity: 0; } 60% { transform: translate(-50%, -10px); } 100% { transform: translate(-50%, 0); opacity: 1; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes confetti { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-shake-slow { animation: shake-slow 3s ease-in-out infinite; }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        .animate-confetti { animation: confetti 3s linear forwards; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
      `}</style>
    </DragDropProvider>
  );
};

export default QuestionSort;
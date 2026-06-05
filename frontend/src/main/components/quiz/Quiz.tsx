import { Check, X, Lightbulb } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export type Question = {
  question: string;
  options: string[];
  answer: number; // index of correct option
  reasoning?: string; // optional explanation for the answer
  hint?: string; // optional hint for the question
};

type QuizComponentProps = {
  questions: Question[];
  onComplete?: () => void;
};

type QuestionState = {
  attempts: number;
  isCorrect: boolean;
  showHint: boolean;
  selectedAnswer: number | null;
  wrongAnswers: number[];
  lastAnswerWasWrong: boolean; // Track if last submitted answer was wrong
  showFeedback: boolean; // Show feedback after each submission
  revealedCorrectAnswer: boolean; // Show correct answer only after 3 attempts
};

const QuizComponent = ({ questions, onComplete }: QuizComponentProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionStates, setQuestionStates] = useState<QuestionState[]>(() =>
    questions.map(() => ({
      attempts: 0,
      isCorrect: false,
      showHint: false,
      selectedAnswer: null,
      wrongAnswers: [],
      lastAnswerWasWrong: false,
      showFeedback: false,
      revealedCorrectAnswer: false,
    }))
  );
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Music state
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [isManuallyMuted, setIsManuallyMuted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("🎵 Click Play Music");
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

  const currentQuestion = questions[currentIndex];
  const currentState = questionStates[currentIndex];
  const maxAttempts = 3;

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

  const calculateScore = (states: QuestionState[]) => {
    let total = 0;
    for (const state of states) {
      if (state.isCorrect) {
        total += 1;
      }
    }
    return total;
  };

const handleSelect = (selectedIndex: number) => {
  // Don't allow selection if question is already correct or revealed
  if (currentState.isCorrect) return;
  if (currentState.revealedCorrectAnswer) return;
  // Don't allow selecting answers that were already wrong
  if (currentState.wrongAnswers.includes(selectedIndex)) return;
  
  // Allow selecting any valid answer (overwrites previous selection)
  setQuestionStates((prev) => {
    const updated = [...prev];
    updated[currentIndex] = {
      ...currentState,
      selectedAnswer: selectedIndex,
    };
    return updated;
  });
};

  const handleSubmit = () => {
    if (currentState.selectedAnswer === null) return;
    if (currentState.isCorrect) return;
    if (currentState.revealedCorrectAnswer) return;
    
    const isCorrect = currentState.selectedAnswer === currentQuestion.answer;
    const newAttempts = currentState.attempts + 1;
    const isOutOfAttempts = newAttempts >= maxAttempts;
    
    const newWrongAnswers = [...currentState.wrongAnswers];
    if (!isCorrect && !currentState.wrongAnswers.includes(currentState.selectedAnswer)) {
      newWrongAnswers.push(currentState.selectedAnswer);
    }

    setQuestionStates((prev) => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...currentState,
        attempts: newAttempts,
        isCorrect: isCorrect,
        wrongAnswers: newWrongAnswers,
        lastAnswerWasWrong: !isCorrect,
        showFeedback: true,
        revealedCorrectAnswer: isOutOfAttempts && !isCorrect,
      };
      return updated;
    });

    // Update score after state change
    setTimeout(() => {
      setQuestionStates((prevStates) => {
        const newScore = calculateScore(prevStates);
        setScore(newScore);
        return prevStates;
      });
    }, 0);
  };

  const toggleHint = () => {
    setQuestionStates((prev) => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...currentState,
        showHint: !currentState.showHint,
      };
      return updated;
    });
  };

  const handleNext = () => {
    const next = currentIndex + 1;
    if (next < questions.length) {
      setCurrentIndex(next);
    } else {
      if (backgroundMusicRef.current && musicPlaying) {
        backgroundMusicRef.current.pause();
        setMusicPlaying(false);
      }
      setQuizCompleted(true);
    }
  };

  const handleRestart = () => {
    setQuestionStates(
      questions.map(() => ({
        attempts: 0,
        isCorrect: false,
        showHint: false,
        selectedAnswer: null,
        wrongAnswers: [],
        lastAnswerWasWrong: false,
        showFeedback: false,
        revealedCorrectAnswer: false,
      }))
    );
    setCurrentIndex(0);
    setScore(0);
    setQuizCompleted(false);
  };

  const maxPossibleScore = questions.length;
  const scorePercentage = (score / maxPossibleScore) * 100;

  // Results view
  if (quizCompleted) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8F0E0] via-[#F7F5EE] to-[#FFF4E6]" />
        </div>

        <div className="fixed top-4 right-4 z-30 flex gap-2">
          {!musicPlaying && !isManuallyMuted && (
            <button onClick={playMusic} className="bg-[#3B6D11] text-white rounded-full px-4 py-2 shadow-md hover:scale-105 transition-all text-sm font-semibold animate-pulse">
              🎵 Play Music
            </button>
          )}
          <button onClick={toggleMute} className="bg-white/90 rounded-full p-3 shadow-md hover:scale-105 transition-all text-xl">
            {musicPlaying ? '🔊' : '🔇'}
          </button>
        </div>

        <div className="fixed bottom-4 left-4 z-50 bg-black/60 text-white text-xs rounded-full px-3 py-1.5">
          {debugInfo}
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-[#3B6D11] mb-2">Quiz Complete!</h2>
            <p className="text-gray-600 mb-4">You scored {score} out of {maxPossibleScore}</p>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div className="bg-gradient-to-r from-[#3B6D11] to-[#5BA32B] h-3 rounded-full transition-all duration-500" style={{ width: `${scorePercentage}%` }} />
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              {scorePercentage >= 80 ? "🌟 Excellent! You're a cyber safety expert!" :
               scorePercentage >= 60 ? "👍 Good job! Keep learning!" :
               "💪 Keep practicing! You'll get there!"}
            </p>
            
            <div className="flex gap-3 justify-center">
              <button onClick={handleRestart} className="bg-[#EF9F27] hover:bg-[#D48C20] text-white rounded-full px-6 py-2 font-semibold transition-all">
                Try Again
              </button>
              <button onClick={onComplete} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full px-6 py-2 font-semibold transition-all">
                Continue Story
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isCorrect = currentState.isCorrect;
  const remainingAttempts = maxAttempts - currentState.attempts;
  const showWrongFeedback = currentState.showFeedback && currentState.lastAnswerWasWrong && !isCorrect && !currentState.revealedCorrectAnswer;

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F0E0] via-[#F7F5EE] to-[#FFF4E6]" />
      </div>

      {/* Music Controls */}
      <div className="fixed top-4 right-4 z-30 flex gap-2">
        {!musicPlaying && !isManuallyMuted && (
          <button onClick={playMusic} className="bg-[#3B6D11] text-white rounded-full px-4 py-2 shadow-md hover:scale-105 transition-all text-sm font-semibold animate-pulse">
            🎵 Play Music
          </button>
        )}
        <button onClick={toggleMute} className="bg-white/90 rounded-full p-3 shadow-md hover:scale-105 transition-all text-xl">
          {musicPlaying ? '🔊' : '🔇'}
        </button>
      </div>

      <div className="fixed bottom-4 left-4 z-50 bg-black/60 text-white text-xs rounded-full px-3 py-1.5">
        {debugInfo}
      </div>

      {/* Score Display */}
      <div className="fixed top-4 left-4 z-20 bg-white/90 rounded-full px-4 py-2 shadow-md border border-[#3B6D11]/20">
        <p className="text-[#3B6D11] font-bold text-sm">⭐ Score: {score} / {maxPossibleScore}</p>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          {/* Progress */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Question {currentIndex + 1} / {questions.length}</h2>
            <div className="text-sm text-gray-500">Attempts left: {remainingAttempts}</div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <p className="text-xl font-medium text-gray-800">{currentQuestion.question}</p>
          </div>

          {/* Options */}
          <div className="grid gap-3 mb-6">
{currentQuestion.options.map((opt, i) => {
  const isSelected = currentState.selectedAnswer === i;
  const wasWrongAnswer = currentState.wrongAnswers.includes(i);
  const isCorrectAnswer = i === currentQuestion.answer;
  
  // Check if we're still in answering mode (not yet correct, not yet revealed)
  const isAnsweringMode = !currentState.isCorrect && !currentState.revealedCorrectAnswer;
  
  // Determine styling
  let bgClass = "bg-white hover:bg-gray-50 border-gray-200";
  
  // Highlight the currently selected answer - works for ALL attempts while in answering mode
  if (isSelected && isAnsweringMode && !wasWrongAnswer) {
    bgClass = "bg-[#0F6E56] text-white border-[#0F6E56]"; // Dark green background with white text
  }
  // Show green for correct answer when revealed or when correct and submitted
  else if ((currentState.revealedCorrectAnswer || currentState.isCorrect) && isCorrectAnswer) {
    bgClass = "bg-green-100 border-green-500 text-green-800";
  }
  // Show red for wrong answers that were submitted
  else if (wasWrongAnswer && !currentState.isCorrect && !currentState.revealedCorrectAnswer) {
    bgClass = "bg-red-100 border-red-500 text-red-800";
  }
  // Hover state for unselected answers in answering mode
  else if (isAnsweringMode && !isSelected && !wasWrongAnswer) {
    bgClass = "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700";
  }

  const isDisabled = currentState.isCorrect || currentState.revealedCorrectAnswer || wasWrongAnswer;

  return (
    <button
      key={i}
      onClick={() => handleSelect(i)}
      disabled={isDisabled}
      className={`text-left p-3 border-2 rounded-xl transition-all ${bgClass}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-6 h-6 flex items-center justify-center border rounded-full text-sm font-medium transition-all ${
          isSelected && isAnsweringMode && !wasWrongAnswer
            ? 'bg-white text-[#0F6E56] border-white'
            : wasWrongAnswer 
              ? 'border-red-500 text-red-500' 
              : 'border-current'
        }`}>
          {String.fromCharCode(65 + i)}
        </div>
        <div className="flex-1">{opt}</div>
        {((currentState.revealedCorrectAnswer || currentState.isCorrect) && isCorrectAnswer) && <Check className="text-green-500" size={20} />}
        {wasWrongAnswer && !currentState.isCorrect && !currentState.revealedCorrectAnswer && <X className="text-red-500" size={20} />}
      </div>
    </button>
  );
})}
          </div>

          {/* Feedback Message - Shows immediately after wrong answer */}
          {showWrongFeedback && (
            <div className="mb-4 text-sm text-red-600 flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-200">
              <X size={16} /> That's not right. Try again! You have {remainingAttempts} attempt(s) left.
            </div>
          )}

          {/* Success Message */}
          {currentState.isCorrect && (
            <div className="mb-4 text-sm text-green-600 flex items-center gap-2 bg-green-50 p-3 rounded-lg border border-green-200">
              <Check size={16} /> Correct!
            </div>
          )}

          {/* Out of attempts message */}
          {currentState.revealedCorrectAnswer && !currentState.isCorrect && (
            <div className="mb-4 text-sm text-orange-600 flex items-center gap-2 bg-orange-50 p-3 rounded-lg border border-orange-200">
              <span>📚</span> Out of attempts! The correct answer is: {currentQuestion.options[currentQuestion.answer]}
            </div>
          )}

          {/* Hint Button */}
          {!currentState.isCorrect && !currentState.revealedCorrectAnswer && currentQuestion.hint && (
            <button
              onClick={toggleHint}
              className="text-sm text-[#EF9F27] hover:text-[#D48A1A] transition-colors mb-4 flex items-center gap-1"
            >
              <Lightbulb size={16} /> {currentState.showHint ? "Hide Hint" : "Show Hint"}
            </button>
          )}

          {/* Hint Content */}
          {currentState.showHint && currentQuestion.hint && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-lg mb-4 text-sm text-yellow-800">
              💡 Hint: {currentQuestion.hint}
            </div>
          )}

          {/* Reasoning (only shown after correct answer or out of attempts) */}
          {(currentState.isCorrect || currentState.revealedCorrectAnswer) && currentQuestion.reasoning && (
            <div className={`p-4 rounded-xl mb-4 ${currentState.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
              <p className="text-sm text-gray-600">{currentQuestion.reasoning}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            {!currentState.isCorrect && !currentState.revealedCorrectAnswer ? (
              <button
                onClick={handleSubmit}
                disabled={currentState.selectedAnswer === null}
                className="flex-1 bg-[#3B6D11] hover:bg-[#2a540e] text-white rounded-full py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-[#3B6D11] to-[#5BA32B] hover:scale-105 text-white rounded-full py-3 font-semibold transition-all"
              >
                {currentIndex + 1 === questions.length ? "See Results" : "Next Question →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { QuizComponent };
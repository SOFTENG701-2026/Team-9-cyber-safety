"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { History, LogOut } from "lucide-react";
import QuestionSort from "./questionSort.tsx";
import QuestionEmail from "./questionEmail.tsx";
import ProfileSwipe from "./ProfileSwipe.tsx";
import QuizPage from "./quiz.tsx";
import ProgressBar from "../components/progressbar.tsx";

/*
  Visual Novel Framework for Next.js / React
  - Background image per scene
  - Two character slots (left / right)
  - Speaker-aware dialogue box
  - Click dialogue box to advance
  - Optional branching choice overlay (2 buttons)
  - Easy scene-by-scene story authoring
*/

type CharacterSlot = {
  name: string;
  image: string;
  side: "left" | "right";
  color: string;
  speaking?: boolean;
};

type Choice = {
  label: string;
  nextSceneId: string;
};

type Scene = {
  id: string;
  background: string;
  audioSrc?: string;
  left: CharacterSlot;
  right: CharacterSlot;
  speaker: string;
  speakerColor: string;
  dialogue: string;
  nextSceneId?: string;
  choices?: [Choice, Choice];
  pauseAfterText?: boolean;
};

type Story = {
  startSceneId: string;
  scenes: Record<string, Scene>;
};

type VisualNovelPlayerProps = {
  story: Story;
  onEnd?: () => void;
  className?: string;
};

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

function CharacterSprite({
  character,
  dimmed,
}: {
  character: CharacterSlot;
  dimmed?: boolean;
}) {
  const isLeft = character.side === "left";

  return (
    <div
      className={cn(
        "absolute bottom-[22rem] z-10 transition-all duration-300",
        isLeft ? "left-[26.5rem]" : "right-[26.5rem]",
        dimmed ? "scale-[2.0] opacity-100" : "scale-[2.2] opacity-100"
      )}
      style={{ filter: dimmed ? "brightness(0.6)" : "none" }}
    >
      <div className="relative select-none">
        <img
          src={character.image}
          alt={character.name}
          className={cn(
            "h-[220px] w-auto md:h-[280px] drop-shadow-[0_10px_12px_rgba(0,0,0,0.18)]",
            isLeft ? "origin-bottom-left" : "origin-bottom-right"
          )}
          draggable={false}
        />
      </div>
    </div>
  );
}

// 'Speaker' = character name & colour, 'Dialogue' = the actual text content
function DialogueBox({
  speaker,
  speakerColor,
  dialogue,
  onAdvance,
  canAdvance,
  className,
  rightControls,
}: {
  speaker: string;
  speakerColor: string;
  dialogue: string;
  onAdvance: () => void;
  canAdvance: boolean;
  className?: string;
  rightControls?: React.ReactNode;
}) {

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => canAdvance && onAdvance()}
      className={cn(
        "relative group rounded-[28px] border border-white/60 bg-white/85 px-[3rem] py-[1.5rem] text-left shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm outline-none transition",
        canAdvance ? "hover:-translate-y-0.5 active:translate-y-0" : "cursor-default",
        className
      )}
      aria-label="Advance dialogue"
      aria-disabled={!canAdvance}
    >
      <div className="mb-4 flex items-center gap-2">
        <span
          className="rounded-xl px-[1rem] py-[0.5rem] text-[2rem] font-bold text-white shadow-sm"
          style={{ backgroundColor: speakerColor }}
        >
          {speaker}
        </span>
        <div className="ml-auto">
          {rightControls}
        </div>
      </div>
      <p className="max-w-[72ch] text-[2.2rem] leading-[1.35] text-slate-800">
        {dialogue}
      </p>
      <div className="mt-3 text-right text-md font-medium text-slate-400 opacity-0 transition group-hover:opacity-100">
        Click to continue
      </div>
    </div>
  );
}

function ChoiceOverlay({
  choices,
  onPick,
}: {
  choices: [Choice, Choice];
  onPick: (nextSceneId: string) => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[760px] rounded-[28px] border border-white/50 bg-emerald-800 px-5 py-6 shadow-[0_30px_70px_rgba(0,0,0,0.35)] md:px-8 md:py-8">
        <h2 className="mb-8 text-center text-[clamp(1.2rem,2vw,2rem)] font-black uppercase tracking-wide text-white">
          What should you do?
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {choices.map((choice) => (
            <button
              key={choice.label}
              type="button"
              onClick={() => onPick(choice.nextSceneId)}
              className="min-h-[120px] rounded-[22px] bg-[#f3f0e8] px-5 py-5 text-[2rem] font-medium leading-snug text-slate-900 shadow-[0_10px_25px_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VisualNovelPlayer({ story, onEnd, className }: VisualNovelPlayerProps) {
  const [currentSceneId, setCurrentSceneId] = useState(story.startSceneId);
  const [choiceLocked, setChoiceLocked] = useState(false);
  const sceneAudioRef = useRef<HTMLAudioElement | null>(null);

  const [recentNonActivitySceneIds, setRecentNonActivitySceneIds] = useState<string[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const historyBrowseModeRef = useRef(false);

  const [showQuestionSort, setShowQuestionSort] = useState(false);
  const [showQuestionEmail, setShowQuestionEmail] = useState(false);
  const [showQuestionSwipe, setShowQuestionSwipe] = useState(false);
  const [showQuestionQuiz, setShowQuestionQuiz] = useState(false);

  // Progress tracking
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  const totalActivities = 4;

  const completeActivity = (activityId: string) => {
    if (!completedActivities.includes(activityId)) {
      setCompletedActivities([...completedActivities, activityId]);
    }
  };

// Skip to next uncompleted activity
const skipToNextActivity = () => {
  // Close any open modals
  setShowQuestionSort(false);
  setShowQuestionEmail(false);
  setShowQuestionSwipe(false);
  setShowQuestionQuiz(false);
  setShowHistoryPanel(false);
  setChoiceLocked(false);
  
  // Check which activities are already completed
  const isEmailCompleted = completedActivities.includes("email-game");
  const isSortCompleted = completedActivities.includes("sort-game");
  const isSwipeCompleted = completedActivities.includes("swipe-game");
  const isQuizCompleted = completedActivities.includes("quiz");
  
  // Find the next uncompleted activity
  if (!isEmailCompleted) {
    // Jump to email activity (m1-16)
    setCurrentSceneId("m1-16");
  } else if (!isSortCompleted) {
    // Jump to sort/pop-up activity (m2-10)
    setCurrentSceneId("m2-10");
  } else if (!isSwipeCompleted) {
    // Jump to profile swipe activity (m3-19)
    setCurrentSceneId("m3-19");
  } else if (!isQuizCompleted) {
    // Jump to quiz activity (m3-41)
    setCurrentSceneId("m3-41");
  } else {
    // All activities completed, jump to end scene
    setCurrentSceneId("m4-10");
  }
};
  
  const sortTriggerSceneIds = useMemo(() => new Set(["m2-10"]), []);
  const emailTriggerSceneIds = useMemo(() => new Set(["m1-16"]), []);
  const swipeTriggerSceneIds = useMemo(() => new Set(["m3-19"]), []);
  const quizTriggerSceneIds = useMemo(() => new Set(["m3-41"]), []);
  const endTriggerSceneIds = useMemo(() => new Set(["m4-10"]), []);
  const scene = story.scenes[currentSceneId];

  const hasChoices = Boolean(scene?.choices?.length);
  const isChoiceScene = hasChoices && !choiceLocked;

  const currentCharacters = useMemo(() => {
    if (!scene) return null;
    const leftIsSpeaker = scene.left.name === scene.speaker;
    const rightIsSpeaker = scene.right.name === scene.speaker;

    return {
      left: { ...scene.left, speaking: leftIsSpeaker },
      right: { ...scene.right, speaking: rightIsSpeaker },
    };
  }, [scene]);

  const isOverlayOpen =
  showQuestionSort ||
  showQuestionEmail ||
  showQuestionSwipe ||
  showQuestionQuiz;

  useEffect(() => {
  if (!scene || !scene.audioSrc) {
    return;
  }

  // Don't play audio while a game/activity is open
  if (isOverlayOpen) {
    return;
  }

  const sceneAudioSrc = scene.audioSrc;

  if (!sceneAudioRef.current) {
    sceneAudioRef.current = new Audio(sceneAudioSrc);
    sceneAudioRef.current.volume = 0.3;
  }

  const audio = sceneAudioRef.current;

  if (audio.src !== new URL(sceneAudioSrc, window.location.origin).href) {
    audio.src = sceneAudioSrc;
  }

  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});

  return () => {
    audio.pause();
  };
}, [scene, isOverlayOpen]);

  useEffect(() => {
    if (!scene || showHistoryPanel) {
      return;
    }
    const isActivity = sortTriggerSceneIds.has(scene.id) 
      || emailTriggerSceneIds.has(scene.id)
      || swipeTriggerSceneIds.has(scene.id)
      || quizTriggerSceneIds.has(scene.id)
      || endTriggerSceneIds.has(scene.id);

    const isBranching = Boolean(scene.choices?.length);

    if (isActivity || isBranching) {
      const t = setTimeout(() => setRecentNonActivitySceneIds([]), 0);
      return () => clearTimeout(t);
    }
    const historyHeadSceneId = recentNonActivitySceneIds[0];

    if (historyBrowseModeRef.current) { 
      if (historyHeadSceneId === scene.id) {
        historyBrowseModeRef.current = false;
      }
      return;
    }    
    


    const sceneId = scene.id;
    const t = setTimeout(() => {
      setRecentNonActivitySceneIds((prev) => {
        const without = prev.filter((id) => id !== sceneId);
        const next = [sceneId, ...without].slice(0, 5);
        return next;
      });
    }, 0);

    return () => clearTimeout(t);
  }, [scene, recentNonActivitySceneIds, sortTriggerSceneIds, emailTriggerSceneIds, swipeTriggerSceneIds, quizTriggerSceneIds, endTriggerSceneIds, showHistoryPanel]);

  if (!scene || !currentCharacters) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Story not found.
      </div>
    );
  }

  const advance = () => {
    if (showHistoryPanel && recentNonActivitySceneIds[0] === scene.id) {
      setShowHistoryPanel(false);
    }

    if (hasChoices) {
      setChoiceLocked(false);
      return;
    }

    if (scene.nextSceneId) {
      setCurrentSceneId(scene.nextSceneId);
      if (sortTriggerSceneIds.has(scene.id)) {
        setShowQuestionSort(true);
        return;
      } else if (emailTriggerSceneIds.has(scene.id)){
        setShowQuestionEmail(true);
        return;
      } else if (swipeTriggerSceneIds.has(scene.id)){
        setShowQuestionSwipe(true);
        return;
      } else if (quizTriggerSceneIds.has(scene.id)){
        setShowQuestionQuiz(true);
        return;
      } else if (endTriggerSceneIds.has(scene.id)) {
        window.location.href = "/finish";
      }
      return;
    }

    if (!historyBrowseModeRef.current) {
      setRecentNonActivitySceneIds((prev) => {
        const without = prev.filter((id) => id !== scene.id);
        const next = [scene.id, ...without].slice(0, 5);
        return next;
      });
    } else {
      historyBrowseModeRef.current = false;
    }

    onEnd?.();
  };

  const goToScene = (sceneId: string) => {
    historyBrowseModeRef.current = true;
    setCurrentSceneId(sceneId);
  };

  const pickChoice = (nextSceneId: string) => {
    setChoiceLocked(false);
    setTimeout(() => setCurrentSceneId(nextSceneId), 180);
  };

  return (
    <div
      className={cn(
        "relative h-screen w-full overflow-hidden bg-slate-900 text-slate-900",
        className
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${scene.background})` }}
      />

      {/* subtle readability overlay */}
      <div className="absolute inset-0 bg-black/10" />

      <CharacterSprite character={currentCharacters.left} dimmed={!currentCharacters.left.speaking} />
      <CharacterSprite character={currentCharacters.right} dimmed={!currentCharacters.right.speaking} />

      {/* top UI area - optional pause/menu */}
<div className="absolute right-4 top-4 z-20 flex gap-2">
  {/* Skip Scene Button */}
  <button
    onClick={skipToNextActivity}
    className="rounded-2xl bg-orange-500/90 hover:bg-orange-600 px-4 py-1 shadow-sm backdrop-blur-sm transition-all"
    title="Skip to next activity"
  >
    <span className="text-white text-sm font-semibold">⏭ Skip Scene</span>
  </button>
  
  <Link to="/" className="rounded-2xl bg-white/90 px-3 py-1 shadow-sm backdrop-blur-sm">
    <div className="flex items-center gap-1.5">
      <LogOut className="h-6 w-6 text-slate-800" strokeWidth={1.75} />
    </div>
  </Link>
</div>

      {/* dialogue wrapper so we can position the dialog and place the history button inside it */}
<div className="fixed top-4 left-4 z-30">
  <ProgressBar current={completedActivities.length} total={totalActivities} label="Activities" />
</div>

{/* dialogue wrapper */}
<div className="absolute bottom-[4.5rem] left-1/2 z-20 -translate-x-1/2 w-[min(92vw,1220px)]">
  <DialogueBox
          speaker={scene.speaker}
          speakerColor={scene.speakerColor}
          dialogue={scene.dialogue}
          onAdvance={advance}
          canAdvance={!hasChoices}
          className="w-full"
          rightControls={
            recentNonActivitySceneIds.length > 0 ? (
              <div className="pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHistoryPanel((s) => !s);
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-white/90 p-2 shadow-md"
                  aria-label="Open history"
                >
                  <History className="h-6 w-6 text-slate-800" strokeWidth={1.75} />
                </button>

                {showHistoryPanel ? (
                  <div
                    className="absolute left-0 right-0 flex items-end justify-center"
                    style={{ bottom: "calc(100% + 0.5rem)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-end gap-3 w-full max-w-[920px] px-2">
                      {/* Render from oldest (top) to newest (bottom) so newest appears closest to dialog */}
                      {recentNonActivitySceneIds.slice().reverse().map((id) => {
                        const scene = story.scenes[id];
                        if (!scene) return null;
                        return (
                          <div
                            key={id}
                            className={cn(
                              "w-full max-w-[760px] rounded-[20px] border bg-white/90 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-white",
                              currentSceneId === id ? "border-4 border-slate-500 ring-4 ring-slate-200" : "border-white/50"
                            )}
                            role="button"
                            tabIndex={0}
                            onClick={() => goToScene(id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                goToScene(id);
                              }
                            }}
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div className="flex items-start gap-3">
                                <span
                                  className="rounded-xl px-3 py-1 text-sm font-semibold text-white"
                                  style={{ backgroundColor: scene.speakerColor }}
                                >
                                  {scene.speaker}
                                </span>
                                <p className="text-sm leading-snug text-slate-800 max-w-[640px]">{scene.dialogue}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null
          }
        />
      </div>

      {isChoiceScene ? (
        <ChoiceOverlay choices={scene.choices!} onPick={pickChoice} />
      ) : null}

{showQuestionSort ? (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
    <div className="relative h-[min(92vh,980px)] w-[min(96vw,1600px)] overflow-hidden rounded-[32px] border border-white/40 bg-[#F7F5EE] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      {/* Skip Activity Button - ADD THIS */}
      <button
        onClick={() => {
          completeActivity("sort-game");
          setShowQuestionSort(false);
        }}
        className="absolute top-10 right-4 z-50 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-lg"
      >
        ⏭️ Skip Activity
      </button>
      <div className="h-full w-full overflow-auto">
        <QuestionSort
  embedded
  onComplete={() => {
    completeActivity("sort-game");
    setShowQuestionSort(false);
  }}
  onSubmit={() => {}}
/>
      </div>
    </div>
  </div>
) : null}
{showQuestionEmail ? (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
    <div className="relative h-[min(92vh,980px)] w-[min(96vw,1600px)] overflow-hidden rounded-[32px] border border-white/40 bg-[#F7F5EE] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      {/* Skip Activity Button - ADD THIS */}
      <button
        onClick={() => {
          completeActivity("email-game");
          setShowQuestionEmail(false);
        }}
        className="absolute top-10 right-4 z-50 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-lg"
      >
        ⏭️ Skip Activity
      </button>
      <div className="h-full w-full overflow-auto">
        <QuestionEmail
  embedded
  onComplete={() => {
    completeActivity("email-game");
    setShowQuestionEmail(false);
  }}
/>
      </div>
    </div>
  </div>
) : null}
{showQuestionSwipe ? (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
    <div className="relative h-[min(92vh,980px)] w-[min(96vw,1600px)] overflow-hidden rounded-[32px] border border-white/40 bg-[#F7F5EE] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      {/* Skip Activity Button - ADD THIS */}
      <button
        onClick={() => {
          completeActivity("swipe-game");
          setShowQuestionSwipe(false);
        }}
        className="absolute top-10 right-4 z-50 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-lg"
      >
        ⏭️ Skip Activity
      </button>
      <div className="h-full w-full overflow-auto">
        <ProfileSwipe
  embedded
  onComplete={() => {
    completeActivity("swipe-game");
    setShowQuestionSwipe(false);
  }}
/>
      </div>
    </div>
  </div>
) : null}
{showQuestionQuiz ? (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
    <div className="relative h-[min(92vh,980px)] w-[min(96vw,1600px)] overflow-hidden rounded-[32px] border border-white/40 bg-[#F7F5EE] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      {/* Skip Activity Button */}
      <button
        onClick={() => {
          completeActivity("quiz");  // Add this to track quiz completion
          setShowQuestionQuiz(false);
        }}
        className="absolute top-10 right-4 z-50 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-lg"
      >
        ⏭️ Skip Activity
      </button>
      <div className="h-full w-full overflow-auto">
        <QuizPage
          onComplete={() => {
            completeActivity("quiz");  // Add this to track quiz completion
            setShowQuestionQuiz(false);
          }}
        />
      </div>
    </div>
  </div>
) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Story data                                                         */
/* -------------------------------------------------------------------------- */

const Story1: Story = {
  startSceneId: "m1-01",
  scenes: {
    "m1-01": {
      id: "m1-01",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Hi everyone! I'm Kōro. Welcome to my room!",
      nextSceneId: "m1-02",
      audioSrc: "/sounds/k01.mp3"
    },
    "m1-02": {
      id: "m1-02",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Hello, Kōro! And hello to you, the player. I'm the Narrator, and I'm here to help you both learn about staying safe online.",
      nextSceneId: "m1-03",
      audioSrc: "/sounds/n01.mp3",
    },
    "m1-03": {
      id: "m1-03",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Whoa, a narrator? Cool!",
      nextSceneId: "m1-04",
      audioSrc: "/sounds/k02.mp3",
    },
    "m1-04": {
      id: "m1-04",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Kōro, the internet is amazing, but there are people out there who try to trick others. They're called scammers.",
      nextSceneId: "m1-05",
      audioSrc: "/sounds/n02.mp3",
    },
    "m1-05": {
      id: "m1-05",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Scammers? What do they do?",
      nextSceneId: "m1-06",
      audioSrc: "/sounds/k03.mp3",
    },
    "m1-06": {
      id: "m1-06",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "They send fake messages that look real. They want you to click on links or share your passwords. Today, I'm going to teach you how to spot them.",
      nextSceneId: "m1-07",
      audioSrc: "/sounds/n03.mp3",
    },
    "m1-07": {
      id: "m1-07",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Okay, I'm ready to learn!",
      nextSceneId: "m1-08",
      audioSrc: "/sounds/k04.mp3",
    },
    "m1-08": {
      id: "m1-08",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Oh! I remember now. I tried really hard on my maths test last week. I hope I got 100%!",
      nextSceneId: "m1-09",
      audioSrc: "/sounds/k05.mp3",
    },
    "m1-09": {
      id: "m1-09",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Let me check my emails to see if my teacher has sent the results.",
      nextSceneId: "m1-10",
      audioSrc: "/sounds/k06.mp3",
    },
    "m1-10": {
      id: "m1-10",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Hmm... let's see... email from Mum... email from Dad... oh, what's this?",
      nextSceneId: "m1-11",
      audioSrc: "/sounds/k07.mp3",
    },
    "m1-11": {
      id: "m1-11",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Wait, Kōro. Before you open that, let me explain something important.",
      nextSceneId: "m1-12",
      audioSrc: "/sounds/n04.mp3",
    },
    "m1-12": {
      id: "m1-12",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Scammers often send emails that look like they're from real companies or people. They use tricks to make you click.",
      nextSceneId: "m1-13",
      audioSrc: "/sounds/n05.mp3",
    },
    "m1-13": {
      id: "m1-13",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "This one says 'Congratulations! You've won a free iPhone!'",
      nextSceneId: "m1-14",
      audioSrc: "/sounds/k08.mp3",
    },
    "m1-14": {
      id: "m1-14",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "That's a major warning sign, Kōro. If something seems too good to be true, it probably is!",
      nextSceneId: "m1-15",
      audioSrc: "/sounds/n06.mp3",
    },
    "m1-15": {
      id: "m1-15",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "But what if it's real? A free iPhone would be amazing!",
      nextSceneId: "m1-16",
      audioSrc: "/sounds/k09.mp3",
    },
    "m1-16": {
      id: "m1-16",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Let's learn how to spot scam emails before you decide what to do.",
      nextSceneId: "m1-17",
      audioSrc: "/sounds/n07.mp3",
    },
    "m1-17": {
      id: "m1-17",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Wow, I learned a lot from that game! I can see now that the free iPhone email has so many warning signs.",
      nextSceneId: "m1-18",
      audioSrc: "/sounds/k10.mp3",
    },
    "m1-18": {
      id: "m1-18",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "That's right! Let's review what made that email suspicious.",
      nextSceneId: "m1-19",
      audioSrc: "/sounds/n08.mp3",
    },
    "m1-19": {
      id: "m1-19",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "The sender was an unknown email address. The offer was too good to be true. And they wanted Kōro to click a link.",
      nextSceneId: "m1-20",
      audioSrc: "/sounds/n09.mp3",
    },
    "m1-20": {
      id: "m1-20",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "So what should I do with this email?",
      nextSceneId: "m1-choice",
      audioSrc: "/sounds/k11.mp3",
    },
    "m1-choice": {
      id: "m1-choice",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "What do you think Kōro should do?",
      choices: [
        {
          label: "Delete the email and ignore it",
          nextSceneId: "m1-21",
        },
        {
          label: "Click the link to see if it's real",
          nextSceneId: "m1-26",
        },
      ],
      audioSrc: "/sounds/n10.mp3",
    },
    "m1-21": {
      id: "m1-21",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "I'm going to delete this email right now. It's definitely a scam!",
      nextSceneId: "m1-22",
      audioSrc: "/sounds/k12.mp3",
    },
    "m1-22": {
      id: "m1-22",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Excellent choice, Kōro! By not clicking the link, you kept your personal information safe.",
      nextSceneId: "m1-23",
      audioSrc: "/sounds/n11.mp3",
    },
    "m1-23": {
      id: "m1-23",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Phew! That was close. I'm glad I learned about scams before I clicked anything.",
      nextSceneId: "m1-24",
      audioSrc: "/sounds/k13.mp3",
    },
    "m1-24": {
      id: "m1-24",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Real emails from teachers or companies will never ask for your password or personal information through suspicious links.",
      nextSceneId: "m1-25",
      audioSrc: "/sounds/n12.mp3",
    },
    "m1-25": {
      id: "m1-25",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "I should tell my friends about this so they don't get tricked either!",
      nextSceneId: "m1-33",
      audioSrc: "/sounds/k14.mp3",
    },
    "m1-26": {
      id: "m1-26",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Hmm... maybe I should just click it to see what happens. It could be real!",
      nextSceneId: "m1-27",
      audioSrc: "/sounds/k15.mp3",
    },
    "m1-27": {
      id: "m1-27",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Wait, Kōro! That's dangerous!",
      nextSceneId: "m1-28",
      audioSrc: "/sounds/n13.mp3",
    },
    "m1-28": {
      id: "m1-28",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "",
      speakerColor: "#000000",
      dialogue: "(Dramatic pause)",
      nextSceneId: "m1-29",
    },
    "m1-29": {
      id: "m1-29",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Uh oh... I clicked the link and now it's asking for my email password!",
      nextSceneId: "m1-30",
      audioSrc: "/sounds/k16.mp3",
    },
    "m1-30": {
      id: "m1-30",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "This is exactly what scammers want. If you enter your password, they can steal your account, read your emails, and even pretend to be you.",
      nextSceneId: "m1-31",
      audioSrc: "/sounds/n14.mp3",
    },
    "m1-31": {
      id: "m1-31",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Oh no! I won't do that. Let me close this immediately.",
      nextSceneId: "m1-32",
      audioSrc: "/sounds/k17.mp3",
    },
    "m1-32": {
      id: "m1-32",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Good catch! Remember, never click links from unknown senders.",
      nextSceneId: "m1-33",
      audioSrc: "/sounds/n15.mp3",
    },
    "m1-33": {
      id: "m1-33",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "I'm really glad I know how to spot scam emails now. I need to warn my friend Ruru about this too!",
      nextSceneId: "m1-34",
      audioSrc: "/sounds/k18.mp3",
    },
    "m1-34": {
      id: "m1-34",
      background: "/vn/backgrounds/bedroom_koro.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "",
        side: "right",
        color: "",
        image: "/vn/characters/transparent.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "That's a great idea, Kōro. Let's go find Ruru.",
      nextSceneId: "m2-01",
      audioSrc: "/sounds/n16.mp3",
    },
    "m2-01": {
      id: "m2-01",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Hey Ruru! Guess what? I almost got scammed today by a fake email about winning an iPhone!",
      nextSceneId: "m2-02",
      audioSrc: "/sounds/k19.mp3",
    },
    "m2-02": {
      id: "m2-02",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "Whoa, seriously? That's scary! But... actually, something weird just happened to me too.",
      nextSceneId: "m2-03",
      audioSrc: "/sounds/r01.mp3",
    },
    "m2-03": {
      id: "m2-03",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "What happened?",
      nextSceneId: "m2-04",
      audioSrc: "/sounds/k20.mp3",
    },
    "m2-04": {
      id: "m2-04",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "I was just playing Roblox, and suddenly a pop-up appeared on my screen.",
      nextSceneId: "m2-05",
      audioSrc: "/sounds/r02.mp3",
    },
    "m2-05": {
      id: "m2-05",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "What did it say?",
      nextSceneId: "m2-06",
      audioSrc: "/sounds/k21.mp3",
    },
    "m2-06": {
      id: "m2-06",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "It says... 'Congratulations! You've been selected to win 1 MILLION Robux! Click here to claim your prize!'",
      nextSceneId: "m2-07",
      audioSrc: "/sounds/r03.mp3",
    },
    "m2-07": {
      id: "m2-07",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Ruru, that sounds just like the scam I almost fell for!",
      nextSceneId: "m2-08",
      audioSrc: "/sounds/k22.mp3",
    },
    "m2-08": {
      id: "m2-08",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Ruru, don't click anything yet! Pop-up scams are very common, especially on gaming sites.",
      nextSceneId: "m2-09",
      audioSrc: "/sounds/n17.mp3",
    },
    "m2-09": {
      id: "m2-09",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "But 1 million Robux... I could buy anything I want in the game!",
      nextSceneId: "m2-10",
      audioSrc: "/sounds/r04.mp3",
    },
    "m2-10": {
      id: "m2-10",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Let's learn about pop-up scams before you decide what to do.",
      nextSceneId: "m2-11",
      audioSrc: "/sounds/n18.mp3",
    },
    "m2-11": {
      id: "m2-11",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "Okay, I get it now. That pop-up has so many red flags!",
      nextSceneId: "m2-12",
      audioSrc: "/sounds/r05.mp3",
    },
    "m2-12": {
      id: "m2-12",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "What did you notice about it?",
      nextSceneId: "m2-13",
      audioSrc: "/sounds/n19.mp3",
    },
    "m2-13": {
      id: "m2-13",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "It's from a random website, not Roblox. The offer is way too big to be real. And it's asking me to click a link.",
      nextSceneId: "m2-14",
      audioSrc: "/sounds/r06.mp3",
    },
    "m2-14": {
      id: "m2-14",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "So what are you going to do?",
      nextSceneId: "m2-choice",
      audioSrc: "/sounds/k23.mp3",
    },
    "m2-choice": {
      id: "m2-choice",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "What should Ruru do with this pop-up?",
      choices: [
        {
          label: "Close the pop-up",
          nextSceneId: "m2-15",
        },
        {
          label: "Click the 'Claim Prize' button just to see",
          nextSceneId: "m2-20",
        },
      ],
      audioSrc: "/sounds/n20.mp3",
    },
    "m2-15": {
      id: "m2-15",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-happy.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "I'm going to close this pop-up the right way - by using Task Manager to force close my browser!",
      nextSceneId: "m2-16",
      audioSrc: "/sounds/r07.mp3",
    },
    "m2-16": {
      id: "m2-16",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-happy.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Perfect! That's exactly how to handle suspicious pop-ups safely.",
      nextSceneId: "m2-17",
      audioSrc: "/sounds/n21.mp3",
    },
    "m2-17": {
      id: "m2-17",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-happy.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Nice one, Ruru! You didn't let them trick you.",
      nextSceneId: "m2-18",
      audioSrc: "/sounds/k24.mp3",
    },
    "m2-18": {
      id: "m2-18",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-happy.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "And I definitely won't call that fake tech support number either.",
      nextSceneId: "m2-19",
      audioSrc: "/sounds/r08.mp3",
    },
    "m2-19": {
      id: "m2-19",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-happy.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Great job! Real tech support will never contact you through pop-ups.",
      nextSceneId: "m2-28",
      audioSrc: "/sounds/n22.mp3",
    },
    "m2-20": {
      id: "m2-20",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "Maybe I'll just click it... what's the worst that could happen?",
      nextSceneId: "m2-21",
      audioSrc: "/sounds/r09.mp3",
    },
    "m2-21": {
      id: "m2-21",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Ruru, wait! That's very dangerous.",
      nextSceneId: "m2-22",
      audioSrc: "/sounds/n23.mp3",
    },
    "m2-22": {
      id: "m2-22",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      speaker: "",
      speakerColor: "#000000",
      dialogue: "(Dramatic pause)",
      nextSceneId: "m2-23",
    },
    "m2-23": {
      id: "m2-23",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "Oh no... I clicked it and now it's asking for my Roblox password!",
      nextSceneId: "m2-24",
      audioSrc: "/sounds/r10.mp3",
    },
    "m2-24": {
      id: "m2-24",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "If you enter your password, the scammer will steal your account immediately. They can change your password and lock you out forever.",
      nextSceneId: "m2-25",
      audioSrc: "/sounds/n24.mp3",
    },
    "m2-25": {
      id: "m2-25",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "And I've spent so many hours building my world!",
      nextSceneId: "m2-26",
      audioSrc: "/sounds/r11.mp3",
    },
    "m2-26": {
      id: "m2-26",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Close the browser right now, Ruru! Never enter your password on suspicious sites.",
      nextSceneId: "m2-27",
      audioSrc: "/sounds/k25.mp3",
    },
    "m2-27": {
      id: "m2-27",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "That's right, we should never click on random pop ups.",
      nextSceneId: "m2-28",
      audioSrc: "/sounds/n25.mp3",
    },
    "m2-28": {
      id: "m2-28",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-happy.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "Whew! I'm so glad I know how to handle pop-ups now.",
      nextSceneId: "m2-29",
      audioSrc: "/sounds/r12.mp3",
    },
    "m2-29": {
      id: "m2-29",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-happy.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Me too. Hey, I wonder if Āroha knows about online safety too?",
      nextSceneId: "m2-30",
      audioSrc: "/sounds/k26.mp3",
    },
    "m2-30": {
      id: "m2-30",
      background: "/vn/backgrounds/bedroom_ruru.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Ruru",
        side: "right",
        color: "#D69C1E",
        image: "/vn/characters/ruru-happy.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "Let's go find her and check!",
      nextSceneId: "m3-01",
      audioSrc: "/sounds/r13.mp3",
    },
    "m3-01": {
      id: "m3-01",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Hey Āroha! We've been learning about online safety.",
      nextSceneId: "m3-02",
      audioSrc: "/sounds/k27.mp3",
    },
    "m3-02": {
      id: "m3-02",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "Oh, that's cool! Actually... I've been meaning to ask you both about something.",
      nextSceneId: "m3-03",
      audioSrc: "/sounds/a01.mp3",
    },
    "m3-03": {
      id: "m3-03",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "What's up?",
      nextSceneId: "m3-04",
      audioSrc: "/sounds/r14.mp3",
    },
    "m3-04": {
      id: "m3-04",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "I made a new friend on Minecraft last week. We've been building together and they're really nice!",
      nextSceneId: "m3-05",
      audioSrc: "/sounds/a02.mp3",
    },
    "m3-05": {
      id: "m3-05",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "That sounds fun! What's the problem?",
      nextSceneId: "m3-06",
      audioSrc: "/sounds/k28.mp3",
    },
    "m3-06": {
      id: "m3-06",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "Well... yesterday they said their account isn't working. They asked to borrow my account so they could finish their build.",
      nextSceneId: "m3-07",
      audioSrc: "/sounds/a03.mp3",
    },
    "m3-07": {
      id: "m3-07",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "WHAT?!",
      nextSceneId: "m3-08",
      audioSrc: "/sounds/k29.mp3",
    },
    "m3-08": {
      id: "m3-08",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Āroha, this is a very common scam tactic. Please don't share your password!",
      nextSceneId: "m3-09",
      audioSrc: "/sounds/n26.mp3",
    },
    "m3-09": {
      id: "m3-09",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "But they seem so friendly! We've been playing together for days. They even helped me build my house!",
      nextSceneId: "m3-10",
      audioSrc: "/sounds/a04.mp3",
    },
    "m3-10": {
      id: "m3-10",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Āroha, remember what I told you about the email scam? It's the same idea!",
      nextSceneId: "m3-11",
      audioSrc: "/sounds/k30.mp3",
    },
    "m3-11": {
      id: "m3-11",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "Real friends would never ask for your password. Never ever!",
      nextSceneId: "m3-12",
      audioSrc: "/sounds/r15.mp3",
    },
    "m3-12": {
      id: "m3-12",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Let me explain why this is so dangerous:",
      nextSceneId: "m3-13",
      audioSrc: "/sounds/n27.mp3",
    },
    "m3-13": {
      id: "m3-13",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "When someone has your account password, they can:",
      nextSceneId: "m3-14",
      audioSrc: "/sounds/n28.mp3",
    },
    "m3-14": {
      id: "m3-14",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "- Lock you out of your own account,",
      nextSceneId: "m3-15",
      audioSrc: "/sounds/n30.mp3",
    },
    "m3-15": {
      id: "m3-15",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "- Pretend to be you and scam your real friends,",
      nextSceneId: "m3-16",
      audioSrc: "/sounds/n31.mp3",
    },
    "m3-16": {
      id: "m3-16",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "- Spend all your money and points,",
      nextSceneId: "m3-17",
      audioSrc: "/sounds/n32.mp3",
    },
    "m3-17": {
      id: "m3-17",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "- Use your account to break game rules, and you could get banned!",
      nextSceneId: "m3-18",
      audioSrc: "/sounds/n33.mp3",
    },
    "m3-18": {
      id: "m3-18",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-shock.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "I didn't realize it was that serious...",
      nextSceneId: "m3-19",
      audioSrc: "/sounds/a05.mp3",
    },
    "m3-19": {
      id: "m3-19",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-shock.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Let's learn more about who you can trust online.",
      nextSceneId: "m3-20",
      audioSrc: "/sounds/n34.mp3",
    },
    "m3-20": {
      id: "m3-20",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "Okay, I see all the warning signs now.",
      nextSceneId: "m3-21",
      audioSrc: "/sounds/a06.mp3",
    },
    "m3-21": {
      id: "m3-21",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "What did you notice?",
      nextSceneId: "m3-22",
      audioSrc: "/sounds/k31.mp3",
    },
    "m3-22": {
      id: "m3-22",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-thinking.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "They became my friend super fast. They asked for personal information. And they're making excuses about why I can't video call them.",
      nextSceneId: "m3-23",
      audioSrc: "/sounds/a07.mp3",
    },
    "m3-23": {
      id: "m3-23",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "Those are huge red flags!",
      nextSceneId: "m3-24",
      audioSrc: "/sounds/r16.mp3",
    },
    "m3-24": {
      id: "m3-24",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "So what should Āroha do?",
      nextSceneId: "m3-25",
      audioSrc: "/sounds/n35.mp3",
    },
    "m3-25": {
      id: "m3-25",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-worried.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "What's the best response for Āroha?",
      choices: [
        {
          label: "Politely say no and explain that you never share passwords",
          nextSceneId: "m3-26",
        },
        {
          label: "Give them the account just this once, they seem nice",
          nextSceneId: "m3-31",
        },
      ],
      audioSrc: "/sounds/n36.mp3",
    },
    "m3-26": {
      id: "m3-26",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "I'm going to tell them that I never share my password, no matter what.",
      nextSceneId: "m3-27",
      audioSrc: "/sounds/a08.mp3",
    },
    "m3-27": {
      id: "m3-27",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "That's absolutely the right choice!",
      nextSceneId: "m3-28",
      audioSrc: "/sounds/n37.mp3",
    },
    "m3-28": {
      id: "m3-28",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "If they're really my friend, they'll understand. If they get angry, then I'll know they were a scammer.",
      nextSceneId: "m3-29",
      audioSrc: "/sounds/a09.mp3",
    },
    "m3-29": {
      id: "m3-29",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "That's a great way to think about it, Āroha.",
      nextSceneId: "m3-30",
      audioSrc: "/sounds/k32.mp3",
    },
    "m3-30": {
      id: "m3-30",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Remember: Never share your password with anyone except your parents.",
      nextSceneId: "m3-38",
      audioSrc: "/sounds/n38.mp3",
    },
    "m3-31": {
      id: "m3-31",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "Maybe I can trust them just this once...",
      nextSceneId: "m3-32",
      audioSrc: "/sounds/a10.mp3",
    },
    "m3-32": {
      id: "m3-32",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Āroha, that's very risky!",
      nextSceneId: "m3-33",
      audioSrc: "/sounds/n39.mp3",
    },
    "m3-33": {
      id: "m3-33",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-thinking.png",
      },
      speaker: "",
      speakerColor: "#000000",
      dialogue: "(Dramatic pause)",
      nextSceneId: "m3-34",
    },
    "m3-34": {
      id: "m3-34",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-shock.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "I gave them my password... and now I can't log in!",
      nextSceneId: "m3-35",
      audioSrc: "/sounds/a11.mp3",
    },
    "m3-35": {
      id: "m3-35",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-shock.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Oh no! They changed your password, didn't they?",
      nextSceneId: "m3-36",
      audioSrc: "/sounds/k33.mp3",
    },
    "m3-36": {
      id: "m3-36",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-shock.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "Yes! I'm locked out of my own account!",
      nextSceneId: "m3-37",
      audioSrc: "/sounds/a12.mp3",
    },
    "m3-37": {
      id: "m3-37",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-shock.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-shock.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "This is what happens when you share passwords with strangers. They will steal your account immediately. We should never share our account with strangers.",
      nextSceneId: "m3-38",
      audioSrc: "/sounds/n40.mp3",
    },
    "m3-38": {
      id: "m3-38",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "I'm so glad I know better now. I'll never share my password with anyone again.",
      nextSceneId: "m3-39",
      audioSrc: "/sounds/a13.mp3",
    },
    "m3-39": {
      id: "m3-39",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-idle.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "And if someone asks, that's a huge warning sign!",
      nextSceneId: "m3-40",
      audioSrc: "/sounds/k34.mp3",
    },
    "m3-40": {
      id: "m3-40",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "We should make a list of online safety rules to remember.",
      nextSceneId: "m3-41",
      audioSrc: "/sounds/r17.mp3",
    },
    "m3-41": {
      id: "m3-41",
      background: "/vn/backgrounds/half.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-thinking.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-idle.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "That's a wonderful idea!",
      nextSceneId: "m4-01",
      audioSrc: "/sounds/n41.mp3",
    },
    "m4-01": {
      id: "m4-01",
      background: "/vn/backgrounds/lounge.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Okay, let's review everything we learned today!",
      nextSceneId: "m4-02",
      audioSrc: "/sounds/k35.mp3",
    },
    "m4-02": {
      id: "m4-02",
      background: "/vn/backgrounds/lounge.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-happy.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "We learned about scam emails that pretend to be from real companies.",
      nextSceneId: "m4-03",
      audioSrc: "/sounds/r18.mp3",
    },
    "m4-03": {
      id: "m4-03",
      background: "/vn/backgrounds/lounge.png",
      left: {
        name: "Ruru",
        side: "left",
        color: "#D69C1E",
        image: "/vn/characters/ruru-happy.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "We learned about fake pop-ups that offer amazing prizes.",
      nextSceneId: "m4-04",
      audioSrc: "/sounds/a14.mp3",
    },
    "m4-04": {
      id: "m4-04",
      background: "/vn/backgrounds/lounge.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "And we learned about fake friends who try to steal accounts.",
      nextSceneId: "m4-05",
      audioSrc: "/sounds/k36.mp3",
    },
    "m4-05": {
      id: "m4-05",
      background: "/vn/backgrounds/lounge.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "Let me summarize the SAFE method we've been using:",
      nextSceneId: "m4-06",
      audioSrc: "/sounds/n42.mp3",
    },
    "m4-06": {
      id: "m4-06",
      background: "/vn/backgrounds/lounge.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "S - STOP and think before clicking anything",
      nextSceneId: "m4-07",
      audioSrc: "/sounds/n43.mp3",
    },
    "m4-07": {
      id: "m4-07",
      background: "/vn/backgrounds/lounge.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "A - ASK yourself: 'Do I know and trust this person?'",
      nextSceneId: "m4-08",
      audioSrc: "/sounds/n44.mp3",
    },
    "m4-08": {
      id: "m4-08",
      background: "/vn/backgrounds/lounge.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "F - FIND real contact info. Don't use links in messages.",
      nextSceneId: "m4-09",
      audioSrc: "/sounds/n45.mp3",
    },
    "m4-09": {
      id: "m4-09",
      background: "/vn/backgrounds/lounge.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Narrator",
      speakerColor: "#000000",
      dialogue: "E - EVALUATE: If it seems too good to be true, it probably is!",
      nextSceneId: "m4-10",
      audioSrc: "/sounds/n46.mp3",
    },
    "m4-10": {
      id: "m4-10",
      background: "/vn/backgrounds/lounge.png",
      left: {
        name: "Kōro",
        side: "left",
        color: "#5B8E3E",
        image: "/vn/characters/koro-happy.png",
      },
      right: {
        name: "Āroha",
        side: "right",
        color: "#E67AA5",
        image: "/vn/characters/aroha-happy.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "That's such an easy way to remember!",
      nextSceneId: "m4-10",
      audioSrc: "/sounds/k37.mp3",
    },
  },
};

export default function VisualNovelDemo() {
  return <VisualNovelPlayer story={Story1} />;
}

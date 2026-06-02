"use client";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import QuestionSort from "./questionSort.tsx";

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
}: {
  speaker: string;
  speakerColor: string;
  dialogue: string;
  onAdvance: () => void;
  canAdvance: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onAdvance}
      disabled={!canAdvance}
      className={cn(
        "group absolute bottom-[4.5rem] left-1/2 z-20 w-[min(92vw,1220px)] -translate-x-1/2 rounded-[28px] border border-white/60 bg-white/85 px-[3rem] py-[1.5rem] text-left shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm outline-none transition",
        canAdvance ? "hover:-translate-y-0.5 active:translate-y-0" : "cursor-default"
      )}
      aria-label="Advance dialogue"
    >
      <div className="mb-4 inline-flex items-center gap-2">
        <span
          className="rounded-xl px-[1rem] py-[0.5rem] text-[2rem] font-bold text-white shadow-sm"
          style={{ backgroundColor: speakerColor }}
        >
          {speaker}
        </span>
      </div>
      <p className="max-w-[72ch] text-[2.2rem] leading-[1.35] text-slate-800">
        {dialogue}
      </p>
      <div className="mt-3 text-right text-md font-medium text-slate-400 opacity-0 transition group-hover:opacity-100">
        Click to continue
      </div>
    </button>
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
          What should Kōro do?
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
  const [showQuestionSort, setShowQuestionSort] = useState(false);

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

  if (!scene || !currentCharacters) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Story not found.
      </div>
    );
  }

  const advance = () => {
    if (hasChoices) {
      setChoiceLocked(false);
      return;
    }

    if (scene.nextSceneId) {
      setCurrentSceneId(scene.nextSceneId);
      if (scene.id === "ctx1-email-game" || scene.id === "ctx2-popup-game") {
        setShowQuestionSort(true);
        return;
      }
      return;
    }

    onEnd?.();
  };

  const pickChoice = (nextSceneId: string) => {
    setChoiceLocked(true);
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
      <Link to="/" className="absolute right-4 top-4 z-20 rounded-2xl bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-7 w-1.5 rounded-full bg-slate-700" />
          <span className="h-7 w-1.5 rounded-full bg-slate-700" />
        </div>
      </Link>

      <DialogueBox
        speaker={scene.speaker}
        speakerColor={scene.speakerColor}
        dialogue={scene.dialogue}
        onAdvance={advance}
        canAdvance={!hasChoices}
      />

      {isChoiceScene ? (
        <ChoiceOverlay choices={scene.choices!} onPick={pickChoice} />
      ) : null}

{showQuestionSort ? (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
    <div className="relative h-[min(92vh,980px)] w-[min(96vw,1600px)] overflow-hidden rounded-[32px] border border-white/40 bg-[#F7F5EE] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="h-full w-full overflow-auto">
        <QuestionSort
          embedded
          onComplete={() => setShowQuestionSort(false)}
          onSubmit={() => {}}
        />
      </div>
    </div>
  </div>
) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Example story data                                                         */
/* -------------------------------------------------------------------------- */

const exampleStory: Story = {
  startSceneId: "ctx1-email-intro",
  scenes: {
    // Context 1 — suspicious email
    "ctx1-email-intro": {
      id: "ctx1-email-intro",
      background: "/vn/backgrounds/lounge.png",
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
        image: "transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "I tried really hard on my maths test, I hope I got 100%! Let's see if my teacher has emailed me my results.",
      nextSceneId: "ctx1-email-intro2",
    },
    "ctx1-email-intro2": {
      id: "ctx1-email-intro2",
      background: "/vn/backgrounds/lounge.png",
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
        image: "transparent.png",
      },
      speaker: "",
      speakerColor: "",
      dialogue: "(Kōro finds an email that reads: 'Congratulations! You've won a free iPhone! Click the link to claim your prize.')",
      nextSceneId: "ctx1-email-game",
    },
    "ctx1-email-game": {
      id: "ctx1-email-game",
      background: "/vn/backgrounds/lounge.png",
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
        image: "transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "A free iPhone™, wow! I really want one. My classmates will think I am so cool! Maybe I should fill in the form...",
      nextSceneId: "ctx1-email-wrap",
    },
    "ctx1-email-wrap": {
      id: "ctx1-email-wrap",
      background: "/vn/backgrounds/lounge.png",
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
        image: "transparent.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "That email looked real to me, but that's what scammers try to do. I'm glad I didn't click on that link - I have to tell my friend about this!",
      nextSceneId: "ctx2-popup-intro",
    },

    // Context 2 — suspicious pop-up
    "ctx2-popup-intro": {
      id: "ctx2-popup-intro",
      background: "/vn/backgrounds/bedroom.png",
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
      dialogue: "Hey Ruru, I almost got scammed! There was a suspicious email link saying I could win a free phone, but I'm glad I didn't click it. They could have stolen my email and passwords.",
      nextSceneId: "ctx2-popup-game",
    },
    "ctx2-popup-game": {
      id: "ctx2-popup-game",
      background: "/vn/backgrounds/bedroom.png",
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
      dialogue: "Oh that is dangerous, though I wonder if you can help me with this pop up. I was just playing Roblox and it appeared. I'm not sure if it's real, but it says I can win 1 million Robux! I really want it, what do you think?",
      nextSceneId: "ctx2-popup-wrap",
    },
    "ctx2-popup-wrap": {
      id: "ctx2-popup-wrap",
      background: "/vn/backgrounds/bedroom.png",
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
        image: "/vn/characters/ruru-thinking.png",
      },
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "Oh wow, so this pop up was also a scam! I'm glad I closed it straight away without clicking on it - they could have stolen my Roblox account and passwords too!",
      nextSceneId: "ctx2-popup-wrap2",
    },
    "ctx2-popup-wrap2": {
      id: "ctx2-popup-wrap2",
      background: "/vn/backgrounds/bedroom.png",
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
        image: "/vn/characters/ruru-thinking.png",
      },
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "I'm glad we thought about it first before believing it. I wonder if we should warn anyone else about scams before they click on something suspicious...",
      nextSceneId: "ctx3-account-intro",
    },

    // Context 3 — suspicious new friend / account sharing
    "ctx3-account-intro": {
      id: "ctx3-account-intro",
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
      dialogue: "Hey Āroha, Ruru and I got suspicious scam messages but we didn't click on them because they could've stolen our accounts! I think you should be careful if you get a scam message too.",
      nextSceneId: "ctx3-account-intro2",
    },
    "ctx3-account-intro2": {
      id: "ctx3-account-intro2",
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
        image: "/vn/characters/aroha-shock.png",
      },
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "Oh, thanks for warning me. I'm glad I didn't get any suspicious links or pop ups.",
      nextSceneId: "ctx3-account-intro3",
    },
    "ctx3-account-intro3": {
      id: "ctx3-account-intro3",
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
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "Yeah, we should be careful online. Anyway, what are you doing?",
      nextSceneId: "ctx3-account-intro4",
    },
    "ctx3-account-intro4": {
      id: "ctx3-account-intro4",
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
      speaker: "Āroha",
      speakerColor: "#E67AA5",
      dialogue: "I made a new friend on minecraft! But we can't play right now because their account stopped working.",
      nextSceneId: "ctx3-account-intro5",
    },
    "ctx3-account-intro5": {
      id: "ctx3-account-intro5",
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
      dialogue: "They asked to borrow my account so they can finish their building. They said they will be quick and I just need to give them my email and password.",
      nextSceneId: "ctx3-account-intro6",
    },
    "ctx3-account-intro6": {
      id: "ctx3-account-intro6",
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
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Hmm, is it really smart to give them your account?",
      nextSceneId: "ctx3-account-choice",
    },
    "ctx3-account-choice": {
      id: "ctx3-account-choice",
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
      speaker: "Kōro",
      speakerColor: "#5B8E3E",
      dialogue: "Hmm, is it really smart to give them your account?",
      choices: [
        {
          label: "Warn her to stop and think first",
          nextSceneId: "ctx3-path-1",
        },
        {
          label: "Ask if the friend is really trustworthy",
          nextSceneId: "ctx3-path-2",
        },
      ],
    },
    "ctx3-path-1": {
      id: "ctx3-path-1",
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
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "A new online friend is still a stranger. I think it's safer to check first before giving away account details.",
      nextSceneId: "ctx3-path-end",
    },
    "ctx3-path-2": {
      id: "ctx3-path-2",
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
      speaker: "Ruru",
      speakerColor: "#D69C1E",
      dialogue: "Are you sure they are trustworthy? Even if they seem nice, they could still be a scammer trying to steal your account.",
      nextSceneId: "ctx3-path-end",
    },
    "ctx3-path-end": {
      id: "ctx3-path-end",
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
      dialogue: "Hmm, you're right. I shouldn't share my email or password with someone I only just met online. That could give them control of my account.",
      nextSceneId: "ctx4-learning",
    },

    // Context 4 — learning outcomes / wrap-up
    "ctx4-learning": {
      id: "ctx4-learning",
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
      dialogue: "I almost trusted them, but they turned out to be a scammer! Thank you both for warning me before I shared my account details with them. They could have stolen my account and invaded my privacy.",
      nextSceneId: "ctx4-end",
    },
    "ctx4-end": {
      id: "ctx4-end",
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
      dialogue: "No worries, Āroha. We should all be safe online and think twice before sharing information or clicking on suspicious links. It could have been really dangerous if a stranger had control over our private information.",
      nextSceneId: "ctx4-end",
    },
  },
};

export default function VisualNovelDemo() {
  return <VisualNovelPlayer story={exampleStory} />;
}

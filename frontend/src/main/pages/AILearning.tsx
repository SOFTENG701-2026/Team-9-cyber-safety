import { useEffect, useRef, useState } from "react"
import { API_URL } from "../../config"
import HeroBanner from "../components/HeroBanner"

type ChatItem =
  | { kind: "question"; text: string }
  | { kind: "answer"; text: string }
  | { kind: "feedback"; verdict: "correct" | "partial" | "incorrect"; text: string }
  | { kind: "followup-q"; text: string }
  | { kind: "followup-a"; text: string }

type Phase = "loading-question" | "awaiting-answer" | "evaluating" | "showing-feedback" | "asking-followup"

const verdictStyles: Record<"correct" | "partial" | "incorrect", { bg: string; border: string; label: string; emoji: string }> = {
  correct: { bg: "bg-[#E8F4DD]", border: "border-[#3B6D11]", label: "Great job!", emoji: "🎉" },
  partial: { bg: "bg-[#FFF4DA]", border: "border-[#EF9F27]", label: "Almost there", emoji: "🤔" },
  incorrect: { bg: "bg-[#FCE7E0]", border: "border-[#C0563A]", label: "Let's learn together", emoji: "💡" },
}

const AILearning = () => {
  const [chat, setChat] = useState<ChatItem[]>([])
  const [phase, setPhase] = useState<Phase>("loading-question")
  const [currentQuestion, setCurrentQuestion] = useState<string>("")
  const [answer, setAnswer] = useState("")
  const [followup, setFollowup] = useState("")
  const [error, setError] = useState<string | null>(null)
  const askedHistory = useRef<string[]>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const initializedRef = useRef(false)

  const callApi = async (body: object) => {
    const res = await fetch(`${API_URL}/api/ai-learning`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(errBody.error || `Request failed (${res.status})`)
    }
    return res.json()
  }

  const loadNewQuestion = async () => {
    setError(null)
    setPhase("loading-question")
    setAnswer("")
    setFollowup("")
    try {
      const data = await callApi({ mode: "new_question", history: askedHistory.current.slice(-5) })
      if (data.type !== "question" || !data.question) throw new Error("Bad question payload")
      askedHistory.current.push(data.question)
      setCurrentQuestion(data.question)
      setChat((c) => [...c, { kind: "question", text: data.question }])
      setPhase("awaiting-answer")
    } catch (e) {
      setError((e as Error).message)
      setPhase("awaiting-answer")
    }
  }

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadNewQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [chat, phase])

  const submitAnswer = async () => {
    const trimmed = answer.trim()
    if (!trimmed || phase !== "awaiting-answer") return
    setChat((c) => [...c, { kind: "answer", text: trimmed }])
    setAnswer("")
    setPhase("evaluating")
    setError(null)
    try {
      const data = await callApi({ mode: "evaluate", question: currentQuestion, answer: trimmed })
      if (data.type !== "feedback") throw new Error("Bad feedback payload")
      setChat((c) => [...c, { kind: "feedback", verdict: data.verdict, text: data.feedback }])
      setPhase("showing-feedback")
    } catch (e) {
      setError((e as Error).message)
      setPhase("awaiting-answer")
    }
  }

  const submitFollowup = async () => {
    const trimmed = followup.trim()
    if (!trimmed || phase === "evaluating" || phase === "loading-question") return
    setChat((c) => [...c, { kind: "followup-q", text: trimmed }])
    setFollowup("")
    const prevPhase = phase
    setPhase("asking-followup")
    setError(null)
    try {
      const data = await callApi({ mode: "followup", followup: trimmed, question: currentQuestion })
      if (data.type !== "answer") throw new Error("Bad followup payload")
      setChat((c) => [...c, { kind: "followup-a", text: data.answer }])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPhase(prevPhase === "asking-followup" ? "showing-feedback" : prevPhase)
    }
  }

  const inputBusy = phase === "loading-question" || phase === "evaluating" || phase === "asking-followup"

  return (
    <div className="flex flex-col bg-[#F7F5EE] min-h-screen">
      <HeroBanner
        title="AI Learning"
        subtitle="Chat with your AI tutor about staying safe online — answer questions and ask anything you want to know more about!"
      />

      <div className="max-w-3xl w-full mx-auto px-4 md:px-8 py-10 flex flex-col gap-6 flex-1">
        <div
          ref={scrollRef}
          className="bg-white rounded-2xl shadow-md p-4 md:p-6 flex flex-col gap-4 h-[55vh] overflow-y-auto border-t-4 border-[#3B6D11]"
        >
          {chat.length === 0 && phase === "loading-question" && (
            <div className="text-center text-[#3B6D11] mt-8">Getting your first question…</div>
          )}

          {chat.map((item, i) => {
            if (item.kind === "question") {
              return (
                <div key={i} className="self-start max-w-[85%] bg-[#1a8a6a] text-white rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-xs uppercase tracking-wide opacity-80 mb-1 text-white">AI Tutor</p>
                  <p className="text-base leading-relaxed text-white">{item.text}</p>
                </div>
              )
            }
            if (item.kind === "answer" || item.kind === "followup-q") {
              return (
                <div key={i} className="self-end max-w-[85%] bg-[#EF9F27] text-[#0F3B2E] rounded-2xl rounded-tr-sm px-4 py-3">
                  <p className="text-xs uppercase tracking-wide opacity-70 mb-1 text-[#0F3B2E]">You</p>
                  <p className="text-base leading-relaxed text-[#0F3B2E]">{item.text}</p>
                </div>
              )
            }
            if (item.kind === "feedback") {
              const s = verdictStyles[item.verdict]
              return (
                <div key={i} className={`self-start max-w-[85%] ${s.bg} border-l-4 ${s.border} text-[#1f3a0d] rounded-2xl rounded-tl-sm px-4 py-3`}>
                  <p className="text-sm font-semibold mb-1">{s.emoji} {s.label}</p>
                  <p className="text-base leading-relaxed">{item.text}</p>
                </div>
              )
            }
            return (
              <div key={i} className="self-start max-w-[85%] bg-[#1a8a6a] text-white rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="text-xs uppercase tracking-wide opacity-80 mb-1 text-white">AI Tutor</p>
                <p className="text-base leading-relaxed text-white">{item.text}</p>
              </div>
            )
          })}

          {(phase === "loading-question" || phase === "evaluating" || phase === "asking-followup") && chat.length > 0 && (
            <div className="self-start text-[#0F6E56] italic text-sm pl-2">AI is thinking…</div>
          )}
        </div>

        {error && (
          <div className="bg-[#FCE7E0] border-l-4 border-[#C0563A] text-[#7a2a18] rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {phase !== "showing-feedback" ? (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#3B6D11]">Your answer</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitAnswer() }}
                disabled={inputBusy}
                placeholder={phase === "loading-question" ? "Waiting for question…" : "Type your answer here…"}
                className="flex-1 px-4 py-3 rounded-full border-2 border-[#3B6D11] bg-white focus:outline-none focus:ring-2 focus:ring-[#EF9F27] disabled:opacity-60"
              />
              <button
                onClick={submitAnswer}
                disabled={inputBusy || !answer.trim()}
                className="px-6 py-3 rounded-full bg-[#3B6D11] text-white font-semibold hover:bg-[#2d5409] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#3B6D11]">Want to dig deeper? Ask a follow-up</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={followup}
                  onChange={(e) => setFollowup(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitFollowup() }}
                  disabled={inputBusy}
                  placeholder="e.g. Why do scammers ask for my password?"
                  className="flex-1 px-4 py-3 rounded-full border-2 border-[#0F6E56] bg-white focus:outline-none focus:ring-2 focus:ring-[#EF9F27] disabled:opacity-60"
                />
                <button
                  onClick={submitFollowup}
                  disabled={inputBusy || !followup.trim()}
                  className="px-6 py-3 rounded-full bg-[#0F6E56] text-white font-semibold hover:bg-[#0a5a45] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Ask
                </button>
              </div>
            </div>

            <button
              onClick={loadNewQuestion}
              disabled={inputBusy}
              className="self-center px-10 py-3 rounded-full bg-[#EF9F27] text-[#0F3B2E] font-semibold hover:bg-[#D48A1A] disabled:opacity-50 transition-colors mt-2"
            >
              Next Question →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AILearning

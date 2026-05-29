import { Check, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export type Question = {
  question: string;
  options: string[];
  answer: number; // index of correct option
  reasoning?: string; // optional explanation for the answer
};

const QuizComponent = ({ questions }: { questions: Question[] }) => {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const q = questions[index];

  function handleSelect(i: number) {
    if (submitted) return; // lock after submit
    setSelected(i);
  }

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === q.answer) setScore((s) => s + 1);
  }

  function handleNext() {
    const next = index + 1;
    setSubmitted(false);
    setSelected(null);
    if (next < questions.length) setIndex(next);
  }

  function handleRestart() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setSubmitted(false);
  }

  // Results view
  if (index >= questions.length) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Quiz complete</h2>
        <p className="mb-4">You scored {score} of {questions.length}.</p>
        <div className="flex flex-row gap-3">
          <button onClick={handleRestart} className="px-4 py-2 bg-[#EF9F27] hover:bg-[#D48C20] text-white rounded">Restart</button>
          <Link to="/modules" className="px-4 py-2 bg-[#EF9F27] hover:bg-[#D48C20] text-white rounded">Leave Episode</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Question {index + 1} / {questions.length}</h2>
        <div className="text-sm text-gray-600">Score: {score}</div>
      </div>

      <div className="mb-6">
        <p className="text-lg">{q.question}</p>
      </div>

      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = submitted && i === q.answer;
          const isWrong = submitted && isSelected && selected !== q.answer;

          let bg = "bg-white";
          if (isCorrect) bg = "bg-green-100 border-green-500";
          else if (isWrong) bg = "bg-red-100 border-red-500";
          else if (isSelected) bg = "bg-blue-50";

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`text-left p-3 border rounded ${bg} hover:bg-blue-50`}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center border rounded-full text-sm">
                  {String.fromCharCode(65 + i)}
                </div>
                <div>{opt}</div>
                {isCorrect && <Check className="text-green-500" size={20} />}
                {isWrong && <X className="text-red-500" size={20} />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        {!submitted ? (
          <button onClick={handleSubmit} className="px-4 py-2 bg-[#EF9F27] hover:bg-[#D48C20] text-white rounded" disabled={selected === null}>
            Submit
          </button>
        ) : (
          <>
            <div className="flex-1 text-sm text-gray-700">
              {selected === q.answer ? 
                <p className="text-green-500">Correct!</p> 
              : 
                <>
                  <p className="text-red-500">Incorrect — correct answer: {String.fromCharCode(65 + q.answer)}</p>
                  {q.reasoning && <p className="text-sm mt-2 text-red-500">{q.reasoning}</p>}
                </>
              }
            </div>
            {index + 1 < questions.length ? (
              <button onClick={handleNext} className="px-4 py-2 bg-[#EF9F27] hover:bg-[#D48C20] text-white rounded">Next</button>
            ) : (
              <button onClick={() => setIndex(questions.length)} className="px-4 py-2 bg-[#EF9F27] hover:bg-[#D48C20] text-white rounded">See results</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export { QuizComponent };
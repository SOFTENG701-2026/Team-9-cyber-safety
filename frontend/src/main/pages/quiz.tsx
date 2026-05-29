import { QuizComponent, type Question } from "../components/quiz/Quiz";

const quizQuestions: Question[] = [
  {
    question: "Who is the best person to talk to if you have downloaded a suspicious file?",
    options: [
      "Your friend who is good with computers.",
      "Your teacher or a trusted adult.",
      "The person who sent you the file.",
      "Ignore it and hope for the best."
    ],
    answer: 1,
    reasoning: "It's important to talk to a trusted adult or teacher if you encounter something suspicious online. They can help you determine if the file is safe and take appropriate action if it's not."
  },
  {
    question: "What should you do if someone you don't know asks for your password?",
    options: ["Give it to them if they seem nice","Refuse and tell a trusted adult","Change your password later","Share it with friends"],
    answer: 1,
    reasoning: "You should never share your password with anyone, especially someone you don't know. Always refuse and tell a trusted adult if someone asks for your password."
  },
  {
    question: "Which of the following is a strong password?",
    options: ["password123","123456","G!7b#S9x","qwerty"],
    answer: 2,
    reasoning: "A strong password should be a mix of letters, numbers, and special characters. 'G!7b#S9x' is the strongest option among the choices provided."
  }
];

export default function QuizPage() {
  return (
    <div className="flex flex-col items-center bg-[#F7F5EE] min-h-screen py-16">
      <h1 className="text-4xl font-bold text-center mb-8">Module 1 Quiz</h1>
      <QuizComponent questions={quizQuestions} />
    </div>
  );
}
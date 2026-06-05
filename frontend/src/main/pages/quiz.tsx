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
    reasoning: "It's important to talk to a trusted adult or teacher if you encounter something suspicious online. They can help you determine if the file is safe and take appropriate action if it's not.",
    hint: "Think about who you would trust in real life to help you with a serious problem."
  },
  {
    question: "What should you do if someone you don't know asks for your password?",
    options: ["Give it to them if they seem nice", "Refuse and tell a trusted adult", "Change your password later", "Share it with friends"],
    answer: 1,
    reasoning: "You should never share your password with anyone, especially someone you don't know. Always refuse and tell a trusted adult if someone asks for your password.",
    hint: "Would you give your house key to a stranger? Your password is like a key to your online life."
  },
  {
    question: "Which of the following is a strong password?",
    options: ["password123", "123456", "G!7b#S9x", "qwerty"],
    answer: 2,
    reasoning: "A strong password should be a mix of letters, numbers, and special characters. 'G!7b#S9x' is the strongest option among the choices provided.",
    hint: "Look for the option that has a mix of uppercase, lowercase, numbers, AND special characters."
  }
];

type QuizPageProps = {
  onComplete?: () => void;
};

export default function QuizPage({ onComplete }: QuizPageProps) {
  return (
    <div className="flex flex-col items-center bg-[#F7F5EE] min-h-screen py-16">
      <QuizComponent
        questions={quizQuestions}
        onComplete={onComplete}
      />
    </div>
  );
}
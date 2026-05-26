import { Link } from "react-router-dom";

const AITutorBanner = () => {
  return (
    <div className="w-full px-8 md:px-24 py-16 bg-[#F7F5EE]">
      <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#0F6E56] to-[#1a8a6a] rounded-3xl shadow-lg p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 text-center md:text-left">
          <p className="text-[#EF9F27] uppercase tracking-wider text-sm font-bold mb-2">
            New ✨
          </p>
          <h2 className="text-white mb-3">Chat with your AI Tutor</h2>
          <p className="text-white/90 text-lg leading-relaxed mb-6">
            Practise your cyber-safety skills by answering questions from a friendly AI. Stuck?
            Ask follow-up questions to dig deeper into any topic.
          </p>
          <Link
            to="/ai-learning"
            className="inline-block px-10 py-3 bg-[#EF9F27] rounded-full hover:bg-[#D48A1A] transition-colors duration-200"
          >
            <span className="text-[#0F3B2E] font-semibold text-lg">Start chatting →</span>
          </Link>
        </div>
        <div className="shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/15 flex items-center justify-center text-7xl md:text-8xl">
          🤖
        </div>
      </div>
    </div>
  );
};

export default AITutorBanner;

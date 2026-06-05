type ProgressBarProps = {
  current: number;
  total: number;
  label?: string;
};

const ProgressBar = ({ current, total, label = "Activities" }: ProgressBarProps) => {
  const percentage = (current / total) * 100;
  const remaining = total - current;
  
  return (
    <div className="bg-white/95 rounded-2xl px-5 py-3 shadow-lg border-2 border-[#3B6D11]/30 min-w-[260px]">
      <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2 px-1">
        <span className="text-[#3B6D11]">📋 {label}</span>
        <span className="text-[#3B6D11]">{current} / {total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-[#3B6D11] to-[#5BA32B] h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 text-center mt-2 font-medium">
        {remaining === 0 
          ? "All activities complete! 🎉" 
          : `${remaining} more to go!`}
      </p>
    </div>
  );
};

export default ProgressBar;
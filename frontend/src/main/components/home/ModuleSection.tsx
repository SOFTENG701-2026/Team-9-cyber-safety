import { Link } from "react-router-dom";
import ModuleCard from "./ModuleCard";

const ModuleSection = () => {
  return (
    <div className="flex flex-col items-center py-16 my-32">
      <div className="mb-12">
        <h1 className="text-[#3B6D11]">
          Build your cyber
        </h1>
        <h1 className="text-[#3B6D11]">
          superpowers with our
        </h1>
        <h1 className="text-[#3B6D11]">
          modules
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-24">
        <Link to="/vn">
          <ModuleCard text="Interacting with people online" imgUrl="/home/Koro.png" />
        </Link>
        
        <ModuleCard text="Viruses & Malware" imgUrl="/home/Aroha.png" />
        <ModuleCard text="Scammers" imgUrl="/home/Ruru.png" />
        <ModuleCard text="Cyberbullying" imgUrl="/home/Tane.png" />
      </div>
      <Link to="/vn" className="px-32 py-2 bg-[#EF9F27] rounded-full hover:bg-[#D48A1A] transition-colors duration-200 items-center mt-20">
        <h2 className="text-[#0F3B2E]">
          Check it out
        </h2>
      </Link>
    </div>
  )
}

export default ModuleSection;
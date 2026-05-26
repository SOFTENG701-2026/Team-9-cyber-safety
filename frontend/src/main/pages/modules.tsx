import HeroBanner from "../components/HeroBanner";
import ModuleCardFull from "../components/modules/ModuleCardFull";

const Modules = () => {
  return (
    <div className="flex flex-col bg-[#F7F5EE]">
			<HeroBanner title="Modules" subtitle="Play through short stories that teach you important things about good cyber safety." />

      <div className="flex flex-col px-40 grid-lessons my-32 gap-8">
				<ModuleCardFull
					moduleNum={1}
					title="Scams and Phishing" 
					description="Kōro, Ruru and Āroha learn how to identify and avoid scams and phishing attempts!"
					imgUrl="/card.png"
					linkUrl="/vn"
				/> 
						
				<ModuleCardFull
					moduleNum={2}
					title="Viruses & Malware" 
					description="Tāne and Āroha explore what happens if you get infected with a virus!"
					imgUrl="/card.png"
					linkUrl="/modules"
				/> 

				<ModuleCardFull 
					moduleNum={3}
					title="Online Privacy" 
					description="Ruru and Āroha learn about online privacy and how to protect their personal information!"
					imgUrl="/card.png"
					linkUrl="/modules"
				/> 

				<ModuleCardFull 
					moduleNum={4}
					title="Cyberbullying" 
					description="Someone is messaging Tāne mean messages! Can Kōro help?"
					imgUrl="/card.png"
					linkUrl="/modules"
				/> 
      </div>
    </div>
  )
}

export default Modules

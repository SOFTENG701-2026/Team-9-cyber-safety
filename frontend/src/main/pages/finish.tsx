import ModuleCardFull from "../components/modules/ModuleCardFull"


const Finish = () => {
  return (
    <div className="flex flex-col bg-[#F7F5EE]">
      <div className="mb-12 flex flex-col items-center justify-cente bg-white rounded-lg shadow-md p-8 mt-12 mx-auto">
        <h1 className="text-[#3B6D11] z-10">
          Great work on finishing the episode!
        </h1>
        <img src="/celebration.png" alt="celebration" className="w-2/3 h-auto mt-[-50px]" />
      </div>
      <div>
        <h2 className="text-[#3B6D11] text-2xl text-center mb-4">
          Ready for the next episode?
        </h2>
        <ModuleCardFull
          moduleNum={2}
					title="Viruses & Malware" 
					description="Tāne and Āroha explore what happens if you get infected with a virus!"
					imgUrl="/card.png"
				 />
      </div>
    </div>

  )
}

export default Finish
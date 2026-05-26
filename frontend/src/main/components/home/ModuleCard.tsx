interface ModuleCardProps {
  text: string
  imgUrl: string;
}

const ModuleCard = ({ text, imgUrl }: ModuleCardProps) => {
  return (
    <div className="w-full min-h-full flex flex-row items-center rounded-lg bg-white shadow-md p-4 border-t-4 border-[#3B6D11]">
      <p className="text-[#3B6D11] text-4xl text-center w-full">
        {text}
      </p>
      <img src={imgUrl} alt="Module Image" className="w-28 h-auto mr-12" />
    </div>
  )
}

export default ModuleCard;

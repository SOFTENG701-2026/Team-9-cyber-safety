import { Link } from "react-router-dom";

interface ModuleCardFullProps {
  moduleNum: number
  title: string
  description: string
  imgUrl: string 
  linkUrl: string;
}

const ModuleCardFull = ({ moduleNum, title, description, imgUrl, linkUrl}: ModuleCardFullProps) => {
  return (
    <Link to={linkUrl} className="w-full">
      <article className="mb-4 bg-white hover:bg-gray-200 transition duration-200 rounded-lg overflow-hidden shadow-lg flex flex-row items-center justify-start p-8 gap-8"> 
        <img className="max-w-sm" src={imgUrl}/>  
        <div className="px-9 py-4 flex flex-col items-start w-full gap-4"> 
          <h2 className="text-[#0F6E56]">Episode {moduleNum}</h2> 
          <h3 className="text-black text-lg">{title}</h3> 
          <p className="text-black py-4 text-base">{description}</p> 
        </div> 
      </article> 
    </Link>
  )
}

export default ModuleCardFull

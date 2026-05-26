import HomeHeroBanner from "../components/home/HomeHeroBanner"
import AmberBanner from "../components/home/AmberBanner"
import ModuleSection from "../components/home/ModuleSection"
import AITutorBanner from "../components/home/AITutorBanner"

const Home = () => {
  return (
    <div className="flex flex-col bg-[#F7F5EE]">
      <HomeHeroBanner />
      <AmberBanner />
      <ModuleSection />
      <AITutorBanner />
    </div>

  )
}

export default Home
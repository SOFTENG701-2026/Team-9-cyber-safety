interface HeroBannerProps {
  title: string
  subtitle: string
}

const HeroBanner = ({ title, subtitle }: HeroBannerProps) => {
  return (
    <div className="relative w-full h-[30vh] bg-gradient-to-b from-[#0F6E56] to-[#1B7D63]">
      <div className="flex flex-col w-full h-full items-center justify-center pb-16 [text-shadow:_0_2px_8px_rgba(0,0,0,0.3)]">
        <h1 className="text-white">{title}</h1>
        <p className="text-white max-w-lg">{subtitle}</p>
      </div>
      <div className="bg-[#EF9F27] w-full h-8"></div>
    </div>
  )
}

export default HeroBanner;
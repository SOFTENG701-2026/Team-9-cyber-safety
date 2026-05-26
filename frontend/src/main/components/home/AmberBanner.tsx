const AmberBanner = () => {
  return (
    <div className="w-full h-26 bg-[#EF9F27]">
      <div className="flex flex-row justify-evenly items-center h-content py-4">
        <span className="flex flex-col items-center min-w-[120px]">
          <h2 className="text-[#0F6E56]">Year 4-6</h2>
          <p className="text-black text-xl">Students</p>
        </span>
        <span className="flex flex-col items-center min-w-[120px]">
          <h2 className="text-[#0F6E56]">4</h2>
          <p className="text-black text-xl">Modules</p>
        </span>
        <span className="flex flex-col items-center min-w-[120px]">
          <h2 className="text-[#0F6E56]">NZ</h2>
          <p className="text-black text-xl">Focused</p>
        </span>
        <span className="flex flex-col items-center min-w-[120px]">
          <h2 className="text-[#0F6E56]">FREE</h2>
          <p className="text-black text-xl">Always</p>
        </span>
      </div>
    </div>
  )
}

export default AmberBanner;
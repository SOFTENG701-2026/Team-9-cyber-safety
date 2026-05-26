import { Link } from "react-router-dom"

const Navbar = () => {
  return (
    <div className="w-full h-full bg-[#0F6E56] flex flex-row items-center justify-between px-8 py-4">
      <Link to="/">
        <h2 className="text-white hover:opacity-70">My App</h2>
      </Link>
      <div className="flex space-x-16">
        <Link to="/modules">
          <h3 className="text-white hover:opacity-70">
            Learn
          </h3>
        </Link>
        <Link to="/ai-learning">
          <h3 className="text-white hover:opacity-70">
            AI Tutor
          </h3>
        </Link>
        <Link to="/about">
          <h3 className="text-white hover:opacity-70">
            About
          </h3>
        </Link>
      </div>
    </div>
  )
}

export default Navbar

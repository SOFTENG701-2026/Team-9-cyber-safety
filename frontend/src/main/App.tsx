import { Routes, Route, useLocation } from 'react-router-dom'
import '../resources/App.css'
import Navbar from './components/Navbar'
import Home from './pages/home'
import About from './pages/about'
import Modules from './pages/modules'
import Footer from './components/Footer'
import VisualNovelDemo from './pages/VisualNovel.tsx'
import AILearning from './pages/AILearning'
function App() {
  const location = useLocation()
  const hideChrome = location.pathname.startsWith('/vn')

  return (
    <div>
      {!hideChrome && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/modules" element={<Modules />} />
        <Route path="/about" element={<About />} />
        <Route path="/vn" element={<VisualNovelDemo />} />
        <Route path="/ai-learning" element={<AILearning />} />
      </Routes>
      {!hideChrome && <Footer />}
    </div>
  )
}

export default App

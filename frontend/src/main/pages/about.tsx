import learnImg from "../../resources/assets/images/Learn.png"
import practiceImg from "../../resources/assets/images/Practice.png"
import castImg from "../../resources/assets/images/Meet Our Cast.png"

// Load Holtwood One SC from Google Fonts
const fontLink = document.createElement("link")
fontLink.href = "https://fonts.googleapis.com/css2?family=Holtwood+One+SC&display=swap"
fontLink.rel = "stylesheet"
document.head.appendChild(fontLink)

const teamNames = "Henry, Will, Amir, Alex, Toma, Moksh, Thomas"

export default function About() {
  return (
    <div className="bg-[#F5F0E8] min-h-screen font-sans">

      {/* ── HERO HEADER ── */}
      <section className="bg-gradient-to-b from-[#0F6E56] to-[#1a8a6a] px-[5vw] pt-16 pb-12 text-center">
        <h1
          className="text-white mb-4 text-5xl md:text-7xl font-normal"
          style={{ fontFamily: "'Holtwood One SC', serif" }}
        >
          701 T9
        </h1>
        <p className="text-white/85 font-medium text-sm md:text-lg">
          {teamNames}
        </p>
      </section>

      {/* ── AMBER ACCENT BAR ── */}
      <div className="h-[14px] bg-[#E8A020]" />

      {/* ── LEARN & PRACTICE CARDS ── */}
      <section className="px-[5vw] py-14 flex flex-col gap-6 max-w-[820px] mx-auto">

        {/* Learn card */}
        <div className="bg-white rounded-2xl px-9 py-8 shadow-md flex items-center gap-7">
          <img
            src={learnImg}
            alt="Learn"
            className="w-28 h-auto shrink-0 object-contain"
          />
          <div>
            <h2
              className="text-[#2d5a1b] text-3xl font-normal mb-3"
              style={{ fontFamily: "'Holtwood One SC', serif" }}
            >
              Learn
            </h2>
            <ul className="list-disc pl-5 text-[#2d5a1b] text-sm leading-loose">
              <li>Know when your cyber safety is in trouble</li>
              <li>Be able to handle cyber safety attacks</li>
              <li>Be able to prevent cyber attacks and stop future ones</li>
            </ul>
          </div>
        </div>

        {/* Practice card */}
        <div className="bg-white rounded-2xl px-9 py-8 shadow-md flex items-center justify-between gap-7">
          <p className="text-[#3a3a3a] text-sm leading-7 text-center flex-1 max-w-[420px]">
            Jump into fun stories and mini-games to practise staying safe online! Each module is a mini-adventure that teaches you one cool cyber safety skill.
          </p>
          <div className="text-right shrink-0">
            <h2
              className="text-[#2d5a1b] text-3xl font-normal mb-3 text-right"
              style={{ fontFamily: "'Holtwood One SC', serif" }}
            >
              Practice
            </h2>
            <img
              src={practiceImg}
              alt="Practice"
              className="w-24 h-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="max-w-[820px] mx-auto px-[5vw]">
        <div className="h-0.5 bg-[#3B6D11] rounded" />
      </div>

      {/* ── MEET OUR CAST ── */}
      <section className="px-[5vw] py-14 max-w-[820px] mx-auto">
        <div className="bg-white rounded-2xl p-9 shadow-md">
          <h2
            className="text-[#2d5a1b] text-4xl font-normal mb-7 text-center"
            style={{ fontFamily: "'Holtwood One SC', serif" }}
          >
            Meet Our Cast
          </h2>
          <img
            src={castImg}
            alt="Meet our cast — Tāne, Āroha, Kōro, Ruru"
            className="w-full h-auto rounded-xl block"
          />
        </div>
      </section>

    </div>
  )
}
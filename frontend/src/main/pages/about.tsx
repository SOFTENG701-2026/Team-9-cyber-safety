import learnImg from "../../resources/assets/images/Learn.png"
import practiceImg from "../../resources/assets/images/Practice.png"
import castImg from "../../resources/assets/images/Meet Our Cast.png"
import HeroBanner from "../components/HeroBanner"

// Load Holtwood One SC from Google Fonts
const fontLink = document.createElement("link")
fontLink.href = "https://fonts.googleapis.com/css2?family=Holtwood+One+SC&display=swap"
fontLink.rel = "stylesheet"
document.head.appendChild(fontLink)

const teamNames = "Henry, Will, Amir, Alex, Toma, Moksh, Thomas"

export default function About() {
  return (
    <div className="bg-[#F5F0E8] min-h-screen w-full pb-20">
      <HeroBanner title="About Us" subtitle={teamNames} />
      <section className="px-40 py-14 flex flex-col gap-6 mx-auto">
        {/* Learn card */}
        <div className="bg-white rounded-2xl px-9 py-8 shadow-md flex items-center gap-7 w-full">
          <img
            src={learnImg}
            alt="Learn"
            className="w-40 h-auto shrink-0 object-contain ml-4"
          />
          <div className="ml-16 flex flex-col items-start gap-4">
            <h1
              className="text-[#3B6D11] mb-3"
            >
              Learn
            </h1>
            <ul className="list-disc text-[#3B6D11] ml-10">
              <li className="text-left">Know when your cyber safety is in trouble</li>
              <li className="text-left">Be able to handle cyber safety attacks</li>
              <li className="text-left">Be able to prevent cyber attacks and stop future ones</li>
            </ul>
          </div>
        </div>

        {/* Practice card */}
        <div className="bg-white rounded-2xl px-9 py-8 shadow-md flex items-center justify-between gap-7">
           <div className="mr-16 flex flex-col items-end gap-4 w-full">
            <h1
              className="text-[#3B6D11] mb-3"
            >
              Practice
            </h1>
            <ul className="text-[#3B6D11]">
              <li className="text-right">Jump into fun stories and mini-games to practise staying safe </li>
              <li className="text-right">online! Each module is a mini-adventure that teaches you one</li>
              <li className="text-right">cool cyber safety skill.</li>
            </ul>
          </div>
          <img
            src={practiceImg}
            alt="Practice"
            className="w-40 h-auto object-contain mr-4"
          />
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="mx-auto px-40 py-20">
        <div className="h-0.5 bg-[#3B6D11] rounded" />
      </div>

      {/* ── MEET OUR CAST ── */}
      <section className="px-40 py-14 mx-auto">
        <div className="bg-white rounded-2xl p-9 shadow-md">
          <h1
            className="text-[#2d5a1b] mb-7 text-center pb-4"
          >
            Meet Our Cast
          </h1>
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
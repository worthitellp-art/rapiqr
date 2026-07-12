import React from "react";

const cards = [
  { title: "My Portfolio", emoji: "🚀", bg: "bg-[#d2e823]" },
  { title: "Latest Video", emoji: "▶️", bg: "bg-[#ff90e8]" },
  { title: "My Store", emoji: "🛍️", bg: "bg-[#7ce3ff]" },
  { title: "Instagram", emoji: "📸", bg: "bg-[#ffc44d]" },
  { title: "Newsletter", emoji: "✉️", bg: "bg-[#c8a2ff]" },
  { title: "New Podcast", emoji: "🎙️", bg: "bg-[#ff7f6e]" },
];

function Card(props: { card: typeof cards[number]; key?: React.Key }) {
  const { card } = props;
  return (
    <div
      className={`
        ${card.bg}
        w-44 sm:w-52 md:w-60
        h-56 md:h-72
        shrink-0
        rounded-[28px]
        p-5
        flex flex-col
        justify-between
        shadow-[0_15px_50px_rgba(0,0,0,0.15)]
        transition-transform
        duration-300
        hover:scale-[1.04]
      `}
    >
      <div className="w-12 h-12 bg-white/70 backdrop-blur rounded-full flex items-center justify-center text-2xl">
        {card.emoji}
      </div>

      <div>
        <p className="text-black/60 text-sm mb-1">Discover</p>

        <h3 className="text-black text-xl md:text-2xl font-bold">
          {card.title}
        </h3>
      </div>
    </div>
  );
}

function Column({ direction = "up", duration = "21s", offset = false }) {
  const items = [...cards, ...cards];

  return (
    <div
      className={`
        relative
        flex
        flex-col
        gap-5
        shrink-0
      `}
      style={{
        animation:
          direction === "up"
            ? `scrollUpHold ${duration} linear infinite`
            : `scrollDownHold ${duration} linear infinite`,
        animationDelay: offset ? "-3.5s" : "0s",
      }}
    >
      {items.map((card, index) => (
        <Card card={card} key={String(index)} />
      ))}
    </div>
  );
}

export default function LinktreeHero() {
  return (
    <>
      <style>{`
        /*
         * 6 cards × (3s hold + 0.5s scroll) = 21s per cycle.
         * Each card = 50% / 6 = 8.33% of travel.
         * animation-timing-function at "hold end" keyframes
         * controls the easing of the scroll to the next card.
         */
        @keyframes scrollUpHold {
          0%      { transform: translateY(0); }
          14.29%  { transform: translateY(0); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          16.67%  { transform: translateY(-8.33%); }
          30.95%  { transform: translateY(-8.33%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          33.33%  { transform: translateY(-16.67%); }
          47.62%  { transform: translateY(-16.67%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          50%     { transform: translateY(-25%); }
          64.29%  { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          66.67%  { transform: translateY(-33.33%); }
          80.95%  { transform: translateY(-33.33%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          83.33%  { transform: translateY(-41.67%); }
          97.62%  { transform: translateY(-41.67%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          100%    { transform: translateY(-50%); }
        }

        @keyframes scrollDownHold {
          0%      { transform: translateY(-50%); }
          14.29%  { transform: translateY(-50%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          16.67%  { transform: translateY(-41.67%); }
          30.95%  { transform: translateY(-41.67%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          33.33%  { transform: translateY(-33.33%); }
          47.62%  { transform: translateY(-33.33%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          50%     { transform: translateY(-25%); }
          64.29%  { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          66.67%  { transform: translateY(-16.67%); }
          80.95%  { transform: translateY(-16.67%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          83.33%  { transform: translateY(-8.33%); }
          97.62%  { transform: translateY(-8.33%); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
          100%    { transform: translateY(0); }
        }

        .cards-container:hover > div {
          animation-play-state: paused !important;
        }
      `}</style>

      <main className="min-h-screen bg-[#f4f4f0] overflow-hidden">
        <section className="min-h-screen max-w-[1600px] mx-auto px-6 lg:px-12 flex items-center">

          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 w-full items-center">

            {/* LEFT CONTENT */}

            <div className="relative z-20 py-20">

              <h1 className="max-w-3xl text-[clamp(4rem,8vw,9rem)] leading-[0.82] tracking-[-0.07em] font-black text-[#1e2330]">
                Everything
                <br />
                you are.
                <br />

                <span className="text-[#8129d9]">
                  In one,
                  <br />
                  simple link.
                </span>
              </h1>

              <p className="mt-8 max-w-xl text-lg md:text-xl leading-relaxed text-black/65">
                Join millions of creators sharing everything they create,
                curate and sell from one beautiful link.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">

                <div className="flex items-center bg-white rounded-xl px-5 h-16 shadow-sm">

                  <span className="text-black/50">
                    linktr.ee/
                  </span>

                  <input
                    placeholder="yourname"
                    className="
                      bg-transparent
                      outline-none
                      w-40
                      text-black
                      placeholder:text-black/35
                    "
                  />

                </div>

                <button
                  className="
                    h-16
                    px-8
                    rounded-full
                    bg-[#d2e823]
                    text-black
                    font-bold
                    transition
                    hover:scale-105
                    active:scale-95
                  "
                >
                  Claim your Linktree
                </button>

              </div>

            </div>


            {/* ANIMATED CARDS */}

            <div className="relative h-[760px] overflow-hidden">

              {/* TOP FADE */}

              <div
                className="
                  absolute
                  top-0
                  left-0
                  right-0
                  h-40
                  z-10
                  pointer-events-none
                  bg-gradient-to-b
                  from-[#f4f4f0]
                  to-transparent
                "
              />


              {/* BOTTOM FADE */}

              <div
                className="
                  absolute
                  bottom-0
                  left-0
                  right-0
                  h-40
                  z-10
                  pointer-events-none
                  bg-gradient-to-t
                  from-[#f4f4f0]
                  to-transparent
                "
              />


              <div
                className="
                  cards-container
                  absolute
                  inset-0
                  flex
                  justify-center
                  gap-5
                  -rotate-[5deg]
                "
              >

                <Column
                  direction="up"
                  duration="21s"
                />

                <Column
                  direction="down"
                  duration="21s"
                  offset
                />

                <div className="hidden xl:block">

                  <Column
                    direction="up"
                    duration="28s"
                  />

                </div>

              </div>

            </div>

          </div>

        </section>
      </main>
    </>
  );
}

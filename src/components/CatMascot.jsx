import React from 'react';

export default function CatMascot({ percent = 0, isDrinking = false, isSleeping = false }) {
  // Determine state based on progress percent
  let catState = 'sleepy';
  if (percent >= 90) {
    catState = 'celebrating';
  } else if (percent >= 30) {
    catState = 'happy';
  }

  // Sleeping overrides everything
  const getCatClass = () => {
    if (isSleeping) return 'cat-animated-float';
    if (isDrinking) return 'cat-animated-float';
    if (catState === 'celebrating') return 'cat-animated-jump';
    return 'cat-animated-float';
  };

  return (
    <div className={`cat-svg-container ${getCatClass()}`}>
      <svg
        viewBox="0 0 260 260"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Shadow underneath */}
        <ellipse cx="130" cy="235" rx="55" ry="8" fill="rgba(0,0,0,0.18)" />

        {/* Tail (Wags via CSS keyframe) */}
        <g className="cat-tail">
          {/* Main Orange Tail */}
          <path
            d="M 205,140 Q 240,110 230,85 Q 220,60 200,80 Q 185,95 200,120"
            fill="none"
            stroke="#ff9f1c"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Tail Cream Tip */}
          <path
            d="M 215,80 Q 220,60 200,80"
            fill="none"
            stroke="#ffe5b4"
            strokeWidth="16"
            strokeLinecap="round"
          />
        </g>

        {/* Hind Legs (drawn before body so body covers their tops) */}
        <path
          d="M 80,185 Q 72,228 90,228 Q 108,228 100,185"
          fill="#e68a00"
        />
        <path
          d="M 180,185 Q 188,228 170,228 Q 152,228 160,185"
          fill="#e68a00"
        />
        {/* Hind Leg accent (slightly lighter inner) */}
        <path
          d="M 84,190 Q 78,225 90,225 Q 102,225 98,190"
          fill="#ff9f1c"
        />
        <path
          d="M 176,190 Q 182,225 170,225 Q 158,225 162,190"
          fill="#ff9f1c"
        />

        {/* Main Body (overlaps leg tops to connect them) */}
        <ellipse cx="130" cy="170" rx="65" ry="50" fill="#ff9f1c" />
        
        {/* Soft Cream Belly Patch */}
        <ellipse cx="130" cy="180" rx="40" ry="30" fill="#ffe5b4" />

        {/* Front Paws */}
        {isDrinking ? (
          // Drinking posture: paws reach toward the glass
          <g>
            <ellipse cx="105" cy="210" rx="12" ry="16" fill="#ffe5b4" transform="rotate(-15, 105, 210)" />
            <ellipse cx="155" cy="210" rx="12" ry="16" fill="#ffe5b4" transform="rotate(15, 155, 210)" />

            {/* Minimalist Water Pitcher */}
            <g style={{
              transformOrigin: '57px 105px',
              animation: 'pitcherPour 1.5s ease-in-out forwards',
              opacity: 0
            }}>
              {/* Pitcher Handle */}
              <path d="M 28,105 Q 12,110 22,128" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3.5" strokeLinecap="round" />
              {/* Pitcher Glass Body */}
              <path d="M 54,95 L 32,95 L 30,135 A 8,8 0 0,0 38,143 L 52,143 A 8,8 0 0,0 60,135 Z" 
                fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3.5" strokeLinejoin="round" />
              {/* Pitcher Spout */}
              <path d="M 54,95 L 62,97 L 57,105 Z" fill="rgba(255,255,255,0.9)" />
              {/* Water inside pitcher — matches glass brightness */}
              <path d="M 31,110 L 59,110 L 58,135 A 6,6 0 0,1 52,141 L 38,141 A 6,6 0 0,1 32,135 Z"
                fill="#00f5d4" opacity="0.75" />
            </g>

            {/* Pouring stream of water */}
            <path
              d="M 58,104 Q 90,125 130,205"
              fill="none"
              stroke="#00f5d4"
              strokeWidth="4.5"
              strokeLinecap="round"
              style={{
                strokeDasharray: 150,
                strokeDashoffset: 150,
                animation: 'pourStream 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              }}
            />

            {/* Water glass between paws */}
            <g style={{ animation: 'glassPopIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
              {/* Glass body */}
              <path d="M 115,195 L 117,228 L 143,228 L 145,195 Z"
                fill="rgba(0,245,212,0.15)" stroke="rgba(0,245,212,0.7)" strokeWidth="2" strokeLinejoin="round" />
              
              {/* Water fill inside glass — animated to rise */}
              <path d="M 116,197 L 117,228 L 143,228 L 144,197 Z"
                fill="rgba(0,245,212,0.45)"
                style={{
                  transformOrigin: '130px 228px',
                  animation: 'waterRise 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                }}
              />
              
              {/* Water surface wave — animated to rise */}
              <path d="M 117,197 Q 124,194 130,197 Q 136,200 143,197"
                fill="none" stroke="rgba(0,245,212,0.9)" strokeWidth="1.5" strokeLinecap="round"
                style={{
                  transformOrigin: '130px 228px',
                  animation: 'waterRise 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                }}
              />
              
              {/* Glass rim */}
              <line x1="115" y1="195" x2="145" y2="195"
                stroke="rgba(0,245,212,0.7)" strokeWidth="2" strokeLinecap="round" />
              
              {/* Splash drops — timed with the pouring water stream hitting the glass */}
              <circle cx="122" cy="189" r="2.5" fill="#00f5d4"
                style={{ animation: 'dropletFly 0.6s 0.25s ease-out forwards', opacity: 0 }} />
              <circle cx="130" cy="185" r="2" fill="#00bbf9"
                style={{ animation: 'dropletFly 0.6s 0.35s ease-out forwards', opacity: 0 }} />
              <circle cx="138" cy="188" r="2.5" fill="#00f5d4"
                style={{ animation: 'dropletFly 0.6s 0.3s ease-out forwards', opacity: 0 }} />
            </g>
          </g>
        ) : (
          // Resting posture: cute little rounded front paws
          <g>
            <ellipse cx="105" cy="215" rx="14" ry="10" fill="#ffe5b4" />
            <ellipse cx="155" cy="215" rx="14" ry="10" fill="#ffe5b4" />
          </g>
        )}

        {/* Left Ear */}
        <g className="cat-ear-left">
          <path d="M 75,100 L 90,45 L 120,90 Z" fill="#ff9f1c" />
          <path d="M 83,93 L 93,57 L 112,85 Z" fill="#ffb4a2" />
        </g>

        {/* Right Ear */}
        <g className="cat-ear-right">
          <path d="M 185,100 L 170,45 L 140,90 Z" fill="#ff9f1c" />
          <path d="M 177,93 L 167,57 L 148,85 Z" fill="#ffb4a2" />
        </g>

        {/* Head */}
        <ellipse cx="130" cy="105" rx="55" ry="43" fill="#ff9f1c" />

        {/* Face stripes (Orange accent panels) */}
        <path d="M 75,105 Q 90,105 95,100" fill="none" stroke="#e68a00" strokeWidth="3" strokeLinecap="round" />
        <path d="M 75,112 Q 90,110 93,107" fill="none" stroke="#e68a00" strokeWidth="3" strokeLinecap="round" />
        <path d="M 185,105 Q 170,105 165,100" fill="none" stroke="#e68a00" strokeWidth="3" strokeLinecap="round" />
        <path d="M 185,112 Q 170,110 167,107" fill="none" stroke="#e68a00" strokeWidth="3" strokeLinecap="round" />
        
        {/* Forehead Stripes */}
        <path d="M 125,62 Q 130,75 130,78" fill="none" stroke="#e68a00" strokeWidth="3" strokeLinecap="round" />
        <path d="M 120,62 Q 123,73 125,75" fill="none" stroke="#e68a00" strokeWidth="3" strokeLinecap="round" />
        <path d="M 135,62 Q 137,73 135,75" fill="none" stroke="#e68a00" strokeWidth="3" strokeLinecap="round" />

        {/* Eyes & Mouth Logic based on states */}
        {isSleeping ? (
          // Sleeping face: closed crescent eyes + calm mouth + ZZZs
          <g>
            {/* Left eye — closed crescent */}
            <path d="M 100,105 Q 110,97 120,105" fill="none" stroke="#663a00" strokeWidth="3.5" strokeLinecap="round" />
            {/* Right eye — closed crescent */}
            <path d="M 140,105 Q 150,97 160,105" fill="none" stroke="#663a00" strokeWidth="3.5" strokeLinecap="round" />
            {/* Calm mouth */}
            <path d="M 125,118 Q 130,121 135,118" fill="none" stroke="#663a00" strokeWidth="2.5" strokeLinecap="round" />

            {/* Floating ZZZs */}
            <text x="168" y="80" fontFamily="Outfit, sans-serif" fontWeight="800" fontSize="16"
              fill="#00f5d4" opacity="0"
              style={{ animation: 'zzzFloat 2.4s 0s ease-in-out infinite' }}>Z</text>
            <text x="183" y="58" fontFamily="Outfit, sans-serif" fontWeight="800" fontSize="20"
              fill="#00f5d4" opacity="0"
              style={{ animation: 'zzzFloat 2.4s 0.8s ease-in-out infinite' }}>Z</text>
            <text x="200" y="34" fontFamily="Outfit, sans-serif" fontWeight="800" fontSize="24"
              fill="#00f5d4" opacity="0"
              style={{ animation: 'zzzFloat 2.4s 1.6s ease-in-out infinite' }}>Z</text>
          </g>
        ) : isDrinking ? (
          // Drinking face: happy closed arched eyes and cute tiny tongue
          <g>
            {/* Left eye closed happy */}
            <path d="M 100,102 Q 110,94 120,102" fill="none" stroke="#2c1a04" strokeWidth="3.5" strokeLinecap="round" />
            {/* Right eye closed happy */}
            <path d="M 140,102 Q 150,94 160,102" fill="none" stroke="#2c1a04" strokeWidth="3.5" strokeLinecap="round" />
            {/* Pink licking tongue */}
            <ellipse cx="130" cy="122" rx="6" ry="8" fill="#ff4d6d" />
            {/* Mouth */}
            <path d="M 124,115 Q 130,121 136,115" fill="none" stroke="#2c1a04" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ) : catState === 'celebrating' ? (
          // Celebrating face: Cool dark sunglasses & happy smile
          <g>
            {/* Sunglasses frame */}
            <path
              d="M 90,95 Q 130,95 170,95 Q 165,115 145,115 Q 130,110 115,115 Q 95,115 90,95"
              fill="#101a36"
              stroke="#cbd5e1"
              strokeWidth="2"
            />
            {/* Sunglasses glare */}
            <path d="M 100,100 L 110,110" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 148,100 L 158,110" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            {/* Broad happy smile */}
            <path d="M 120,120 Q 130,132 140,120" fill="none" stroke="#2c1a04" strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : catState === 'happy' ? (
          // Happy normal state: Cute open eyes (blinking) & subtle smile
          <g>
            {/* Left Eye */}
            <ellipse className="cat-eye-left" cx="110" cy="103" rx="6" ry="6" fill="#2c1a04" />
            {/* Right Eye */}
            <ellipse className="cat-eye-right" cx="150" cy="103" rx="6" ry="6" fill="#2c1a04" />
            
            {/* Eye glint */}
            <circle cx="108" cy="101" r="2" fill="#fff" />
            <circle cx="148" cy="101" r="2" fill="#fff" />

            {/* Mouth */}
            <path d="M 122,116 Q 130,121 130,116" fill="none" stroke="#2c1a04" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 130,116 Q 130,121 138,116" fill="none" stroke="#2c1a04" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ) : (
          // Sleepy / dry state: Bored/tired line eyes, slightly sad small mouth
          <g>
            {/* Sleepy eyes (flat arcs) */}
            <path d="M 102,105 Q 110,108 118,105" fill="none" stroke="#663a00" strokeWidth="3" strokeLinecap="round" />
            <path d="M 142,105 Q 150,108 158,105" fill="none" stroke="#663a00" strokeWidth="3" strokeLinecap="round" />
            
            {/* Droop / Tired lines under eyes */}
            <path d="M 105,111 L 110,113" fill="none" stroke="#e68a00" strokeWidth="2" strokeLinecap="round" />
            <path d="M 155,111 L 150,113" fill="none" stroke="#e68a00" strokeWidth="2" strokeLinecap="round" />
            
            {/* Flat line mouth */}
            <path d="M 125,117 L 135,117" fill="none" stroke="#663a00" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* Small Pink Nose (constant) */}
        <polygon points="127,111 133,111 130,114" fill="#ffb4a2" />

        {/* Whiskers (Constant) */}
        <g stroke="#ffb4a2" strokeWidth="2.5" strokeLinecap="round">
          <line x1="85" y1="116" x2="55" y2="114" />
          <line x1="85" y1="123" x2="52" y2="125" />
          <line x1="175" y1="116" x2="205" y2="114" />
          <line x1="175" y1="123" x2="208" y2="125" />
        </g>
        
        {/* Celebration details: floating water bubbles around cat if 90%+ */}
        {catState === 'celebrating' && (
          <g opacity="0.8">
            <circle cx="50" cy="70" r="8" fill="none" stroke="#00f5d4" strokeWidth="2" />
            <circle cx="210" cy="160" r="5" fill="none" stroke="#00bbf9" strokeWidth="1.5" />
            <circle cx="215" cy="60" r="10" fill="none" stroke="#00f5d4" strokeWidth="2" />
            <circle cx="45" cy="150" r="6" fill="none" stroke="#00bbf9" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    </div>
  );
}

import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RobotExpression =
  // Row 1
  | 'neutral'
  | 'happy'
  | 'big-smile'
  | 'laughing'
  | 'laughing-tears'
  | 'excited'
  | 'love'
  // Row 2
  | 'blushing'
  | 'curious'
  | 'confused'
  | 'thinking'
  | 'surprised'
  | 'surprised-open'
  | 'shocked'
  // Row 3
  | 'sad'
  | 'crying'
  | 'worried'
  | 'worried-alt'
  | 'scared'
  | 'angry'
  | 'annoyed'
  // Row 4
  | 'embarrassed'
  | 'shy'
  | 'mischievous'
  | 'mischievous-alt'
  | 'playful'
  | 'bored'
  | 'sleepy'
  // Row 5
  | 'sleeping'
  | 'proud'
  | 'suspicious'
  | 'suspicious-alt'
  | 'celebrating'
  | 'greeting'
  | 'lonely'
  // Backward compatibility aliases
  | 'relaxed'
  | 'nervous'
  | 'frustrated';

type MicroBehavior =
  | 'none'
  | 'blink'
  | 'double-blink'
  | 'slow-blink'
  | 'look-left'
  | 'look-right'
  | 'look-around'
  | 'tiny-smile'
  | 'eye-pulse'
  | 'settle';

interface ExpressionCategory {
  name: string;
  expressions: { id: RobotExpression; label: string; icon: string }[];
}

@Component({
  selector: 'app-companion-robot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stage" (click)="onStageClick($event)">
      <!-- Robot Monitor / Bezel Frame -->
      <div
        class="robot-screen-frame"
        [attr.data-state]="normalizedState"
        [class.is-transitioning]="isTransitioning"
        [class.theme-angry]="normalizedState === 'angry'"
        [class.theme-love]="normalizedState === 'love'"
        [class.theme-blush]="isBlushState"
        (click)="onScreenTap($event)"
      >
        <!-- Ambient Screen Glow Bloom -->
        <div class="ambient-glow"></div>

        <!-- Bezel Camera / Sensor Dot -->
        <div class="bezel-sensor"></div>

        <!-- Glass Reflection Glare -->
        <div class="glass-glare"></div>

        <!-- SVG Robot Face Display -->
        <svg
          class="face-svg"
          viewBox="0 0 360 220"
          preserveAspectRatio="xMidYMid meet"
          [attr.data-state]="normalizedState"
          [class.micro-look-left]="microBehavior === 'look-left'"
          [class.micro-look-right]="microBehavior === 'look-right'"
          [class.micro-look-around]="microBehavior === 'look-around'"
          [class.micro-blink]="microBehavior === 'blink'"
          [class.micro-double-blink]="microBehavior === 'double-blink'"
          [class.micro-slow-blink]="microBehavior === 'slow-blink'"
          [class.micro-eye-pulse]="microBehavior === 'eye-pulse'"
          [class.micro-settle]="microBehavior === 'settle'"
        >
          <defs>
            <!-- Cheek Blush Gradient -->
            <radialGradient id="pinkBlush" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ff4f8b" stop-opacity="0.85" />
              <stop offset="45%" stop-color="#ff4f8b" stop-opacity="0.5" />
              <stop offset="100%" stop-color="#ff4f8b" stop-opacity="0" />
            </radialGradient>

            <!-- Love Pink Radial -->
            <radialGradient id="loveGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ff99bb" />
              <stop offset="70%" stop-color="#ff3b7a" />
              <stop offset="100%" stop-color="#e61558" />
            </radialGradient>

            <!-- Tongue Gradient -->
            <linearGradient id="tongueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ff7597" />
              <stop offset="100%" stop-color="#e02958" />
            </linearGradient>

            <!-- Star Sparkle Clip -->
            <clipPath id="leftStarClip">
              <path d="M 116 64 Q 116 96 84 96 Q 116 96 116 128 Q 116 96 148 96 Q 116 96 116 64 Z" />
            </clipPath>
          </defs>

          <!-- 1. CHEEK BLUSH LAYER -->
          @if (isBlushState) {
            <g class="cheeks-layer">
              <ellipse class="cheek-blush left" cx="80" cy="136" rx="24" ry="13" fill="url(#pinkBlush)" />
              <ellipse class="cheek-blush right" cx="280" cy="136" rx="24" ry="13" fill="url(#pinkBlush)" />
            </g>
          }

          <!-- 2. EYEBROWS LAYER -->
          <g class="eyebrows-group" [attr.data-state]="normalizedState">
            @switch (normalizedState) {
              @case ('angry') {
                <path class="eyebrow angry-l" d="M 84 60 L 144 82" />
                <path class="eyebrow angry-r" d="M 276 60 L 216 82" />
              }
              @case ('confused') {
                <path class="eyebrow confused-l" d="M 88 50 Q 116 38, 142 54" />
                <path class="eyebrow confused-r" d="M 218 68 L 266 74" />
              }
              @case ('thinking') {
                <path class="eyebrow thinking-l" d="M 92 58 Q 116 48, 140 56" />
                <path class="eyebrow thinking-r" d="M 220 54 Q 244 44, 268 52" />
              }
              @case ('worried') {
                <path class="eyebrow worried-l" d="M 90 70 L 142 54" />
                <path class="eyebrow worried-r" d="M 270 70 L 218 54" />
              }
              @case ('worried-alt') {
                <path class="eyebrow worried-l" d="M 90 70 L 142 54" />
                <path class="eyebrow worried-r" d="M 270 70 L 218 54" />
              }
              @case ('scared') {
                <path class="eyebrow scared-l" d="M 90 68 Q 116 54, 142 66" />
                <path class="eyebrow scared-r" d="M 270 68 Q 244 54, 218 66" />
              }
              @case ('mischievous') {
                <path class="eyebrow sly-l" d="M 94 62 L 138 62" />
                <path class="eyebrow sly-r" d="M 218 58 Q 244 42, 270 56" />
              }
              @case ('proud') {
                <path class="eyebrow proud-l" d="M 92 64 Q 116 56, 142 66" />
                <path class="eyebrow proud-r" d="M 268 64 Q 244 56, 218 66" />
              }
              @case ('annoyed') {
                <path class="eyebrow flat-l" d="M 88 68 L 144 76" />
                <path class="eyebrow flat-r" d="M 272 68 L 216 76" />
              }
              @case ('suspicious') {
                <path class="eyebrow flat-l" d="M 90 74 L 144 78" />
                <path class="eyebrow flat-r" d="M 270 74 L 216 78" />
              }
              @case ('suspicious-alt') {
                <path class="eyebrow flat-l" d="M 90 74 L 144 78" />
                <path class="eyebrow flat-r" d="M 270 74 L 216 78" />
              }
            }
          </g>

          <!-- 3. EYES LAYER -->
          <g class="eyes-layer">
            <!-- LEFT EYE -->
            <g class="eye-group left-eye" transform-origin="116 96">
              @switch (getEyeType('left')) {
                @case ('squircle') {
                  <path
                    class="eye-fill"
                    d="M 89 74 C 89 64, 143 64, 143 74 C 146 94, 146 108, 143 120 C 143 130, 89 130, 89 120 C 86 108, 86 94, 89 74 Z"
                  />
                  <!-- Inner pupil & shine -->
                  <circle class="eye-pupil" cx="116" cy="98" r="9" />
                  <circle class="eye-shine" cx="106" cy="84" r="5.5" />
                }
                @case ('happy-arc') {
                  <path class="eye-stroke" d="M 88 108 C 88 64, 144 64, 144 108" />
                }
                @case ('squeezed') {
                  <path class="eye-stroke" d="M 90 88 L 122 98 L 90 108" />
                  <line class="eye-crease" x1="122" y1="98" x2="136" y2="98" />
                }
                @case ('heart') {
                  <g class="heart-pulse">
                    <path
                      class="eye-fill heart-fill"
                      d="M 116 76 C 100 56, 78 78, 102 108 L 116 122 L 130 108 C 154 78, 132 56, 116 76 Z"
                      fill="url(#loveGlow)"
                    />
                    <circle class="eye-shine" cx="106" cy="84" r="4.5" />
                  </g>
                }
                @case ('sparkle-star') {
                  <path
                    class="eye-fill star-fill"
                    d="M 116 62 Q 116 96 82 96 Q 116 96 116 130 Q 116 96 150 96 Q 116 96 116 62 Z"
                  />
                  <circle class="star-center-shine" cx="116" cy="96" r="6" />
                }
                @case ('circle-open') {
                  <circle class="eye-fill" cx="116" cy="96" r="32" />
                  <circle class="eye-pupil" cx="116" cy="96" r="14" />
                  <circle class="eye-shine" cx="109" cy="88" r="6" />
                }
                @case ('circle-shocked') {
                  <circle class="eye-fill" cx="116" cy="96" r="33" />
                  <circle class="eye-pupil" cx="116" cy="96" r="7" />
                  <circle class="eye-shine" cx="113" cy="93" r="3" />
                }
                @case ('sad-droop') {
                  <path
                    class="eye-fill"
                    d="M 88 114 C 84 90, 128 72, 142 86 C 148 96, 140 122, 124 122 C 108 122, 90 122, 88 114 Z"
                  />
                  <circle class="eye-shine" cx="128" cy="96" r="6" />
                }
                @case ('angry-slant') {
                  <path
                    class="eye-fill"
                    d="M 90 76 L 144 100 C 144 116, 132 124, 118 124 C 100 124, 86 114, 90 76 Z"
                  />
                }
                @case ('half-lid') {
                  <path
                    class="eye-fill"
                    d="M 90 92 L 142 92 C 144 110, 140 120, 130 122 C 118 124, 98 124, 92 122 C 86 118, 86 108, 90 92 Z"
                  />
                  <circle class="eye-pupil" cx="116" cy="108" r="7" />
                  <circle class="eye-shine" cx="108" cy="99" r="4" />
                }
                @case ('sleepy-curve') {
                  <path class="eye-stroke" d="M 90 102 C 92 118, 140 118, 142 102" />
                }
                @case ('thinking') {
                  <path
                    class="eye-fill"
                    d="M 89 74 C 89 64, 143 64, 143 74 C 146 94, 146 108, 143 120 C 143 130, 89 130, 89 120 C 86 108, 86 94, 89 74 Z"
                  />
                  <circle class="eye-pupil" cx="126" cy="85" r="9" />
                  <circle class="eye-shine" cx="123" cy="80" r="4" />
                }
                @case ('watery') {
                  <path
                    class="eye-fill"
                    d="M 88 114 C 84 90, 128 72, 142 86 C 148 96, 140 122, 124 122 C 108 122, 90 122, 88 114 Z"
                  />
                  <!-- Multiple sparkling anime highlights -->
                  <circle class="eye-shine-large" cx="106" cy="88" r="9" />
                  <circle class="eye-shine-med" cx="128" cy="108" r="6" />
                  <circle class="eye-shine-small" cx="112" cy="112" r="3.5" />
                }
                @case ('shy') {
                  <path
                    class="eye-fill"
                    d="M 90 94 L 140 100 C 138 118, 128 122, 114 122 C 96 122, 88 114, 90 94 Z"
                  />
                  <circle class="eye-pupil" cx="108" cy="111" r="7" />
                  <circle class="eye-shine" cx="103" cy="104" r="3.5" />
                }
              }
            </g>

            <!-- RIGHT EYE -->
            <g class="eye-group right-eye" transform-origin="244 96">
              @switch (getEyeType('right')) {
                @case ('squircle') {
                  <path
                    class="eye-fill"
                    d="M 217 74 C 217 64, 271 64, 271 74 C 274 94, 274 108, 271 120 C 271 130, 217 130, 217 120 C 214 108, 214 94, 217 74 Z"
                  />
                  <circle class="eye-pupil" cx="244" cy="98" r="9" />
                  <circle class="eye-shine" cx="234" cy="84" r="5.5" />
                }
                @case ('happy-arc') {
                  <path class="eye-stroke" d="M 216 108 C 216 64, 272 64, 272 108" />
                }
                @case ('squeezed') {
                  <path class="eye-stroke" d="M 270 88 L 238 98 L 270 108" />
                  <line class="eye-crease" x1="238" y1="98" x2="224" y2="98" />
                }
                @case ('heart') {
                  <g class="heart-pulse">
                    <path
                      class="eye-fill heart-fill"
                      d="M 244 76 C 228 56, 206 78, 230 108 L 244 122 L 258 108 C 282 78, 260 56, 244 76 Z"
                      fill="url(#loveGlow)"
                    />
                    <circle class="eye-shine" cx="234" cy="84" r="4.5" />
                  </g>
                }
                @case ('sparkle-star') {
                  <path
                    class="eye-fill star-fill"
                    d="M 244 62 Q 244 96 210 96 Q 244 96 244 130 Q 244 96 278 96 Q 244 96 244 62 Z"
                  />
                  <circle class="star-center-shine" cx="244" cy="96" r="6" />
                }
                @case ('circle-open') {
                  <circle class="eye-fill" cx="244" cy="96" r="32" />
                  <circle class="eye-pupil" cx="244" cy="96" r="14" />
                  <circle class="eye-shine" cx="237" cy="88" r="6" />
                }
                @case ('circle-shocked') {
                  <circle class="eye-fill" cx="244" cy="96" r="33" />
                  <circle class="eye-pupil" cx="244" cy="96" r="7" />
                  <circle class="eye-shine" cx="241" cy="93" r="3" />
                }
                @case ('wink') {
                  <path class="eye-stroke wink-stroke" d="M 218 98 C 228 114, 258 114, 268 98" />
                }
                @case ('sad-droop') {
                  <path
                    class="eye-fill"
                    d="M 272 114 C 276 90, 232 72, 218 86 C 212 96, 220 122, 236 122 C 252 122, 270 122, 272 114 Z"
                  />
                  <circle class="eye-shine" cx="232" cy="96" r="6" />
                }
                @case ('angry-slant') {
                  <path
                    class="eye-fill"
                    d="M 270 76 L 216 100 C 216 116, 228 124, 242 124 C 260 124, 274 114, 270 76 Z"
                  />
                }
                @case ('half-lid') {
                  <path
                    class="eye-fill"
                    d="M 218 92 L 270 92 C 274 110, 270 120, 260 122 C 248 124, 228 124, 222 122 C 216 118, 216 108, 218 92 Z"
                  />
                  <circle class="eye-pupil" cx="244" cy="108" r="7" />
                  <circle class="eye-shine" cx="236" cy="99" r="4" />
                }
                @case ('sleepy-curve') {
                  <path class="eye-stroke" d="M 218 102 C 220 118, 268 118, 270 102" />
                }
                @case ('thinking') {
                  <path
                    class="eye-fill"
                    d="M 217 74 C 217 64, 271 64, 271 74 C 274 94, 274 108, 271 120 C 271 130, 217 130, 217 120 C 214 108, 214 94, 217 74 Z"
                  />
                  <circle class="eye-pupil" cx="254" cy="85" r="9" />
                  <circle class="eye-shine" cx="251" cy="80" r="4" />
                }
                @case ('watery') {
                  <path
                    class="eye-fill"
                    d="M 272 114 C 276 90, 232 72, 218 86 C 212 96, 220 122, 236 122 C 252 122, 270 122, 272 114 Z"
                  />
                  <circle class="eye-shine-large" cx="234" cy="88" r="9" />
                  <circle class="eye-shine-med" cx="256" cy="108" r="6" />
                  <circle class="eye-shine-small" cx="240" cy="112" r="3.5" />
                }
                @case ('shy') {
                  <path
                    class="eye-fill"
                    d="M 270 94 L 220 100 C 222 118, 232 122, 246 122 C 264 122, 272 114, 270 94 Z"
                  />
                  <circle class="eye-pupil" cx="236" cy="111" r="7" />
                  <circle class="eye-shine" cx="231" cy="104" r="3.5" />
                }
              }
            </g>
          </g>

          <!-- 4. MOUTH LAYER -->
          <g class="mouth-group">
            @switch (getMouthType()) {
              @case ('dash') {
                <rect class="mouth-shape" x="170" y="154" width="20" height="5" rx="2.5" />
              }
              @case ('smile') {
                <path class="mouth-stroke" d="M 166 150 Q 180 164, 194 150" />
              }
              @case ('big-smile') {
                <path class="mouth-shape" d="M 160 146 Q 180 150, 200 146 C 200 168, 160 168, 160 146 Z" />
              }
              @case ('laughing') {
                <g class="laughing-mouth">
                  <path class="mouth-shape" d="M 156 144 Q 180 148, 204 144 C 206 174, 154 174, 156 144 Z" />
                  <!-- Glowing pink tongue -->
                  <path d="M 164 162 Q 180 152, 196 162 C 196 172, 164 172, 164 162 Z" fill="url(#tongueGrad)" />
                </g>
              }
              @case ('open-o') {
                <circle class="mouth-stroke" cx="180" cy="156" r="8" />
              }
              @case ('shocked-o') {
                <ellipse class="mouth-stroke" cx="180" cy="158" rx="8" ry="14" />
              }
              @case ('frown') {
                <path class="mouth-stroke" d="M 166 164 Q 180 150, 194 164" />
              }
              @case ('crying-open') {
                <path class="mouth-shape" d="M 164 154 Q 180 146, 196 154 C 192 172, 168 172, 164 154 Z" />
              }
              @case ('squiggle') {
                <path class="mouth-stroke" d="M 164 158 Q 172 152, 180 158 T 196 158" />
              }
              @case ('dots') {
                <circle class="mouth-shape" cx="170" cy="158" r="3.5" />
                <circle class="mouth-shape" cx="180" cy="158" r="3.5" />
                <circle class="mouth-shape" cx="190" cy="158" r="3.5" />
              }
              @case ('smirk') {
                <path class="mouth-stroke" d="M 166 160 Q 182 164, 198 148" />
              }
              @case ('tiny-dot') {
                <circle class="mouth-shape" cx="180" cy="158" r="3.5" />
              }
            }
          </g>

          <!-- 5. EMOTION ACCENTS & PROPS LAYER -->
          <!-- A. Confused Question Mark -->
          @if (normalizedState === 'confused') {
            <text class="accent-glow accent-bob float-question" x="272" y="58">?</text>
          }

          <!-- B. Angry Anime Vein (💢) -->
          @if (normalizedState === 'angry') {
            <g class="anger-vein" transform="translate(272, 40)">
              <path d="M -10 -3 C -3 -3, 3 -9, 3 -16 M -3 -10 C -3 -3, 3 3, 10 3 M 3 -16 C 10 -16, 16 -10, 16 -3 M 10 3 C 16 3, 22 -3, 22 -10" />
            </g>
          }

          <!-- C. Sleeping Zzz Floating Letters -->
          @if (normalizedState === 'sleeping') {
            <g class="sleep-zzz-group">
              <text class="sleep-z z1" x="252" y="58">Z</text>
              <text class="sleep-z z2" x="268" y="44">z</text>
              <text class="sleep-z z3" x="284" y="30">z</text>
            </g>
          }

          <!-- D. Crying Streams and Teardrops -->
          @if (normalizedState === 'crying') {
            <g class="crying-streams">
              <path class="tear-stream left" d="M 106 122 Q 102 145, 106 172" />
              <path class="tear-stream right" d="M 254 122 Q 258 145, 254 172" />
              <circle class="tear-drop left" cx="106" cy="180" r="4.5" />
              <circle class="tear-drop right" cx="254" cy="180" r="4.5" />
              <circle class="tear-splash" cx="98" cy="186" r="2.5" />
              <circle class="tear-splash" cx="262" cy="186" r="2.5" />
            </g>
          }

          <!-- E. Lonely Single Tear -->
          @if (normalizedState === 'lonely') {
            <g class="lonely-tear">
              <path class="tear-stream right" d="M 254 122 Q 256 142, 254 165" />
              <circle class="tear-drop right" cx="254" cy="172" r="4" />
            </g>
          }

          <!-- F. Joy Tears (Laughing with tears) -->
          @if (normalizedState === 'laughing-tears' || normalizedState === 'excited') {
            <g class="joy-tears">
              <path class="joy-tear-drop left" d="M 76 96 C 66 86, 62 104, 76 96 Z" />
              <path class="joy-tear-drop right" d="M 284 96 C 294 86, 298 104, 284 96 Z" />
              <circle class="tear-splash" cx="64" cy="106" r="3" />
              <circle class="tear-splash" cx="296" cy="106" r="3" />
            </g>
          }

          <!-- G. Sweat Drop (Shocked / Scared) -->
          @if (normalizedState === 'shocked' || normalizedState === 'scared') {
            <g class="sweat-accent">
              <path class="sweat-drop-shape" d="M 278 46 C 270 58, 286 58, 278 46 Z" />
              @if (normalizedState === 'scared') {
                <path class="sweat-drop-shape left-sweat" d="M 82 46 C 74 58, 90 58, 82 46 Z" />
              }
            </g>
          }

          <!-- H. Celebrating Floating Confetti -->
          @if (normalizedState === 'celebrating') {
            <g class="confetti-group">
              <rect class="confetti c1" x="50" y="40" width="7" height="4" rx="1.5" />
              <rect class="confetti c2" x="75" y="70" width="5" height="5" rx="1" />
              <circle class="confetti c3" cx="180" cy="30" r="3.5" />
              <rect class="confetti c4" x="285" y="45" width="6" height="4" rx="1.5" />
              <circle class="confetti c5" cx="310" cy="75" r="3" />
              <rect class="confetti c6" x="60" y="150" width="6" height="4" rx="1.5" />
              <rect class="confetti c7" x="300" y="145" width="7" height="4" rx="1.5" />
              <circle class="confetti c8" cx="180" cy="188" r="3" />
            </g>
          }

          <!-- I. Greeting Waving Robotic Hand (👋) -->
          @if (normalizedState === 'greeting') {
            <g class="waving-hand-robot" transform="translate(42, 114)">
              <!-- Palm -->
              <path
                class="hand-stroke"
                d="M -6 12 C -10 12, -14 6, -14 0 L -14 -12 C -14 -16, -10 -18, -6 -18 C -2 -18, 0 -15, 0 -12 L 0 -18 C 0 -22, 4 -24, 8 -24 C 12 -24, 14 -22, 14 -18 L 14 -14 C 14 -18, 18 -20, 22 -20 C 26 -20, 28 -18, 28 -14 L 28 4 C 28 14, 18 22, 6 22 L -2 22 C -6 22, -10 18, -10 12 Z"
              />
              <!-- Motion ripple arcs -->
              <path class="wave-arc a1" d="M 32 -18 C 36 -12, 36 -2, 32 4" />
              <path class="wave-arc a2" d="M 38 -24 C 44 -14, 44 4, 38 12" />
            </g>
          }
        </svg>
      </div>

      <!-- Quick Control Bar / Expression Selector Trigger -->
      <!-- <div class="control-bar" (click)="$event.stopPropagation()">
        <button
          class="pill-btn"
          [class.active]="drawerOpen"
          (click)="toggleDrawer()"
          title="Toggle Expressions Palette"
        >
          <span class="bot-status-dot" [class.auto-on]="isAutoMode"></span>
          <span class="pill-label">{{ currentDisplayLabel }}</span>
          <span class="pill-arrow">{{ drawerOpen ? '▴' : '▾' }}</span>
        </button>

        <button
          class="pill-btn auto-toggle-btn"
          [class.active]="isAutoMode"
          (click)="toggleAutoMode()"
          title="Toggle Organic Mood Drift"
        >
          {{ isAutoMode ? 'Auto: ON' : 'Auto: OFF' }}
        </button>

        <button
          class="pill-btn icon-only-btn"
          (click)="cycleNextExpression()"
          title="Next Expression"
        >
          ▶
        </button>
      </div> -->

      <!-- Expandable Expression Drawer (Categorized) -->
      @if (drawerOpen) {
        <div class="expression-drawer" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <span class="drawer-title">Companion Bot Expressions ({{ allStates.length }})</span>
            <button class="drawer-close-btn" (click)="toggleDrawer()">✕</button>
          </div>

          <div class="drawer-categories">
            @for (cat of categories; track cat.name) {
              <div class="category-block">
                <div class="category-header">{{ cat.name }}</div>
                <div class="category-chips">
                  @for (item of cat.expressions; track item.id) {
                    <button
                      class="expr-chip"
                      [class.is-selected]="currentState === item.id"
                      (click)="selectExpression(item.id)"
                    >
                      <span class="chip-icon">{{ item.icon }}</span>
                      <span class="chip-label">{{ item.label }}</span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --bg: #000000;
      --screen-bg: #06080e;
      --glow: #3bf1ff;
      --glow-dim: #1398a6;
      --glow-bloom: rgba(59, 241, 255, 0.75);
      --ink: #ffffff;
      --ease: cubic-bezier(.34, 1.56, .64, 1);
      display: block;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
    }

    .stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 50% 40%, #0d111a 0%, var(--bg) 85%);
      position: relative;
      overflow: hidden;
      padding: 12px;
      box-sizing: border-box;
    }

    /* ===== ROBOT MONITOR FRAME ===== */
    .robot-screen-frame {
      width: 100%;
      max-width: 440px;
      aspect-ratio: 16 / 10;
      max-height: calc(100vh - 74px);
      background: var(--screen-bg);
      border-radius: 28px;
      border: 3px solid #1c2230;
      box-shadow:
        0 14px 40px -10px rgba(0, 0, 0, 0.85),
        inset 0 1px 2px rgba(255, 255, 255, 0.1),
        0 0 30px rgba(59, 241, 255, 0.08);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: border-color 0.4s ease, box-shadow 0.4s ease, transform 0.25s ease;
    }

    .robot-screen-frame:active {
      transform: scale(0.985);
    }

    /* Themes */
    .robot-screen-frame.theme-angry {
      --glow: #ff2d4a;
      --glow-dim: #b3142c;
      --glow-bloom: rgba(255, 45, 74, 0.8);
      border-color: #38161e;
      box-shadow:
        0 14px 40px -10px rgba(0, 0, 0, 0.85),
        inset 0 1px 2px rgba(255, 100, 120, 0.2),
        0 0 35px rgba(255, 45, 74, 0.22);
    }

    .robot-screen-frame.theme-love {
      --glow: #ff4785;
      --glow-dim: #b31b48;
      --glow-bloom: rgba(255, 71, 133, 0.85);
      border-color: #381926;
      box-shadow:
        0 14px 40px -10px rgba(0, 0, 0, 0.85),
        inset 0 1px 2px rgba(255, 120, 160, 0.2),
        0 0 35px rgba(255, 71, 133, 0.22);
    }

    .robot-screen-frame.theme-blush {
      box-shadow:
        0 14px 40px -10px rgba(0, 0, 0, 0.85),
        inset 0 1px 2px rgba(255, 255, 255, 0.1),
        0 0 35px rgba(255, 79, 139, 0.16);
    }

    /* Ambient Bloom inside Screen */
    .ambient-glow {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(circle at 50% 50%, var(--glow-bloom) 0%, transparent 68%);
      opacity: 0.14;
      transition: opacity 0.4s ease, background 0.4s ease;
      z-index: 1;
    }

    /* Sensor Dot on top Bezel */
    .bezel-sensor {
      position: absolute;
      top: 9px;
      left: 50%;
      transform: translateX(-50%);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #11151e;
      border: 1px solid #232a3b;
      z-index: 5;
    }

    /* Glass Glare Highlight */
    .glass-glare {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 42%);
      border-radius: inherit;
      z-index: 4;
    }

    /* ===== SVG ROBOT FACE ===== */
    .face-svg {
      width: 100%;
      height: 100%;
      z-index: 2;
      color: var(--glow);
      filter: drop-shadow(0 0 8px var(--glow)) drop-shadow(0 0 22px var(--glow-bloom));
      transition: filter 0.35s ease, color 0.35s ease, transform 0.25s ease;
    }

    /* Eye & Mouth Base Styling */
    .eye-fill {
      fill: currentColor;
    }

    .eye-stroke {
      fill: none;
      stroke: currentColor;
      stroke-width: 15;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .eye-crease {
      stroke: currentColor;
      stroke-width: 7;
      stroke-linecap: round;
    }

    .wink-stroke {
      stroke-width: 13;
    }

    .eye-pupil {
      fill: var(--screen-bg);
      opacity: 0.45;
    }

    .eye-shine, .star-center-shine {
      fill: #ffffff;
      opacity: 0.95;
    }

    .eye-shine-large { fill: #ffffff; opacity: 0.95; }
    .eye-shine-med { fill: #ffffff; opacity: 0.85; }
    .eye-shine-small { fill: #ffffff; opacity: 0.7; }

    /* Cheeks */
    .cheek-blush {
      filter: blur(4px);
    }

    /* Eyebrows */
    .eyebrow {
      fill: none;
      stroke: currentColor;
      stroke-width: 6;
      stroke-linecap: round;
    }

    /* Mouth */
    .mouth-shape {
      fill: currentColor;
    }

    .mouth-stroke {
      fill: none;
      stroke: currentColor;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Floating Accents */
    .accent-glow {
      color: currentColor;
      font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
      font-weight: 900;
      font-size: 32px;
      text-anchor: middle;
    }

    .accent-bob {
      animation: floatBob 1.6s ease-in-out infinite alternate;
    }

    @keyframes floatBob {
      0% { transform: translateY(0); }
      100% { transform: translateY(-7px); }
    }

    /* Angry Vein */
    .anger-vein {
      animation: pulseVein 0.9s ease-in-out infinite;
    }

    .anger-vein path {
      fill: none;
      stroke: #ff2d4a;
      stroke-width: 4.5;
      stroke-linecap: round;
    }

    @keyframes pulseVein {
      0%, 100% { transform: translate(272px, 40px) scale(0.9); }
      50% { transform: translate(272px, 40px) scale(1.18); }
    }

    /* Heart Pulse */
    .heart-pulse {
      animation: beatHeart 1.4s ease-in-out infinite;
    }

    @keyframes beatHeart {
      0%, 100% { transform: scale(1); }
      35% { transform: scale(1.08); }
      50% { transform: scale(0.96); }
      65% { transform: scale(1.05); }
    }

    /* Sleep Zzz */
    .sleep-zzz-group text {
      fill: currentColor;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      opacity: 0;
      animation: floatZ 2.4s ease-out infinite;
    }

    .sleep-zzz-group .z1 { font-size: 20px; animation-delay: 0s; }
    .sleep-zzz-group .z2 { font-size: 16px; animation-delay: 0.7s; }
    .sleep-zzz-group .z3 { font-size: 12px; animation-delay: 1.4s; }

    @keyframes floatZ {
      0% { opacity: 0; transform: translate(0, 0) scale(0.6); }
      30% { opacity: 0.9; }
      100% { opacity: 0; transform: translate(18px, -42px) scale(1.2); }
    }

    /* Crying Streams & Drops */
    .tear-stream {
      fill: none;
      stroke: #52e5ff;
      stroke-width: 4;
      stroke-dasharray: 8 6;
      animation: streamTears 1.2s linear infinite;
    }

    @keyframes streamTears {
      0% { stroke-dashoffset: 28; }
      100% { stroke-dashoffset: 0; }
    }

    .tear-drop {
      fill: #52e5ff;
      animation: dripTear 1.6s ease-in infinite;
    }

    .tear-splash {
      fill: #52e5ff;
      opacity: 0.6;
    }

    @keyframes dripTear {
      0% { opacity: 0; transform: translateY(-6px) scale(0.6); }
      30% { opacity: 1; }
      100% { opacity: 0; transform: translateY(16px) scale(1); }
    }

    /* Joy Tears */
    .joy-tear-drop {
      fill: currentColor;
      animation: pulseJoy 1.2s ease-in-out infinite alternate;
    }

    @keyframes pulseJoy {
      0% { transform: scale(0.8); }
      100% { transform: scale(1.15); }
    }

    /* Sweat Drop */
    .sweat-drop-shape {
      fill: #4fe2ff;
      animation: dripSweat 1.8s ease-out infinite;
    }

    @keyframes dripSweat {
      0% { opacity: 0; transform: translateY(-4px) scale(0.7); }
      35% { opacity: 0.95; }
      100% { opacity: 0; transform: translateY(24px) scale(1.05); }
    }

    /* Confetti */
    .confetti {
      animation: flutterConfetti 2s ease-out infinite;
    }

    .confetti.c1 { fill: #ff4081; animation-delay: 0.1s; }
    .confetti.c2 { fill: #ffd600; animation-delay: 0.4s; }
    .confetti.c3 { fill: #00e5ff; animation-delay: 0.2s; }
    .confetti.c4 { fill: #7c4dff; animation-delay: 0.6s; }
    .confetti.c5 { fill: #00e676; animation-delay: 0.3s; }
    .confetti.c6 { fill: #ff6d00; animation-delay: 0.5s; }
    .confetti.c7 { fill: #ff4081; animation-delay: 0.8s; }
    .confetti.c8 { fill: #00e5ff; animation-delay: 0.7s; }

    @keyframes flutterConfetti {
      0% { opacity: 0; transform: translateY(-12px) rotate(0deg); }
      20% { opacity: 1; }
      100% { opacity: 0; transform: translateY(32px) rotate(220deg); }
    }

    /* Waving Hand */
    .waving-hand-robot {
      animation: waveHand 1.1s ease-in-out infinite alternate;
      transform-origin: 0 16px;
    }

    .hand-stroke {
      fill: none;
      stroke: currentColor;
      stroke-width: 4.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .wave-arc {
      fill: none;
      stroke: currentColor;
      stroke-width: 2.5;
      stroke-linecap: round;
      opacity: 0.7;
    }

    @keyframes waveHand {
      0% { transform: translate(42px, 114px) rotate(-16deg); }
      100% { transform: translate(42px, 114px) rotate(24deg); }
    }

    /* ===== MICRO ANIMATIONS ===== */
    .face-svg.micro-blink .eyes-layer {
      animation: microBlink 0.16s ease-in-out both;
    }

    .face-svg.micro-double-blink .eyes-layer {
      animation: microDoubleBlink 0.48s ease-in-out both;
    }

    .face-svg.micro-slow-blink .eyes-layer {
      animation: microSlowBlink 0.7s ease-in-out both;
    }

    .face-svg.micro-look-left .eyes-layer {
      animation: microLookLeft 0.55s var(--ease) both;
    }

    .face-svg.micro-look-right .eyes-layer {
      animation: microLookRight 0.55s var(--ease) both;
    }

    .face-svg.micro-look-around .eyes-layer {
      animation: microLookAround 0.9s var(--ease) both;
    }

    .face-svg.micro-eye-pulse {
      animation: microEyePulse 0.5s ease-out both;
    }

    .face-svg.micro-settle {
      animation: microSettle 0.6s var(--ease) both;
    }

    @keyframes microBlink {
      0%, 100% { transform: scaleY(1); }
      45%, 55% { transform: scaleY(0.08); }
    }

    @keyframes microDoubleBlink {
      0%, 25%, 45%, 100% { transform: scaleY(1); }
      12%, 35% { transform: scaleY(0.06); }
    }

    @keyframes microSlowBlink {
      0%, 100% { transform: scaleY(1); }
      40% { transform: scaleY(0.06); }
      70% { transform: scaleY(0.3); }
    }

    @keyframes microLookLeft {
      0%, 100% { transform: translate(0, 0); }
      30%, 75% { transform: translate(-15px, 0); }
    }

    @keyframes microLookRight {
      0%, 100% { transform: translate(0, 0); }
      30%, 75% { transform: translate(15px, 0); }
    }

    @keyframes microLookAround {
      0%, 100% { transform: translate(0, 0); }
      25% { transform: translate(-12px, -4px); }
      55% { transform: translate(12px, 4px); }
      75% { transform: translate(6px, -2px); }
    }

    @keyframes microEyePulse {
      0%, 100% { filter: drop-shadow(0 0 8px var(--glow)) drop-shadow(0 0 22px var(--glow-bloom)); }
      50% { filter: drop-shadow(0 0 14px var(--glow)) drop-shadow(0 0 32px var(--glow-bloom)) brightness(1.2); }
    }

    @keyframes microSettle {
      0%, 100% { transform: translateY(0); }
      40% { transform: translateY(3px) scale(0.99); }
    }

    /* Transition Animation */
    .robot-screen-frame.is-transitioning .face-svg {
      animation: faceMorph 0.32s var(--ease) both;
    }

    @keyframes faceMorph {
      0% { opacity: 0.75; transform: scale(0.96); }
      50% { opacity: 1; transform: scale(1.02); }
      100% { opacity: 1; transform: scale(1); }
    }

    /* ===== QUICK CONTROLS BAR ===== */
    .control-bar {
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 10;
    }

    .pill-btn {
      background: rgba(22, 27, 36, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.3px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: all 0.2s ease;
    }

    .pill-btn:hover {
      background: rgba(35, 43, 58, 0.95);
      border-color: rgba(255, 255, 255, 0.25);
    }

    .pill-btn.active {
      background: var(--glow);
      color: #060910;
      border-color: var(--glow);
      box-shadow: 0 0 14px var(--glow-bloom);
    }

    .bot-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #718096;
      transition: background 0.2s ease;
    }

    .bot-status-dot.auto-on {
      background: #38ef7d;
      box-shadow: 0 0 8px #38ef7d;
    }

    .pill-arrow {
      font-size: 9px;
      opacity: 0.7;
    }

    .icon-only-btn {
      padding: 6px 11px;
    }

    /* ===== EXPANDABLE DRAWER ===== */
    .expression-drawer {
      position: absolute;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      width: min(92vw, 560px);
      max-height: 52vh;
      background: rgba(14, 18, 26, 0.94);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 18px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 25;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: drawerSlideUp 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }

    @keyframes drawerSlideUp {
      0% { opacity: 0; transform: translate(-50%, 15px) scale(0.96); }
      100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.03);
    }

    .drawer-title {
      font-size: 13px;
      font-weight: 700;
      color: #e2e8f0;
      letter-spacing: 0.3px;
    }

    .drawer-close-btn {
      background: transparent;
      border: none;
      color: #a0aec0;
      font-size: 16px;
      cursor: pointer;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .drawer-close-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    .drawer-categories {
      overflow-y: auto;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .category-header {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #718096;
      margin-bottom: 6px;
    }

    .category-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .expr-chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #cbd5e0;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 11.5px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
    }

    .expr-chip:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    .expr-chip.is-selected {
      background: var(--glow);
      color: #060910;
      font-weight: 700;
      border-color: var(--glow);
      box-shadow: 0 0 10px var(--glow-bloom);
    }

    .chip-icon {
      font-size: 13px;
    }
  `]
})
export class CompanionRobotComponent implements OnInit, OnDestroy {
  public currentState: RobotExpression = 'neutral';
  public isAutoMode = true;
  public drawerOpen = false;

  public microBehavior: MicroBehavior = 'none';
  public isTransitioning = false;

  // Emotional Model
  public mood = 0.6; // 0 (sad) -> 1 (joy)
  public energy = 0.6; // 0 (drowsy) -> 1 (hyper)
  public attention = 0.6; // 0 (bored) -> 1 (focused/alert)

  private randomizerId: ReturnType<typeof setTimeout> | null = null;
  private microBehaviorId: ReturnType<typeof setTimeout> | null = null;
  private transitionId: ReturnType<typeof setTimeout> | null = null;
  private moodId: ReturnType<typeof setTimeout> | null = null;

  private recentStates: RobotExpression[] = [];

  // All 35 expressions
  public readonly allStates: RobotExpression[] = [
    // Row 1
    'neutral',
    'happy',
    'big-smile',
    'laughing',
    'laughing-tears',
    'excited',
    'love',
    // Row 2
    'blushing',
    'curious',
    'confused',
    'thinking',
    'surprised',
    'surprised-open',
    'shocked',
    // Row 3
    'sad',
    'crying',
    'worried',
    'worried-alt',
    'scared',
    'angry',
    'annoyed',
    // Row 4
    'embarrassed',
    'shy',
    'mischievous',
    'mischievous-alt',
    'playful',
    'bored',
    'sleepy',
    // Row 5
    'sleeping',
    'proud',
    'suspicious',
    'suspicious-alt',
    'celebrating',
    'greeting',
    'lonely'
  ];

  public readonly categories: ExpressionCategory[] = [
    {
      name: 'Happy & Playful',
      expressions: [
        { id: 'happy', label: 'Happy', icon: '😊' },
        { id: 'big-smile', label: 'Big Smile', icon: '😃' },
        { id: 'laughing', label: 'Laughing', icon: '😆' },
        { id: 'laughing-tears', label: 'Joy Tears', icon: '😂' },
        { id: 'excited', label: 'Excited', icon: '🤩' },
        { id: 'playful', label: 'Playful', icon: '😜' },
        { id: 'proud', label: 'Proud', icon: '😏' },
        { id: 'greeting', label: 'Greeting', icon: '👋' },
        { id: 'celebrating', label: 'Celebrate', icon: '🎉' }
      ]
    },
    {
      name: 'Loving & Cute',
      expressions: [
        { id: 'love', label: 'Love', icon: '😍' },
        { id: 'blushing', label: 'Blushing', icon: '🥰' },
        { id: 'shy', label: 'Shy', icon: '🥺' },
        { id: 'embarrassed', label: 'Embarrassed', icon: '😳' }
      ]
    },
    {
      name: 'Curious & Thinking',
      expressions: [
        { id: 'curious', label: 'Curious', icon: '🧐' },
        { id: 'confused', label: 'Confused', icon: '🤔' },
        { id: 'thinking', label: 'Thinking', icon: '💭' },
        { id: 'mischievous', label: 'Mischief', icon: '😈' },
        { id: 'mischievous-alt', label: 'Wink Sclk', icon: '😉' }
      ]
    },
    {
      name: 'Surprised & Intense',
      expressions: [
        { id: 'surprised', label: 'Surprised', icon: '😮' },
        { id: 'surprised-open', label: 'Surprised (O)', icon: '😲' },
        { id: 'shocked', label: 'Shocked', icon: '😱' },
        { id: 'scared', label: 'Scared', icon: '😨' }
      ]
    },
    {
      name: 'Sad & Emotional',
      expressions: [
        { id: 'sad', label: 'Sad', icon: '😢' },
        { id: 'crying', label: 'Crying', icon: '😭' },
        { id: 'worried', label: 'Worried', icon: '😟' },
        { id: 'worried-alt', label: 'Worried 2', icon: '😦' },
        { id: 'lonely', label: 'Lonely', icon: '🥺' }
      ]
    },
    {
      name: 'Angry & Annoyed',
      expressions: [
        { id: 'angry', label: 'Angry', icon: '😡' },
        { id: 'annoyed', label: 'Annoyed', icon: '😒' },
        { id: 'suspicious', label: 'Suspicious', icon: '🤨' },
        { id: 'suspicious-alt', label: 'Narrow Slit', icon: '😑' },
        { id: 'bored', label: 'Bored', icon: '🥱' }
      ]
    },
    {
      name: 'Idle & Sleep',
      expressions: [
        { id: 'neutral', label: 'Neutral / Idle', icon: '🤖' },
        { id: 'sleepy', label: 'Sleepy', icon: '😪' },
        { id: 'sleeping', label: 'Sleeping (Zzz)', icon: '💤' }
      ]
    }
  ];

  // Natural state duration ranges (ms)
  private readonly expressionDurations: Record<string, [number, number]> = {
    neutral: [3000, 7500],
    happy: [1500, 4200],
    'big-smile': [1400, 3800],
    laughing: [1200, 3200],
    'laughing-tears': [1200, 3400],
    excited: [1000, 2800],
    love: [2000, 4800],
    blushing: [1800, 4200],
    curious: [1500, 3600],
    confused: [1600, 3800],
    thinking: [1800, 4200],
    surprised: [800, 2200],
    'surprised-open': [800, 2200],
    shocked: [700, 2000],
    sad: [2000, 5000],
    crying: [2200, 5500],
    worried: [1800, 4500],
    'worried-alt': [1800, 4500],
    scared: [900, 2400],
    angry: [1100, 3000],
    annoyed: [1800, 4200],
    embarrassed: [2000, 4600],
    shy: [2000, 4800],
    mischievous: [1500, 3800],
    'mischievous-alt': [1500, 3800],
    playful: [1400, 3500],
    bored: [2500, 6000],
    sleepy: [2800, 7000],
    sleeping: [3500, 9000],
    proud: [1800, 4200],
    suspicious: [1800, 4500],
    'suspicious-alt': [1800, 4500],
    celebrating: [1800, 4500],
    greeting: [2000, 4800],
    lonely: [2200, 5500]
  };

  public get normalizedState(): RobotExpression {
    // Map legacy aliases
    if (this.currentState === 'relaxed') return 'proud';
    if (this.currentState === 'nervous') return 'worried';
    if (this.currentState === 'frustrated') return 'annoyed';
    return this.currentState;
  }

  public get isBlushState(): boolean {
    const s = this.normalizedState;
    return (
      s === 'big-smile' ||
      s === 'laughing' ||
      s === 'laughing-tears' ||
      s === 'excited' ||
      s === 'love' ||
      s === 'blushing' ||
      s === 'embarrassed' ||
      s === 'shy'
    );
  }

  public get currentDisplayLabel(): string {
    for (const cat of this.categories) {
      for (const expr of cat.expressions) {
        if (expr.id === this.normalizedState) {
          return expr.label;
        }
      }
    }
    return this.normalizedState;
  }

  ngOnInit() {
    this.startMoodDrift();
    this.startMicroBehaviorLoop();
    this.startAutoMode();
  }

  ngOnDestroy() {
    this.stopAutoMode();
    if (this.microBehaviorId) clearTimeout(this.microBehaviorId);
    if (this.transitionId) clearTimeout(this.transitionId);
    if (this.moodId) clearTimeout(this.moodId);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'n') {
      this.cycleNextExpression();
    } else if (event.key === 'ArrowLeft') {
      this.cyclePrevExpression();
    } else if (event.key === ' ' || event.key === 'a') {
      this.toggleAutoMode();
    }
  }

  public setState(state: RobotExpression) {
    this.applyExpression(state, true);
  }

  public selectExpression(state: RobotExpression) {
    this.isAutoMode = false;
    this.stopAutoMode();
    this.applyExpression(state, true);
  }

  public toggleAutoMode() {
    this.isAutoMode = !this.isAutoMode;
    if (this.isAutoMode) {
      this.startAutoMode();
    } else {
      this.stopAutoMode();
    }
  }

  public toggleDrawer() {
    this.drawerOpen = !this.drawerOpen;
  }

  public onStageClick(event: MouseEvent) {
    if (this.drawerOpen) {
      this.drawerOpen = false;
    }
  }

  public onScreenTap(event: MouseEvent) {
    event.stopPropagation();
    // Cute reaction to screen touch!
    const reactions: RobotExpression[] = [
      'happy',
      'big-smile',
      'blushing',
      'love',
      'curious',
      'playful',
      'greeting'
    ];
    const pick = reactions[Math.floor(Math.random() * reactions.length)];
    this.applyExpression(pick, false);
    this.attention = Math.min(1, this.attention + 0.25);
    this.mood = Math.min(1, this.mood + 0.15);
  }

  public cycleNextExpression() {
    const currentIndex = this.allStates.indexOf(this.normalizedState);
    const nextIndex = (currentIndex + 1) % this.allStates.length;
    this.selectExpression(this.allStates[nextIndex]);
  }

  public cyclePrevExpression() {
    const currentIndex = this.allStates.indexOf(this.normalizedState);
    const prevIndex = (currentIndex - 1 + this.allStates.length) % this.allStates.length;
    this.selectExpression(this.allStates[prevIndex]);
  }

  public getEyeType(side: 'left' | 'right'): string {
    const s = this.normalizedState;

    switch (s) {
      case 'neutral':
        return 'squircle';
      case 'happy':
      case 'big-smile':
      case 'blushing':
      case 'greeting':
        return 'happy-arc';
      case 'laughing':
      case 'laughing-tears':
        return 'squeezed';
      case 'love':
        return 'heart';
      case 'excited':
      case 'celebrating':
        return 'sparkle-star';
      case 'curious':
        return side === 'left' ? 'circle-open' : 'wink';
      case 'confused':
        return side === 'left' ? 'circle-open' : 'half-lid';
      case 'thinking':
        return 'thinking';
      case 'surprised':
      case 'surprised-open':
        return 'circle-open';
      case 'shocked':
        return 'circle-shocked';
      case 'scared':
        return 'circle-shocked';
      case 'sad':
      case 'crying':
      case 'worried':
      case 'worried-alt':
      case 'lonely':
        return 'sad-droop';
      case 'angry':
        return 'angry-slant';
      case 'annoyed':
      case 'bored':
      case 'suspicious':
      case 'suspicious-alt':
        return 'half-lid';
      case 'proud':
        return 'half-lid';
      case 'embarrassed':
        return 'watery';
      case 'shy':
        return 'shy';
      case 'mischievous':
        return side === 'left' ? 'circle-open' : 'half-lid';
      case 'mischievous-alt':
        return side === 'left' ? 'circle-open' : 'wink';
      case 'playful':
        return side === 'left' ? 'sparkle-star' : 'wink';
      case 'sleepy':
      case 'sleeping':
        return 'sleepy-curve';
      default:
        return 'squircle';
    }
  }

  public getMouthType(): string {
    const s = this.normalizedState;

    switch (s) {
      case 'neutral':
      case 'annoyed':
      case 'bored':
      case 'suspicious':
      case 'suspicious-alt':
        return 'dash';
      case 'happy':
      case 'love':
      case 'greeting':
        return 'smile';
      case 'big-smile':
      case 'blushing':
      case 'playful':
        return 'big-smile';
      case 'laughing':
      case 'laughing-tears':
      case 'excited':
      case 'celebrating':
        return 'laughing';
      case 'curious':
      case 'surprised':
        return 'open-o';
      case 'surprised-open':
      case 'shocked':
        return 'shocked-o';
      case 'sad':
      case 'worried-alt':
      case 'lonely':
        return 'frown';
      case 'crying':
        return 'crying-open';
      case 'confused':
      case 'scared':
      case 'worried':
        return 'squiggle';
      case 'thinking':
        return 'dots';
      case 'mischievous':
      case 'mischievous-alt':
      case 'proud':
        return 'smirk';
      case 'embarrassed':
      case 'shy':
      case 'sleeping':
      case 'sleepy':
        return 'tiny-dot';
      default:
        return 'dash';
    }
  }

  private applyExpression(state: RobotExpression, manual: boolean) {
    this.currentState = state;
    this.triggerTransition();
    this.rememberState(state);

    if (manual) {
      this.clearMicroBehavior();
    }
  }

  private triggerTransition() {
    this.isTransitioning = false;
    if (this.transitionId) clearTimeout(this.transitionId);

    requestAnimationFrame(() => {
      this.isTransitioning = true;
      this.transitionId = setTimeout(() => {
        this.isTransitioning = false;
      }, 340);
    });
  }

  private rememberState(state: RobotExpression) {
    this.recentStates = [state, ...this.recentStates.filter(s => s !== state)].slice(0, 5);
  }

  /* ===== ORGANIC AMBIENT BEHAVIOR ENGINE ===== */
  private startAutoMode() {
    this.pickNaturalState(true);
  }

  private stopAutoMode() {
    if (this.randomizerId) {
      clearTimeout(this.randomizerId);
      this.randomizerId = null;
    }
  }

  private pickNaturalState(firstPick = false) {
    if (!this.isAutoMode) return;

    let nextState = this.chooseWeightedExpression();

    if (!firstPick && this.shouldReturnToBaseline()) {
      nextState = this.energy < 0.3 ? 'sleepy' : 'neutral';
    }

    this.applyExpression(nextState, false);

    const range = this.expressionDurations[nextState] || [2500, 5000];
    const duration = this.naturalDuration(range[0], range[1]);

    this.randomizerId = setTimeout(() => {
      this.pickNaturalState();
    }, duration);
  }

  private chooseWeightedExpression(): RobotExpression {
    const pool = this.allStates.map(state => ({
      state,
      weight: this.calculateWeight(state)
    }));

    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;

    for (const item of pool) {
      roll -= item.weight;
      if (roll <= 0) return item.state;
    }

    return 'neutral';
  }

  private calculateWeight(state: RobotExpression): number {
    let weight = 8;

    // Baseline favourites
    if (state === 'neutral') weight = 36;
    if (state === 'happy') weight = 16;
    if (state === 'big-smile') weight = 12;
    if (state === 'curious') weight = 10;
    if (state === 'blushing') weight = 9;
    if (state === 'greeting') weight = 8;
    if (state === 'proud') weight = 8;
    if (state === 'thinking') weight = 8;
    if (state === 'surprised') weight = 7;
    if (state === 'love') weight = 7;
    if (state === 'playful') weight = 8;
    if (state === 'sleepy') weight = 7;
    if (state === 'sleeping') weight = 6;

    // Mood influences
    if (this.mood > 0.6) {
      if (['happy', 'big-smile', 'laughing', 'laughing-tears', 'excited', 'love', 'celebrating'].includes(state)) {
        weight += this.mood * 14;
      }
    } else {
      if (['sad', 'worried', 'crying', 'lonely', 'embarrassed'].includes(state)) {
        weight += (1 - this.mood) * 14;
      }
    }

    // Energy influences
    if (this.energy > 0.7) {
      if (['excited', 'celebrating', 'laughing', 'playful'].includes(state)) {
        weight += 12;
      }
    } else if (this.energy < 0.35) {
      if (['sleepy', 'sleeping', 'bored'].includes(state)) {
        weight += 18;
      }
    }

    // Attention influences
    if (this.attention > 0.7) {
      if (['curious', 'surprised', 'confused', 'thinking'].includes(state)) {
        weight += 12;
      }
    }

    // Penalty for recent states
    const recentIndex = this.recentStates.indexOf(state);
    if (recentIndex !== -1) {
      weight *= recentIndex === 0 ? 0.05 : recentIndex === 1 ? 0.2 : 0.5;
    }

    return Math.max(0.2, weight);
  }

  private shouldReturnToBaseline(): boolean {
    const strongStates: RobotExpression[] = [
      'surprised',
      'shocked',
      'scared',
      'angry',
      'crying',
      'celebrating',
      'laughing-tears',
      'excited'
    ];
    if (strongStates.includes(this.normalizedState)) {
      return Math.random() < 0.68;
    }
    return Math.random() < 0.32;
  }

  private naturalDuration(min: number, max: number): number {
    const r = (Math.random() + Math.random()) / 2;
    const jitter = (Math.random() - 0.5) * 180;
    return Math.max(400, min + (max - min) * r + jitter);
  }

  private startMicroBehaviorLoop() {
    const schedule = () => {
      const delay = this.naturalDuration(1200, 3600);
      this.microBehaviorId = setTimeout(() => {
        this.runRandomMicroBehavior();
        schedule();
      }, delay);
    };
    schedule();
  }

  private runRandomMicroBehavior() {
    // Only run micro-behaviors during compatible states
    const s = this.normalizedState;
    if (s === 'sleeping' || s === 'crying' || s === 'scared') return;

    const choices: { behavior: MicroBehavior; weight: number }[] = [
      { behavior: 'blink', weight: 26 },
      { behavior: 'double-blink', weight: 8 },
      { behavior: 'slow-blink', weight: 7 },
      { behavior: 'look-left', weight: 12 },
      { behavior: 'look-right', weight: 12 },
      { behavior: 'look-around', weight: 6 },
      { behavior: 'eye-pulse', weight: 8 },
      { behavior: 'settle', weight: 7 }
    ];

    const total = choices.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;

    for (const item of choices) {
      roll -= item.weight;
      if (roll <= 0) {
        this.setMicroBehavior(item.behavior);
        return;
      }
    }
  }

  private setMicroBehavior(behavior: MicroBehavior) {
    this.microBehavior = 'none';

    requestAnimationFrame(() => {
      this.microBehavior = behavior;
      const durations: Record<MicroBehavior, number> = {
        none: 0,
        blink: 200,
        'double-blink': 520,
        'slow-blink': 760,
        'look-left': 600,
        'look-right': 600,
        'look-around': 950,
        'tiny-smile': 650,
        'eye-pulse': 550,
        settle: 650
      };

      setTimeout(() => {
        if (this.microBehavior === behavior) {
          this.microBehavior = 'none';
        }
      }, durations[behavior] || 500);
    });
  }

  private clearMicroBehavior() {
    this.microBehavior = 'none';
  }

  private startMoodDrift() {
    const drift = () => {
      this.mood = Math.max(0.1, Math.min(0.95, this.mood + (Math.random() - 0.5) * 0.18));
      this.energy = Math.max(0.1, Math.min(0.95, this.energy + (Math.random() - 0.5) * 0.22));
      this.attention = Math.max(0.1, Math.min(0.95, this.attention + (Math.random() - 0.5) * 0.2));
      this.moodId = setTimeout(drift, this.naturalDuration(6000, 12000));
    };
    drift();
  }
}
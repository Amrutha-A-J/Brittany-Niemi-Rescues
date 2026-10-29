import { developerCredit } from '@/lib/developerCredit';

/** Reuses Ami's pen strokes while keeping the footer attribution readable and accessible. */
export function DeveloperCredit() {
  return (
    <a
      href={developerCredit.url}
      className="inline-grid grid-cols-[auto_auto] items-center justify-center gap-1 min-h-11 max-w-full whitespace-nowrap text-inherit no-underline focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-4"
      aria-label={`${developerCredit.lead} ${developerCredit.signature} ${developerCredit.connector} ${developerCredit.domain}`}
    >
      <span>{developerCredit.lead}</span>
      <svg
        viewBox="0 0 351 177"
        width="351"
        height="177"
        className="block w-12 h-auto fill-current"
        aria-hidden="true"
        focusable="false"
      >
        <g transform="translate(0.000000,177.000000) scale(0.100000,-0.100000)">
          <path d="M36 1757 c-15 -11 -18 -35 -21 -182 -18 -674 -16 -739 15 -777 l17 -21 32 22 c26 18 37 21 59 13 120 -42 352 109 352 228 0 104 -74 200 -153 200 -63 0 -142 -26 -198 -66 -26 -20 -53 -33 -59 -29 -12 8 -4 387 11 507 15 109 -3 143 -55 105z m354 -629 c43 -59 41 -97 -10 -152 -45 -49 -156 -109 -191 -104 -37 5 -36 43 1 94 17 24 32 56 33 71 2 25 -2 28 -27 28 -16 1 -31 5 -33 11 -6 19 65 77 104 84 79 16 91 13 123 -32z" />
          <path d="M1888 1733 c-9 -10 -24 -47 -34 -83 -9 -36 -20 -69 -24 -75 -4 -5 -13 -28 -20 -50 -7 -22 -31 -78 -52 -125 -40 -85 -118 -310 -118 -339 0 -9 -11 -35 -24 -58 -14 -23 -22 -51 -19 -61 2 -10 -3 -53 -11 -95 -21 -101 -21 -166 0 -174 26 -10 50 27 79 119 40 128 25 119 216 125 142 5 166 4 177 -10 18 -22 42 -113 42 -163 0 -54 30 -94 57 -78 20 13 21 53 2 162 -13 71 -5 89 39 94 41 5 43 38 2 38 -71 0 -63 -18 -150 360 -12 52 -26 103 -31 112 -5 10 -9 29 -9 42 0 14 -7 51 -15 83 -8 31 -15 71 -15 88 0 34 -43 105 -64 105 -7 0 -20 -8 -28 -17z m41 -265 c5 -13 16 -54 25 -93 25 -109 71 -279 78 -290 3 -6 9 -26 13 -46 11 -58 -6 -65 -128 -51 -56 7 -116 12 -133 12 -52 0 -57 17 -30 101 82 260 96 305 96 316 0 15 49 73 61 73 5 0 13 -10 18 -22z" />
          <path d="M3430 1420 c-15 -28 -7 -57 29 -100 40 -47 53 -33 49 51 -3 64 -3 64 -35 67 -24 2 -34 -2 -43 -18z" />
          <path d="M979 1258 c-43 -58 -78 -140 -86 -197 -3 -25 -14 -72 -24 -103 -11 -32 -19 -68 -19 -81 0 -14 -6 -30 -13 -36 -20 -16 -41 12 -57 74 -7 28 -19 60 -27 73 -7 12 -29 67 -47 123 -46 135 -91 183 -118 124 -13 -29 -10 -39 54 -195 59 -143 76 -176 127 -243 49 -64 46 -33 22 -277 -17 -172 -16 -489 2 -508 31 -30 47 -8 47 65 2 323 36 633 90 823 17 58 30 112 30 120 0 7 13 34 29 59 15 25 39 72 52 104 22 55 22 59 7 85 -24 39 -34 38 -69 -10z" />
          <path d="M2554 1191 c-23 -10 -54 -35 -69 -55 -35 -46 -49 -45 -65 4 -16 47 -31 63 -54 54 -28 -11 -34 -35 -41 -165 -13 -213 32 -226 153 -42 62 94 117 143 137 122 21 -22 55 -166 55 -236 0 -49 4 -65 16 -70 25 -9 63 14 70 44 36 166 103 270 167 261 35 -5 55 -96 56 -248 1 -150 -7 -190 -49 -242 -36 -44 -34 -68 6 -68 75 0 141 184 128 355 -14 185 -68 295 -143 295 -39 0 -122 -43 -160 -83 -40 -42 -43 -41 -76 23 -37 73 -62 82 -131 51z" />
          <path d="M3207 1133 c-4 -3 -7 -40 -7 -82 0 -42 -5 -172 -12 -289 -13 -226 -9 -257 29 -220 18 19 29 72 43 208 5 52 13 115 18 139 13 58 4 200 -14 229 -14 21 -43 29 -57 15z" />
        </g>
      </svg>
      <span className="col-span-full inline-flex justify-center gap-1 sm:justify-start">
        <span>{developerCredit.connector}</span>
        <span className="underline underline-offset-2">{developerCredit.domain}</span>
      </span>
    </a>
  );
}

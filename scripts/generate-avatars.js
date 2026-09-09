const fs = require('fs');
const path = require('path');

const avatars = [
  // 1. Street Cap Boy
  {
    file: 'boy-1.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-boy1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
    <linearGradient id="skin-boy1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-boy1)"/>
  <path d="M28 116 C30 92, 42 82, 60 82 C78 82, 90 92, 92 116 Z" fill="#0f172a"/>
  <path d="M48 94 C54 100, 66 100, 72 94 L68 116 L52 116 Z" fill="#38bdf8"/>
  <rect x="52" y="72" width="16" height="15" rx="4" fill="url(#skin-boy1)"/>
  <circle cx="40" cy="58" r="6" fill="#fed7aa"/>
  <circle cx="80" cy="58" r="6" fill="#fed7aa"/>
  <ellipse cx="60" cy="57" rx="20" ry="22" fill="url(#skin-boy1)"/>
  <circle cx="53" cy="56" r="3" fill="#0f172a"/>
  <circle cx="67" cy="56" r="3" fill="#0f172a"/>
  <circle cx="54" cy="55" r="1" fill="#ffffff"/>
  <circle cx="68" cy="55" r="1" fill="#ffffff"/>
  <path d="M49 50 Q54 48 57 51" stroke="#475569" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M71 50 Q66 48 63 51" stroke="#475569" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M60 59 L58 63 L62 63" stroke="#ea580c" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  <path d="M54 68 Q60 74 66 68" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M38 48 C38 31, 82 31, 82 48 C82 52, 78 54, 60 54 C42 54, 38 52, 38 48 Z" fill="#ef4444"/>
  <ellipse cx="60" cy="35" rx="16" ry="6" fill="#dc2626"/>
  <rect x="58" y="29" width="4" height="3" rx="1.5" fill="#fef08a"/>
</svg>`
  },

  // 2. Gamer Teen Boy
  {
    file: 'boy-2.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-boy2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#4c1d95"/>
    </linearGradient>
    <linearGradient id="skin-boy2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fcd34d"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-boy2)"/>
  <path d="M26 116 C28 92, 42 82, 60 82 C78 82, 92 92, 94 116 Z" fill="#18181b"/>
  <path d="M40 116 L60 86 L80 116 Z" fill="#06b6d4" opacity="0.8"/>
  <rect x="52" y="72" width="16" height="15" rx="4" fill="url(#skin-boy2)"/>
  <circle cx="40" cy="58" r="6" fill="#fcd34d"/>
  <circle cx="80" cy="58" r="6" fill="#fcd34d"/>
  <ellipse cx="60" cy="57" rx="20" ry="22" fill="url(#skin-boy2)"/>
  <path d="M38 52 C36 34, 48 30, 60 30 C74 30, 84 36, 82 52 C78 40, 72 40, 64 42 C56 44, 48 40, 38 52 Z" fill="#78350f"/>
  <path d="M34 56 C34 32, 86 32, 86 56" stroke="#06b6d4" stroke-width="4" fill="none" stroke-linecap="round"/>
  <rect x="32" y="48" width="8" height="18" rx="4" fill="#0e7490"/>
  <rect x="80" y="48" width="8" height="18" rx="4" fill="#0e7490"/>
  <path d="M36 62 Q38 74 48 76" stroke="#0e7490" stroke-width="2" fill="none"/>
  <circle cx="49" cy="76" r="2.5" fill="#22d3ee"/>
  <circle cx="53" cy="57" r="2.8" fill="#18181b"/>
  <circle cx="67" cy="57" r="2.8" fill="#18181b"/>
  <circle cx="54" cy="56" r="0.8" fill="#ffffff"/>
  <circle cx="68" cy="56" r="0.8" fill="#ffffff"/>
  <path d="M49 51 Q53 49 57 52" stroke="#78350f" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M71 51 Q67 49 63 52" stroke="#78350f" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M54 69 Q60 75 66 69" stroke="#18181b" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 3. Smart Scholar Boy
  {
    file: 'boy-3.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-boy3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="skin-boy3" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-boy3)"/>
  <path d="M26 116 C28 92, 42 82, 60 82 C78 82, 92 92, 94 116 Z" fill="#1e3a8a"/>
  <polygon points="50,82 60,94 56,82" fill="#ffffff"/>
  <polygon points="70,82 60,94 64,82" fill="#ffffff"/>
  <polygon points="58,92 62,92 64,110 60,116 56,110" fill="#dc2626"/>
  <rect x="52" y="70" width="16" height="15" rx="4" fill="url(#skin-boy3)"/>
  <circle cx="40" cy="56" r="6" fill="#ffedd5"/>
  <circle cx="80" cy="56" r="6" fill="#ffedd5"/>
  <ellipse cx="60" cy="55" rx="20" ry="22" fill="url(#skin-boy3)"/>
  <path d="M38 50 C38 32, 54 28, 64 30 C76 32, 82 40, 82 52 C78 44, 70 42, 60 42 C48 42, 42 46, 38 50 Z" fill="#451a03"/>
  <circle cx="51" cy="56" r="6.5" stroke="#0f172a" stroke-width="2" fill="rgba(255,255,255,0.4)"/>
  <circle cx="69" cy="56" r="6.5" stroke="#0f172a" stroke-width="2" fill="rgba(255,255,255,0.4)"/>
  <line x1="57.5" y1="56" x2="62.5" y2="56" stroke="#0f172a" stroke-width="2"/>
  <circle cx="51" cy="56" r="2.2" fill="#0f172a"/>
  <circle cx="69" cy="56" r="2.2" fill="#0f172a"/>
  <path d="M55 68 Q60 73 65 68" stroke="#0f172a" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 4. Cheerful Ponytail Girl
  {
    file: 'girl-1.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-girl1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#be185d"/>
    </linearGradient>
    <linearGradient id="skin-girl1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#fcd34d"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-girl1)"/>
  <path d="M72 36 C86 28, 96 42, 92 62 C88 74, 82 72, 80 64 Z" fill="#312e81"/>
  <ellipse cx="74" cy="38" rx="5" ry="4" fill="#f43f5e"/>
  <path d="M26 116 C28 92, 42 82, 60 82 C78 82, 92 92, 94 116 Z" fill="#0284c7"/>
  <path d="M48 94 C54 100, 66 100, 72 94 L68 116 L52 116 Z" fill="#fef08a"/>
  <rect x="52" y="70" width="16" height="15" rx="4" fill="url(#skin-girl1)"/>
  <circle cx="40" cy="57" r="5.5" fill="#fde68a"/>
  <circle cx="80" cy="57" r="5.5" fill="#fde68a"/>
  <ellipse cx="60" cy="56" rx="19" ry="21" fill="url(#skin-girl1)"/>
  <path d="M38 52 C38 32, 54 28, 64 30 C76 32, 82 40, 82 54 C76 44, 68 40, 60 40 C48 40, 42 46, 38 52 Z" fill="#312e81"/>
  <circle cx="52" cy="56" r="2.8" fill="#1e1b4b"/>
  <circle cx="68" cy="56" r="2.8" fill="#1e1b4b"/>
  <circle cx="53" cy="55" r="1" fill="#ffffff"/>
  <circle cx="69" cy="55" r="1" fill="#ffffff"/>
  <circle cx="47" cy="62" r="3.5" fill="#fb7185" opacity="0.6"/>
  <circle cx="73" cy="62" r="3.5" fill="#fb7185" opacity="0.6"/>
  <path d="M54 66 Q60 73 66 66" stroke="#1e1b4b" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 5. School Bobcut Girl
  {
    file: 'girl-2.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-girl2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="skin-girl2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-girl2)"/>
  <path d="M34 50 C32 72, 40 82, 60 82 C80 82, 88 72, 86 50 Z" fill="#1c1917"/>
  <path d="M26 116 C28 92, 42 82, 60 82 C78 82, 92 92, 94 116 Z" fill="#10b981"/>
  <rect x="52" y="70" width="16" height="15" rx="4" fill="url(#skin-girl2)"/>
  <circle cx="40" cy="57" r="5" fill="#ffedd5"/>
  <circle cx="80" cy="57" r="5" fill="#ffedd5"/>
  <ellipse cx="60" cy="56" rx="19" ry="21" fill="url(#skin-girl2)"/>
  <path d="M34 50 C34 32, 50 28, 60 28 C70 28, 86 32, 86 50 C84 64, 82 72, 80 74 C78 62, 78 44, 72 42 C64 40, 56 40, 48 42 C42 44, 42 62, 40 74 C38 72, 36 64, 34 50 Z" fill="#1c1917"/>
  <rect x="74" y="42" width="7" height="3" rx="1.5" fill="#f43f5e" transform="rotate(-20 74 42)"/>
  <circle cx="52" cy="56" r="2.8" fill="#1c1917"/>
  <circle cx="68" cy="56" r="2.8" fill="#1c1917"/>
  <circle cx="53" cy="55" r="1" fill="#ffffff"/>
  <circle cx="69" cy="55" r="1" fill="#ffffff"/>
  <circle cx="46" cy="62" r="3" fill="#f43f5e" opacity="0.5"/>
  <circle cx="74" cy="62" r="3" fill="#f43f5e" opacity="0.5"/>
  <path d="M54 66 Q60 72 66 66" stroke="#1c1917" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 6. Creative Beanie Girl
  {
    file: 'girl-3.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-girl3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
    <linearGradient id="skin-girl3" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-girl3)"/>
  <path d="M34 55 C32 80, 42 86, 60 86 C78 86, 88 80, 86 55 Z" fill="#451a03"/>
  <path d="M26 116 C28 92, 42 82, 60 82 C78 82, 92 92, 94 116 Z" fill="#e11d48"/>
  <ellipse cx="60" cy="85" rx="18" ry="8" fill="#be123c"/>
  <rect x="52" y="70" width="16" height="15" rx="4" fill="url(#skin-girl3)"/>
  <ellipse cx="60" cy="56" rx="19" ry="21" fill="url(#skin-girl3)"/>
  <path d="M36 54 C38 68, 42 74, 44 76" stroke="#451a03" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M84 54 C82 68, 78 74, 76 76" stroke="#451a03" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M36 46 C36 28, 84 28, 84 46 Z" fill="#eab308"/>
  <rect x="34" y="42" width="52" height="7" rx="3.5" fill="#ca8a04"/>
  <circle cx="51" cy="57" r="6" stroke="#eab308" stroke-width="1.8" fill="rgba(255,255,255,0.3)"/>
  <circle cx="69" cy="57" r="6" stroke="#eab308" stroke-width="1.8" fill="rgba(255,255,255,0.3)"/>
  <line x1="57" y1="57" x2="63" y2="57" stroke="#eab308" stroke-width="1.8"/>
  <circle cx="51" cy="57" r="2.2" fill="#1c1917"/>
  <circle cx="69" cy="57" r="2.2" fill="#1c1917"/>
  <path d="M55 68 Q60 73 65 68" stroke="#1c1917" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 7. Modern Tech Guy (Man 1)
  {
    file: 'man-1.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-man1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>
    <linearGradient id="skin-man1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-man1)"/>
  <path d="M26 116 C28 90, 42 80, 60 80 C78 80, 92 90, 94 116 Z" fill="#0f172a"/>
  <rect x="52" y="70" width="16" height="15" rx="4" fill="url(#skin-man1)"/>
  <circle cx="39" cy="56" r="6" fill="#ffedd5"/>
  <circle cx="81" cy="56" r="6" fill="#ffedd5"/>
  <ellipse cx="60" cy="55" rx="20" ry="23" fill="url(#skin-man1)"/>
  <path d="M40 56 C40 78, 48 83, 60 83 C72 83, 80 78, 80 56 C80 66, 74 76, 60 76 C46 76, 40 66, 40 56 Z" fill="#1e293b"/>
  <path d="M38 48 C36 30, 52 26, 64 26 C76 26, 84 32, 82 48 C78 38, 70 36, 60 36 C48 36, 42 42, 38 48 Z" fill="#0f172a"/>
  <circle cx="52" cy="54" r="2.8" fill="#0f172a"/>
  <circle cx="68" cy="54" r="2.8" fill="#0f172a"/>
  <circle cx="53" cy="53" r="0.8" fill="#ffffff"/>
  <circle cx="69" cy="53" r="0.8" fill="#ffffff"/>
  <path d="M48 48 Q53 45 57 48" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M72 48 Q67 45 63 48" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M54 66 Q60 72 66 66" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 8. Corporate Leader (Man 2)
  {
    file: 'man-2.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-man2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#134e4a"/>
    </linearGradient>
    <linearGradient id="skin-man2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fcd34d"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-man2)"/>
  <path d="M24 116 C26 90, 42 78, 60 78 C78 78, 94 90, 96 116 Z" fill="#1e293b"/>
  <polygon points="50,78 60,94 70,78 65,116 55,116" fill="#ffffff"/>
  <polygon points="58,90 62,90 64,116 56,116" fill="#0284c7"/>
  <rect x="52" y="68" width="16" height="15" rx="4" fill="url(#skin-man2)"/>
  <circle cx="39" cy="55" r="6" fill="#fcd34d"/>
  <circle cx="81" cy="55" r="6" fill="#fcd34d"/>
  <ellipse cx="60" cy="54" rx="20" ry="23" fill="url(#skin-man2)"/>
  <path d="M38 46 C38 28, 56 24, 70 26 C82 28, 84 38, 82 50 C76 38, 68 34, 58 34 C46 34, 40 40, 38 46 Z" fill="#292524"/>
  <circle cx="52" cy="54" r="2.8" fill="#1c1917"/>
  <circle cx="68" cy="54" r="2.8" fill="#1c1917"/>
  <path d="M48 48 Q53 46 57 49" stroke="#292524" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M72 48 Q67 46 63 49" stroke="#292524" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M54 66 Q60 72 66 66" stroke="#1c1917" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 9. Casual Wavy Guy (Man 3)
  {
    file: 'man-3.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-man3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#065f46"/>
    </linearGradient>
    <linearGradient id="skin-man3" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-man3)"/>
  <path d="M26 116 C28 90, 42 80, 60 80 C78 80, 92 90, 94 116 Z" fill="#d97706"/>
  <polygon points="56,80 60,90 64,80" fill="#b45309"/>
  <rect x="52" y="70" width="16" height="15" rx="4" fill="url(#skin-man3)"/>
  <circle cx="39" cy="56" r="6" fill="#fed7aa"/>
  <circle cx="81" cy="56" r="6" fill="#fed7aa"/>
  <ellipse cx="60" cy="55" rx="20" ry="23" fill="url(#skin-man3)"/>
  <path d="M36 48 C34 30, 48 24, 60 24 C74 24, 86 30, 84 48 C80 34, 70 32, 60 34 C48 32, 40 38, 36 48 Z" fill="#573a27"/>
  <circle cx="44" cy="36" r="6" fill="#573a27"/>
  <circle cx="58" cy="32" r="7" fill="#573a27"/>
  <circle cx="72" cy="35" r="6" fill="#573a27"/>
  <circle cx="52" cy="54" r="2.8" fill="#1c1917"/>
  <circle cx="68" cy="54" r="2.8" fill="#1c1917"/>
  <circle cx="53" cy="53" r="0.8" fill="#ffffff"/>
  <circle cx="69" cy="53" r="0.8" fill="#ffffff"/>
  <path d="M53 66 Q60 74 67 66" stroke="#1c1917" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 10. Sporty Athlete (Man 4)
  {
    file: 'man-4.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-man4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>
    <linearGradient id="skin-man4" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#a16207"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-man4)"/>
  <path d="M30 116 C32 90, 44 80, 60 80 C76 80, 88 90, 90 116 Z" fill="#18181b"/>
  <path d="M46 80 C50 94, 70 94, 74 80 Z" fill="url(#skin-man4)"/>
  <rect x="52" y="70" width="16" height="15" rx="4" fill="url(#skin-man4)"/>
  <circle cx="39" cy="56" r="6" fill="#a16207"/>
  <circle cx="81" cy="56" r="6" fill="#a16207"/>
  <ellipse cx="60" cy="55" rx="20" ry="23" fill="url(#skin-man4)"/>
  <path d="M38 46 C38 28, 82 28, 82 46 Z" fill="#09090b"/>
  <rect x="36" y="42" width="48" height="6" rx="3" fill="#ffffff"/>
  <circle cx="52" cy="55" r="2.8" fill="#09090b"/>
  <circle cx="68" cy="55" r="2.8" fill="#09090b"/>
  <circle cx="53" cy="54" r="0.8" fill="#ffffff"/>
  <circle cx="69" cy="54" r="0.8" fill="#ffffff"/>
  <path d="M54 68 Q60 74 66 68" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 11. Business Leader (Woman 1)
  {
    file: 'woman-1.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-woman1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="skin-woman1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-woman1)"/>
  <path d="M32 50 C30 80, 42 90, 60 90 C78 90, 90 80, 88 50 Z" fill="#18181b"/>
  <path d="M26 116 C28 92, 42 80, 60 80 C78 80, 92 92, 94 116 Z" fill="#065f46"/>
  <polygon points="50,80 60,98 70,80" fill="#ffffff"/>
  <line x1="56" y1="92" x2="64" y2="92" stroke="#eab308" stroke-width="2"/>
  <rect x="52" y="68" width="16" height="15" rx="4" fill="url(#skin-woman1)"/>
  <circle cx="39" cy="60" r="2.5" fill="#facc15"/>
  <circle cx="81" cy="60" r="2.5" fill="#facc15"/>
  <ellipse cx="60" cy="55" rx="19" ry="22" fill="url(#skin-woman1)"/>
  <path d="M36 50 C36 28, 52 24, 66 26 C82 28, 86 40, 86 54 C80 40, 72 36, 60 36 C48 36, 40 42, 36 50 Z" fill="#18181b"/>
  <circle cx="52" cy="54" r="2.8" fill="#18181b"/>
  <circle cx="68" cy="54" r="2.8" fill="#18181b"/>
  <circle cx="53" cy="53" r="0.8" fill="#ffffff"/>
  <circle cx="69" cy="53" r="0.8" fill="#ffffff"/>
  <path d="M48 48 Q53 45 57 48" stroke="#18181b" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M72 48 Q67 45 63 48" stroke="#18181b" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M54 66 Q60 72 66 66" stroke="#be123c" stroke-width="2.5" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 12. Tech Specialist (Woman 2)
  {
    file: 'woman-2.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-woman2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#5b21b6"/>
    </linearGradient>
    <linearGradient id="skin-woman2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-woman2)"/>
  <path d="M26 116 C28 92, 42 80, 60 80 C78 80, 92 92, 94 116 Z" fill="#2e1065"/>
  <path d="M48 80 C52 94, 68 94, 72 80 Z" fill="#c084fc"/>
  <rect x="52" y="68" width="16" height="15" rx="4" fill="url(#skin-woman2)"/>
  <circle cx="39" cy="56" r="6" fill="#fed7aa"/>
  <circle cx="81" cy="56" r="6" fill="#fed7aa"/>
  <ellipse cx="60" cy="55" rx="19" ry="22" fill="url(#skin-woman2)"/>
  <path d="M34 46 C34 28, 50 24, 60 24 C70 24, 86 28, 86 46 C86 64, 82 72, 80 74 C78 58, 76 40, 70 38 C60 36, 52 38, 44 42 C40 44, 40 64, 40 74 C38 72, 34 64, 34 46 Z" fill="#3b0764"/>
  <circle cx="51" cy="55" r="6.5" stroke="#a855f7" stroke-width="2" fill="rgba(255,255,255,0.3)"/>
  <circle cx="69" cy="55" r="6.5" stroke="#a855f7" stroke-width="2" fill="rgba(255,255,255,0.3)"/>
  <line x1="57.5" y1="55" x2="62.5" y2="55" stroke="#a855f7" stroke-width="2"/>
  <circle cx="51" cy="55" r="2.2" fill="#1e1b4b"/>
  <circle cx="69" cy="55" r="2.2" fill="#1e1b4b"/>
  <path d="M54 68 Q60 74 66 68" stroke="#1e1b4b" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 13. Creative Designer (Woman 3)
  {
    file: 'woman-3.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-woman3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>
    <linearGradient id="skin-woman3" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#a16207"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-woman3)"/>
  <circle cx="42" cy="46" r="15" fill="#18181b"/>
  <circle cx="78" cy="46" r="15" fill="#18181b"/>
  <circle cx="60" cy="35" r="18" fill="#18181b"/>
  <circle cx="36" cy="60" r="12" fill="#18181b"/>
  <circle cx="84" cy="60" r="12" fill="#18181b"/>
  <path d="M26 116 C28 92, 42 80, 60 80 C78 80, 92 92, 94 116 Z" fill="#fef08a"/>
  <rect x="52" y="68" width="16" height="15" rx="4" fill="url(#skin-woman3)"/>
  <circle cx="36" cy="60" r="5.5" stroke="#facc15" stroke-width="2" fill="none"/>
  <circle cx="84" cy="60" r="5.5" stroke="#facc15" stroke-width="2" fill="none"/>
  <ellipse cx="60" cy="56" rx="19" ry="21" fill="url(#skin-woman3)"/>
  <circle cx="52" cy="55" r="2.8" fill="#18181b"/>
  <circle cx="68" cy="55" r="2.8" fill="#18181b"/>
  <circle cx="53" cy="54" r="0.8" fill="#ffffff"/>
  <circle cx="69" cy="54" r="0.8" fill="#ffffff"/>
  <path d="M48 49 Q53 47 57 49" stroke="#18181b" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M72 49 Q67 47 63 49" stroke="#18181b" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M53 67 Q60 74 67 67" stroke="#dc2626" stroke-width="2.8" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 14. Casual Chic (Woman 4)
  {
    file: 'woman-4.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-woman4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="skin-woman4" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#fcd34d"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-woman4)"/>
  <path d="M30 48 C28 85, 38 95, 60 95 C82 95, 92 85, 90 48 Z" fill="#92400e"/>
  <path d="M26 116 C28 92, 42 80, 60 80 C78 80, 92 92, 94 116 Z" fill="#fbbf24"/>
  <rect x="52" y="68" width="16" height="15" rx="4" fill="url(#skin-woman4)"/>
  <circle cx="39" cy="56" r="6" fill="#fde68a"/>
  <circle cx="81" cy="56" r="6" fill="#fde68a"/>
  <ellipse cx="60" cy="55" rx="19" ry="22" fill="url(#skin-woman4)"/>
  <path d="M34 46 C34 26, 52 22, 64 24 C80 26, 86 38, 86 52 C80 38, 72 34, 60 34 C48 34, 40 40, 36 46 Z" fill="#92400e"/>
  <path d="M34 50 C36 68, 40 76, 44 80" stroke="#92400e" stroke-width="4.5" stroke-linecap="round" fill="none"/>
  <path d="M86 50 C84 68, 80 76, 76 80" stroke="#92400e" stroke-width="4.5" stroke-linecap="round" fill="none"/>
  <circle cx="52" cy="54" r="2.8" fill="#1c1917"/>
  <circle cx="68" cy="54" r="2.8" fill="#1c1917"/>
  <circle cx="53" cy="53" r="0.8" fill="#ffffff"/>
  <circle cx="69" cy="53" r="0.8" fill="#ffffff"/>
  <path d="M53 66 Q60 73 67 66" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 15. Silver Scholar (Senior Man 1)
  {
    file: 'senior-man-1.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-sm1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="skin-sm1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-sm1)"/>
  <path d="M24 116 C26 90, 42 78, 60 78 C78 78, 94 90, 96 116 Z" fill="#334155"/>
  <polygon points="50,78 60,94 70,78 64,116 56,116" fill="#f1f5f9"/>
  <rect x="52" y="68" width="16" height="15" rx="4" fill="url(#skin-sm1)"/>
  <circle cx="39" cy="55" r="6" fill="#ffedd5"/>
  <circle cx="81" cy="55" r="6" fill="#ffedd5"/>
  <ellipse cx="60" cy="54" rx="20" ry="23" fill="url(#skin-sm1)"/>
  <path d="M40 56 C40 80, 48 85, 60 85 C72 85, 80 80, 80 56 C80 68, 74 76, 60 76 C46 76, 40 68, 40 56 Z" fill="#cbd5e1"/>
  <path d="M38 46 C38 28, 56 24, 70 26 C82 28, 84 38, 82 50 C76 38, 68 34, 58 34 C46 34, 40 40, 38 46 Z" fill="#cbd5e1"/>
  <circle cx="51" cy="53" r="6" stroke="#94a3b8" stroke-width="1.8" fill="rgba(255,255,255,0.3)"/>
  <circle cx="69" cy="53" r="6" stroke="#94a3b8" stroke-width="1.8" fill="rgba(255,255,255,0.3)"/>
  <line x1="57" y1="53" x2="63" y2="53" stroke="#94a3b8" stroke-width="1.8"/>
  <circle cx="51" cy="53" r="2" fill="#0f172a"/>
  <circle cx="69" cy="53" r="2" fill="#0f172a"/>
  <path d="M54 67 Q60 72 66 67" stroke="#475569" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 16. Warm Smiling Grandfather (Senior Man 2)
  {
    file: 'senior-man-2.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-sm2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
    <linearGradient id="skin-sm2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-sm2)"/>
  <path d="M26 116 C28 90, 42 78, 60 78 C78 78, 92 90, 94 116 Z" fill="#991b1b"/>
  <ellipse cx="60" cy="80" rx="16" ry="6" fill="#7f1d1d"/>
  <rect x="52" y="68" width="16" height="15" rx="4" fill="url(#skin-sm2)"/>
  <circle cx="39" cy="56" r="6" fill="#fed7aa"/>
  <circle cx="81" cy="56" r="6" fill="#fed7aa"/>
  <ellipse cx="60" cy="54" rx="20" ry="23" fill="url(#skin-sm2)"/>
  <path d="M37 46 C37 56, 39 62, 41 64 C39 56, 39 48, 41 46 Z" fill="#e2e8f0"/>
  <path d="M83 46 C83 56, 81 62, 79 64 C81 56, 81 48, 79 46 Z" fill="#e2e8f0"/>
  <path d="M47 46 Q52 42 57 46" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M73 46 Q68 42 63 46" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M49 54 Q53 51 57 54" stroke="#1c1917" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M63 54 Q67 51 71 54" stroke="#1c1917" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M52 66 Q60 76 68 66" stroke="#1c1917" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <circle cx="46" cy="62" r="3.5" fill="#f87171" opacity="0.5"/>
  <circle cx="74" cy="62" r="3.5" fill="#f87171" opacity="0.5"/>
</svg>`
  },

  // 17. Elegant Matriarch (Senior Woman 1)
  {
    file: 'senior-woman-1.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-sw1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#115e59"/>
    </linearGradient>
    <linearGradient id="skin-sw1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-sw1)"/>
  <circle cx="44" cy="44" r="14" fill="#e2e8f0"/>
  <circle cx="76" cy="44" r="14" fill="#e2e8f0"/>
  <circle cx="60" cy="34" r="16" fill="#e2e8f0"/>
  <path d="M26 116 C28 92, 42 80, 60 80 C78 80, 92 92, 94 116 Z" fill="#0f766e"/>
  <circle cx="60" cy="88" r="3" fill="#ffffff"/>
  <circle cx="54" cy="86" r="2.5" fill="#ffffff"/>
  <circle cx="66" cy="86" r="2.5" fill="#ffffff"/>
  <rect x="52" y="68" width="16" height="15" rx="4" fill="url(#skin-sw1)"/>
  <circle cx="38" cy="58" r="3" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.5"/>
  <circle cx="82" cy="58" r="3" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.5"/>
  <ellipse cx="60" cy="55" rx="19" ry="22" fill="url(#skin-sw1)"/>
  <path d="M38 46 C42 34, 54 32, 60 36 C66 32, 78 34, 82 46 C76 40, 66 38, 60 42 C54 38, 44 40, 38 46 Z" fill="#e2e8f0"/>
  <circle cx="52" cy="54" r="2.5" fill="#1c1917"/>
  <circle cx="68" cy="54" r="2.5" fill="#1c1917"/>
  <path d="M48 48 Q53 46 57 49" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M72 48 Q67 46 63 49" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M54 66 Q60 72 66 66" stroke="#be123c" stroke-width="2.5" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 18. Kind Grandmother (Senior Woman 2)
  {
    file: 'senior-woman-2.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-sw2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9333ea"/>
      <stop offset="100%" stop-color="#6b21a8"/>
    </linearGradient>
    <linearGradient id="skin-sw2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#fcd34d"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-sw2)"/>
  <circle cx="60" cy="28" r="10" fill="#cbd5e1"/>
  <path d="M26 116 C28 92, 42 80, 60 80 C78 80, 92 92, 94 116 Z" fill="#581c87"/>
  <ellipse cx="60" cy="82" rx="16" ry="6" fill="#fbcfe8"/>
  <rect x="52" y="68" width="16" height="15" rx="4" fill="url(#skin-sw2)"/>
  <ellipse cx="60" cy="55" rx="19" ry="22" fill="url(#skin-sw2)"/>
  <path d="M38 48 C38 34, 52 32, 60 36 C68 32, 82 34, 82 48 C76 42, 68 40, 60 44 C52 40, 44 42, 38 48 Z" fill="#cbd5e1"/>
  <path d="M44 52 L56 50 L56 58 L46 58 Z" stroke="#ec4899" stroke-width="1.8" fill="rgba(255,255,255,0.4)" rx="2"/>
  <path d="M64 50 L76 52 L74 58 L64 58 Z" stroke="#ec4899" stroke-width="1.8" fill="rgba(255,255,255,0.4)" rx="2"/>
  <line x1="56" y1="54" x2="64" y2="54" stroke="#ec4899" stroke-width="1.8"/>
  <circle cx="50" cy="55" r="2.2" fill="#1c1917"/>
  <circle cx="70" cy="55" r="2.2" fill="#1c1917"/>
  <circle cx="46" cy="63" r="3.5" fill="#f472b6" opacity="0.6"/>
  <circle cx="74" cy="63" r="3.5" fill="#f472b6" opacity="0.6"/>
  <path d="M54 67 Q60 74 66 67" stroke="#1c1917" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 19. Mint Champion (Special 1)
  {
    file: 'champion-1.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-champ1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="50%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="skin-champ1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-champ1)"/>
  <circle cx="60" cy="60" r="52" stroke="url(#gold-grad)" stroke-width="2" fill="none" opacity="0.5" stroke-dasharray="6,4"/>
  <path d="M26 116 C28 90, 42 80, 60 80 C78 80, 92 90, 94 116 Z" fill="#064e3b"/>
  <polygon points="50,80 60,96 70,80 65,116 55,116" fill="url(#gold-grad)"/>
  <rect x="52" y="68" width="16" height="15" rx="4" fill="url(#skin-champ1)"/>
  <ellipse cx="60" cy="55" rx="19" ry="22" fill="url(#skin-champ1)"/>
  <path d="M38 48 C36 30, 52 26, 64 26 C76 26, 84 32, 82 48 C78 38, 70 36, 60 36 C48 36, 42 42, 38 48 Z" fill="#0f172a"/>
  <polygon points="46,30 52,38 60,26 68,38 74,30 72,42 48,42" fill="url(#gold-grad)"/>
  <circle cx="52" cy="54" r="2.8" fill="#064e3b"/>
  <circle cx="68" cy="54" r="2.8" fill="#064e3b"/>
  <circle cx="53" cy="53" r="0.8" fill="#ffffff"/>
  <circle cx="69" cy="53" r="0.8" fill="#ffffff"/>
  <path d="M48 48 Q53 45 57 48" stroke="#064e3b" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M72 48 Q67 45 63 48" stroke="#064e3b" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M53 66 Q60 73 67 66" stroke="#064e3b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
</svg>`
  },

  // 20. Gold Master (Special 2)
  {
    file: 'champion-2.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-champ2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="50%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
    <linearGradient id="gold-bright" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#facc15"/>
    </linearGradient>
    <linearGradient id="skin-champ2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#fcd34d"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="58" fill="url(#bg-champ2)"/>
  <path d="M26 116 C28 90, 42 78, 60 78 C78 78, 92 90, 94 116 Z" fill="#451a03"/>
  <path d="M46 78 C52 96, 68 96, 74 78 Z" fill="url(#gold-bright)"/>
  <rect x="52" y="68" width="16" height="15" rx="4" fill="url(#skin-champ2)"/>
  <ellipse cx="60" cy="55" rx="19" ry="22" fill="url(#skin-champ2)"/>
  <path d="M36 48 C36 28, 52 22, 64 24 C80 26, 86 38, 86 52 C80 38, 72 34, 60 34 C48 34, 40 40, 36 48 Z" fill="#292524"/>
  <polygon points="36,60 38,58 40,60 38,62" fill="url(#gold-bright)"/>
  <polygon points="84,60 82,58 80,60 82,62" fill="url(#gold-bright)"/>
  <circle cx="52" cy="54" r="2.8" fill="#292524"/>
  <circle cx="68" cy="54" r="2.8" fill="#292524"/>
  <circle cx="53" cy="53" r="0.8" fill="#ffffff"/>
  <circle cx="69" cy="53" r="0.8" fill="#ffffff"/>
  <path d="M53 66 Q60 74 67 66" stroke="#991b1b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
</svg>`
  }
];

const targetDir = path.join(process.cwd(), 'public', 'avatars');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

avatars.forEach(item => {
  const filePath = path.join(targetDir, item.file);
  fs.writeFileSync(filePath, item.svg.trim(), 'utf8');
});

console.log(`Successfully generated ${avatars.length} avatars in public/avatars!`);

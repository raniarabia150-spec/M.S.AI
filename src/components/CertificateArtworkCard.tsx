import { useState, type MouseEvent } from 'react';
import { Award, ShieldCheck } from 'lucide-react';
import type { CertificateEdition, SavedCertificate } from '../utils/certificateEngine';

interface CertificateArtworkCardProps {
  certificate: SavedCertificate;
}

const EDITION_STYLES: Record<
  CertificateEdition,
  {
    wrapper: string;
    outerBorder: string;
    innerBorder: string;
    accentText: string;
    titleText: string;
    bodyText: string;
    mutedText: string;
    badgeBg: string;
    sealBg: string;
    patternStroke: string;
  }
> = {
  'royal-gold': {
    wrapper: 'bg-gradient-to-br from-[#060c1f] via-[#0c1633] to-[#090f24]',
    outerBorder: 'border-amber-400/80',
    innerBorder: 'border-amber-300/35',
    accentText: 'text-amber-300',
    titleText: 'text-amber-100',
    bodyText: 'text-slate-100',
    mutedText: 'text-slate-400',
    badgeBg: 'bg-amber-500/15 border-amber-400/45 text-amber-200',
    sealBg: 'from-amber-600 via-yellow-500 to-amber-700 text-slate-950 border-amber-200',
    patternStroke: '#fbbf24',
  },
  'emerald-molecular': {
    wrapper: 'bg-gradient-to-br from-[#021716] via-[#05292b] to-[#03131c]',
    outerBorder: 'border-emerald-400/80',
    innerBorder: 'border-cyan-300/35',
    accentText: 'text-emerald-300',
    titleText: 'text-emerald-50',
    bodyText: 'text-slate-100',
    mutedText: 'text-slate-400',
    badgeBg: 'bg-emerald-500/15 border-emerald-400/45 text-emerald-200',
    sealBg: 'from-emerald-500 via-teal-400 to-cyan-600 text-slate-950 border-emerald-100',
    patternStroke: '#2dd4bf',
  },
  'platinum-parchment': {
    wrapper: 'bg-gradient-to-br from-[#fcfbf7] via-[#f7f2e7] to-[#efe7d6]',
    outerBorder: 'border-[#1e3a5f]',
    innerBorder: 'border-amber-700/50',
    accentText: 'text-amber-800',
    titleText: 'text-slate-900',
    bodyText: 'text-slate-800',
    mutedText: 'text-slate-600',
    badgeBg: 'bg-amber-700/10 border-amber-700/35 text-amber-900',
    sealBg: 'from-[#1e3a5f] via-[#274c77] to-[#13294b] text-amber-200 border-amber-500',
    patternStroke: '#b45309',
  },
};

export function CertificateArtworkCard({ certificate }: CertificateArtworkCardProps) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const style = EDITION_STYLES[certificate.edition] ?? EDITION_STYLES['royal-gold'];

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 7,
      ry: (px - 0.5) * 7,
      gx: px * 100,
      gy: py * 100,
    });
  };

  const resetTilt = () => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });

  return (
    <div
      className="perspective-[1400px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
    >
      <div
        id="printableCertificateFrame"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative overflow-hidden rounded-3xl p-4 sm:p-6 shadow-2xl border-2 ${style.wrapper} ${style.outerBorder}`}
      >
        {/* Interactive Holographic Foil Glare */}
        <div
          aria-hidden="true"
          className="no-print pointer-events-none absolute inset-0 opacity-35 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.22), transparent 52%)`,
          }}
        />

        {/* Molecular Hexagonal Guilloché Watermark SVG */}
        <svg
          aria-hidden="true"
          viewBox="0 0 900 620"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.09]"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="chemHexGrid" width="60" height="52" patternUnits="userSpaceOnUse">
              <polygon
                points="30,2 56,16 56,42 30,50 4,42 4,16"
                fill="none"
                stroke={style.patternStroke}
                strokeWidth="1.2"
              />
            </pattern>
          </defs>
          <rect width="900" height="620" fill="url(#chemHexGrid)" />
          {/* Large Orbital Crest Watermark */}
          <g transform="translate(450 285)" opacity="0.65">
            <ellipse rx="230" ry="78" fill="none" stroke={style.patternStroke} strokeWidth="1.6" />
            <ellipse
              rx="230"
              ry="78"
              fill="none"
              stroke={style.patternStroke}
              strokeWidth="1.6"
              transform="rotate(60)"
            />
            <ellipse
              rx="230"
              ry="78"
              fill="none"
              stroke={style.patternStroke}
              strokeWidth="1.6"
              transform="rotate(120)"
            />
          </g>
        </svg>

        {/* Inner Ornamental Frame */}
        <div
          className={`relative z-10 rounded-2xl border ${style.innerBorder} px-6 py-8 sm:px-12 sm:py-10 text-center space-y-6`}
        >
          {/* Corner Filigree Medallions */}
          <span
            aria-hidden="true"
            className={`absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 rounded-tr-md ${style.outerBorder}`}
          />
          <span
            aria-hidden="true"
            className={`absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 rounded-tl-md ${style.outerBorder}`}
          />
          <span
            aria-hidden="true"
            className={`absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 rounded-br-md ${style.outerBorder}`}
          />
          <span
            aria-hidden="true"
            className={`absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 rounded-bl-md ${style.outerBorder}`}
          />

          {/* Top Atomic Crest */}
          <div className="flex flex-col items-center gap-2">
            <svg viewBox="0 0 120 64" className="w-20 h-11 overflow-visible" aria-hidden="true">
              <g transform="translate(60 32)" stroke={style.patternStroke} fill="none" strokeWidth="2">
                <ellipse rx="36" ry="13" />
                <ellipse rx="36" ry="13" transform="rotate(60)" />
                <ellipse rx="36" ry="13" transform="rotate(120)" />
                <circle r="5.5" fill={style.patternStroke} />
              </g>
            </svg>
            <div className={`text-xs sm:text-sm font-extrabold tracking-wide ${style.accentText}`}>
              أكاديمية الكيمياء التفاعلية
            </div>
            <h3 className={`text-2xl sm:text-4xl font-black leading-tight ${style.titleText}`}>
              شهادة تقدير وتفوّق علمي
            </h3>
            <div className="w-40 h-0.5 mx-auto rounded-full bg-current opacity-25" />
          </div>

          {/* Recipient Block */}
          <div className="space-y-2 py-2">
            <p className={`text-xs sm:text-sm font-bold ${style.mutedText}`}>
              تشهد إدارة أكاديمية الكيمياء بأن الطالب / الطالبة
            </p>
            <div className={`text-3xl sm:text-5xl font-black tracking-tight ${style.bodyText}`}>
              {certificate.studentName}
            </div>
            {certificate.studentGrade.trim() && (
              <div className={`text-xs sm:text-sm font-bold ${style.accentText}`}>
                {certificate.studentGrade}
              </div>
            )}
            <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed pt-2 ${style.bodyText}`}>
              قد اجتاز بنجاح فائق{' '}
              <strong className={style.accentText}>تحدي الكيمياء المتقدم (المستوى الصعب)</strong>{' '}
              محققاً كفاءة علمية متميزة في التحليل الكيميائي والاتزان والكهربية والعضوية.
            </p>
          </div>

          {/* Achievement Banner */}
          <div
            className={`inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-6 py-3 rounded-2xl border text-xs sm:text-sm font-extrabold ${style.badgeBg}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              {certificate.tierTitle}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              التقدير: {certificate.percentage}% ({certificate.scoreCorrect}/{certificate.scoreTotal})
            </span>
          </div>

          {/* Signatures & Embossed Official Seal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center pt-5 border-t border-current/10">
            <div className="space-y-1">
              <div className={`text-xs font-bold ${style.mutedText}`}>إعداد وإشراف علمي</div>
              <div className={`text-lg font-black ${style.accentText}`}>مستر صلاح عيد</div>
              <div className="w-32 h-px mx-auto bg-current opacity-25" />
            </div>

            <div className="flex justify-center">
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-br border-2 shadow-xl flex flex-col items-center justify-center p-2 ${style.sealBg}`}
              >
                <ShieldCheck className="w-5 h-5 mb-0.5" />
                <span className="text-[11px] font-black leading-tight">
                  {certificate.tierRank === 'diamond' ? 'تميّز ماسي' : 'تفوّق ذهبي'}
                </span>
                <span className="formula-ltr text-xs font-extrabold tabular-nums">
                  {certificate.percentage}%
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className={`text-xs font-bold ${style.mutedText}`}>تصميم وتطوير المنصة</div>
              <div className={`text-lg font-black ${style.accentText}`}>محمد صلاح</div>
              <div className="w-32 h-px mx-auto bg-current opacity-25" />
            </div>
          </div>

          {/* Verification Footer */}
          <div
            className={`pt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-bold ${style.mutedText}`}
          >
            <span>تاريخ الإصدار: {certificate.issuedDateAr}</span>
            <span aria-hidden="true">·</span>
            <span>
              الرمز التحققي: <code className="formula-ltr">{certificate.serial}</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

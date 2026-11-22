import type { CertificateEdition, SavedCertificate } from './certificateEngine';

interface EditionPalette {
  bgStart: string;
  bgEnd: string;
  frameOuter: string;
  frameInner: string;
  accent: string;
  accentSoft: string;
  titleColor: string;
  bodyColor: string;
  mutedColor: string;
  sealBg: string;
  sealRing: string;
}

const EDITIONS: Record<CertificateEdition, EditionPalette> = {
  'royal-gold': {
    bgStart: '#060c1f',
    bgEnd: '#0f172a',
    frameOuter: '#f59e0b',
    frameInner: '#fbbf24',
    accent: '#fbbf24',
    accentSoft: 'rgba(245, 158, 11, 0.16)',
    titleColor: '#fef3c7',
    bodyColor: '#f8fafc',
    mutedColor: '#94a3b8',
    sealBg: '#b45309',
    sealRing: '#fde68a',
  },
  'emerald-molecular': {
    bgStart: '#021716',
    bgEnd: '#06262a',
    frameOuter: '#10b981',
    frameInner: '#06b6d4',
    accent: '#2dd4bf',
    accentSoft: 'rgba(16, 185, 129, 0.16)',
    titleColor: '#d1fae5',
    bodyColor: '#f8fafc',
    mutedColor: '#94a3b8',
    sealBg: '#047857',
    sealRing: '#6ee7b7',
  },
  'platinum-parchment': {
    bgStart: '#fcfbf7',
    bgEnd: '#f1ece1',
    frameOuter: '#1e3a5f',
    frameInner: '#b45309',
    accent: '#b45309',
    accentSoft: 'rgba(180, 83, 9, 0.10)',
    titleColor: '#0f172a',
    bodyColor: '#1e293b',
    mutedColor: '#475569',
    sealBg: '#1e3a5f',
    sealRing: '#d97706',
  },
};

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

export async function downloadCertificatePng(cert: SavedCertificate): Promise<boolean> {
  if (typeof document === 'undefined') return false;

  // Wait briefly for web fonts if supported
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // continue with available fonts
    }
  }

  const width = 2000;
  const height = 1400;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const p = EDITIONS[cert.edition] ?? EDITIONS['royal-gold'];

  // Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, p.bgStart);
  bgGrad.addColorStop(1, p.bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle Radial Spotlight Behind Center
  const radial = ctx.createRadialGradient(width / 2, height * 0.42, 40, width / 2, height * 0.42, 760);
  radial.addColorStop(0, p.accentSoft);
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // Subtle Molecular Hexagonal Lattice Pattern in Corners
  ctx.save();
  ctx.strokeStyle = p.accent;
  ctx.globalAlpha = 0.08;
  ctx.lineWidth = 2;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      drawHexagon(ctx, 170 + col * 72, 180 + row * 64, 34);
      drawHexagon(ctx, width - 170 - col * 72, height - 180 - row * 64, 34);
    }
  }
  ctx.restore();

  // Outer Double Ornamental Frame
  ctx.strokeStyle = p.frameOuter;
  ctx.lineWidth = 10;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.strokeStyle = p.frameInner;
  ctx.lineWidth = 3;
  ctx.strokeRect(72, 72, width - 144, height - 144);

  // Corner Geometric Rosettes
  const corners = [
    [94, 94],
    [width - 94, 94],
    [94, height - 94],
    [width - 94, height - 94],
  ];
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2.5;
  corners.forEach(([cx, cy]) => {
    drawHexagon(ctx, cx, cy, 24);
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Top Atomic Emblem Crest
  ctx.save();
  const emblemX = width / 2;
  const emblemY = 195;
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i += 1) {
    ctx.save();
    ctx.translate(emblemX, emblemY);
    ctx.rotate((Math.PI / 3) * i);
    ctx.beginPath();
    ctx.ellipse(0, 0, 62, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.arc(emblemX, emblemY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  // Academy Header
  ctx.fillStyle = p.accent;
  ctx.font = '700 32px Cairo, sans-serif';
  ctx.fillText('أكاديمية الكيمياء التفاعلية', width / 2, 295);

  // Main Certificate Heading
  ctx.fillStyle = p.titleColor;
  ctx.font = '900 76px Cairo, sans-serif';
  ctx.fillText('شهادة تقدير وتفوّق علمي', width / 2, 390);

  // Decorative Divider
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 280, 430);
  ctx.lineTo(width / 2 + 280, 430);
  ctx.stroke();

  // Grant Statement
  ctx.fillStyle = p.mutedColor;
  ctx.font = '600 32px Cairo, sans-serif';
  ctx.fillText('تشهد إدارة أكاديمية الكيمياء بأن الطالب / الطالبة', width / 2, 505);

  // Student Full Name
  ctx.fillStyle = p.bodyColor;
  ctx.font = '900 84px Cairo, sans-serif';
  ctx.fillText(cert.studentName, width / 2, 625);

  if (cert.studentGrade.trim()) {
    ctx.fillStyle = p.accent;
    ctx.font = '700 30px Cairo, sans-serif';
    ctx.fillText(cert.studentGrade.trim(), width / 2, 682);
  }

  // Achievement Body Copy
  ctx.fillStyle = p.bodyColor;
  ctx.font = '600 32px Cairo, sans-serif';
  ctx.fillText(
    'قد اجتاز بنجاح فائق تحدي الكيمياء المتقدم (المستوى الصعب) محققاً جدارة علمية متميزة',
    width / 2,
    768
  );

  // Honor Tier & Score Banner
  ctx.fillStyle = p.accentSoft;
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2.5;
  const pillW = 1040;
  const pillH = 92;
  const pillX = (width - pillW) / 2;
  const pillY = 825;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = p.accent;
  ctx.font = '800 34px Cairo, sans-serif';
  ctx.fillText(
    `${cert.tierTitle}   •   التقدير: ${cert.percentage}% (${cert.scoreCorrect}/${cert.scoreTotal})`,
    width / 2,
    883
  );

  // Official Embossed Seal (Center Bottom)
  const sealX = width / 2;
  const sealY = 1125;
  ctx.save();
  ctx.fillStyle = p.sealBg;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 88, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = p.sealRing;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 76, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px Cairo, sans-serif';
  ctx.fillText(cert.tierRank === 'diamond' ? 'تميّز ماسي' : 'تفوّق ذهبي', sealX, sealY - 6);
  ctx.font = '700 22px JetBrains Mono, monospace';
  ctx.fillText(`${cert.percentage}%`, sealX, sealY + 34);
  ctx.restore();

  // Signatures Left & Right
  ctx.fillStyle = p.bodyColor;
  ctx.font = '800 30px Cairo, sans-serif';
  ctx.fillText('إعداد وإشراف علمي', width - 410, 1085);
  ctx.fillStyle = p.accent;
  ctx.font = '900 36px Cairo, sans-serif';
  ctx.fillText('مستر صلاح عيد', width - 410, 1142);
  ctx.strokeStyle = p.mutedColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width - 560, 1170);
  ctx.lineTo(width - 260, 1170);
  ctx.stroke();

  ctx.fillStyle = p.bodyColor;
  ctx.font = '800 30px Cairo, sans-serif';
  ctx.fillText('تصميم وتطوير المنصة', 410, 1085);
  ctx.fillStyle = p.accent;
  ctx.font = '900 36px Cairo, sans-serif';
  ctx.fillText('محمد صلاح', 410, 1142);
  ctx.beginPath();
  ctx.moveTo(260, 1170);
  ctx.lineTo(560, 1170);
  ctx.stroke();

  // Footer Verification Metadata
  ctx.fillStyle = p.mutedColor;
  ctx.font = '600 24px Cairo, sans-serif';
  ctx.fillText(
    `تاريخ الإصدار: ${cert.issuedDateAr}   |   الرمز التحققي للشهادة: ${cert.serial}`,
    width / 2,
    1288
  );

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `chemistry-certificate-${cert.serial}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

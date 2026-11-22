export type ElementCategory =
  | 'alkali'
  | 'alkaline'
  | 'transition'
  | 'nonmetal'
  | 'halogen'
  | 'noble'
  | 'metalloid'
  | 'post-transition';

export interface PeriodicElement {
  number: number;
  symbol: string;
  nameAr: string;
  nameEn: string;
  mass: number;
  group: number;
  period: number;
  category: ElementCategory;
  shells: number[];
  config: string;
  electronegativity: number | null;
  stateAr: string;
  highlightAr: string;
}

export const ELEMENT_CATEGORY_META: Record<
  ElementCategory,
  { labelAr: string; colorClass: string; swatch: string }
> = {
  alkali: {
    labelAr: 'فلزات قلوية',
    colorClass: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    swatch: '#f43f5e',
  },
  alkaline: {
    labelAr: 'قلوية أرضية',
    colorClass: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    swatch: '#f59e0b',
  },
  transition: {
    labelAr: 'عناصر انتقالية',
    colorClass: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    swatch: '#06b6d4',
  },
  'post-transition': {
    labelAr: 'فلزات ضعيفة',
    colorClass: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    swatch: '#3b82f6',
  },
  metalloid: {
    labelAr: 'أشباه فلزات',
    colorClass: 'border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300',
    swatch: '#14b8a6',
  },
  nonmetal: {
    labelAr: 'لافلزات',
    colorClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    swatch: '#10b981',
  },
  halogen: {
    labelAr: 'هالوجينات',
    colorClass: 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    swatch: '#8b5cf6',
  },
  noble: {
    labelAr: 'غازات نبيلة',
    colorClass: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
    swatch: '#6366f1',
  },
};

export const PERIODIC_ELEMENTS: PeriodicElement[] = [
  { number: 1, symbol: 'H', nameAr: 'هيدروجين', nameEn: 'Hydrogen', mass: 1.008, group: 1, period: 1, category: 'nonmetal', shells: [1], config: '1s¹', electronegativity: 2.2, stateAr: 'غاز', highlightAr: 'أخف عنصر في الكون ويدخل في تركيب الماء والأحماض والمركبات العضوية.' },
  { number: 2, symbol: 'He', nameAr: 'هيليوم', nameEn: 'Helium', mass: 4.003, group: 18, period: 1, category: 'noble', shells: [2], config: '1s²', electronegativity: null, stateAr: 'غاز', highlightAr: 'غاز نبيل خامل كيميائياً يمتلئ مستوى طاقته الأول بإلكترونين.' },
  { number: 3, symbol: 'Li', nameAr: 'ليثيوم', nameEn: 'Lithium', mass: 6.94, group: 1, period: 2, category: 'alkali', shells: [2, 1], config: '[He] 2s¹', electronegativity: 0.98, stateAr: 'صلب', highlightAr: 'أخف فلز وأعلى جهد أكسدة في السلسلة الكهروكيميائية، يُستخدم في بطاريات أيون الليثيوم.' },
  { number: 4, symbol: 'Be', nameAr: 'بيريليوم', nameEn: 'Beryllium', mass: 9.012, group: 2, period: 2, category: 'alkaline', shells: [2, 2], config: '[He] 2s²', electronegativity: 1.57, stateAr: 'صلب', highlightAr: 'فلز خفيف شديد الصلابة يُستخدم في السبائك الفضائية ونوافذ الأشعة السينية.' },
  { number: 5, symbol: 'B', nameAr: 'بورون', nameEn: 'Boron', mass: 10.81, group: 13, period: 2, category: 'metalloid', shells: [2, 3], config: '[He] 2s² 2p¹', electronegativity: 2.04, stateAr: 'صلب', highlightAr: 'شبه فلز أساسي في صناعة زجاج البوروسيليكات المقاوم للحرارة بالمختبرات.' },
  { number: 6, symbol: 'C', nameAr: 'كربون', nameEn: 'Carbon', mass: 12.011, group: 14, period: 2, category: 'nonmetal', shells: [2, 4], config: '[He] 2s² 2p²', electronegativity: 2.55, stateAr: 'صلب', highlightAr: 'عمود الكيمياء العضوية لقدرته على تكوين 4 روابط تساهمية وسلاسل وحلقات متنوعة.' },
  { number: 7, symbol: 'N', nameAr: 'نيتروجين', nameEn: 'Nitrogen', mass: 14.007, group: 15, period: 2, category: 'nonmetal', shells: [2, 5], config: '[He] 2s² 2p³', electronegativity: 3.04, stateAr: 'غاز', highlightAr: 'يشكّل 78% من الهواء ويُستخدم في تحضير النشادر صناعياً بطريقة هابر-بوش.' },
  { number: 8, symbol: 'O', nameAr: 'أكسجين', nameEn: 'Oxygen', mass: 15.999, group: 16, period: 2, category: 'nonmetal', shells: [2, 6], config: '[He] 2s² 2p⁴', electronegativity: 3.44, stateAr: 'غاز', highlightAr: 'عنصر أساسي في الأكسدة والاحتراق والتنفس الخلوي وتكوين الأكاسيد.' },
  { number: 9, symbol: 'F', nameAr: 'فلور', nameEn: 'Fluorine', mass: 18.998, group: 17, period: 2, category: 'halogen', shells: [2, 7], config: '[He] 2s² 2p⁵', electronegativity: 3.98, stateAr: 'غاز', highlightAr: 'أعلى العناصر سالبية كهربية وأقوى عامل مؤكسد في الجدول الدوري.' },
  { number: 10, symbol: 'Ne', nameAr: 'نيون', nameEn: 'Neon', mass: 20.18, group: 18, period: 2, category: 'noble', shells: [2, 8], config: '[He] 2s² 2p⁶', electronegativity: null, stateAr: 'غاز', highlightAr: 'غاز نبيل مستقر تماماً يصدر توهجاً برتقالياً محمراً في مصابيح التفريغ.' },
  { number: 11, symbol: 'Na', nameAr: 'صوديوم', nameEn: 'Sodium', mass: 22.99, group: 1, period: 3, category: 'alkali', shells: [2, 8, 1], config: '[Ne] 3s¹', electronegativity: 0.93, stateAr: 'صلب', highlightAr: 'فلز قلوي شديد النشاط يتفاعل بعنف مع الماء منتجاً هيدروكسيد الصوديوم وغاز الهيدروجين.' },
  { number: 12, symbol: 'Mg', nameAr: 'ماغنيسيوم', nameEn: 'Magnesium', mass: 24.305, group: 2, period: 3, category: 'alkaline', shells: [2, 8, 2], config: '[Ne] 3s²', electronegativity: 1.31, stateAr: 'صلب', highlightAr: 'يُستخدم كقطب مضحّي في الحماية الأنودية ويدخل في تركيب الكلوروفيل.' },
  { number: 13, symbol: 'Al', nameAr: 'ألومنيوم', nameEn: 'Aluminum', mass: 26.982, group: 13, period: 3, category: 'post-transition', shells: [2, 8, 3], config: '[Ne] 3s² 3p¹', electronegativity: 1.61, stateAr: 'صلب', highlightAr: 'يُستخلص بالتحليل الكهربي للبوكسيت المذاب في الكريوليت ويكوّن سبائك الطائرات.' },
  { number: 14, symbol: 'Si', nameAr: 'سيليكون', nameEn: 'Silicon', mass: 28.085, group: 14, period: 3, category: 'metalloid', shells: [2, 8, 4], config: '[Ne] 3s² 3p²', electronegativity: 1.9, stateAr: 'صلب', highlightAr: 'أهم أشباه الموصلات في صناعة الرقائق الإلكترونية والخلايا الشمسية.' },
  { number: 15, symbol: 'P', nameAr: 'فوسفور', nameEn: 'Phosphorus', mass: 30.974, group: 15, period: 3, category: 'nonmetal', shells: [2, 8, 5], config: '[Ne] 3s² 3p³', electronegativity: 2.19, stateAr: 'صلب', highlightAr: 'يدخل في تركيب الأحماض النووية والأسمدة الفوسفاتية ومركبات ATP.' },
  { number: 16, symbol: 'S', nameAr: 'كبريت', nameEn: 'Sulfur', mass: 32.06, group: 16, period: 3, category: 'nonmetal', shells: [2, 8, 6], config: '[Ne] 3s² 3p⁴', electronegativity: 2.58, stateAr: 'صلب', highlightAr: 'أساس صناعة حمض الكبريتيك بطريقة التلامس باستخدام خامس أكسيد الفاناديوم.' },
  { number: 17, symbol: 'Cl', nameAr: 'كلور', nameEn: 'Chlorine', mass: 35.45, group: 17, period: 3, category: 'halogen', shells: [2, 8, 7], config: '[Ne] 3s² 3p⁵', electronegativity: 3.16, stateAr: 'غاز', highlightAr: 'هالوجين مؤكسد قوي يُستخدم في تعقيم المياه وتصنيع البوليمرات مثل PVC.' },
  { number: 18, symbol: 'Ar', nameAr: 'أرجون', nameEn: 'Argon', mass: 39.948, group: 18, period: 3, category: 'noble', shells: [2, 8, 8], config: '[Ne] 3s² 3p⁶', electronegativity: null, stateAr: 'غاز', highlightAr: 'يوفر جواً خاملاً في المصابيح الكهربية وعمليات اللحام المعدني.' },
  { number: 19, symbol: 'K', nameAr: 'بوتاسيوم', nameEn: 'Potassium', mass: 39.098, group: 1, period: 4, category: 'alkali', shells: [2, 8, 8, 1], config: '[Ar] 4s¹', electronegativity: 0.82, stateAr: 'صلب', highlightAr: 'يعطي لهباً بنفسجياً فاتحاً في الكشف الجاف ويدخل في برمنجنات البوتاسيوم KMnO4.' },
  { number: 20, symbol: 'Ca', nameAr: 'كالسيوم', nameEn: 'Calcium', mass: 40.078, group: 2, period: 4, category: 'alkaline', shells: [2, 8, 8, 2], config: '[Ar] 4s²', electronegativity: 1.0, stateAr: 'صلب', highlightAr: 'يعطي لهباً أحمر طوبياً ومحلول هيدروكسيده (ماء الجير) يكشف عن غاز CO2.' },
  { number: 21, symbol: 'Sc', nameAr: 'سكانديوم', nameEn: 'Scandium', mass: 44.956, group: 3, period: 4, category: 'transition', shells: [2, 8, 9, 2], config: '[Ar] 3d¹ 4s²', electronegativity: 1.36, stateAr: 'صلب', highlightAr: 'أول عناصر السلسلة الانتقالية الأولى؛ يُضاف للألومنيوم لصناعة طائرات الميج المقاتلة.' },
  { number: 22, symbol: 'Ti', nameAr: 'تيتانيوم', nameEn: 'Titanium', mass: 47.867, group: 4, period: 4, category: 'transition', shells: [2, 8, 10, 2], config: '[Ar] 3d² 4s²', electronegativity: 1.54, stateAr: 'صلب', highlightAr: 'شديد الصلابة كالصلب وأقل كثافة منه؛ لا يلفظه الجسم فيُستخدم في زراعة الأسنان والمفاصل.' },
  { number: 23, symbol: 'V', nameAr: 'فاناديوم', nameEn: 'Vanadium', mass: 50.942, group: 5, period: 4, category: 'transition', shells: [2, 8, 11, 2], config: '[Ar] 3d³ 4s²', electronegativity: 1.63, stateAr: 'صلب', highlightAr: 'أكسيده V2O5 عامل حفاز شهير في تحضير حمض الكبريتيك وحمض البنزويك.' },
  { number: 24, symbol: 'Cr', nameAr: 'كروم', nameEn: 'Chromium', mass: 51.996, group: 6, period: 4, category: 'transition', shells: [2, 8, 13, 1], config: '[Ar] 3d⁵ 4s¹', electronegativity: 1.66, stateAr: 'صلب', highlightAr: 'يشذ في التوزيع الإلكتروني ليكون 3d نصف ممتلئ؛ مقاوم للتآكل لتكوين طبقة أكسيد غير مسامية.' },
  { number: 25, symbol: 'Mn', nameAr: 'منجنيز', nameEn: 'Manganese', mass: 54.938, group: 7, period: 4, category: 'transition', shells: [2, 8, 13, 2], config: '[Ar] 3d⁵ 4s²', electronegativity: 1.55, stateAr: 'صلب', highlightAr: 'أعلى حالة تأكسد (+7) في السلسلة الانتقالية الأولى؛ وسبائكه مع الحديد أصلب من الصلب.' },
  { number: 26, symbol: 'Fe', nameAr: 'حديد', nameEn: 'Iron', mass: 55.845, group: 8, period: 4, category: 'transition', shells: [2, 8, 14, 2], config: '[Ar] 3d⁶ 4s²', electronegativity: 1.83, stateAr: 'صلب', highlightAr: 'عصب الصناعات الثقيلة، وعامل حفاز في تحضير النشادر بطريقة هابر-بوش وتحويل الغاز المائي لوقود.' },
  { number: 27, symbol: 'Co', nameAr: 'كوبالت', nameEn: 'Cobalt', mass: 58.933, group: 9, period: 4, category: 'transition', shells: [2, 8, 15, 2], config: '[Ar] 3d⁷ 4s²', electronegativity: 1.88, stateAr: 'صلب', highlightAr: 'نظيره المشع كوبالت-60 يصدر أشعة جاما لحفظ الأغذية والكشف عن الأورام وعلاجها.' },
  { number: 28, symbol: 'Ni', nameAr: 'نيكل', nameEn: 'Nickel', mass: 58.693, group: 10, period: 4, category: 'transition', shells: [2, 8, 16, 2], config: '[Ar] 3d⁸ 4s²', electronegativity: 1.91, stateAr: 'صلب', highlightAr: 'النيكل المجزأ عامل حفاز في هدرجة الزيوت، وسبائك النيكل-كروم تُستخدم في ملفات التسخين.' },
  { number: 29, symbol: 'Cu', nameAr: 'نحاس', nameEn: 'Copper', mass: 63.546, group: 11, period: 4, category: 'transition', shells: [2, 8, 18, 1], config: '[Ar] 3d¹⁰ 4s¹', electronegativity: 1.9, stateAr: 'صلب', highlightAr: 'يشذ في توزيعه الإلكتروني لامتلاء 3d؛ ممتاز في التوصيل الكهربي وكاثود خلية دانيال.' },
  { number: 30, symbol: 'Zn', nameAr: 'خارصين', nameEn: 'Zinc', mass: 65.38, group: 12, period: 4, category: 'transition', shells: [2, 8, 18, 2], config: '[Ar] 3d¹⁰ 4s²', electronegativity: 1.65, stateAr: 'صلب', highlightAr: 'عنصر غير انتقالي لامتلاء 3d في الحالة الذرية والتأكسد (+2)؛ يُستخدم في جلفنة الحديد وأنود خلية دانيال.' },
  { number: 35, symbol: 'Br', nameAr: 'بروم', nameEn: 'Bromine', mass: 79.904, group: 17, period: 4, category: 'halogen', shells: [2, 8, 18, 7], config: '[Ar] 3d¹⁰ 4s² 4p⁵', electronegativity: 2.96, stateAr: 'سائل', highlightAr: 'اللافلز السائل الوحيد عند درجة حرارة الغرفة؛ يزول لونه الأحمر عند الكشف عن الروابط الثنائية.' },
  { number: 36, symbol: 'Kr', nameAr: 'كريبتون', nameEn: 'Krypton', mass: 83.798, group: 18, period: 4, category: 'noble', shells: [2, 8, 18, 8], config: '[Ar] 3d¹⁰ 4s² 4p⁶', electronegativity: 3.0, stateAr: 'غاز', highlightAr: 'غاز نبيل يُستخدم في مصابيح التصوير الفائقة وليزر الكريبتون.' },
];

/** 开场动画共用的插画清单，静态资源保持在 public 中以便首屏直接加载。 */
const CONFIGURED_BASE_URL = import.meta.env?.BASE_URL ?? '/sakura-job-offer/';
const LAUNCH_ASSET_BASE_URL = `${CONFIGURED_BASE_URL}assets/launch/`;

export const LAUNCH_HERO_SRC = `${LAUNCH_ASSET_BASE_URL}sakura-campus-hero.png`;

export const ENTRY_ARTWORK = [
  {
    id: 'autumn',
    label: '秋招专场',
    src: `${LAUNCH_ASSET_BASE_URL}autumn-letter.png`,
    accent: 'pink',
  },
  {
    id: 'internship',
    label: '实习生招聘',
    src: `${LAUNCH_ASSET_BASE_URL}internship-tote.png`,
    accent: 'blue',
  },
  {
    id: 'tools',
    label: '求职工具',
    src: `${LAUNCH_ASSET_BASE_URL}tools-notebook.png`,
    accent: 'yellow',
  },
  {
    id: 'interviews',
    label: '面经分享',
    src: `${LAUNCH_ASSET_BASE_URL}interview-notes.png`,
    accent: 'violet',
  },
  {
    id: 'tracker',
    label: '我的投递',
    src: `${LAUNCH_ASSET_BASE_URL}tracker-folder.png`,
    accent: 'pink',
  },
] as const;

/** 首幕背景跑马灯只提供氛围，不承载功能信息，因此保持低密度与短词组。 */
export const BACKGROUND_MARQUEE_ROWS = [
  { direction: 'left', words: ['Dream Job', 'OFFER', '上岸'] },
  { direction: 'right', words: ['OC', '录用意向', 'Sakura'] },
  { direction: 'left', words: ['秋招', '实习', '校园招聘'] },
] as const;

/** 背景文字保持明显流动感，避免低速移动看起来近似静止。 */
export const MARQUEE_DURATION_SECONDS = 5;

/** 手账开场依照上排、主卡、下排的阅读动线翻开五张功能卡片。 */
export const JOURNAL_CARD_REVEAL_ORDER = [1, 2, 0, 3, 4] as const;

/** 两幕开场共用的收页参数，保证单独回放时也以相同节奏露出主页。 */
export const LAUNCH_EXIT_MOTION = {
  clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
  durationSeconds: 0.7,
  ease: 'power3.inOut',
  revealDelaySeconds: 0.28,
} as const;

/** 手账开场从封面显现到纸页翻走的完整演出时长。 */
export const JOURNAL_INTRO_DURATION_SECONDS = 4.7;

/** 五张卡完整展示后开始收拢纸页，并准备露出下一层画面。 */
export const JOURNAL_EXIT_START_SECONDS = 4;

/** 纸页收拢约四分之一后接入底层页面，避免底页过早抢走视觉焦点。 */
export const JOURNAL_PAGE_REVEAL_SECONDS =
  JOURNAL_EXIT_START_SECONDS + LAUNCH_EXIT_MOTION.revealDelaySeconds;

/** 秋招第二幕延续首幕的秋招信封，避免出现无关联的专题视觉。 */
export const getAutumnArtwork = () => ENTRY_ARTWORK[0];

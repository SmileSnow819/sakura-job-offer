/** 开场动画共用的插画清单，静态资源保持在 public 中以便首屏直接加载。 */
export const ENTRY_ARTWORK = [
  {
    id: 'autumn',
    label: '秋招专场',
    src: '/sakura-job-offer/assets/launch/autumn-letter.png',
    accent: 'pink',
  },
  {
    id: 'internship',
    label: '实习生招聘',
    src: '/sakura-job-offer/assets/launch/internship-tote.png',
    accent: 'blue',
  },
  {
    id: 'tools',
    label: '求职工具',
    src: '/sakura-job-offer/assets/launch/tools-notebook.png',
    accent: 'yellow',
  },
  {
    id: 'interviews',
    label: '面经分享',
    src: '/sakura-job-offer/assets/launch/interview-notes.png',
    accent: 'violet',
  },
  {
    id: 'tracker',
    label: '我的投递',
    src: '/sakura-job-offer/assets/launch/tracker-folder.png',
    accent: 'pink',
  },
] as const;

/** 首幕背景跑马灯只提供氛围，不承载功能信息，因此保持低密度与短词组。 */
export const BACKGROUND_MARQUEE_ROWS = [
  { direction: 'left', words: ['上岸', 'Offer', '梦想工作'] },
  { direction: 'right', words: ['认真投递', '春日来信', '下一站'] },
  { direction: 'left', words: ['校园招聘', '新的旅程', 'Sakura'] },
] as const;

/** 秋招第二幕延续首幕的秋招信封，避免出现无关联的专题视觉。 */
export const getAutumnArtwork = () => ENTRY_ARTWORK[0];

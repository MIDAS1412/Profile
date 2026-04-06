export const profilePayload = {
  coverHeadline: [
    'Mình không muốn profile bị nhạt',
    'thì mình code luôn một trang riêng',
    'để nhìn vào là thấy chất của mình',
  ],
  identity: {
    name: 'MIDAS1412',
    handle: '@MIDAS1412',
    role: 'Full-stack profile builder',
    tagline: 'Shipping expressive interfaces with practical backend structure.',
    bio: 'A personal profile hub designed to feel premium, alive, and useful. The frontend focuses on bold visual presentation, while the backend keeps profile content centralized and easy to update.',
    email: 'dungquangnguyen118@gmail.com',
    timezone: 'Asia/Ho_Chi_Minh',
    availability: 'Open for interesting builds and collabs',
    avatarUrl: 'https://github.com/MIDAS1412.png',
    locationHint: 'Use the live map for current location',
  },
  quickFacts: [
    'Responsive layout',
    'Live location page',
    'Backend-powered content',
    'Vercel-ready deploy',
  ],
  metrics: [
    {
      label: 'Profile depth',
      value: '08 blocks',
      detail: 'Hero, stats, timeline, stack, projects, socials, principles, and live map entry point.',
    },
    {
      label: 'Performance mindset',
      value: 'Fast UI',
      detail: 'Built as a lightweight React/Vite frontend with focused sections and clean data flow.',
    },
    {
      label: 'Backend structure',
      value: 'API first',
      detail: 'Profile content is provided from a backend source instead of hardcoding everything in the UI.',
    },
    {
      label: 'Deploy target',
      value: 'Vercel',
      detail: 'Prepared for public hosting with serverless API wrappers at the repo root.',
    },
  ],
  focusAreas: [
    {
      title: 'Profile storytelling',
      description: 'A profile page that reads like a polished landing page instead of a static resume.',
    },
    {
      title: 'Centralized content',
      description: 'Core profile details live in the backend so future edits stay simple and organized.',
    },
    {
      title: 'Live location flow',
      description: 'The map page uses real browser geolocation and a full interactive map.',
    },
    {
      title: 'Production shape',
      description: 'The repo is split into frontend and backend with scripts ready for local work and deployment.',
    },
  ],
  skills: [
    { name: 'React', level: 92, category: 'Frontend' },
    { name: 'TypeScript', level: 89, category: 'Language' },
    { name: 'Node.js', level: 85, category: 'Backend' },
    { name: 'API design', level: 83, category: 'Architecture' },
    { name: 'UI systems', level: 90, category: 'Design' },
  ],
  experience: [
    {
      period: 'Current',
      title: 'Personal brand build',
      company: 'Profile Hub',
      summary: 'Turning a plain repository into a public-ready personal profile site with a richer experience.',
      highlights: [
        'Split frontend and backend into clear responsibilities.',
        'Added profile storytelling blocks instead of a basic single-column page.',
        'Built a dedicated map route for real geolocation display.',
      ],
    },
    {
      period: 'System',
      title: 'Frontend direction',
      company: 'React + Vite',
      summary: 'Focused on a visual language with stronger typography, warmer tones, glass panels, and motion-friendly layout.',
      highlights: [
        'Responsive cards that hold up on desktop and mobile.',
        'Theme accent switching for quick visual variation.',
        'Interactive actions like copy email and route transitions.',
      ],
    },
    {
      period: 'API',
      title: 'Backend content layer',
      company: 'Express + serverless',
      summary: 'Used a small backend for local dev and mirrored the same data through Vercel-friendly API functions.',
      highlights: [
        'One data source reused between local backend and hosted functions.',
        'Simple endpoints for profile data and health status.',
        'Prepared structure for future expansion beyond static profile content.',
      ],
    },
  ],
  projects: [
    {
      title: 'Profile Command Center',
      blurb: 'A central landing page for identity, capabilities, featured work, and outbound contact actions.',
      stack: ['React', 'TypeScript', 'Responsive UI'],
      links: {
        github: 'https://github.com/MIDAS1412/Profile',
      },
    },
    {
      title: 'Live Location Map',
      blurb: 'A dedicated route that requests geolocation permission, visualizes current position, and opens external navigation.',
      stack: ['Leaflet', 'OpenStreetMap', 'Geolocation API'],
      links: {},
    },
    {
      title: 'Backend Content Source',
      blurb: 'A clean data-driven layer so the profile can evolve without rewriting every UI section.',
      stack: ['Node.js', 'Express', 'Vercel Functions'],
      links: {},
    },
  ],
  socials: [
    { label: 'GitHub', href: 'https://github.com/MIDAS1412' },
    { label: 'Email', href: 'mailto:dungquangnguyen118@gmail.com' },
  ],
  principles: [
    'Make the first screen memorable, not generic.',
    'Keep personal data editable from one source of truth.',
    'Use interaction only when it improves clarity or delight.',
  ],
  now: [
    'Building a stronger public-facing developer identity.',
    'Using backend data to keep the profile maintainable.',
    'Keeping the map page ready for real-time location checks.',
  ],
} as const

export type ProfilePayload = typeof profilePayload

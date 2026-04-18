export type ProfileMetric = {
  label: string
  value: string
  detail: string
}

export type FocusArea = {
  title: string
  description: string
}

export type SkillItem = {
  name: string
  level: number
  category: string
}

export type ExperienceItem = {
  period: string
  title: string
  company: string
  summary: string
  highlights: string[]
}

export type ProjectItem = {
  title: string
  blurb: string
  stack: string[]
  links: {
    live?: string
    github?: string
  }
}

export type SocialItem = {
  label: string
  href: string
}

export type GalleryImage = {
  label: string
  title: string
  description: string
  imageUrl: string
  alt: string
  replacementHint: string
}

export type SavedLocation = {
  label: string
  description: string
  latitude: number
  longitude: number
}

export type ProfileViewStats = {
  count: number
  updatedAt: string
}

export type ProfileResponse = {
  coverHeadline: string[]
  identity: {
    name: string
    initials: string
    handle: string
    role: string
    tagline: string
    bio: string
    email: string
    timezone: string
    availability: string
    locationHint: string
  }
  location: SavedLocation
  gallery: GalleryImage[]
  quickFacts: string[]
  metrics: ProfileMetric[]
  focusAreas: FocusArea[]
  skills: SkillItem[]
  experience: ExperienceItem[]
  projects: ProjectItem[]
  socials: SocialItem[]
  principles: string[]
  now: string[]
}

export type ProfileApiResponse = ProfileResponse & {
  _meta: {
    source: 'railway-backend' | 'frontend-fallback'
    generatedAt: string
  }
}

export type ProfileViewsResponse = ProfileViewStats & {
  ok: true
}

export const profileData: ProfileResponse = {
  coverHeadline: [
    'Nguyen Quang Dung',
    'Portfolio frontend on Vercel',
    'Profile API served from Railway',
  ],
  identity: {
    name: 'Nguyen Quang Dung',
    initials: 'NQD',
    handle: '@nguyenquangdung',
    role: 'Frontend Developer',
    tagline: 'Building clean, responsive interfaces with React and TypeScript.',
    bio: 'This profile runs with a Vercel frontend and a Railway backend serving the shared content contract. Static assets stay on the frontend, while the API keeps the structure aligned for future updates.',
    email: 'dungquangnguyen118@gmail.com',
    timezone: 'Asia/Ho_Chi_Minh',
    availability: 'Open for freelance work and product collaborations',
    locationHint: 'Ho Chi Minh City, Vietnam',
  },
  location: {
    label: 'Ho Chi Minh City',
    description: 'Location data is shared between the Vercel frontend and the Railway API contract.',
    latitude: 10.77689,
    longitude: 106.700806,
  },
  gallery: [
    {
      label: 'Photo 01',
      title: 'Personal photo',
      description: 'Served as a static asset from the frontend while the metadata can be fetched from the backend.',
      imageUrl: '/images/Mine.jpg',
      alt: 'Personal photo of Nguyen Quang Dung',
      replacementHint: 'Source: frontend/public/images/Mine.jpg',
    },
    {
      label: 'Photo 02',
      title: 'Second photo',
      description: 'A second local JPG that stays on Vercel and is referenced by the shared profile payload.',
      imageUrl: '/images/Mine2.jpg',
      alt: 'Second photo of Nguyen Quang Dung',
      replacementHint: 'Source: frontend/public/images/Mine2.jpg',
    },
  ],
  quickFacts: ['React + TypeScript', 'Railway API live', 'Vercel frontend live', '2 local JPG images'],
  metrics: [
    {
      label: 'Build type',
      value: 'Separated FE/BE',
      detail: 'The frontend ships as a static Vite build while the profile API runs independently on Railway.',
    },
    {
      label: 'Content source',
      value: 'Shared contract',
      detail: 'Frontend fallback data and backend responses are generated from the same shared profile module.',
    },
    {
      label: 'Image handling',
      value: 'Local JPG',
      detail: 'Both images live in frontend/public/images so Vercel serves them directly without touching the API.',
    },
    {
      label: 'Deploy target',
      value: 'Vercel + Railway',
      detail: 'Frontend goes to Vercel, backend goes to Railway, and the API base URL is injected via environment variables.',
    },
  ],
  focusAreas: [
    {
      title: 'Clean personal branding',
      description: 'A portfolio page that is direct, readable, and structured for a quick first impression.',
    },
    {
      title: 'Frontend and backend agreement',
      description: 'The payload shape is shared so UI updates and API responses stay aligned.',
    },
    {
      title: 'Simple maintenance',
      description: 'Static assets remain in the frontend while editable profile content can come from the backend layer.',
    },
    {
      title: 'Deploy safety',
      description: 'The frontend falls back to bundled data when the API is unavailable, which reduces Vercel runtime surprises.',
    },
  ],
  skills: [
    { name: 'React', level: 92, category: 'Frontend' },
    { name: 'TypeScript', level: 88, category: 'Language' },
    { name: 'Vite', level: 86, category: 'Tooling' },
    { name: 'Express', level: 78, category: 'Backend' },
    { name: 'Deployment flow', level: 82, category: 'Product' },
  ],
  experience: [
    {
      period: 'Now',
      title: 'Portfolio rebuild',
      company: 'Independent',
      summary: 'Reconnecting the portfolio to a lightweight backend so hosting is split cleanly between Vercel and Railway.',
      highlights: [
        'Restored a backend service that serves the profile payload.',
        'Aligned frontend data and backend responses from one shared contract.',
        'Kept static JPG assets on the frontend for simple image delivery.',
      ],
    },
    {
      period: 'Focus',
      title: 'Frontend development',
      company: 'React ecosystem',
      summary: 'Building interfaces that prioritize clarity, responsiveness, and practical content structure.',
      highlights: [
        'Comfortable shaping landing pages, dashboards, and product surfaces.',
        'Use TypeScript to keep UI code easier to scale and edit safely.',
        'Prefer direct, maintainable solutions over unnecessary complexity.',
      ],
    },
    {
      period: 'Stack',
      title: 'Deployment-minded implementation',
      company: 'Vercel + Railway',
      summary: 'Combining a static frontend deploy with a small API service so each platform does the job it is best at.',
      highlights: [
        'Frontend deploy stays lightweight and cache-friendly.',
        'Backend only needs to expose a predictable JSON payload and health endpoint.',
        'Environment-based API routing keeps preview and production flexible.',
      ],
    },
  ],
  projects: [
    {
      title: 'Personal Profile Site',
      blurb: 'A portfolio page that highlights identity, skills, experience, and contact entry points.',
      stack: ['React', 'TypeScript', 'Vite'],
      links: {
        github: 'https://github.com/MIDAS1412/Profile',
        live: 'https://midas-profile.vercel.app',
      },
    },
    {
      title: 'Railway Profile API',
      blurb: 'A small Express service that serves the same profile contract used by the frontend fallback.',
      stack: ['Node.js', 'Express', 'Railway'],
      links: {
        live: 'https://profile-backend-production-e0f7.up.railway.app/health',
      },
    },
    {
      title: 'Static Asset Gallery',
      blurb: 'A simple photo section where the images stay local to the frontend and deploy with Vercel.',
      stack: ['Static assets', 'Responsive layout', 'Vercel'],
      links: {},
    },
  ],
  socials: [
    { label: 'GitHub', href: 'https://github.com/MIDAS1412' },
    { label: 'Email', href: 'mailto:dungquangnguyen118@gmail.com' },
  ],
  principles: [
    'Keep the portfolio easy to edit without breaking the deploy flow.',
    'Use one payload shape so frontend and backend stay in sync.',
    'Prefer a fallback path instead of letting a missing API take the site down.',
  ],
  now: [
    'Serving profile content from Railway for the live frontend.',
    'Keeping gallery images as local static assets on Vercel.',
    'Running the homepage in a darker red-black portfolio direction.',
  ],
}

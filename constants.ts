import type { User, MvpPlan, UserSession, AccessRequest, ApiUsageRecord } from './types';

export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', password: 'alice123', role: 'USER', subscription: 'FREE', avatar: 'https://picsum.photos/seed/alice/200', apiCalls: 2, apiCallLimit: 5, status: 'ACTIVE' },
  { id: 'user-2', name: 'Bob Williams', email: 'bob@example.com', password: 'bob123', role: 'USER', subscription: 'PRO', avatar: 'https://picsum.photos/seed/bob/200', apiCalls: 42, apiCallLimit: Infinity, status: 'ACTIVE' },
  { id: 'user-3', name: 'Charlie Brown', email: 'charlie@example.com', password: 'charlie123', role: 'USER', subscription: 'ENTERPRISE', avatar: 'https://picsum.photos/seed/charlie/200', apiCalls: 150, apiCallLimit: Infinity, status: 'INACTIVE' },
];

export const MOCK_ADMINS: User[] = [
  { id: 'admin-1', name: 'Diana Prince', email: 'diana@example.com', password: 'diana123', role: 'ADMIN', subscription: 'ENTERPRISE', avatar: 'https://picsum.photos/seed/diana/200', apiCalls: 0, apiCallLimit: Infinity, status: 'ACTIVE' },
  { id: 'admin-2', name: 'Bruce Wayne', email: 'bruce@example.com', password: 'bruce123', role: 'ADMIN', subscription: 'ENTERPRISE', avatar: 'https://picsum.photos/seed/bruce/200', apiCalls: 0, apiCallLimit: Infinity, status: 'ACTIVE' },
  { id: 'admin-3', name: 'Likhith Sai', email: 'likhithsaiparepalli@gmail.com', password: '9494532@Pl', role: 'ADMIN', subscription: 'ENTERPRISE', avatar: 'https://picsum.photos/seed/likhith/200', apiCalls: 0, apiCallLimit: Infinity, status: 'ACTIVE' },
];

export const MOCK_SUPERADMINS: User[] = [
  { id: 'superadmin-1', name: 'Sailikhith', email: 'sailikhith816@gmail.com', password: '9494532@Pl', role: 'SUPERADMIN', subscription: 'ENTERPRISE', avatar: 'https://picsum.photos/seed/clark/200', apiCalls: 0, apiCallLimit: Infinity, status: 'ACTIVE' },
];

export const MOCK_MVP_PLANS: MvpPlan[] = [
    {
        id: 'plan-1',
        userId: 'user-1',
        ideaPrompt: 'An app to find the best dog parks in a city.',
        marketAnalysis: { title: 'Market Analysis', content: 'The pet industry is booming. Many new pet owners are looking for safe and fun places for their pets. This app would cater to a growing market of urban dog owners.' },
        techStackAnalysis: { title: 'Tech Stack Analysis', content: 'React Native for cross-platform mobile app. Firebase for backend services (auth, database, storage). Mapbox for interactive maps.' },
        businessAnalysis: { title: 'Business Analysis', content: 'Freemium model. Basic features are free. Premium features like user reviews, park amenities filtering, and event notifications for a monthly subscription.' },
        projectScope: { title: 'Project Scope', content: 'Phase 1: Map with park locations, basic filtering. Phase 2: User accounts, reviews, and ratings. Phase 3: Social features, park events.' },
        expenditureEstimation: { title: 'Expenditure Estimation', content: 'Initial development: $15,000. Monthly running costs (servers, APIs): $500. Marketing budget: $5,000.' },
        competitorAnalysis: { title: 'Competitor Analysis', content: 'Competitors include general map apps and local blogs. Our advantage is a dedicated, feature-rich platform for dog owners.' },
        projectPreview: { title: 'Project Preview', content: 'This project is positioned for success. By targeting a niche, growing market of dog owners with a feature-rich, user-friendly mobile app, it can capture a loyal user base. The freemium model allows for rapid user acquisition, while premium features provide a clear path to monetization. The phased rollout ensures a manageable development cycle and allows for user feedback to guide future features. With a solid technical foundation and a clear business strategy, this dog park finder app is ready to be built.'},
        createdAt: new Date().toISOString(),
    }
];


export const MOCK_USER_SESSIONS: UserSession[] = [
    { id: 'session-1', userName: 'Alice Johnson', loginTime: new Date(Date.now() - 3600000).toLocaleString(), actions: 12 },
    { id: 'session-2', userName: 'Bob Williams', loginTime: new Date(Date.now() - 7200000).toLocaleString(), actions: 5 },
    { id: 'session-3', userName: 'Charlie Brown', loginTime: new Date(Date.now() - 10800000).toLocaleString(), actions: 25 },
    { id: 'session-4', userName: 'Diana Prince (Admin)', loginTime: new Date(Date.now() - 1800000).toLocaleString(), actions: 31 },
    { id: 'session-5', userName: 'Bruce Wayne (Admin)', loginTime: new Date(Date.now() - 9000000).toLocaleString(), actions: 45 },
];

export const MOCK_ACCESS_REQUESTS: AccessRequest[] = [
    { id: 'req-1', userId: 'user-2', userName: 'Bob Williams', userEmail: 'bob@example.com', requestedRole: 'ADMIN', status: 'PENDING', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'req-2', userId: 'admin-2', userName: 'Bruce Wayne', userEmail: 'bruce@example.com', requestedRole: 'SUPERADMIN', status: 'PENDING', createdAt: new Date(Date.now() - 3600000).toISOString() },
];

export const MOCK_API_USAGE_HISTORY: Record<string, ApiUsageRecord[]> = {
    'user-1': [
        { date: '7 days ago', calls: 0 },
        { date: '6 days ago', calls: 1 },
        { date: '5 days ago', calls: 0 },
        { date: '4 days ago', calls: 0 },
        { date: '3 days ago', calls: 1 },
        { date: '2 days ago', calls: 0 },
        { date: 'Yesterday', calls: 0 },
        { date: 'Today', calls: 2 },
    ],
    'user-2': [
        { date: '7 days ago', calls: 5 },
        { date: '6 days ago', calls: 8 },
        { date: '5 days ago', calls: 6 },
        { date: '4 days ago', calls: 10 },
        { date: '3 days ago', calls: 7 },
        { date: '2 days ago', calls: 5 },
        { date: 'Yesterday', calls: 9 },
        { date: 'Today', calls: 2 },
    ]
};

export const MVP_GENERATION_STEPS = [
    'Market Analysis',
    'Tech Stack Analysis',
    'Business Analysis',
    'Project Scope',
    'Expenditure Estimation',
    'Competitor Analysis',
    'Project Preview',
];

import { GoogleGenAI, Type } from "@google/genai";
import { MVP_GENERATION_STEPS } from '../constants';
import type { MvpPlan, MvpPlanSection, ProjectFile } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY environment variable not set. Using a mock service.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const MOCK_DELAY = 1500;

const mockGenerateFullMvpPlan = (idea: string): Promise<Omit<MvpPlan, 'id' | 'userId' | 'ideaPrompt' | 'createdAt' | 'generatedCode'>> => {
    console.log(`[MOCK AI] Generating full plan for idea: "${idea}"`);
    return new Promise(resolve => {
        setTimeout(() => {
            const mockPlan: any = {};
            MVP_GENERATION_STEPS.forEach(step => {
                const key = step.toLowerCase().replace(/ /g, '')
                    .replace('analysis', 'Analysis')
                    .replace('stack', 'Stack')
                    .replace('scope', 'Scope')
                    .replace('estimation', 'Estimation')
                    .replace('preview', 'Preview');
                mockPlan[key] = { title: step, content: `This is a mock response for ${step} based on the idea: "${idea}". This would normally contain detailed, AI-generated insights.` };
            });
            resolve(mockPlan);
        }, MOCK_DELAY);
    });
};

const hasPredefinedStack = (idea: string): boolean => {
    const lowercasedIdea = idea.toLowerCase();
    const techKeywords = [
        'react', 'vue', 'angular', 'svelte',
        'node.js', 'express', 'django', 'ruby on rails', 'laravel',
        'mongodb', 'postgresql', 'mysql', 'firebase',
        'tailwind', 'bootstrap',
        'websockets', 'socket.io',
        'jwt', 'oauth',
        'razorpay', 'stripe',
        'aws', 'heroku', 'vercel', 'google cloud',
        'docker', 'kubernetes'
    ];
    const triggerPhrases = [
        'technical requirements', 'tech stack', 'technologies:', 'strictly use', 'use only'
    ];

    const hasTriggerPhrase = triggerPhrases.some(phrase => lowercasedIdea.includes(phrase));
    const hasTechKeywords = techKeywords.some(keyword => lowercasedIdea.includes(keyword));

    return hasTriggerPhrase && hasTechKeywords;
};

export const generateFullMvpPlan = async (idea: string): Promise<Omit<MvpPlan, 'id' | 'userId' | 'ideaPrompt' | 'createdAt' | 'generatedCode'>> => {
    if (!ai) {
        return mockGenerateFullMvpPlan(idea);
    }
    
    const fullPlanPrompt = `
    Generate an in-depth and comprehensive MVP (Minimum Viable Product) plan for the following SaaS idea: "${idea}".
    Your response MUST be a single, valid JSON object.
    The JSON object must have the following keys: "marketAnalysis", "techStackAnalysis", "businessAnalysis", "projectScope", "expenditureEstimation", "competitorAnalysis", "projectPreview".
    For each key, the value must be an object with two string properties: "title" and "content".
    The "content" for each section must be detailed, well-structured, and written in a professional yet simple style that is easy to read.
    Use markdown for structure: '###' for subheadings and '*' for bullet points.
    Separate distinct paragraphs with a blank line for clear separation.
    Use markdown for bolding ('**') sparingly for emphasis on key numbers or insights only. The output should be clean and professional.

    1.  marketAnalysis:
        -   Title: "Market Analysis"
        -   Content: Take the user's idea and generate a clear, well-structured market analysis. Rewrite it in a professional but simple style that is easy to read, like a polished business document for investors.
            -   **Structure**: Break the content into these distinct sections using '###' markdown headers: 'Target Audience', 'Market Size Estimation (TAM/SAM/SOM)', 'Key Market Trends', and 'Potential Barriers & Challenges'.
            -   **Formatting**: Use short paragraphs and bullet points ('*') to keep the content engaging, concise, and visually clear. Avoid long blocks of text.
            -   **Emphasis**: Use bold highlights ('**') for key numbers and insights to make them stand out.
            -   **Content Details**:
                -   Target Audience: A detailed description (demographics, needs, pain points).
                -   Market Size: An estimation of TAM, SAM, and SOM.
                -   Market Trends: Key industry trends and growth potential.
                -   Barriers to Entry: Potential challenges and barriers.

    2.  techStackAnalysis:
        -   Title: "Tech Stack Analysis"
        -   Content: Recommend and justify a technology stack. Use short paragraphs, bullet points, and '###' headers for each category.
            -   **Frontend**: Suggest a framework (e.g., React, Vue) and explain why.
            -   **Backend**: Suggest a language/framework (e.g., Node.js, Python/Django) and explain why.
            -   **Database**: Suggest a database solution (e.g., PostgreSQL, MongoDB) and explain why.
            -   **Deployment/Hosting**: Suggest a platform (e.g., Vercel, AWS).
            -   **Key 3rd Party Services**: Mention essential APIs or services (e.g., Stripe, SendGrid).

    3.  businessAnalysis:
        -   Title: "Business Analysis"
        -   Content: Outline the business strategy. Use short paragraphs and '###' headers for each category.
            -   **Monetization Model**: Describe the pricing strategy in detail (e.g., freemium, subscription tiers).
            -   **Unique Value Proposition (UVP)**: Clearly state what makes this product different and better.
            -   **Key Performance Indicators (KPIs)**: List essential metrics to track for success (e.g., MAU, Churn Rate).

    4.  projectScope:
        -   Title: "Project Scope"
        -   Content: Define the project's boundaries. Use '###' headers and bullet points.
            -   **Core MVP Features**: List the absolute essential features for the first launch in a bulleted list.
            -   **Phased Rollout Plan**: Briefly describe features for Phase 2 and Phase 3.
            -   **Out of Scope**: Explicitly mention features that should NOT be included in the initial MVP.

    5.  expenditureEstimation:
        -   Title: "Expenditure Estimation"
        -   Content: Provide a realistic cost breakdown. Use '###' headers and use bold ('**') for all monetary figures.
            -   **Initial Development Costs**: A rough estimate (e.g., based on developer hours).
            -   **Monthly Running Costs**: Estimate for servers, databases, APIs, etc.
            -   **Marketing & Launch Budget**: A suggested budget for initial user acquisition.

    6.  competitorAnalysis:
        -   Title: "Competitor Analysis"
        -   Content: Analyze the competitive landscape. Use '###' headers for each competitor.
            -   Identify 5-6 primary competitors.
            -   For each competitor, list their key strengths and weaknesses using bullet points.
            -   **Include Links**: For each competitor, provide a direct link to their live project, website, or a relevant social media profile if available. Make sure the links are valid.
            -   Outline your key differentiators and competitive advantages.

    7.  projectPreview:
        -   Title: "Project Preview"
        -   Content: A concluding summary to inspire action. Use short paragraphs.
            -   A strategic overview of the project's potential for success.
            -   A summary of the key risks and a brief mitigation strategy.
            -   A final concluding paragraph that inspires action.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPlanPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        marketAnalysis: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['title', 'content'] },
                        techStackAnalysis: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['title', 'content'] },
                        businessAnalysis: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['title', 'content'] },
                        projectScope: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['title', 'content'] },
                        expenditureEstimation: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['title', 'content'] },
                        competitorAnalysis: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['title', 'content'] },
                        projectPreview: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['title', 'content'] },
                    },
                    required: [
                        'marketAnalysis',
                        'techStackAnalysis',
                        'businessAnalysis',
                        'projectScope',
                        'expenditureEstimation',
                        'competitorAnalysis',
                        'projectPreview'
                    ]
                },
            },
        });
        
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }

        return JSON.parse(jsonStr);
    } catch (error: any) {
        console.error(`Error generating full MVP plan:`, error);
        if (error instanceof SyntaxError) {
            throw new Error("The AI returned an invalid format. Please try again.");
        }
        if (error.message) {
            if (error.message.includes("quota")) {
                throw new Error("API Quota Exceeded. Please upgrade your plan or wait for it to reset.");
            }
            if (error.message.includes("500") || error.message.includes("Internal error")) {
                throw new Error("The AI service encountered an internal error. Please try again later.");
            }
        }
        throw new Error("An unexpected error occurred while generating the MVP plan.");
    }
};

const mockGenerateProjectCode = (idea: string): Promise<ProjectFile[]> => {
    console.log(`[MOCK AI] Generating project code for idea: "${idea}"`);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                {
                    path: '/package.json',
                    content: JSON.stringify({
                        name: 'dog-park-finder',
                        private: true,
                        version: '0.0.0',
                        type: 'module',
                        scripts: { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' },
                        dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' }, // Intentionally omit lucide-react for demo
                        devDependencies: { '@types/react': '^18.2.66', '@types/react-dom': '^18.2.22', '@vitejs/plugin-react': '^4.2.1', typescript: '^5.2.2', vite: '^5.2.0', tailwindcss: '^3.4.3', postcss: '^8.4.38', autoprefixer: '^10.4.19' }
                    }, null, 2),
                },
                 {
                    path: '/tsconfig.json',
                    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`
                },
                {
                    path: '/tsconfig.node.json',
                    content: `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`
                },
                {
                    path: '/index.html',
                    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dog Park Finder</title>
  </head>
  <body class="bg-background">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
                },
                {
                    path: '/vite.config.ts',
                    content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})`
                },
                {
                    path: '/tailwind.config.js',
                    content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#111827',
        'surface': '#1f2937',
        'primary': '#4f46e5',
        'secondary': '#10b981',
        'on-surface': '#f9fafb',
        'on-surface-variant': '#9ca3af',
      }
    },
  },
  plugins: [],
}`
                },
                {
                    path: '/postcss.config.js',
                    content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
                },
                {
                    path: '/src/index.css',
                    content: `@tailwind base;
@tailwind components;
@tailwind utilities;`
                },
                {
                    path: '/src/main.tsx',
                    content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
                },
                {
                    path: '/src/data/parks.ts',
                    content: `export interface Park {
  id: number;
  name: string;
  address: string;
  rating: number;
  amenities: string[];
}

export const parks: Park[] = [
  { id: 1, name: 'Central Bark', address: '123 Main St, Anytown, USA', rating: 4.5, amenities: ['water fountain', 'benches', 'small dog area'] },
  { id: 2, name: 'Pawsitive Meadows', address: '456 Oak Ave, Anytown, USA', rating: 4.8, amenities: ['agility course', 'water fountain', 'waste bags'] },
  { id: 3, name: 'The Wagging Tail', address: '789 Pine Ln, Anytown, USA', rating: 4.2, amenities: ['benches', 'shaded areas'] },
  { id: 4, name: 'Canine Commons', address: '101 Maple Dr, Anytown, USA', rating: 4.6, amenities: ['water fountain', 'waste bags', 'large open field'] },
];`
                },
                {
                    path: '/src/App.tsx',
                    content: `import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import ParkList from './components/ParkList';
import MapView from './components/MapView';
import SearchBar from './components/SearchBar';
import { parks } from './data/parks';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredParks = useMemo(() => {
    if (!searchTerm) return parks;
    const lowerCaseTerm = searchTerm.toLowerCase();
    return parks.filter(park => 
      park.name.toLowerCase().includes(lowerCaseTerm) ||
      park.address.toLowerCase().includes(lowerCaseTerm) ||
      park.amenities.some(amenity => amenity.toLowerCase().includes(lowerCaseTerm))
    );
  }, [searchTerm]);


  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-on-surface">Nearby Dog Parks</h2>
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            <div className="mt-6">
                {filteredParks.length > 0 ? (
                    <ParkList parks={filteredParks} />
                ) : (
                    <p className="text-center text-on-surface-variant mt-8">No parks found matching your search.</p>
                )}
            </div>
          </div>
          <div className="hidden lg:block sticky top-24">
            <MapView />
          </div>
        </div>
      </main>
    </div>
  );
}`
                },
                 {
                    path: '/src/components/SearchBar.tsx',
                    content: `import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search className="h-5 w-5 text-on-surface-variant" />
    </div>
    <input
      type="text"
      placeholder="Search by name, address, or amenity..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className="block w-full pl-10 pr-3 py-2 border border-gray-600 bg-gray-700 text-on-surface rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
    />
  </div>
);

export default SearchBar;`
                },
                {
                    path: '/src/components/Header.tsx',
                    content: `import React from 'react';
import { PawPrint } from 'lucide-react';

const Header = () => (
  <header className="bg-surface shadow-md sticky top-0 z-10">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <PawPrint className="text-primary h-8 w-8" />
        <h1 className="text-2xl font-bold text-on-surface">Dog Park Finder</h1>
      </div>
      <nav>
        <button className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors">
          Log In
        </button>
      </nav>
    </div>
  </header>
);

export default Header;`
                },
                {
                    path: '/src/components/ParkList.tsx',
                    content: `import React from 'react';
import ParkCard from './ParkCard';
import { Park } from '../data/parks';

interface ParkListProps {
  parks: Park[];
}

const ParkList: React.FC<ParkListProps> = ({ parks }) => (
  <div className="space-y-4">
    {parks.map(park => (
      <ParkCard key={park.id} park={park} />
    ))}
  </div>
);

export default ParkList;`
                },
                {
                    path: '/src/components/ParkCard.tsx',
                    content: `import React from 'react';
import { Star, MapPin } from 'lucide-react';
import { Park } from '../data/parks';

interface ParkCardProps {
  park: Park;
}

const ParkCard: React.FC<ParkCardProps> = ({ park }) => (
  <div className="bg-surface p-4 rounded-lg shadow-md hover:shadow-lg hover:shadow-primary/20 transition-shadow border border-gray-700">
    <h3 className="text-xl font-bold text-primary">{park.name}</h3>
    <div className="flex items-center gap-2 text-on-surface-variant my-2">
      <MapPin size={16} />
      <span>{park.address}</span>
    </div>
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={16} className={i < Math.round(park.rating) ? 'text-yellow-400 fill-current' : 'text-gray-600'} />
      ))}
      <span className="ml-2 text-sm text-on-surface-variant">{park.rating}</span>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      {park.amenities.map(amenity => (
        <span key={amenity} className="bg-gray-700 text-xs font-medium text-on-surface-variant px-2 py-1 rounded-full">{amenity}</span>
      ))}
    </div>
  </div>
);

export default ParkCard;`
                },
                {
                    path: '/src/components/MapView.tsx',
                    content: `import React from 'react';

const MapView = () => (
  <div className="bg-surface rounded-lg shadow-md h-full min-h-[600px] flex items-center justify-center border border-gray-700">
    <div className="text-center text-on-surface-variant">
      <p className="text-lg font-semibold">Map View</p>
      <p className="text-sm">(Interactive map component would render here)</p>
    </div>
  </div>
);

export default MapView;`
                },
            ]);
        }, 2500);
    });
};


export const generateProjectCode = async (plan: MvpPlan): Promise<ProjectFile[]> => {
    if (!ai) {
        return mockGenerateProjectCode(plan.ideaPrompt);
    }
    try {
        const planContext = `
            **Idea Prompt:** ${plan.ideaPrompt}
            **Market Analysis (Target Audience, Trends):** ${plan.marketAnalysis?.content || 'Not specified.'}
            **Tech Stack Analysis:** ${plan.techStackAnalysis?.content || 'Not specified. Default to a standard React/Vite/TS/Tailwind stack.'}
            **Business Analysis (Monetization, UVP):** ${plan.businessAnalysis?.content || 'Not specified.'}
            **Project Scope & Core Features:** ${plan.projectScope?.content || 'Not specified. Implement the core idea as you see fit.'}
            **Competitor Analysis (Strengths/Weaknesses to consider):** ${plan.competitorAnalysis?.content || 'Not specified.'}
        `;
        
        const prompt = `
        You are an expert full-stack architect. Generate a complete, runnable React application based on the provided MVP plan.

        **MVP Plan Details:**
        ${planContext}

        **Core Instructions:**
        - **Code Quality:** Production-grade, functional code. ALL code MUST be formatted as if run through Prettier with default settings. This is a strict requirement. Use modern React (hooks) and TypeScript. NO placeholders.
        - **UI/UX:** Create a stunning, modern dark-theme UI with Tailwind CSS.
        - **Backend:** Simulate all backend functionality with mock data.
        - **Tech Stack:** React 18+/Vite/TS, Tailwind CSS, \`react-router-dom\`, \`lucide-react\`.
        - **Project Structure & Dependencies (CRITICAL):**
            -   Organize files logically into folders (\`/src/pages\`, \`/src/components\`, etc.).
            -   **Must include a root \`index.html\` file** configured for a Vite React project.
            -   **Must include a complete \`package.json\`**. It must list ALL required dependencies (e.g., \`react\`, \`react-dom\`, \`lucide-react\`) and devDependencies (e.g., \`vite\`, \`typescript\`, \`tailwindcss\`) so that the project is runnable after just \`npm install\`.
            -   Include all other necessary root config files (\`vite.config.ts\`, \`tailwind.config.js\`, \`postcss.config.js\`, \`tsconfig.json\`, and \`tsconfig.node.json\`).
        - **Internal Validation (MANDATORY):** Before outputting the final JSON, you must internally review the entire generated project. You must act as a code reviewer and check for the following:
            -   **Syntax Errors:** Ensure all files have perfectly valid syntax (e.g., no missing brackets, commas, etc.).
            -   **TypeScript Errors:** Ensure all TypeScript code is type-correct (e.g., all types match, no implicit 'any' types where avoidable).
            -   **Import/Export Errors:** Ensure all imports are correct and all exported components are used correctly.
            -   **Dependency Mismatches:** Ensure every single library used in the code (e.g., 'lucide-react') is correctly listed with a valid version in \`package.json\`.
            -   The code MUST BE 100% runnable and error-free after an 'npm install'.
        - **Features:** Implement all core features from the plan. Include routing in \`App.tsx\`, navigation in \`Navbar.tsx\`, and simulated auth with \`AuthContext\`, \`LoginPage.tsx\`, \`SignupPage.tsx\`, and \`ProtectedRoute.tsx\`.

        **Output Format (MANDATORY):**
        Your response MUST be a single, valid JSON object with a single key "files".
        The value for "files" must be an array of objects. Each object must have "path" (string) and "content" (string).

        **CRITICAL: The "content" value must be a valid JSON string.** This means:
        - All double quotes (") inside the code must be escaped with a backslash (e.g., \`className=\\"App\\"\`).
        - All backslashes (\\) must be escaped (e.g., \`'C:\\\\Users\\\\Test'\`).
        - Newlines must be represented as \`\\n\`. Tabs as \`\\t\`.

        Example of a correctly formatted file object:
        {
          "path": "/src/App.tsx",
          "content": "import React from 'react';\\n\\nfunction App() {\\n  return (\\n    <div className=\\"App\\">\\n      <h1>Hello World</h1>\\n    </div>\\n  );\\n}\\n\\nexport default App;"
        }
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        files: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    path: { type: Type.STRING },
                                    content: { type: Type.STRING },
                                },
                                required: ['path', 'content'],
                            },
                        },
                    },
                    required: ['files'],
                }
            }
        });

        if (!response.text) {
            throw new Error("The AI service returned an empty response.");
        }

        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        const responseObject: { files: ProjectFile[] } = JSON.parse(jsonStr);
        
        // The AI model can sometimes incorrectly escape characters in the code,
        // particularly newlines (\\n) and tabs (\\t), which makes the code
        // hard to read. To ensure the generated code is well-structured and
        // user-friendly, we explicitly unescape these sequences to restore
        // proper formatting and indentation.
        const correctedFiles = responseObject.files.map(file => ({
            ...file,
            content: file.content.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
        }));
        
        return correctedFiles;

    } catch (error: any) {
        console.error("Error generating project code:", error);
        if (error instanceof SyntaxError) {
            throw new Error("The AI returned an invalid code format. Please try again.");
        }
        if (error.message) {
             const message = error.message.toLowerCase();
            if (message.includes("quota")) {
                throw new Error("API Quota Exceeded. You can no longer generate code. Please upgrade your subscription.");
            }
            if (message.includes("429") || message.includes("rate limit")) {
                 throw new Error("You've sent too many requests. Please wait a moment and try again (Rate Limit Exceeded).");
            }
            if (message.includes("safety policy")) {
                throw new Error("Your project description was blocked due to safety settings. Please adjust your idea and try again.");
            }
            if (message.includes("500") || message.includes("internal error") || message.includes("rpc failed")) {
                throw new Error("The AI service encountered an internal error while generating code. Please try again later.");
            }
        }
        throw new Error("An unexpected error occurred while generating the project code.");
    }
};

export const generateFixInstructions = async (files: ProjectFile[], error: string): Promise<string> => {
    // Mock fix for users without an API key
    if (!ai) {
        console.log(`[MOCK AI] Generating fix instructions for error: "${error}"`);
        let mockInstructions = "This is a mock response for fixing the code. In a real scenario, the AI would provide detailed steps here.";
        if (error.includes('lucide-react')) {
            mockInstructions = `
### Explanation
The error "Cannot find module 'lucide-react'" means a required package is not listed in your project's dependencies.

### Fix Steps
1.  **Open the file:** \`package.json\`
2.  **Add the dependency:** Inside the \`"dependencies"\` object, add the following line:
    \`\`\`json
    "lucide-react": "^0.378.0"
    \`\`\`
3.  After saving the file, the preview should automatically restart and install the new package.
            `;
        }
        return new Promise(resolve => setTimeout(() => resolve(mockInstructions), 1500));
    }

    // Real AI fix instructions
    try {
         const prompt = `
            You are an expert full-stack software engineer. Your task is to analyze the provided React application code and a user-provided error message, and then generate clear, step-by-step instructions on how to fix the bug.

            **Error Message To Fix:**
            ${error}

            **Full Project Code (as a JSON array of file objects):**
            ${JSON.stringify(files)}

            **Instructions for AI:**
            1.  Carefully read the error message to understand the problem. Common errors include missing dependencies in 'package.json', incorrect imports, or syntax errors.
            2.  Review all project files to find the source of the error.
            3.  Provide a concise explanation of what caused the error.
            4.  Give clear, markdown-formatted, step-by-step instructions for the user to fix the code manually in their editor. Be very specific about which file to open and what changes to make. For example:

                ### Explanation
                The error "Cannot find module 'lucide-react'" means a required package is not listed in your project's dependencies.

                ### Fix Steps
                1.  **Open the file:** \`package.json\`
                2.  **Add the dependency:** Inside the \`"dependencies"\` object, add the following line:
                    \`\`\`json
                    "lucide-react": "^0.378.0"
                    \`\`\`
                3.  After saving the file, the preview should automatically restart and install the new package.

            **Output Format (MANDATORY):**
            Your response MUST be a single, valid JSON object with a single key "instructions".
            The value for "instructions" must be a string containing the markdown-formatted fix steps.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        instructions: { type: Type.STRING },
                    },
                    required: ['instructions'],
                }
            }
        });
        
        if (!response.text) {
            throw new Error("The AI service returned an empty response.");
        }
        
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        const responseObject: { instructions: string } = JSON.parse(jsonStr);
        return responseObject.instructions;

    } catch (error: any) {
        console.error("Error generating fix instructions:", error);
         if (error instanceof SyntaxError) {
            throw new Error("The AI returned an invalid format while generating instructions.");
        }
        if (error.message) {
            const message = error.message.toLowerCase();
            if (message.includes("quota")) {
                throw new Error("API Quota Exceeded. Cannot generate fix instructions.");
            }
            if (message.includes("500") || message.includes("internal error") || message.includes("rpc failed")) {
                throw new Error("The AI service encountered an internal error while generating the fix.");
            }
        }
        throw new Error("An unexpected error occurred while generating fix instructions.");
    }
};

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMvpPlan } from '../contexts/MvpPlanContext';
import { generateProjectCode } from '../services/geminiService';
import type { MvpPlan, MvpPlanSection } from '../types';
import Alert from '../components/common/Alert';

const MvpPlanViewerPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, updateUser } = useAuth();
    const { getPlanById, updatePlan } = useMvpPlan();
    const navigate = useNavigate();
    const [plan, setPlan] = useState<MvpPlan | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [codeGenError, setCodeGenError] = useState<string | null>(null);

    const sections: MvpPlanSection[] = useMemo(() => {
        if (!plan) return [];
        const potentialSections = [
            plan.marketAnalysis,
            plan.techStackAnalysis,
            plan.businessAnalysis,
            plan.projectScope,
            plan.expenditureEstimation,
            plan.competitorAnalysis,
            plan.projectPreview,
        ];
        // Filter out any sections that might be missing from the data
        return potentialSections.filter((section): section is MvpPlanSection => !!section);
    }, [plan]);
    
    const isFinalStep = useMemo(() => currentPage === sections.length - 1 && sections.length > 0, [currentPage, sections]);

    useEffect(() => {
        if (id) {
            const foundPlan = getPlanById(id);
            if (foundPlan) {
                setPlan(foundPlan);
            } else {
                navigate('/dashboard');
            }
        }
    }, [id, getPlanById, navigate]);
    
    const handleGenerateCode = useCallback(async () => {
        if (!plan || plan.generatedCode || isGeneratingCode || !user) return;
        setIsGeneratingCode(true);
        setCodeGenError(null);
        try {
            const generatedCode = await generateProjectCode(plan);
            updatePlan(plan.id, { generatedCode });
            setPlan(prev => ({...prev!, generatedCode}));
            
            // Increment API calls for code generation
            updateUser({ apiCalls: (user.apiCalls || 0) + 1 });
        } catch (error: any) {
            console.error("Failed to generate project code:", error);
            setCodeGenError(error.message || "An unknown error occurred while generating the project code.");
        } finally {
            setIsGeneratingCode(false);
        }
    }, [plan, isGeneratingCode, updatePlan, user, updateUser]);
    
    useEffect(() => {
        // To prevent unhandled promise rejections and race conditions,
        // async operations in useEffect should be wrapped in a local async function.
        const triggerCodeGeneration = async () => {
            if (isFinalStep && plan && !plan.generatedCode) {
                // The actual generation logic is in a useCallback, which is correct.
                // handleGenerateCode has its own try/catch, so we don't need another one here.
                await handleGenerateCode();
            }
        };

        triggerCodeGeneration();
        
    }, [isFinalStep, plan, handleGenerateCode]);

    if (!plan) {
        return <div className="text-center py-10">Loading plan...</div>;
    }

    const currentSection = sections[currentPage];

    // Add a guard to handle cases where the plan data is incomplete
    if (!currentSection) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold mb-4">Plan Data Error</h2>
                <p className="text-on-surface-variant mb-6">This MVP plan appears to be missing its content. Please try generating a new plan.</p>
                <Link to="/dashboard" className="px-6 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const handleExport = () => {
        const title = `# MVP Plan: ${plan.ideaPrompt}\n\n`;
        const generatedDate = `Generated on: ${new Date(plan.createdAt).toLocaleString()}\n\n---\n\n`;

        const content = sections.map(section => {
            // Ensure content is a string before calling replace to prevent crashes on export.
            const sectionContent = typeof section.content === 'string' ? section.content : '';
            const cleanedContent = sectionContent.replace(/###|##|#|\*\*/g, '');
            return `## ${section.title}\n\n${cleanedContent}`;
        }).join('\n\n---\n\n');

        const fullText = title + generatedDate + content;

        const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mvp-plan-${plan.id}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderContent = (content: string) => {
        if (typeof content !== 'string') {
            return { __html: '<p class="text-on-surface-variant">No content available for this section.</p>' };
        }

        // To ensure the AI-generated analysis is well-structured and user-friendly,
        // this markdown parser is enhanced. It correctly handles paragraphs by splitting
        // them on double newlines and no longer converts single newlines to <br> tags,
        // which provides more natural text flow. It also preserves quote characters
        // for accuracy. This results in a cleaner, more readable presentation.
        const blocks = content.split(/\n\s*\n/);
        const html = blocks.map(block => {
            // Reusable formatter for inline elements like bold and links.
            const formatInline = (text: string) => {
                // Convert **text** to <strong class="text-on-surface">text</strong>
                let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-on-surface">$1</strong>');
                // Convert URLs to clickable links
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                return formattedText.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
            };

            // Handle Headings
            if (block.startsWith('### ')) return `<h3 class="text-on-surface font-semibold mt-4 mb-2">${formatInline(block.substring(4))}</h3>`;
            if (block.startsWith('## ')) return `<h2 class="text-xl font-bold text-on-surface mt-6 mb-3">${formatInline(block.substring(3))}</h2>`;
            if (block.startsWith('# ')) return `<h1 class="text-2xl font-bold text-on-surface mt-8 mb-4">${formatInline(block.substring(2))}</h1>`;
            
            // Handle Bullet Points
            if (block.match(/^\* .*/)) {
                const items = block.split('\n').map(item => {
                    if(item.startsWith('* ')) {
                        const itemContent = formatInline(item.substring(2));
                        return `<li class="ml-4 list-disc">${itemContent}</li>`;
                    }
                    return '';
                }).join('');
                return `<ul class="space-y-2 mb-4">${items}</ul>`;
            }

            // Handle Paragraphs
            return `<p class="mb-4 leading-relaxed">${formatInline(block)}</p>`;
        }).join('');
        return { __html: html };
    };

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <aside className="md:w-1/4">
                <div className="sticky top-24">
                    <h3 className="font-bold mb-4 text-on-surface">Plan Sections</h3>
                    <nav className="flex flex-col space-y-1">
                        {sections.map((section, index) => (
                            <button
                                key={section.title}
                                onClick={() => setCurrentPage(index)}
                                className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    currentPage === index ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                                }`}
                            >
                                {section.title}
                            </button>
                        ))}
                    </nav>

                    {isFinalStep && (
                        <div className="mt-8 bg-surface p-6 rounded-lg shadow-md">
                             {codeGenError && (
                                <div className="mb-4">
                                    <Alert type="error" title="Code Generation Failed" message={codeGenError} onClose={() => setCodeGenError(null)} />
                                </div>
                            )}
                            <div className="text-center">
                                {(isGeneratingCode || (!plan.generatedCode && !codeGenError)) ? (
                                    <>
                                        <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Generating Project...
                                        </h3>
                                        <p className="text-on-surface-variant text-sm">Please wait while we bring your idea to life.</p>
                                    </>
                                ) : plan.generatedCode ? (
                                    <>
                                        <h3 className="text-lg font-bold mb-2 text-secondary">Project Ready!</h3>
                                        <p className="text-on-surface-variant text-sm mb-4">Your code is generated. Preview your new project.</p>
                                        <Link 
                                            to={`/preview/${plan.id}`}
                                            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                                        >
                                            Preview Project &rarr;
                                        </Link>
                                    </>
                                ) : (
                                    !codeGenError && (
                                        <button 
                                            onClick={handleGenerateCode}
                                            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-500"
                                        >
                                            Retry Generation
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            <main className="flex-1">
                <header className="mb-6">
                    <Link to="/dashboard" className="text-sm text-primary hover:underline">&larr; Back to Workspace</Link>
                    <h1 className="text-3xl font-bold mt-2">MVP Plan <span className="text-primary"></span></h1>
                    <p className="text-sm text-on-surface-variant mt-1">Generated on {new Date(plan.createdAt).toLocaleString()}</p>
                </header>
                
                <section className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-on-surface">{currentSection.title}</h2>
                    <button onClick={handleExport} className="px-4 py-2 text-sm border border-gray-600 rounded-md hover:bg-gray-700 flex items-center gap-2 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export Plan
                    </button>
                </section>
                
                <div className="bg-surface p-8 rounded-lg shadow-lg">
                    <div className="prose-sm max-w-none text-on-surface-variant min-h-[200px]"
                         dangerouslySetInnerHTML={renderContent(currentSection.content)}
                    ></div>
                </div>
            </main>
        </div>
    );
};

export default MvpPlanViewerPage;
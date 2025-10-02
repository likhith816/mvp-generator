
import React from 'react';
import { Link } from 'react-router-dom';

const FeatureCard: React.FC<{ title: string; description: string; icon: JSX.Element }> = ({ title, description, icon }) => (
  <div className="bg-surface p-6 rounded-lg shadow-md hover:shadow-xl hover:shadow-primary/10 transition-shadow">
    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-on-surface mb-2">{title}</h3>
    <p className="text-on-surface-variant">{description}</p>
  </div>
);

const LandingPage: React.FC = () => {
  return (
    <div className="text-center">
      <section className="py-20">
        <h1 className="text-4xl md:text-6xl font-extrabold text-on-surface mb-4 tracking-tight">
          Turn Your Idea into an <span className="text-primary">MVP</span> Instantly
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-on-surface-variant mb-8">
          Stop wondering and start building. Our AI-powered platform analyzes your idea and generates a comprehensive MVP plan, from market analysis to tech stack, in minutes.
        </p>
        <div className="space-x-4">
          <Link to="/signup" className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-primary/90 transition-transform transform hover:scale-105">
            Get Started for Free
          </Link>
          <Link to="/login" className="inline-block bg-surface text-primary font-bold py-3 px-8 rounded-lg hover:bg-gray-700 border border-gray-600 transition-transform transform hover:scale-105">
            Login
          </Link>
        </div>
      </section>

      <section className="py-20 bg-gray-900 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-on-surface mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard 
            icon={<IconClipboardList />} 
            title="1. Submit Your Idea" 
            description="Provide a simple prompt describing your business or app idea. The more detail, the better!" 
          />
          <FeatureCard 
            icon={<IconSparkles />} 
            title="2. AI-Powered Analysis" 
            description="Our AI gets to work, generating a detailed plan covering market, tech, business scope, and more." 
          />
          <FeatureCard 
            icon={<IconDocumentDownload />} 
            title="3. Review & Export" 
            description="Explore your generated MVP plan page-by-page, and export it to start building." 
          />
        </div>
      </section>
    </div>
  );
};

// Icons (Heroicons)
const IconClipboardList = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const IconSparkles = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const IconDocumentDownload = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

export default LandingPage;
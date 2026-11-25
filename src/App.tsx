import React from 'react';
import { TutorProvider } from './context/TutorContext';
import { Header } from './components/Header';
import { HeroTerminal } from './components/HeroTerminal';
import { TechStack } from './components/TechStack';
import { ServicesGrid } from './components/ServicesGrid';
import { CasesSection } from './components/CasesSection';
import { RoadmapStages } from './components/RoadmapStages';
import { TutorWorkspace } from './components/TutorWorkspace';
import { PricingSection } from './components/PricingSection';
import { ContactSection } from './components/ContactSection';
import { QuizModal } from './components/QuizModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';

export const App: React.FC = () => {
  return (
    <TutorProvider>
      <div className="min-h-screen">
        <Header />
        <main className="space-y-6 sm:space-y-8">
          <HeroTerminal />
          <ServicesGrid />
          <CasesSection />
          <TechStack />
          <RoadmapStages />
          <TutorWorkspace />
          <PricingSection />
        </main>
        <ContactSection />
        <QuizModal />
        <AiAssistantDrawer />
      </div>
    </TutorProvider>
  );
};

export default App;

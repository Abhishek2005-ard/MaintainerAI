import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ProblemStats from '../components/ProblemStats';
import WorkflowSection from '../components/WorkflowSection';
import FeaturesGrid from '../components/FeaturesGrid';
import DashboardPreview from '../components/DashboardPreview';
import Testimonials from '../components/Testimonials';
import CtaBanner from '../components/CtaBanner';
import Footer from '../components/Footer';

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ProblemStats />
        <WorkflowSection />
        <FeaturesGrid />
        <DashboardPreview />
        <Testimonials />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;

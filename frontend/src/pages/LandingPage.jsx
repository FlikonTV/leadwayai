import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Clock, Shield, Calendar, ArrowRight, CheckCircle } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";
const TRAINING_DATE = new Date("2026-04-08T09:00:00");

const LandingPage = () => {
  const navigate = useNavigate();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const diff = TRAINING_DATE - now;
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      }
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStartAssessment = () => {
    setShowEmailDialog(true);
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailSubmit = () => {
    if (!email.trim()) {
      setEmailError("Please enter your email address");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    localStorage.setItem("leadway_email", email);
    navigate("/assessment");
  };

  const CountdownUnit = ({ value, label }) => (
    <div className="countdown-box rounded-lg px-4 py-3 md:px-6 md:py-4 text-center">
      <div className="text-2xl md:text-4xl font-bold text-gold font-heading">{value.toString().padStart(2, '0')}</div>
      <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-navy hero-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 glass bg-navy/85 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={LOGO_URL} 
                alt="Leadway Logo" 
                className="h-10 md:h-12 w-auto"
                data-testid="leadway-logo"
              />
              <span className="text-white font-heading text-lg md:text-xl font-medium hidden sm:block">Leadway Group</span>
            </div>
            <a 
              href="/admin" 
              className="text-gray-400 hover:text-gold text-sm transition-colors"
              data-testid="admin-link"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6">
              <Calendar className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm font-medium">April 8-10, 2026</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-medium text-white leading-tight mb-6">
              AI Readiness &<br />
              <span className="gradient-text">Opportunity Scan</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-xl">
              Help us understand your current AI familiarity and identify opportunities to transform your workflows. 
              Your responses will shape our upcoming in-person AI training.
            </p>

            {/* Info Cards */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              <div className="flex items-start gap-3 bg-white/5 rounded-lg p-4">
                <Clock className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-medium">15-20 minutes</div>
                  <div className="text-gray-400 text-sm">Estimated completion time</div>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/5 rounded-lg p-4">
                <Shield className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-medium">Confidential</div>
                  <div className="text-gray-400 text-sm">Your responses are secure</div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleStartAssessment}
              className="btn-gradient text-white font-semibold px-8 py-6 text-lg rounded-lg shadow-lg shadow-gold/20 animate-pulse-gold"
              data-testid="start-assessment-btn"
            >
              Start Assessment
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <p className="text-gray-500 text-sm mt-4 italic">
              This is not a test. There are no right or wrong answers.
            </p>
          </div>

          {/* Right Column - Countdown & Visual */}
          <div className="lg:pl-8">
            {/* Countdown Timer */}
            <div className="bg-white/5 rounded-2xl p-6 md:p-8 border border-white/10 mb-8">
              <h2 className="text-white font-heading text-xl md:text-2xl font-medium mb-2 text-center">
                Training Begins In
              </h2>
              <p className="text-gray-400 text-sm text-center mb-6">April 8-10, 2026 | In-Person Event</p>
              
              <div className="grid grid-cols-4 gap-2 md:gap-4" data-testid="countdown-timer">
                <CountdownUnit value={countdown.days} label="Days" />
                <CountdownUnit value={countdown.hours} label="Hours" />
                <CountdownUnit value={countdown.minutes} label="Mins" />
                <CountdownUnit value={countdown.seconds} label="Secs" />
              </div>
            </div>

            {/* What to Expect */}
            <div className="bg-white/5 rounded-2xl p-6 md:p-8 border border-white/10">
              <h3 className="text-white font-heading text-lg md:text-xl font-medium mb-4">What to Expect</h3>
              <ul className="space-y-3">
                {[
                  "Share your current AI experience and familiarity",
                  "Identify workflow pain points and opportunities",
                  "Explore governance and responsible AI practices",
                  "Define your capstone opportunity area"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-gray-900">Before You Begin</DialogTitle>
            <DialogDescription className="text-gray-600">
              Enter your email to save your progress. You can return anytime to complete the assessment.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Label htmlFor="email" className="text-gray-700 font-medium">Work Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@leadway.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              className="mt-2 border-gray-300 focus:border-gold focus:ring-gold"
              data-testid="email-input"
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1" data-testid="email-error">{emailError}</p>
            )}
            <Button 
              onClick={handleEmailSubmit}
              className="w-full mt-4 btn-gradient text-white font-semibold py-3"
              data-testid="continue-btn"
            >
              Continue to Assessment
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-gray-500 text-xs text-center mt-3">
              Your email is used only to save your progress and will not be shared.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;

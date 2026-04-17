import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Clock, Shield, Calendar, ArrowRight, CheckCircle, Sparkles, Zap } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";
const TRAINING_DATE = new Date("2026-04-13T09:00:00");

const LandingPage = () => {
  const navigate = useNavigate();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hoveredFeature, setHoveredFeature] = useState(null);

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
    <div className="group relative bg-white/5 border border-gold/30 rounded-lg px-3 py-2 md:px-4 md:py-3 text-center hover:bg-gold/10 hover:border-gold/50 transition-all duration-300 hover:scale-105 cursor-default">
      <div className="text-xl md:text-3xl font-bold text-white font-heading transition-colors group-hover:text-gold">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider group-hover:text-gray-300 transition-colors">{label}</div>
      <div className="absolute inset-0 bg-gold/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );

  const features = [
    { icon: Sparkles, text: "Share your AI experience", color: "text-blue-400" },
    { icon: Zap, text: "Identify workflow opportunities", color: "text-amber-400" },
    { icon: Shield, text: "Explore responsible AI practices", color: "text-green-400" },
    { icon: CheckCircle, text: "Define your capstone project", color: "text-purple-400" }
  ];

  return (
    <div className="min-h-screen bg-navy hero-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 glass bg-navy/90 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Leadway Logo" className="h-8 w-auto" data-testid="leadway-logo" />
              <span className="text-white font-heading text-base font-medium hidden sm:block">Leadway Group</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/post-evaluation" className="text-gray-300 hover:text-gold text-sm transition-all hover:scale-105" data-testid="post-eval-link">
                Post-Training Evaluation
              </a>
              <a href="/admin" className="text-gray-400 hover:text-gold text-sm transition-all hover:scale-105" data-testid="admin-link">
                Admin
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left Column - Content (3 cols) */}
          <div className="lg:col-span-3 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-3 py-1.5 mb-4 hover:bg-gold/20 transition-colors cursor-default">
              <Calendar className="w-3.5 h-3.5 text-gold" />
              <span className="text-gold text-xs font-medium">April 13-15, 2026</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-medium text-white leading-tight mb-4">
              AI Readiness &<br />
              <span className="gradient-text">Opportunity Scan</span>
            </h1>
            
            <p className="text-base text-gray-300 mb-6 leading-relaxed max-w-lg">
              Help us understand your AI familiarity and identify opportunities to transform your workflows. 
              Your responses will shape our in-person training.
            </p>

            {/* Compact Info Row */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors">
                <Clock className="w-4 h-4 text-gold" />
                <span className="text-white text-sm">15-20 min</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors">
                <Shield className="w-4 h-4 text-gold" />
                <span className="text-white text-sm">Confidential</span>
              </div>
            </div>

            <Button 
              onClick={handleStartAssessment}
              className="btn-gradient text-white font-semibold px-6 py-5 text-base rounded-lg shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              data-testid="start-assessment-btn"
            >
              Start Assessment
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            <p className="text-gray-500 text-xs mt-3 italic">
              This is not a test. There are no right or wrong answers.
            </p>
          </div>

          {/* Right Column - Countdown & Features (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Countdown Timer */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors">
              <h2 className="text-white font-heading text-lg font-medium mb-1 text-center">
                Training Begins In
              </h2>
              <p className="text-gray-300 text-xs text-center mb-4">April 13-15, 2026</p>
              
              <div className="grid grid-cols-4 gap-2" data-testid="countdown-timer">
                <CountdownUnit value={countdown.days} label="Days" />
                <CountdownUnit value={countdown.hours} label="Hrs" />
                <CountdownUnit value={countdown.minutes} label="Min" />
                <CountdownUnit value={countdown.seconds} label="Sec" />
              </div>
            </div>

            {/* What to Expect - Interactive List */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors">
              <h3 className="text-white font-heading text-base font-medium mb-3">What to Expect</h3>
              <ul className="space-y-2">
                {features.map((item, index) => (
                  <li 
                    key={index} 
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-default transition-all duration-200 ${
                      hoveredFeature === index ? 'bg-white/10 translate-x-1' : 'hover:bg-white/5'
                    }`}
                    onMouseEnter={() => setHoveredFeature(index)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    <item.icon className={`w-4 h-4 ${item.color} transition-transform ${hoveredFeature === index ? 'scale-110' : ''}`} />
                    <span className="text-gray-300 text-sm">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Progress Steps Preview */}
            <div className="bg-gradient-to-r from-gold/10 to-sunset-orange/10 rounded-xl p-4 border border-gold/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gold text-xs font-medium">8 Quick Sections</span>
                <span className="text-gray-400 text-xs">~2 min each</span>
              </div>
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div 
                    key={i} 
                    className="h-1.5 flex-1 rounded-full bg-gold/30 hover:bg-gold transition-colors cursor-pointer"
                    title={`Section ${i}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="bg-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-gray-900">Before You Begin</DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Enter your email to save progress and return anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3">
            <Label htmlFor="email" className="text-gray-700 text-sm font-medium">Work Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@leadway.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              className="mt-1.5 border-gray-300 focus:border-gold focus:ring-gold"
              data-testid="email-input"
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
            />
            {emailError && (
              <p className="text-red-500 text-xs mt-1" data-testid="email-error">{emailError}</p>
            )}
            <Button 
              onClick={handleEmailSubmit}
              className="w-full mt-3 btn-gradient text-white font-semibold py-2.5 hover:scale-[1.01] active:scale-[0.99] transition-transform"
              data-testid="continue-btn"
            >
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-gray-400 text-[10px] text-center mt-2">
              Your email is only used to save progress.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;

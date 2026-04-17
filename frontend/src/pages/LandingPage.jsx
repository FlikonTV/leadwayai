import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { ArrowRight, CheckCircle, ExternalLink, Camera, Users, Lock, ClipboardCheck, FolderOpen } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";
const CERT_PHOTO = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/qhq9e7cb_image.png";
const CAIP_BADGE = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/g7a194uk_Newbadge-removebg-preview.png";

const GALLERY_LINKS = [
  { day: "Day 1", label: "Strategy & Claude TABS-D", url: "https://drive.google.com/drive/folders/1AMu_2-_DQStTnEf0jB2lW1ZmLiQNHJ6b", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-400/30", accent: "text-blue-400" },
  { day: "Day 2", label: "GPTBots, Gemini & Voice AI", url: "https://drive.google.com/drive/folders/1n5gkCBUAoGNV3N45qoF-HE-NOLsEuAXX", color: "from-teal/20 to-teal/10", border: "border-teal/30", accent: "text-teal" },
  { day: "Day 3", label: "Workflows & Capstone", url: "https://drive.google.com/drive/folders/1x0cENpniOHCxvsqwRC4oC5sKFY_F9AVC", color: "from-gold/20 to-gold/10", border: "border-gold/30", accent: "text-gold" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleEmailSubmit = () => {
    if (!email.trim()) { setEmailError("Please enter your email address"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Please enter a valid email address"); return; }
    setEmailError("");
    localStorage.setItem("leadway_email", email);
    navigate("/assessment");
  };

  return (
    <div className="min-h-screen bg-navy">
      {/* Header */}
      <header className="sticky top-0 z-50 glass bg-navy/90 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Leadway Logo" className="h-8 w-auto" data-testid="leadway-logo" />
            <span className="text-white font-heading text-base font-medium hidden sm:block">Leadway Group</span>
          </div>
          <a href="/admin" className="text-gray-400 hover:text-gold text-sm transition-all" data-testid="admin-link">Admin</a>
        </div>
      </header>

      {/* Hero with certification photo background */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={CERT_PHOTO} alt="Cohort 1 Graduates" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/75 to-navy" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left — Content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Completion badge */}
              <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-400/30 rounded-full px-4 py-1.5 mb-5" data-testid="training-complete-badge">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm font-medium">Training Complete — April 13-15, 2026</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-medium text-white leading-tight mb-3">
                AI-Powered Enterprise<br />
                <span className="gradient-text">Excellence Programme</span>
              </h1>
              <p className="text-base text-gray-300 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Cohort 1 has graduated. Now tell us — how far have you travelled?
                Complete your post-training evaluation to record your journey.
              </p>

              {/* Primary CTA — Post-Training Evaluation */}
              <Button
                onClick={() => navigate("/post-evaluation")}
                className="btn-gradient text-white font-semibold px-8 py-5 text-base rounded-lg shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                data-testid="post-eval-hero-btn"
              >
                <ClipboardCheck className="mr-2 w-5 h-5" />
                Post-Training Evaluation
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>

              {/* Secondary — Pre-Assessment (disabled) */}
              <div className="mt-4 flex items-center justify-center lg:justify-start gap-2">
                <Button
                  disabled
                  variant="outline"
                  className="border-gray-600 text-gray-500 cursor-not-allowed opacity-50 px-5 py-2 text-sm"
                  data-testid="start-assessment-btn"
                >
                  <Lock className="mr-2 w-3.5 h-3.5" />
                  Pre-Training Assessment
                </Button>
                <span className="text-gray-500 text-xs">Closed</span>
              </div>
            </div>

            {/* Right — CAI-P Badge */}
            <div className="shrink-0 relative">
              <div className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 relative drop-shadow-[0_0_30px_rgba(212,175,55,0.25)]">
                <img
                  src={CAIP_BADGE}
                  alt="Certified Artificial Intelligence Professional"
                  className="w-full h-full object-contain animate-fade-in"
                  data-testid="caip-badge"
                />
              </div>
              <p className="text-center text-gray-400 text-[10px] mt-2 tracking-wider uppercase">Cohort 1 Certification</p>
            </div>
          </div>
        </div>
      </section>

      {/* Training Gallery */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <h2 className="text-white font-heading text-xl md:text-2xl font-medium mb-1">
            Training Session <span className="text-gold">Gallery</span>
          </h2>
          <p className="text-gray-400 text-sm">Relive the moments from each day of the programme</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GALLERY_LINKS.map((item) => (
            <div
              key={item.day}
              onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
              className={`group relative bg-gradient-to-br ${item.color} border ${item.border} rounded-xl p-5 hover:scale-[1.02] transition-all duration-300 cursor-pointer`}
              data-testid={`gallery-${item.day.replace(' ', '-').toLowerCase()}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-heading text-lg font-medium ${item.accent}`}>{item.day}</span>
                <Camera className={`w-5 h-5 ${item.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />
              </div>
              <p className="text-gray-300 text-sm mb-3">{item.label}</p>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs group-hover:text-white transition-colors">
                <FolderOpen className="w-3.5 h-3.5" />
                <span>View Photos</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Alumni Interest */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-navy border border-gold/20 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-gold" />
              <h3 className="text-white font-heading text-lg font-medium">Join the Alumni Network</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Stay connected with fellow Cohort 1 graduates. Get access to the alumni platform for continued learning,
              collaboration, and exclusive follow-up sessions. Indicate your interest in the post-training evaluation.
            </p>
          </div>
          <Button
            onClick={() => navigate("/post-evaluation")}
            variant="outline"
            className="border-gold/50 text-gold hover:bg-gold hover:text-navy shrink-0 px-5 transition-all"
            data-testid="alumni-cta"
          >
            Complete Evaluation
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Email Dialog (for pre-assessment, kept for backward compatibility) */}
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
              id="email" type="email" placeholder="you@leadway.com" value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              className="mt-1.5 border-gray-300 focus:border-gold focus:ring-gold"
              data-testid="email-input"
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
            />
            {emailError && <p className="text-red-500 text-xs mt-1" data-testid="email-error">{emailError}</p>}
            <Button
              onClick={handleEmailSubmit}
              className="w-full mt-3 btn-gradient text-white font-semibold py-2.5"
              data-testid="continue-btn"
            >
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { ArrowRight, CheckCircle, ExternalLink, Camera, Users, Lock, ClipboardCheck, MapPin, Calendar } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";
const CERT_PHOTO = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/qhq9e7cb_image.png";
const CAIP_BADGE = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/g7a194uk_Newbadge-removebg-preview.png";

const COHORTS = {
  cohort_1_lagos: {
    label: "Cohort 1",
    city: "Lagos",
    dates: "April 13-15, 2026",
    status: "completed",
    trainingDate: new Date("2026-04-13T09:00:00"),
  },
  cohort_2_abuja: {
    label: "Cohort 2",
    city: "Abuja",
    dates: "May 15-18, 2026",
    status: "upcoming",
    trainingDate: new Date("2026-05-15T09:00:00"),
  },
};

const GALLERY_LINKS = [
  { day: "Day 1", label: "Strategy & Claude TABS-D", url: "https://drive.google.com/drive/folders/1AMu_2-_DQStTnEf0jB2lW1ZmLiQNHJ6b", accent: "text-blue-400" },
  { day: "Day 2", label: "GPTBots, Gemini & Voice AI", url: "https://drive.google.com/drive/folders/1n5gkCBUAoGNV3N45qoF-HE-NOLsEuAXX", accent: "text-teal" },
  { day: "Day 3", label: "Workflows & Capstone", url: "https://drive.google.com/drive/folders/1x0cENpniOHCxvsqwRC4oC5sKFY_F9AVC", accent: "text-gold" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeCohort, setActiveCohort] = useState("cohort_2_abuja");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const cohort = COHORTS[activeCohort];

  const updateCountdown = useCallback(() => {
    const now = new Date();
    const diff = COHORTS.cohort_2_abuja.trainingDate - now;
    if (diff <= 0) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    setCountdown({
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    });
  }, []);

  useEffect(() => {
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [updateCountdown]);

  const handleEmailSubmit = () => {
    if (!email.trim()) { setEmailError("Please enter your email address"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Please enter a valid email address"); return; }
    setEmailError("");
    localStorage.setItem("leadway_email", email);
    localStorage.setItem("leadway_cohort", activeCohort);
    navigate("/assessment");
  };

  const isCompleted = cohort.status === "completed";

  return (
    <div className="min-h-screen bg-navy">
      {/* Header */}
      <header className="sticky top-0 z-50 glass bg-navy/90 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Leadway Logo" className="h-7 w-auto" data-testid="leadway-logo" />
            <span className="text-white font-heading text-sm font-medium hidden sm:block">Leadway Group</span>
          </div>
          <a href="/admin" className="text-gray-400 hover:text-gold text-xs transition-all" data-testid="admin-link">Admin</a>
        </div>
      </header>

      {/* Cohort Selector */}
      <div className="bg-navy/50 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
          {Object.entries(COHORTS).map(([key, c]) => (
            <button key={key} onClick={() => setActiveCohort(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCohort === key
                  ? 'bg-gold text-navy shadow-md'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
              data-testid={`cohort-tab-${key}`}
            >
              <MapPin className="w-3 h-3" />
              {c.label} — {c.city}
              {c.status === "completed" && <CheckCircle className="w-3 h-3 ml-0.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={CERT_PHOTO} alt="Programme" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/75 to-navy" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-10">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
            <div className="flex-1 text-center lg:text-left">
              {/* Status Badge */}
              {isCompleted ? (
                <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-400/30 rounded-full px-3 py-1 mb-3" data-testid="training-complete-badge">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-300 text-xs font-medium">Training Complete — {cohort.dates}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/30 rounded-full px-3 py-1 mb-3" data-testid="upcoming-badge">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  <span className="text-gold text-xs font-medium">{cohort.city} Edition — {cohort.dates}</span>
                </div>
              )}

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-medium text-white leading-tight mb-2">
                AI-Powered Enterprise<br />
                <span className="gradient-text">Excellence Programme</span>
              </h1>

              {isCompleted ? (
                <p className="text-sm text-gray-300 mb-5 leading-relaxed max-w-md mx-auto lg:mx-0">
                  Cohort 1 has graduated. Now tell us — how far have you travelled?
                  Complete your post-training evaluation to record your journey.
                </p>
              ) : (
                <p className="text-sm text-gray-300 mb-5 leading-relaxed max-w-md mx-auto lg:mx-0">
                  The {cohort.city} cohort is coming. Complete your pre-training
                  assessment so we can tailor the programme to your needs.
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                {isCompleted ? (
                  <>
                    <Button onClick={() => { localStorage.setItem("leadway_cohort", activeCohort); navigate("/post-evaluation"); }}
                      className="btn-gradient text-white font-semibold px-6 py-4 text-sm rounded-lg shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      data-testid="post-eval-hero-btn">
                      <ClipboardCheck className="mr-2 w-4 h-4" /> Post-Training Evaluation <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                    <Button disabled variant="outline" className="border-gray-600 text-gray-500 cursor-not-allowed opacity-50 px-4 py-2 text-xs" data-testid="start-assessment-btn-disabled">
                      <Lock className="mr-1.5 w-3 h-3" /> Pre-Training Assessment
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setShowEmailDialog(true)}
                    className="btn-gradient text-white font-semibold px-6 py-4 text-sm rounded-lg shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    data-testid="start-assessment-btn">
                    Start Pre-Training Assessment <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Right — Badge or Countdown */}
            <div className="shrink-0 text-center">
              {isCompleted ? (
                <div>
                  <div className="w-36 h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 drop-shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                    <img src={CAIP_BADGE} alt="CAI-P Certificate" className="w-full h-full object-contain animate-fade-in" data-testid="caip-badge" />
                  </div>
                  <p className="text-gray-400 text-[9px] mt-1 tracking-wider uppercase">Cohort 1 Certification</p>
                </div>
              ) : (
                <div data-testid="countdown-timer">
                  <p className="text-gold text-[10px] font-medium tracking-wider uppercase mb-2">Training Begins In</p>
                  <div className="flex gap-2.5">
                    {[
                      { val: countdown.days, label: "Days" },
                      { val: countdown.hours, label: "Hrs" },
                      { val: countdown.minutes, label: "Min" },
                      { val: countdown.seconds, label: "Sec" },
                    ].map((unit) => (
                      <div key={unit.label} className="bg-white/5 backdrop-blur border border-white/10 rounded-lg px-3 py-2 min-w-[52px]">
                        <div className="text-2xl font-heading font-bold text-white">{String(unit.val).padStart(2, '0')}</div>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wide">{unit.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-500 text-[10px] mt-2">{cohort.city} — {cohort.dates}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cohort-specific content below hero */}
      {isCompleted ? (
        <>
          {/* Training Gallery (Cohort 1) */}
          <section className="max-w-6xl mx-auto px-4 pt-4 pb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-heading text-base md:text-lg font-medium">
                Training Session <span className="text-gold">Gallery</span>
              </h2>
              <span className="text-gray-500 text-xs hidden sm:block">Click to view photos</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {GALLERY_LINKS.map((item) => (
                <div key={item.day} onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                  className="group bg-white/5 border border-white/10 rounded-lg px-4 py-3 hover:scale-[1.02] transition-all duration-300 cursor-pointer flex items-center gap-3"
                  data-testid={`gallery-${item.day.replace(' ', '-').toLowerCase()}`}>
                  <Camera className={`w-5 h-5 ${item.accent} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <span className={`font-heading text-sm font-medium ${item.accent}`}>{item.day}</span>
                    <span className="text-gray-400 text-xs ml-2">{item.label}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-white shrink-0 transition-colors" />
                </div>
              ))}
            </div>
          </section>

          {/* Alumni */}
          <section className="max-w-6xl mx-auto px-4 pb-6">
            <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-navy border border-gold/20 rounded-lg px-5 py-4 flex flex-col sm:flex-row items-center gap-4">
              <Users className="w-5 h-5 text-gold shrink-0" />
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-white font-heading text-sm font-medium">Join the Alumni Network</h3>
                <p className="text-gray-400 text-xs leading-relaxed">Stay connected with Cohort 1 graduates. Indicate your interest in the post-training evaluation.</p>
              </div>
              <Button onClick={() => { localStorage.setItem("leadway_cohort", activeCohort); navigate("/post-evaluation"); }} variant="outline"
                className="border-gold/50 text-gold hover:bg-gold hover:text-navy shrink-0 px-4 h-8 text-xs transition-all" data-testid="alumni-cta">
                Complete Evaluation <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Button>
            </div>
          </section>
        </>
      ) : (
        /* Cohort 2 — Abuja Edition info */
        <section className="max-w-6xl mx-auto px-4 pt-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: MapPin, title: "Location", value: "Abuja, Nigeria", sub: "Venue TBA" },
              { icon: Calendar, title: "Dates", value: "May 15-18, 2026", sub: "3 intensive days + capstone" },
              { icon: Users, title: "Format", value: "Hands-on Workshop", sub: "AI tools, agents & workflows" },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-gold/10 rounded-lg flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{item.value}</p>
                  <p className="text-gray-500 text-[10px]">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Email Dialog for Pre-Assessment */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="bg-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-gray-900">Pre-Training Assessment</DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              {COHORTS[activeCohort].city} Edition — Enter your email to save progress and return anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3">
            <Label htmlFor="email" className="text-gray-700 text-sm font-medium">Work Email</Label>
            <Input id="email" type="email" placeholder="you@leadway.com" value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              className="mt-1.5 border-gray-300 focus:border-gold focus:ring-gold"
              data-testid="email-input"
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()} />
            {emailError && <p className="text-red-500 text-xs mt-1" data-testid="email-error">{emailError}</p>}
            <Button onClick={handleEmailSubmit}
              className="w-full mt-3 btn-gradient text-white font-semibold py-2.5"
              data-testid="continue-btn">
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;

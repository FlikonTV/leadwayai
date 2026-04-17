import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Home, ExternalLink } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";

const PostEvalThankYou = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy hero-pattern flex flex-col">
      <header className="glass bg-navy/90 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <img src={LOGO_URL} alt="Leadway" className="h-8 w-auto" />
          <span className="text-white font-heading text-base font-medium">Leadway Group</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="bg-white shadow-xl border-0 max-w-lg w-full animate-fade-in" data-testid="post-eval-thankyou-card">
          <CardContent className="p-6 md:p-8 text-center">
            {/* Gold checkmark */}
            <div className="w-16 h-16 bg-gradient-to-br from-sunset-orange to-gold rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gold/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="font-heading text-2xl md:text-3xl font-medium text-gray-900 mb-1">
              The Testimony Is{" "}
              <span className="italic text-gold">Forming.</span>
            </h1>

            <p className="text-gray-600 text-sm mb-4 max-w-sm mx-auto leading-relaxed">
              Your evaluation has been submitted. Your 30-day commitments have been recorded.
              We will hold you to them at the Vanguard Check-In on <strong>15 May 2026</strong>.
            </p>

            {/* Quote Block */}
            <div className="bg-[#0D2137] rounded-xl p-5 mb-6 text-left relative overflow-hidden">
              <div className="absolute top-2 left-3 text-gold/20 text-5xl font-heading leading-none">&ldquo;</div>
              <blockquote className="relative z-10">
                <p className="text-gold font-heading text-lg md:text-xl italic leading-relaxed">
                  "When you hear from us, it shall be testimony."
                </p>
                <footer className="mt-3 text-gray-400 text-xs">
                  — Cohort 1 participant &middot; Day 3 &middot; Lagos, April 2026
                </footer>
              </blockquote>
            </div>

            {/* Footer */}
            <div className="text-gray-400 text-xs mb-5 space-y-1">
              <p className="font-medium text-gray-500">
                Cihan Digital Academy &times; Leadway Group
              </p>
              <a href="https://cihandigitalacademy.com" target="_blank" rel="noopener noreferrer"
                className="text-gold hover:underline inline-flex items-center gap-1">
                cihandigitalacademy.com <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <Button onClick={() => navigate("/")} variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 text-sm"
              data-testid="post-eval-return-home">
              <Home className="w-4 h-4 mr-2" /> Return Home
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PostEvalThankYou;

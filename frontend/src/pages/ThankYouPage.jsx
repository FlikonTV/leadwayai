import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { CheckCircle, Calendar, Users, ArrowRight, Home, Sparkles } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";

const ThankYouPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy hero-pattern flex flex-col">
      {/* Header */}
      <header className="glass bg-navy/90 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <img src={LOGO_URL} alt="Leadway" className="h-8 w-auto" />
          <span className="text-white font-heading text-base font-medium">Leadway Group</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="bg-white shadow-xl border-0 max-w-lg w-full animate-fade-in">
          <CardContent className="p-6 md:p-8 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-sunset-orange to-gold rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold/30 animate-bounce">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>

            <h1 className="font-heading text-2xl md:text-3xl font-medium text-gray-900 mb-2">
              Assessment Complete!
            </h1>
            
            <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
              Thank you for completing the AI Readiness Scan. Your responses will help tailor the training experience.
            </p>

            {/* Training Info */}
            <div className="bg-navy rounded-xl p-4 mb-6 text-left">
              <h2 className="text-gold font-heading text-base font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> What's Next?
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">In-Person Training</h3>
                    <p className="text-gray-400 text-xs">April 13-15, 2026</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">Capstone Project</h3>
                    <p className="text-gray-400 text-xs">Work on a real AI implementation</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reminders */}
            <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left">
              <h3 className="text-gray-900 font-medium text-xs mb-2">Before the Training</h3>
              <ul className="text-gray-600 text-xs space-y-1.5">
                {["Watch for pre-training materials", "Refine your capstone idea", "Bring real challenges from work"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                    <ArrowRight className="w-3 h-3 text-gold" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
              data-testid="return-home-btn"
            >
              <Home className="w-4 h-4 mr-2" /> Return Home
            </Button>

            <p className="text-gray-400 text-[10px] mt-4">
              Questions? <span className="text-gold">training@leadway.com</span>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ThankYouPage;

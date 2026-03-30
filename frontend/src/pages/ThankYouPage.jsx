import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { CheckCircle, Calendar, Users, ArrowRight, Home } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";

const ThankYouPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy hero-pattern flex flex-col">
      {/* Header */}
      <header className="glass bg-navy/85 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Leadway Logo" className="h-10 w-auto" />
            <span className="text-white font-heading text-lg md:text-xl font-medium">Leadway Group</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="bg-white shadow-[0_8px_32px_rgba(0,0,0,0.15)] border-0 max-w-2xl w-full animate-fade-in">
          <CardContent className="p-8 md:p-12 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-sunset-orange to-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gold/20">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h1 className="font-heading text-3xl md:text-4xl font-medium text-gray-900 mb-4">
              Assessment Complete!
            </h1>
            
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Thank you for completing the AI Readiness & Opportunity Scan. 
              Your responses will help us tailor the training experience for maximum impact.
            </p>

            {/* Training Info Card */}
            <div className="bg-navy rounded-xl p-6 mb-8 text-left">
              <h2 className="text-gold font-heading text-xl font-medium mb-4">What's Next?</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">In-Person Training</h3>
                    <p className="text-gray-400 text-sm">April 8-10, 2026</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Join us for three days of hands-on AI learning and collaboration.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Capstone Project</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Based on your responses, you'll work on a real AI implementation 
                      project relevant to your role.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Reminders */}
            <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
              <h3 className="text-gray-900 font-medium mb-2">Before the Training</h3>
              <ul className="text-gray-600 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <span>Watch for pre-training materials in your email</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <span>Think more about your capstone opportunity</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <span>Bring questions and challenges from your daily work</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              data-testid="return-home-btn"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>

            <p className="text-gray-400 text-sm mt-6">
              Questions? Contact the training team at <span className="text-gold">training@leadway.com</span>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ThankYouPage;

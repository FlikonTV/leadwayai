import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) { setError("Enter password"); return; }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API}/admin/login`, { password });
      if (response.data.success) {
        sessionStorage.setItem("leadway_admin", "true");
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError("Invalid password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy hero-pattern flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2 mb-6">
        <img src={LOGO_URL} alt="Leadway" className="h-10 w-auto" />
        <span className="text-white font-heading text-lg font-medium">Leadway Group</span>
      </div>

      <Card className="w-full max-w-sm bg-white shadow-xl border-0 animate-fade-in">
        <CardHeader className="text-center pb-2 pt-6">
          <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center mx-auto mb-3 hover:scale-105 transition-transform">
            <Lock className="w-6 h-6 text-gold" />
          </div>
          <CardTitle className="font-heading text-xl text-gray-900">Admin Access</CardTitle>
          <CardDescription className="text-gray-500 text-xs">
            Enter password to view submissions
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2 pb-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div>
                <Label htmlFor="password" className="text-gray-700 text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  className="mt-1"
                  data-testid="admin-password-input"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-2.5 rounded-lg" data-testid="login-error">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-gradient text-white font-semibold py-2.5 hover:scale-[1.01] active:scale-[0.99] transition-transform"
                data-testid="admin-login-btn"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Access Dashboard <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </div>
          </form>

          <p className="text-gray-400 text-[10px] text-center mt-4">
            Need access? Contact your administrator.
          </p>
        </CardContent>
      </Card>

      <a href="/" className="text-gray-400 hover:text-gold text-xs mt-4 transition-colors hover:scale-105" data-testid="back-to-home">
        Back to Assessment
      </a>
    </div>
  );
};

export default AdminLogin;

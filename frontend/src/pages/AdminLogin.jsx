import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the admin password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API}/admin/login`, { password });
      if (response.data.success) {
        sessionStorage.setItem("leadway_admin", "true");
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError("Invalid password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy hero-pattern flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <img src={LOGO_URL} alt="Leadway Logo" className="h-12 w-auto" />
        <span className="text-white font-heading text-xl font-medium">Leadway Group</span>
      </div>

      <Card className="w-full max-w-md bg-white shadow-[0_8px_32px_rgba(0,0,0,0.15)] border-0">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 bg-navy rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-gold" />
          </div>
          <CardTitle className="font-heading text-2xl text-gray-900">Admin Access</CardTitle>
          <CardDescription className="text-gray-500">
            Enter the admin password to view submissions
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter admin password"
                  className="mt-2"
                  data-testid="admin-password-input"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg" data-testid="login-error">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-gradient text-white font-semibold py-3"
                data-testid="admin-login-btn"
              >
                {isLoading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    Access Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <p className="text-gray-400 text-xs text-center mt-6">
            Need access? Contact your system administrator.
          </p>
        </CardContent>
      </Card>

      <a
        href="/"
        className="text-gray-400 hover:text-gold text-sm mt-6 transition-colors"
        data-testid="back-to-home"
      >
        Back to Assessment
      </a>
    </div>
  );
};

export default AdminLogin;

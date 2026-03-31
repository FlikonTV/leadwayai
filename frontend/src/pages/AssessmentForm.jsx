import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { ArrowLeft, ArrowRight, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";

const SUBSIDIARIES = ["Leadway Assurance", "Leadway Pensure", "Leadway Health", "Leadway Asset Management", "Leadway Trustees", "Shared Services", "Other"];
const AI_TOOLS = ["ChatGPT", "Microsoft Copilot", "Google Gemini", "Claude", "Midjourney", "DALL-E", "GitHub Copilot", "Other AI Tools"];
const PAIN_POINTS = ["Manual data entry", "Report generation", "Document processing", "Email management", "Meeting scheduling", "Research and analysis", "Customer inquiries", "Compliance checks", "Data reconciliation", "Other"];
const AI_BENEFIT_AREAS = ["Customer service automation", "Document analysis", "Risk assessment", "Claims processing", "Policy underwriting", "Investment analysis", "Fraud detection", "Regulatory compliance", "Marketing personalization", "HR processes"];
const GOVERNANCE_CONCERNS = ["Data privacy and security", "Regulatory compliance", "Algorithmic bias", "Transparency in AI decisions", "Employee job displacement", "Accuracy and reliability", "Intellectual property", "Customer trust"];
const COLLABORATION_AREAS = ["Shared customer insights", "Cross-selling opportunities", "Unified reporting", "Compliance standards", "Training resources", "Technology platforms"];
const LEARNING_EXPECTATIONS = ["Understanding AI fundamentals", "Hands-on prompt engineering", "AI use case identification", "Responsible AI practices", "AI implementation strategies", "Change management for AI", "Measuring AI ROI"];

const SECTIONS = [
  { id: 1, title: "Profile", icon: "👤" },
  { id: 2, title: "AI Awareness", icon: "🤖" },
  { id: 3, title: "Pain Points", icon: "⚡" },
  { id: 4, title: "Use Cases", icon: "💡" },
  { id: 5, title: "Governance", icon: "🛡️" },
  { id: 6, title: "Collaboration", icon: "🤝" },
  { id: 7, title: "Capstone", icon: "🎯" },
  { id: 8, title: "Learning", icon: "📚" }
];

const AssessmentForm = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const isSubmittingRef = useRef(false);
  
  const [formData, setFormData] = useState({
    email: "", full_name: "", job_title: "", subsidiary: "", department: "", years_in_role: "", role_level: "",
    ai_familiarity: 3, ai_tools_used: [], usage_frequency: "", prompt_confidence: 3, data_boundaries_understanding: 3,
    workflow_pain_points: [], repetitive_tasks: "", time_consuming_tasks: "",
    areas_benefit_ai: [], specific_use_cases: "",
    governance_concerns: [], privacy_awareness: 3, compliance_awareness: 3, never_fully_ai: "",
    cross_subsidiary_opportunities: "", collaboration_areas: [],
    capstone_problem: "", success_definition: "", capstone_impact: "",
    learning_expectations: [], preferred_learning_style: "", specific_topics: ""
  });

  const email = localStorage.getItem("leadway_email") || "";

  useEffect(() => {
    if (!email && !isSubmittingRef.current) { navigate("/"); return; }
    setFormData(prev => ({ ...prev, email }));
    loadDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, navigate]);

  const loadDraft = async () => {
    try {
      const response = await axios.get(`${API}/drafts/${encodeURIComponent(email)}`);
      if (response.data?.data) {
        setFormData(prev => ({ ...prev, ...response.data.data, email }));
        toast.success("Draft loaded", { duration: 1500 });
      }
    } catch (error) {
      if (error.response?.status !== 404) console.error("Error loading draft:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = useCallback(async () => {
    if (!email) return;
    setIsSaving(true);
    try {
      await axios.post(`${API}/drafts`, { email, data: formData });
      toast.success("Saved", { duration: 1000 });
    } catch (error) {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [email, formData]);

  useEffect(() => {
    const timer = setInterval(() => { if (!isLoading && email) saveDraft(); }, 30000);
    return () => clearInterval(timer);
  }, [isLoading, email, saveDraft]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) setValidationErrors(prev => ({ ...prev, [field]: null }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] };
    });
  };

  const validateSection = (section) => {
    const errors = {};
    switch (section) {
      case 1:
        if (!formData.full_name.trim()) errors.full_name = "Required";
        if (!formData.job_title.trim()) errors.job_title = "Required";
        if (!formData.subsidiary) errors.subsidiary = "Required";
        if (!formData.department.trim()) errors.department = "Required";
        if (!formData.years_in_role) errors.years_in_role = "Required";
        if (!formData.role_level) errors.role_level = "Required";
        break;
      case 2: if (!formData.usage_frequency) errors.usage_frequency = "Required"; break;
      case 3: if (formData.workflow_pain_points.length === 0) errors.workflow_pain_points = "Select at least one"; break;
      case 4: if (formData.areas_benefit_ai.length === 0) errors.areas_benefit_ai = "Select at least one"; break;
      case 5: if (formData.governance_concerns.length === 0) errors.governance_concerns = "Select at least one"; break;
      case 7:
        if (!formData.capstone_problem.trim()) errors.capstone_problem = "Required";
        if (!formData.success_definition.trim()) errors.success_definition = "Required";
        break;
      case 8: if (formData.learning_expectations.length === 0) errors.learning_expectations = "Select at least one"; break;
      default: break;
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateSection(currentSection)) {
      saveDraft();
      if (currentSection < 8) { setCurrentSection(prev => prev + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
      else setShowReview(true);
    } else toast.error("Complete required fields");
  };

  const handleBack = () => {
    if (showReview) setShowReview(false);
    else if (currentSection > 1) { setCurrentSection(prev => prev - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    isSubmittingRef.current = true;
    try {
      await axios.post(`${API}/submissions`, formData);
      localStorage.removeItem("leadway_email");
      navigate("/thank-you", { replace: true });
    } catch (error) {
      isSubmittingRef.current = false;
      toast.error("Submission failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const RatingScale = ({ value, onChange, label }) => (
    <div className="mb-4">
      <Label className="text-gray-700 text-sm font-medium">{label}</Label>
      <div className="flex gap-2 mt-2">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`w-10 h-10 rounded-lg border-2 font-semibold transition-all duration-200 hover:scale-105 ${
              value === num 
                ? 'bg-gradient-to-br from-sunset-orange to-gold border-transparent text-white shadow-md' 
                : 'border-gray-200 text-gray-600 hover:border-gold hover:bg-gold/5'
            }`}
            data-testid={`rating-${num}`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
        <span>Low</span><span>High</span>
      </div>
    </div>
  );

  const MultiSelect = ({ options, selected, onChange, label, error, columns = 2 }) => (
    <div className="mb-4">
      <Label className="text-gray-700 text-sm font-medium">{label}</Label>
      {error && <span className="text-red-500 text-xs ml-2">{error}</span>}
      <div className={`grid gap-2 mt-2 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {options.map(option => (
          <div
            key={option}
            onClick={() => onChange(option)}
            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
              selected.includes(option) 
                ? 'border-gold bg-gold/10 shadow-sm' 
                : 'border-gray-200 hover:border-gold/50 hover:bg-gray-50'
            }`}
            data-testid={`option-${option.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <Checkbox
              checked={selected.includes(option)}
              className="border-gray-300 data-[state=checked]:bg-gold data-[state=checked]:border-gold pointer-events-none"
            />
            <span className="text-gray-700 text-sm">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSection = () => {
    const inputClass = "mt-1 text-sm";
    const errorClass = (field) => validationErrors[field] ? 'border-red-400' : '';
    
    switch (currentSection) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Full Name *</Label>
                <Input value={formData.full_name} onChange={(e) => updateField("full_name", e.target.value)} className={`${inputClass} ${errorClass('full_name')}`} data-testid="full-name-input" />
              </div>
              <div>
                <Label className="text-sm">Job Title *</Label>
                <Input value={formData.job_title} onChange={(e) => updateField("job_title", e.target.value)} className={`${inputClass} ${errorClass('job_title')}`} data-testid="job-title-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Subsidiary *</Label>
                <Select value={formData.subsidiary} onValueChange={(v) => updateField("subsidiary", v)}>
                  <SelectTrigger className={`${inputClass} ${errorClass('subsidiary')}`} data-testid="subsidiary-select"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{SUBSIDIARIES.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Department *</Label>
                <Input value={formData.department} onChange={(e) => updateField("department", e.target.value)} placeholder="e.g., Finance, IT" className={`${inputClass} ${errorClass('department')}`} data-testid="department-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Years in Role *</Label>
                <Select value={formData.years_in_role} onValueChange={(v) => updateField("years_in_role", v)}>
                  <SelectTrigger className={`${inputClass} ${errorClass('years_in_role')}`} data-testid="years-select"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "More than 10 years"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Role Level *</Label>
                <Select value={formData.role_level} onValueChange={(v) => updateField("role_level", v)}>
                  <SelectTrigger className={`${inputClass} ${errorClass('role_level')}`} data-testid="role-level-select"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Individual Contributor", "Team Lead", "Manager", "Senior Manager", "Director", "Executive"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <RatingScale value={formData.ai_familiarity} onChange={(v) => updateField("ai_familiarity", v)} label="How familiar are you with AI?" />
            <MultiSelect options={AI_TOOLS} selected={formData.ai_tools_used} onChange={(item) => toggleArrayItem("ai_tools_used", item)} label="AI tools you've used" />
            <div>
              <Label className="text-sm">How often do you use AI tools? *</Label>
              <Select value={formData.usage_frequency} onValueChange={(v) => updateField("usage_frequency", v)}>
                <SelectTrigger className={`mt-1 ${errorClass('usage_frequency')}`} data-testid="usage-frequency-select"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                <SelectContent>
                  {["Never", "Rarely", "Monthly", "Weekly", "Daily"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <RatingScale value={formData.prompt_confidence} onChange={(v) => updateField("prompt_confidence", v)} label="Confidence in writing AI prompts" />
            <RatingScale value={formData.data_boundaries_understanding} onChange={(v) => updateField("data_boundaries_understanding", v)} label="Understanding of AI data boundaries" />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <MultiSelect options={PAIN_POINTS} selected={formData.workflow_pain_points} onChange={(item) => toggleArrayItem("workflow_pain_points", item)} label="Your biggest workflow pain points *" error={validationErrors.workflow_pain_points} />
            <div>
              <Label className="text-sm">Describe repetitive tasks you perform</Label>
              <Textarea value={formData.repetitive_tasks} onChange={(e) => updateField("repetitive_tasks", e.target.value)} placeholder="What tasks do you do repeatedly?" className="mt-1 min-h-[80px] text-sm" data-testid="repetitive-tasks-textarea" />
            </div>
            <div>
              <Label className="text-sm">What takes up most of your time?</Label>
              <Textarea value={formData.time_consuming_tasks} onChange={(e) => updateField("time_consuming_tasks", e.target.value)} placeholder="Most time-consuming activities" className="mt-1 min-h-[80px] text-sm" data-testid="time-consuming-textarea" />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <MultiSelect options={AI_BENEFIT_AREAS} selected={formData.areas_benefit_ai} onChange={(item) => toggleArrayItem("areas_benefit_ai", item)} label="Areas that could benefit from AI *" error={validationErrors.areas_benefit_ai} />
            <div>
              <Label className="text-sm">Describe specific AI use cases</Label>
              <Textarea value={formData.specific_use_cases} onChange={(e) => updateField("specific_use_cases", e.target.value)} placeholder="e.g., Automating reports, analyzing feedback..." className="mt-1 min-h-[100px] text-sm" data-testid="use-cases-textarea" />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <MultiSelect options={GOVERNANCE_CONCERNS} selected={formData.governance_concerns} onChange={(item) => toggleArrayItem("governance_concerns", item)} label="Your AI governance concerns *" error={validationErrors.governance_concerns} />
            <RatingScale value={formData.privacy_awareness} onChange={(v) => updateField("privacy_awareness", v)} label="Awareness of data privacy requirements" />
            <RatingScale value={formData.compliance_awareness} onChange={(v) => updateField("compliance_awareness", v)} label="Understanding of AI compliance requirements" />
            <div>
              <Label className="text-sm">What should NEVER be left fully to AI?</Label>
              <Textarea value={formData.never_fully_ai} onChange={(e) => updateField("never_fully_ai", e.target.value)} placeholder="Decisions requiring human judgment..." className="mt-1 min-h-[80px] text-sm" data-testid="never-ai-textarea" />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <MultiSelect options={COLLABORATION_AREAS} selected={formData.collaboration_areas} onChange={(item) => toggleArrayItem("collaboration_areas", item)} label="Cross-subsidiary AI collaboration areas" />
            <div>
              <Label className="text-sm">Opportunities across Leadway subsidiaries</Label>
              <Textarea value={formData.cross_subsidiary_opportunities} onChange={(e) => updateField("cross_subsidiary_opportunities", e.target.value)} placeholder="How could AI help different Leadway companies work together?" className="mt-1 min-h-[100px] text-sm" data-testid="cross-subsidiary-textarea" />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 mb-2">
              <p className="text-gold text-sm font-medium">🎯 Capstone Project</p>
              <p className="text-gray-600 text-xs mt-1">Define ONE significant problem AI could help solve.</p>
            </div>
            <div>
              <Label className="text-sm">Describe the problem *</Label>
              <Textarea value={formData.capstone_problem} onChange={(e) => updateField("capstone_problem", e.target.value)} placeholder="What challenge would you address with AI?" className={`mt-1 min-h-[100px] text-sm ${errorClass('capstone_problem')}`} data-testid="capstone-problem-textarea" />
            </div>
            <div>
              <Label className="text-sm">How would you define success? *</Label>
              <Textarea value={formData.success_definition} onChange={(e) => updateField("success_definition", e.target.value)} placeholder="What metrics would indicate success?" className={`mt-1 min-h-[80px] text-sm ${errorClass('success_definition')}`} data-testid="success-textarea" />
            </div>
            <div>
              <Label className="text-sm">Business impact</Label>
              <Textarea value={formData.capstone_impact} onChange={(e) => updateField("capstone_impact", e.target.value)} placeholder="Time saved, revenue, customer satisfaction..." className="mt-1 min-h-[80px] text-sm" data-testid="impact-textarea" />
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <MultiSelect options={LEARNING_EXPECTATIONS} selected={formData.learning_expectations} onChange={(item) => toggleArrayItem("learning_expectations", item)} label="What do you want to learn? *" error={validationErrors.learning_expectations} columns={1} />
            <div>
              <Label className="text-sm">Preferred learning style</Label>
              <Select value={formData.preferred_learning_style} onValueChange={(v) => updateField("preferred_learning_style", v)}>
                <SelectTrigger className="mt-1" data-testid="learning-style-select"><SelectValue placeholder="Select style" /></SelectTrigger>
                <SelectContent>
                  {["Hands-on practice", "Case studies", "Group discussions", "Lecture and presentation", "Mixed approach"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Any specific topics?</Label>
              <Textarea value={formData.specific_topics} onChange={(e) => updateField("specific_topics", e.target.value)} placeholder="Anything specific you'd like covered?" className="mt-1 min-h-[80px] text-sm" data-testid="specific-topics-textarea" />
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderReview = () => (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <div>
          <span className="text-green-800 font-medium text-sm">Ready to Submit</span>
          <p className="text-green-700 text-xs">Review your answers below</p>
        </div>
      </div>
      
      <div className="grid gap-3 text-sm">
        <ReviewCard title="Profile" items={[
          { l: "Name", v: formData.full_name }, { l: "Title", v: formData.job_title },
          { l: "Subsidiary", v: formData.subsidiary }, { l: "Department", v: formData.department }
        ]} />
        <ReviewCard title="AI Awareness" items={[
          { l: "Familiarity", v: `${formData.ai_familiarity}/5` }, { l: "Tools", v: formData.ai_tools_used.join(", ") || "None" },
          { l: "Frequency", v: formData.usage_frequency }, { l: "Confidence", v: `${formData.prompt_confidence}/5` }
        ]} />
        <ReviewCard title="Capstone" items={[
          { l: "Problem", v: formData.capstone_problem }, { l: "Success", v: formData.success_definition }
        ]} />
      </div>
    </div>
  );

  const ReviewCard = ({ title, items }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="p-3 space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <span className="text-gray-500 min-w-[70px]">{item.l}:</span>
            <span className="text-gray-900 truncate">{item.v || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const progress = showReview ? 100 : (currentSection / 8) * 100;

  return (
    <div className="min-h-screen bg-navy">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 glass bg-navy/90 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Leadway" className="h-7 w-auto" />
            <span className="text-white font-heading text-sm hidden sm:block">AI Readiness</span>
          </div>
          <Button variant="ghost" onClick={saveDraft} disabled={isSaving} className="text-gray-400 hover:text-white h-8 px-2 text-xs" data-testid="save-draft-btn">
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span className="ml-1 hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </header>

      {/* Section Navigation Pills */}
      <div className="bg-navy/50 border-b border-white/5 py-2 overflow-x-auto">
        <div className="max-w-3xl mx-auto px-4 flex gap-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => section.id <= currentSection && !showReview && setCurrentSection(section.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                section.id === currentSection && !showReview
                  ? 'bg-gold text-navy font-medium'
                  : section.id < currentSection
                  ? 'bg-white/10 text-white hover:bg-white/20 cursor-pointer'
                  : 'bg-white/5 text-gray-500'
              }`}
              disabled={section.id > currentSection || showReview}
              data-testid={`section-pill-${section.id}`}
            >
              <span>{section.icon}</span>
              <span className="hidden sm:inline">{section.title}</span>
            </button>
          ))}
          {showReview && (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs bg-green-500 text-white font-medium">
              ✓ Review
            </span>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Card className="bg-white shadow-lg border-0 overflow-hidden">
          {/* Progress Bar */}
          <div className="h-1 bg-gray-100">
            <div className="h-full progress-gradient transition-all duration-500" style={{ width: `${progress}%` }} data-testid="progress-bar" />
          </div>

          <CardHeader className="py-4 px-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-xl text-gray-900">
                  {showReview ? "Review & Submit" : SECTIONS[currentSection - 1].title}
                </CardTitle>
                <CardDescription className="text-gray-500 text-xs mt-0.5">
                  {showReview ? "Confirm your answers" : `Section ${currentSection} of 8`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="form-section">{showReview ? renderReview() : renderSection()}</div>
          </CardContent>

          {/* Navigation */}
          <div className="px-5 pb-5 flex items-center justify-between pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentSection === 1 && !showReview}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 px-4 text-sm"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            
            {showReview ? (
              <Button onClick={handleSubmit} disabled={isSaving} className="btn-gradient text-white font-semibold h-9 px-6 text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform" data-testid="submit-btn">
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <>Submit <CheckCircle2 className="w-4 h-4 ml-1" /></>}
              </Button>
            ) : (
              <Button onClick={handleNext} className="btn-gradient text-white font-semibold h-9 px-6 text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform" data-testid="next-btn">
                {currentSection === 8 ? "Review" : "Continue"} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AssessmentForm;

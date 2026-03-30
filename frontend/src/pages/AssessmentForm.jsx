import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Progress } from "../components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { ArrowLeft, ArrowRight, Save, CheckCircle2, AlertCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";

const SUBSIDIARIES = [
  "Leadway Assurance",
  "Leadway Pensure",
  "Leadway Health",
  "Leadway Asset Management",
  "Leadway Trustees",
  "Shared Services",
  "Other"
];

const AI_TOOLS = [
  "ChatGPT",
  "Microsoft Copilot",
  "Google Gemini",
  "Claude",
  "Midjourney",
  "DALL-E",
  "GitHub Copilot",
  "Other AI Tools"
];

const PAIN_POINTS = [
  "Manual data entry",
  "Report generation",
  "Document processing",
  "Email management",
  "Meeting scheduling",
  "Research and analysis",
  "Customer inquiries",
  "Compliance checks",
  "Data reconciliation",
  "Other"
];

const AI_BENEFIT_AREAS = [
  "Customer service automation",
  "Document analysis and extraction",
  "Risk assessment",
  "Claims processing",
  "Policy underwriting",
  "Investment analysis",
  "Fraud detection",
  "Regulatory compliance",
  "Marketing personalization",
  "HR processes"
];

const GOVERNANCE_CONCERNS = [
  "Data privacy and security",
  "Regulatory compliance",
  "Algorithmic bias",
  "Transparency in AI decisions",
  "Employee job displacement",
  "Accuracy and reliability",
  "Intellectual property",
  "Customer trust"
];

const COLLABORATION_AREAS = [
  "Shared customer insights",
  "Cross-selling opportunities",
  "Unified reporting",
  "Compliance standards",
  "Training resources",
  "Technology platforms"
];

const LEARNING_EXPECTATIONS = [
  "Understanding AI fundamentals",
  "Hands-on prompt engineering",
  "AI use case identification",
  "Responsible AI practices",
  "AI implementation strategies",
  "Change management for AI",
  "Measuring AI ROI"
];

const SECTIONS = [
  { id: 1, title: "Participant Profile", description: "Tell us about yourself and your role" },
  { id: 2, title: "AI Awareness & Usage", description: "Share your experience with AI tools" },
  { id: 3, title: "Workflow Pain Points", description: "Identify areas that need improvement" },
  { id: 4, title: "Function-Specific Use Cases", description: "Explore AI opportunities in your work" },
  { id: 5, title: "Governance & Responsible AI", description: "Share your thoughts on AI governance" },
  { id: 6, title: "Cross-Subsidiary Opportunities", description: "Identify collaboration opportunities" },
  { id: 7, title: "Capstone Opportunity Scan", description: "Define your AI transformation idea" },
  { id: 8, title: "Learning Expectations", description: "Tell us what you want to learn" }
];

const AssessmentForm = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    job_title: "",
    subsidiary: "",
    department: "",
    years_in_role: "",
    role_level: "",
    ai_familiarity: 3,
    ai_tools_used: [],
    usage_frequency: "",
    prompt_confidence: 3,
    data_boundaries_understanding: 3,
    workflow_pain_points: [],
    repetitive_tasks: "",
    time_consuming_tasks: "",
    areas_benefit_ai: [],
    specific_use_cases: "",
    governance_concerns: [],
    privacy_awareness: 3,
    compliance_awareness: 3,
    never_fully_ai: "",
    cross_subsidiary_opportunities: "",
    collaboration_areas: [],
    capstone_problem: "",
    success_definition: "",
    capstone_impact: "",
    learning_expectations: [],
    preferred_learning_style: "",
    specific_topics: ""
  });

  const email = localStorage.getItem("leadway_email") || "";

  useEffect(() => {
    if (!email) {
      navigate("/");
      return;
    }
    setFormData(prev => ({ ...prev, email }));
    loadDraft();
  }, [email, navigate]);

  const loadDraft = async () => {
    try {
      const response = await axios.get(`${API}/drafts/${encodeURIComponent(email)}`);
      if (response.data && response.data.data) {
        setFormData(prev => ({ ...prev, ...response.data.data, email }));
        toast.success("Draft loaded successfully");
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error loading draft:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = useCallback(async () => {
    if (!email) return;
    setIsSaving(true);
    try {
      await axios.post(`${API}/drafts`, { email, data: formData });
      toast.success("Draft saved", { duration: 2000 });
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  }, [email, formData]);

  // Autosave every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isLoading && email) {
        saveDraft();
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [isLoading, email, saveDraft]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...arr, item] };
    });
  };

  const validateSection = (section) => {
    const errors = {};
    switch (section) {
      case 1:
        if (!formData.full_name.trim()) errors.full_name = "Full name is required";
        if (!formData.job_title.trim()) errors.job_title = "Job title is required";
        if (!formData.subsidiary) errors.subsidiary = "Please select your subsidiary";
        if (!formData.department.trim()) errors.department = "Department is required";
        if (!formData.years_in_role) errors.years_in_role = "Please select years in role";
        if (!formData.role_level) errors.role_level = "Please select your role level";
        break;
      case 2:
        if (!formData.usage_frequency) errors.usage_frequency = "Please select usage frequency";
        break;
      case 3:
        if (formData.workflow_pain_points.length === 0) errors.workflow_pain_points = "Please select at least one pain point";
        break;
      case 4:
        if (formData.areas_benefit_ai.length === 0) errors.areas_benefit_ai = "Please select at least one area";
        break;
      case 5:
        if (formData.governance_concerns.length === 0) errors.governance_concerns = "Please select at least one concern";
        break;
      case 7:
        if (!formData.capstone_problem.trim()) errors.capstone_problem = "Please describe your capstone problem";
        if (!formData.success_definition.trim()) errors.success_definition = "Please define success";
        break;
      case 8:
        if (formData.learning_expectations.length === 0) errors.learning_expectations = "Please select at least one learning goal";
        break;
      default:
        break;
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateSection(currentSection)) {
      saveDraft();
      if (currentSection < 8) {
        setCurrentSection(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setShowReview(true);
      }
    } else {
      toast.error("Please complete all required fields");
    }
  };

  const handleBack = () => {
    if (showReview) {
      setShowReview(false);
    } else if (currentSection > 1) {
      setCurrentSection(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await axios.post(`${API}/submissions`, formData);
      localStorage.removeItem("leadway_email");
      navigate("/thank-you");
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Failed to submit assessment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const RatingScale = ({ value, onChange, label, description }) => (
    <div className="mb-6">
      <Label className="text-gray-700 font-medium">{label}</Label>
      {description && <p className="text-gray-500 text-sm mt-1 mb-3">{description}</p>}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`rating-item ${value === num ? 'selected' : ''}`}
            data-testid={`rating-${num}`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>Not at all</span>
        <span>Very much</span>
      </div>
    </div>
  );

  const MultiSelect = ({ options, selected, onChange, label, error }) => (
    <div className="mb-6">
      <Label className="text-gray-700 font-medium">{label}</Label>
      {error && <p className="text-red-500 text-sm mt-1"><AlertCircle className="inline w-4 h-4 mr-1" />{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        {options.map(option => (
          <div
            key={option}
            onClick={() => onChange(option)}
            className={`multi-select-item ${selected.includes(option) ? 'selected' : ''}`}
            data-testid={`option-${option.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <Checkbox
              checked={selected.includes(option)}
              className="mr-3 border-gray-300 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
            />
            <span className="text-gray-700 text-sm">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSection = () => {
    switch (currentSection) {
      case 1:
        return (
          <div className="form-section space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="full_name" className="text-gray-700 font-medium">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  placeholder="Enter your full name"
                  className={`mt-2 ${validationErrors.full_name ? 'border-red-500' : ''}`}
                  data-testid="full-name-input"
                />
                {validationErrors.full_name && <p className="text-red-500 text-sm mt-1">{validationErrors.full_name}</p>}
              </div>
              <div>
                <Label htmlFor="job_title" className="text-gray-700 font-medium">Job Title *</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => updateField("job_title", e.target.value)}
                  placeholder="Enter your job title"
                  className={`mt-2 ${validationErrors.job_title ? 'border-red-500' : ''}`}
                  data-testid="job-title-input"
                />
                {validationErrors.job_title && <p className="text-red-500 text-sm mt-1">{validationErrors.job_title}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-700 font-medium">Subsidiary *</Label>
                <Select value={formData.subsidiary} onValueChange={(v) => updateField("subsidiary", v)}>
                  <SelectTrigger className={`mt-2 ${validationErrors.subsidiary ? 'border-red-500' : ''}`} data-testid="subsidiary-select">
                    <SelectValue placeholder="Select your subsidiary" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSIDIARIES.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.subsidiary && <p className="text-red-500 text-sm mt-1">{validationErrors.subsidiary}</p>}
              </div>
              <div>
                <Label htmlFor="department" className="text-gray-700 font-medium">Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => updateField("department", e.target.value)}
                  placeholder="e.g., Finance, Operations, IT"
                  className={`mt-2 ${validationErrors.department ? 'border-red-500' : ''}`}
                  data-testid="department-input"
                />
                {validationErrors.department && <p className="text-red-500 text-sm mt-1">{validationErrors.department}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-700 font-medium">Years in Current Role *</Label>
                <Select value={formData.years_in_role} onValueChange={(v) => updateField("years_in_role", v)}>
                  <SelectTrigger className={`mt-2 ${validationErrors.years_in_role ? 'border-red-500' : ''}`} data-testid="years-select">
                    <SelectValue placeholder="Select years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Less than 1 year">Less than 1 year</SelectItem>
                    <SelectItem value="1-3 years">1-3 years</SelectItem>
                    <SelectItem value="3-5 years">3-5 years</SelectItem>
                    <SelectItem value="5-10 years">5-10 years</SelectItem>
                    <SelectItem value="More than 10 years">More than 10 years</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.years_in_role && <p className="text-red-500 text-sm mt-1">{validationErrors.years_in_role}</p>}
              </div>
              <div>
                <Label className="text-gray-700 font-medium">Role Level *</Label>
                <Select value={formData.role_level} onValueChange={(v) => updateField("role_level", v)}>
                  <SelectTrigger className={`mt-2 ${validationErrors.role_level ? 'border-red-500' : ''}`} data-testid="role-level-select">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual Contributor">Individual Contributor</SelectItem>
                    <SelectItem value="Team Lead">Team Lead</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Senior Manager">Senior Manager</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.role_level && <p className="text-red-500 text-sm mt-1">{validationErrors.role_level}</p>}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="form-section space-y-6">
            <RatingScale
              value={formData.ai_familiarity}
              onChange={(v) => updateField("ai_familiarity", v)}
              label="How familiar are you with AI and its applications?"
              description="1 = Not familiar at all, 5 = Very familiar"
            />
            <MultiSelect
              options={AI_TOOLS}
              selected={formData.ai_tools_used}
              onChange={(item) => toggleArrayItem("ai_tools_used", item)}
              label="Which AI tools have you used? (Select all that apply)"
            />
            <div>
              <Label className="text-gray-700 font-medium">How often do you use AI tools? *</Label>
              <Select value={formData.usage_frequency} onValueChange={(v) => updateField("usage_frequency", v)}>
                <SelectTrigger className={`mt-2 ${validationErrors.usage_frequency ? 'border-red-500' : ''}`} data-testid="usage-frequency-select">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Never">Never</SelectItem>
                  <SelectItem value="Rarely">Rarely (once a month or less)</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Daily">Daily</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.usage_frequency && <p className="text-red-500 text-sm mt-1">{validationErrors.usage_frequency}</p>}
            </div>
            <RatingScale
              value={formData.prompt_confidence}
              onChange={(v) => updateField("prompt_confidence", v)}
              label="How confident are you in writing effective AI prompts?"
              description="1 = Not confident, 5 = Very confident"
            />
            <RatingScale
              value={formData.data_boundaries_understanding}
              onChange={(v) => updateField("data_boundaries_understanding", v)}
              label="How well do you understand what data should/shouldn't be shared with AI?"
              description="1 = Don't understand, 5 = Understand very well"
            />
          </div>
        );
      case 3:
        return (
          <div className="form-section space-y-6">
            <MultiSelect
              options={PAIN_POINTS}
              selected={formData.workflow_pain_points}
              onChange={(item) => toggleArrayItem("workflow_pain_points", item)}
              label="What are your biggest workflow pain points? * (Select all that apply)"
              error={validationErrors.workflow_pain_points}
            />
            <div>
              <Label htmlFor="repetitive_tasks" className="text-gray-700 font-medium">
                Describe repetitive tasks you perform regularly
              </Label>
              <Textarea
                id="repetitive_tasks"
                value={formData.repetitive_tasks}
                onChange={(e) => updateField("repetitive_tasks", e.target.value)}
                placeholder="What tasks do you find yourself doing repeatedly? How much time do they take?"
                className="mt-2 min-h-[100px]"
                data-testid="repetitive-tasks-textarea"
              />
            </div>
            <div>
              <Label htmlFor="time_consuming_tasks" className="text-gray-700 font-medium">
                What tasks take up most of your time?
              </Label>
              <Textarea
                id="time_consuming_tasks"
                value={formData.time_consuming_tasks}
                onChange={(e) => updateField("time_consuming_tasks", e.target.value)}
                placeholder="Which activities consume the most time in your typical workweek?"
                className="mt-2 min-h-[100px]"
                data-testid="time-consuming-textarea"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="form-section space-y-6">
            <MultiSelect
              options={AI_BENEFIT_AREAS}
              selected={formData.areas_benefit_ai}
              onChange={(item) => toggleArrayItem("areas_benefit_ai", item)}
              label="Which areas of your work could benefit most from AI? * (Select all that apply)"
              error={validationErrors.areas_benefit_ai}
            />
            <div>
              <Label htmlFor="specific_use_cases" className="text-gray-700 font-medium">
                Describe specific use cases where AI could help
              </Label>
              <p className="text-gray-500 text-sm mt-1 mb-2">
                Think about specific tasks or processes where AI assistance would be valuable
              </p>
              <Textarea
                id="specific_use_cases"
                value={formData.specific_use_cases}
                onChange={(e) => updateField("specific_use_cases", e.target.value)}
                placeholder="e.g., Automating report generation, analyzing customer feedback, drafting policy documents..."
                className="mt-2 min-h-[120px]"
                data-testid="use-cases-textarea"
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="form-section space-y-6">
            <MultiSelect
              options={GOVERNANCE_CONCERNS}
              selected={formData.governance_concerns}
              onChange={(item) => toggleArrayItem("governance_concerns", item)}
              label="What are your top AI governance concerns? * (Select all that apply)"
              error={validationErrors.governance_concerns}
            />
            <RatingScale
              value={formData.privacy_awareness}
              onChange={(v) => updateField("privacy_awareness", v)}
              label="How aware are you of data privacy requirements for AI use?"
              description="1 = Not aware, 5 = Very aware"
            />
            <RatingScale
              value={formData.compliance_awareness}
              onChange={(v) => updateField("compliance_awareness", v)}
              label="How well do you understand compliance requirements for AI in your industry?"
              description="1 = Don't understand, 5 = Understand very well"
            />
            <div>
              <Label htmlFor="never_fully_ai" className="text-gray-700 font-medium">
                What decisions or tasks should NEVER be left fully to AI?
              </Label>
              <Textarea
                id="never_fully_ai"
                value={formData.never_fully_ai}
                onChange={(e) => updateField("never_fully_ai", e.target.value)}
                placeholder="What aspects of your work require human judgment and should not be automated?"
                className="mt-2 min-h-[100px]"
                data-testid="never-ai-textarea"
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="form-section space-y-6">
            <MultiSelect
              options={COLLABORATION_AREAS}
              selected={formData.collaboration_areas}
              onChange={(item) => toggleArrayItem("collaboration_areas", item)}
              label="Which areas could benefit from cross-subsidiary AI collaboration?"
            />
            <div>
              <Label htmlFor="cross_subsidiary" className="text-gray-700 font-medium">
                Describe opportunities for AI collaboration across Leadway subsidiaries
              </Label>
              <p className="text-gray-500 text-sm mt-1 mb-2">
                How could AI help different Leadway companies work better together?
              </p>
              <Textarea
                id="cross_subsidiary"
                value={formData.cross_subsidiary_opportunities}
                onChange={(e) => updateField("cross_subsidiary_opportunities", e.target.value)}
                placeholder="e.g., Shared customer intelligence, unified risk assessment, cross-selling automation..."
                className="mt-2 min-h-[120px]"
                data-testid="cross-subsidiary-textarea"
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="form-section space-y-6">
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-6">
              <h3 className="text-gold font-medium mb-2">Capstone Project Opportunity</h3>
              <p className="text-gray-600 text-sm">
                Think about ONE significant problem or opportunity in your work that AI could help address. 
                This will form the basis of your capstone project during the training.
              </p>
            </div>
            <div>
              <Label htmlFor="capstone_problem" className="text-gray-700 font-medium">
                Describe the problem or opportunity *
              </Label>
              <Textarea
                id="capstone_problem"
                value={formData.capstone_problem}
                onChange={(e) => updateField("capstone_problem", e.target.value)}
                placeholder="What specific challenge or opportunity would you like to address with AI?"
                className={`mt-2 min-h-[120px] ${validationErrors.capstone_problem ? 'border-red-500' : ''}`}
                data-testid="capstone-problem-textarea"
              />
              {validationErrors.capstone_problem && <p className="text-red-500 text-sm mt-1">{validationErrors.capstone_problem}</p>}
            </div>
            <div>
              <Label htmlFor="success_definition" className="text-gray-700 font-medium">
                How would you define success? *
              </Label>
              <Textarea
                id="success_definition"
                value={formData.success_definition}
                onChange={(e) => updateField("success_definition", e.target.value)}
                placeholder="What outcomes or metrics would indicate that an AI solution was successful?"
                className={`mt-2 min-h-[100px] ${validationErrors.success_definition ? 'border-red-500' : ''}`}
                data-testid="success-textarea"
              />
              {validationErrors.success_definition && <p className="text-red-500 text-sm mt-1">{validationErrors.success_definition}</p>}
            </div>
            <div>
              <Label htmlFor="capstone_impact" className="text-gray-700 font-medium">
                What would be the business impact?
              </Label>
              <Textarea
                id="capstone_impact"
                value={formData.capstone_impact}
                onChange={(e) => updateField("capstone_impact", e.target.value)}
                placeholder="How would solving this problem benefit Leadway? (time saved, revenue, customer satisfaction, etc.)"
                className="mt-2 min-h-[100px]"
                data-testid="impact-textarea"
              />
            </div>
          </div>
        );
      case 8:
        return (
          <div className="form-section space-y-6">
            <MultiSelect
              options={LEARNING_EXPECTATIONS}
              selected={formData.learning_expectations}
              onChange={(item) => toggleArrayItem("learning_expectations", item)}
              label="What do you most want to learn from the training? * (Select all that apply)"
              error={validationErrors.learning_expectations}
            />
            <div>
              <Label className="text-gray-700 font-medium">What's your preferred learning style?</Label>
              <Select value={formData.preferred_learning_style} onValueChange={(v) => updateField("preferred_learning_style", v)}>
                <SelectTrigger className="mt-2" data-testid="learning-style-select">
                  <SelectValue placeholder="Select learning style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hands-on practice">Hands-on practice</SelectItem>
                  <SelectItem value="Case studies">Case studies and examples</SelectItem>
                  <SelectItem value="Group discussions">Group discussions</SelectItem>
                  <SelectItem value="Lecture and presentation">Lecture and presentation</SelectItem>
                  <SelectItem value="Mixed approach">Mixed approach</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="specific_topics" className="text-gray-700 font-medium">
                Any specific topics you'd like covered?
              </Label>
              <Textarea
                id="specific_topics"
                value={formData.specific_topics}
                onChange={(e) => updateField("specific_topics", e.target.value)}
                placeholder="Is there anything specific you'd like the training to address?"
                className="mt-2 min-h-[100px]"
                data-testid="specific-topics-textarea"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderReview = () => (
    <div className="form-section space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">Ready to Submit</span>
        </div>
        <p className="text-green-700 text-sm mt-1">
          Please review your responses before submitting.
        </p>
      </div>
      
      <div className="space-y-6">
        <ReviewSection title="Participant Profile">
          <ReviewItem label="Name" value={formData.full_name} />
          <ReviewItem label="Job Title" value={formData.job_title} />
          <ReviewItem label="Subsidiary" value={formData.subsidiary} />
          <ReviewItem label="Department" value={formData.department} />
          <ReviewItem label="Years in Role" value={formData.years_in_role} />
          <ReviewItem label="Role Level" value={formData.role_level} />
        </ReviewSection>

        <ReviewSection title="AI Awareness">
          <ReviewItem label="AI Familiarity" value={`${formData.ai_familiarity}/5`} />
          <ReviewItem label="Tools Used" value={formData.ai_tools_used.join(", ") || "None selected"} />
          <ReviewItem label="Usage Frequency" value={formData.usage_frequency} />
          <ReviewItem label="Prompt Confidence" value={`${formData.prompt_confidence}/5`} />
        </ReviewSection>

        <ReviewSection title="Pain Points">
          <ReviewItem label="Workflow Pain Points" value={formData.workflow_pain_points.join(", ")} />
          <ReviewItem label="Repetitive Tasks" value={formData.repetitive_tasks || "Not provided"} />
        </ReviewSection>

        <ReviewSection title="Capstone Opportunity">
          <ReviewItem label="Problem Statement" value={formData.capstone_problem} />
          <ReviewItem label="Success Definition" value={formData.success_definition} />
        </ReviewSection>

        <ReviewSection title="Learning Expectations">
          <ReviewItem label="Learning Goals" value={formData.learning_expectations.join(", ")} />
          <ReviewItem label="Preferred Style" value={formData.preferred_learning_style || "Not specified"} />
        </ReviewSection>
      </div>
    </div>
  );

  const ReviewSection = ({ title, children }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-heading text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );

  const ReviewItem = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span className="text-gray-500 text-sm font-medium min-w-[140px]">{label}:</span>
      <span className="text-gray-900 text-sm">{value}</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const progress = showReview ? 100 : (currentSection / 8) * 100;

  return (
    <div className="min-h-screen bg-navy">
      {/* Header */}
      <header className="sticky top-0 z-50 glass bg-navy/85 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Leadway Logo" className="h-8 w-auto" />
            <span className="text-white font-heading text-lg hidden sm:block">AI Readiness Scan</span>
          </div>
          <Button
            variant="ghost"
            onClick={saveDraft}
            disabled={isSaving}
            className="text-gray-400 hover:text-white"
            data-testid="save-draft-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Card className="bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] border-0">
          {/* Progress Bar */}
          <div className="h-1 bg-gray-100">
            <div 
              className="h-full progress-gradient transition-all duration-300"
              style={{ width: `${progress}%` }}
              data-testid="progress-bar"
            />
          </div>

          <CardHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-2xl md:text-3xl text-gray-900">
                  {showReview ? "Review Your Responses" : SECTIONS[currentSection - 1].title}
                </CardTitle>
                <CardDescription className="text-gray-500 mt-1">
                  {showReview ? "Please confirm your answers before submitting" : SECTIONS[currentSection - 1].description}
                </CardDescription>
              </div>
              {!showReview && (
                <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {currentSection} of 8
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6 pb-8">
            {showReview ? renderReview() : renderSection()}
          </CardContent>

          {/* Navigation */}
          <div className="px-6 pb-6 flex items-center justify-between border-t border-gray-100 pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentSection === 1 && !showReview}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {showReview ? (
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="btn-gradient text-white font-semibold px-8"
                data-testid="submit-btn"
              >
                {isSaving ? (
                  <>
                    <div className="spinner mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Assessment
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="btn-gradient text-white font-semibold px-8"
                data-testid="next-btn"
              >
                {currentSection === 8 ? "Review Answers" : "Continue"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>

        {/* Section Navigation */}
        {!showReview && (
          <div className="mt-6 flex justify-center gap-2">
            {SECTIONS.map((section, index) => (
              <button
                key={section.id}
                onClick={() => {
                  if (index + 1 < currentSection) {
                    setCurrentSection(index + 1);
                  }
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  index + 1 === currentSection
                    ? "bg-gold scale-125"
                    : index + 1 < currentSection
                    ? "bg-gold/50 hover:bg-gold/70"
                    : "bg-gray-600"
                }`}
                title={section.title}
                data-testid={`section-dot-${index + 1}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AssessmentForm;

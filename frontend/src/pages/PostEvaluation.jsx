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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { ArrowLeft, ArrowRight, Save, CheckCircle2, Loader2, User, Brain, Wrench, Rocket, TrendingUp, Target, Star, Flag } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";

const SECTIONS = [
  { id: 1, title: "Profile", icon: User },
  { id: 2, title: "AI Readiness", icon: Brain },
  { id: 3, title: "Tool Comfort", icon: Wrench },
  { id: 4, title: "Built & Deployed", icon: Rocket },
  { id: 5, title: "Capability Shift", icon: TrendingUp },
  { id: 6, title: "30-Day Plan", icon: Target },
  { id: 7, title: "Evaluation", icon: Star },
  { id: 8, title: "Goals", icon: Flag },
];

const PRIMARY_FUNCTIONS = [
  "Underwriting", "Claims", "Finance & Accounting", "IT & Digital", "Human Resources",
  "Marketing & Communications", "Legal & Compliance", "Risk Management", "Operations",
  "Customer Service", "Investment Management", "Actuarial"
];

const AI_RELATIONSHIP_OPTIONS = [
  "I now have specific tools I use regularly",
  "I have built a custom prompt or Claude Skill",
  "I have built an AI agent (GPTBots or Claude Projects)",
  "I have designed a workflow connecting AI tools",
  "I am actively using something I built during the programme",
  "I feel confident enough to explain AI to a colleague",
  "I still feel uncertain"
];

const BARRIERS_REMOVED = [
  "I now know which tools to select for which task",
  "I understand data privacy boundaries when using AI",
  "I know how to use AI tools effectively with good prompts",
  "I have role-specific prompts I can use immediately",
  "I have completed formal AI training",
  "No barriers remain — I feel fully equipped"
];

const TOOL_LIST = [
  "Claude (Anthropic) + TABS-D™",
  "ChatGPT",
  "Gemini AI Automation",
  "GPTBots — Agent Builder",
  "Microsoft Designer / Visual AI",
  "Knowledge Tools (NotebookLM)",
  "ElevenLabs Voice AI",
  "Microsoft Copilot",
  "Canva AI",
  "Any AI tool for data analysis"
];

const PROMPT_STATUS_OPTIONS = [
  "Built a Claude Skill",
  "Saved multiple TABS-D prompts",
  "Started but not finished",
  "Plan to this week"
];

const AGENT_OPTIONS = [
  "GPTBots renewal agent",
  "Claude Projects persistent agent",
  "Claims processing agent",
  "Survey monitoring agent",
  "RFQ automation system",
  "LooseGuard AI component",
  "ElevenLabs voice agent",
  "Other"
];

const DEPLOYMENT_ITEMS = [
  "Credit Life Claims Calculator",
  "Survey Track Monitoring System",
  "RFQ Automation Engine",
  "Vendor Portal",
  "Auto-Registration Claims Agent",
  "LooseGuard AI Component",
  "Claude Renewal Agent Skill",
  "Cross-Referral Intelligence Skill",
  "Customer Communication Skill",
  "ElevenLabs Voice Agent (Layo)",
  "Zapier + Gmail Pipeline",
  "Claude Projects Persistent Agent"
];

const DEPLOYMENT_STATUSES = ["Active Use", "In Testing", "In Progress", "Not Started", "Not Relevant"];

const WORKPLACE_CHALLENGES = [
  "Manual report generation is now faster",
  "Data entry has been partially automated",
  "Customer communication is AI-assisted",
  "Document processing is more efficient",
  "Research and analysis time reduced",
  "Meeting preparation is AI-supported",
  "Email drafting is faster with AI",
  "Compliance checks are AI-augmented",
  "Knowledge management is improved",
  "Cross-team collaboration enhanced by AI"
];

const ONE_THING_OPTIONS = [
  "Yes, fully addressed",
  "Partially addressed",
  "Not yet, but I know how",
  "Not yet — I need support"
];

const SESSION_ITEMS = [
  "Day 1 Strategy Session",
  "Day 1 Claude + TABS-D Framework",
  "Day 2 GPTBots Agent Building",
  "Day 2 Gemini AI Automation",
  "Day 2 ElevenLabs Voice AI",
  "Day 3 Workflow Design",
  "Day 3 Capstone Build",
  "Overall Programme Quality"
];

const FACILITATOR_DIMENSIONS = [
  { key: "expertise", label: "Subject Matter Expertise", desc: "Depth of AI knowledge demonstrated" },
  { key: "delivery", label: "Delivery & Communication", desc: "Clarity, pace, and engagement" },
  { key: "facilitation", label: "Hands-On Facilitation", desc: "Ability to guide practical exercises" },
  { key: "immersive", label: "Immersive Experience", desc: "Energy, depth, and participant involvement" },
  { key: "support", label: "Participant Support", desc: "Responsiveness to questions and needs" }
];

const LEARNING_GOALS = [
  "Understanding AI fundamentals",
  "Hands-on prompt engineering",
  "AI use case identification",
  "Responsible AI practices",
  "AI implementation strategies",
  "Change management for AI",
  "Measuring AI ROI",
  "Building AI agents",
  "Workflow automation with AI",
  "AI strategy for leadership"
];

const FOLLOWUP_OPTIONS = [
  "Deep-dive follow-up session",
  "LooseGuard development participation",
  "Mentor Cohort 2 participants",
  "Recommend to a peer institution"
];

const initFormData = () => ({
  full_name: "", job_title: "", subsidiary_department: "", years_in_role: "", primary_function: "",
  readiness_level: "", ai_relationship: [], barriers_removed: [],
  tool_ratings: {}, tool_surprise: "", tool_next_30: "",
  prompt_status: "", prompt_description: "", agents_built: [], deployment_status: {}, biggest_impact: "",
  capability_tasks: [{ before: "", ai_now: "", time_saved: "" }, { before: "", ai_now: "", time_saved: "" }, { before: "", ai_now: "", time_saved: "" }],
  challenges_addressed: [], one_thing_status: "", before_after_ai: "",
  daily_tool: "",
  commitments: [{ action: "", target_date: "", accountable: "" }, { action: "", target_date: "", accountable: "" }, { action: "", target_date: "", accountable: "" }],
  share_colleague: "", obstacle_plan: "",
  session_ratings: {}, facilitator1_ratings: {}, facilitator1_comment: "",
  facilitator2_ratings: {}, facilitator2_comment: "",
  nps_score: null,
  most_valuable: "", deeper_cohort2: "", message_team: "",
  goals_achieved: [], able_to: "", advice_cohort2: "", followup_interest: [], final_words: ""
});

const PostEvaluation = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(initFormData());
  const [showEmailDialog, setShowEmailDialog] = useState(true);
  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");

  const loadDraft = useCallback(async (userEmail) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/post-eval-drafts/${encodeURIComponent(userEmail)}`);
      if (response.data?.data) {
        setFormData(prev => ({ ...prev, ...response.data.data }));
        toast.success("Draft loaded", { duration: 1500 });
      }
    } catch (error) {
      if (error.response?.status !== 404) console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveDraft = useCallback(async () => {
    if (!email) return;
    setIsSaving(true);
    try {
      await axios.post(`${API}/post-eval-drafts`, { email, data: formData });
      toast.success("Saved", { duration: 1000 });
    } catch (error) {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [email, formData]);

  useEffect(() => {
    if (!email) return;
    const timer = setInterval(() => saveDraft(), 30000);
    return () => clearInterval(timer);
  }, [email, saveDraft]);

  const handleEmailSubmit = () => {
    if (!emailInput.trim()) { setEmailError("Please enter your email"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) { setEmailError("Invalid email"); return; }
    setEmail(emailInput);
    setShowEmailDialog(false);
    loadDraft(emailInput);
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleArrayItem = (field, item) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] };
    });
  };

  const updateNestedField = (field, key, value) => {
    setFormData(prev => ({ ...prev, [field]: { ...prev[field], [key]: value } }));
  };

  const updateArrayRow = (field, index, key, value) => {
    setFormData(prev => {
      const arr = [...prev[field]];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, [field]: arr };
    });
  };

  const handleNext = () => {
    saveDraft();
    if (currentSection < 8) {
      setCurrentSection(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentSection > 1) {
      setCurrentSection(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const payload = { email, data: { ...formData, participant_name: formData.full_name } };
      console.log(`Post-Evaluation Submission [${formData.full_name}]:`, payload);
      await axios.post(`${API}/post-evaluations`, payload);
      navigate("/post-eval-thank-you", { replace: true });
    } catch (error) {
      toast.error("Submission failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ===================== REUSABLE COMPONENTS =====================

  const RatingRow = ({ label, value, onChange, desc }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-800">{label}</span>
        {desc && <p className="text-[10px] text-gray-400">{desc}</p>}
      </div>
      <div className="flex gap-1.5 shrink-0">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
              value === n
                ? 'bg-gradient-to-br from-sunset-orange to-gold text-white shadow-md scale-105'
                : 'border-2 border-gray-200 text-gray-500 hover:border-gold hover:bg-gold/5'
            }`}
            data-testid={`rating-${label}-${n}`}
          >{n}</button>
        ))}
      </div>
    </div>
  );

  const MultiSelect = ({ options, selected, onChange, label, columns = 1 }) => (
    <div className="mb-4">
      <Label className="text-gray-700 text-sm font-medium">{label}</Label>
      <div className={`grid gap-2 mt-2 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {options.map(option => (
          <div key={option} onClick={() => onChange(option)}
            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
              selected.includes(option) ? 'border-gold bg-gold/10 shadow-sm' : 'border-gray-200 hover:border-gold/50 hover:bg-gray-50'
            }`}
            data-testid={`option-${option.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`}
          >
            <Checkbox checked={selected.includes(option)} className="border-gray-300 data-[state=checked]:bg-gold data-[state=checked]:border-gold pointer-events-none" />
            <span className="text-gray-700 text-sm">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const SingleSelect = ({ options, value, onChange, label }) => (
    <div className="mb-4">
      <Label className="text-gray-700 text-sm font-medium">{label}</Label>
      <div className="grid gap-2 mt-2">
        {options.map(option => (
          <div key={option} onClick={() => onChange(option)}
            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
              value === option ? 'border-gold bg-gold/10 shadow-sm' : 'border-gray-200 hover:border-gold/50 hover:bg-gray-50'
            }`}
            data-testid={`single-${option.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              value === option ? 'border-gold' : 'border-gray-300'
            }`}>
              {value === option && <div className="w-2 h-2 rounded-full bg-gold" />}
            </div>
            <span className="text-gray-700 text-sm">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ===================== SECTION RENDERERS =====================

  const renderSection1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Full Name *</Label>
          <Input value={formData.full_name} onChange={e => updateField("full_name", e.target.value)} className="mt-1 text-sm" data-testid="post-full-name" />
        </div>
        <div>
          <Label className="text-sm">Job Title / Role *</Label>
          <Input value={formData.job_title} onChange={e => updateField("job_title", e.target.value)} className="mt-1 text-sm" data-testid="post-job-title" />
        </div>
      </div>
      <div>
        <Label className="text-sm">Subsidiary / Department *</Label>
        <Input value={formData.subsidiary_department} onChange={e => updateField("subsidiary_department", e.target.value)} className="mt-1 text-sm" placeholder="e.g., Leadway Assurance / Claims" data-testid="post-subsidiary" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Years in Current Role *</Label>
          <Select value={formData.years_in_role} onValueChange={v => updateField("years_in_role", v)}>
            <SelectTrigger className="mt-1 text-sm" data-testid="post-years-select"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {["Less than 1 year", "1–3 years", "4–7 years", "8+ years"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Primary Function *</Label>
          <Select value={formData.primary_function} onValueChange={v => updateField("primary_function", v)}>
            <SelectTrigger className="mt-1 text-sm" data-testid="post-function-select"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {PRIMARY_FUNCTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderSection2 = () => {
    const levels = [
      { key: "Observer", desc: "I watch and listen but haven't tried AI myself" },
      { key: "Experimenter", desc: "I've tried a few things but nothing consistent" },
      { key: "Practitioner", desc: "I use AI tools regularly in my work" },
      { key: "Integrator", desc: "AI is embedded in my daily workflows" },
      { key: "Champion", desc: "I advocate for AI, teach others, and can architect solutions for my team" }
    ];
    return (
      <div className="space-y-5">
        <div>
          <Label className="text-gray-700 text-sm font-medium">Where are you now on the AI readiness spectrum?</Label>
          <div className="grid gap-2 mt-2">
            {levels.map(l => (
              <div key={l.key} onClick={() => updateField("readiness_level", l.key)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.005] ${
                  formData.readiness_level === l.key ? 'border-gold bg-gold/10 shadow-sm' : 'border-gray-200 hover:border-gold/50'
                }`}
                data-testid={`readiness-${l.key.toLowerCase()}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.readiness_level === l.key ? 'border-gold' : 'border-gray-300'}`}>
                    {formData.readiness_level === l.key && <div className="w-2 h-2 rounded-full bg-gold" />}
                  </div>
                  <span className="font-medium text-sm text-gray-900">{l.key}</span>
                </div>
                <p className="text-xs text-gray-500 ml-6 mt-0.5">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <MultiSelect options={AI_RELATIONSHIP_OPTIONS} selected={formData.ai_relationship} onChange={item => toggleArrayItem("ai_relationship", item)} label="How would you describe your relationship with AI tools now?" />
        <MultiSelect options={BARRIERS_REMOVED} selected={formData.barriers_removed} onChange={item => toggleArrayItem("barriers_removed", item)} label="What barriers have been removed?" />
      </div>
    );
  };

  const renderSection3 = () => (
    <div className="space-y-4">
      <div className="bg-gold/10 border border-gold/30 rounded-lg p-3">
        <p className="text-gold text-sm font-medium">Rating Scale</p>
        <p className="text-gray-600 text-xs mt-1">1 = Never used &middot; 5 = Built something with it this week</p>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
          <span className="text-xs font-medium text-gray-700">Tool</span>
          <div className="flex gap-1.5">
            {[1,2,3,4,5].map(n => <span key={n} className="w-9 text-center text-xs font-medium text-gray-500">{n}</span>)}
          </div>
        </div>
        <div className="divide-y divide-gray-100 px-3">
          {TOOL_LIST.map(tool => (
            <RatingRow key={tool} label={tool} value={formData.tool_ratings[tool] || 0}
              onChange={v => updateNestedField("tool_ratings", tool, v)} />
          ))}
        </div>
      </div>
      <div>
        <Label className="text-sm">Which tool surprised you most and why?</Label>
        <Textarea value={formData.tool_surprise} onChange={e => updateField("tool_surprise", e.target.value)}
          className="mt-1 min-h-[80px] text-sm" placeholder="The tool that surprised me most was..." data-testid="tool-surprise" />
      </div>
      <div>
        <Label className="text-sm">Which tool will you use most in the next 30 days?</Label>
        <Textarea value={formData.tool_next_30} onChange={e => updateField("tool_next_30", e.target.value)}
          className="mt-1 min-h-[80px] text-sm" placeholder="In the next 30 days I plan to use..." data-testid="tool-next-30" />
      </div>
    </div>
  );

  const renderSection4 = () => (
    <div className="space-y-5">
      {/* 4A Prompts */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-bold">A</span>
          Prompts
        </h3>
        <SingleSelect options={PROMPT_STATUS_OPTIONS} value={formData.prompt_status} onChange={v => updateField("prompt_status", v)} label="What best describes your prompt work?" />
        <div>
          <Label className="text-sm">Describe what you built</Label>
          <Textarea value={formData.prompt_description} onChange={e => updateField("prompt_description", e.target.value)}
            className="mt-1 min-h-[70px] text-sm" placeholder="Describe the prompts or skills you created..." data-testid="prompt-desc" />
        </div>
      </div>

      {/* 4B Agents */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-bold">B</span>
          Agents Built
        </h3>
        <MultiSelect options={AGENT_OPTIONS} selected={formData.agents_built} onChange={item => toggleArrayItem("agents_built", item)} label="Which agents did you build?" columns={2} />
      </div>

      {/* 4C Deployment Status */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-bold">C</span>
          Deployment Status
        </h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 min-w-[180px]">Build</th>
                  {DEPLOYMENT_STATUSES.map(s => (
                    <th key={s} className="px-2 py-2 text-xs font-medium text-gray-500 text-center whitespace-nowrap">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DEPLOYMENT_ITEMS.map(item => (
                  <tr key={item} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-xs text-gray-800">{item}</td>
                    {DEPLOYMENT_STATUSES.map(status => (
                      <td key={status} className="px-2 py-2 text-center">
                        <button type="button"
                          onClick={() => updateNestedField("deployment_status", item, status)}
                          className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                            formData.deployment_status[item] === status
                              ? status === "Active Use" ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                                : status === "In Testing" ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                                : status === "In Progress" ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                                : status === "Not Started" ? 'bg-gray-200 text-gray-700 ring-1 ring-gray-300'
                                : 'bg-gray-100 text-gray-500 ring-1 ring-gray-300'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          data-testid={`deploy-${item.slice(0,15)}-${status}`}
                        >
                          {formData.deployment_status[item] === status ? "\u2713" : "\u00B7"}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm">Which build had the biggest impact so far?</Label>
        <Textarea value={formData.biggest_impact} onChange={e => updateField("biggest_impact", e.target.value)}
          className="mt-1 min-h-[70px] text-sm" placeholder="The build with the biggest impact was..." data-testid="biggest-impact" />
      </div>
    </div>
  );

  const renderSection5 = () => (
    <div className="space-y-5">
      {/* 5A Task Table */}
      <div>
        <Label className="text-gray-700 text-sm font-medium mb-2 block">Tasks: Before vs. Now</Label>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-3 gap-2 px-3 py-2">
            <span className="text-xs font-medium text-gray-600">Task you named before</span>
            <span className="text-xs font-medium text-gray-600">How AI is addressing it now</span>
            <span className="text-xs font-medium text-gray-600">Time saved (estimate)</span>
          </div>
          {formData.capability_tasks.map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 px-3 py-2 border-b border-gray-100 last:border-0">
              <Input value={row.before} onChange={e => updateArrayRow("capability_tasks", i, "before", e.target.value)}
                className="text-xs h-8" placeholder="e.g., Monthly report" data-testid={`task-before-${i}`} />
              <Input value={row.ai_now} onChange={e => updateArrayRow("capability_tasks", i, "ai_now", e.target.value)}
                className="text-xs h-8" placeholder="e.g., AI drafts it" data-testid={`task-ainow-${i}`} />
              <Input value={row.time_saved} onChange={e => updateArrayRow("capability_tasks", i, "time_saved", e.target.value)}
                className="text-xs h-8" placeholder="e.g., 4 hours/week" data-testid={`task-saved-${i}`} />
            </div>
          ))}
        </div>
      </div>

      {/* 5B Challenges */}
      <MultiSelect options={WORKPLACE_CHALLENGES} selected={formData.challenges_addressed}
        onChange={item => toggleArrayItem("challenges_addressed", item)}
        label="Which workplace challenges are now being addressed?" />

      {/* 5C One Thing */}
      <SingleSelect options={ONE_THING_OPTIONS} value={formData.one_thing_status}
        onChange={v => updateField("one_thing_status", v)}
        label='Was "The One Thing" you identified addressed?' />

      {/* 5D Before/After */}
      <div>
        <Label className="text-sm">Complete the sentence:</Label>
        <div className="bg-navy/5 rounded-lg p-3 mt-1">
          <p className="text-xs text-gray-500 italic mb-2">"Before this programme I thought AI was... After this programme I know that AI is..."</p>
          <Textarea value={formData.before_after_ai} onChange={e => updateField("before_after_ai", e.target.value)}
            className="min-h-[100px] text-sm" placeholder="Before this programme I thought AI was..." data-testid="before-after" />
        </div>
      </div>
    </div>
  );

  const renderSection6 = () => (
    <div className="space-y-5">
      <div className="bg-gold/10 border border-gold/30 rounded-lg p-3">
        <p className="text-gold text-sm font-medium">Your 30-Day Commitment</p>
        <p className="text-gray-600 text-xs mt-1">Define what you will do consistently for the next 30 days.</p>
      </div>

      <div>
        <Label className="text-sm">The one AI tool, prompt, or workflow I will use every single working day for 30 days *</Label>
        <Input value={formData.daily_tool} onChange={e => updateField("daily_tool", e.target.value)}
          className="mt-1 text-sm" placeholder="e.g., Claude TABS-D framework for daily reports" data-testid="daily-tool" />
      </div>

      {/* Commitment Table */}
      <div>
        <Label className="text-gray-700 text-sm font-medium mb-2 block">30-Day Action Plan</Label>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-3 gap-2 px-3 py-2">
            <span className="text-xs font-medium text-gray-600">30-Day Action</span>
            <span className="text-xs font-medium text-gray-600">Target Date</span>
            <span className="text-xs font-medium text-gray-600">Who Will Hold Me Accountable</span>
          </div>
          {formData.commitments.map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 px-3 py-2 border-b border-gray-100 last:border-0">
              <Input value={row.action} onChange={e => updateArrayRow("commitments", i, "action", e.target.value)}
                className="text-xs h-8" placeholder="Action item" data-testid={`commit-action-${i}`} />
              <Input value={row.target_date} onChange={e => updateArrayRow("commitments", i, "target_date", e.target.value)}
                className="text-xs h-8" placeholder="e.g., 15 May 2026" data-testid={`commit-date-${i}`} />
              <Input value={row.accountable} onChange={e => updateArrayRow("commitments", i, "accountable", e.target.value)}
                className="text-xs h-8" placeholder="Name / role" data-testid={`commit-who-${i}`} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm">One colleague I will share this with in the next 2 weeks</Label>
        <Input value={formData.share_colleague} onChange={e => updateField("share_colleague", e.target.value)}
          className="mt-1 text-sm" placeholder="Colleague's name" data-testid="share-colleague" />
      </div>

      <div>
        <Label className="text-sm">The one thing that could stop me — and how I will address it</Label>
        <Textarea value={formData.obstacle_plan} onChange={e => updateField("obstacle_plan", e.target.value)}
          className="mt-1 min-h-[80px] text-sm" placeholder="What might hold me back and my plan to overcome it..." data-testid="obstacle-plan" />
      </div>
    </div>
  );

  const renderSection7 = () => (
    <div className="space-y-5">
      {/* 7A Session Ratings */}
      <div>
        <Label className="text-gray-700 text-sm font-medium mb-1 block">Session Ratings</Label>
        <p className="text-xs text-gray-400 mb-2">1 = Poor &middot; 5 = Outstanding</p>
        <div className="border border-gray-200 rounded-lg px-3 divide-y divide-gray-100">
          {SESSION_ITEMS.map(item => (
            <RatingRow key={item} label={item} value={formData.session_ratings[item] || 0}
              onChange={v => updateNestedField("session_ratings", item, v)} />
          ))}
        </div>
      </div>

      {/* 7B Facilitator Cards */}
      <div>
        <Label className="text-gray-700 text-sm font-medium mb-2 block">Facilitator Assessment</Label>

        {/* Card 1 - Dr. Celestine */}
        <div className="rounded-xl overflow-hidden mb-4 border border-navy/20">
          <div className="bg-[#0D2137] px-4 py-3">
            <h4 className="text-white font-heading text-base font-medium">Dr. Celestine N. Achi</h4>
            <p className="text-gray-300 text-[10px] mt-0.5">Lead Facilitator &middot; FIIM &middot; MNIPR &middot; MNIMC &middot; Dr. FAIMFIN</p>
          </div>
          <div className="bg-white px-4 py-3 divide-y divide-gray-100">
            {FACILITATOR_DIMENSIONS.map(d => (
              <RatingRow key={d.key} label={d.label} desc={d.desc}
                value={formData.facilitator1_ratings[d.key] || 0}
                onChange={v => updateNestedField("facilitator1_ratings", d.key, v)} />
            ))}
          </div>
          <div className="bg-white px-4 pb-3">
            <Label className="text-xs text-gray-500">Open comment about Dr. Achi's facilitation</Label>
            <Textarea value={formData.facilitator1_comment} onChange={e => updateField("facilitator1_comment", e.target.value)}
              className="mt-1 min-h-[60px] text-sm" placeholder="Your feedback..." data-testid="facilitator1-comment" />
          </div>
        </div>

        {/* Card 2 - Orimolade */}
        <div className="rounded-xl overflow-hidden border border-teal/20">
          <div className="bg-teal px-4 py-3">
            <h4 className="text-white font-heading text-base font-medium">Orimolade Oluwamuyemi A. FIIM</h4>
            <p className="text-gray-200 text-[10px] mt-0.5">Co-Facilitator &middot; Support Facilitation & Floor Management</p>
          </div>
          <div className="bg-white px-4 py-3 divide-y divide-gray-100">
            {FACILITATOR_DIMENSIONS.map(d => (
              <RatingRow key={`f2-${d.key}`} label={d.label} desc={d.desc}
                value={formData.facilitator2_ratings[d.key] || 0}
                onChange={v => updateNestedField("facilitator2_ratings", d.key, v)} />
            ))}
          </div>
          <div className="bg-white px-4 pb-3">
            <Label className="text-xs text-gray-500">How did Orimolade's support facilitation contribute to your experience?</Label>
            <Textarea value={formData.facilitator2_comment} onChange={e => updateField("facilitator2_comment", e.target.value)}
              className="mt-1 min-h-[60px] text-sm" placeholder="Your feedback..." data-testid="facilitator2-comment" />
          </div>
        </div>
      </div>

      {/* 7C NPS */}
      <div>
        <Label className="text-gray-700 text-sm font-medium mb-2 block">How likely are you to recommend this programme?</Label>
        <div className="flex flex-wrap gap-1.5">
          {[0,1,2,3,4,5,6,7,8,9,10].map(n => {
            const color = n <= 6 ? 'red' : n <= 8 ? 'amber' : 'green';
            const isSelected = formData.nps_score === n;
            return (
              <button key={n} type="button" onClick={() => updateField("nps_score", n)}
                className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                  isSelected
                    ? color === 'red' ? 'bg-red-500 text-white shadow-md'
                      : color === 'amber' ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-green-500 text-white shadow-md'
                    : 'border-2 border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
                data-testid={`nps-${n}`}
              >{n}</button>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
          <span>Not at all likely</span><span>Extremely likely</span>
        </div>
      </div>

      {/* 7D Open Feedback */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm">What was the most valuable thing you learned or built?</Label>
          <Textarea value={formData.most_valuable} onChange={e => updateField("most_valuable", e.target.value)}
            className="mt-1 min-h-[70px] text-sm" data-testid="most-valuable" />
        </div>
        <div>
          <Label className="text-sm">One thing to go deeper on in Cohort 2</Label>
          <Textarea value={formData.deeper_cohort2} onChange={e => updateField("deeper_cohort2", e.target.value)}
            className="mt-1 min-h-[70px] text-sm" data-testid="deeper-cohort2" />
        </div>
        <div>
          <Label className="text-sm">Message to the facilitation team</Label>
          <p className="text-[10px] text-gray-400 mt-0.5">Dr. Celestine N. Achi, Orimolade Oluwamuyemi A. FIIM, Yemi, and the L&D team — Celestina Okere and Iyanuoluwa Ojo</p>
          <Textarea value={formData.message_team} onChange={e => updateField("message_team", e.target.value)}
            className="mt-1 min-h-[70px] text-sm" data-testid="message-team" />
        </div>
      </div>
    </div>
  );

  const renderSection8 = () => (
    <div className="space-y-5">
      {/* 8A Goals Achieved */}
      <div>
        <Label className="text-gray-700 text-sm font-medium mb-2 block">Which learning goals have you achieved?</Label>
        <div className="grid gap-2">
          {LEARNING_GOALS.map(goal => (
            <div key={goal} onClick={() => toggleArrayItem("goals_achieved", goal)}
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                formData.goals_achieved.includes(goal) ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300'
              }`}
              data-testid={`goal-${goal.replace(/\s+/g, '-').toLowerCase().slice(0, 25)}`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                formData.goals_achieved.includes(goal) ? 'bg-green-500 text-white' : 'border-2 border-gray-300'
              }`}>
                {formData.goals_achieved.includes(goal) && "\u2713"}
              </div>
              <span className="text-gray-700 text-sm">{goal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 8B */}
      <div>
        <Label className="text-sm">Complete the sentence: "By the end of this programme, I am able to..."</Label>
        <Textarea value={formData.able_to} onChange={e => updateField("able_to", e.target.value)}
          className="mt-1 min-h-[80px] text-sm" placeholder="By the end of this programme, I am able to..." data-testid="able-to" />
      </div>

      {/* 8C */}
      <div>
        <Label className="text-sm">What would you tell the managers joining Cohort 2?</Label>
        <Textarea value={formData.advice_cohort2} onChange={e => updateField("advice_cohort2", e.target.value)}
          className="mt-1 min-h-[80px] text-sm" placeholder="My advice for Cohort 2..." data-testid="advice-cohort2" />
      </div>

      {/* 8D Follow-up */}
      <MultiSelect options={FOLLOWUP_OPTIONS} selected={formData.followup_interest}
        onChange={item => toggleArrayItem("followup_interest", item)}
        label="I am interested in:" />

      {/* Final */}
      <div>
        <Label className="text-sm">Final words — anything you want to tell us</Label>
        <Textarea value={formData.final_words} onChange={e => updateField("final_words", e.target.value)}
          className="mt-1 min-h-[100px] text-sm" placeholder="Any final thoughts, reflections, or messages..." data-testid="final-words" />
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 1: return renderSection1();
      case 2: return renderSection2();
      case 3: return renderSection3();
      case 4: return renderSection4();
      case 5: return renderSection5();
      case 6: return renderSection6();
      case 7: return renderSection7();
      case 8: return renderSection8();
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  const progress = (currentSection / 8) * 100;
  const SectionIcon = SECTIONS[currentSection - 1].icon;

  return (
    <div className="min-h-screen bg-navy">
      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={() => {}}>
        <DialogContent className="bg-white sm:max-w-sm" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-gray-900">Post-Training Evaluation</DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Enter your email to begin or resume your evaluation.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3">
            <Label className="text-gray-700 text-sm font-medium">Work Email</Label>
            <Input type="email" value={emailInput} onChange={e => { setEmailInput(e.target.value); setEmailError(""); }}
              className="mt-1.5 border-gray-300 focus:border-gold focus:ring-gold" placeholder="you@leadway.com"
              onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()} data-testid="post-eval-email" />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            <Button onClick={handleEmailSubmit}
              className="w-full mt-3 btn-gradient text-white font-semibold py-2.5"
              data-testid="post-eval-continue">
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="sticky top-0 z-50 glass bg-navy/90 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Leadway" className="h-7 w-auto" />
            <span className="text-white font-heading text-sm hidden sm:block">Post-Training Evaluation</span>
          </div>
          <Button variant="ghost" onClick={saveDraft} disabled={isSaving || !email} className="text-gray-400 hover:text-white h-8 px-2 text-xs" data-testid="post-save-draft">
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span className="ml-1 hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </header>

      {/* Section Pills */}
      <div className="bg-navy/50 border-b border-white/5 py-2 overflow-x-auto">
        <div className="max-w-3xl mx-auto px-4 flex gap-1">
          {SECTIONS.map(section => {
            const Icon = section.icon;
            return (
              <button key={section.id}
                onClick={() => section.id <= currentSection && setCurrentSection(section.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                  section.id === currentSection
                    ? 'bg-gold text-navy font-medium'
                    : section.id < currentSection
                    ? 'bg-white/10 text-white hover:bg-white/20 cursor-pointer'
                    : 'bg-white/5 text-gray-500'
                }`}
                disabled={section.id > currentSection}
                data-testid={`post-section-pill-${section.id}`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{section.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Card */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Hero Headline */}
        <h1 className="font-heading text-2xl md:text-3xl text-white text-center mb-5">
          How Far Have You{" "}
          <span className="italic text-gold">Travelled?</span>
        </h1>

        <Card className="bg-white shadow-lg border-0 overflow-hidden">
          <div className="h-1 bg-gray-100">
            <div className="h-full progress-gradient transition-all duration-500" style={{ width: `${progress}%` }} data-testid="post-progress-bar" />
          </div>

          <CardHeader className="py-4 px-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <SectionIcon className="w-5 h-5 text-gold" />
              <div>
                <CardTitle className="font-heading text-xl text-gray-900">{SECTIONS[currentSection - 1].title}</CardTitle>
                <CardDescription className="text-gray-500 text-xs mt-0.5">Section {currentSection} of 8</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="form-section">{renderCurrentSection()}</div>
          </CardContent>

          <div className="px-5 pb-5 flex items-center justify-between pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={handleBack} disabled={currentSection === 1}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 px-4 text-sm" data-testid="post-back-btn">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            {currentSection === 8 ? (
              <Button onClick={handleSubmit} disabled={isSaving}
                className="btn-gradient text-white font-semibold h-9 px-6 text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
                data-testid="post-submit-btn">
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <>Submit <CheckCircle2 className="w-4 h-4 ml-1" /></>}
              </Button>
            ) : (
              <Button onClick={handleNext}
                className="btn-gradient text-white font-semibold h-9 px-6 text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
                data-testid="post-next-btn">
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default PostEvaluation;

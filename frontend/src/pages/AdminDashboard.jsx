import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Download, LogOut, Search, Filter, Eye, ChevronLeft, ChevronRight, TrendingUp, Shield, Lightbulb, RefreshCw, Loader2, AlertTriangle, CheckCircle, Info, Target, BookOpen, Zap, FileText, Building, UserCheck, Clock, ClipboardCheck, Star, MessageSquare, Rocket } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";

const SUBSIDIARIES = ["Leadway Assurance", "Leadway Pensure", "Leadway Health", "Leadway Asset Management", "Leadway Trustees", "Shared Services", "Other"];
const READINESS_BANDS = ["Beginner", "Explorer", "Emerging Practitioner", "Applied User", "Champion Candidate"];
const BAND_COLORS = { "Beginner": "#EF4444", "Explorer": "#F59E0B", "Emerging Practitioner": "#3B82F6", "Applied User": "#10B981", "Champion Candidate": "#D4AF37" };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [subsidiaryFilter, setSubsidiaryFilter] = useState("");
  const [bandFilter, setBandFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [postEvalStats, setPostEvalStats] = useState(null);
  const [selectedPostEval, setSelectedPostEval] = useState(null);
  const pageSize = 8;

  const loadPostEvalDetail = async (evalSummary) => {
    try {
      const res = await axios.get(`${API}/post-evaluations`, { params: { limit: 200 } });
      const full = res.data.evaluations.find(e => e.id === evalSummary.id);
      setSelectedPostEval(full || evalSummary);
    } catch { setSelectedPostEval(evalSummary); }
  };

  useEffect(() => {
    if (!sessionStorage.getItem("leadway_admin")) { navigate("/admin"); return; }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSubmissions(); }, [subsidiaryFilter, bandFilter, currentPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, submissionsRes, reportRes, postEvalRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/submissions`, { params: { limit: pageSize, skip: 0 } }),
        axios.get(`${API}/admin/report`),
        axios.get(`${API}/admin/post-eval-stats`).catch(() => ({ data: { total: 0 } }))
      ]);
      setStats(statsRes.data);
      setSubmissions(submissionsRes.data.submissions);
      setTotalSubmissions(submissionsRes.data.total);
      setReport(reportRes.data);
      setPostEvalStats(postEvalRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const params = { limit: pageSize, skip: currentPage * pageSize };
      if (subsidiaryFilter && subsidiaryFilter !== "all") params.subsidiary = subsidiaryFilter;
      if (bandFilter && bandFilter !== "all") params.readiness_band = bandFilter;
      const response = await axios.get(`${API}/submissions`, { params });
      setSubmissions(response.data.submissions);
      setTotalSubmissions(response.data.total);
    } catch (error) { console.error(error); }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/admin/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leadway_ai_readiness_submissions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV exported");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.info("Generating PDF report...");
      const response = await axios.get(`${API}/admin/report/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Leadway_AI_Readiness_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF report downloaded");
    } catch (error) {
      toast.error(error.response?.status === 404 ? "No data for report" : "PDF export failed");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("leadway_admin");
    navigate("/admin");
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return sub.full_name?.toLowerCase().includes(q) || sub.email?.toLowerCase().includes(q);
  });

  const getBandBadge = (band) => {
    const styles = {
      "Beginner": "bg-red-100 text-red-700",
      "Explorer": "bg-amber-100 text-amber-700",
      "Emerging Practitioner": "bg-blue-100 text-blue-700",
      "Applied User": "bg-green-100 text-green-700",
      "Champion Candidate": "bg-gradient-to-r from-sunset-orange to-gold text-white"
    };
    return styles[band] || "bg-gray-100 text-gray-700";
  };

  const getSummaryIcon = (type) => {
    switch(type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'positive': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const subsidiaryChartData = stats?.by_subsidiary ? Object.entries(stats.by_subsidiary).map(([name, count]) => ({ name: name.replace("Leadway ", ""), count })) : [];
  const bandChartData = stats?.by_readiness_band ? Object.entries(stats.by_readiness_band).map(([name, value]) => ({ name, value })) : [];
  const painPointsData = stats?.top_pain_points || [];
  const benefitAreasData = stats?.top_benefit_areas || [];
  const toolsData = stats?.ai_tools_usage || [];
  const totalPages = Math.ceil(totalSubmissions / pageSize);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-navy shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Leadway" className="h-8 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-white font-heading text-base font-medium leading-tight">Admin Dashboard</h1>
              <p className="text-gray-400 text-[10px]">AI Readiness Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportPDF} size="sm" className="bg-gold/20 text-gold hover:bg-gold hover:text-navy h-8 text-xs" data-testid="export-pdf-btn">
              <FileText className="w-3.5 h-3.5 mr-1" /> PDF Report
            </Button>
            <Button onClick={handleExport} size="sm" className="bg-gold/20 text-gold hover:bg-gold hover:text-navy h-8 text-xs" data-testid="export-csv-btn">
              <Download className="w-3.5 h-3.5 mr-1" /> CSV
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-gray-400 hover:text-white h-8 text-xs" data-testid="logout-btn">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard icon={Users} label="Submissions" value={stats?.total_submissions || 0} color="bg-navy" iconColor="text-gold" />
          <StatCard icon={TrendingUp} label="Avg Readiness" value={stats?.average_scores?.avg_ai_readiness?.toFixed(1) || "0"} color="bg-blue-500" iconColor="text-white" />
          <StatCard icon={Lightbulb} label="Avg Opportunity" value={stats?.average_scores?.avg_opportunity_density?.toFixed(1) || "0"} color="bg-green-500" iconColor="text-white" />
          <StatCard icon={Shield} label="Avg Governance" value={stats?.average_scores?.avg_governance_sensitivity?.toFixed(1) || "0"} color="bg-amber-500" iconColor="text-white" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="report" className="text-xs">Full Report</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
            <TabsTrigger value="submissions" className="text-xs">Submissions</TabsTrigger>
            <TabsTrigger value="posteval" className="text-xs" data-testid="posteval-tab">
              Post-Eval {postEvalStats?.total > 0 && <Badge className="ml-1 bg-teal text-white text-[9px] px-1 py-0">{postEvalStats.total}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="font-heading text-base text-gray-900">By Subsidiary</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subsidiaryChartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0B1320', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                        <Bar dataKey="count" fill="#D4AF37" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="font-heading text-base text-gray-900">Readiness Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={bandChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                          {bandChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={BAND_COLORS[entry.name] || "#9CA3AF"} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0B1320', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-1">
                    {bandChartData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1 text-[10px]">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BAND_COLORS[entry.name] }} />
                        <span className="text-gray-600">{entry.name.split(' ')[0]} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Full Report Tab */}
          <TabsContent value="report" className="space-y-4">
            {report && report.total_submissions > 0 ? (
              <div className="space-y-4">
                {/* Executive Summary */}
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-gray-100">
                    <CardTitle className="font-heading text-lg text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gold" /> Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid gap-3">
                      {report.executive_summary?.map((item, i) => (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                          item.type === 'positive' ? 'bg-green-50' : 
                          item.type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
                        }`}>
                          {getSummaryIcon(item.type)}
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                            <p className="text-gray-600 text-xs mt-1">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Overall Scores */}
                <div className="grid grid-cols-3 gap-3">
                  <ScoreCard title="AI Readiness" score={report.overall_scores?.ai_readiness} color="blue" icon={TrendingUp} />
                  <ScoreCard title="Opportunity Density" score={report.overall_scores?.opportunity_density} color="green" icon={Lightbulb} />
                  <ScoreCard title="Governance Sensitivity" score={report.overall_scores?.governance_sensitivity} color="amber" icon={Shield} />
                </div>

                {/* Training Recommendations */}
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-gray-100">
                    <CardTitle className="font-heading text-base text-gray-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-500" /> Training Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {report.training_recommendations?.map((rec, i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-[10px] ${rec.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {rec.priority}
                            </Badge>
                            <span className="font-medium text-gray-900 text-sm">{rec.area}</span>
                          </div>
                          <p className="text-gray-700 text-xs">{rec.recommendation}</p>
                          <p className="text-gray-500 text-[10px] mt-1 italic">{rec.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Subsidiary Breakdown */}
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-gray-100">
                    <CardTitle className="font-heading text-base text-gray-900 flex items-center gap-2">
                      <Building className="w-4 h-4 text-navy" /> Subsidiary Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs">Subsidiary</TableHead>
                          <TableHead className="text-xs text-center">Participants</TableHead>
                          <TableHead className="text-xs text-center">Avg AI</TableHead>
                          <TableHead className="text-xs text-center">Avg Opp</TableHead>
                          <TableHead className="text-xs text-center">Avg Gov</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(report.subsidiary_breakdown || {}).map(([name, data]) => (
                          <TableRow key={name}>
                            <TableCell className="text-xs font-medium">{name}</TableCell>
                            <TableCell className="text-xs text-center">{data.count}</TableCell>
                            <TableCell className="text-xs text-center text-blue-600 font-medium">{data.avg_ai}</TableCell>
                            <TableCell className="text-xs text-center text-green-600 font-medium">{data.avg_opp}</TableCell>
                            <TableCell className="text-xs text-center text-amber-600 font-medium">{data.avg_gov}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Capstone Projects */}
                {report.capstone_projects?.length > 0 && (
                  <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="py-3 px-4 border-b border-gray-100">
                      <CardTitle className="font-heading text-base text-gray-900 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-gold" /> Capstone Project Ideas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {report.capstone_projects.map((project, i) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-3 hover:border-gold/50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 text-sm">{project.name}</span>
                              <Badge variant="outline" className="text-[10px]">{project.subsidiary?.replace("Leadway ", "")}</Badge>
                            </div>
                            <p className="text-gray-700 text-xs">{project.problem}</p>
                            {project.impact && (
                              <p className="text-gray-500 text-[10px] mt-2">
                                <span className="font-medium">Expected Impact:</span> {project.impact}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Key Findings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FindingsCard title="Top Pain Points" icon={Zap} color="amber" items={report.top_pain_points} />
                  <FindingsCard title="Top Benefit Areas" icon={Lightbulb} color="green" items={report.top_benefit_areas} />
                  <FindingsCard title="Learning Expectations" icon={BookOpen} color="purple" items={report.learning_expectations} />
                  <FindingsCard title="AI Tools Adoption" icon={TrendingUp} color="blue" items={report.ai_tools_adoption} />
                </div>
              </div>
            ) : (
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-gray-900 font-medium mb-2">No Report Available</h3>
                  <p className="text-gray-500 text-sm">The comprehensive report will be generated once submissions are received.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <AnalysisCard title="Top Pain Points" icon={Zap} color="amber" data={painPointsData} />
              <AnalysisCard title="Top AI Benefit Areas" icon={Lightbulb} color="green" data={benefitAreasData} />
              <AnalysisCard title="AI Tools Usage" icon={TrendingUp} color="blue" data={toolsData} />
              <AnalysisCard title="Learning Expectations" icon={BookOpen} color="purple" data={stats?.learning_expectations || []} />
            </div>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="font-heading text-base text-gray-900">All Submissions</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-7 h-8 w-[140px] text-xs" data-testid="search-input" />
                    </div>
                    <Select value={subsidiaryFilter} onValueChange={setSubsidiaryFilter}>
                      <SelectTrigger className="w-[130px] h-8 text-xs" data-testid="subsidiary-filter">
                        <Filter className="w-3 h-3 mr-1 text-gray-400" />
                        <SelectValue placeholder="Subsidiary" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {SUBSIDIARIES.map(sub => <SelectItem key={sub} value={sub} className="text-xs">{sub}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={bandFilter} onValueChange={setBandFilter}>
                      <SelectTrigger className="w-[120px] h-8 text-xs" data-testid="band-filter">
                        <SelectValue placeholder="Band" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Bands</SelectItem>
                        {READINESS_BANDS.map(band => <SelectItem key={band} value={band} className="text-xs">{band}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchData} className="h-8 w-8" data-testid="refresh-btn">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="text-xs font-semibold py-2">Name</TableHead>
                        <TableHead className="text-xs font-semibold py-2">Subsidiary</TableHead>
                        <TableHead className="text-xs font-semibold py-2 text-center">AI</TableHead>
                        <TableHead className="text-xs font-semibold py-2 text-center">Opp</TableHead>
                        <TableHead className="text-xs font-semibold py-2 text-center">Gov</TableHead>
                        <TableHead className="text-xs font-semibold py-2">Band</TableHead>
                        <TableHead className="text-xs font-semibold py-2 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-6 text-gray-500 text-sm">No submissions yet</TableCell></TableRow>
                      ) : (
                        filteredSubmissions.map((sub) => (
                          <TableRow key={sub.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedSubmission(sub)}>
                            <TableCell className="py-2">
                              <div className="text-sm font-medium text-gray-900">{sub.full_name}</div>
                              <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{sub.email}</div>
                            </TableCell>
                            <TableCell className="text-xs text-gray-600 py-2">{sub.subsidiary?.replace("Leadway ", "")}</TableCell>
                            <TableCell className="text-center py-2"><span className="text-xs font-semibold text-blue-600">{sub.ai_readiness_score}</span></TableCell>
                            <TableCell className="text-center py-2"><span className="text-xs font-semibold text-green-600">{sub.opportunity_density_score}</span></TableCell>
                            <TableCell className="text-center py-2"><span className="text-xs font-semibold text-amber-600">{sub.governance_sensitivity_score}</span></TableCell>
                            <TableCell className="py-2">
                              <Badge className={`${getBandBadge(sub.readiness_band)} text-[10px] px-1.5 py-0.5`}>{sub.readiness_band?.split(' ')[0]}</Badge>
                            </TableCell>
                            <TableCell className="py-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-navy" data-testid={`view-${sub.id}`}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
                    <span className="text-gray-500 text-xs">{currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalSubmissions)} of {totalSubmissions}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="h-7 w-7" data-testid="prev-page">
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-xs text-gray-600 px-2">{currentPage + 1}/{totalPages}</span>
                      <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1} className="h-7 w-7" data-testid="next-page">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Post-Eval Tab */}
          <TabsContent value="posteval" className="space-y-4">
            {postEvalStats?.total > 0 ? (
              <PostEvalTabContent stats={postEvalStats} onViewDetail={loadPostEvalDetail} />
            ) : (
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <ClipboardCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-gray-900 font-medium mb-2">No Post-Evaluations Yet</h3>
                  <p className="text-gray-500 text-sm">Post-training evaluations will appear here once participants submit them.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Pre-Training Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{selectedSubmission?.full_name}</DialogTitle>
            <DialogDescription className="text-xs">{selectedSubmission?.email} | {selectedSubmission?.subsidiary}</DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-blue-600 text-[10px] font-medium">AI Readiness</p>
                    <p className="text-2xl font-bold text-blue-700">{selectedSubmission.ai_readiness_score}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-green-600 text-[10px] font-medium">Opportunity</p>
                    <p className="text-2xl font-bold text-green-700">{selectedSubmission.opportunity_density_score}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-amber-600 text-[10px] font-medium">Governance</p>
                    <p className="text-2xl font-bold text-amber-700">{selectedSubmission.governance_sensitivity_score}</p>
                  </div>
                </div>

                <div className="text-center">
                  <Badge className={`${getBandBadge(selectedSubmission.readiness_band)} text-xs px-3 py-1`}>{selectedSubmission.readiness_band}</Badge>
                </div>

                {selectedSubmission.ai_readiness_breakdown && (
                  <DetailSection title="AI Readiness Breakdown" items={
                    Object.entries(selectedSubmission.ai_readiness_breakdown).map(([k, v]) => ({
                      l: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                      v: `${v} pts`
                    }))
                  } />
                )}

                {selectedSubmission.insights?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-blue-50 px-3 py-1.5 border-b border-gray-200">
                      <h3 className="font-medium text-blue-900 text-xs flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Personalized Insights
                      </h3>
                    </div>
                    <div className="p-3">
                      <ul className="space-y-1.5">
                        {selectedSubmission.insights.map((insight, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {selectedSubmission.recommendations?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-green-50 px-3 py-1.5 border-b border-gray-200">
                      <h3 className="font-medium text-green-900 text-xs flex items-center gap-1">
                        <Target className="w-3 h-3" /> Training Recommendations
                      </h3>
                    </div>
                    <div className="p-3">
                      <ul className="space-y-1.5">
                        {selectedSubmission.recommendations.map((rec, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {selectedSubmission.training_focus_areas?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-purple-50 px-3 py-1.5 border-b border-gray-200">
                      <h3 className="font-medium text-purple-900 text-xs flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Focus Areas
                      </h3>
                    </div>
                    <div className="p-3 flex flex-wrap gap-1.5">
                      {selectedSubmission.training_focus_areas.map((area, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <DetailSection title="Profile" items={[
                  { l: "Job Title", v: selectedSubmission.job_title },
                  { l: "Department", v: selectedSubmission.department },
                  { l: "Years in Role", v: selectedSubmission.years_in_role },
                  { l: "Role Level", v: selectedSubmission.role_level }
                ]} />

                <DetailSection title="Capstone Opportunity" items={[
                  { l: "Problem", v: selectedSubmission.capstone_problem },
                  { l: "Success Definition", v: selectedSubmission.success_definition },
                  { l: "Expected Impact", v: selectedSubmission.capstone_impact }
                ]} />
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Post-Eval Detail Dialog */}
      <Dialog open={!!selectedPostEval} onOpenChange={() => setSelectedPostEval(null)}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{selectedPostEval?.data?.full_name || "Participant"}</DialogTitle>
            <DialogDescription className="text-xs">{selectedPostEval?.email} | {selectedPostEval?.data?.subsidiary_department}</DialogDescription>
          </DialogHeader>
          {selectedPostEval && (
            <ScrollArea className="max-h-[65vh] pr-4">
              <PostEvalDetail eval={selectedPostEval} />
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, iconColor }) => (
  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
    <CardContent className="p-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const ScoreCard = ({ title, score, color, icon: Icon }) => (
  <Card className="bg-white border-0 shadow-sm">
    <CardContent className="p-4 text-center">
      <div className={`w-10 h-10 rounded-full bg-${color}-100 flex items-center justify-center mx-auto mb-2`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
      <p className="text-gray-500 text-xs mb-1">{title}</p>
      <p className={`text-3xl font-bold text-${color}-600`}>{score || 0}</p>
      <p className="text-gray-400 text-[10px]">out of 100</p>
    </CardContent>
  </Card>
);

const AnalysisCard = ({ title, icon: Icon, color, data }) => (
  <Card className="bg-white border-0 shadow-sm">
    <CardHeader className="py-3 px-4">
      <CardTitle className="font-heading text-base text-gray-900 flex items-center gap-2">
        <Icon className={`w-4 h-4 text-${color}-500`} /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3">
      {data?.length > 0 ? (
        <div className="space-y-2">
          {data.slice(0, 5).map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs text-gray-700 truncate flex-1">{item.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-${color}-500 rounded-full`} style={{ width: `${(item.count / (data[0]?.count || 1)) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-500 w-6 text-right">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-xs text-center py-4">No data yet</p>
      )}
    </CardContent>
  </Card>
);

const FindingsCard = ({ title, icon: Icon, color, items }) => (
  <Card className="bg-white border-0 shadow-sm">
    <CardHeader className="py-2 px-3 border-b border-gray-100">
      <CardTitle className="font-heading text-sm text-gray-900 flex items-center gap-2">
        <Icon className={`w-4 h-4 text-${color}-500`} /> {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3">
      {items?.length > 0 ? (
        <div className="space-y-1.5">
          {items.slice(0, 5).map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-gray-700 truncate flex-1">{item.name}</span>
              <Badge variant="outline" className="text-[10px] ml-2">{item.percentage}%</Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-xs text-center py-2">No data</p>
      )}
    </CardContent>
  </Card>
);

const DetailSection = ({ title, items }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
      <h3 className="font-medium text-gray-900 text-xs">{title}</h3>
    </div>
    <div className="p-3 space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 text-xs">
          <span className="text-gray-500 min-w-[90px] shrink-0">{item.l}:</span>
          <span className="text-gray-900">{item.v || "—"}</span>
        </div>
      ))}
    </div>
  </div>
);

const NPS_COLORS = { promoters: "#10B981", passives: "#F59E0B", detractors: "#EF4444" };
const READINESS_COLORS = { Observer: "#9CA3AF", Experimenter: "#F59E0B", Practitioner: "#3B82F6", Integrator: "#10B981", Champion: "#D4AF37" };
const DIM_LABELS = { expertise: "Subject Matter Expertise", delivery: "Delivery & Communication", facilitation: "Hands-On Facilitation", immersive: "Immersive Experience", support: "Participant Support" };

const RatingBar = ({ label, value, max = 5 }) => (
  <div className="flex items-center gap-2 py-1">
    <span className="text-xs text-gray-700 flex-1 min-w-0 truncate">{label}</span>
    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0">
      <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(value / max) * 100}%` }} />
    </div>
    <span className="text-xs font-semibold text-gray-900 w-8 text-right shrink-0">{value}</span>
  </div>
);

const PostEvalTabContent = ({ stats, onViewDetail }) => {
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
  const npsData = [
    { name: "Promoters (9-10)", value: stats.nps?.distribution?.promoters || 0 },
    { name: "Passives (7-8)", value: stats.nps?.distribution?.passives || 0 },
    { name: "Detractors (0-6)", value: stats.nps?.distribution?.detractors || 0 }
  ].filter(d => d.value > 0);

  const readinessData = Object.entries(stats.readiness_distribution || {}).map(([k, v]) => ({ name: k, value: v }));
  const eff = stats.programme_effectiveness || {};
  const commitSummary = stats.commitment_summary || {};
  const feedback = stats.feedback_highlights || {};
  const agents = stats.agents_built_summary || {};
  const capShift = stats.capability_shift_summary || {};

  const handleExportPDF = async () => {
    try {
      toast.info("Generating consulting report...");
      const response = await axios.get(`${API}/admin/post-eval-report/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Leadway_Post_Evaluation_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF report downloaded");
    } catch (error) {
      toast.error(error.response?.status === 404 ? "No data for report" : "PDF export failed");
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API}/admin/post-eval-export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Leadway_Post_Evaluation_Responses.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV exported");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  return (
    <div className="space-y-4">
      {/* Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-gray-500">{stats.total} evaluation{stats.total !== 1 ? 's' : ''} submitted</div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} size="sm" className="bg-[#0D2137] text-white hover:bg-[#0D2137]/80 h-8 text-xs" data-testid="posteval-export-pdf">
            <FileText className="w-3.5 h-3.5 mr-1" /> Consulting PDF Report
          </Button>
          <Button onClick={handleExportCSV} size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 h-8 text-xs" data-testid="posteval-export-csv">
            <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Programme Grade Card + Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-[#0D2137] border-0 shadow-lg col-span-2 lg:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-gold text-[10px] font-medium tracking-wider uppercase">Programme Grade</p>
            <p className="text-4xl font-bold text-white font-heading my-1">{eff.grade || "—"}</p>
            <p className="text-gray-400 text-[10px]">{eff.programme_score || 0}/100</p>
            <p className="text-teal text-[10px] mt-1 font-medium">{eff.nps_classification || ""}</p>
          </CardContent>
        </Card>
        <StatCard icon={ClipboardCheck} label="Evaluations" value={stats.total} color="bg-teal" iconColor="text-white" />
        <StatCard icon={Star} label="NPS Average" value={`${stats.nps?.average ?? "—"}/10`} color="bg-gold" iconColor="text-white" />
        <StatCard icon={TrendingUp} label="NPS Net Score" value={stats.nps?.net_score ?? "—"} color={stats.nps?.net_score >= 50 ? "bg-green-500" : stats.nps?.net_score >= 0 ? "bg-amber-500" : "bg-red-500"} iconColor="text-white" />
        <StatCard icon={Target} label="Commitment Rate" value={`${commitSummary.commitment_rate || 0}%`} color="bg-purple-500" iconColor="text-white" />
      </div>

      {/* NPS + Readiness Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="font-heading text-base text-gray-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-gold" /> NPS Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={npsData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {npsData.map((entry, i) => (
                      <Cell key={i} fill={Object.values(NPS_COLORS)[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0B1320', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-1">
              {npsData.map((e, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: Object.values(NPS_COLORS)[i] }} />
                  <span className="text-gray-600">{e.name} ({e.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4">
            <CardTitle className="font-heading text-base text-gray-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-500" /> Readiness Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={readinessData} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B1320', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {readinessData.map((entry, i) => (
                      <Cell key={i} fill={READINESS_COLORS[entry.name] || "#9CA3AF"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Ratings + Facilitator Ratings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-gray-100">
            <CardTitle className="font-heading text-sm text-gray-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Session Ratings (Avg)
            </CardTitle>
            <p className="text-[10px] text-gray-400">Overall: {eff.overall_session_avg}/5</p>
          </CardHeader>
          <CardContent className="p-3">
            {Object.entries(stats.session_ratings || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <RatingBar key={k} label={k} value={v} />
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-gray-100" style={{ borderTop: "3px solid #0D2137" }}>
            <CardTitle className="font-heading text-sm text-gray-900">Dr. Celestine N. Achi</CardTitle>
            <p className="text-[10px] text-gray-400">Lead Facilitator</p>
          </CardHeader>
          <CardContent className="p-3">
            {Object.entries(stats.facilitator1_ratings || {}).map(([k, v]) => (
              <RatingBar key={k} label={DIM_LABELS[k] || k} value={v} />
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-gray-100" style={{ borderTop: "3px solid #006D77" }}>
            <CardTitle className="font-heading text-sm text-gray-900">Orimolade Oluwamuyemi A.</CardTitle>
            <p className="text-[10px] text-gray-400">Co-Facilitator</p>
          </CardHeader>
          <CardContent className="p-3">
            {Object.entries(stats.facilitator2_ratings || {}).map(([k, v]) => (
              <RatingBar key={k} label={DIM_LABELS[k] || k} value={v} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tool Comfort + Agents Built */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-gray-100">
            <CardTitle className="font-heading text-sm text-gray-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-teal" /> Tool Comfort Ratings (Avg)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            {Object.entries(stats.tool_averages || {}).sort((a, b) => b[1] - a[1]).map(([tool, avg]) => (
              <RatingBar key={tool} label={tool} value={avg} />
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-gray-100">
            <CardTitle className="font-heading text-sm text-gray-900 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-gold" /> Agents Built
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            {agents.agents_built?.length > 0 ? (
              <div className="space-y-1.5">
                {agents.agents_built.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 truncate flex-1">{a.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: `${a.percentage}%` }} />
                      </div>
                      <span className="text-gray-500 text-[10px] w-14 text-right">{a.percentage}% ({a.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-xs text-center py-4">No data</p>}
            {agents.prompt_status?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium mb-1.5">Prompt Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {agents.prompt_status.map((p, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-gold/5 text-gold border-gold/20">{p.status} ({p.count})</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deployment Status Heatmap */}
      {Object.keys(stats.deployment_summary || {}).length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-gray-100">
            <CardTitle className="font-heading text-sm text-gray-900 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-teal" /> Deployment Status Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-medium text-gray-600 min-w-[180px]">Build</th>
                    {["Active Use", "In Testing", "In Progress", "Not Started", "Not Relevant"].map(s => (
                      <th key={s} className="px-2 py-2 font-medium text-gray-500 text-center text-[10px]">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(stats.deployment_summary).map(([item, statuses]) => (
                    <tr key={item} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-gray-800 text-[11px]">{item}</td>
                      {["Active Use", "In Testing", "In Progress", "Not Started", "Not Relevant"].map(s => {
                        const count = statuses[s] || 0;
                        const bg = count === 0 ? '' : s === "Active Use" ? 'bg-green-100 text-green-700' :
                          s === "In Testing" ? 'bg-blue-100 text-blue-700' : s === "In Progress" ? 'bg-amber-100 text-amber-700' :
                          s === "Not Started" ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-400';
                        return (
                          <td key={s} className="px-2 py-1.5 text-center">
                            {count > 0 && <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${bg}`}>{count}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capability Shift + Goals + One Thing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-gray-100">
            <CardTitle className="font-heading text-sm text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Workplace Challenges Addressed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            {capShift.challenges_addressed?.length > 0 ? (
              <div className="space-y-1.5">
                {capShift.challenges_addressed.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 truncate flex-1 pr-2">{c.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                      </div>
                      <span className="text-gray-500 text-[10px] w-8 text-right">{c.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-xs text-center py-4">No data</p>}
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-gray-100">
            <CardTitle className="font-heading text-sm text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" /> Goals Achieved
            </CardTitle>
            <p className="text-[10px] text-gray-400">Avg achievement: {eff.avg_goal_achievement || 0}%</p>
          </CardHeader>
          <CardContent className="p-3">
            {stats.goals_achieved?.length > 0 ? (
              <div className="space-y-1.5">
                {stats.goals_achieved.map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 truncate flex-1 pr-2">{g.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${g.percentage}%` }} />
                      </div>
                      <span className="text-gray-500 text-[10px] w-8 text-right">{g.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-xs text-center py-4">No data</p>}
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-gray-100">
            <CardTitle className="font-heading text-sm text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" /> "The One Thing" Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            {Object.keys(stats.one_thing_status || {}).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stats.one_thing_status).map(([status, count]) => {
                  const pct = Math.round(count / stats.total * 100);
                  const color = status.includes("fully") ? "bg-green-500" : status.includes("Partially") ? "bg-amber-500" : status.includes("know how") ? "bg-blue-500" : "bg-red-400";
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-gray-700">{status}</span>
                        <span className="text-[10px] text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-gray-400 text-xs text-center py-4">No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* 30-Day Commitments */}
      {commitSummary.top_daily_tools?.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-gray-100">
            <CardTitle className="font-heading text-sm text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" /> 30-Day Commitments
            </CardTitle>
            <p className="text-[10px] text-gray-400">{commitSummary.participants_committed}/{stats.total} participants committed ({commitSummary.commitment_rate}%)</p>
          </CardHeader>
          <CardContent className="p-3">
            <p className="text-[10px] text-gray-400 font-medium mb-2">Top Committed Daily Tools</p>
            <div className="space-y-1.5">
              {commitSummary.top_daily_tools.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">{t.tool}</span>
                  <Badge variant="outline" className="text-[10px]">{t.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Highlights */}
      {(feedback.most_valuable?.length > 0 || feedback.team_messages?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {feedback.most_valuable?.length > 0 && (
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-gray-100">
                <CardTitle className="font-heading text-sm text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" /> Most Valuable Learnings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {feedback.most_valuable.slice(0, 5).map((f, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs text-gray-800 italic">"{f.text}"</p>
                    <p className="text-[10px] text-gray-400 mt-1">— {f.name}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {feedback.team_messages?.length > 0 && (
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-gray-100">
                <CardTitle className="font-heading text-sm text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gold" /> Messages to the Team
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {feedback.team_messages.slice(0, 5).map((f, i) => (
                  <div key={i} className="bg-gold/5 border border-gold/10 rounded-lg p-2.5">
                    <p className="text-xs text-gray-800 italic">"{f.text}"</p>
                    <p className="text-[10px] text-gray-400 mt-1">— {f.name}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Before/After Reflections */}
      {capShift.before_after_reflections?.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-gray-100">
            <CardTitle className="font-heading text-sm text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal" /> Before & After Reflections
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {capShift.before_after_reflections.slice(0, 5).map((r, i) => (
              <div key={i} className="bg-teal/5 border border-teal/10 rounded-lg p-2.5">
                <p className="text-xs text-gray-800 italic">"{r.text}"</p>
                <p className="text-[10px] text-gray-400 mt-1">— {r.name}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Submissions Table */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="py-3 px-4 border-b border-gray-100">
          <CardTitle className="font-heading text-base text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal" /> Post-Evaluation Submissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-xs font-semibold py-2">Name</TableHead>
                  <TableHead className="text-xs font-semibold py-2">Dept</TableHead>
                  <TableHead className="text-xs font-semibold py-2">Readiness</TableHead>
                  <TableHead className="text-xs font-semibold py-2 text-center">NPS</TableHead>
                  <TableHead className="text-xs font-semibold py-2">Submitted</TableHead>
                  <TableHead className="text-xs font-semibold py-2 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.submissions?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-500 text-sm">No evaluations yet</TableCell></TableRow>
                ) : (
                  stats.submissions?.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => onViewDetail(sub)} data-testid={`posteval-row-${sub.id}`}>
                      <TableCell className="py-2">
                        <div className="text-sm font-medium text-gray-900">{sub.full_name}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{sub.email}</div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 py-2">{sub.subsidiary_department}</TableCell>
                      <TableCell className="py-2">
                        <Badge className={`text-[10px] px-1.5 py-0.5 ${
                          sub.readiness_level === 'Champion' ? 'bg-gold/20 text-gold border border-gold/30' :
                          sub.readiness_level === 'Integrator' ? 'bg-green-100 text-green-700' :
                          sub.readiness_level === 'Practitioner' ? 'bg-blue-100 text-blue-700' :
                          sub.readiness_level === 'Experimenter' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{sub.readiness_level || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <span className={`text-xs font-bold ${sub.nps_score >= 9 ? 'text-green-600' : sub.nps_score >= 7 ? 'text-amber-600' : 'text-red-600'}`}>
                          {sub.nps_score ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-[10px] text-gray-500 py-2">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-teal" data-testid={`view-posteval-${sub.id}`}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Brain = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a8 8 0 0 0-8 8c0 2.5 1.2 4.7 3 6.2V20h10v-3.8c1.8-1.5 3-3.7 3-6.2a8 8 0 0 0-8-8z"/>
    <path d="M12 2v8" /><path d="M8 10h8" />
  </svg>
);

const Wrench = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const PostEvalDetail = ({ eval: ev }) => {
  const d = ev?.data || {};
  return (
    <div className="space-y-4">
      {/* Profile */}
      <DetailSection title="Profile" items={[
        { l: "Full Name", v: d.full_name },
        { l: "Job Title", v: d.job_title },
        { l: "Subsidiary / Dept", v: d.subsidiary_department },
        { l: "Years in Role", v: d.years_in_role },
        { l: "Primary Function", v: d.primary_function },
        { l: "Readiness Level", v: d.readiness_level }
      ]} />

      {/* AI Relationship */}
      {d.ai_relationship?.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-3 py-1.5 border-b border-gray-200">
            <h3 className="font-medium text-blue-900 text-xs">AI Relationship Now</h3>
          </div>
          <div className="p-3 flex flex-wrap gap-1.5">
            {d.ai_relationship.map((r, i) => (
              <Badge key={i} variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{r}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Barriers Removed */}
      {d.barriers_removed?.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-green-50 px-3 py-1.5 border-b border-gray-200">
            <h3 className="font-medium text-green-900 text-xs">Barriers Removed</h3>
          </div>
          <div className="p-3 flex flex-wrap gap-1.5">
            {d.barriers_removed.map((b, i) => (
              <Badge key={i} variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">{b}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tool Ratings */}
      {Object.keys(d.tool_ratings || {}).length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-amber-50 px-3 py-1.5 border-b border-gray-200">
            <h3 className="font-medium text-amber-900 text-xs">Tool Comfort Ratings</h3>
          </div>
          <div className="p-3">
            {Object.entries(d.tool_ratings).map(([tool, rating]) => (
              <div key={tool} className="flex items-center justify-between py-0.5">
                <span className="text-xs text-gray-700">{tool}</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className={`w-4 h-4 rounded text-[9px] flex items-center justify-center ${n <= rating ? 'bg-gold text-white' : 'bg-gray-100 text-gray-400'}`}>{n}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Text Responses */}
      {d.tool_surprise && <DetailSection title="Tool That Surprised Most" items={[{ l: "Response", v: d.tool_surprise }]} />}
      {d.biggest_impact && <DetailSection title="Biggest Impact Build" items={[{ l: "Response", v: d.biggest_impact }]} />}
      {d.before_after_ai && <DetailSection title="Before / After AI" items={[{ l: "Response", v: d.before_after_ai }]} />}

      {/* 30-Day Commitment */}
      {d.daily_tool && (
        <DetailSection title="30-Day Commitment" items={[
          { l: "Daily Tool", v: d.daily_tool },
          { l: "Share With", v: d.share_colleague },
          { l: "Obstacle Plan", v: d.obstacle_plan }
        ]} />
      )}

      {/* Session Ratings */}
      {Object.keys(d.session_ratings || {}).length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-purple-50 px-3 py-1.5 border-b border-gray-200">
            <h3 className="font-medium text-purple-900 text-xs">Session Ratings</h3>
          </div>
          <div className="p-3">
            {Object.entries(d.session_ratings).map(([session, rating]) => (
              <div key={session} className="flex items-center justify-between py-0.5">
                <span className="text-xs text-gray-700">{session}</span>
                <span className="text-xs font-bold text-purple-700">{rating}/5</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NPS */}
      {d.nps_score != null && (
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-gray-500 text-[10px] font-medium mb-1">Net Promoter Score</p>
          <p className={`text-3xl font-bold ${d.nps_score >= 9 ? 'text-green-600' : d.nps_score >= 7 ? 'text-amber-600' : 'text-red-600'}`}>{d.nps_score}</p>
        </div>
      )}

      {/* Goals Achieved */}
      {d.goals_achieved?.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-green-50 px-3 py-1.5 border-b border-gray-200">
            <h3 className="font-medium text-green-900 text-xs">Goals Achieved</h3>
          </div>
          <div className="p-3 flex flex-wrap gap-1.5">
            {d.goals_achieved.map((g, i) => (
              <Badge key={i} className="text-[10px] bg-green-100 text-green-700">{g}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Open Feedback */}
      {(d.most_valuable || d.deeper_cohort2 || d.message_team || d.final_words) && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-navy/5 px-3 py-1.5 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 text-xs">Open Feedback</h3>
          </div>
          <div className="p-3 space-y-2">
            {d.most_valuable && <div><p className="text-[10px] text-gray-400">Most valuable</p><p className="text-xs text-gray-800">{d.most_valuable}</p></div>}
            {d.deeper_cohort2 && <div><p className="text-[10px] text-gray-400">Deeper in Cohort 2</p><p className="text-xs text-gray-800">{d.deeper_cohort2}</p></div>}
            {d.message_team && <div><p className="text-[10px] text-gray-400">Message to team</p><p className="text-xs text-gray-800">{d.message_team}</p></div>}
            {d.able_to && <div><p className="text-[10px] text-gray-400">I am now able to...</p><p className="text-xs text-gray-800">{d.able_to}</p></div>}
            {d.advice_cohort2 && <div><p className="text-[10px] text-gray-400">Advice for Cohort 2</p><p className="text-xs text-gray-800">{d.advice_cohort2}</p></div>}
            {d.final_words && <div><p className="text-[10px] text-gray-400">Final words</p><p className="text-xs text-gray-800">{d.final_words}</p></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

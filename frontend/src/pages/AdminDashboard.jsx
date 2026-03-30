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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Users, Download, LogOut, Search, Filter, Eye, ChevronLeft, ChevronRight, TrendingUp, Shield, Lightbulb, RefreshCw, Loader2, AlertTriangle, CheckCircle, Info, Target, BookOpen, Zap } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";

const SUBSIDIARIES = ["Leadway Assurance", "Leadway Pensure", "Leadway Health", "Leadway Asset Management", "Leadway Trustees", "Shared Services", "Other"];
const READINESS_BANDS = ["Beginner", "Explorer", "Emerging Practitioner", "Applied User", "Champion Candidate"];
const BAND_COLORS = { "Beginner": "#EF4444", "Explorer": "#F59E0B", "Emerging Practitioner": "#3B82F6", "Applied User": "#10B981", "Champion Candidate": "#D4AF37" };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [subsidiaryFilter, setSubsidiaryFilter] = useState("");
  const [bandFilter, setBandFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const pageSize = 8;

  useEffect(() => {
    if (!sessionStorage.getItem("leadway_admin")) { navigate("/admin"); return; }
    fetchData();
  }, [navigate]);

  useEffect(() => { fetchSubmissions(); }, [subsidiaryFilter, bandFilter, currentPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, submissionsRes, insightsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/submissions`, { params: { limit: pageSize, skip: 0 } }),
        axios.get(`${API}/admin/insights`)
      ]);
      setStats(statsRes.data);
      setSubmissions(submissionsRes.data.submissions);
      setTotalSubmissions(submissionsRes.data.total);
      setInsights(insightsRes.data);
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

  const getInsightIcon = (type) => {
    switch(type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'positive': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
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
            <Button onClick={handleExport} size="sm" className="bg-gold/20 text-gold hover:bg-gold hover:text-navy h-8 text-xs" data-testid="export-csv-btn">
              <Download className="w-3.5 h-3.5 mr-1" /> Export
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
            <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
            <TabsTrigger value="submissions" className="text-xs">Submissions</TabsTrigger>
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

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            {insights?.insights?.length > 0 ? (
              <div className="grid gap-3">
                {insights.insights.map((insight, i) => (
                  <Card key={i} className={`bg-white border-0 shadow-sm border-l-4 ${
                    insight.type === 'warning' ? 'border-l-amber-500' : 
                    insight.type === 'positive' ? 'border-l-green-500' : 'border-l-blue-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px]">{insight.category}</Badge>
                            <h3 className="font-medium text-gray-900 text-sm">{insight.title}</h3>
                          </div>
                          <p className="text-gray-600 text-xs mb-2">{insight.description}</p>
                          <div className="flex items-start gap-2 bg-gray-50 rounded p-2">
                            <Target className="w-3 h-3 text-gold mt-0.5" />
                            <p className="text-gray-700 text-xs"><span className="font-medium">Recommendation:</span> {insight.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No insights available yet. Insights will appear once submissions are received.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Top Pain Points */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="font-heading text-base text-gray-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Top Pain Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {painPointsData.length > 0 ? (
                    <div className="space-y-2">
                      {painPointsData.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-gray-700 truncate flex-1">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(item.count / (painPointsData[0]?.count || 1)) * 100}%` }} />
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

              {/* Top Benefit Areas */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="font-heading text-base text-gray-900 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-green-500" /> Top AI Benefit Areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {benefitAreasData.length > 0 ? (
                    <div className="space-y-2">
                      {benefitAreasData.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-gray-700 truncate flex-1">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${(item.count / (benefitAreasData[0]?.count || 1)) * 100}%` }} />
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

              {/* AI Tools Usage */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="font-heading text-base text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" /> AI Tools Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {toolsData.length > 0 ? (
                    <div className="space-y-2">
                      {toolsData.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-gray-700 truncate flex-1">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.count / (toolsData[0]?.count || 1)) * 100}%` }} />
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

              {/* Learning Expectations */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="font-heading text-base text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-500" /> Learning Expectations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  {stats?.learning_expectations?.length > 0 ? (
                    <div className="space-y-2">
                      {stats.learning_expectations.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-gray-700 truncate flex-1">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(item.count / (stats.learning_expectations[0]?.count || 1)) * 100}%` }} />
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
        </Tabs>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{selectedSubmission?.full_name}</DialogTitle>
            <DialogDescription className="text-xs">{selectedSubmission?.email} | {selectedSubmission?.subsidiary}</DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-4">
                {/* Scores */}
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

                {/* Score Breakdowns */}
                {selectedSubmission.ai_readiness_breakdown && (
                  <DetailSection title="AI Readiness Breakdown" items={
                    Object.entries(selectedSubmission.ai_readiness_breakdown).map(([k, v]) => ({
                      l: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                      v: `${v} pts`
                    }))
                  } />
                )}

                {/* Insights */}
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

                {/* Recommendations */}
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

                {/* Training Focus Areas */}
                {selectedSubmission.training_focus_areas?.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-purple-50 px-3 py-1.5 border-b border-gray-200">
                      <h3 className="font-medium text-purple-900 text-xs flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Recommended Focus Areas
                      </h3>
                    </div>
                    <div className="p-3 flex flex-wrap gap-1.5">
                      {selectedSubmission.training_focus_areas.map((area, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profile Details */}
                <DetailSection title="Profile" items={[
                  { l: "Job Title", v: selectedSubmission.job_title },
                  { l: "Department", v: selectedSubmission.department },
                  { l: "Years in Role", v: selectedSubmission.years_in_role },
                  { l: "Role Level", v: selectedSubmission.role_level }
                ]} />

                {/* Capstone */}
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
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, iconColor }) => (
  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-default">
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

export default AdminDashboard;

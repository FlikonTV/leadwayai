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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, Download, LogOut, Search, Filter, Eye, ChevronLeft, ChevronRight, TrendingUp, Shield, Lightbulb, RefreshCw, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_ai-readiness-scan/artifacts/1nnj8el7_leadway_logo-removebg-preview.png";

const SUBSIDIARIES = ["Leadway Assurance", "Leadway Pensure", "Leadway Health", "Leadway Asset Management", "Leadway Trustees", "Shared Services", "Other"];
const READINESS_BANDS = ["Beginner", "Explorer", "Emerging Practitioner", "Applied User", "Champion Candidate"];
const BAND_COLORS = { "Beginner": "#EF4444", "Explorer": "#F59E0B", "Emerging Practitioner": "#3B82F6", "Applied User": "#10B981", "Champion Candidate": "#D4AF37" };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [subsidiaryFilter, setSubsidiaryFilter] = useState("");
  const [bandFilter, setBandFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 8;

  useEffect(() => {
    if (!sessionStorage.getItem("leadway_admin")) { navigate("/admin"); return; }
    fetchData();
  }, [navigate]);

  useEffect(() => { fetchSubmissions(); }, [subsidiaryFilter, bandFilter, currentPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, submissionsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/submissions`, { params: { limit: pageSize, skip: 0 } })
      ]);
      setStats(statsRes.data);
      setSubmissions(submissionsRes.data.submissions);
      setTotalSubmissions(submissionsRes.data.total);
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
      link.setAttribute('download', 'leadway_submissions.csv');
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
    return sub.full_name.toLowerCase().includes(q) || sub.email.toLowerCase().includes(q);
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

  const subsidiaryChartData = stats?.by_subsidiary ? Object.entries(stats.by_subsidiary).map(([name, count]) => ({ name: name.replace("Leadway ", ""), count })) : [];
  const bandChartData = stats?.by_readiness_band ? Object.entries(stats.by_readiness_band).map(([name, value]) => ({ name, value })) : [];
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
      {/* Compact Header */}
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
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

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
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
                    <span className="text-gray-600">{entry.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
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
                    <TableRow><TableCell colSpan={7} className="text-center py-6 text-gray-500 text-sm">No submissions</TableCell></TableRow>
                  ) : (
                    filteredSubmissions.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedSubmission(sub)}>
                        <TableCell className="py-2">
                          <div className="text-sm font-medium text-gray-900">{sub.full_name}</div>
                          <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{sub.email}</div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 py-2">{sub.subsidiary.replace("Leadway ", "")}</TableCell>
                        <TableCell className="text-center py-2"><span className="text-xs font-semibold text-blue-600">{sub.ai_readiness_score}</span></TableCell>
                        <TableCell className="text-center py-2"><span className="text-xs font-semibold text-green-600">{sub.opportunity_density_score}</span></TableCell>
                        <TableCell className="text-center py-2"><span className="text-xs font-semibold text-amber-600">{sub.governance_sensitivity_score}</span></TableCell>
                        <TableCell className="py-2">
                          <Badge className={`${getBandBadge(sub.readiness_band)} text-[10px] px-1.5 py-0.5`}>{sub.readiness_band.split(' ')[0]}</Badge>
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
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="bg-white max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{selectedSubmission?.full_name}</DialogTitle>
            <DialogDescription className="text-xs">{selectedSubmission?.email}</DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <ScrollArea className="max-h-[55vh] pr-4">
              <div className="space-y-4">
                {/* Scores */}
                <div className="grid grid-cols-3 gap-2">
                  <ScoreBox label="AI Readiness" value={selectedSubmission.ai_readiness_score} color="blue" />
                  <ScoreBox label="Opportunity" value={selectedSubmission.opportunity_density_score} color="green" />
                  <ScoreBox label="Governance" value={selectedSubmission.governance_sensitivity_score} color="amber" />
                </div>
                <div className="text-center">
                  <Badge className={`${getBandBadge(selectedSubmission.readiness_band)} text-xs px-3 py-1`}>{selectedSubmission.readiness_band}</Badge>
                </div>

                <DetailSection title="Profile" items={[
                  { l: "Job Title", v: selectedSubmission.job_title },
                  { l: "Subsidiary", v: selectedSubmission.subsidiary },
                  { l: "Department", v: selectedSubmission.department },
                  { l: "Years", v: selectedSubmission.years_in_role },
                  { l: "Level", v: selectedSubmission.role_level }
                ]} />

                <DetailSection title="AI Awareness" items={[
                  { l: "Familiarity", v: `${selectedSubmission.ai_familiarity}/5` },
                  { l: "Tools", v: selectedSubmission.ai_tools_used?.join(", ") || "None" },
                  { l: "Frequency", v: selectedSubmission.usage_frequency },
                  { l: "Confidence", v: `${selectedSubmission.prompt_confidence}/5` }
                ]} />

                <DetailSection title="Capstone" items={[
                  { l: "Problem", v: selectedSubmission.capstone_problem },
                  { l: "Success", v: selectedSubmission.success_definition },
                  { l: "Impact", v: selectedSubmission.capstone_impact }
                ]} />

                <DetailSection title="Governance" items={[
                  { l: "Concerns", v: selectedSubmission.governance_concerns?.join(", ") },
                  { l: "Never AI", v: selectedSubmission.never_fully_ai }
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

const ScoreBox = ({ label, value, color }) => (
  <div className={`bg-${color}-50 rounded-lg p-3 text-center`}>
    <p className={`text-${color}-600 text-[10px] font-medium`}>{label}</p>
    <p className={`text-xl font-bold text-${color}-700`}>{value}</p>
  </div>
);

const DetailSection = ({ title, items }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
      <h3 className="font-medium text-gray-900 text-xs">{title}</h3>
    </div>
    <div className="p-3 space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 text-xs">
          <span className="text-gray-500 min-w-[70px] shrink-0">{item.l}:</span>
          <span className="text-gray-900">{item.v || "—"}</span>
        </div>
      ))}
    </div>
  </div>
);

export default AdminDashboard;

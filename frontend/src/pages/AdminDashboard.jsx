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
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Users, Download, LogOut, Search, Filter, Eye, ChevronLeft, ChevronRight,
  TrendingUp, Shield, Lightbulb, RefreshCw
} from "lucide-react";

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

const READINESS_BANDS = [
  "Beginner",
  "Explorer",
  "Emerging Practitioner",
  "Applied User",
  "Champion Candidate"
];

const BAND_COLORS = {
  "Beginner": "#EF4444",
  "Explorer": "#F59E0B",
  "Emerging Practitioner": "#3B82F6",
  "Applied User": "#10B981",
  "Champion Candidate": "#D4AF37"
};

const PIE_COLORS = ["#EF4444", "#F59E0B", "#3B82F6", "#10B981", "#D4AF37"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // Filters
  const [subsidiaryFilter, setSubsidiaryFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [bandFilter, setBandFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const isAdmin = sessionStorage.getItem("leadway_admin");
    if (!isAdmin) {
      navigate("/admin");
      return;
    }
    fetchData();
  }, [navigate]);

  useEffect(() => {
    fetchSubmissions();
  }, [subsidiaryFilter, departmentFilter, bandFilter, currentPage]);

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
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const params = {
        limit: pageSize,
        skip: currentPage * pageSize
      };
      if (subsidiaryFilter) params.subsidiary = subsidiaryFilter;
      if (departmentFilter) params.department = departmentFilter;
      if (bandFilter) params.readiness_band = bandFilter;
      
      const response = await axios.get(`${API}/submissions`, { params });
      setSubmissions(response.data.submissions);
      setTotalSubmissions(response.data.total);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API}/admin/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leadway_submissions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export CSV");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("leadway_admin");
    navigate("/admin");
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        sub.full_name.toLowerCase().includes(query) ||
        sub.email.toLowerCase().includes(query) ||
        sub.department.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getBandBadgeClass = (band) => {
    switch (band) {
      case "Beginner": return "bg-red-100 text-red-800 hover:bg-red-100";
      case "Explorer": return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "Emerging Practitioner": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "Applied User": return "bg-green-100 text-green-800 hover:bg-green-100";
      case "Champion Candidate": return "bg-gradient-to-r from-sunset-orange to-gold text-white hover:opacity-90";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const subsidiaryChartData = stats?.by_subsidiary 
    ? Object.entries(stats.by_subsidiary).map(([name, count]) => ({ name: name.replace("Leadway ", ""), count }))
    : [];

  const bandChartData = stats?.by_readiness_band
    ? Object.entries(stats.by_readiness_band).map(([name, value]) => ({ name, value }))
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalSubmissions / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-navy shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Leadway Logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-white font-heading text-xl font-medium">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">AI Readiness Assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExport}
                variant="outline"
                className="border-gold text-gold hover:bg-gold hover:text-navy"
                data-testid="export-csv-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-gray-400 hover:text-white"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-navy flex items-center justify-center">
                  <Users className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Total Submissions</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="total-submissions">{stats?.total_submissions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Avg AI Readiness</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="avg-readiness">
                    {stats?.average_scores?.avg_ai_readiness?.toFixed(1) || "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Avg Opportunity</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="avg-opportunity">
                    {stats?.average_scores?.avg_opportunity_density?.toFixed(1) || "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Avg Governance</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid="avg-governance">
                    {stats?.average_scores?.avg_governance_sensitivity?.toFixed(1) || "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Submissions by Subsidiary */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-gray-900">Submissions by Subsidiary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subsidiaryChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0B1320', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="count" fill="#D4AF37" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Readiness Distribution */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-gray-900">Readiness Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bandChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {bandChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BAND_COLORS[entry.name] || PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0B1320', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="font-heading text-xl text-gray-900">All Submissions</CardTitle>
              
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[200px]"
                    data-testid="search-input"
                  />
                </div>
                
                <Select value={subsidiaryFilter} onValueChange={setSubsidiaryFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="subsidiary-filter">
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="All Subsidiaries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subsidiaries</SelectItem>
                    {SUBSIDIARIES.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={bandFilter} onValueChange={setBandFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="band-filter">
                    <SelectValue placeholder="All Readiness" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Readiness Bands</SelectItem>
                    {READINESS_BANDS.map(band => (
                      <SelectItem key={band} value={band}>{band}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchData}
                  className="border-gray-200"
                  data-testid="refresh-btn"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Subsidiary</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold text-center">AI Readiness</TableHead>
                  <TableHead className="font-semibold text-center">Opportunity</TableHead>
                  <TableHead className="font-semibold text-center">Governance</TableHead>
                  <TableHead className="font-semibold">Band</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{sub.full_name}</p>
                          <p className="text-gray-500 text-sm">{sub.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{sub.subsidiary}</TableCell>
                      <TableCell className="text-gray-600">{sub.department}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-blue-600">{sub.ai_readiness_score}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-green-600">{sub.opportunity_density_score}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-amber-600">{sub.governance_sensitivity_score}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getBandBadgeClass(sub.readiness_band)}>
                          {sub.readiness_band}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubmission(sub)}
                          className="text-gray-600 hover:text-navy"
                          data-testid={`view-${sub.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-gray-500 text-sm">
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalSubmissions)} of {totalSubmissions}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 0}
                    data-testid="prev-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-gray-600 text-sm px-2">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= totalPages - 1}
                    data-testid="next-page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Submission Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-gray-900">
              Submission Details
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {selectedSubmission?.full_name} - {selectedSubmission?.email}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Scores Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-blue-600 text-sm font-medium">AI Readiness</p>
                    <p className="text-2xl font-bold text-blue-700">{selectedSubmission.ai_readiness_score}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-green-600 text-sm font-medium">Opportunity</p>
                    <p className="text-2xl font-bold text-green-700">{selectedSubmission.opportunity_density_score}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 text-center">
                    <p className="text-amber-600 text-sm font-medium">Governance</p>
                    <p className="text-2xl font-bold text-amber-700">{selectedSubmission.governance_sensitivity_score}</p>
                  </div>
                </div>

                <div className="text-center">
                  <Badge className={`${getBandBadgeClass(selectedSubmission.readiness_band)} text-sm px-4 py-1`}>
                    {selectedSubmission.readiness_band}
                  </Badge>
                </div>

                {/* Profile */}
                <DetailSection title="Profile">
                  <DetailRow label="Job Title" value={selectedSubmission.job_title} />
                  <DetailRow label="Subsidiary" value={selectedSubmission.subsidiary} />
                  <DetailRow label="Department" value={selectedSubmission.department} />
                  <DetailRow label="Years in Role" value={selectedSubmission.years_in_role} />
                  <DetailRow label="Role Level" value={selectedSubmission.role_level} />
                </DetailSection>

                {/* AI Awareness */}
                <DetailSection title="AI Awareness">
                  <DetailRow label="AI Familiarity" value={`${selectedSubmission.ai_familiarity}/5`} />
                  <DetailRow label="Tools Used" value={selectedSubmission.ai_tools_used?.join(", ") || "None"} />
                  <DetailRow label="Usage Frequency" value={selectedSubmission.usage_frequency} />
                  <DetailRow label="Prompt Confidence" value={`${selectedSubmission.prompt_confidence}/5`} />
                </DetailSection>

                {/* Pain Points */}
                <DetailSection title="Pain Points">
                  <DetailRow label="Workflow Pain Points" value={selectedSubmission.workflow_pain_points?.join(", ")} />
                  <DetailRow label="Repetitive Tasks" value={selectedSubmission.repetitive_tasks} />
                </DetailSection>

                {/* Capstone */}
                <DetailSection title="Capstone Opportunity">
                  <DetailRow label="Problem Statement" value={selectedSubmission.capstone_problem} />
                  <DetailRow label="Success Definition" value={selectedSubmission.success_definition} />
                  <DetailRow label="Business Impact" value={selectedSubmission.capstone_impact} />
                </DetailSection>

                {/* Governance */}
                <DetailSection title="Governance">
                  <DetailRow label="Concerns" value={selectedSubmission.governance_concerns?.join(", ")} />
                  <DetailRow label="Never Fully AI" value={selectedSubmission.never_fully_ai} />
                </DetailSection>

                {/* Learning */}
                <DetailSection title="Learning Expectations">
                  <DetailRow label="Learning Goals" value={selectedSubmission.learning_expectations?.join(", ")} />
                  <DetailRow label="Preferred Style" value={selectedSubmission.preferred_learning_style} />
                  <DetailRow label="Specific Topics" value={selectedSubmission.specific_topics} />
                </DetailSection>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DetailSection = ({ title, children }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
      <h3 className="font-medium text-gray-900">{title}</h3>
    </div>
    <div className="p-4 space-y-2">{children}</div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
    <span className="text-gray-500 text-sm font-medium min-w-[140px]">{label}:</span>
    <span className="text-gray-900 text-sm">{value || "Not provided"}</span>
  </div>
);

export default AdminDashboard;

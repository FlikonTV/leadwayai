import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, Shield, Lightbulb, Loader2, ClipboardCheck, Star, Target, BarChart3 } from "lucide-react";

const COMPARE_COLORS = { c1: "#D4AF37", c2: "#006D77" };

export const CohortComparisonTab = () => {
  const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;
  const [c1Stats, setC1Stats] = useState(null);
  const [c2Stats, setC2Stats] = useState(null);
  const [c1PostEval, setC1PostEval] = useState(null);
  const [c2PostEval, setC2PostEval] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s1, s2, pe1, pe2] = await Promise.all([
          axios.get(`${API_URL}/admin/stats`, { params: { cohort: "cohort_1_lagos" } }),
          axios.get(`${API_URL}/admin/stats`, { params: { cohort: "cohort_2_abuja" } }),
          axios.get(`${API_URL}/admin/post-eval-stats`, { params: { cohort: "cohort_1_lagos" } }).catch(() => ({ data: { total: 0 } })),
          axios.get(`${API_URL}/admin/post-eval-stats`, { params: { cohort: "cohort_2_abuja" } }).catch(() => ({ data: { total: 0 } })),
        ]);
        setC1Stats(s1.data);
        setC2Stats(s2.data);
        setC1PostEval(pe1.data);
        setC2PostEval(pe2.data);
      } catch { toast.error("Failed to load comparison data"); }
      finally { setLoading(false); }
    };
    load();
  }, [API_URL]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;

  const c1Pre = c1Stats?.total_submissions || 0;
  const c2Pre = c2Stats?.total_submissions || 0;
  const c1Post = c1PostEval?.total || 0;
  const c2Post = c2PostEval?.total || 0;
  const c1Avg = c1Stats?.average_scores || {};
  const c2Avg = c2Stats?.average_scores || {};
  const c1Nps = c1PostEval?.nps || {};
  const c2Nps = c2PostEval?.nps || {};

  const metricRows = [
    { label: "Pre-Training Submissions", c1: c1Pre, c2: c2Pre, icon: Users },
    { label: "Post-Training Evaluations", c1: c1Post, c2: c2Post, icon: ClipboardCheck },
    { label: "Avg AI Readiness", c1: c1Avg.avg_ai_readiness?.toFixed(1) || "\u2014", c2: c2Avg.avg_ai_readiness?.toFixed(1) || "\u2014", icon: TrendingUp },
    { label: "Avg Opportunity Density", c1: c1Avg.avg_opportunity_density?.toFixed(1) || "\u2014", c2: c2Avg.avg_opportunity_density?.toFixed(1) || "\u2014", icon: Lightbulb },
    { label: "Avg Governance Sensitivity", c1: c1Avg.avg_governance_sensitivity?.toFixed(1) || "\u2014", c2: c2Avg.avg_governance_sensitivity?.toFixed(1) || "\u2014", icon: Shield },
    { label: "NPS Average", c1: c1Nps.average ?? "\u2014", c2: c2Nps.average ?? "\u2014", icon: Star },
    { label: "NPS Net Score", c1: c1Nps.net_score ?? "\u2014", c2: c2Nps.net_score ?? "\u2014", icon: Target },
  ];

  const c1Bands = c1Stats?.by_readiness_band || {};
  const c2Bands = c2Stats?.by_readiness_band || {};
  const allBands = [...new Set([...Object.keys(c1Bands), ...Object.keys(c2Bands)])];
  const bandCompare = allBands.map(b => ({ name: b.split(' ')[0], c1: c1Bands[b] || 0, c2: c2Bands[b] || 0 }));

  const c1Subs = c1Stats?.by_subsidiary || {};
  const c2Subs = c2Stats?.by_subsidiary || {};
  const allSubs = [...new Set([...Object.keys(c1Subs), ...Object.keys(c2Subs)])];
  const subCompare = allSubs.map(s => ({ name: s.replace("Leadway ", ""), c1: c1Subs[s] || 0, c2: c2Subs[s] || 0 }));

  const c1Eff = c1PostEval?.programme_effectiveness || {};
  const c2Eff = c2PostEval?.programme_effectiveness || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gold" /> Cohort Comparison
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Side-by-side performance across cohorts</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COMPARE_COLORS.c1 }} />
            <span className="text-xs text-gray-600 font-medium">Cohort 1 &mdash; Lagos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COMPARE_COLORS.c2 }} />
            <span className="text-xs text-gray-600 font-medium">Cohort 2 &mdash; Abuja</span>
          </div>
        </div>
      </div>

      {/* Programme Grade Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm overflow-hidden" style={{ borderTop: `3px solid ${COMPARE_COLORS.c1}` }}>
          <CardContent className="p-4 text-center">
            <p className="text-[10px] font-medium tracking-wider uppercase" style={{ color: COMPARE_COLORS.c1 }}>Cohort 1 &mdash; Lagos</p>
            <p className="text-gray-400 text-[10px] mt-0.5">April 13-15, 2026</p>
            {c1Eff.grade ? (
              <>
                <p className="text-5xl font-bold font-heading mt-2 text-gray-900">{c1Eff.grade}</p>
                <p className="text-gray-500 text-[10px] mt-1">{c1Eff.programme_score || 0}/100 &mdash; {c1Eff.nps_classification || ""}</p>
              </>
            ) : (
              <p className="text-2xl font-bold font-heading mt-3 text-gray-300">{c1Pre > 0 ? `${c1Pre} assessed` : "No data"}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm overflow-hidden" style={{ borderTop: `3px solid ${COMPARE_COLORS.c2}` }}>
          <CardContent className="p-4 text-center">
            <p className="text-[10px] font-medium tracking-wider uppercase" style={{ color: COMPARE_COLORS.c2 }}>Cohort 2 &mdash; Abuja</p>
            <p className="text-gray-400 text-[10px] mt-0.5">May 15-18, 2026</p>
            {c2Eff.grade ? (
              <>
                <p className="text-5xl font-bold font-heading mt-2 text-gray-900">{c2Eff.grade}</p>
                <p className="text-gray-500 text-[10px] mt-1">{c2Eff.programme_score || 0}/100 &mdash; {c2Eff.nps_classification || ""}</p>
              </>
            ) : (
              <p className="text-2xl font-bold font-heading mt-3 text-gray-300">{c2Pre > 0 ? `${c2Pre} assessed` : "Upcoming"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Table */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="py-3 px-4 border-b border-gray-100">
          <CardTitle className="font-heading text-base text-gray-900">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm" data-testid="compare-metrics-table">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Metric</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold" style={{ color: COMPARE_COLORS.c1 }}>Cohort 1 &mdash; Lagos</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold" style={{ color: COMPARE_COLORS.c2 }}>Cohort 2 &mdash; Abuja</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metricRows.map((row) => {
                const v1 = typeof row.c1 === 'number' ? row.c1 : parseFloat(row.c1);
                const v2 = typeof row.c2 === 'number' ? row.c2 : parseFloat(row.c2);
                const delta = (!isNaN(v1) && !isNaN(v2)) ? v2 - v1 : null;
                const Icon = row.icon;
                return (
                  <tr key={row.label} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-700 flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {row.label}
                    </td>
                    <td className="text-center px-4 py-2.5">
                      <span className="text-sm font-bold text-gray-900">{row.c1}</span>
                    </td>
                    <td className="text-center px-4 py-2.5">
                      <span className="text-sm font-bold text-gray-900">{row.c2}</span>
                    </td>
                    <td className="text-center px-4 py-2.5">
                      {delta !== null ? (
                        <span className={`text-xs font-semibold ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {delta > 0 ? "+" : ""}{delta === 0 ? "=" : (Number.isInteger(delta) ? delta : delta.toFixed(1))}
                        </span>
                      ) : <span className="text-gray-300 text-xs">&mdash;</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bandCompare.length > 0 && (
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="py-3 px-4">
              <CardTitle className="font-heading text-base text-gray-900">Readiness Band Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bandCompare} margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1320', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="c1" name="Cohort 1" fill={COMPARE_COLORS.c1} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="c2" name="Cohort 2" fill={COMPARE_COLORS.c2} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {subCompare.length > 0 && (
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="py-3 px-4">
              <CardTitle className="font-heading text-base text-gray-900">Participation by Subsidiary</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subCompare} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1320', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="c1" name="Cohort 1" fill={COMPARE_COLORS.c1} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="c2" name="Cohort 2" fill={COMPARE_COLORS.c2} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* NPS Comparison */}
      {(c1Nps.distribution || c2Nps.distribution) && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-gray-100">
            <CardTitle className="font-heading text-base text-gray-900">NPS Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Cohort 1 \u2014 Lagos", nps: c1Nps, color: COMPARE_COLORS.c1 },
                { label: "Cohort 2 \u2014 Abuja", nps: c2Nps, color: COMPARE_COLORS.c2 },
              ].map(({ label, nps, color }) => (
                <div key={label}>
                  <p className="text-xs font-medium mb-2" style={{ color }}>{label}</p>
                  {nps.average != null ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Average</span>
                        <span className="text-lg font-bold text-gray-900">{nps.average}/10</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Net Score</span>
                        <span className={`text-lg font-bold ${nps.net_score >= 50 ? 'text-green-600' : nps.net_score >= 0 ? 'text-amber-600' : 'text-red-600'}`}>{nps.net_score}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {[
                          { label: "Promoters", val: nps.distribution?.promoters || 0, color: "bg-green-500" },
                          { label: "Passives", val: nps.distribution?.passives || 0, color: "bg-amber-400" },
                          { label: "Detractors", val: nps.distribution?.detractors || 0, color: "bg-red-500" },
                        ].map(seg => {
                          const total = (nps.distribution?.promoters || 0) + (nps.distribution?.passives || 0) + (nps.distribution?.detractors || 0);
                          const pct = total > 0 ? (seg.val / total * 100) : 0;
                          return pct > 0 ? (
                            <div key={seg.label} className={`h-2 rounded-full ${seg.color}`} style={{ width: `${pct}%` }} title={`${seg.label}: ${seg.val}`} />
                          ) : null;
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-400">
                        <span>P:{nps.distribution?.promoters || 0}</span>
                        <span>N:{nps.distribution?.passives || 0}</span>
                        <span>D:{nps.distribution?.detractors || 0}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300 text-sm text-center py-4">No data yet</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {c1Pre === 0 && c2Pre === 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-gray-900 font-medium mb-2">No Data to Compare</h3>
            <p className="text-gray-500 text-sm">Comparison charts will populate as cohorts submit assessments and evaluations.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

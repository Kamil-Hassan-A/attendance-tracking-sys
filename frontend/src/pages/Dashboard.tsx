import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarCheck2,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ── Types ──────────────────────────────────────────────────────────────────
interface MonthlyReportDetail {
  id: number;
  student_id: string;
  full_name: string;
  total_days: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  is_below_threshold: boolean;
}

interface MonthlyReport {
  month: number;
  year: number;
  total_students: number;
  average_attendance_percentage: number;
  below_threshold_count: number;
  students: MonthlyReportDetail[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pctColor(pct: number) {
  if (pct >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 75) return "text-amber-500 dark:text-amber-400";
  return "text-destructive";
}

// ── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  loading: boolean;
  accent?: string;
}

function StatCard({ label, value, sub, icon, loading, accent }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardAction>
          <span className={`text-muted-foreground ${accent ?? ""}`}>{icon}</span>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className={`text-3xl font-bold tracking-tight ${accent ?? ""}`}>
            {value}
          </p>
        )}
        {sub && !loading && (
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { teacher } = useAuth();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [belowList, setBelowList] = useState<MonthlyReportDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, reportRes, belowRes] = await Promise.all([
        api.get("/students"),
        api.get("/attendance/report", { params: { month, year } }),
        api.get("/attendance/below-threshold", {
          params: { threshold: 75, month, year },
        }),
      ]);

      // /students returns an array
      setTotalStudents(Array.isArray(studentsRes.data) ? studentsRes.data.length : 0);
      setReport(reportRes.data);
      setBelowList(belowRes.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to load dashboard data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Year options — last 3 years
  const yearOptions = [year - 2, year - 1, year].filter((y) => y > 2020);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {teacher?.full_name ?? "Teacher"} — here&apos;s your attendance overview.
          </p>
        </div>

        {/* Month / Year filter */}
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Students"
          value={totalStudents ?? 0}
          sub="registered in the system"
          icon={<Users className="h-5 w-5" />}
          loading={loading}
        />
        <StatCard
          label="Avg Attendance"
          value={
            report
              ? `${report.average_attendance_percentage.toFixed(1)}%`
              : "—"
          }
          sub={`${MONTH_NAMES[month - 1]} ${year}`}
          icon={<TrendingUp className="h-5 w-5" />}
          loading={loading}
          accent={
            report
              ? pctColor(report.average_attendance_percentage)
              : undefined
          }
        />
        <StatCard
          label="Below Threshold (75%)"
          value={report?.below_threshold_count ?? 0}
          sub="students at risk"
          icon={<AlertTriangle className="h-5 w-5" />}
          loading={loading}
          accent={
            (report?.below_threshold_count ?? 0) > 0
              ? "text-destructive"
              : "text-emerald-600 dark:text-emerald-400"
          }
        />
        <StatCard
          label="Total Tracked Days"
          value={
            report && report.students.length > 0
              ? report.students[0].total_days
              : "—"
          }
          sub={`school days in ${MONTH_NAMES[month - 1]}`}
          icon={<CalendarCheck2 className="h-5 w-5" />}
          loading={loading}
        />
      </div>

      {/* Below-threshold students */}
      <Card>
        <CardHeader>
          <CardTitle>Students Below Threshold</CardTitle>
          <CardDescription>
            Students with &lt;75% attendance in{" "}
            {MONTH_NAMES[month - 1]} {year}
          </CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reports" className="flex items-center gap-1 text-xs">
                Full Report <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-10 w-full" />
              ))}
            </div>
          ) : belowList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm">
                No students below threshold — great work!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Student</th>
                    <th className="pb-2 pr-4 font-medium">ID</th>
                    <th className="pb-2 pr-4 font-medium">Present</th>
                    <th className="pb-2 pr-4 font-medium">Absent</th>
                    <th className="pb-2 pr-4 font-medium">Late</th>
                    <th className="pb-2 font-medium">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {belowList.map((s, i) => (
                    <>
                      <tr
                        key={s.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-2.5 pr-4 font-medium">{s.full_name}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {s.student_id}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="secondary">{s.present}</Badge>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="destructive">{s.absent}</Badge>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="outline">{s.late}</Badge>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`font-semibold ${pctColor(s.percentage)}`}
                          >
                            {s.percentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                      {i < belowList.length - 1 && (
                        <tr key={`sep-${s.id}`}>
                          <td colSpan={6}>
                            <Separator />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

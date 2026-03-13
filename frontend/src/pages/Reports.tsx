import { useEffect, useState, useCallback } from "react";
import { BarChart3, AlertTriangle, Download } from "lucide-react";
import api from "@/services/api";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReportStudent {
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
  students: ReportStudent[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pctColor(pct: number) {
  if (pct >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 75) return "text-amber-500 dark:text-amber-400";
  return "text-destructive";
}

function pctBg(pct: number) {
  if (pct >= 85) return "bg-emerald-50 dark:bg-emerald-950/40";
  if (pct >= 75) return "bg-amber-50 dark:bg-amber-950/40";
  return "bg-red-50 dark:bg-red-950/40";
}

type SortKey = "full_name" | "percentage" | "present" | "absent" | "late" | "total_days";

function exportCSV(report: MonthlyReport) {
  const header = ["Student ID", "Name", "Total Days", "Present", "Absent", "Late", "Attendance %", "Below Threshold"];
  const rows = report.students.map((s) => [
    s.student_id,
    s.full_name,
    s.total_days,
    s.present,
    s.absent,
    s.late,
    s.percentage.toFixed(1),
    s.is_below_threshold ? "Yes" : "No",
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance_report_${MONTH_NAMES[report.month - 1]}_${report.year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [threshold, setThreshold] = useState(75);

  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortAsc, setSortAsc] = useState(true);

  // Filter: show only below-threshold
  const [belowOnly, setBelowOnly] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/attendance/report", {
        params: { month, year },
      });
      setReport(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to load report.";
      setError(msg);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Sorted + filtered students
  const displayed = (report?.students ?? [])
    .filter((s) => {
      if (belowOnly) return s.percentage < threshold;
      return true;
    })
    .sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === "full_name")
        return dir * a.full_name.localeCompare(b.full_name);
      return dir * (a[sortKey] - b[sortKey]);
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === "full_name"); // name asc by default, numbers desc
      if (key !== "full_name") setSortAsc(false);
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="opacity-30">↕</span>;
    return <span>{sortAsc ? "↑" : "↓"}</span>;
  }

  const yearOptions = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()].filter(
    (y) => y > 2020
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Monthly attendance breakdown for all students
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-3 self-start sm:self-auto">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Month</Label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Year</Label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Threshold %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-20 h-9"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Students",
            value: loading ? null : report?.total_students ?? "—",
            accent: "",
          },
          {
            label: "Avg Attendance",
            value: loading
              ? null
              : report
              ? `${report.average_attendance_percentage.toFixed(1)}%`
              : "—",
            accent: report ? pctColor(report.average_attendance_percentage) : "",
          },
          {
            label: `Below ${threshold}%`,
            value: loading
              ? null
              : report
              ? displayed.filter((s) => s.percentage < threshold).length
              : "—",
            accent:
              (report?.below_threshold_count ?? 0) > 0
                ? "text-destructive"
                : "text-emerald-600 dark:text-emerald-400",
          },
        ].map(({ label, value, accent }) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
            </CardHeader>
            <CardContent>
              {value === null ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className={`text-3xl font-bold tracking-tight ${accent}`}>
                  {value}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {MONTH_NAMES[month - 1]} {year} — Student Breakdown
          </CardTitle>
          <CardDescription>
            Click column headers to sort. Red rows = below {threshold}% threshold.
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-sm select-none">
                <input
                  type="checkbox"
                  checked={belowOnly}
                  onChange={(e) => setBelowOnly(e.target.checked)}
                  className="rounded border-input accent-primary"
                />
                At-risk only
              </label>
              <Separator orientation="vertical" className="h-5" />
              <Button
                size="sm"
                variant="outline"
                disabled={!report || loading}
                onClick={() => report && exportCSV(report)}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </Button>
            </div>
          </CardAction>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <Skeleton key={n} className="h-10 w-full" />
              ))}
            </div>
          ) : !report || displayed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm">
                {belowOnly
                  ? `No students below ${threshold}% for this period.`
                  : "No attendance data for the selected period."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("full_name")}
                  >
                    Student <SortIcon col="full_name" />
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">ID</TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-center"
                    onClick={() => toggleSort("total_days")}
                  >
                    Days <SortIcon col="total_days" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-center hidden md:table-cell"
                    onClick={() => toggleSort("present")}
                  >
                    Present <SortIcon col="present" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-center hidden md:table-cell"
                    onClick={() => toggleSort("absent")}
                  >
                    Absent <SortIcon col="absent" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-center hidden lg:table-cell"
                    onClick={() => toggleSort("late")}
                  >
                    Late <SortIcon col="late" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-right"
                    onClick={() => toggleSort("percentage")}
                  >
                    Attendance % <SortIcon col="percentage" />
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((s) => {
                  const below = s.percentage < threshold;
                  return (
                    <TableRow
                      key={s.id}
                      className={below ? pctBg(s.percentage) : ""}
                    >
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{s.student_id}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {s.total_days}
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {s.present}
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        <span className="font-medium text-destructive">
                          {s.absent}
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden lg:table-cell text-amber-500">
                        {s.late}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${pctColor(s.percentage)}`}>
                          {s.percentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {below ? (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            At Risk
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-xs text-emerald-600 dark:text-emerald-400"
                          >
                            OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

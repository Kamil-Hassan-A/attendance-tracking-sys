import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Users, CalendarDays, Send } from "lucide-react";
import { format } from "date-fns";
import api from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// ── Types ────────────────────────────────────────────────────────────────────
type AttendanceStatus = "present" | "absent" | "late";

interface Student {
  id: number;
  student_id: string;
  full_name: string;
  course: string;
  year_level: number;
}

interface ExistingRecord {
  student_id: number;
  status: AttendanceStatus;
  remarks: string | null;
}

type StatusMap = Record<number, AttendanceStatus>;
type RemarksMap = Record<number, string>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "text-emerald-600 dark:text-emerald-400",
  absent: "text-destructive",
  late: "text-amber-500 dark:text-amber-400",
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MarkAttendance() {
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState<Student[]>([]);
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [remarksMap, setRemarksMap] = useState<RemarksMap>({});
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Load students once ────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await api.get("/students");
      setStudents(res.data);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // ── Load existing records for selected date ───────────────────────────────
  useEffect(() => {
    if (!date || students.length === 0) return;
    setLoadingRecords(true);
    api
      .get(`/attendance/date/${date}`)
      .then((res) => {
        const records: ExistingRecord[] = res.data;
        const sm: StatusMap = {};
        const rm: RemarksMap = {};
        records.forEach((r) => {
          sm[r.student_id] = r.status;
          rm[r.student_id] = r.remarks ?? "";
        });
        setStatusMap(sm);
        setRemarksMap(rm);
      })
      .catch(() => {
        // 404 just means no records yet — that's fine
        setStatusMap({});
        setRemarksMap({});
      })
      .finally(() => setLoadingRecords(false));
  }, [date, students]);

  // ── Set all to a status ───────────────────────────────────────────────────
  function markAll(status: AttendanceStatus) {
    const sm: StatusMap = {};
    students.forEach((s) => (sm[s.id] = status));
    setStatusMap(sm);
  }

  function setStatus(studentId: number, status: AttendanceStatus) {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
  }

  function setRemarks(studentId: number, value: string) {
    setRemarksMap((prev) => ({ ...prev, [studentId]: value }));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const toMark = students.filter((s) => statusMap[s.id]);
    if (toMark.length === 0) {
      setErrorMsg("Please mark at least one student before submitting.");
      return;
    }

    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await Promise.all(
        toMark.map((s) =>
          api.post("/attendance", {
            student_id: s.id,
            date,
            status: statusMap[s.id],
            remarks: remarksMap[s.id] || null,
          })
        )
      );
      setSuccessMsg(
        `Attendance saved for ${toMark.length} student${toMark.length !== 1 ? "s" : ""} on ${new Date(date + "T00:00:00").toLocaleDateString()}.`
      );
    } catch (err: unknown) {
      setErrorMsg(
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to save attendance. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const markedCount = students.filter((s) => statusMap[s.id]).length;
  const presentCount = students.filter((s) => statusMap[s.id] === "present").length;
  const absentCount = students.filter((s) => statusMap[s.id] === "absent").length;
  const lateCount = students.filter((s) => statusMap[s.id] === "late").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Mark present, absent, or late for each student
          </p>
        </div>

        {/* Date picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 w-52 justify-start"
            >
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {format(new Date(date + "T00:00:00"), "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={new Date(date + "T00:00:00")}
              onSelect={(day) => {
                if (day) {
                  setDate(format(day, "yyyy-MM-dd"));
                }
              }}
              disabled={(date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4.5 w-4.5" />
            Summary for {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardTitle>
          <CardAction>
            {/* Bulk mark buttons */}
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                onClick={() => markAll("present")}
                disabled={loadingStudents || students.length === 0}
              >
                All Present
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => markAll("absent")}
                disabled={loadingStudents || students.length === 0}
              >
                All Absent
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <span className="font-semibold">{markedCount}</span>
              <span className="text-muted-foreground"> / {students.length} marked</span>
            </span>
            <Separator orientation="vertical" className="h-4 self-center" />
            <span className="text-emerald-600 dark:text-emerald-400">
              <span className="font-semibold">{presentCount}</span> present
            </span>
            <span className="text-destructive">
              <span className="font-semibold">{absentCount}</span> absent
            </span>
            <span className="text-amber-500 dark:text-amber-400">
              <span className="font-semibold">{lateCount}</span> late
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Student list */}
      <Card>
        <CardContent className="pt-4">
          {loadingStudents ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="h-16 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm">No students yet. Add students first.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {students.map((student, idx) => {
                const current = statusMap[student.id] as AttendanceStatus | undefined;
                return (
                  <div key={student.id}>
                    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:gap-4">
                      {/* Student info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {student.full_name}
                          </span>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {student.student_id}
                          </Badge>
                          <Badge variant="outline" className="text-xs shrink-0 hidden sm:inline-flex">
                            {student.course}
                          </Badge>
                        </div>
                        {current && (
                          <p className={`text-xs mt-0.5 ${STATUS_COLORS[current]}`}>
                            {STATUS_LABEL[current]}
                            {loadingRecords && " (loading…)"}
                          </p>
                        )}
                      </div>

                      {/* Status toggle */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <ToggleGroup
                          type="single"
                          value={current ?? ""}
                          onValueChange={(val) => {
                            if (val) setStatus(student.id, val as AttendanceStatus);
                          }}
                          className="gap-1"
                        >
                          <ToggleGroupItem
                            value="present"
                            className="data-[state=on]:bg-emerald-100 data-[state=on]:text-emerald-700 dark:data-[state=on]:bg-emerald-950 dark:data-[state=on]:text-emerald-400 text-xs h-8 px-3"
                          >
                            Present
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="absent"
                            className="data-[state=on]:bg-red-100 data-[state=on]:text-red-700 dark:data-[state=on]:bg-red-950 dark:data-[state=on]:text-red-400 text-xs h-8 px-3"
                          >
                            Absent
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="late"
                            className="data-[state=on]:bg-amber-100 data-[state=on]:text-amber-700 dark:data-[state=on]:bg-amber-950 dark:data-[state=on]:text-amber-400 text-xs h-8 px-3"
                          >
                            Late
                          </ToggleGroupItem>
                        </ToggleGroup>

                        {/* Remarks */}
                        <Input
                          placeholder="Remarks (optional)"
                          className="h-8 text-xs w-full sm:w-44"
                          value={remarksMap[student.id] ?? ""}
                          onChange={(e) => setRemarks(student.id, e.target.value)}
                        />
                      </div>
                    </div>
                    {idx < students.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback messages */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      {/* Submit */}
      {students.length > 0 && !loadingStudents && (
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || markedCount === 0}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {submitting
              ? "Saving…"
              : `Submit Attendance (${markedCount} student${markedCount !== 1 ? "s" : ""})`}
          </Button>
        </div>
      )}
    </div>
  );
}

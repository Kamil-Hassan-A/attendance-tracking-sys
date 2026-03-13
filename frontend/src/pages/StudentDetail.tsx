import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, CalendarCheck2 } from "lucide-react";
import api from "@/services/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Student {
    id: number;
    student_id: string;
    full_name: string;
    email: string;
    course: string;
    year_level: number;
}

interface AttendanceStats {
    student_id: number;
    full_name: string;
    total_days: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
    is_below_threshold: boolean;
}

interface AttendanceRecord {
    id: number;
    student_id: number;
    date: string;
    status: "present" | "absent" | "late";
    remarks: string | null;
}

type StatusVariant = "default" | "destructive" | "outline" | "secondary";

const STATUS_VARIANT: Record<string, StatusVariant> = {
    present: "default",
    absent: "destructive",
    late: "outline",
};

function pctColor(pct: number) {
    if (pct >= 85) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 75) return "text-amber-500 dark:text-amber-400";
    return "text-destructive";
}

export default function StudentDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [student, setStudent] = useState<Student | null>(null);
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!id) return;
        const numericId = Number(id);

        Promise.all([
            api.get(`/students/${numericId}`),
            api.get(`/attendance/stats/${numericId}`),
            api.get(`/attendance/student/${numericId}`, { params: { limit: 50 } }),
        ])
            .then(([sRes, stRes, recRes]) => {
                setStudent(sRes.data);
                setStats(stRes.data);
                setRecords(recRes.data);
            })
            .catch((err) => {
                if (err?.response?.status === 404) setNotFound(true);
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (notFound) {
        return (
            <div className="flex flex-col items-center gap-4 py-24 text-center text-muted-foreground">
                <p className="text-lg font-medium">Student not found.</p>
                <Button variant="outline" onClick={() => navigate("/students")}>
                    Back to Students
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back */}
            <Button variant="ghost" size="sm" asChild className="-ml-2">
                <Link to="/students">
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Back to Students
                </Link>
            </Button>

            {/* Profile card */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            {loading ? (
                                <>
                                    <Skeleton className="h-6 w-48 mb-2" />
                                    <Skeleton className="h-4 w-32" />
                                </>
                            ) : (
                                <>
                                    <CardTitle className="text-xl">{student?.full_name}</CardTitle>
                                    <CardDescription>{student?.email}</CardDescription>
                                </>
                            )}
                        </div>
                        {!loading && student && (
                            <div className="flex gap-2 flex-wrap">
                                <Badge variant="secondary">{student.student_id}</Badge>
                                <Badge variant="outline">Year {student.year_level}</Badge>
                                <Badge>{student.course}</Badge>
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Attendance %",
                        value: stats ? `${stats.percentage.toFixed(1)}%` : "—",
                        icon: <TrendingUp className="h-5 w-5" />,
                        accent: stats ? pctColor(stats.percentage) : "",
                    },
                    {
                        label: "Total Days",
                        value: stats?.total_days ?? "—",
                        icon: <CalendarCheck2 className="h-5 w-5" />,
                        accent: "",
                    },
                    {
                        label: "Present",
                        value: stats?.present ?? "—",
                        icon: null,
                        accent: "text-emerald-600 dark:text-emerald-400",
                    },
                    {
                        label: "Absent",
                        value: stats?.absent ?? "—",
                        icon: null,
                        accent: "text-destructive",
                    },
                ].map(({ label, value, icon, accent }) => (
                    <Card key={label}>
                        <CardHeader>
                            <CardDescription>{label}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <p className={`text-3xl font-bold tracking-tight ${accent}`}>
                                    {value}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Attendance history */}
            <Card>
                <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                    <CardDescription>Last 50 records, newest first</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((n) => (
                                <Skeleton key={n} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : records.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No attendance records yet.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden sm:table-cell">Remarks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map((rec) => (
                                    <TableRow key={rec.id}>
                                        <TableCell>{new Date(rec.date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={STATUS_VARIANT[rec.status] ?? "outline"}>
                                                {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                                            {rec.remarks ?? "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

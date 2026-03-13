import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  ChevronRight,
} from "lucide-react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Types ──────────────────────────────────────────────────────────────────
interface Student {
  id: number;
  student_id: string;
  full_name: string;
  email: string;
  course: string;
  year_level: number;
  created_by: number;
  created_at: string;
}

interface StudentFormData {
  student_id: string;
  full_name: string;
  email: string;
  course: string;
  year_level: number;
}

const EMPTY_FORM: StudentFormData = {
  student_id: "",
  full_name: "",
  email: "",
  course: "",
  year_level: 1,
};

type DialogMode = "add" | "edit";

// ── Student Form Dialog ──────────────────────────────────────────────────────
interface StudentDialogProps {
  open: boolean;
  mode: DialogMode;
  initial: StudentFormData;
  onClose: () => void;
  onSave: (data: StudentFormData) => Promise<void>;
}

function StudentDialog({
  open,
  mode,
  initial,
  onClose,
  onSave,
}: StudentDialogProps) {
  const [form, setForm] = useState<StudentFormData>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset form whenever the dialog opens
  useEffect(() => {
    if (open) {
      setForm(initial);
      setError(null);
    }
  }, [open, initial]);

  function set(field: keyof StudentFormData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Student" : "Edit Student"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="s_student_id">Student ID</Label>
            <Input
              id="s_student_id"
              placeholder="e.g. STU-001"
              required
              disabled={mode === "edit"}
              value={form.student_id}
              onChange={(e) => set("student_id", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="s_full_name">Full Name</Label>
            <Input
              id="s_full_name"
              placeholder="Jane Doe"
              required
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="s_email">Email</Label>
            <Input
              id="s_email"
              type="email"
              placeholder="student@school.edu"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="s_course">Course</Label>
            <Input
              id="s_course"
              placeholder="e.g. B.Tech CSE"
              required
              value={form.course}
              onChange={(e) => set("course", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="s_year">Year Level</Label>
            <Input
              id="s_year"
              type="number"
              min={1}
              max={6}
              required
              value={form.year_level}
              onChange={(e) => set("year_level", Number(e.target.value))}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : mode === "add" ? "Add Student" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Students() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("add");
  const [editTarget, setEditTarget] = useState<Student | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/students");
      setStudents(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filtered list
  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.student_id.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.course.toLowerCase().includes(q)
    );
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  function openAdd() {
    setEditTarget(null);
    setDialogMode("add");
    setDialogOpen(true);
  }

  function openEdit(student: Student) {
    setEditTarget(student);
    setDialogMode("edit");
    setDialogOpen(true);
  }

  async function handleSave(data: StudentFormData) {
    if (dialogMode === "add") {
      await api.post("/students", data);
    } else if (editTarget) {
      const { student_id: _sid, ...updateData } = data;
      await api.put(`/students/${editTarget.id}`, updateData);
    }
    await fetchStudents();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/students/${deleteTarget.id}`);
      await fetchStudents();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const initialForm: StudentFormData = editTarget
    ? {
      student_id: editTarget.student_id,
      full_name: editTarget.full_name,
      email: editTarget.email,
      course: editTarget.course,
      year_level: editTarget.year_level,
    }
    : EMPTY_FORM;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            Manage your student records
          </p>
        </div>
        <Button onClick={openAdd} className="self-start sm:self-auto">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Search + Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student List
          </CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${students.length} student${students.length !== 1 ? "s" : ""} registered`}
          </CardDescription>
          <CardAction>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students…"
                className="pl-8 w-48 sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardAction>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm">
                {searchQuery ? "No students match your search." : "No students yet. Add one to get started."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Course</TableHead>
                  <TableHead className="hidden lg:table-cell">Year</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() =>
                      navigate(`/students/${student.id}`)
                    }
                  >
                    <TableCell>
                      <Badge variant="secondary">{student.student_id}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.full_name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {student.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {student.course}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline">Year {student.year_level}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(student);
                          }}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(student);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/students/${student.id}`);
                          }}
                          title="View details"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <StudentDialog
        open={dialogOpen}
        mode={dialogMode}
        initial={initialForm}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget?.full_name}</span>?
              This will also permanently delete all their attendance records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { setToken } from "@/services/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function StudentLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post(
        `/student-auth/login`,
        {
          email: email,
          student_id: studentId,
        },
        { withCredentials: true }
      );
      const token = res.data.access_token;
      if (token) {
        setToken(token);
        // Note: relying on memory/AuthContext and the refresh HttpOnly cookie 
        // for persistence instead of localStorage.
      }
      navigate("/student-dashboard", { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ?? "Invalid student credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className={cn("flex flex-col gap-6 w-full max-w-md")}>
        <Card>
          <CardHeader>
            <CardTitle>Student Access</CardTitle>
            <CardDescription>
              Enter your email and Student ID to view attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@school.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="studentId">Student ID</FieldLabel>
                  <Input
                    id="studentId"
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </Field>

                {error && (
                  <p className="text-sm text-destructive text-center">
                    {error}
                  </p>
                )}

                <Field>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "View Attendance"}
                  </Button>
                  <FieldDescription className="text-center text-sm mt-4">
                    Are you a Teacher?{" "}
                    <Link
                      to="/login"
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      Login here
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

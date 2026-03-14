import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute() {

  const { accessToken, isLoading } = useAuth();
  const location = useLocation();

  // ✅ allow student routes without teacher login
  if (
    location.pathname.startsWith("/student")
  ) {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // teacher protected
  return accessToken ? <Outlet /> : <Navigate to="/login" replace />;
}

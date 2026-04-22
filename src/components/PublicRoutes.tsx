import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { roleConfig } from "@/lib/roles";

const PublicRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={roleConfig[user.role].route} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;

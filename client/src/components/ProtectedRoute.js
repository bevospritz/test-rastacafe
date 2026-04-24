import { useAuth } from "../AuthContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // aspetta che il context carichi

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
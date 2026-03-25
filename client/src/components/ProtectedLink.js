// src/components/ProtectedLink.js
import { useAuth } from "../AuthContext";

const ProtectedLink = ({ permission, children }) => {
  const { hasPermission, user } = useAuth();
  console.log("user:", user, "permission:", permission, "result:", hasPermission(permission));
  if (!hasPermission(permission)) return null;
  return children;
};

export default ProtectedLink;

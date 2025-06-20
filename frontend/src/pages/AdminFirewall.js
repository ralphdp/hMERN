import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FirewallAdmin } from "../plugins/firewall";

const AdminFirewall = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
      return;
    }
  }, [user, navigate]);

  // If user is not admin, don't render anything (redirect will happen)
  if (!user || user.role !== "admin") {
    return null;
  }

  return <FirewallAdmin />;
};

export default AdminFirewall;

import { useState, useCallback } from "react";
import { getBackendUrl } from "../../../utils/config";

export const useFirewallStats = () => {
  const [stats, setStats] = useState({});

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/firewall/stats`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        console.error(
          "Failed to fetch stats:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  return {
    stats,
    fetchStats,
  };
};

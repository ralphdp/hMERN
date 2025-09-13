import { useState, useCallback } from "react";
import { getBackendUrl } from "../../../utils/config";

export const useFirewallLogs = () => {
  const [logs, setLogs] = useState([]);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/logs?limit=2500`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data);
      } else {
        console.error(
          "Failed to fetch logs:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  }, []);

  return {
    logs,
    fetchLogs,
  };
};

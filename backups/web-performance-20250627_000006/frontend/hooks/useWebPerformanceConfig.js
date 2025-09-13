import { useState, useEffect } from "react";
import { getBackendUrl } from "../../../utils/config";

export const useWebPerformanceConfig = () => {
  const [config, setConfig] = useState({
    defaultBucketName: "",
    hasRedisEndpoint: false,
    hasR2Credentials: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/config`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
        setError(null);
      } else {
        setError(`Failed to fetch config: ${response.status}`);
        console.error(
          "Failed to fetch config:",
          response.status,
          response.statusText
        );
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    loading,
    error,
    refetch: fetchConfig,
  };
};

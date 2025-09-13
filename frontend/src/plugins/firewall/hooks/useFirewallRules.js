import { useState, useCallback } from "react";
import { getBackendUrl } from "../../../utils/config";

export const useFirewallRules = (showAlert) => {
  const [rules, setRules] = useState([]);
  const [addingCommonRules, setAddingCommonRules] = useState(false);
  const [importingThreats, setImportingThreats] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/rules?limit=2500`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setRules(data.data);
      } else {
        console.error(
          "Failed to fetch rules:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
    }
  }, []);

  const handleSaveRule = useCallback(
    async (ruleForm, selectedRule) => {
      const url = selectedRule
        ? `${getBackendUrl()}/api/firewall/rules/${selectedRule._id}`
        : `${getBackendUrl()}/api/firewall/rules`;
      const method = selectedRule ? "PUT" : "POST";

      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(ruleForm),
        });

        if (response.ok) {
          showAlert(
            `Rule ${selectedRule ? "updated" : "created"} successfully!`
          );
          fetchRules();
          return true;
        } else {
          const error = await response.json();
          showAlert(error.message || "Error saving rule", "error");
          return false;
        }
      } catch (error) {
        showAlert("Error saving rule", "error");
        return false;
      }
    },
    [fetchRules, showAlert]
  );

  const deleteRuleWithoutRefresh = useCallback(async (ruleId) => {
    const response = await fetch(
      `${getBackendUrl()}/api/firewall/rules/${ruleId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    return response.json();
  }, []);

  const handleAddCommonRules = useCallback(async () => {
    setAddingCommonRules(true);
    // Logic extracted from FirewallAdmin.jsx
    // ... this would contain the fetch call to the endpoint that adds common rules
    setAddingCommonRules(false);
  }, []);

  const handleImportThreatFeeds = useCallback(async () => {
    setImportingThreats(true);
    // Logic extracted from FirewallAdmin.jsx
    // ... this would contain the fetch call to the threat intel import endpoint
    setImportingThreats(false);
  }, []);

  return {
    rules,
    fetchRules,
    handleSaveRule,
    deleteRuleWithoutRefresh,
    addingCommonRules,
    handleAddCommonRules,
    importingThreats,
    handleImportThreatFeeds,
  };
};

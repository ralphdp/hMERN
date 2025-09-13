import FirewallAdmin from "./FirewallAdmin";
import FirewallStatusPanel from "./components/FirewallStatusPanel";
import { registerOverlayComponent } from "../registry";

// Register the status panel as an overlay component for drop-in functionality
registerOverlayComponent({
  pluginName: "firewall",
  component: FirewallStatusPanel,
  props: {},
});

export { FirewallAdmin, FirewallStatusPanel };

export default {
  name: "hMERN Firewall",
  version: "1.0.0",
  description: "Advanced firewall protection with admin management interface",
  components: {
    FirewallAdmin,
  },
  routes: [
    {
      path: "/admin/firewall",
      component: FirewallAdmin,
      adminOnly: true,
    },
  ],
  adminPanel: {
    enabled: true,
    menuItem: {
      title: "Firewall Management",
      description: "Manage security rules",
      icon: "Shield", // Material-UI icon name
      path: "/admin/firewall",
    },
    card: {
      title: "Firewall Protection",
      description:
        "Manage IP blocking, rate limiting, geo-blocking, and security rules. Monitor real-time threats and configure protection policies.",
      icon: "Shield",
      color: "primary.main",
      buttonText: "Manage Firewall",
      path: "/admin/firewall",
    },
  },
};

import FirewallAdmin from "./FirewallAdmin";

export { FirewallAdmin };

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
};

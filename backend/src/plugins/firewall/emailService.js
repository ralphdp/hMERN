const nodemailer = require("nodemailer");

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Validate required environment variables
  const requiredEnvVars = [
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_USER",
    "EMAIL_PASSWORD",
    "EMAIL_FROM",
  ];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required email configuration: ${missingVars.join(", ")}`
    );
  }

  // Parse port as number
  const port = parseInt(process.env.EMAIL_PORT, 10);
  if (isNaN(port)) {
    throw new Error("EMAIL_PORT must be a valid number");
  }

  // Determine if we should use secure connection
  const secure = port === 465;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: port,
    secure: secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Add TLS options for better security
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
};

// Helper function to get frontend URL based on environment
const getFrontendUrl = () => {
  if (process.env.NODE_ENV === "production") {
    // Remove trailing slash if present
    return process.env.FRONTEND_URL.replace(/\/$/, "");
  }
  return `http://localhost:${process.env.PORT_FRONTEND || 3000}`;
};

// Send firewall security report email
const sendFirewallReportEmail = async (recipientEmail, reportData) => {
  try {
    const transporter = createTransporter();
    const frontendUrl = getFrontendUrl();

    const {
      reportType = "Security Report",
      frequency = "weekly",
      attackSummaryLabel = "7 Days",
      threatsLabel = "30 Days",
      stats = {},
      topThreats = [],
      topBlockedCountries = [],
      topBlockedIPs = [],
      attackSummary = {},
      trafficStats = {},
      rulePerformance = [],
      includeCharts = false,
    } = reportData;

    // Format the report date
    const reportDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Generate professional HTML layout using tables as grid system
    let htmlContent = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <table border="0" cellpadding="20" cellspacing="0" width="800">
              
              <!-- Header Section -->
              <tr>
                <td align="center">
                  <h1>Firewall ${reportType}</h1>
                  <p><strong>Generated on ${reportDate}</strong></p>
                </td>
              </tr>
              
              <!-- System Overview Section -->
              <tr>
                <td>
                  <table border="0" cellpadding="15" cellspacing="0" width="100%">
                    <tr>
                      <td bgcolor="#ffffff">
                        <h2>System Overview</h2>
                        
                        <!-- Grid Layout for Overview Stats -->
                        <table border="0" cellspacing="15" width="100%">
                          <tr>
                            <td width="50%" align="center" valign="top">
                              <table border="0" cellpadding="10" cellspacing="0" width="100%">
                                <tr>
                                  <td align="center">
                                    <h3>Firewall Rules</h3>
                                    <table border="0" cellpadding="5" cellspacing="0" width="100%">
                                      <tr>
                                        <td align="left"><strong>Total Rules:</strong></td>
                                        <td align="right">${
                                          stats.rules?.total || 0
                                        }</td>
                                      </tr>
                                      <tr>
                                        <td align="left"><strong>Active Rules:</strong></td>
                                        <td align="right">${
                                          stats.rules?.active || 0
                                        }</td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                            <td width="50%" align="center" valign="top">
                              <table border="0" cellpadding="10" cellspacing="0" width="100%">
                                <tr>
                                  <td align="center">
                                    <h3>Blocked IPs</h3>
                                    <table border="0" cellpadding="5" cellspacing="0" width="100%">
                                      <tr>
                                        <td align="left"><strong>Total Blocked:</strong></td>
                                        <td align="right">${
                                          stats.blockedIPs?.total || 0
                                        }</td>
                                      </tr>
                                      <tr>
                                        <td align="left"><strong>Active Blocks:</strong></td>
                                        <td align="right">${
                                          stats.blockedIPs?.active || 0
                                        }</td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
    `;

    // Include attack summary if enabled
    if (reportData.includeAttackSummary && stats.requests?.attackPeriod) {
      htmlContent += `
              <!-- Attack Summary Section -->
              <tr>
                <td>
                  <table border="0" cellpadding="15" cellspacing="0" width="100%">
                    <tr>
                      <td bgcolor="#ffffff">
                                                 <h2>Attack Summary (${attackSummaryLabel})</h2>
                        
                        <!-- Grid Layout for Attack Stats -->
                        <table border="0" cellspacing="15" width="100%">
                          <tr>
                            <td width="33.33%" align="center" valign="top">
                              <table border="0" cellpadding="15" cellspacing="0" width="100%">
                                <tr>
                                  <td align="center">
                                                                         <h1>${
                                                                           stats
                                                                             .requests
                                                                             ?.attackPeriod
                                                                             ?.blocked ||
                                                                           0
                                                                         }</h1>
                                     <h4>Blocked Requests</h4>
                                   </td>
                                 </tr>
                               </table>
                             </td>
                             <td width="33.33%" align="center" valign="top">
                               <table border="0" cellpadding="15" cellspacing="0" width="100%">
                                 <tr>
                                   <td align="center">
                                     <h1>${
                                       stats.requests?.attackPeriod?.allowed ||
                                       0
                                     }</h1>
                                     <h4>Allowed Requests</h4>
                                   </td>
                                 </tr>
                               </table>
                             </td>
                             <td width="33.33%" align="center" valign="top">
                               <table border="0" cellpadding="15" cellspacing="0" width="100%">
                                 <tr>
                                   <td align="center">
                                     <h1>${
                                       stats.requests?.attackPeriod?.total || 0
                                     }</h1>
                                     <h4>Total Requests</h4>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
      `;
    }

    // Include top threats if enabled
    if (
      reportData.includeTopThreats &&
      (topBlockedCountries.length > 0 || topBlockedIPs.length > 0)
    ) {
      htmlContent += `
              <!-- Top Threats Section -->
              <tr>
                <td>
                  <table border="0" cellpadding="15" cellspacing="0" width="100%">
                    <tr>
                      <td bgcolor="#ffffff">
                                                 <h2>Top Threats (${threatsLabel})</h2>
                        
                        <!-- Grid Layout for Threats -->
                        <table border="0" cellspacing="15" width="100%">
                          <tr>
      `;

      if (topBlockedCountries.length > 0) {
        htmlContent += `
                            <td width="50%" valign="top">
                              <table border="0" cellspacing="0" width="100%">
                                <tr>
                                  <td>
                                    <h3>Top Blocked Countries</h3>
                                    <table border="0" cellpadding="5" cellspacing="1" width="100%" bgcolor="#e0e0e0">
                                      <tr bgcolor="#ffffff">
                                        <td align="center" width="20%"><strong>Rank</strong></td>
                                        <td align="center" width="60%"><strong>Country</strong></td>
                                        <td align="center" width="20%"><strong>Blocks</strong></td>
                                      </tr>
        `;
        topBlockedCountries.slice(0, 5).forEach((country, index) => {
          htmlContent += `
                                      <tr bgcolor="#ffffff">
                                        <td align="center">${index + 1}</td>
                                        <td align="center">${
                                          country._id || "Unknown"
                                        }</td>
                                        <td align="center">${country.count}</td>
                                      </tr>`;
        });
        htmlContent += `
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>`;
      }

      if (topBlockedIPs.length > 0) {
        htmlContent += `
                            <td width="50%" valign="top">
                              <table border="0" cellpadding="10" cellspacing="0" width="100%">
                                <tr>
                                  <td>
                                    <h3>Top Blocked IPs</h3>
                                    <table border="0" cellpadding="5" cellspacing="1" width="100%" bgcolor="#e0e0e0">
                                      <tr bgcolor="#ffffff">
                                        <td align="center" width="20%"><strong>Rank</strong></td>
                                        <td align="center" width="60%"><strong>IP Address</strong></td>
                                        <td align="center" width="20%"><strong>Attempts</strong></td>
                                      </tr>
        `;
        topBlockedIPs.slice(0, 5).forEach((ip, index) => {
          htmlContent += `
                                      <tr bgcolor="#ffffff">
                                        <td align="center">${index + 1}</td>
                                        <td align="center">${ip._id}</td>
                                        <td align="center">${ip.count}</td>
                                      </tr>`;
        });
        htmlContent += `
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            </td>`;
      }

      htmlContent += `
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
    }

    // Include traffic stats if enabled
    if (reportData.includeTrafficStats && stats.requests?.attackPeriod) {
      htmlContent += `
              <!-- Traffic Statistics Section -->
              <tr>
                <td>
                  <table border="0" cellpadding="15" cellspacing="0" width="100%">
                    <tr>
                      <td bgcolor="#ffffff">
                        <h2>Traffic Statistics</h2>
                        
                        <!-- Grid Layout for Traffic Stats -->
                        <table border="0" cellspacing="0" width="100%">
                          <tr>
                            <td>
                              <table border="0" cellpadding="5" cellspacing="1" width="100%" bgcolor="#e0e0e0">
                                <tr bgcolor="#ffffff">
                                  <td align="center" width="40%"><strong>Time Period</strong></td>
                                  <td align="center" width="40%"><strong>Metric</strong></td>
                                  <td align="center" width="20%"><strong>Value</strong></td>
                                </tr>
                                                                 <tr bgcolor="#ffffff">
                                   <td align="center">Last ${attackSummaryLabel}</td>
                                   <td align="center">Total Requests</td>
                                   <td align="center">${
                                     stats.requests?.attackPeriod?.total || 0
                                   }</td>
                                 </tr>
                                 <tr bgcolor="#ffffff">
                                   <td align="center">Last ${threatsLabel}</td>
                                   <td align="center">Total Requests</td>
                                   <td align="center">${
                                     stats.requests?.threatsPeriod || 0
                                   }</td>
                                 </tr>
                                 <tr bgcolor="#ffffff">
                                   <td align="center">Last ${attackSummaryLabel}</td>
                                   <td align="center">Block Rate</td>
                                   <td align="center">${
                                     stats.requests?.attackPeriod?.total > 0
                                       ? Math.round(
                                           (stats.requests?.attackPeriod
                                             ?.blocked /
                                             stats.requests?.attackPeriod
                                               ?.total) *
                                             100
                                         )
                                       : 0
                                   }%</td>
                                 </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
      `;
    }

    // Include rule performance if enabled
    if (reportData.includeRulePerformance && rulePerformance.length > 0) {
      htmlContent += `
              <!-- Rule Performance Section -->
              <tr>
                <td>
                  <table border="0" cellpadding="15" cellspacing="0" width="100%">
                    <tr>
                      <td bgcolor="#ffffff">
                        <h2>Rule Performance</h2>
                        <p>Top performing firewall rules:</p>
                        
                        <!-- Grid Layout for Rule Performance -->
                        <table border="0" cellspacing="0" width="100%">
                          <tr>
                            <td>
                              <table border="0" cellpadding="5" cellspacing="1" width="100%" bgcolor="#e0e0e0">
                                <tr bgcolor="#ffffff">
                                  <td align="center" width="15%"><strong>Rank</strong></td>
                                  <td align="center" width="65%"><strong>Rule Name</strong></td>
                                  <td align="center" width="20%"><strong>Triggers</strong></td>
                                </tr>
      `;
      rulePerformance.slice(0, 5).forEach((rule, index) => {
        htmlContent += `
                                <tr bgcolor="#ffffff">
                                  <td align="center">${index + 1}</td>
                                  <td align="center">${rule.name}</td>
                                  <td align="center">${rule.triggers}</td>
                                </tr>`;
      });
      htmlContent += `
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
    }

    // Footer
    htmlContent += `
              <!-- Footer Section -->
              <tr>
                <td>
                  <table border="0" cellpadding="15" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <h3>Report Information</h3>
                        <p>This is an automated security report from your firewall system.</p>
                        <p>Access your firewall dashboard: <a href="${frontendUrl}/admin/firewall">${frontendUrl}/admin/firewall</a></p>
                        <p><em>Report generated on ${new Date().toISOString()}</em></p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: `Firewall ${reportType} - ${reportDate}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Firewall report email sent to ${recipientEmail}:`,
      info.messageId
    );
    return info;
  } catch (error) {
    console.error("Error sending firewall report email:", error);
    throw new Error(`Failed to send firewall report email: ${error.message}`);
  }
};

module.exports = {
  sendFirewallReportEmail,
};

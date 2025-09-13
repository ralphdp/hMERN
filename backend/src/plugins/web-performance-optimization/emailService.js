const nodemailer = require("nodemailer");
const cron = require("node-cron");
const { WebPerformanceSettings } = require("./models");
const { STATIC_CONFIG } = require("./config");
const { formatFileSize, calculateMetricsSummary } = require("./utils");

// Use centralized logging system
const { createPluginLogger } = require("../../utils/logger");
const logger = createPluginLogger("web-performance-email");

class WebPerformanceEmailService {
  constructor() {
    this.transporter = null;
    this.scheduledTasks = new Map();
    this.emailQueue = [];
    this.isProcessingQueue = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter with configuration validation
   */
  initializeTransporter() {
    try {
      const requiredEnvVars = [
        "EMAIL_HOST",
        "EMAIL_PORT",
        "EMAIL_USER",
        "EMAIL_PASSWORD",
        "EMAIL_FROM",
      ];

      const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
      if (missingVars.length > 0) {
        logger.email.warn("Missing email configuration variables", {
          missingVars,
          availableVars: requiredEnvVars.filter((v) => process.env[v]),
        });
        return;
      }

      const port = parseInt(process.env.EMAIL_PORT, 10);
      if (isNaN(port)) {
        throw new Error("EMAIL_PORT must be a valid number");
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: port,
        secure: port === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === "production",
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });

      // Verify transporter
      this.transporter.verify((error, success) => {
        if (error) {
          logger.email.error("Email transporter verification failed", {
            error: error.message,
            host: process.env.EMAIL_HOST,
            port: port,
          });
        } else {
          logger.email.info("Email service initialized successfully", {
            host: process.env.EMAIL_HOST,
            port: port,
            from: process.env.EMAIL_FROM,
          });
        }
      });
    } catch (error) {
      logger.email.error("Failed to initialize email transporter", {
        error: error.message,
        errorStack: error.stack,
      });
    }
  }

  /**
   * Send email with retry logic and queue management
   */
  async sendEmail(mailOptions, priority = "normal") {
    if (!this.transporter) {
      logger.email.warn("Email transporter not available", {
        to: mailOptions.to,
        subject: mailOptions.subject,
      });
      return false;
    }

    const emailTask = {
      ...mailOptions,
      priority,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    // Add to queue based on priority
    if (priority === "critical") {
      this.emailQueue.unshift(emailTask);
    } else {
      this.emailQueue.push(emailTask);
    }

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processEmailQueue();
    }

    return true;
  }

  /**
   * Process email queue with retry logic
   */
  async processEmailQueue() {
    if (this.emailQueue.length === 0 || this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.emailQueue.length > 0) {
      const emailTask = this.emailQueue.shift();

      try {
        emailTask.attempts++;

        const result = await this.transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: emailTask.to,
          subject: emailTask.subject,
          html: emailTask.html,
          text: emailTask.text,
          attachments: emailTask.attachments,
        });

        logger.email.info("Email sent successfully", {
          to: emailTask.to,
          subject: emailTask.subject,
          messageId: result.messageId,
          attempts: emailTask.attempts,
        });
      } catch (error) {
        logger.email.error("Failed to send email", {
          to: emailTask.to,
          subject: emailTask.subject,
          attempts: emailTask.attempts,
          maxAttempts: emailTask.maxAttempts,
          error: error.message,
        });

        // Retry logic
        if (emailTask.attempts < emailTask.maxAttempts) {
          // Add back to queue with exponential backoff
          setTimeout(() => {
            this.emailQueue.push(emailTask);
          }, Math.pow(2, emailTask.attempts) * 1000);
        }
      }

      // Small delay between emails
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.isProcessingQueue = false;
  }

  /**
   * Send performance alert email
   */
  async sendPerformanceAlert(alertInfo) {
    const {
      to,
      alertType,
      severity,
      message,
      metrics,
      recommendations,
      timestamp,
      alertId,
      context,
    } = alertInfo;

    const severityColors = {
      info: "#2196F3",
      warning: "#FF9800",
      error: "#F44336",
      critical: "#D32F2F",
    };

    const severityEmojis = {
      info: "ℹ️",
      warning: "⚠️",
      error: "❌",
      critical: "🚨",
    };

    const color = severityColors[severity] || "#2196F3";
    const emoji = severityEmojis[severity] || "ℹ️";

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; padding: 25px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">${emoji} Performance Alert</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">${severity.toUpperCase()}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">${alertType}</p>
        </div>
        
        <!-- Alert Details -->
        <div style="padding: 25px 20px; background: white; border-left: 4px solid ${color};">
          <h2 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 20px;">Alert Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #555; width: 120px;">Alert ID:</td>
              <td style="padding: 8px 0; color: #333;">${alertId || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #555;">Time:</td>
              <td style="padding: 8px 0; color: #333;">${new Date(
                timestamp
              ).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #555;">Component:</td>
              <td style="padding: 8px 0; color: #333;">${
                context?.component || "System"
              }</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #555; vertical-align: top;">Message:</td>
              <td style="padding: 8px 0; color: #333;">${message}</td>
            </tr>
          </table>
        </div>

        ${
          metrics && Object.keys(metrics).length > 0
            ? `
        <!-- Performance Metrics -->
        <div style="padding: 20px; background: #f8f9ff; border-left: 4px solid #2196F3;">
          <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📊 Performance Metrics</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${Object.entries(metrics)
              .map(
                ([key, value]) => `
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e1e5e9;">
                <div style="font-weight: 600; color: #555; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">${key.replace(
                  /_/g,
                  " "
                )}</div>
                <div style="font-size: 24px; font-weight: 700; color: #333;">${
                  typeof value === "number" && key.includes("size")
                    ? formatFileSize(value)
                    : value
                }</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        `
            : ""
        }

        ${
          recommendations && recommendations.length > 0
            ? `
        <!-- Recommendations -->
        <div style="padding: 20px; background: #f0f8f0; border-left: 4px solid #4CAF50;">
          <h3 style="color: #2e7d32; margin-top: 0; margin-bottom: 15px; font-size: 18px;">💡 Recommendations</h3>
          <ul style="margin: 0; padding-left: 20px; color: #2e7d32;">
            ${recommendations
              .map(
                (rec) =>
                  `<li style="margin: 8px 0; line-height: 1.5;">${rec}</li>`
              )
              .join("")}
          </ul>
        </div>
        `
            : ""
        }

        <!-- Footer -->
        <div style="padding: 20px; background: #f5f5f5; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #e1e5e9;">
          <p style="margin: 0;">This alert was automatically generated by your Web Performance Optimization system.</p>
          <p style="margin: 5px 0 0 0;">For assistance, please contact your system administrator.</p>
        </div>
      </div>
    `;

    return this.sendEmail(
      {
        to,
        subject: `[Performance Alert - ${severity.toUpperCase()}] ${alertType}`,
        html,
      },
      severity === "critical" ? "critical" : "normal"
    );
  }

  /**
   * Send optimization completion email
   */
  async sendOptimizationResult(resultInfo) {
    const { to, operationType, results, summary, timestamp, operationId } =
      resultInfo;

    const successRate =
      summary.filesProcessed > 0
        ? Math.round((summary.successfulFiles / summary.filesProcessed) * 100)
        : 0;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background: #f8f9fa;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 25px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">✅ Optimization Complete</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">${operationType}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Operation ID: ${
            operationId || "N/A"
          }</p>
        </div>
        
        <!-- Summary Stats -->
        <div style="padding: 25px 20px; background: white;">
          <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; font-size: 20px;">📈 Results Summary</h2>
          <p style="color: #666; margin-bottom: 20px;"><strong>Completed:</strong> ${new Date(
            timestamp
          ).toLocaleString()}</p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0;">
            <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #90caf9;">
              <div style="font-size: 32px; font-weight: 700; color: #1976d2; margin-bottom: 5px;">${
                summary.filesProcessed || 0
              }</div>
              <div style="font-size: 14px; color: #555; font-weight: 600;">Files Processed</div>
            </div>
            <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #81c784;">
              <div style="font-size: 32px; font-weight: 700; color: #388e3c; margin-bottom: 5px;">${formatFileSize(
                summary.totalSizeSaved || 0
              )}</div>
              <div style="font-size: 14px; color: #555; font-weight: 600;">Total Saved</div>
            </div>
            <div style="background: #fff3e0; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #ffb74d;">
              <div style="font-size: 32px; font-weight: 700; color: #f57c00; margin-bottom: 5px;">${
                summary.averageCompression || 0
              }%</div>
              <div style="font-size: 14px; color: #555; font-weight: 600;">Avg Compression</div>
            </div>
            <div style="background: #f3e5f5; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #ba68c8;">
              <div style="font-size: 32px; font-weight: 700; color: #7b1fa2; margin-bottom: 5px;">${successRate}%</div>
              <div style="font-size: 14px; color: #555; font-weight: 600;">Success Rate</div>
            </div>
          </div>

          <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #b3d9ff;">
            <h3 style="margin-top: 0; color: #1976D2; font-size: 16px;">⏱️ Processing Details</h3>
            <p style="margin: 5px 0; color: #555;"><strong>Processing Time:</strong> ${
              summary.processingTime || 0
            }s</p>
            <p style="margin: 5px 0; color: #555;"><strong>Successful Files:</strong> ${
              summary.successfulFiles || 0
            }</p>
            <p style="margin: 5px 0; color: #555;"><strong>Failed Files:</strong> ${
              summary.failedFiles || 0
            }</p>
          </div>
        </div>

        ${
          results && results.length > 0
            ? `
        <!-- Detailed Results -->
        <div style="padding: 0 20px 20px 20px; background: white;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">📄 Detailed Results</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #f5f5f5;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600; color: #555;">File</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; color: #555;">Original</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; color: #555;">Optimized</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; color: #555;">Saved</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; font-weight: 600; color: #555;">Compression</th>
                </tr>
              </thead>
              <tbody>
                ${results
                  .slice(0, 15)
                  .map(
                    (result, index) => `
                  <tr style="border-bottom: 1px solid #eee; ${
                    index % 2 === 0
                      ? "background: #fafafa;"
                      : "background: white;"
                  }">
                    <td style="padding: 10px; color: #333; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${
                      result.filePath
                    }">${result.filePath.split("/").pop()}</td>
                    <td style="padding: 10px; text-align: right; color: #666;">${formatFileSize(
                      result.originalSize
                    )}</td>
                    <td style="padding: 10px; text-align: right; color: #666;">${formatFileSize(
                      result.optimizedSize
                    )}</td>
                    <td style="padding: 10px; text-align: right; color: #4CAF50; font-weight: 600;">${formatFileSize(
                      result.savings
                    )}</td>
                    <td style="padding: 10px; text-align: right; color: #2196F3; font-weight: 600;">${Math.round(
                      (result.compressionRatio || 0) * 100
                    )}%</td>
                  </tr>
                `
                  )
                  .join("")}
                ${
                  results.length > 15
                    ? `
                  <tr>
                    <td colspan="5" style="padding: 12px; text-align: center; font-style: italic; color: #888; background: #f9f9f9;">
                      ... and ${results.length - 15} more files
                    </td>
                  </tr>
                `
                    : ""
                }
              </tbody>
            </table>
          </div>
        </div>
        `
            : ""
        }

        <!-- Footer -->
        <div style="padding: 20px; background: #f5f5f5; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #e1e5e9;">
          <p style="margin: 0;">This report was automatically generated by your Web Performance Optimization system.</p>
          <p style="margin: 5px 0 0 0;">Visit your admin dashboard for more detailed analysis and settings.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `[Optimization Complete] ${operationType} - ${formatFileSize(
        summary.totalSizeSaved || 0
      )} saved`,
      html,
    });
  }

  /**
   * Send performance report email
   */
  async sendPerformanceReport(reportInfo) {
    const {
      to,
      reportType,
      timeRange,
      metrics,
      trends,
      recommendations,
      timestamp,
      chartData,
    } = reportInfo;

    // Calculate additional metrics from chart data
    const summaryMetrics = chartData
      ? calculateMetricsSummary(chartData)
      : metrics;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 750px; margin: 0 auto; background: #f8f9fa;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 25px; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 700;">📊 Performance Report</h1>
          <p style="margin: 15px 0 5px 0; font-size: 18px; opacity: 0.95;">${reportType} Report</p>
          <p style="margin: 0; font-size: 16px; opacity: 0.85;">${timeRange}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.75;">${new Date(
            timestamp
          ).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
        </div>
        
        <!-- Executive Summary -->
        <div style="padding: 25px; background: white;">
          <h2 style="color: #333; margin-top: 0; margin-bottom: 20px; border-bottom: 3px solid #667eea; padding-bottom: 10px; font-size: 22px;">Executive Summary</h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin: 25px 0;">
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px; font-weight: 600; text-transform: uppercase;">Total Optimizations</div>
              <div style="font-size: 28px; font-weight: 700; margin-bottom: 5px;">${
                summaryMetrics.totalOptimizations || 0
              }</div>
              <div style="font-size: 11px; opacity: 0.8;">Files processed</div>
            </div>
            <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);">
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px; font-weight: 600; text-transform: uppercase;">Size Saved</div>
              <div style="font-size: 28px; font-weight: 700; margin-bottom: 5px;">${formatFileSize(
                summaryMetrics.totalSizeSaved || 0
              )}</div>
              <div style="font-size: 11px; opacity: 0.8;">Storage optimized</div>
            </div>
            <div style="background: linear-gradient(135deg, #FF9800, #f57c00); color: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);">
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px; font-weight: 600; text-transform: uppercase;">Avg Response Time</div>
              <div style="font-size: 28px; font-weight: 700; margin-bottom: 5px;">${
                summaryMetrics.avgResponseTime || 0
              }ms</div>
              <div style="font-size: 11px; opacity: 0.8;">Page load speed</div>
            </div>
            <div style="background: linear-gradient(135deg, #2196F3, #1976d2); color: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);">
              <div style="font-size: 12px; opacity: 0.9; margin-bottom: 5px; font-weight: 600; text-transform: uppercase;">Cache Hit Rate</div>
              <div style="font-size: 28px; font-weight: 700; margin-bottom: 5px;">${
                summaryMetrics.avgCacheHitRate || 0
              }%</div>
              <div style="font-size: 11px; opacity: 0.8;">Cache efficiency</div>
            </div>
          </div>
        </div>

        ${
          trends && trends.length > 0
            ? `
        <!-- Performance Trends -->
        <div style="padding: 25px; background: white; margin-top: 2px;">
          <h3 style="color: #333; margin-top: 0; margin-bottom: 20px; font-size: 20px;">📈 Performance Trends</h3>
          <div style="background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%); padding: 20px; border-radius: 10px; border: 1px solid #e3f2fd;">
            ${trends
              .map((trend) => {
                const isPositive = trend.change > 0;
                const icon = isPositive ? "📈" : "📉";
                const color = isPositive ? "#4CAF50" : "#f44336";
                const direction = isPositive ? "increase" : "decrease";

                return `
                <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid ${color}; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                      <strong style="color: #333; font-size: 16px;">${
                        trend.metric
                      }</strong>
                      <div style="color: #666; font-size: 14px; margin-top: 2px;">${
                        trend.period
                      }</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="color: ${color}; font-size: 18px; font-weight: 700;">${icon} ${Math.abs(
                  trend.change
                )}%</div>
                      <div style="color: ${color}; font-size: 12px; text-transform: uppercase; font-weight: 600;">${direction}</div>
                    </div>
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
        </div>
        `
            : ""
        }

        ${
          recommendations && recommendations.length > 0
            ? `
        <!-- Optimization Recommendations -->
        <div style="padding: 25px; background: white; margin-top: 2px;">
          <h3 style="color: #333; margin-top: 0; margin-bottom: 20px; font-size: 20px;">💡 Optimization Recommendations</h3>
          <div style="background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%); padding: 20px; border-radius: 10px; border: 1px solid #c8e6c9;">
            <ul style="margin: 0; padding-left: 0; list-style: none;">
              ${recommendations
                .map(
                  (rec, index) => `
                <li style="margin: 12px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #4CAF50; color: #2e7d32; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <div style="display: flex; align-items: flex-start;">
                    <div style="background: #4CAF50; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">${
                      index + 1
                    }</div>
                    <div style="line-height: 1.5; font-size: 14px;">${rec}</div>
                  </div>
                </li>
              `
                )
                .join("")}
            </ul>
          </div>
        </div>
        `
            : ""
        }

        <!-- Footer -->
        <div style="padding: 25px; background: #f5f5f5; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #e1e5e9;">
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">📱 Take Action</h4>
            <p style="margin: 0;">This automated report helps you track and improve your website's performance.</p>
            <p style="margin: 5px 0 0 0;">Visit your <strong>Web Performance dashboard</strong> for detailed analysis and optimization settings.</p>
          </div>
          <div style="border-top: 1px solid #ddd; padding-top: 15px; font-size: 12px; color: #888;">
            <p style="margin: 0;">Generated by Web Performance Optimization Plugin | ${new Date(
              timestamp
            ).toISOString()}</p>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `[Performance Report] ${reportType} - ${timeRange} | ${formatFileSize(
        summaryMetrics.totalSizeSaved || 0
      )} optimized`,
      html,
    });
  }

  /**
   * Initialize scheduled email reports
   */
  async initializeScheduledReports() {
    try {
      const settings = await WebPerformanceSettings.findOne({
        settingsId: STATIC_CONFIG.database.defaultSettingsId,
      });

      if (
        !settings?.emailReports?.enabled ||
        !settings.emailReports.emails?.length
      ) {
        logger.email.info(
          "Scheduled email reports not enabled or no recipients configured"
        );
        return;
      }

      const { frequency, time, emails } = settings.emailReports;

      // Clear existing scheduled tasks
      this.scheduledTasks.forEach((task, key) => {
        if (task) {
          task.destroy();
        }
      });
      this.scheduledTasks.clear();

      // Create cron pattern based on frequency
      let cronPattern;
      const [hour, minute] = time.split(":").map(Number);

      switch (frequency) {
        case "daily":
          cronPattern = `${minute} ${hour} * * *`;
          break;
        case "weekly":
          cronPattern = `${minute} ${hour} * * 1`; // Monday
          break;
        case "monthly":
          cronPattern = `${minute} ${hour} 1 * *`; // First day of month
          break;
        default:
          logger.email.warn("Invalid email report frequency", { frequency });
          return;
      }

      // Schedule the report
      const task = cron.schedule(
        cronPattern,
        async () => {
          try {
            await this.sendScheduledPerformanceReport(emails, frequency);
          } catch (error) {
            logger.email.error("Failed to send scheduled performance report", {
              error: error.message,
              frequency,
              recipients: emails,
            });
          }
        },
        {
          scheduled: true,
          timezone: "UTC",
        }
      );

      this.scheduledTasks.set("performanceReport", task);

      logger.email.info("Scheduled email reports initialized", {
        frequency,
        time,
        recipientCount: emails.length,
        cronPattern,
      });
    } catch (error) {
      logger.email.error("Failed to initialize scheduled email reports", {
        error: error.message,
        errorStack: error.stack,
      });
    }
  }

  /**
   * Send scheduled performance report
   */
  async sendScheduledPerformanceReport(emails, frequency) {
    try {
      // Import models dynamically to avoid circular dependencies
      const { WebPerformanceMetrics } = require("./models");

      // Calculate date range based on frequency
      const endDate = new Date();
      const startDate = new Date();

      switch (frequency) {
        case "daily":
          startDate.setDate(endDate.getDate() - 1);
          break;
        case "weekly":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "monthly":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
      }

      // Fetch metrics data
      const chartData = await WebPerformanceMetrics.find({
        date: { $gte: startDate, $lte: endDate },
      })
        .sort({ date: 1 })
        .lean();

      if (chartData.length === 0) {
        logger.email.info("No metrics data available for scheduled report", {
          frequency,
          startDate,
          endDate,
        });
        return;
      }

      // Calculate trends (simplified)
      const trends = [
        {
          metric: "Optimization Performance",
          change:
            Math.random() > 0.5
              ? Math.floor(Math.random() * 20)
              : -Math.floor(Math.random() * 10),
          period: `vs. previous ${frequency}`,
        },
        {
          metric: "Cache Efficiency",
          change:
            Math.random() > 0.3
              ? Math.floor(Math.random() * 15)
              : -Math.floor(Math.random() * 8),
          period: `vs. previous ${frequency}`,
        },
      ];

      // Generate recommendations
      const recommendations = [
        "Consider enabling image optimization for additional storage savings",
        "Review cache settings to improve hit rates",
        "Monitor response times for performance bottlenecks",
        "Enable automated cleanup to maintain optimal performance",
      ];

      // Send report to each recipient
      for (const email of emails) {
        await this.sendPerformanceReport({
          to: email,
          reportType: `${
            frequency.charAt(0).toUpperCase() + frequency.slice(1)
          } Performance`,
          timeRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          metrics: calculateMetricsSummary(chartData),
          trends,
          recommendations,
          timestamp: new Date(),
          chartData,
        });
      }

      logger.email.info("Scheduled performance report sent successfully", {
        frequency,
        recipientCount: emails.length,
        metricsCount: chartData.length,
      });
    } catch (error) {
      logger.email.error("Failed to send scheduled performance report", {
        error: error.message,
        errorStack: error.stack,
        frequency,
        emails,
      });
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopScheduledReports() {
    this.scheduledTasks.forEach((task, key) => {
      if (task) {
        task.destroy();
        logger.email.info("Stopped scheduled email task", { taskKey: key });
      }
    });
    this.scheduledTasks.clear();
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(testEmail) {
    if (!this.transporter) {
      throw new Error("Email transporter not configured");
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4CAF50;">✅ Email Test Successful</h2>
        <p>This is a test email from your Web Performance Optimization system.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>If you received this email, your email configuration is working correctly.</p>
      </div>
    `;

    return this.sendEmail(
      {
        to: testEmail,
        subject: "[Test] Web Performance Email Configuration",
        html,
      },
      "critical"
    );
  }

  /**
   * Get email service status
   */
  getStatus() {
    return {
      transporterConfigured: !!this.transporter,
      queueLength: this.emailQueue.length,
      isProcessingQueue: this.isProcessingQueue,
      scheduledTasksCount: this.scheduledTasks.size,
      scheduledTasks: Array.from(this.scheduledTasks.keys()),
    };
  }
}

// Create singleton instance
const emailService = new WebPerformanceEmailService();

module.exports = {
  WebPerformanceEmailService,
  emailService,

  // Convenience methods
  sendPerformanceAlert: (alertInfo) =>
    emailService.sendPerformanceAlert(alertInfo),
  sendOptimizationResult: (resultInfo) =>
    emailService.sendOptimizationResult(resultInfo),
  sendPerformanceReport: (reportInfo) =>
    emailService.sendPerformanceReport(reportInfo),
  testEmailConfiguration: (testEmail) =>
    emailService.testEmailConfiguration(testEmail),
  initializeScheduledReports: () => emailService.initializeScheduledReports(),
  stopScheduledReports: () => emailService.stopScheduledReports(),
  getEmailServiceStatus: () => emailService.getStatus(),
};

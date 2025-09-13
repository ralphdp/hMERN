const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
};

const APP_LOG_LEVEL =
  process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG;

const log = (level, context, message, ...args) => {
  if (level < APP_LOG_LEVEL) {
    return;
  }

  const timestamp = new Date().toISOString();
  let logMessage;
  let styles = "";

  switch (level) {
    case LogLevel.DEBUG:
      logMessage = `[DEBUG] [${timestamp}] [${context}]: ${message}`;
      styles = "color: #999;";
      break;
    case LogLevel.INFO:
      logMessage = `[INFO] [${timestamp}] [${context}]: ${message}`;
      styles = "color: #007bff;";
      break;
    case LogLevel.WARN:
      logMessage = `[WARN] [${timestamp}] [${context}]: ${message}`;
      styles = "color: #ffc107;";
      break;
    case LogLevel.ERROR:
      logMessage = `[ERROR] [${timestamp}] [${context}]: ${message}`;
      styles = "color: #dc3545;";
      break;
    default:
      return;
  }

  if (args.length > 0) {
    console.log(`%c${logMessage}`, styles, ...args);
  } else {
    console.log(`%c${logMessage}`, styles);
  }
};

const createLogger = (context) => ({
  debug: (message, ...args) => log(LogLevel.DEBUG, context, message, ...args),
  info: (message, ...args) => log(LogLevel.INFO, context, message, ...args),
  warn: (message, ...args) => log(LogLevel.WARN, context, message, ...args),
  error: (message, ...args) => log(LogLevel.ERROR, context, message, ...args),
});

export default createLogger;

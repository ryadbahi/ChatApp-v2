interface LogEntry {
  level: "info" | "warn" | "error";
  message: string;
  context?: any;
  timestamp: string;
  url?: string;
  userAgent?: string;
  userId?: string;
}

class ErrorLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private createLogEntry(
    level: LogEntry["level"],
    message: string,
    context?: any
  ): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      // Add userId if available in your auth context
      userId: this.getCurrentUserId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    // You can implement this to get current user ID from your auth context
    // For now, return undefined
    return undefined;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In production, you might want to send critical errors to a logging service
    if (entry.level === "error") {
      this.sendToLoggingService(entry);
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    // In production, implement this to send to your logging service (e.g., Sentry, LogRocket)
    // For now, just console.error
    console.error("Critical Error:", entry);
  }

  info(message: string, context?: any) {
    const entry = this.createLogEntry("info", message, context);
    this.addLog(entry);
    console.info(message, context);
  }

  warn(message: string, context?: any) {
    const entry = this.createLogEntry("warn", message, context);
    this.addLog(entry);
    console.warn(message, context);
  }

  error(message: string, context?: any) {
    const entry = this.createLogEntry("error", message, context);
    this.addLog(entry);
    console.error(message, context);
  }

  // Log API errors with structured format
  apiError(endpoint: string, method: string, error: any) {
    this.error("API Error", {
      endpoint,
      method,
      status: error?.status,
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
    });
  }

  // Log authentication errors
  authError(action: string, error: any) {
    this.error("Auth Error", {
      action,
      code: error?.code,
      message: error?.message,
      status: error?.status,
    });
  }

  // Log socket errors
  socketError(event: string, error: any) {
    this.error("Socket Error", {
      event,
      code: error?.code,
      message: error?.message,
      type: error?.type,
    });
  }

  // Get recent logs (useful for debugging)
  getRecentLogs(count = 20): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs (useful for support)
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
export const logger = new ErrorLogger();

// Global error handler for unhandled errors
window.addEventListener("error", (event) => {
  logger.error("Unhandled Error", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

// Global handler for unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled Promise Rejection", {
    reason: event.reason,
    stack: event.reason?.stack,
  });
});

/**
 * Request logging middleware for monitoring API usage
 */

const requestLog = [];
const MAX_LOG_SIZE = 1000;

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    // Add to in-memory log
    requestLog.push(logEntry);
    if (requestLog.length > MAX_LOG_SIZE) {
      requestLog.shift();
    }
    
    // Console log for errors and slow requests
    if (res.statusCode >= 400 || duration > 1000) {
      console.log(`[${logEntry.timestamp}] ${logEntry.method} ${logEntry.path} - ${logEntry.statusCode} (${duration}ms)`);
    }
    
    return res.send(data);
  };
  
  next();
};

export const getRequestLogs = (limit = 100) => {
  return requestLog.slice(-limit);
};

export const getErrorLogs = (limit = 50) => {
  return requestLog
    .filter(log => log.statusCode >= 400)
    .slice(-limit);
};

export const getSlowRequests = (threshold = 1000, limit = 50) => {
  return requestLog
    .filter(log => log.duration > threshold)
    .slice(-limit);
};

export const getUsageMetrics = () => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const recentLogs = requestLog.filter(log => 
    new Date(log.timestamp).getTime() > oneHourAgo
  );
  
  const dailyLogs = requestLog.filter(log => 
    new Date(log.timestamp).getTime() > oneDayAgo
  );
  
  return {
    totalRequests: requestLog.length,
    lastHour: recentLogs.length,
    last24Hours: dailyLogs.length,
    errorRate: {
      lastHour: recentLogs.filter(l => l.statusCode >= 400).length / (recentLogs.length || 1),
      last24Hours: dailyLogs.filter(l => l.statusCode >= 400).length / (dailyLogs.length || 1)
    },
    averageResponseTime: {
      lastHour: recentLogs.reduce((sum, l) => sum + l.duration, 0) / (recentLogs.length || 1),
      last24Hours: dailyLogs.reduce((sum, l) => sum + l.duration, 0) / (dailyLogs.length || 1)
    },
    topEndpoints: getTopEndpoints(dailyLogs, 10)
  };
};

const getTopEndpoints = (logs, limit) => {
  const endpointCounts = {};
  logs.forEach(log => {
    const key = `${log.method} ${log.path}`;
    endpointCounts[key] = (endpointCounts[key] || 0) + 1;
  });
  
  return Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([endpoint, count]) => ({ endpoint, count }));
};

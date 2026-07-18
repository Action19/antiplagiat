class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'info';
  }

  getTimestamp() { return new Date().toISOString(); }

  info(message, meta = {}) {
    const metaStr = Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta) : '';
    console.log(`\x1b[36m[${this.getTimestamp()}] [INFO] ${message}${metaStr}\x1b[0m`);
  }

  error(message, meta = {}) {
    const metaStr = Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta) : '';
    console.error(`\x1b[31m[${this.getTimestamp()}] [ERROR] ${message}${metaStr}\x1b[0m`);
  }

  warn(message, meta = {}) {
    const metaStr = Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta) : '';
    console.warn(`\x1b[33m[${this.getTimestamp()}] [WARN] ${message}${metaStr}\x1b[0m`);
  }

  request(method, url, statusCode, duration) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this[level](`${method} ${url} ${statusCode} - ${duration}ms`);
  }
}

module.exports = new Logger();

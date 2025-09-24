module.exports = {
  apps: [{
    name: 'mapestate-api',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Process management
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist/public'],
    max_memory_restart: '1G',
    
    // Auto restart configuration
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Advanced features
    kill_timeout: 5000
  }]
};
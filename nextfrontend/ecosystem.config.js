module.exports = {
  apps: [{
    name: 'nextjs-app',
    script: 'server.js',
    instances: process.env.PM2_INSTANCES || 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // PM2 Configuration
    max_memory_restart: '500M',
    node_args: '--max_old_space_size=400',
    // Logging
    log_file: '/app/logs/app.log',
    out_file: '/app/logs/out.log',
    error_file: '/app/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Restart policy
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    // Health monitoring
    health_check_ping_timeout: 30,
    health_check_max_ping: 3
  }]
};

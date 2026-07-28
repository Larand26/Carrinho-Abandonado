module.exports = {
  apps: [
    {
      name: "carrinho-abandonado",
      script: "dist/index.js",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
      },
    },
  ],
};

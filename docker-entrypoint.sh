#!/bin/sh

# Generate config.js with runtime environment variables
cat > /usr/share/nginx/html/config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  VITE_BACKEND_URL: '${VITE_BACKEND_URL}',
  VITE_WEBTRIT_GOOGLE_PLAY_URL: '${VITE_WEBTRIT_GOOGLE_PLAY_URL:-https://play.google.com/store/apps/details?id=com.webtrit.app}',
  VITE_WEBTRIT_APP_STORE_URL: '${VITE_WEBTRIT_APP_STORE_URL:-https://apps.apple.com/us/app/webtrit/id6450959630}',
  VITE_IS_SIGNUP_COMPANY_SITE: '${VITE_IS_SIGNUP_COMPANY_SITE:-false}',
  VITE_IS_SIGNUP_COMPANY_NAME: '${VITE_IS_SIGNUP_COMPANY_NAME:-false}',
  VITE_IS_SIGNUP_PHONE_NUMBER: '${VITE_IS_SIGNUP_PHONE_NUMBER:-false}',
  VITE_APP_TITLE: '${VITE_APP_TITLE:-NovaSys}',
  VITE_APP_IS_DASHBOARD_INVITE: '${VITE_APP_IS_DASHBOARD_INVITE:-false}',
  VITE_APP_IS_DASHBOARD_DEVELOPER_ACCESS: '${VITE_APP_IS_DASHBOARD_DEVELOPER_ACCESS:-false}',
  VITE_WEBTRIT_DIALER_URL: '${VITE_WEBTRIT_DIALER_URL}',
  VITE_IS_SIGNUP: '${VITE_IS_SIGNUP:-false}',
  VITE_APP_IS_DASHBOARD_CONNECT_PBX: '${VITE_APP_IS_DASHBOARD_CONNECT_PBX:-false}'
};
EOF

echo "Generated config.js:"
cat /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g 'daemon off;'
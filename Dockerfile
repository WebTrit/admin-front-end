# build environment
FROM node:alpine AS build

WORKDIR /app
COPY . .

# Build with default values (will be overridden at runtime)
RUN npm install --legacy-peer-deps
RUN npm run build

# production environment
FROM nginx:stable-alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy config template from build stage
COPY --from=build /app/public/config.js.template /usr/share/nginx/html/config.js.template

# Create entrypoint script
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo '# Set default values for environment variables' >> /docker-entrypoint.sh && \
    echo 'export VITE_BACKEND_URL="${VITE_BACKEND_URL:-https://rest-api-84689730896.europe-west1.run.app}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_WEBTRIT_GOOGLE_PLAY_URL="${VITE_WEBTRIT_GOOGLE_PLAY_URL:-https://play.google.com/store/apps/details?id=com.webtrit.app}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_WEBTRIT_APP_STORE_URL="${VITE_WEBTRIT_APP_STORE_URL:-https://apps.apple.com/us/app/webtrit/id6450959630}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_IS_SIGNUP_COMPANY_SITE="${VITE_IS_SIGNUP_COMPANY_SITE:-false}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_IS_SIGNUP_COMPANY_NAME="${VITE_IS_SIGNUP_COMPANY_NAME:-false}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_IS_SIGNUP_PHONE_NUMBER="${VITE_IS_SIGNUP_PHONE_NUMBER:-false}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_APP_TITLE="${VITE_APP_TITLE:-NovaSys}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_APP_IS_DASHBOARD_INVITE="${VITE_APP_IS_DASHBOARD_INVITE:-false}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_APP_IS_DASHBOARD_DEVELOPER_ACCESS="${VITE_APP_IS_DASHBOARD_DEVELOPER_ACCESS:-false}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_WEBTRIT_DIALER_URL="${VITE_WEBTRIT_DIALER_URL:-https://dialer.etercloud.io}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_IS_SIGNUP="${VITE_IS_SIGNUP:-false}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_APP_IS_DASHBOARD_CONNECT_PBX="${VITE_APP_IS_DASHBOARD_CONNECT_PBX:-false}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_APP_DESCRIPTION="${VITE_APP_DESCRIPTION:-}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_APP_KEYWORDS="${VITE_APP_KEYWORDS:-}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_FAVICON_URL="${VITE_FAVICON_URL:-}"' >> /docker-entrypoint.sh && \
    echo 'export VITE_SHARE_IMAGE_URL="${VITE_SHARE_IMAGE_URL:-}"' >> /docker-entrypoint.sh && \
    echo '# Generate config.js from template' >> /docker-entrypoint.sh && \
    echo 'echo "Generating config.js..."' >> /docker-entrypoint.sh && \
    echo 'envsubst < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js' >> /docker-entrypoint.sh && \
    echo 'echo "Generated config.js content:"' >> /docker-entrypoint.sh && \
    echo 'cat /usr/share/nginx/html/config.js' >> /docker-entrypoint.sh && \
    echo '# Add config.js script tag to index.html' >> /docker-entrypoint.sh && \
    echo 'sed -i "s|<!-- Runtime config loaded in production -->|<script src=\"/config.js\"></script>|g" /usr/share/nginx/html/index.html' >> /docker-entrypoint.sh && \
    echo '# Start nginx' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
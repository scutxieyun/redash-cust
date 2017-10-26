FROM redash/redash
COPY client/app/services/query.js /app/client/app/services/query.js
RUN npm install && npm run build
ENTRYPOINT ["/bin/sh"]
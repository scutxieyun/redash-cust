FROM redash/redash
RUN npm install
COPY client/app/services/query.js /app/client/app/services/query.js
RUN npm run build
ENTRYPOINT ["/bin/sh"]
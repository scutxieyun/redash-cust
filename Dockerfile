FROM redash/redash
RUN pip install pycas
RUN npm install
COPY client/app/services/query.js /app/client/app/services/query.js
COPY client/app/services/query-result.js /app/client/app/services/query-result.js
COPY client/app/components/parameters.js /app/client/app/components/parameters.js 
COPY client/app/components/parameters.html /app/client/app/components/parameters.html 
COPY client/app/pages/queries/query.html /app/client/app/pages/queries/query.html
RUN npm run build
ENTRYPOINT ["/bin/sh"]
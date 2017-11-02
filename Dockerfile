FROM redash/redash
RUN pip install pycas
RUN npm install
COPY client/app/services/query.js /app/client/app/services/query.js
COPY client/app/services/query-result.js /app/client/app/services/query-result.js
COPY client/app/components/parameters.js /app/client/app/components/parameters.js 
COPY client/app/components/parameters.html /app/client/app/components/parameters.html 
COPY client/app/pages/queries/query.html /app/client/app/pages/queries/query.html
RUN npm run build
COPY contribute/oracle/oracle-instantclient12.2-basic_12.2.0.1.0-2_amd64.deb /tmp
USER root
RUN dpkg -i /tmp/oracle-instantclient12.2-basic_12.2.0.1.0-2_amd64.deb 
RUN ln -s /usr/lib/oracle/12.2/client64/lib/libclntsh.so.12.1 /usr/lib/oracle/12.2/client64/lib/libclntsh.so
RUN echo "/usr/lib/oracle/12.2/client64/lib/" > /etc/ld.so.conf.d/oracle.conf 
RUN /sbin/ldconfig
RUN pip install cx_oracle
ENTRYPOINT ["/bin/bash"]
FROM nginx-vod

COPY ytclip-proxy/nginx.conf /etc/nginx/conf/nginx.conf
RUN mkdir -p /var/www/images && mkdir -p /var/www/videos

EXPOSE 80
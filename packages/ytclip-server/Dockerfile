FROM oven/bun

# Install ffmpeg and yt-dlp
RUN apt update && apt install -y ffmpeg libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3
ADD https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux /usr/local/bin/yt-dlp
RUN chmod +x /usr/local/bin/yt-dlp
RUN apt install -y git

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json /app/
RUN mkdir -p /app/packages/ytclip-server
RUN bun install --ignore-scripts

# Install Node
RUN apt install -y wget xz-utils
RUN wget https://nodejs.org/dist/v20.10.0/node-v20.10.0-linux-x64.tar.xz -O ~/node.tar.xz
RUN xz -d ~/node.tar.xz
RUN tar -xvf ~/node.tar -C ~/
RUN mv ~/node-* /usr/local/node
RUN ln -s /usr/local/node/bin/node /usr/local/bin/node && \
    ln -s /usr/local/node/bin/npm /usr/local/bin/npm && \
    ln -s /usr/local/node/bin/npx /usr/local/bin/npx

# Install app dependencies
COPY . /app/

RUN bun install
RUN bun db generate

EXPOSE 3000

CMD ["bash", "-c","bun db migrate:prod && bun server start"]
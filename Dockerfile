FROM denoland/deno

EXPOSE 8000

WORKDIR /app

ADD app/ /app

RUN deno cache server.js

CMD ["run", "--allow-net", "--allow-read", "server.js"]
FROM denoland/deno

EXPOSE 8080

WORKDIR /dir/
COPY app/ /dir/app/

RUN deno cache /dir/app/app.ts

CMD ["run", "--allow-net", "--allow-read", "/dir/app/app.ts"]

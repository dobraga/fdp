import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { Application } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.173.0/http/server.ts";

import router from "./routes/ws.ts";
import createSocketListen from "./routes/socket.ts";

const io = new Server();
const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());
const handler = createSocketListen(io, app)

await serve(handler, {
  port: 8080,
});

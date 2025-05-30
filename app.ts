import { Server } from "socketio";
import { Application } from "oak";
import { serve } from "std";

import router from "./app/routes/ws.ts";
import createSocketListen from "./app/routes/socket.ts";

const io = new Server();
const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());
const handler = createSocketListen(io, app);

await serve(handler, {
  port: 8080,
});

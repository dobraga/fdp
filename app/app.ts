import { config } from "https://deno.land/x/dotenv/mod.ts";
import { Server } from "https://deno.land/x/socket_io/mod.ts";
import { Application } from "https://deno.land/x/oak/mod.ts";
import { serve } from "https://deno.land/std/http/server.ts";

import router from "./routes/ws.ts";
import createGame from "./static/game.js";

const io = new Server();
const app = new Application();
const game = createGame();

app.use(router.routes());
app.use(router.allowedMethods());

io.on("connection", (socket) => {
  let username = socket.id;

  socket.on("new_user", (command) => {
    username = command.id;
    console.log(`<- "new_user" "${JSON.stringify(command)}"`)
    io.emit("new_user", command);
    game.addPlayer(command);
  });

  socket.emit("setup", game.state);

  socket.on("disconnect", () => {
    console.log(`<- "disconnect" "${username}"`)
    io.emit("remove_user", { "id": username });
    game.removePlayer({ "id": username });
  });

  socket.on("selected_card", (command) => {
    console.log(`<-  "selected_card" ${JSON.stringify(command)}`);
    io.emit("selected_card", command);
    game.finishRound(command);
  });

  socket.on("selected_winner", (command) => {
    console.log(`<-  "selected_winner" ${JSON.stringify(command)}`);
    io.emit("selected_winner", command);
    game.setWinner(command);
  })
});

const handler = io.handler(async (req) => {
  return await app.handle(req) || new Response(null, { status: 404 });
});

await serve(handler, {
  hostname: config().HOST,
  port: parseInt(config().PORT),
});

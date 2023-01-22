import { Server } from "https://deno.land/x/socket_io/mod.ts";
import { Application } from "https://deno.land/x/oak/mod.ts";
import { serve } from "https://deno.land/std/http/server.ts";

import router from "./routes/ws.ts";
import createGame from "./static/game.js";
import createDeck from "./static/deck.ts";

const io = new Server();
const app = new Application();
const game = createGame();
const deck = createDeck();

app.use(router.routes());
app.use(router.allowedMethods());

io.on("connection", (socket) => {
  let username = socket.id;

  socket.on("new_user", (command) => {
    console.log(`<- "new_user" "${JSON.stringify(command)}"`);
    username = command.id;

    // If first player, then is the owner of first round.
    if (game.qtdPlayers() == 0) {
      command.round = {
        "card": deck.select({ "type": "black" }),
        "player": username,
      };
      game.setOwnerRound(command);
    }
    io.emit("new_user", command);
    game.addPlayer(command);

    // add user for server and client player
    command.cards = deck.select({ "type": "white", "qtd": 10 });
    socket.emit("set_cards", command);
    game.setCardsHand(command);
  });

  socket.emit("setup", game.state);

  socket.on("disconnect", () => {
    console.log(`<- "disconnect" "${username}"`);
    io.emit("remove_user", { "id": username });
    if (game.yourTurn(username)) {
      console.log("remove_current_owner");
      game.nextTurn();
    }
    game.removePlayer({ "id": username });
  });

  socket.on("selected_card", (command) => {
    console.log(`<-  "selected_card" ${JSON.stringify(command)}`);
    command.nextCard = deck.select({ "type": "white", "qtd": 1 });
    io.emit("finish_round", command);
    game.finishRound(command);
  });

  socket.on("selected_winner", (command) => {
    console.log(`<-  "selected_winner" ${JSON.stringify(command)}`);
    command.newCard = deck.select({ "type": "black" });

    console.log(`->  "next_turn" ${JSON.stringify(command)}`);
    io.emit("next_turn", command);
    game.setWinnerSetupNextTurn(command);
    game.nextTurn();
  });
});

const handler = io.handler(async (req) => {
  return await app.handle(req) || new Response(null, { status: 404 });
});

await serve(handler, {
  port: 8080,
});

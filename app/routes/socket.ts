import { Server, Socket } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { Application } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import createGame from "../static/game.js";
import createDeck from "../static/deck.ts";

const game = createGame();
const deck = createDeck();

export default function createSocketListen(io: Server, app: Application) {
  io.on("connection", (socket: Socket) => {
    let username = socket.id;

    socket.on("new_user", (command) => {
      console.log(`<- "new_user" "${JSON.stringify(command)}"`);
      username = command.id;

      // If first player, then is the owner of first round.
      if (game.qtdPlayers() == 0) {
        command.round = {
          "card": deck.black(),
          "player": username,
        };
        game.setOwnerRound(command);
      }
      io.emit("new_user", command);
      game.addPlayer(command);

      // add user for server and client player
      command.cards = deck.white(10);
      io.emit("set_cards", command);
      game.setCardsHand(command);
    });

    socket.emit("setup", game.state);

    socket.on("disconnect", () => {
      console.log(`<- "disconnect" "${username}"`);
      io.emit("remove_user", { "id": username });
      game.removePlayer({ "id": username });
    });

    socket.on("selected_card", (command) => {
      console.log(`<-  "selected_card" ${JSON.stringify(command)}`);
      command.nextCard = deck.white(command.cards.length);
      io.emit("finish_round", command);
      game.finishRound(command);
    });

    socket.on("selected_winner", (command) => {
      console.log(`<-  "selected_winner" ${JSON.stringify(command)}`);
      command.newRound = deck.black();

      console.log(`->  "next_turn" ${JSON.stringify(command)}`);
      io.emit("next_turn", command);
      game.setWinnerSetupNextTurn(command);
    });
  });

  return io.handler(async (req) => {
    return await app.handle(req) || new Response(null, { status: 404 });
  });
}

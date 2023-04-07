import { Application } from "oak";
import { Server, Socket } from "socketio";
import createGame from "../static/utils/game.js";
import createDeck from "../static/utils/deck.ts";

const game = createGame();
const deck = createDeck();
let id = ""

export default function createSocketListen(io: Server, app: Application) {
  io.on("connection", (socket: Socket) => {
    socket.on("new_user", (command) => {
      id = command.id
      console.log(`<- "new_user" "${JSON.stringify(command)}"`);

      // If first player, then is the owner of first round.
      if (game.qtdPlayers() == 0) {
        command.round = {
          "card": deck.black(),
          "player": command.id,
        };
        game.setOwnerRound(command);
      }
      io.emit("new_user", command);
      game.addPlayer(command);
    });

    socket.on("set_cards", (command) => {
      console.log(`<- "set_cards" "${JSON.stringify(command)}"`);
      if (command.cards.length == 0) {
        command.cards = deck.white(10);

        io.emit("set_cards", command);
        game.setCardsHand(command);
      }
    });

    socket.emit("setup", game.state);

    socket.on("disconnect", () => {
      console.log(`<- "disconnect" "${id}"`);
      io.emit("remove_user", { "id": id });
      game.removePlayer({ "id": id });
    });

    socket.on("selected_card", (command) => {
      console.log(`<- "selected_card" ${JSON.stringify(command)}`);
      command.nextCard = deck.white(command.cards.length);
      io.emit("finish_round", command);
      game.finishRound(command);
    });

    socket.on("selected_winner", (command) => {
      console.log(`<- "selected_winner" ${JSON.stringify(command)}`);
      command.newRound = deck.black();

      console.log(`-> "next_turn" ${JSON.stringify(command)}`);
      io.emit("next_turn", command);
      game.setWinnerSetupNextTurn(command);
    });
  });

  return io.handler(async (req) => {
    return await app.handle(req) || new Response(null, { status: 404 });
  });
}

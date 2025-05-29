import { Application } from "oak";
import { Server, Socket } from "socketio";
import createGame from "../static/utils/game.js";
import createDeck from "../static/utils/deck.ts";

const game = createGame();
const deck = createDeck();

export default function createSocketListen(io: Server, app: Application) {
  const playerSockets = new Map(); // Initialize playerSockets Map

  io.on("connection", (socket: Socket) => {
    let id = ""; //  Declare id within the connection scope

    socket.on("new_user", (command) => {
      try {
        id = command.id;
        playerSockets.set(id, socket); // Store socket on new_user
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
      } catch (error) {
        console.error(`Error in "new_user" event for client ${id}:`, error);
        console.error("Command data:", command);
        // Optionally, emit an error message back to the client
        // socket.emit("event_error", { event: "new_user", message: "An error occurred." });
      }
    });

    socket.on("set_cards", (command) => {
      try {
        console.log(`<- "set_cards" "${JSON.stringify(command)}"`);
        if (command.cards.length == 0) {
          command.cards = deck.white(10);

          socket.emit("set_cards", command); // Changed io.emit to socket.emit
          game.setCardsHand(command);
        }
      } catch (error) {
        console.error(`Error in "set_cards" event for client ${id}:`, error);
        console.error("Command data:", command);
      }
    });

    socket.emit("setup", game.state); // This is less critical for try-catch unless game.state itself could be problematic

    socket.on("disconnect", () => {
      try {
        // id here will refer to the id of the disconnecting client
        console.log(`<- "disconnect" "${id}"`);
        if (id) { // Ensure id is set before trying to delete
          playerSockets.delete(id); // Remove socket on disconnect
        }
        io.emit("remove_user", { "id": id });
        game.removePlayer({ "id": id });
      } catch (error) {
        console.error(`Error in "disconnect" event for client ${id}:`, error);
      }
    });

    socket.on("selected_card", (command) => {
      try {
        const playerId = command.id;
        const submittedCards = command.cards;
        console.log(`<- "selected_card" by ${playerId}: ${JSON.stringify(submittedCards)}`);

        if (!submittedCards || submittedCards.length === 0) {
          console.error(`Player ${playerId} submitted empty or no cards.`);
          // Optionally emit error back to player
          socket.emit("event_error", { event: "selected_card", message: "You must select cards."});
          return;
        }
        
        const newCardsToDraw = submittedCards.length;
        const newCardsForPlayer = deck.white(newCardsToDraw);

        // Update server state about played cards
        game.finishRound({ id: playerId, cards: submittedCards });

        // Broadcast to all players that this player has played
        io.emit("finish_round", { id: playerId, cards: submittedCards });

        // Send new cards only to the player who submitted
        socket.emit("set_cards_response", { id: playerId, new_cards: newCardsForPlayer, played_cards: submittedCards });

      } catch (error) {
        console.error(`Error in "selected_card" event for client ${id}:`, error);
        console.error("Command data:", command);
        // Optionally emit error back to player
        socket.emit("event_error", { event: "selected_card", message: "An error occurred while processing your card selection."});
      }
    });

    socket.on("selected_winner", (command) => {
      try {
        console.log(`<- "selected_winner" ${JSON.stringify(command)}`);
        command.newRound = deck.black();

        console.log(`-> "next_turn" ${JSON.stringify(command)}`);
        io.emit("next_turn", command); // Broadcast next turn info first
        game.setWinnerSetupNextTurn(command); // Update game state (winner, new judge, resets player.round)

        // Card replenishment logic after round ends
        const allPlayerIds = game.getPlayers();
        const newJudgeId = game.getRound().current; // This is the judge for the *next* round

        for (const pId of allPlayerIds) {
          if (pId === newJudgeId) {
            console.log(`Player ${pId} is the new judge, no cards dealt at end of round.`);
            continue; 
          }

          // Player needs their hand replenished up to 10 cards.
          // Note: game.getMyCards(pId) on server reflects hand after set_cards_response if they played.
          const playerHand = game.getMyCards(pId) || [];
          const cardsToDrawCount = Math.max(0, 10 - playerHand.length);

          if (cardsToDrawCount > 0) {
            const newCardsForPId = deck.white(cardsToDrawCount);
            const targetSocket = playerSockets.get(pId);
            if (targetSocket) {
              console.log(`Dealing ${cardsToDrawCount} cards to player ${pId}`);
              targetSocket.emit("deal_cards", { cards: newCardsForPId });
              game.addCardsToHand(pId, newCardsForPId); // Update server's record of the hand
            } else {
              console.warn(`Socket not found for player ${pId} during end-of-round replenishment.`);
            }
          } else {
            console.log(`Player ${pId} already has ${playerHand.length} cards, no new cards needed.`);
          }
        }

      } catch (error) {
        console.error(`Error in "selected_winner" event for client ${id}:`, error);
        console.error("Command data:", command);
      }
    });
  });

  return io.handler(async (req) => {
    return await app.handle(req) || new Response(null, { status: 404 });
  });
}

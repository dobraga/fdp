import { Application } from "oak";
import { Server, Socket } from "socketio";
import createGame from "../static/utils/game.js";
import createDeck from "../static/utils/deck.ts";

// Define types/interfaces for command objects
interface NewUserCommand {
  id: string;
  username: string;
  round?: { // round is optional and added by server
    card: { card: string; qtdSpaces: number }; // from deck.black()
    player: string;
  };
}

interface SetCardsCommand {
  id: string;
  cards: string[];
}

interface SelectedCardCommand {
  id: string;
  cards: string[];
}

// For selected_winner, the command object is modified in place.
// Let's define its initial expected structure and the properties added.
interface SelectedWinnerCommand {
  id: string; // ID of the player who selected the winner (the judge)
  winner: string; // ID of the player whose card(s) won
  cards: string[]; // The winning card(s)
  answer: string; // The black card text
  newRound?: { card: string; qtdSpaces: number }; // Added by server
}


const game = createGame();
const deck = createDeck();

export default function createSocketListen(io: Server, app: Application) {
  const playerSockets = new Map<string, Socket>(); // Initialize playerSockets Map, explicitly typing

  io.on("connection", (socket: Socket) => {
    let id = ""; //  Declare id within the connection scope

    socket.on("new_user", (command: NewUserCommand) => {
      try {
        id = command.id;
        playerSockets.set(id, socket); // Store socket on new_user
        console.log(`<- "new_user" "${JSON.stringify(command)}"`);

        // If first player, then is the owner of first round.
        if (game.qtdPlayers() === 0) { // Use ===
          command.round = { // Server adds this property
            "card": deck.black(),
            "player": command.id,
          };
          game.setOwnerRound(command as Required<NewUserCommand>); // Assert command now has 'round'
        }
        io.emit("new_user", command); // Emit the potentially modified command
        game.addPlayer(command); // Game logic handles player add
      } catch (error) {
        console.error(`Error in "new_user" event for client ${id}:`, error);
        console.error("Command data:", command);
      }
    });

    socket.on("set_cards", (command: SetCardsCommand) => {
      try {
        console.log(`<- "set_cards" "${JSON.stringify(command)}"`);
        if (command.cards.length === 0) { // Use ===
          const newCards = deck.white(10);
          const newCommand = { ...command, cards: newCards }; // Create new object if modifying
          socket.emit("set_cards", newCommand); 
          game.setCardsHand(newCommand);
        } else {
          // If cards are provided, just update the game state (already done by client)
          // This path might be if client sends its initial hand from session storage
          // game.setCardsHand(command); // Ensure server game state is aware if needed
        }
      } catch (error) {
        console.error(`Error in "set_cards" event for client ${id}:`, error);
        console.error("Command data:", command);
      }
    });

    socket.emit("setup", game.state);

    socket.on("disconnect", () => {
      try {
        console.log(`<- "disconnect" "${id}"`);
        if (id) { 
          playerSockets.delete(id); 
        }
        io.emit("remove_user", { "id": id });
        game.removePlayer({ "id": id });
      } catch (error) {
        console.error(`Error in "disconnect" event for client ${id}:`, error);
      }
    });

    socket.on("selected_card", (command: SelectedCardCommand) => {
      try {
        const playerId = command.id;
        const submittedCards = command.cards;
        console.log(`<- "selected_card" by ${playerId}: ${JSON.stringify(submittedCards)}`);

        if (!submittedCards || submittedCards.length === 0) {
          console.error(`Player ${playerId} submitted empty or no cards.`);
          socket.emit("event_error", { event: "selected_card", message: "You must select cards."});
          return;
        }
        
        const newCardsToDraw = submittedCards.length;
        const newCardsForPlayer = deck.white(newCardsToDraw);

        game.finishRound({ id: playerId, cards: submittedCards });
        io.emit("finish_round", { id: playerId, cards: submittedCards });
        socket.emit("set_cards_response", { id: playerId, new_cards: newCardsForPlayer, played_cards: submittedCards });

      } catch (error) {
        console.error(`Error in "selected_card" event for client ${id}:`, error);
        console.error("Command data:", command);
        socket.emit("event_error", { event: "selected_card", message: "An error occurred while processing your card selection."});
      }
    });

    socket.on("selected_winner", (command: SelectedWinnerCommand) => {
      try {
        console.log(`<- "selected_winner" ${JSON.stringify(command)}"`);
        // Server adds newRound to the command object before broadcasting and processing
        const commandWithNewRound = { ...command, newRound: deck.black() };

        console.log(`-> "next_turn" ${JSON.stringify(commandWithNewRound)}`);
        io.emit("next_turn", commandWithNewRound); 
        game.setWinnerSetupNextTurn(commandWithNewRound);

        const allPlayerIds = game.getPlayers();
        const newJudgeId = game.getRound().current; 

        for (const pId of allPlayerIds) {
          if (pId === newJudgeId) {
            console.log(`Player ${pId} is the new judge, no cards dealt at end of round.`);
            continue; 
          }

          const playerHand = game.getMyCards(pId) || [];
          const cardsToDrawCount = Math.max(0, 10 - playerHand.length);

          if (cardsToDrawCount > 0) {
            const newCardsForPId = deck.white(cardsToDrawCount);
            const targetSocket = playerSockets.get(pId);
            if (targetSocket) {
              console.log(`Dealing ${cardsToDrawCount} cards to player ${pId}`);
              targetSocket.emit("deal_cards", { cards: newCardsForPId });
              game.addCardsToHand(pId, newCardsForPId); 
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

  return io.handler(async (req: Request) => { // Added type for req
    return await app.handle(req) || new Response(null, { status: 404 });
  });
}

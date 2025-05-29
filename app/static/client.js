import createGame from "./utils/game.js";
import session from "./utils/session.js";
import { render } from "./utils/renderer.js";

const game = createGame();
const socket = io();
const ses = session();

let id = null;
let username = null;

socket.on("connect", () => {
  try {
    id = ses.getId();
    username = ses.getName();

    console.log(`-> "new_user" "${username}"`);
    socket.emit("new_user", { id: id, username: username });

    const cards = ses.getCards();
    game.setCardsHand({ id: id, cards: cards });
    console.log(`-> "set_cards" "${cards}"`);
    socket.emit("set_cards", { id: id, cards: cards });
  } catch (error) {
    console.error("Error during socket connect:", error);
    // UI feedback: Could show a general connection error message.
  }
});

socket.on("set_cards_response", (command) => {
  try {
    console.log(`<- "set_cards_response" "${JSON.stringify(command)}"`);
    if (command.id !== id) {
      // This message is not for me
      return;
    }

    let currentHand = game.getMyCards(id);
    if (!currentHand) {
      console.error("Current hand not found for player:", id);
      currentHand = []; // Start with an empty hand if none exists
    }
    let mutableHand = [...currentHand]; // Create a mutable copy

    const newCards = [...command.new_cards]; // Copy to allow consuming them
    const playedCards = command.played_cards;

    for (const playedCard of playedCards) {
      const indexInHand = mutableHand.indexOf(playedCard);
      if (indexInHand !== -1) {
        if (newCards.length > 0) {
          mutableHand[indexInHand] = newCards.shift(); // Replace with a new card
        } else {
          // Not enough new cards, remove the played card (or handle as error)
          mutableHand.splice(indexInHand, 1);
          console.warn("Not enough new cards to replace all played cards. Some cards removed.");
        }
      } else {
        console.warn("Played card not found in hand:", playedCard);
      }
    }
    
    // If there are still new cards left and hand size is less than a limit (e.g. 10), add them.
    // This part is optional and depends on game rules (e.g. always draw up to 10).
    // For now, just direct replacement.

    game.setCardsHand({ id: id, cards: mutableHand });
    ses.storeCards(game.getMyCards(id)); // Store the updated hand
    render(game.state, { id: id, username: username }, document, game);

  } catch (error) {
    console.error("Error in 'set_cards_response' event handler:", error, "Command:", command);
    // UI feedback: Could show an error related to card update.
    swal("Erro ao atualizar suas cartas. Tente recarregar a página.");
  }
});

socket.on("deal_cards", (command) => {
  try {
    console.log(`<- "deal_cards" "${JSON.stringify(command)}"`);
    // Assuming 'id' is the current client's id
    const currentCards = game.getMyCards(id) || [];
    const updatedHand = currentCards.concat(command.cards);
    
    game.setCardsHand({ id: id, cards: updatedHand });
    ses.storeCards(game.getMyCards(id)); // Store the updated hand
    render(game.state, { id: id, username: username }, document, game);

  } catch (error) {
    console.error("Error in 'deal_cards' event handler:", error, "Command:", command);
    swal("Erro ao receber novas cartas. Tente recarregar a página.");
  }
});

socket.on("set_cards", (command) => {
  try {
    console.log(`<- "set_cards" "${JSON.stringify(command)}"`);
    game.setCardsHand(command);
    ses.storeCards(game.getMyCards(id));
    render(game.state, { id: id, username: username }, document, game);
  } catch (error) {
    console.error("Error in 'set_cards' event handler:", error, "Command:", command);
    // UI feedback: Could show an error related to card update.
  }
});

socket.on("setup", (state) => {
  try {
    console.log(`<- setup: ${JSON.stringify(state)}`);
    game.setState(state);
  } catch (error) {
    console.error("Error in 'setup' event handler:", error, "State:", state);
    // UI feedback: Could show an error related to game setup.
  }
});

socket.on("new_user", (command) => {
  try {
    console.log(`<- "new_user" "${JSON.stringify(command)}"`);
    game.addPlayer(command);
    game.setOwnerRound(command);
    render(game.state, { id: id, username: username }, document, game);
  } catch (error) {
    console.error("Error in 'new_user' event handler:", error, "Command:", command);
    // UI feedback: Could show an error related to new user joining.
  }
});

socket.on("remove_user", (command) => {
  try {
    console.log(`<- "remove_user" "${JSON.stringify(command)}"`);
    game.removePlayer(command);
    render(game.state, { id: id, username: username }, document, game);
  } catch (error) {
    console.error("Error in 'remove_user' event handler:", error, "Command:", command);
    // UI feedback: Could show an error related to user leaving.
  }
});

socket.on("finish_round", (command) => {
  try {
    console.log(`<- "finish_round" "${JSON.stringify(command)}"`);
    game.finishRound(command);
    render(game.state, { id: id, username: username }, document, game);
  } catch (error) {
    console.error("Error in 'finish_round' event handler:", error, "Command:", command);
    // UI feedback: Could show an error related to round finishing.
  }
});

socket.on("next_turn", (command) => {
  try {
    console.log(`<- "next_turn" "${JSON.stringify(command)}"`);
    game.setWinnerSetupNextTurn(command);
    ses.storeCards(game.getMyCards(id));
    swal(
      `O vencedor foi ${game.getPlayerName(command.winner)}\n\n${
        command.answer
      }\n\n${command.cards}`
    );
    render(game.state, { id: id, username: username }, document, game);
  } catch (error) {
    console.error("Error in 'next_turn' event handler:", error, "Command:", command);
    // UI feedback: Could show an error related to next turn.
  }
});

// Select card
function cardSelected(game) {
  try {
    if (game.isBlocked(id)) {
      swal("Espera sua vez caraio.");
      return;
    }

    const elCards = document.getElementsByClassName("selected");
    const round = game.getRound();

    const cards = Array.from(elCards).map((elem) => elem.innerHTML);
    const command = { id: id, cards: cards };
    if (game.yourTurn(id)) {
      if (elCards.length != 1) {
        swal("Selecione uma carta como vencedora, jumento.");
        return;
      }

      command.winner = elCards[0].getAttribute("id");
      command.answer = round.card;
      console.log(`-> "selected_winner" "${JSON.stringify(command)}"`);
      socket.emit("selected_winner", command);
    } else {
      if (elCards.length != round.qtdSpaces) {
        swal(`Selecione ${round.qtdSpaces} carta(s), jumento.`);
        return;
      }

      console.log(`-> "selected_card" "${JSON.stringify(command)}"`);
      socket.emit("selected_card", command);
    }
  } catch (error) {
    console.error("Error in cardSelected function:", error);
    swal("Ocorreu um erro ao selecionar o card. Tente novamente."); // User feedback
  }
}

document.getElementById("finish").addEventListener("click", () => {
  try {
    cardSelected(game);
  } catch (error) {
    console.error("Error in 'finish' button click listener:", error);
    swal("Ocorreu um erro. Tente novamente."); // User feedback
  }
});

document.getElementById("disconnect").addEventListener("click", () => {
  try {
    ses.clear();
    // UI feedback: Optionally confirm logout or redirect.
    swal("Você foi desconectado.");
  } catch (error) {
    console.error("Error in 'disconnect' button click listener:", error);
    // UI feedback: Could show a generic error message.
  }
});

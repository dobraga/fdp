import shuffle from "./shuffle.js";

const null_state = {
  players: {},
  round: {
    current: null,
    card: null,
    qtdSpaces: 0,
  },
};

export default function createGame() {
  let state = JSON.parse(JSON.stringify(null_state));
  let hand = {};
  let wins = {};

  // Set owner round
  function setOwnerRound(command) {
    if (command.round) {
      state.round.current = command.round.player;
      state.round.card = command.round.card.card;
      state.round.qtdSpaces = command.round.card.qtdSpaces;
    }
  }

  // Add a player
  function addPlayer(command) {
    const id = command.id;
    const name = command.username;

    state.players[id] = {
      name: command.username,
      round: {
        finished: false,
        card: null,
      },
    };
    wins[id] = [];
    console.log(
      `= new client connected: "${name}(${id})", have ${qtdPlayers()} players.`
    );
  }

  // Set cards
  function setCardsHand(command) {
    hand[command.id] = command.cards;
  }

  // Add cards to a player's hand (used by server for replenishment)
  function addCardsToHand(playerId, newCardsArray) {
    if (!hand[playerId]) {
      hand[playerId] = [];
    }
    hand[playerId].push(...newCardsArray);
  }

  // Remove the player
  function removePlayer(command) {
    const id = command.id;
    console.log(`Client ${id} disconnected`);

    const wasOwner = yourTurn(id); // Check if the player was the owner *before* removing them

    delete state.players[id]; // Delete player first
    delete hand[id]; // Also remove their hand data
    delete wins[id]; // And their win record

    if (wasOwner && qtdPlayers() > 0) {
      console.log("Disconnected player was owner, setting next owner.");
      setNextOwnerPlayer();
    }

    // If remove all player clean workspace
    if (qtdPlayers() == 0) {
      console.log("All players disconnected, resetting game state.");
      state = JSON.parse(JSON.stringify(null_state));
      wins = {}; // Ensure wins is also reset
      hand = {}; // Ensure hand is also reset
    }
  }

  // Get list of players
  function getPlayers() {
    return Object.keys(state.players);
  }

  // Set state on setup
  function setState(newState) {
    Object.assign(state, newState);
  }

  // Check if all players finished
  function allPlayersFinished() {
    let finished = true;
    for (const check_id of getPlayers()) {
      finished =
        finished &&
        (yourTurn(check_id) || state.players[check_id].round.finished);
    }
    return finished;
  }

  // Check is blocked
  function isBlocked(id) {
    let check;
    if (yourTurn(id)) {
      if (qtdPlayers() == 1) {
        check = true;
      } else {
        check = !allPlayersFinished();
      }
    } else {
      check = youFinished(id);
    }
    console.log(`= is blocked ${id}? ${check}`);
    return check;
  }

  // Check if is your turn
  function yourTurn(id) {
    if (state.players[id] != undefined) {
      return state.round.current == id;
    }
    return false;
  }

  // Check if the user finish the round
  function youFinished(id) {
    if (state.players[id] != undefined) {
      return state.players[id].round.finished;
    }
    return false;
  }

  // Finish round and prepare next round
  function finishRound(command) { // command expected to have id and cards (played cards)
    if (state.players[command.id] && state.players[command.id].round) {
      state.players[command.id].round.finished = true;
      state.players[command.id].round.cards = command.cards;
      // Remove nextCard logic: state.players[command.id].round.nextCard = command.nextCard;
    } else {
      console.error("Player or player round not found in finishRound:", command.id);
    }
  }

  // buyCard function is removed as replenishment is now server-side.

  // Get selected cards
  function getSelectedCards() {
    const selectedCards = {};
    for (const id of shuffle(getPlayers())) {
      if (state.players[id].round.cards != undefined) {
        selectedCards[id] = state.players[id].round.cards;
      } else {
        selectedCards[id] = "espera os doentes escolherem as cartas";
      }
    }
    return selectedCards;
  }

  // Get position of selected card
  function positionCard(command) {
    return hand[command.id].indexOf(command.card);
  }

  // Get possible cards
  function getMyCards(id) {
    if (state.players[id] != undefined) {
      return hand[id];
    }
  }

  // # players
  function qtdPlayers() {
    return Object.keys(state.players).length;
  }

  // # where the player wins
  function qtdWins(id) {
    const w = wins[id];
    if (w == undefined) {
      return 0;
    }
    return w.length;
  }

  // Get next owner of turn
  function getNextOwnerPlayer() {
    const players = getPlayers();
    const currentPosition = players.indexOf(state.round.current);
    let newPosition = currentPosition + 1;
    if (currentPosition >= qtdPlayers() - 1) {
      newPosition = 0;
    }

    const newPlayerTurn = players[newPosition];
    console.log(
      `Turn pass from "${state.round.current}(position: ${currentPosition})" to "${newPlayerTurn}(position: ${newPosition})"`
    );
    return newPlayerTurn;
  }

  function setNextOwnerPlayer() {
    if (qtdPlayers() === 0) {
      state.round.current = null;
      console.log("setNextOwnerPlayer: No players left, current owner set to null.");
      return;
    }

    const players = getPlayers();
    // If players list becomes empty unexpectedly (should be caught by above)
    if (players.length === 0) {
        state.round.current = null;
        console.log("setNextOwnerPlayer: Players list is empty, current owner set to null.");
        return;
    }
    
    let currentPosition = players.indexOf(state.round.current);
    // If current owner not found or only one player left, new owner is the first player
    if (currentPosition === -1 || players.length === 1) {
        currentPosition = -1; // Will make newPosition 0
    }

    let newPosition = currentPosition + 1;
    if (newPosition >= players.length) { // Use players.length instead of qtdPlayers() for consistency with current list
      newPosition = 0;
    }

    const newPlayerTurn = players[newPosition];
    console.log(
      `Turn pass from "${state.round.current}(position: ${currentPosition})" to "${newPlayerTurn}(position: ${newPosition})"`
    );
    state.round.current = newPlayerTurn;
  }

  // Set winner and setup the next round
  function setWinnerSetupNextTurn(command) {
    const winner = command.winner;

    wins[winner] = wins[winner].concat([
      { cards: command.cards, answer: command.answer },
    ]);

    // Reset round status for all players
    for (const pId of getPlayers()) {
      if (state.players[pId]) { // Check if player exists
        state.players[pId].round = { finished: false, cards: null };
      }
    }
    // The buyCard loop is removed. Card replenishment will be handled in socket.ts

    const commandNextTurn = {
      round: {
        player: getNextOwnerPlayer(),
        card: {
          card: command.newRound.card,
          qtdSpaces: command.newRound.qtdSpaces,
        },
      },
    };
    setOwnerRound(commandNextTurn);
  }

  // Get player name
  function getPlayerName(id) {
    return state.players[id].name;
  }

  // Get current round
  function getRound() {
    return state.round;
  }

  // render function removed, will be handled by renderer.js

  return {
    // render, // Removed
    state,
    hand,
    wins,
    setState,

    addPlayer,
    removePlayer,

    getPlayerName,
    getRound,
    setOwnerRound,
    getPlayers,

    isBlocked,
    finishRound,
    yourTurn,
    youFinished,

    getSelectedCards,
    setCardsHand,
    getMyCards,
    qtdPlayers,
    allPlayersFinished,
    setWinnerSetupNextTurn,
    qtdWins,
    addCardsToHand, // Expose new function
  };
}

// renderListPlayers, renderCards, and addEventListenerCards functions removed, they are now in renderer.js

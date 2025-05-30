import shuffle from "./shuffle.js";

const nullState = {
  players: {},
  round: {
    current: null,
    card: null,
    qtdSpaces: 0,
  },
};

export default function createGame() {
  let state = JSON.parse(JSON.stringify(nullState));
  let hand = {};
  let wins = {};

  /** @param {SetOwnerRoundCommand} command */
  function setOwnerRound(command) {
    if (command.round) {
      state.round.current = command.round.player;
      state.round.card = command.round.card.card;
      state.round.qtdSpaces = command.round.card.qtdSpaces;
    }
  }

  /** @param {PlayerCommand} command */
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

  /** @param {PlayerCommand} command */
  function setCardsHand(command) {
    hand[command.id] = command.cards;
  }

  /**
   * @param {string} playerId
   * @param {string[]} newCardsArray
   */
  function addCardsToHand(playerId, newCardsArray) {
    if (!hand[playerId]) {
      hand[playerId] = [];
    }
    hand[playerId].push(...newCardsArray);
  }

  /** @param {PlayerCommand} command */
  function removePlayer(command) {
    const id = command.id;
    console.log(`Client ${id} disconnected`);

    const wasOwner = yourTurn(id);

    delete state.players[id];
    delete hand[id];
    delete wins[id];

    if (wasOwner && qtdPlayers() > 0) {
      console.log("Disconnected player was owner, setting next owner.");
      setNextOwnerPlayer();
    }

    if (qtdPlayers() === 0) {
      console.log(
        "All players disconnected, resetting game state by modifying existing state object."
      );
      // Modify properties of the existing state object directly
      state.round.current = null;
      state.round.card = null;
      state.round.qtdSpaces = 0;
      state.players = {}; // Clear players from the state object
    }
  }

  function getPlayers() {
    return Object.keys(state.players);
  }

  /** @param {object} newState */ // Using generic object for newState due to its potential complexity
  function setState(newState) {
    Object.assign(state, newState);
  }

  function allPlayersFinished() {
    let finished = true;
    for (const check_id of getPlayers()) {
      finished =
        finished &&
        (yourTurn(check_id) || state.players[check_id].round.finished);
    }
    return finished;
  }

  /** @param {string} id */
  function isBlocked(id) {
    let check;
    if (yourTurn(id)) {
      if (qtdPlayers() === 1) {
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

  /** @param {string} id */
  function yourTurn(id) {
    if (state.players[id] !== undefined) {
      return state.round.current === id;
    }
    return false;
  }

  /** @param {string} id */
  function youFinished(id) {
    if (state.players[id] !== undefined) {
      return state.players[id].round.finished;
    }
    return false;
  }

  /** @param {FinishRoundCommand} command */
  function finishRound(command) {
    if (state.players[command.id] && state.players[command.id].round) {
      state.players[command.id].round.finished = true;
      state.players[command.id].round.cards = command.cards;
    } else {
      console.error(
        "Player or player round not found in finishRound:",
        command.id
      );
    }
  }

  function getSelectedCards() {
    const selectedCards = {};
    for (const id of shuffle(getPlayers())) {
      if (state.players[id].round.cards !== undefined) {
        selectedCards[id] = state.players[id].round.cards;
      } else {
        selectedCards[id] = "espera os doentes escolherem as cartas";
      }
    }
    return selectedCards;
  }

  /** @param {string} id */
  function getMyCards(id) {
    if (state.players[id] !== undefined) {
      return hand[id];
    }
    return undefined;
  }

  function qtdPlayers() {
    return Object.keys(state.players).length;
  }

  /** @param {string} id */
  function qtdWins(id) {
    const w = wins[id];
    if (w === undefined) {
      return 0;
    }
    return w.length;
  }

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
      console.log(
        "setNextOwnerPlayer: No players left, current owner set to null."
      );
      return;
    }

    const players = getPlayers();
    if (players.length === 0) {
      state.round.current = null;
      console.log(
        "setNextOwnerPlayer: Players list is empty, current owner set to null."
      );
      return;
    }

    let currentPosition = players.indexOf(state.round.current);
    if (currentPosition === -1 || players.length === 1) {
      currentPosition = -1;
    }

    let newPosition = currentPosition + 1;
    if (newPosition >= players.length) {
      newPosition = 0;
    }

    const newPlayerTurn = players[newPosition];
    console.log(
      `Turn pass from "${state.round.current}(position: ${currentPosition})" to "${newPlayerTurn}(position: ${newPosition})"`
    );
    state.round.current = newPlayerTurn;
  }

  /** @param {SetWinnerCommand} command */
  function setWinnerSetupNextTurn(command) {
    const winner = command.winner;

    wins[winner] = wins[winner].concat([
      { cards: command.cards, answer: command.answer },
    ]);

    for (const pId of getPlayers()) {
      if (state.players[pId]) {
        state.players[pId].round = { finished: false, cards: null };
      }
    }

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

  /** @param {string} id */
  function getPlayerName(id) {
    if (state.players[id]) {
      return state.players[id].name;
    }
    return "Unknown Player";
  }

  function getRound() {
    return state.round;
  }

  return {
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
    addCardsToHand,
  };
}

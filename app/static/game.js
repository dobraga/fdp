export default function createGame() {
  const state = {
    players: {},
    round: {
      current: null,
      card: null,
    },
    qtdPlayers: 0,
    cards_white: [],
    cards_black: [],
  };

  // Add a player
  function addPlayer(command) {
    const id = command.id;

    state.players[id] = {
      hand: state.cards_white.splice(0, 5),
      wins: [],
      round: {
        finished: false,
        card: null,
      },
    };
    state.qtdPlayers += 1;

    if (qtdPlayers() == 1 || !state.round.current) {
      state.round.card = state.cards_black.pop();
      state.round.current = id;
    }

    console.log(`New client connected: ${id}`);
  }

  // Remove the player
  function removePlayer(command) {
    const id = command.id;
    console.log(`Client ${id} disconnected`);
    delete state.players[id];
    state.qtdPlayers -= 1;
  }

  // Get list of players
  function getPlayers() {
    return Object.keys(state.players);
  }

  // Set state
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

  // Selected card
  function finishRound(command) {
    state.players[command.id].round.finished = true;
    state.players[command.id].round.card = command.card;
  }

  // Get selected cards
  function getSelectedCards() {
    const selectedCards = {};

    for (const id of getPlayers()) {
      if (state.players[id].round.card != undefined) {
        selectedCards[id] = state.players[id].round.card;
      }
    }

    return selectedCards;
  }

  // Get possible cards
  function getMyCards(id) {
    if (state.players[id] != undefined) {
      return state.players[id].hand;
    }
  }

  // # players
  function qtdPlayers() {
    return state.qtdPlayers;
  }

  // # where the player wins
  function qtdWins(id) {
    return state.players[id].wins.length;
  }

  // Set winner and next round
  function setWinner(command) {
    const players = getPlayers();
    const currentPosition = players.indexOf(command.id);
    state.players[command.winner].wins.push(command);

    let newPosition = currentPosition + 1;
    if (currentPosition >= qtdPlayers() - 1) {
      newPosition = 0;
    }

    const newPlayerTurn = players[newPosition];
    console.log(
      `In this turn pass from "${command.id}(position: ${currentPosition})" to "${newPlayerTurn}(position: ${newPosition})"`
    );
    state.round.current = newPlayerTurn;

    for (const id of getPlayers()) {
      const index = state.players[id].hand.indexOf(
        state.players[id].round.card
      );
      state.players[id].hand[index] = state.cards_white.pop()
      state.players[id].round = { finished: false, card: null };
    }

    state.round.card = state.cards_black.pop();
  }

  return {
    state,
    addPlayer,
    removePlayer,
    setState,
    isBlocked,
    finishRound,
    yourTurn,
    youFinished,
    getSelectedCards,
    getMyCards,
    qtdPlayers,
    allPlayersFinished,
    setWinner,
    qtdWins,
  };
}

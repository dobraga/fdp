export default function createGame() {
  const players = {};

  // Add a player
  function addPlayer(command) {
    const id = command.id;

    players[id] = {
      hand: ["123", "456", "789", "10", "11"],
      wins: [],
      round: {
        yourTurn: qtdPlayers() == 0,
        finished: false,
        card: null,
      },
    };
    console.log(
      `New client connected: ${id} -> ${JSON.stringify(players[id])}`
    );
  }

  // Remove the player
  function removePlayer(command) {
    const id = command.id;
    console.log(`Client ${id} disconnected`);
    delete players[id];
  }

  // Set players
  function setPlayers(newPlayers) {
    Object.assign(players, newPlayers);
  }

  // All players finished
  function allPlayersFinished() {
    var finished = true;
    for (const check_id of Object.keys(players)) {
      finished =
        finished &&
        (players[check_id].round.yourTurn || players[check_id].round.finished);
    }
    return finished;
  }

  // Is blocked
  function isBlocked(id) {
    if (yourTurn(id)) {
      if (qtdPlayers() == 1) {
        var check = true;
      } else {
        var check = !allPlayersFinished();
      }
    } else {
      var check = youFinished(id);
    }
    console.log(`= is blocked ${id}? ${check}`);
    return check;
  }

  // Your turn
  function yourTurn(id) {
    if (players[id] != undefined) {
      return players[id].round.yourTurn;
    }
    return false
  }

  // YourFinished(id)
  function youFinished(id) {
    if (players[id] != undefined) {
      return players[id].round.finished;
    }
    return false
  }

  // Selected card
  function finishRound(command) {
    players[command.id].round.finished = true;
    players[command.id].round.card = command.card;
  }

  // Get selected cards
  function getSelectedCards() {
    var selectedCards = {};

    for (const id of Object.keys(players)) {
      if (players[id].round.card != undefined){
        selectedCards[id] = players[id].round.card.card;
      }
    }

    return selectedCards;
  }

  // 
  function getMyCards(id) {
    if (players[id] != undefined) {
      return players[id].hand
    }
  }

  // # players
  function qtdPlayers() {
    return Object.keys(players).length;
  }

  return {
    players,
    addPlayer,
    removePlayer,
    setPlayers,
    isBlocked,
    finishRound,
    yourTurn,
    youFinished,
    getSelectedCards,
    getMyCards,
    qtdPlayers,
    allPlayersFinished,
  };
}

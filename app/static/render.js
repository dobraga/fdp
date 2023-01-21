export default function render(game, username) {
  renderListPlayers(game, username);
  renderCards(game, username);
}

function renderListPlayers(game, username) {
  const ul = document.querySelector("#users");
  ul.innerHTML = "";

  for (const player in game.state.players) {
    const yourTurn = game.yourTurn(player);
    const li = document.createElement("li");
    const qtdWins = game.qtdWins(player);
    li.appendChild(document.createTextNode(`${player}(${qtdWins})`));

    if (game.youFinished(player)) {
      li.style.backgroundColor = "#3C6255";
      li.style.borderRadius = "5px";
      li.style.padding = "3px 5px 3px 5px";
    }
    if (yourTurn) {
      li.style.backgroundColor = "#6C00FF";
      li.style.borderRadius = "5px";
      li.style.padding = "3px 5px 3px 5px";
    }
    if (player == username) {
      li.style.color = "#FD8A8A";
    }
    ul.appendChild(li);
  }
}

function renderCards(game, username) {
  const cards = document.querySelector("#cards");
  const isBlocked = game.isBlocked(username);
  cards.innerHTML = "";

  if (game.yourTurn(username)) {
    const selectedCards = game.getSelectedCards();
    const finished = game.allPlayersFinished();

    for (const selected in selectedCards) {
      const card = document.createElement("div");
      card.className = "card";
      if (finished) {
        card.innerHTML = selectedCards[selected];
        const att = document.createAttribute('id');
        card.setAttributeNode(att);
        att.value = selected;
        addEventListenerCards(card);
      }
      cards.appendChild(card);
    }
  } else {
    const myCards = game.getMyCards(username);
    for (const i in myCards) {
      const card = document.createElement("div");
      
      card.className = "card";
      card.innerHTML = myCards[i];
      if (!isBlocked) {
        addEventListenerCards(card);
      }
      cards.appendChild(card);
    }
  }
}

// Make the card is clickable
function addEventListenerCards(card) {
  card.style.cursor = "pointer";
  card.addEventListener("click", (el) => {
    const allCards = Array.from(document.getElementsByClassName("card"));

    allCards.forEach((newel) => {
      newel.classList.remove("selected");
    });

    el.target.classList.add("selected");
  });
}

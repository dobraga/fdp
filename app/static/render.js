export default function render(game, username) {
  console.log(`Rendering page for ${username}`)
  renderListPlayers(game, username);
  renderCards(game, username);
}

function renderListPlayers(game, username) {
  const div = document.getElementById("users");
  div.innerHTML = "";

  for (const player in game.state.players) {
    const li = document.createElement("div");
    const qtdWins = game.qtdWins(player);
    li.appendChild(document.createTextNode(`${player}(${qtdWins})`));
    li.classList.add("user");

    if (game.youFinished(player)) {
      li.classList.add("finished");
    }
    if (game.yourTurn(player)) {
      li.classList.add("turn");
    }
    if (player == username) {
      li.classList.add("you");
    }
    div.appendChild(li);
  }
}

function renderCards(game, username) {
  const yourTurn = game.yourTurn(username);
  const cards = document.getElementById("cards");
  const isBlocked = game.isBlocked(username);
  cards.innerHTML = "";

  console.log(`Your turn? ${yourTurn}`)
  document.querySelector("#principal_card").innerHTML = game.state.round.card;

  if (yourTurn) {
    const selectedCards = game.getSelectedCards();
    const finished = game.allPlayersFinished();
    console.log(`Others players finished? ${finished}`);

    for (const selected in selectedCards) {
      if (selected == username) {
        continue
      }
      const card = document.createElement("div");
      card.className = "card";
      if (finished) {
        card.innerHTML = selectedCards[selected].join("<br />|+|<br />");
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
    el.target.classList.toggle("selected");
  });
}

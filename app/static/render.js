export default function render(game, username) {
  renderListPlayers(game, username);
  renderCards(game, username);
}

function renderListPlayers(game, username) {
  var ul = document.querySelector("#users");
  ul.innerHTML = "";

  for (const player in game.players) {
    var yourTurn = game.yourTurn(player);

    var li = document.createElement("li");
    li.appendChild(document.createTextNode(player));

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
  var cards = document.querySelector("#cards");
  cards.innerHTML = "";
  var isBlocked = game.isBlocked(username);

  if (game.yourTurn(username)) {
    var qtdPlayers = game.qtdPlayers() - 1;
    var selectedCards = game.getSelectedCards();
    var finished = game.allPlayersFinished();

    for (const i of Array(qtdPlayers).keys()) {
      var card = document.createElement("div");
      card.className = "card";
      if (finished) {
        card.innerHTML = selectedCards[i];
        addEventListenerCards(card);
      }
      cards.appendChild(card);
    }
  } else {
    var myCards = game.getMyCards(username);
    console.log(myCards);
    for (const i in myCards) {
      var card = document.createElement("div");

      card.className = "card";
      card.innerHTML = myCards[i];
      if (!isBlocked) {
        addEventListenerCards(card);
      }

      cards.appendChild(card);
    }
  }
}

function addEventListenerCards(card) {
  card.addEventListener("click", (el) => {
    console.log("clicked");
    const allCards = Array.from(document.getElementsByClassName("card"));

    allCards.forEach((newel) => {
      newel.classList.remove("selected");
    });

    el.target.classList.add("selected");
  });
}

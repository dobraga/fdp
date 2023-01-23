import cards_white from "./cards_white.json" assert { type: "json" };
import cards_black from "./cards_black.json" assert { type: "json" };
import shuffle from "./shuffle.ts";

export default function createDeck() {
  function white(qtdCards: number) {
    return shuffle(cards_white).slice(0, qtdCards);
  }

  function black() {
    const card = shuffle(cards_black).slice(0, 1)[0];
    const qtdCards = Math.max([...card.matchAll(/_+/g)].length, 1);
    return { card: card, qtdSpaces: qtdCards };
  }

  return { black, white };
}

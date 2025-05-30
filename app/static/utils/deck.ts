import cards_white from "../data/cards_white.json" with { type: "json" };
import cards_black from "../data/cards_black.json" with { type: "json" };
import shuffle from "./shuffle.js";

export default function createDeck() {
  function white(qtdCards: number): Array<string> {
    return shuffle(cards_white).slice(0, qtdCards);
  }

  function black(): Black {
    const card: string = shuffle(cards_black).slice(0, 1)[0];
    const qtdCards = Math.max([...card.matchAll(/_+/g)].length, 1); // Semicolon added
    return { "card": card, "qtdSpaces": qtdCards };
  }

  return { black, white };
}

type Black = {
  card: string;
  qtdSpaces: number;
};

import cards_white from "./cards_white.json" assert { type: "json" };
import cards_black from "./cards_black.json" assert { type: "json" };
import shuffle from "./shuffle.ts";

export default function createDeck() {
    function select(command) {
        if (command.type == 'white') {
            return shuffle(cards_white).slice(0, command.qtd)
        } else {
            return shuffle(cards_black).slice(0, 1)[0]
        }
    }

    return {
        select
    }
}
from re import sub
import pandas as pd
from rapidfuzz import fuzz


def remove_non_alfanum(text):
    return sub('[^ A-zÀ-ú0-9]+', '', text).strip().upper()

def compare_ord(line):
    compare = [{'card': a, 
                'ratio': fuzz.ratio(remove_non_alfanum(a),
                                    remove_non_alfanum(line.original))}
                for a in line.all_cards if a != line.original]
    compare = list(sorted(compare, key=lambda x: -x['ratio']))[0]
    return compare


def _main():
    cards = pd.read_json(FILE)
    cards.columns = ['original']
    cards = cards.drop_duplicates()
    cards.original.to_json(FILE, indent=4, orient ='records', force_ascii=False)

    cards['all_cards'] = [cards['original'].to_list()]*cards.shape[0]
    cards[['compared_card', 'ratio']] = cards.apply(compare_ord, axis=1).apply(pd.Series)
    return cards.drop(columns=['all_cards']).sort_values('ratio', ascending=False)

FILE = '../app/static/data/cards_white.json'


if __name__ == '__main__':
    cards = _main()
    print(cards.head(30))

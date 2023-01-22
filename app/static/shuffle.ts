export default function shuffle(array: string[]) {
    return array.sort(function () {
      return Math.random() - 0.5;
    });
}
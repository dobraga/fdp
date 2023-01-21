export default function shuffle(array) {
    return array.sort(function () {
      return Math.random() - 0.5;
    });
}
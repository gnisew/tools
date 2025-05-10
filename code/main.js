const sentences = [
  "The quick brown fox jumps over the lazy dog.",
  "She sells seashells by the seashore.",
  "Peter Piper picked a peck of pickled peppers.",
  "I scream, you scream, we all scream for ice cream.",
  "To be or not to be, that is the question.",
  "The cat in the hat comes back."
];

let sentence;
let words;
let message;
let draggingWord;

function shuffleWords() {
  for (let i = words.children.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    words.insertBefore(words.children[j], words.children[i]);
  }
}

function reset() {
  sentence = sentences[Math.floor(Math.random() * sentences.length)];
  words.innerHTML = "";
  message.textContent = "句子重組";
  draggingWord = null;
  const wordArray = sentence.split(" ");
  wordArray.forEach(word => {
    const div = document.createElement("div");
    div.classList.add("word");
    div.textContent = word;
    div.draggable = true;
    words.appendChild(div);
  });
  shuffleWords();
}

function checkAnswer() {
  const answer = Array.from(words.children)
    .map(word => word.textContent)
    .join(" ");
  if (answer === sentence) {
    message.textContent = "恭喜你答對了！";
  } else {
    message.textContent = "...";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  words = document.getElementById("words");
  message = document.getElementById("message");
  reset();

  words.addEventListener("dragstart", e => {
    draggingWord = e.target;
    draggingWord.classList.add("dragging");
  });

  words.addEventListener("dragend", e => {
    draggingWord.classList.remove("dragging");
    draggingWord.classList.remove("dragover");
    draggingWord = null;
  });

  words.addEventListener("dragover", e => {
    e.preventDefault();
    if (draggingWord && draggingWord !== e.target) {
      e.target.classList.add("dragover");
    }
  });

  words.addEventListener("dragleave", e => {
    if (draggingWord && draggingWord !== e.target) {
      e.target.classList.remove("dragover");
    }
  });

  words.addEventListener("drop", e => {
    e.preventDefault();
    if (draggingWord && draggingWord !== e.target) {
      const index1 = Array.from(words.children).indexOf(draggingWord);
      const index2 = Array.from(words.children).indexOf(e.target);
      if (index1 < index2) {
        words.insertBefore(draggingWord, e.target.nextSibling);
      } else {
        words.insertBefore(draggingWord, e.target);
      }
      checkAnswer();
    }
    e.target.classList.remove("dragover");
  });

  document.getElementById("start").addEventListener("click", () => {
    reset();
  });

  document.getElementById("restart").addEventListener("click", () => {
    reset();
  });

  document.getElementById("quit").addEventListener("click", () => {
    message.textContent = sentence;
  });

});

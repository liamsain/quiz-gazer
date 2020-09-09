"use strict";
let headerTextEl;
let leftAnswerEl;
let rightAnswerEl;
let timeLeftEl;
let subtitleTextEl;

let leftAnswerBoundingClientRect;
let rightAnswerBoundingClientRect;
let leftAnswerCount = 0;
let rightAnswerCount = 0;
let correctAnswerCount = 0;
let incorrectAnswerCount = 0;

let timeout;
let dateTimeTimerStarted;
const secondsPerQuestion = 15;

let triviaQuestions = [];
let currentQuestion;

class TriviaQuestion {
  constructor(config) {
    this.correctAnswer = config.correct_answer;
    this.choices = [this.correctAnswer, config.incorrect_answers[0]];
    this.question = config.question;
    this.category = config.category;
  }
}

window.onload = async () => {
  leftAnswerEl = document.querySelector('#left-answer');
  rightAnswerEl = document.querySelector('#right-answer');
  headerTextEl = document.querySelector('#header-text');
  timeLeftEl = document.querySelector('#time-left');
  subtitleTextEl = document.querySelector('#subtitle-text');
  leftAnswerBoundingClientRect = leftAnswerEl.getBoundingClientRect();
  rightAnswerBoundingClientRect = rightAnswerEl.getBoundingClientRect();

  webgazer.params.showVideoPreview = true;
  await webgazer
    .setGazeListener(function (data, clock) {
      if (!data) {
        return;
      }
      onWebgazerTick(data);
    }).begin();
  webgazer.showPredictionPoints(true);
  // setTimeout(() => {
  fetch('https://opentdb.com/api.php?amount=10')
    .then(response => response.json())
    .then(data => {
      triviaQuestions = data.results.map(x => new TriviaQuestion(x));
      currentQuestion = triviaQuestions[0];
      renderCurrentQuestion();
      startTimer();
    })
    .catch((error) => {
      alert(`Failed to fetch trivia questions. Message: ${error} `);
    });
  // }, 3000);

};
window.onbeforeunload = function() {
    webgazer.end();
}

function renderCurrentQuestion() {
  headerTextEl.innerHTML = currentQuestion.question;
  leftAnswerEl.innerHTML = currentQuestion.choices[0];
  rightAnswerEl.innerHTML = currentQuestion.choices[1];
}

function coordsCollideWithBoundingClientRect(coords, boundingClientRect) {
  return coords.x >= boundingClientRect.x &&
    coords.x <= boundingClientRect.x + boundingClientRect.width &&
    coords.y >= boundingClientRect.y &&
    coords.y <= boundingClientRect.y + boundingClientRect.height;
}

function onWebgazerTick(data) {
  if (coordsCollideWithBoundingClientRect({x: data.x, y: data.y}, leftAnswerBoundingClientRect)) {
    leftAnswerCount += 1;
  }
  if (coordsCollideWithBoundingClientRect({x: data.x, y: data.y}, rightAnswerBoundingClientRect)) {
    rightAnswerCount += 1;
  }
}

function startTimer() {
  const now = new Date();
  if (!dateTimeTimerStarted) {
    dateTimeTimerStarted = new Date();
  }
  const secondsBetweenTimerStartAndNow = (now - dateTimeTimerStarted) / 1000;
  const secondsElapsed = Math.round(secondsBetweenTimerStartAndNow);
  let secondsLeftToAnswer = secondsPerQuestion - secondsElapsed;
  timeLeftEl.innerText = `Seconds left: ${secondsLeftToAnswer}`;
  if (secondsLeftToAnswer <= 0 ) {
    clearTimeout(timeout);
    endOfRound();
    return;
  }

  timeout = setTimeout(startTimer, 100);
}

function endOfRound() {
  const finalAnswer = leftAnswerCount > rightAnswerCount ? leftAnswerEl.innerHTML : rightAnswerEl.innerHTML;
  const isCorrect = currentQuestion.correctAnswer === finalAnswer;
  if (isCorrect) {
    correctAnswerCount += 1;
  } else {
    incorrectAnswerCount += 1;
  }
  subtitleTextEl.innerHTML = `Your final answer: ${finalAnswer}. That is ${isCorrect ? 'correct' : 'incorrect'}`;

  leftAnswerCount = 0;
  rightAnswerCount = 0;
  triviaQuestions.shift();
  if (triviaQuestions.length) {
    currentQuestion = triviaQuestions[0];
    dateTimeTimerStarted = null;
    renderCurrentQuestion();
    startTimer();
  }
}


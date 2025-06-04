// Constants for timer durations (in seconds)
const WORK_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;
const POMODOROS_PER_CYCLE = 4;

// DOM Elements
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const progressRing = document.querySelector('.progress-ring-circle');
const pomodoroCount = document.getElementById('pomodoro-count');
const phaseDisplay = document.getElementById('phase-display');

// Get the circumference of the progress ring
const radius = parseInt(progressRing.getAttribute('r'));
const circumference = 2 * Math.PI * radius;
progressRing.style.strokeDasharray = `${circumference}`;

// State variables
let timerInterval = null;
let timeRemaining = WORK_TIME;
let totalTime = WORK_TIME;
let isPaused = true;
let isWorkPhase = true;
let completedPomodoros = 0;
let currentCyclePosition = 0;

// Initialize
loadPomodoroCount();
updateDisplay();
updateDotIndicators();

// Set up event listeners
startPauseBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);

// Function to load the pomodoro count from local storage
function loadPomodoroCount() {
    const saved = localStorage.getItem('pomodoroCount');
    if (saved !== null) {
        completedPomodoros = parseInt(saved);
        pomodoroCount.textContent = completedPomodoros;
    }
}

// Function to save the pomodoro count to local storage
function savePomodoroCount() {
    localStorage.setItem('pomodoroCount', completedPomodoros.toString());
}

// Function to toggle timer state (start/pause)
function toggleTimer() {
    if (isPaused) {
        // Start the timer
        startTimer();
        startPauseBtn.textContent = '一時停止';
        startPauseBtn.classList.remove('start');
        startPauseBtn.classList.add('pause');
    } else {
        // Pause the timer
        pauseTimer();
        startPauseBtn.textContent = '再開';
        startPauseBtn.classList.remove('pause');
        startPauseBtn.classList.add('start');
    }
    isPaused = !isPaused;
}

// Function to start the timer
function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            playAlertSound();
            handlePhaseComplete();
        }
    }, 1000);
}

// Function to pause the timer
function pauseTimer() {
    clearInterval(timerInterval);
}

// Function to reset the timer
function resetTimer() {
    pauseTimer();
    if (isWorkPhase) {
        timeRemaining = WORK_TIME;
        totalTime = WORK_TIME;
    } else {
        if (currentCyclePosition === 0) {
            // Long break
            timeRemaining = LONG_BREAK_TIME;
            totalTime = LONG_BREAK_TIME;
        } else {
            // Short break
            timeRemaining = SHORT_BREAK_TIME;
            totalTime = SHORT_BREAK_TIME;
        }
    }
    isPaused = true;
    startPauseBtn.textContent = 'スタート';
    startPauseBtn.classList.remove('pause');
    startPauseBtn.classList.add('start');
    updateDisplay();
}

// Function to update the timer display and progress ring
function updateDisplay() {
    // Update minutes and seconds display
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');
    
    // Update progress ring
    const progress = 1 - (timeRemaining / totalTime);
    const offset = circumference * progress;
    progressRing.style.strokeDashoffset = offset;
}

// Function to play alert sound when timer ends
function playAlertSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Function to handle phase completion
function handlePhaseComplete() {
    if (isWorkPhase) {
        // Completed a pomodoro
        completedPomodoros++;
        pomodoroCount.textContent = completedPomodoros;
        savePomodoroCount();
        
        // Move to the next position in the cycle
        currentCyclePosition = (currentCyclePosition + 1) % POMODOROS_PER_CYCLE;
        
        // Check if it's time for a long break or short break
        if (currentCyclePosition === 0) {
            // Time for a long break
            switchToBreak(true);
        } else {
            // Time for a short break
            switchToBreak(false);
        }
    } else {
        // Break completed, back to work
        switchToWork();
    }
    
    updateDotIndicators();
}

// Function to switch to break phase
function switchToBreak(isLongBreak) {
    isWorkPhase = false;
    
    if (isLongBreak) {
        // Long break phase
        document.body.classList.remove('break');
        document.body.classList.add('long-break');
        timeRemaining = LONG_BREAK_TIME;
        totalTime = LONG_BREAK_TIME;
        phaseDisplay.textContent = '長い休憩';
    } else {
        // Short break phase
        document.body.classList.add('break');
        document.body.classList.remove('long-break');
        timeRemaining = SHORT_BREAK_TIME;
        totalTime = SHORT_BREAK_TIME;
        phaseDisplay.textContent = '休憩時間';
    }
    
    updateDisplay();
    startTimer();
}

// Function to switch to work phase
function switchToWork() {
    isWorkPhase = true;
    timeRemaining = WORK_TIME;
    totalTime = WORK_TIME;
    document.body.classList.remove('break', 'long-break');
    phaseDisplay.textContent = '作業時間';
    
    updateDisplay();
    startTimer();
}

// Function to update the dot indicators based on the current cycle position
function updateDotIndicators() {
    const dots = document.querySelectorAll('.indicator-dot');
    
    dots.forEach((dot, index) => {
        if (index < currentCyclePosition) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

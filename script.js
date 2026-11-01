const DEFAULT_STATE = {
    name: "Mochi",
    type: "cat",
    hunger: 20,
    happiness: 85,
    energy: 80,
    cleanliness: 90,
    careCount: 0,
    actionsToday: [],
    lastDate: new Date().toLocaleDateString("en-CA")
};

const PETS = {
    cat: {
        emoji: "🐱",
        name: "Mochi",
        sounds: {
            feed: "Meow! That was delicious! 😻",
            play: "Yay! I love chasing toys! 🎾",
            sleep: "Purr... this is so cozy. 😴",
            clean: "I'm looking fabulous! ✨"
        }
    },

    dog: {
        emoji: "🐶",
        name: "Buddy",
        sounds: {
            feed: "Woof! That was yummy! 🦴",
            play: "Woof woof! Throw the ball again! 🐕",
            sleep: "Zzz... dreaming of treats. 💤",
            clean: "I'm a fresh and happy pup! 🫧"
        }
    },

    rabbit: {
        emoji: "🐰",
        name: "Coco",
        sounds: {
            feed: "Munch munch! More carrots, please! 🥕",
            play: "Boing! That was so much fun! 🌸",
            sleep: "Time for a tiny bunny nap. 😴",
            clean: "My fur feels so soft! ✨"
        }
    },

    fox: {
        emoji: "🦊",
        name: "Rusty",
        sounds: {
            feed: "Yum! My tummy is happy! 🍎",
            play: "Catch me if you can! 🦊",
            sleep: "Even clever foxes need rest. 🌙",
            clean: "Looking clever and clean! ✨"
        }
    }
};

const $ = (id) => document.getElementById(id);

const elements = {
    petName: $("petName"),
    petEmoji: $("petEmoji"),
    petCharacter: $("petCharacter"),
    petMood: $("petMood"),
    moodIndicator: $("moodIndicator"),
    petMessage: $("petMessage"),
    hearts: $("hearts"),

    hungerBar: $("hungerBar"),
    happinessBar: $("happinessBar"),
    energyBar: $("energyBar"),
    cleanlinessBar: $("cleanlinessBar"),

    hungerValue: $("hungerValue"),
    happinessValue: $("happinessValue"),
    energyValue: $("energyValue"),
    cleanlinessValue: $("cleanlinessValue"),

    careCount: $("careCount"),
    dailyProgressBar: $("dailyProgressBar"),
    dailyProgressText: $("dailyProgressText"),

    renameDialog: $("renameDialog"),
    nameInput: $("nameInput")
};

let state = loadState();
let messageTimeout = null;
let actionTimeout = null;

function todayString() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function loadState() {
    try {
        const saved = localStorage.getItem("pawpal-save");

        if (!saved) {
            return { ...DEFAULT_STATE };
        }

        const parsed = JSON.parse(saved);

        const loaded = {
            ...DEFAULT_STATE,
            ...parsed
        };

        if (!PETS[loaded.type]) {
            loaded.type = "cat";
        }

        for (const key of [
            "hunger",
            "happiness",
            "energy",
            "cleanliness"
        ]) {
            const value = Number(loaded[key]);

            loaded[key] = Number.isFinite(value)
                ? Math.max(0, Math.min(100, value))
                : DEFAULT_STATE[key];
        }

        loaded.name = String(loaded.name || "Mochi")
            .trim()
            .slice(0, 20) || "Mochi";

        loaded.careCount = Math.max(
            0,
            Number(loaded.careCount) || 0
        );

        loaded.actionsToday = Array.isArray(loaded.actionsToday)
            ? loaded.actionsToday.filter(
                action => ["feed", "play", "sleep", "clean"].includes(action)
            )
            : [];

        return loaded;
    } catch (error) {
        console.warn("Could not load saved pet:", error);
        return { ...DEFAULT_STATE };
    }
}

function saveState() {
    try {
        localStorage.setItem("pawpal-save", JSON.stringify(state));
    } catch (error) {
        console.warn("Could not save pet:", error);
        showMessage("Your browser could not save the game. Check its storage settings.");
    }
}

function clamp(value) {
    return Math.max(0, Math.min(100, value));
}

function setStat(stat, amount) {
    state[stat] = clamp(state[stat] + amount);
}

function getMood() {
    const stats = [
        state.hunger,
        state.happiness,
        state.energy,
        state.cleanliness
    ];

    if (state.energy < 20) {
        return {
            text: "Very sleepy 😴",
            emoji: "😴",
            message: "I'm feeling sleepy. Could you let me rest?"
        };
    }

    if (state.hunger > 80) {
        return {
            text: "Very hungry 🥺",
            emoji: "🥺",
            message: "My tummy is rumbling! Can I have something to eat?"
        };
    }

    if (state.cleanliness < 20) {
        return {
            text: "Needs a bath 🫧",
            emoji: "🫧",
            message: "I need a little bath to feel fresh again!"
        };
    }

    if (state.happiness < 25) {
        return {
            text: "Feeling lonely 🥹",
            emoji: "🥹",
            message: "I miss spending time with you. Let's play together!"
        };
    }

    if (stats.every(value => value >= 70)) {
        return {
            text: "Super happy! 🥰",
            emoji: "🥰",
            message: "Life is wonderful with you! You're the best friend ever!"
        };
    }

    if (stats.some(value => value < 45)) {
        return {
            text: "Needs some care 💗",
            emoji: "😊",
            message: "I'm doing okay, but a little care would make my day!"
        };
    }

    return {
        text: "Happy and playful 😊",
        emoji: "😊",
        message: "Hi there! I'm happy you're here. Let's have some fun!"
    };
}

function updateStat(stat, valueElement, barElement) {
    const value = Math.round(state[stat]);

    valueElement.textContent = `${value}%`;
    barElement.style.width = `${value}%`;

    barElement.parentElement.setAttribute("role", "progressbar");
    barElement.parentElement.setAttribute("aria-valuemin", "0");
    barElement.parentElement.setAttribute("aria-valuemax", "100");
    barElement.parentElement.setAttribute("aria-valuenow", String(value));
}

function render() {
    const pet = PETS[state.type];

    elements.petName.textContent = `${state.name} ${pet.emoji}`;
    elements.petEmoji.textContent = pet.emoji;

    updateStat("hunger", elements.hungerValue, elements.hungerBar);
    updateStat("happiness", elements.happinessValue, elements.happinessBar);
    updateStat("energy", elements.energyValue, elements.energyBar);
    updateStat("cleanliness", elements.cleanlinessValue, elements.cleanlinessBar);

    const mood = getMood();

    elements.petMood.textContent = mood.text;
    elements.moodIndicator.textContent = mood.emoji;

    elements.careCount.textContent = state.careCount;

    const dailyGoal = 5;
    const completed = Math.min(state.actionsToday.length, dailyGoal);
    const percentage = (completed / dailyGoal) * 100;

    elements.dailyProgressBar.style.width = `${percentage}%`;

    elements.dailyProgressText.textContent =
        `${completed} of ${dailyGoal} daily care actions completed`;

    document.querySelectorAll(".pet-option").forEach(button => {
        const selected = button.dataset.pet === state.type;

        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
    });

    saveState();
}

function showMessage(message) {
    elements.petMessage.textContent = message;

    clearTimeout(messageTimeout);

    messageTimeout = setTimeout(() => {
        elements.petMessage.textContent = getMood().message;
    }, 3500);
}

function animatePet() {
    clearTimeout(actionTimeout);

    elements.petCharacter.classList.remove("action-bounce");
    elements.hearts.classList.remove("show");

    // Restart CSS animations.
    void elements.petCharacter.offsetWidth;

    elements.petCharacter.classList.add("action-bounce");
    elements.hearts.classList.add("show");

    actionTimeout = setTimeout(() => {
        elements.petCharacter.classList.remove("action-bounce");
        elements.hearts.classList.remove("show");
    }, 1600);
}

function updateDailyActions(action) {
    if (!state.actionsToday.includes(action)) {
        state.actionsToday.push(action);
    }

    state.careCount += 1;
}

function performAction(action) {
    const changes = {
        feed: {
            hunger: -30,
            happiness: 5,
            energy: 2
        },

        play: {
            hunger: 10,
            happiness: 20,
            energy: -18,
            cleanliness: -5
        },

        sleep: {
            energy: 30,
            happiness: 3,
            hunger: 8
        },

        clean: {
            cleanliness: 35,
            happiness: 8,
            energy: -3
        }
    };

    if (!changes[action]) {
        return;
    }

    const change = changes[action];

    // Prevent actions that cannot help the pet.
    if (action === "feed" && state.hunger === 0) {
        showMessage(`${state.name} is already full! 😸`);
        return;
    }

    if (action === "play" && state.energy < 15) {
        showMessage(`${state.name} is too tired to play. Try letting them sleep! 😴`);
        return;
    }

    if (action === "sleep" && state.energy === 100) {
        showMessage(`${state.name} is already full of energy! ⚡`);
        return;
    }

    if (action === "clean" && state.cleanliness === 100) {
        showMessage(`${state.name} is already squeaky clean! ✨`);
        return;
    }

    Object.entries(change).forEach(([stat, amount]) => {
        setStat(stat, amount);
    });

    updateDailyActions(action);

    render();

    const pet = PETS[state.type];

    showMessage(pet.sounds[action]);
    animatePet();
}

function changePet(type) {
    if (!PETS[type]) return;

    state.type = type;
    state.name = PETS[type].name;

    render();

    showMessage(`Hello! I'm ${state.name}. Let's be friends! 💕`);
    animatePet();
}

function renamePet(event) {
    event.preventDefault();

    const newName = elements.nameInput.value.trim();

    if (!newName) {
        elements.nameInput.focus();
        return;
    }

    state.name = newName.slice(0, 20);

    elements.renameDialog.close();

    render();
    showMessage(`Yay! My name is ${state.name} now! 💖`);
    animatePet();
}

function resetGame() {
    const confirmed = window.confirm(
        "Start a new game? Your current pet's progress will be reset."
    );

    if (!confirmed) return;

    clearTimeout(messageTimeout);
    clearTimeout(actionTimeout);

    state = {
        ...DEFAULT_STATE,
        lastDate: todayString()
    };

    elements.petCharacter.classList.remove("action-bounce");
    elements.hearts.classList.remove("show");

    render();

    showMessage("Welcome to a fresh adventure! Let's be best friends! 💕");
}

// Event listeners

$("feedBtn").addEventListener("click", () => {
    performAction("feed");
});

$("playBtn").addEventListener("click", () => {
    performAction("play");
});

$("sleepBtn").addEventListener("click", () => {
    performAction("sleep");
});

$("cleanBtn").addEventListener("click", () => {
    performAction("clean");
});

$("renameBtn").addEventListener("click", () => {
    elements.nameInput.value = state.name;
    elements.renameDialog.showModal();
    elements.nameInput.focus();
});

$("cancelRenameBtn").addEventListener("click", () => {
    elements.renameDialog.close();
});

$("renameForm").addEventListener("submit", renamePet);

$("resetBtn").addEventListener("click", resetGame);

document.querySelectorAll(".pet-option").forEach(button => {
    button.addEventListener("click", () => {
        changePet(button.dataset.pet);
    });
});

// Reset daily care checklist when the calendar date changes.
function checkNewDay() {
    const today = todayString();

    if (state.lastDate !== today) {
        state.lastDate = today;
        state.actionsToday = [];
        render();
    }
}

checkNewDay();
render();

// Keep the daily checklist updated if the page stays open overnight.
setInterval(checkNewDay, 60 * 1000);
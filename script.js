// ==========================================
// TELEGRAM WEBAPP INIT
// ==========================================
const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
if (tg) {
    try { tg.ready(); tg.expand(); } catch (e) {}
}

function notify(text) {
    if (tg && typeof tg.showAlert === "function") {
        try { tg.showAlert(text); return; } catch (e) {}
    }
    alert(text);
}

let currentDay = 1;
let gameHour = 7; 
let energy = 100;
let stress = 15; 
let money = 30;   
let copper = 2;   
let cigarettes = 1; 
let salo = 0; 
let tapeCount = 1; 
let shiftEarnedMoney = 0; 

let adsWatchedToday = 0;

let inventory = { 
    normalHelmet: { owned: false, lives: 1 }, 
    normalJacket: { owned: false, lives: 1 }, 
    importHelmet: { owned: false, lives: 2 }, 
    importJacket: { owned: false, lives: 2 }, 
    eternalBoots: { owned: false, perm: true }, 
    eternalFlask: { owned: false, perm: true }  
};

const SAVE_KEY = "smena_save_v2";

function getState() {
    return {
        currentDay, gameHour, energy, stress, money, copper,
        cigarettes, salo, tapeCount, shiftEarnedMoney, adsWatchedToday,
        inventory
    };
}

function saveGame() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(getState())); } catch (e) {}
}

function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const d = JSON.parse(raw);
        currentDay = d.currentDay ?? 1;
        gameHour = d.gameHour ?? 7;
        energy = d.energy ?? 100;
        stress = d.stress ?? 15;
        money = d.money ?? 30;
        copper = d.copper ?? 2;
        cigarettes = d.cigarettes ?? 1;
        salo = d.salo ?? 0;
        tapeCount = d.tapeCount ?? 1;
        shiftEarnedMoney = d.shiftEarnedMoney ?? 0;
        adsWatchedToday = d.adsWatchedToday ?? 0;
        if (d.inventory) inventory = d.inventory;
        return true;
    } catch (e) { return false; }
}

function difficultyMultiplier() {
    return 1 + Math.min(0.8, (currentDay - 1) * 0.04);
}

function startGame() {
    energy = 100;
    stress = 15;
    money = 30;
    cigarettes = 1;
    salo = 0;
    tapeCount = 1;
    shiftEarnedMoney = 0;
    currentDay = 1;
    gameHour = 7;
    adsWatchedToday = 0;
    
    document.getElementById("game-over-screen").classList.add("hidden");
    document.getElementById("game-card").classList.remove("hidden");
    
    saveGame();

    if (Math.random() < 0.5) {
        startDogChaseMinigame("самом начале");
    } else {
        loadNextHourEvent();
    }
}

function resumeGame() {
    document.getElementById("game-over-screen").classList.add("hidden");
    document.getElementById("game-card").classList.remove("hidden");
    loadNextHourEvent();
}

// ==========================================
// ПОГОНЯ ОТ СОБАК
// ==========================================
let dogStepsLeft = 2;
let correctPath = '';

function startDogChaseMinigame(moment) {
    if (salo > 0) {
        salo--;
        if (Math.random() < 0.7) {
            notify(`🐕 В ${moment} смены на тебя прыгнула стая псов, но ты кинул им шмат сала! 🥓 Пока они жрали, ты дал по газам.`);
            loadNextHourEvent();
            return;
        } else {
            notify(`⚠️ ТВОЮ Ж МАТЬ! Эти заводские мутанты брезгуют салом и прут напролом! Беги, работяга!`);
        }
    }

    dogStepsLeft = 2;
    nextDogStep(moment);
}

function nextDogStep(moment) {
    if (dogStepsLeft <= 0) {
        notify(`🏆 Успешно утек от зубастых в ${moment} смены!`);
        loadNextHourEvent();
        return;
    }
    correctPath = Math.random() < 0.5 ? 'left' : 'right';
    let container = document.getElementById("choices-container");
    document.getElementById("event-text").innerText = `🐕 СТАЯ ЖИВОДЕРОВ НА ХВОСТЕ (${moment} смены)!\nОсталось шагов до проходной: ${dogStepsLeft}\nКуда сигать?`;
    container.innerHTML = `
        <div style="display: flex; gap: 10px;">
            <button onclick="chooseDogPath('left')" style="background: #FF9800; flex: 1; padding: 15px; font-weight: bold;">⬅️ ВЛЕВО (в мазут)</button>
            <button onclick="chooseDogPath('right')" style="background: #FF9800; flex: 1; padding: 15px; font-weight: bold;">ВПРАВО ➡️ (на арматуру)</button>
        </div>
    `;
}

function chooseDogPath(direction) {
    if (direction === correctPath) {
        dogStepsLeft--;
        if (dogStepsLeft > 0) {
            notify("🏃 Отрыв есть! Еще рывок по горам металлолома!");
            nextDogStep("смене");
        } else {
            notify("🏆 Перепрыгнул через забор! Псы кусают воздух за мотыгами.");
            loadNextHourEvent();
        }
    } else {
        notify("💥 ТУПИК! Упёрся рогами в закрытые ворота, стая догнала!");
        handleDogBite();
    }
}

function handleDogBite() {
    if (inventory.eternalBoots.owned || inventory.eternalFlask.owned) {
        notify("⚡ Зубы псов соскользнули с твоих легендарных артефактов за медь! Имба!");
        loadNextHourEvent();
        return;
    }

    let damagedItem = null;
    if (inventory.importHelmet.owned && inventory.importHelmet.lives > 0) {
        inventory.importHelmet.lives--;
        damagedItem = `Импортная каска (Жизней осталось: ${inventory.importHelmet.lives}/2)`;
    } else if (inventory.importJacket.owned && inventory.importJacket.lives > 0) {
        inventory.importJacket.lives--;
        damagedItem = `Импортная куртка (Жизней осталось: ${inventory.importJacket.lives}/2)`;
    } else if (inventory.normalHelmet.owned && inventory.normalHelmet.lives > 0) {
        inventory.normalHelmet.lives--;
        damagedItem = `Обычная каска раскололась вдребезги!`;
    } else if (inventory.normalJacket.owned && inventory.normalJacket.lives > 0) {
        inventory.normalJacket.lives--;
        damagedItem = `Обычный ватник порван в клочья!`;
    }

    if (damagedItem) {
        notify(`⚡ Собака вцепилась в шмотки!\n⚠️ Урон: ${damagedItem}`);
    } else {
        stress += Math.round(35 * difficultyMultiplier());
        energy -= 30;
        notify("⚡ Защиты ноль! Псы понадкусывали бока: стресс +35, энергия -30.");
    }
    loadNextHourEvent();
}

function loadNextHourEvent() {
    updateUI();
    
    if (energy <= 0 || stress >= 100) {
        triggerPermaDeath(energy <= 0 ? "🪫 Аккумулятор сел. Ты уснул прямо в ковше экскаватора." : "🧠 Крыша уехала окончательно. Увезен санитарами в белых халатах.");
        return;
    }
    
    if (gameHour >= 19) {
        if (Math.random() < 0.4) { startDogChaseMinigame("самом конце"); return; }
        endDaySummary();
        return;
    }
    
    if (gameHour === 13) { triggerLunchBreak(); return; }

    let events = [
        { text: `⏰ Время: ${gameHour}:00.\n\nМастер орет: «А ну бери кувалду и чини щиток!»`, action: "repairMinigame" },
        { text: `⏰ Время: ${gameHour}:00.\n\n⚠️ НАЧАЛЬНИК ОБХОДИТ ЦЕХ С ПРОВЕРКОЙ!`, action: "bossWatchGame" },
        { 
            text: `⏰ Время: ${gameHour}:00.\n\nЗатишье у станка. Руки чешутся прикурить или покрутить гайки.`, 
            choices: [
                { text: "Тяжело крутить ржавые гайки (+12 к зп, -25 энергии, +20 стресса)", e: -25, s: 20, wage: 12 },
                { text: "Пойти на перекур (потратить сигарету)", action: "realBreak" }
            ]
        },
        {
            text: `⏰ Время: ${gameHour}:00.\n\n👴 К тебе подваливает старый Василич с папиросой «Беломор» и затягивается анекдотом.`,
            action: "vasilyAnekdot"
        }
    ];

    let randomEvent = events[Math.floor(Math.random() * events.length)];
    document.getElementById("event-text").innerText = randomEvent.text;
    let container = document.getElementById("choices-container");
    container.innerHTML = "";

    if (randomEvent.action === "repairMinigame") {
        if (Math.random() < 0.5) {
            startRepairMinigame();
        } else {
            startWireCutMinigame();
        }
    } else if (randomEvent.action === "bossWatchGame") {
        startBossWatchMinigame();
    } else if (randomEvent.action === "realBreak") {
        tryStartBreak();
    } else if (randomEvent.action === "vasilyAnekdot") {
        startVasilyEvent();
    } else {
        randomEvent.choices.forEach(choice => {
            let btn = document.createElement("button");
            btn.onclick = () => makeChoice(choice.e, choice.s, choice.wage);
            btn.innerText = choice.text;
            container.appendChild(btn);
        });
    }

    let btnPhone = document.getElementById("btn-phone") || document.createElement("button");
    btnPhone.id = "btn-phone";
    btnPhone.innerText = "📱 Достать старый КПК (залипнуть в игру)";
    btnPhone.style.background = "#009688";
    btnPhone.style.marginTop = "6px";
    btnPhone.onclick = () => startPhoneMinigame();
    container.appendChild(btnPhone);

    let btnShop = document.getElementById("btn-shop") || document.createElement("button");
    btnShop.id = "btn-shop";
    btnShop.innerText = "🛒 Заводской Ларёк & Тайник";
    btnShop.style.background = "#3f51b5";
    btnShop.style.marginTop = "8px";
    btnShop.onclick = () => openShop();
    container.appendChild(btnShop);
}

function triggerPermaDeath(reason) {
    if (repairInterval) clearInterval(repairInterval);
    clearBossTimers();
    stopPhoneMinigame();

    inventory.normalHelmet = { owned: false, lives: 1 };
    inventory.normalJacket = { owned: false, lives: 1 };
    inventory.importHelmet = { owned: false, lives: 2 };
    inventory.importJacket = { owned: false, lives: 2 };
    salo = 0;
    cigarettes = 0;
    tapeCount = 0;

    saveGame();

    document.getElementById("game-card").classList.add("hidden");
    let screen = document.getElementById("game-over-screen");
    screen.classList.remove("hidden");
    document.getElementById("end-title").innerText = "💀 ТЫ СЛЕГ НА ПРОИЗВОДСТВЕ";
    document.getElementById("end-desc").innerText = `${reason}\n\n💥 Обычная робата-амуниция сгорела дотла, статы обнулились. Но купленные на медь ВЕЧНЫЕ артефакты остались с тобой навсегда!`;
}

function tryStartBreak() {
    if (cigarettes > 0) {
        cigarettes--;
        stress = Math.max(0, stress - 20);
        notify("🚬 Перекурил за углом. Жизнь сразу заиграла красками (-20 стресса).");
        gameHour++;
        loadNextHourEvent();
    } else {
        notify("🚬 Папиросы кончились! Придется стрелять у алкашей в столовой.");
        loadNextHourEvent();
    }
}

// ==========================================
// АНЕКДОТЫ ОТ ВАСИЛИЧА
// ==========================================
function startVasilyEvent() {
    const anekdots = [
        "— Василич, почему у вас на заводе рабочие по пятницам трезвые?! — А мы водку пьем по четвергам, чтобы в пятницу с похмелья не перерабатывать!",
        "Приходит молодой инженер к старому мастеру: — Как тут у вас план выполнять? — Спокойно, сынок. Главное — имитировать бурную деятельность так, чтобы начальство думало, что ты тушишь пожар, который сам же и устроил.",
        "Идет проверка на заводе. Комиссия спрашивает токаря: — Вы технику безопасности знаете? — Как «Отче наш»! — А почему без очков работаете? — Да у меня зрение плохое, я в них всё равно ни черта не вижу!"
    ];
    let joke = anekdots[Math.floor(Math.random() * anekdots.length)];

    document.getElementById("event-text").innerText = `👴 Василич откашливается и травит байку:\n\n«${joke}»`;
    let container = document.getElementById("choices-container");
    container.innerHTML = `
        <button onclick="vasilyReact(true)" style="background: #4CAF50; margin-bottom: 6px; width: 100%;">😂 Ржануть в голос (-15 стресса)</button>
        <button onclick="vasilyReact(false)" style="background: #777; width: 100%;">😐 Сделать вид, что не услышал</button>
    `;
}

function vasilyReact(laugh) {
    if (laugh) {
        if (Math.random() < 0.25) {
            stress += 25;
            notify("🚨 БАЦ! Ты заржал как конь, а сзади стоял мастер цеха! Выговор за нарушение дисциплины: стресс +25.");
        } else {
            stress = Math.max(0, stress - 15);
            notify("😂 Посмеялся от души с Василичем, аж на душе полегчало (-15 стресса).");
        }
    } else {
        notify("😐 Ты угрюмо кивнул и пошел дальше к своему станку.");
    }
    gameHour++;
    loadNextHourEvent();
}

// ==========================================
// СТАРЫЙ КПК (ХАРДКОРНЫЙ И АКТИВНЫЙ)
// ==========================================
const PHONE_GRID_SIZE = 3;

let phoneRiskInterval = null;
let phoneRoundTimeout = null;
let phoneTargetIndex = -1;
let phoneRisk = 0;
let phonePlaying = false;
let phoneStressRelief = 0;

function startPhoneMinigame() {
    clearBossTimers();
    stopPhoneMinigame();

    phoneRisk = 0;
    phoneStressRelief = 0;
    phonePlaying = true;
    phoneTargetIndex = -1;

    document.getElementById("event-text").innerText = `📱 Достал потертый заводской КПК под верстаком.\nЖми на загорающиеся зелёным клетки, чтобы сбивать стресс. Шкала палева активная и жесткая — не зевай!`;
    let container = document.getElementById("choices-container");

    let cellsHtml = "";
    for (let i = 0; i < PHONE_GRID_SIZE * PHONE_GRID_SIZE; i++) {
        cellsHtml += `<button id="phone-cell-${i}" onclick="phoneCellClick(${i})" style="aspect-ratio:1; background:#333; border-radius:6px; border:1px solid #555;"></button>`;
    }

    container.innerHTML = `
        <div style="background:#111; padding:10px; border-radius:5px; text-align:center;">
            <div style="display:grid; grid-template-columns: repeat(${PHONE_GRID_SIZE}, 1fr); gap:6px; margin-bottom:10px;">
                ${cellsHtml}
            </div>
            <div style="background:#333; height:14px; border-radius:4px; margin:4px 0 2px 0; overflow:hidden;">
                <div id="phone-risk-fill" style="height:100%; width:0%; background:#ff4444;"></div>
            </div>
            <p style="font-size:10px; color:#ff8888; margin:0 0 6px 0;">🚨 Риск быть спаленным (Активный хардкор)</p>
            <p id="phone-relief" style="font-size:11px; color:#4CAF50; font-weight:bold; margin:0 0 8px 0;">Снято стресса: 0</p>
            <button onclick="hidePhone()" style="background:#4CAF50; font-weight:bold; padding:12px; width:100%;">🙈 Быстро спрятать КПК</button>
        </div>
    `;

    nextPhoneTarget();

    // Сделали КПК более активным и хардкорным, бонус от тычки = 1
    phoneRiskInterval = setInterval(() => {
        if (!phonePlaying) return;
        let step = (Math.random() * 3 + 2) * difficultyMultiplier(); // Активный рост риска
        if (Math.random() < 0.08) step += 8; 
        phoneRisk += step;

        const bar = document.getElementById("phone-risk-fill");
        if (bar) bar.style.width = Math.min(100, phoneRisk) + "%";

        const catchChance = phoneRisk / 380; // Жёсткий порог палева
        if (Math.random() < catchChance || phoneRisk >= 100) {
            phoneCaught();
        }
    }, 900);
}

function nextPhoneTarget() {
    if (!phonePlaying) return;

    if (phoneTargetIndex >= 0) {
        let old = document.getElementById(`phone-cell-${phoneTargetIndex}`);
        if (old) old.style.background = "#333";
    }

    phoneTargetIndex = Math.floor(Math.random() * PHONE_GRID_SIZE * PHONE_GRID_SIZE);
    let cell = document.getElementById(`phone-cell-${phoneTargetIndex}`);
    if (cell) cell.style.background = "#4CAF50";

    if (phoneRoundTimeout) clearTimeout(phoneRoundTimeout);
    phoneRoundTimeout = setTimeout(() => {
        if (phonePlaying) nextPhoneTarget();
    }, 950); // Меньше времени на клетку
}

function phoneCellClick(i) {
    if (!phonePlaying) return;
    if (i === phoneTargetIndex) {
        const bonus = 1; // Снижено до 1, чтобы полностью сбить стресс на расслабоне не получилось
        stress = Math.max(0, stress - bonus);
        phoneStressRelief += bonus;
        const relief = document.getElementById("phone-relief");
        if (relief) relief.innerText = `Снято стресса: ${phoneStressRelief}`;
        nextPhoneTarget();
    }
}

function stopPhoneMinigame() {
    phonePlaying = false;
    if (phoneRiskInterval) { clearInterval(phoneRiskInterval); phoneRiskInterval = null; }
    if (phoneRoundTimeout) { clearTimeout(phoneRoundTimeout); phoneRoundTimeout = null; }
}

function hidePhone() {
    if (!phonePlaying) return;
    stopPhoneMinigame();
    notify(`🙈 Успел заблокировать КПК в карман!\n😌 Нервы подлечены на ${phoneStressRelief}.`);
    gameHour++;
    loadNextHourEvent();
}

function phoneCaught() {
    stopPhoneMinigame();
    const fine = Math.round(35 + Math.random() * 25);
    const stressPenalty = Math.round(35 * difficultyMultiplier());
    money = Math.max(0, money - fine);
    stress += stressPenalty;
    notify(`🚨 СПАЛИЛИ! Мастер выхватил КПК прямо из рук!\n💸 Штраф: -${fine} денег, стресс +${stressPenalty}.`);
    gameHour++;
    loadNextHourEvent();
}

// ==========================================
// МИНИ-ИГРА С НАЧАЛЬНИКОМ
// ==========================================
let bossRoundTimeout = null;
let bossWindowTimeout = null;
let bossSuccessCount = 0;
let bossReady = false;
const BOSS_ROUNDS_NEEDED = 3;

function startBossWatchMinigame() {
    clearBossTimers();
    bossSuccessCount = 0;
    renderBossRound();
}

function renderBossRound() {
    bossReady = false;
    document.getElementById("event-text").innerText = `👀 НАЧАЛЬНИК ИДЕТ ПО РЯДУ!\nЖди зелёный сигнал и жми «ИЗОБРАЗИТЬ РАБОТУ». Нужно успеть ${BOSS_ROUNDS_NEEDED} раза подряд.`;
    let container = document.getElementById("choices-container");
    container.innerHTML = `
        <div style="background:#111; padding:14px; border-radius:5px; text-align:center; margin-bottom:8px;">
            <div id="boss-indicator" style="width:100%; height:50px; border-radius:5px; background:#444; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#fff; margin-bottom:10px;">Жди...</div>
            <p id="boss-score" style="font-size:12px; color:#4CAF50; font-weight:bold;">Успехов: ${bossSuccessCount} / ${BOSS_ROUNDS_NEEDED}</p>
        </div>
        <button id="work-click-btn" style="background:#4CAF50; font-weight:bold; padding:14px; width:100%;">🔨 ИЗОБРАЗИТЬ РАБОТУ!</button>
    `;

    const delay = 600 + Math.random() * 1400;
    bossRoundTimeout = setTimeout(() => {
        bossReady = true;
        const indicator = document.getElementById("boss-indicator");
        if (indicator) { indicator.style.background = "#4CAF50"; indicator.innerText = "ДАВАЙ!"; }

        const reactionWindow = Math.max(400, (750 - (currentDay - 1) * 20) / difficultyMultiplier());
        bossWindowTimeout = setTimeout(() => {
            if (bossReady) {
                bossReady = false;
                bossFail("Не успел изобразить бурную деятельность!");
            }
        }, reactionWindow);
    }, delay);

    document.getElementById("work-click-btn").onclick = () => {
        if (bossReady) {
            bossReady = false;
            if (bossWindowTimeout) clearTimeout(bossWindowTimeout);
            bossSuccessCount++;
            const indicator = document.getElementById("boss-indicator");
            if (indicator) { indicator.style.background = "#2e7d32"; indicator.innerText = "✅"; }

            if (bossSuccessCount >= BOSS_ROUNDS_NEEDED) {
                shiftEarnedMoney += 15;
                stress = Math.max(0, stress - 10);
                notify("😎 Мастер прошел мимо, кивнул: «Во работяга прет!» Премия: +15 денег.");
                gameHour++;
                loadNextHourEvent();
            } else {
                setTimeout(renderBossRound, 500);
            }
        } else {
            bossFail("Рано машешь кувалдой, спалили!");
        }
    };
}

function bossFail(reason) {
    clearBossTimers();
    stress += Math.round(35 * difficultyMultiplier());
    money -= 30;
    notify(`🚨 ПАЛЕВО! ${reason}\nСтресс +35, штраф 30 денег.`);
    gameHour++;
    loadNextHourEvent();
}

function clearBossTimers() {
    bossReady = false;
    if (bossRoundTimeout) { clearTimeout(bossRoundTimeout); bossRoundTimeout = null; }
    if (bossWindowTimeout) { clearTimeout(bossWindowTimeout); bossWindowTimeout = null; }
}

// ==========================================
// ОБЕД
// ==========================================
function triggerLunchBreak() {
    let container = document.getElementById("choices-container");
    document.getElementById("event-text").innerText = `🍽️ 13:00 — ОБЕД [Столовая тети Зины].\nПодкрепись и докупи припасы:`;
    
    container.innerHTML = `
        <button onclick="tryBuyLunch(30, 'Суп с баландой', 25)" style="background: #4CAF50; margin-bottom: 5px; width: 100%;">🥣 Суп (30 денег) [+25 энергии]</button>
        <button onclick="tryBuyLunch(70, 'Котлета с пюре', 50)" style="background: #FF9800; margin-bottom: 5px; width: 100%;">🥩 Котлета (70 денег) [+50 энергии]</button>
        <button onclick="tryBuyLunch(0, 'Сухарь из кармана', 5)" style="background: #777; margin-bottom: 10px; width: 100%;">🍞 Сухарь бесплатно [+5 энергии]</button>
        
        <div style="background: #111; padding: 8px; border: 1px solid #444; font-size: 11px;">
            <b>🛍️ Закупка в столовой:</b><br>
            <button onclick="buyCigarettes()" style="background:#ff9800; color:#000; margin-top:4px; width:100%;">🚬 Сигареты (+2 шт) — 50 денег</button>
            <button onclick="buyTape()" style="background:#03A9F4; color:#000; margin-top:4px; width:100%;">🛠️ Синяя изолента (+1 шт) — 30 денег</button>
            <button onclick="buySaloMoney()" style="background:#4CAF50; color:#000; margin-top:4px; width:100%;">🥓 Сало (Лимит 1 шт) — 100 денег</button>
        </div>
    `;
}

function tryBuyLunch(cost, name, energyAdd) {
    if (money >= cost || cost === 0) {
        money -= cost;
        energy = Math.min(100, energy + energyAdd);
        stress = Math.max(0, stress - 15);
        notify(`🍽️ Ты слопал: ${name}!`);
        gameHour++;
        loadNextHourEvent();
    } else {
        notify("💸 Денег нет! Бери бесплатный сухарь.");
        triggerLunchBreak(); 
    }
}

function buyCigarettes() {
    if (money >= 50) {
        money -= 50;
        cigarettes += 2;
        notify("🚬 Куплено 2 сигареты!");
        saveGame();
        triggerLunchBreak();
    } else {
        notify("Не хватает денег на сигареты! (Стоит 50 денег)");
    }
}

function buyTape() {
    if (money >= 30) {
        money -= 30;
        tapeCount += 1;
        notify("🛠️ Куплена синяя изолента!");
        saveGame();
        triggerLunchBreak();
    } else {
        notify("Не хватает денег на изоленту! (Стоит 30 денег)");
    }
}

function buySaloMoney() {
    if (salo >= 1) {
        notify("👩‍🍳 ТЕТЯ ЗИНА КРИЧИТ ИЗ ОКОШКА:\n«Лимит 1 кусок в одни руки!»");
        return;
    }
    if (money >= 100) {
        money -= 100;
        salo++;
        notify("🥓 Куплен дефицитный кусок сала!");
        saveGame();
        triggerLunchBreak();
    } else {
        notify("Не хватает денег на сало! (Стоит 100 денег)");
    }
}

// ==========================================
// РЕМОНТ СТАНКА (КУВАЛДА С ПРОГРЕССИЕЙ)
// ==========================================
let repairAttemptsLeft = 10;
let successfulHits = 0;
let repairInterval = null;

function startRepairMinigame() {
    let container = document.getElementById("choices-container");
    repairAttemptsLeft = 10;
    successfulHits = 0;
    
    let hasMoneyForMikhalych = money >= 80;
    let hasTape = tapeCount > 0;

    let mikhalychBtnStyle = hasMoneyForMikhalych 
        ? "background: #ff9800; margin-top: 4px; width: 100%; cursor: pointer;" 
        : "background: #555; color: #aaa; margin-top: 4px; width: 100%; opacity: 0.5; cursor: not-allowed;";
    
    let tapeBtnStyle = hasTape 
        ? "background: #777; margin-top: 4px; width: 100%; cursor: pointer;" 
        : "background: #444; color: #888; margin-top: 4px; width: 100%; opacity: 0.5; cursor: not-allowed;";

    document.getElementById("event-text").innerText = `⚙️ Ремонт линии (Вариант 1: Кувалда):\nЛупи кувалдой («УДАР»), когда стрелка в зеленой зоне! Сложность растет с каждым днем.`;
    
    container.innerHTML = `
        <div style="background: #111; padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 5px;">
            <div style="width: 90px; height: 90px; border: 4px solid #fff; border-radius: 50%; margin: 5px auto; position: relative; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 24px; height: 24px; background: #4CAF50; border-radius: 50%; top: 10px; left: 33px;"></div>
                <div id="pointer" style="width: 3px; height: 42px; background: red; position: absolute; top: 5px; transform-origin: bottom center;"></div>
            </div>
            <p id="repair-stats" style="font-size: 12px; color: #4CAF50; font-weight: bold;">Попыток: 10 | Успехов: 0</p>
            <p id="repair-feedback" style="font-size: 11px; color: #ff4444; height: 15px; margin: 0;"></p>
        </div>
        <button id="hit-btn" style="background: #4CAF50; font-weight: bold; padding: 12px; width: 100%;">💥 УДАР КУВАЛДОЙ</button>
        <button onclick="repairAlternative('mikhalych')" style="${mikhalychBtnStyle}">🍺 Налить Михалычу (80 денег)</button>
        <button onclick="repairAlternative('tape')" style="${tapeBtnStyle}">🛠️ Синяя изолента (Запасов: ${tapeCount})</button>
    `;

    let angle = 0;
    if (repairInterval) clearInterval(repairInterval);

    const rotSpeed = Math.round(38 / difficultyMultiplier());
    repairInterval = setInterval(() => {
        angle = (angle + 12) % 360;
        let p = document.getElementById("pointer");
        if (p) p.style.transform = `rotate(${angle}deg)`;
    }, rotSpeed);

    document.getElementById("hit-btn").onclick = () => {
        repairAttemptsLeft--;
        let feedback = document.getElementById("repair-feedback");

        if (angle >= 335 || angle <= 25) {
            successfulHits++;
            if (feedback) feedback.innerText = "🎯 Четкий удар по контактам!";
        } else {
            stress += Math.round(3 * difficultyMultiplier()); 
            if (feedback) feedback.innerText = "💥 Мимо! (Стресс +3)";
        }

        document.getElementById("repair-stats").innerText = `Попыток: ${repairAttemptsLeft} | Успехов: ${successfulHits}`;

        if (repairAttemptsLeft <= 0) {
            finishRepairMiniGame();
        }
    };
}

function finishRepairMiniGame() {
    if (repairInterval) clearInterval(repairInterval);
    energy -= 15; 

    if (successfulHits >= 3) {
        let earned = successfulHits * 8;
        shiftEarnedMoney += earned;
        stress = Math.max(0, stress - 10);
        notify(`🎯 Линия ожила!\nУспехов: ${successfulHits} из 10.\n💸 К зарплате добавлено: +${earned} денег.`);
    } else {
        stress += 20;
        notify(`🤡 Рукожопство (${successfulHits}/10)!\n💥 Штраф: стресс +20, энергия -15.`);
    }
    gameHour++;
    loadNextHourEvent();
}

// ==========================================
// РЕМОНТ СТАНКА (ПРОВОДА С ПРОГРЕССИЕЙ)
// ==========================================
let wireTimeout = null;

function startWireCutMinigame() {
    let container = document.getElementById("choices-container");
    document.getElementById("event-text").innerText = `⚙️ Ремонт линии (Вариант 2: Замкнутые провода):\nЩит искрит! Быстро жми на правильный синий провод, время реакции сокращается с каждым днем!`;
    
    container.innerHTML = `
        <div style="background: #111; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 8px;">
            <p style="color: #03A9F4; font-weight: bold; font-size: 14px; margin-bottom: 10px;">⚡ ВЫБЕРИ БЕЗОПАСНЫЙ ПРОВОД:</p>
            <div style="display: flex; gap: 8px; justify-content: center;">
                <button onclick="pickWire(1)" style="background: #d32f2f; color: #fff; padding: 12px; font-weight: bold; flex: 1;">🔴 Красный</button>
                <button onclick="pickWire(2)" style="background: #388e3c; color: #fff; padding: 12px; font-weight: bold; flex: 1;">🟢 Зеленый</button>
                <button onclick="pickWire(3)" style="background: #1976d2; color: #fff; padding: 12px; font-weight: bold; flex: 1;">🔵 Синий</button>
            </div>
        </div>
    `;

    if (wireTimeout) clearTimeout(wireTimeout);
    let safeWire = Math.floor(Math.random() * 3) + 1;
    window.currentSafeWire = safeWire;

    const wireTimeLimit = Math.max(2000, 4000 / difficultyMultiplier());

    wireTimeout = setTimeout(() => {
        energy -= 15;
        stress += 25;
        notify("⚡ ШМАТНУЛО ТОКОМ! Ты завозился с проводкой, щиток взорвался. Энергия -15, стресс +25.");
        gameHour++;
        loadNextHourEvent();
    }, wireTimeLimit);
}

function pickWire(wireNum) {
    if (wireTimeout) clearTimeout(wireTimeout);
    energy -= 10; 

    if (wireNum === window.currentSafeWire) {
        let earned = 35;
        shiftEarnedMoney += earned;
        stress = Math.max(0, stress - 10);
        notify(`🛠️ Интуиция не подвела! Ты перекусил нужный провод.\n💸 К зарплате добавлено: +${earned} денег.`);
    } else {
        stress += 25;
        notify("💥 Искры полетели во все стороны! Ошибся проводом: стресс +25.");
    }
    gameHour++;
    loadNextHourEvent();
}

function repairAlternative(type) {
    if (repairInterval) clearInterval(repairInterval);
    if (wireTimeout) clearTimeout(wireTimeout);

    if (type === 'mikhalych') {
        if (money >= 80) {
            money -= 80;
            notify("🍺 Михалыч молча выпил чекушку за 80 рублей и починил всё сам. Зарплата за этот час не капает, зато цел!");
            gameHour++;
            loadNextHourEvent();
        } else {
            notify("💸 Недостаточно средств! Чекушка для Михалыча стоит 80 рублей.");
            startRepairMinigame();
        }
    } else if (type === 'tape') {
        if (tapeCount > 0) {
            tapeCount--;
            if (Math.random() < 0.35) {
                stress += Math.round(20 * difficultyMultiplier());
                energy -= 15;
                notify("💥 БАХ! Синяя изолента не спасла, провода полыхают!");
            } else {
                notify("🛠️ Изолента творит чудеса, станок жужжит.");
            }
            gameHour++;
            loadNextHourEvent();
        } else {
            notify("❌ У тебя закончилась синяя изолента!");
            startRepairMinigame();
        }
    }
}

// ==========================================
// МАГАЗИН
// ==========================================
function openShop() {
    let container = document.getElementById("choices-container");
    
    let normalHText = inventory.normalHelmet.owned ? `Обычная каска (${inventory.normalHelmet.lives}/1)` : "Нет";
    let normalJText = inventory.normalJacket.owned ? `Обычная куртка (${inventory.normalJacket.lives}/1)` : "Нет";
    let importHText = inventory.importHelmet.owned ? `Импорт. каска (${inventory.importHelmet.lives}/2)` : "Нет";
    let importJText = inventory.importJacket.owned ? `Импорт. куртка (${inventory.importJacket.lives}/2)` : "Нет";
    let bootsText = inventory.eternalBoots.owned ? "👑 Кирзачи ВЕЧНЫЕ" : "Нет";
    let flaskText = inventory.eternalFlask.owned ? "👑 Фляга ВЕЧНАЯ" : "Нет";

    container.innerHTML = `🛒 Заводской Ларёк
    <p>Деньги: <b>${money} денег</b> | 🟫 Медь: <b>${copper} кг</b> (Реклама: ${adsWatchedToday}/5)</p>
    
    <div style="background: #111; padding: 6px; border: 1px solid #555; font-size: 10px; margin-bottom: 6px; text-align: left;">
        <b>📋 Активный инвентарь и шмотки:</b><br>
        • Обычные: ${normalHText} | ${normalJText}<br>
        • Импортные: ${importHText} | ${importJText}<br>
        • Вечные (остаются после смерти): ${bootsText} | ${flaskText}<br>
        • Расходники: 🥓 Сало: ${salo} | 🚬 Сигареты: ${cigarettes} | 🛠️ Изолента: ${tapeCount}
    </div>`;

    container.innerHTML += `
        <button onclick="buyNormalItem('normalHelmet', 150)" style="background:#333">👷 Обычная каска (1 жизнь) — 150 денег</button>
        <button onclick="buyNormalItem('normalJacket', 200)" style="background:#333">🧥 Обычная куртка (1 жизнь) — 200 денег</button>
        <button onclick="buyImportItem('importHelmet', 400)" style="background:#333">👷 Импортная каска (2 жизни) — 400 денег</button>
        <button onclick="buyImportItem('importJacket', 500)" style="background:#333">🧥 Импортная куртка (2 жизни) — 500 денег</button>
        
        <p style="color: #FFD700; font-size: 11px; margin: 4px 0 2px 0;">👑 Ультимативные вечные вещи (Очень дорогие, за медь):</p>
        <button onclick="buyEternalItem('eternalBoots', 120)" style="background:#4CAF50; color:#000; font-weight:bold; margin-bottom:3px; width:100%;">🥾 Вечные кирзачи — 120 кг меди</button>
        <button onclick="buyEternalItem('eternalFlask', 180)" style="background:#4CAF50; color:#000; font-weight:bold; margin-bottom:6px; width:100%;">🍶 Вечная фляга — 180 кг меди</button>

        <p style="color: #ff9800; font-size: 11px; margin: 4px 0 2px 0;">💱 Обмен меди на рубли:</p>
        <button onclick="exchangeCopperToMoney(5)" style="background:#FF9800; color:#000; font-weight:bold; margin-bottom:6px; width:100%;">💱 Обменять 5 кг меди на +100 денег</button>

        <hr style="border-color: #444; margin: 4px 0;">
        <button onclick="watchRealAdsgramAd()" style="background: #00bcd4; color: #000; font-weight: bold;">
            📺 Глянуть рекламу (+1 кг меди) [Лимит: ${adsWatchedToday}/5]
        </button>
        
        <button onclick="payRealTelegramStars()" style="background: #FFD700; color: #000; font-weight: bold;">
            ⭐ Купить 20 кг меди за 5 Telegram Stars
        </button>
        
        <button onclick="loadEventFromShop()" style="background: #777; margin-top: 6px;">⬅️ Назад</button>
    `;
}

function buyNormalItem(id, cost) {
    if (money >= cost) { money -= cost; inventory[id].owned = true; inventory[id].lives = 1; notify("Куплена обычная шмотка."); saveGame(); openShop(); } 
    else { notify("Не хватает денег!"); }
}

function buyImportItem(id, cost) {
    if (money >= cost) { money -= cost; inventory[id].owned = true; inventory[id].lives = 2; notify("Куплена импортная шмотка."); saveGame(); openShop(); } 
    else { notify("Не хватает денег!"); }
}

function buyEternalItem(id, costCopper) {
    if (copper >= costCopper) {
        copper -= costCopper;
        inventory[id].owned = true;
        notify("👑 Куплена вечная вещь! Она навсегда с тобой.");
        saveGame();
        openShop();
    } else {
        notify("Не хватает редкой меди! Копи или донать через Telegram Stars.");
    }
}

function exchangeCopperToMoney(amount) {
    if (copper >= amount) {
        copper -= amount;
        money += 100;
        notify("💱 Обмен совершен (+100 денег).");
        saveGame();
        openShop();
    } else {
        notify("Недостаточно меди!");
    }
}

function watchRealAdsgramAd() {
    if (adsWatchedToday >= 5) { notify("🚫 Лимит рекламы исчерпан (5 в сутки)."); return; }
    if (window.Adsgram) {
        window.Adsgram.init({ blockId: "YOUR_ADSGRAM_BLOCK_ID" }).show().then(() => {
            copper += 1; adsWatchedToday++;
            saveGame();
            notify("🟫 Реклама просмотрена! +1 кг меди."); openShop();
        }).catch(() => { notify("Реклама закрыта досрочно."); });
    } else {
        copper += 1; adsWatchedToday++;
        saveGame();
        notify("🟫 [Тест ПК] Получено +1 кг меди!"); openShop();
    }
}

function payRealTelegramStars() {
    if (window.Telegram && window.Telegram.WebApp) {
        let tgw = window.Telegram.WebApp;
        fetch('https://твой-бэкенд-сервер.onrender.com/create-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stars: 5, item: 'copper_20' })
        })
        .then(res => res.json())
        .then(data => {
            tgw.openInvoice(data.invoice_link, (status) => {
                if (status === 'paid') { copper += 20; saveGame(); notify("⭐ 20 кг меди зачислено."); openShop(); }
                else { notify("Оплата отменена."); }
            });
        }).catch(() => { notify("Ошибка связи с сервером."); });
    } else {
        if (confirm("[Тест ПК] Симулировать оплату 5 звезд за 20 кг меди?")) {
            copper += 20; saveGame(); notify("⭐ 20 кг меди зачислено (Тест)!"); openShop();
        }
    }
}

function loadEventFromShop() { loadNextHourEvent(); }

function makeChoice(eChange, sChange, wageAdd) {
    if ((inventory.importJacket.owned && inventory.importJacket.lives > 0) || inventory.eternalBoots.owned) eChange *= 0.7;
    if ((inventory.importHelmet.owned && inventory.importHelmet.lives > 0) || inventory.eternalFlask.owned) sChange *= 0.6;
    
    energy = Math.max(0, Math.min(100, energy + eChange));
    stress = Math.max(0, Math.min(100, stress + (sChange || 0)));
    if (wageAdd) shiftEarnedMoney += Math.round(wageAdd / 2); 
    
    gameHour++;
    loadNextHourEvent();
}

function endDaySummary() {
    money += shiftEarnedMoney; 
    let container = document.getElementById("choices-container");
    document.getElementById("event-text").innerText = `🔔 19:00 — СМЕНА ОКОНЧЕНА!\n\nИтоги смены:\n💸 Заработано за день: +${shiftEarnedMoney} денег\n💰 Итого на балансе: ${money} денег`;
    
    saveGame();
    container.innerHTML = `<button onclick="startNextDay()" style="background: #4CAF50; font-weight: bold; padding: 12px;">🌅 Начать новый день #${currentDay + 1}</button>`;
}

function startNextDay() {
    currentDay++; 
    gameHour = 7; 
    energy = 100; 
    adsWatchedToday = 0;
    shiftEarnedMoney = 0; 
    
    stress = Math.floor(stress / 2);

    saveGame();

    if (Math.random() < 0.5) { startDogChaseMinigame("начале"); } 
    else { loadNextHourEvent(); }
}

function updateUI() {
    document.getElementById("energy-fill").style.width = energy + "%";
    document.getElementById("stress-fill").style.width = stress + "%";
    document.getElementById("money-fill").style.width = Math.min(100, (money / 500) * 100) + "%";
    document.getElementById("shift-title").innerText = `🌞 День ${currentDay} | Время: ${gameHour}:00`;
    saveGame();
}

function restartGame() { startGame(); }

// ==========================================
// СТАРТ
// ==========================================
if (loadGame() && energy > 0 && stress < 100) {
    resumeGame();
} else {
    startGame();
}
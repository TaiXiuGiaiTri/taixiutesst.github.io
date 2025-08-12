document.addEventListener('DOMContentLoaded', () => {
    // --- Giả lập Web2: Tạo và lưu mã Giftcode ---
    function createAndSaveGiftCode(code, value, usesLeft) {
        let giftCodes = JSON.parse(localStorage.getItem('giftCodes')) || {};
        giftCodes[code.toUpperCase()] = {
            value: value,
            usesLeft: usesLeft,
            usedBy: []
        };
        localStorage.setItem('giftCodes', JSON.stringify(giftCodes));
        console.log(`Mã giftcode '${code.toUpperCase()}' đã được tạo thành công với giá trị ${value} và ${usesLeft} lượt sử dụng.`);
    }

    // === Các phần tử DOM chung ===
    const authContainer = document.getElementById('auth-container');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const gameContainer = document.getElementById('game-container');

    // === Các phần tử DOM cho Đăng nhập/Đăng ký ===
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // === Các phần tử DOM cho Game ===
    const currentBalanceEl = document.getElementById('current-user-balance');
    const betTaiEl = document.getElementById('bet-tai');
    const betXiuEl = document.getElementById('bet-xiu');
    const taiTotalBetEl = document.getElementById('tai-total-bet');
    const xiuTotalBetEl = document.getElementById('xiu-total-bet');
    const taiTotalPlayersEl = document.getElementById('tai-total-players');
    const xiuTotalPlayersEl = document.getElementById('xiu-total-players');
    const diceEls = document.querySelectorAll('.dice-face');
    const resultTextEl = document.getElementById('result-text');
    const countdownEl = document.getElementById('countdown');
    const latestSessionInfoEl = document.getElementById('latest-session-info');
    
    // === Modal elements ===
    const betModal = document.getElementById('bet-modal');
    const modalBetTypeEl = document.getElementById('modal-bet-type');
    const currentBetAmountEl = document.getElementById('current-bet-amount');
    const chips = document.querySelectorAll('.chip');
    const allInBtn = document.getElementById('all-in-btn');
    const confirmBetBtn = document.getElementById('confirm-bet-btn');
    const cancelBetBtn = document.getElementById('cancel-bet-btn');

    // === Lớp che ===
    const diceCover = document.getElementById('dice-cover');
    const postRevealCountdownEl = document.getElementById('post-reveal-countdown');
    
    // === Icon người dùng và menu ===
    const userIcon = document.getElementById('user-icon');
    const userMenu = document.getElementById('user-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const enterCodeBtn = document.getElementById('enter-code-btn');
    const withdrawBtn = document.getElementById('withdraw-btn');

    // === Các phần tử DOM cho Modal Code ===
    const codeModal = document.getElementById('code-modal');
    const giftcodeInput = document.getElementById('giftcode-input');
    const submitCodeBtn = document.getElementById('submit-code-btn');
    const closeCodeModalBtn = document.getElementById('close-code-modal-btn');
    const codeMessageEl = document.getElementById('code-message');

    // === Các phần tử DOM cho Modal Rút tiền ===
    const withdrawModal = document.getElementById('withdraw-modal');
    const withdrawForm = document.getElementById('withdraw-form');
    const bankSelect = document.getElementById('bank-select');
    const accountNumberInput = document.getElementById('account-number');
    const withdrawAmountInput = document.getElementById('withdraw-amount');
    const confirmWithdrawBtn = document.getElementById('confirm-withdraw-btn');
    const cancelWithdrawBtn = document.getElementById('cancel-withdraw-btn');
    const withdrawAmountTextEl = document.getElementById('withdraw-amount-text');

    // === Thêm các phần tử DOM cho Video ===
    const videoOverlay = document.getElementById('video-overlay');
    const withdrawalVideo = document.getElementById('withdrawal-video');

    // === Biến trạng thái game ===
    let currentUser = null;
    let taiTotalBet = 0; // Cược của người chơi hiện tại
    let xiuTotalBet = 0; // Cược của người chơi hiện tại
    let taiBotBet = 0;   // Cược của bot
    let xiuBotBet = 0;   // Cược của bot
    let taiTotalPlayers = 0;
    let xiuTotalPlayers = 0;
    let playerBetAmount = 0;
    let countdownTime = 30;
    let countdownInterval;
    let autoUpdateInterval;
    let autoRevealTimer;
    let postRevealInterval;
    let currentBetType = null;
    let sessionId = 440684;
    let scoreHistory = [];
    
    // === Danh sách code và trạng thái đã sử dụng ===
    let giftCodes = {};

    // === Biến cho biểu đồ ===
    let scoreChart;

    // === Biến cho sự kiện kéo thả ===
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentDiceResult = {};

    // === Hàm chung ===
    const showView = (viewId) => {
        loginView.classList.add('hidden');
        registerView.classList.add('hidden');
        gameContainer.classList.add('hidden');
        authContainer.classList.add('hidden');
        
        hideBetModal();
        hideCodeModal();
        hideWithdrawModal();
        videoOverlay.classList.add('hidden');

        if (viewId === 'login') {
            authContainer.classList.remove('hidden');
            loginView.classList.remove('hidden');
        } else if (viewId === 'register') {
            authContainer.classList.remove('hidden');
            registerView.classList.remove('hidden');
        } else if (viewId === 'game') {
            gameContainer.classList.remove('hidden');
            userIcon.classList.remove('hidden');
            currentBalanceEl.classList.remove('hidden');
            if (currentUser) {
                updateBalance();
            }
        }
    };
    
    // Hàm định dạng số có dấu phẩy/chấm
    const formatNumberWithCommas = (number) => {
        return number.toLocaleString('vi-VN');
    };

    // Hàm chuyển số thành chữ tiếng Việt
    const convertNumberToVietnameseText = (num) => {
        if (num === 0) return 'Không đồng';
        if (num < 0) return 'Số tiền không hợp lệ';

        const units = ['', 'nghìn', 'triệu', 'tỷ'];
        const numbers = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

        const readGroup = (group) => {
            let text = '';
            const h = Math.floor(group / 100);
            const t = Math.floor((group % 100) / 10);
            const o = group % 10;

            if (h > 0) {
                text += numbers[h] + ' trăm ';
            }

            if (t > 1) {
                text += numbers[t] + ' mươi ';
                if (o === 1) text += 'mốt';
                else if (o === 5) text += 'lăm';
                else if (o > 0) text += numbers[o];
            } else if (t === 1) {
                text += 'mười ';
                if (o === 1) text += 'một';
                else if (o === 5) text += 'lăm';
                else if (o > 0) text += numbers[o];
            } else if (t === 0) {
                if (o > 0 && h > 0) text += 'lẻ ';
                if (o > 0) text += numbers[o];
            }
            return text.trim();
        };

        let result = '';
        let i = 0;
        let tempNum = num;

        while (tempNum > 0) {
            const group = tempNum % 1000;
            if (group > 0) {
                let groupText = readGroup(group);
                result = groupText + ' ' + units[i] + ' ' + result;
            }
            tempNum = Math.floor(tempNum / 1000);
            i++;
        }
        
        result = result.trim().replace(/\s+/g, ' ');
        return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
    };

    const loadUsers = () => {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    };

    const saveUsers = (users) => {
        localStorage.setItem('users', JSON.stringify(users));
    };

    const saveUserBalance = () => {
        const users = loadUsers();
        const userIndex = users.findIndex(user => user.username === currentUser.username);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            saveUsers(users);
        }
    };

    const updateBalance = () => {
        if (currentUser) {
            currentBalanceEl.textContent = formatNumberWithCommas(currentUser.balance);
        } else {
            currentBalanceEl.textContent = '0';
        }
    };

    const updateTotalBetsAndPlayers = () => {
        taiTotalBetEl.textContent = formatNumberWithCommas(taiTotalBet + taiBotBet);
        xiuTotalBetEl.textContent = formatNumberWithCommas(xiuTotalBet + xiuBotBet);
        taiTotalPlayersEl.textContent = formatNumberWithCommas(taiTotalPlayers);
        xiuTotalPlayersEl.textContent = formatNumberWithCommas(xiuTotalPlayers);
    };

    const updateBotBetsAndPlayers = () => {
        // Tăng số người chơi với số lớn hơn
        const taiIncrementPlayers = Math.floor(Math.random() * 200) + 50; // Tăng từ 50 đến 250 người mỗi lần
        const xiuIncrementPlayers = Math.floor(Math.random() * 200) + 50;
        
        // Tăng số tiền cược với số lớn hơn để đạt hàng chục, hàng trăm triệu
        const taiIncrementBet = (Math.floor(Math.random() * 50) + 10) * 100000; // Tăng từ 1 triệu đến 6 triệu mỗi lần
        const xiuIncrementBet = (Math.floor(Math.random() * 50) + 10) * 100000;

        // Đảm bảo có sự chênh lệch lớn hơn giữa hai bên
        if (Math.random() > 0.5) {
            taiTotalPlayers += taiIncrementPlayers * 2;
            xiuTotalPlayers += xiuIncrementPlayers;
            taiBotBet += taiIncrementBet * 2;
            xiuBotBet += xiuIncrementBet;
        } else {
            taiTotalPlayers += taiIncrementPlayers;
            xiuTotalPlayers += xiuIncrementPlayers * 2;
            taiBotBet += taiIncrementBet;
            xiuBotBet += xiuIncrementBet * 2;
        }
        
        // Cập nhật lại giao diện
        updateTotalBetsAndPlayers();
    };

    // === Logic Đăng nhập / Đăng ký ===
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showView('register');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showView('login');
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = registerUsernameInput.value;
        const password = registerPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (password !== confirmPassword) {
            alert('Mật khẩu không khớp!');
            return;
        }

        const users = loadUsers();
        if (users.some(user => user.username === username)) {
            alert('Tên đăng nhập đã tồn tại!');
            return;
        }
        
        const newUser = { 
            username, 
            password, 
            balance: 100000, 
            lastCheckInDate: new Date().toLocaleDateString('en-CA') 
        };
        users.push(newUser);
        saveUsers(users);

        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        registerForm.reset();
        showView('login');
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = loginUsernameInput.value;
        const password = loginPasswordInput.value;

        const users = loadUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            currentUser = user;
            
            const today = new Date().toLocaleDateString('en-CA');
            if (currentUser.lastCheckInDate !== today) {
                currentUser.balance += 10000;
                currentUser.lastCheckInDate = today;
                saveUserBalance();
                alert('Bạn nhận được 10,000 tiền điểm danh hàng ngày!');
            }
            
            showView('game');
            updateBalance();
            localStorage.setItem('loggedInUser', currentUser.username);
            document.querySelectorAll('.place-bet-btn').forEach(btn => btn.disabled = false);
            loginForm.reset();
        } else {
            alert('Tên đăng nhập hoặc mật khẩu không đúng!');
        }
    });

    // === LOGIC XỬ LÝ MENU NGƯỜI DÙNG ===
    userIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('hidden');
    });

    document.body.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target) && !userIcon.contains(e.target)) {
            userMenu.classList.add('hidden');
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentUser = null;
        localStorage.removeItem('loggedInUser');
        updateBalance();
        showView('login');
        resetGame();
    });

    enterCodeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        userMenu.classList.add('hidden');
        showCodeModal();
    });

    withdrawBtn.addEventListener('click', (e) => {
        e.preventDefault();
        userMenu.classList.add('hidden');
        showWithdrawModal();
    });

    // === Logic Game ===
    const showBetModal = (betType) => {
        if (!currentUser) {
            alert('Vui lòng đăng nhập để đặt cược!');
            return;
        }
        currentBetType = betType;
        modalBetTypeEl.textContent = betType.toUpperCase();
        playerBetAmount = 0;
        currentBetAmountEl.textContent = '0';
        betModal.classList.add('show');
    };

    const hideBetModal = () => {
        betModal.classList.remove('show');
        playerBetAmount = 0;
        currentBetAmountEl.textContent = '0';
        betTaiEl.classList.remove('selected');
        betXiuEl.classList.remove('selected');
        currentBetType = null;
    };

    document.querySelectorAll('.place-bet-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const betOption = event.target.closest('.bet-option');
            const betType = betOption.id === 'bet-tai' ? 'tai' : 'xiu';
            
            betTaiEl.classList.remove('selected');
            betXiuEl.classList.remove('selected');
            betOption.classList.add('selected');
            
            showBetModal(betType);
        });
    });

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (!currentUser) return;
            const value = parseInt(chip.dataset.value);
            const newAmount = playerBetAmount + value;
            if (newAmount > currentUser.balance) {
                alert('Số tiền cược vượt quá số dư!');
                return;
            }
            playerBetAmount = newAmount;
            currentBetAmountEl.textContent = formatNumberWithCommas(playerBetAmount);
        });
    });
    
    allInBtn.addEventListener('click', () => {
        if (!currentUser) return;
        playerBetAmount = currentUser.balance;
        currentBetAmountEl.textContent = formatNumberWithCommas(playerBetAmount);
    });

    confirmBetBtn.addEventListener('click', () => {
        if (!currentUser) return;
        if (playerBetAmount <= 0) {
            alert('Vui lòng chọn số tiền cược!');
            return;
        }
        
        currentUser.balance -= playerBetAmount;
        saveUserBalance();
        updateBalance();
        
        if (currentBetType === 'tai') {
            taiTotalBet += playerBetAmount;
        } else {
            xiuTotalBet += playerBetAmount;
        }
        updateTotalBetsAndPlayers();
        
        hideBetModal();
        document.querySelectorAll('.place-bet-btn').forEach(btn => btn.disabled = true);
    });

    cancelBetBtn.addEventListener('click', () => {
        hideBetModal();
    });

    const startCountdown = () => {
        countdownTime = 30;
        countdownEl.textContent = `${countdownTime}s`;
        clearInterval(countdownInterval);
        clearInterval(autoUpdateInterval); // Dừng cập nhật cũ
        autoUpdateInterval = setInterval(updateBotBetsAndPlayers, 2000); // Bắt đầu cập nhật mới
        countdownInterval = setInterval(() => {
            countdownTime--;
            countdownEl.textContent = `${countdownTime}s`;
            if (countdownTime <= 0) {
                clearInterval(countdownInterval);
                clearInterval(autoUpdateInterval);
                endBettingPhase();
            }
        }, 1000);
    };

    const revealResult = () => {
        clearTimeout(autoRevealTimer);
        
        diceCover.style.transform = `translateY(${diceCover.offsetHeight}px)`;
        diceCover.style.opacity = '0';
        diceCover.removeEventListener('pointerdown', startDrag);
        
        setTimeout(() => {
            diceCover.classList.add('hidden');
            
            let resultMessage = `${currentDiceResult.gameResult} (${currentDiceResult.total})`;
            
            if (currentUser) {
                const playerBetAmount = taiTotalBet > 0 ? taiTotalBet : (xiuTotalBet > 0 ? xiuTotalBet : 0);
                if (playerBetAmount > 0) {
                    const playerBetType = taiTotalBet > 0 ? 'tai' : 'xiu';

                    if (currentDiceResult.gameResult === 'BÃO') {
                        resultMessage += ' - Thua';
                    } else if ((playerBetType === 'tai' && currentDiceResult.gameResult === 'TÀI') || (playerBetType === 'xiu' && currentDiceResult.gameResult === 'XỈU')) {
                        const winAmount = playerBetAmount * 1.9;
                        currentUser.balance += winAmount;
                        resultMessage += ` + ${formatNumberWithCommas(winAmount)} `;
                    } else {
                        resultMessage += 'Thua';
                    }
                }
                saveUserBalance();
                updateBalance();
            }

            resultTextEl.textContent = resultMessage;

            sessionId++;
            scoreHistory.push({ sessionId, total: currentDiceResult.total, dice: [currentDiceResult.dice1, currentDiceResult.dice2, currentDiceResult.dice3], result: currentDiceResult.gameResult });
            
            localStorage.setItem('scoreHistory', JSON.stringify(scoreHistory));
            localStorage.setItem('sessionId', sessionId);

            updateChart();

            let postRevealTime = 5;
            postRevealCountdownEl.classList.remove('hidden');
            postRevealCountdownEl.textContent = `Làm mới sau ${postRevealTime}s`;

            postRevealInterval = setInterval(() => {
                postRevealTime--;
                postRevealCountdownEl.textContent = `Làm mới sau ${postRevealTime}s`;
                if (postRevealTime <= 0) {
                    clearInterval(postRevealInterval);
                    postRevealCountdownEl.classList.add('hidden');
                    resetGame();
                }
            }, 1000);

        }, 500);
    };

    const endBettingPhase = () => {
        document.querySelectorAll('.place-bet-btn').forEach(btn => btn.disabled = true);
        betTaiEl.classList.remove('selected');
        betXiuEl.classList.remove('selected');
        
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const dice3 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2 + dice3;
        let gameResult = (total >= 11 && total <= 17) ? 'TÀI' : 'XỈU';
        if (dice1 === dice2 && dice2 === dice3) {
            gameResult = 'BÃO';
        }
        
        currentDiceResult = { dice1, dice2, dice3, total, gameResult };
        
        diceEls.forEach(dice => dice.textContent = '?');
        diceEls[0].textContent = dice1;
        diceEls[1].textContent = dice2;
        diceEls[2].textContent = dice3;


        resultTextEl.textContent = '';
        
        diceCover.style.transform = 'translate(0, 0)';
        diceCover.style.opacity = '1';
        diceCover.classList.remove('hidden');

        diceCover.addEventListener('pointerdown', startDrag);
        document.addEventListener('pointermove', onDrag);
        document.addEventListener('pointerup', stopDrag);

        autoRevealTimer = setTimeout(() => {
            if (isDragging) return;
            revealResult();
        }, 10000);
    };

    const startDrag = (e) => {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        diceCover.style.cursor = 'grabbing';
        clearTimeout(autoRevealTimer);
    };

    const onDrag = (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        diceCover.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > diceCover.offsetWidth * 0.9) {
            revealResult();
            isDragging = false;
        }
    };

    const stopDrag = () => {
        if (isDragging) {
            diceCover.style.transform = 'translate(0, 0)';
            diceCover.style.opacity = '1';
        }
        isDragging = false;
        diceCover.style.cursor = 'grab';
    };

    const resetGame = () => {
        currentBetType = null;
        taiTotalBet = 0;
        xiuTotalBet = 0;
        taiBotBet = 0;
        xiuBotBet = 0;
        taiTotalPlayers = 0;
        xiuTotalPlayers = 0;
        playerBetAmount = 0;
        updateTotalBetsAndPlayers();
        diceEls.forEach(dice => dice.textContent = '?');
        resultTextEl.textContent = 'Chờ đặt cược...';

        if (currentUser) {
            document.querySelectorAll('.place-bet-btn').forEach(btn => btn.disabled = false);
        } else {
            document.querySelectorAll('.place-bet-btn').forEach(btn => btn.disabled = true);
        }
        
        diceCover.style.transform = 'translate(0, 0)';
        diceCover.style.opacity = '1';
        diceCover.classList.remove('hidden');

        clearTimeout(autoRevealTimer);
        clearInterval(postRevealInterval);
        document.removeEventListener('pointermove', onDrag);
        document.removeEventListener('pointerup', stopDrag);
        
        startCountdown();
    };

    // === Logic biểu đồ soi cầu ===
    const initChart = () => {
        const ctx = document.getElementById('scoreChart').getContext('2d');
        scoreChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Tổng điểm',
                    data: [],
                    borderColor: 'rgb(241, 196, 15)',
                    backgroundColor: 'rgba(241, 196, 15, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointStyle: 'circle',
                    pointRadius: 6,
                    pointBackgroundColor: function(context) {
                        const score = context.raw;
                        if (score >= 11 && score <= 17) return 'rgb(231, 76, 60)';
                        if (score === 3 || score === 18) return 'rgb(142, 68, 173)';
                        return 'rgb(52, 152, 219)';
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 3,
                        max: 18,
                        ticks: {
                            stepSize: 3,
                            color: '#ecf0f1'
                        },
                        grid: {
                            color: 'rgba(236, 240, 241, 0.2)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ecf0f1'
                        },
                        grid: {
                            color: 'rgba(236, 240, 241, 0.2)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const score = context.raw;
                                const sessionData = scoreHistory.find(s => s.total === score && s.sessionId == scoreChart.data.labels[context.dataIndex]);
                                let result = (score >= 11 && score <= 17) ? 'TÀI' : 'XỈU';
                                if (score === 3 || score === 18) result = 'BÃO';
                                return `Phiên #${sessionData.sessionId}: Tổng ${score} - ${result} (${sessionData.dice.join('-')})`;
                            }
                        }
                    }
                }
            }
        });
    };

    const updateChart = () => {
        if (!scoreChart) return;
        
        const latestHistory = scoreHistory.slice(-20);
        
        const labels = latestHistory.map(session => session.sessionId);
        const data = latestHistory.map(session => session.total);
        
        scoreChart.data.labels = labels;
        scoreChart.data.datasets[0].data = data;
        scoreChart.update();

        if (latestHistory.length > 0) {
            const lastResult = latestHistory[latestHistory.length - 1];
            latestSessionInfoEl.textContent = ` ${lastResult.result} (${lastResult.dice.join('-')})`;
        }
    };
    
    // --- KHỞI TẠO GAME KHI TẢI TRANG ---
    const loadGiftCodes = () => {
        const codes = localStorage.getItem('giftCodes');
        if (codes) {
            giftCodes = JSON.parse(codes);
        }
    };

    const showCodeModal = () => {
        if (!currentUser) {
            alert('Vui lòng đăng nhập để nhập code!');
            return;
        }
        hideWithdrawModal();
        betModal.classList.remove('show');
        codeMessageEl.classList.add('hidden');
        giftcodeInput.value = '';
        codeModal.classList.add('show');
    };

    const hideCodeModal = () => {
        codeModal.classList.remove('show');
        giftcodeInput.value = '';
        codeMessageEl.classList.add('hidden');
    };

    submitCodeBtn.addEventListener('click', () => {
        const code = giftcodeInput.value.trim().toUpperCase();

        const storedGiftCodes = JSON.parse(localStorage.getItem('giftCodes')) || {};

        if (!storedGiftCodes[code]) {
            codeMessageEl.textContent = 'Mã code không hợp lệ.';
            codeMessageEl.className = 'error';
            codeMessageEl.classList.remove('hidden');
            return;
        }

        const codeInfo = storedGiftCodes[code];

        if (codeInfo.usesLeft <= 0) {
            codeMessageEl.textContent = 'Mã code này đã hết lượt sử dụng.';
            codeMessageEl.className = 'error';
            codeMessageEl.classList.remove('hidden');
            return;
        }
        
        if (!currentUser) {
            alert('Vui lòng đăng nhập để nhập code!');
            return;
        }
        
        if (codeInfo.usedBy && codeInfo.usedBy.includes(currentUser.username)) {
            codeMessageEl.textContent = 'Bạn đã sử dụng mã code này rồi.';
            codeMessageEl.className = 'error';
            codeMessageEl.classList.remove('hidden');
            return;
        }

        const reward = codeInfo.value;
        currentUser.balance += reward;
        codeInfo.usesLeft--;
        
        if (!codeInfo.usedBy) {
            codeInfo.usedBy = [];
        }
        codeInfo.usedBy.push(currentUser.username);

        saveUserBalance();
        localStorage.setItem('giftCodes', JSON.stringify(storedGiftCodes));
        updateBalance();

        codeMessageEl.textContent = `Bạn đã nhận được ${formatNumberWithCommas(reward)} thành công!`;
        codeMessageEl.className = 'success';
        codeMessageEl.classList.remove('hidden');
        
        setTimeout(hideCodeModal, 3000);
    });

    closeCodeModalBtn.addEventListener('click', hideCodeModal);

    // Thêm các hàm và sự kiện cho modal rút tiền
    const showWithdrawModal = () => {
        if (!currentUser) {
            alert('Vui lòng đăng nhập để rút tiền!');
            return;
        }
        hideCodeModal();
        betModal.classList.remove('show');
        withdrawModal.classList.add('show');
        
        withdrawAmountInput.value = '';
        withdrawAmountTextEl.textContent = '';
    };

    const hideWithdrawModal = () => {
        withdrawModal.classList.remove('show');
        withdrawForm.reset();
        withdrawAmountTextEl.textContent = '';
    };

    cancelWithdrawBtn.addEventListener('click', () => {
        hideWithdrawModal();
    });

    // === Cập nhật logic rút tiền để hiển thị video và kiểm tra mức rút tối thiểu ===
    const handleWithdrawal = (e) => {
        e.preventDefault();

        const bankName = bankSelect.value;
        const accountNumber = accountNumberInput.value;
        const amount = parseInt(withdrawAmountInput.value.replace(/\./g, ''));
        
        // Thêm kiểm tra mức rút tối thiểu
        const MIN_WITHDRAW_AMOUNT = 500000;
        if (isNaN(amount) || amount <= 0) {
            alert('Số tiền rút không hợp lệ!');
            return;
        }
        if (amount < MIN_WITHDRAW_AMOUNT) {
            alert(`Số tiền rút tối thiểu là ${formatNumberWithCommas(MIN_WITHDRAW_AMOUNT)} VNĐ.`);
            return;
        }
        if (amount > currentUser.balance) {
            alert('Số tiền rút vượt quá số dư hiện có!');
            return;
        }
        
        // Ẩn modal rút tiền và hiển thị video
        hideWithdrawModal();
        videoOverlay.classList.remove('hidden');
        withdrawalVideo.play();
        
        // Cập nhật số dư người dùng
        currentUser.balance -= amount;
        saveUserBalance();
        updateBalance();
        
       // Thêm sự kiện lắng nghe: khi video kết thúc ('ended'), 
// thêm lại class 'hidden' để ẩn lớp phủ đi
withdrawalVideo.addEventListener('ended', () => {
    videoOverlay.classList.add('hidden');
}, { once: true });
    };

    withdrawForm.addEventListener('submit', handleWithdrawal);

    withdrawAmountInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (currentUser) {
            const maxAmount = currentUser.balance;
            if (parseInt(value) > maxAmount) {
                value = maxAmount.toString();
            }
        }
        
        const formattedValue = value ? formatNumberWithCommas(parseInt(value)) : '';
        e.target.value = formattedValue;
        
        if (value) {
            const amountInWords = convertNumberToVietnameseText(parseInt(value));
            withdrawAmountTextEl.textContent = amountInWords;
        } else {
            withdrawAmountTextEl.textContent = '';
        }
    });

    const initializeGame = () => {
        const storedHistory = localStorage.getItem('scoreHistory');
        const storedSessionId = localStorage.getItem('sessionId');
        
        if (storedHistory) {
            scoreHistory = JSON.parse(storedHistory);
            sessionId = storedSessionId ? parseInt(storedSessionId, 10) : 440684;
        }
        
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
            const users = loadUsers();
            currentUser = users.find(u => u.username === storedUser);
        }

        initChart();
        updateChart();
        loadGiftCodes();
        
        if (currentUser) {
            showView('game');
            updateBalance();
            document.querySelectorAll('.place-bet-btn').forEach(btn => btn.disabled = false);
        } else {
            showView('login');
            document.querySelectorAll('.place-bet-btn').forEach(btn => btn.disabled = true);
        }
        
        startCountdown();
    };

    initializeGame();

    
});

// === Các phần tử DOM cho Modal Code ===
const codeModal = document.getElementById('code-modal');
const giftcodeInput = document.getElementById('giftcode-input');
const submitCodeBtn = document.getElementById('submit-code-btn');
const closeCodeModalBtn = document.getElementById('close-code-modal-btn');
const codeMessageEl = document.getElementById('code-message');

// Hàm hiển thị modal code
const showCodeModal = () => {
    codeModal.classList.add('show');
    codeMessageEl.textContent = '';
    giftcodeInput.value = '';
};

// Hàm ẩn modal code
const hideCodeModal = () => {
    codeModal.classList.remove('show');
};

// Hàm xử lý việc nhập giftcode
// Hàm xử lý việc nhập giftcode đã được cập nhật
const handleGiftCodeSubmission = async () => {
    if (!currentUser) {
        alert('Vui lòng đăng nhập để sử dụng Giftcode!');
        return;
    }

    const enteredCode = giftcodeInput.value.toUpperCase();
    if (!enteredCode) {
        codeMessageEl.style.color = '#e74c3c';
        codeMessageEl.textContent = 'Vui lòng nhập mã Giftcode.';
        return;
    }

    // URL của API backend
    const API_URL = 'https://admin9key.pythonanywhere.com';

    try {
        const response = await fetch(`${API_URL}/redeem-key`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                key: enteredCode,
                // Bạn có thể gửi thông tin người dùng nếu cần thiết
                // username: currentUser.username, 
            }),
        });

        const result = await response.json();

        if (response.ok) {
            // Mã code hợp lệ và đã được sử dụng thành công
            currentUser.balance += result.amount;
            saveUserBalance();
            updateBalance();

            codeMessageEl.style.color = '#2ecc71';
            codeMessageEl.textContent = `Thành công! Bạn nhận được ${formatNumberWithCommas(result.amount)} VNĐ.`;
        } else {
            // Mã code không hợp lệ hoặc đã hết lượt sử dụng
            codeMessageEl.style.color = '#e74c3c';
            codeMessageEl.textContent = result.message || 'Lỗi không xác định.';
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        codeMessageEl.style.color = '#e74c3c';
        codeMessageEl.textContent = 'Không thể kết nối đến server. Vui lòng thử lại sau.';
    }
};

// Đảm bảo sự kiện vẫn được gắn vào nút xác nhận
submitCodeBtn.addEventListener('click', handleGiftCodeSubmission);

// Thêm sự kiện cho các nút trong modal
enterCodeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    userMenu.classList.add('hidden');
    showCodeModal();
});

closeCodeModalBtn.addEventListener('click', hideCodeModal);

submitCodeBtn.addEventListener('click', handleGiftCodeSubmission);

// Đóng modal khi click ra ngoài
window.addEventListener('click', (e) => {
    if (e.target === codeModal) {
        hideCodeModal();
    }
});

// Bạn có thể tạo sẵn một vài giftcode để thử nghiệm
// Ví dụ: createAndSaveGiftCode('VIPCODE', 50000, 1);
document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');

    // Автоматическое увеличение высоты textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Отправка сообщения при нажатии Enter (но Shift+Enter = новая строка)
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener('click', sendMessage);

    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        // Добавляем сообщение пользователя
        addMessage(message, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';

        // Показываем индикатор набора текста
        showTypingIndicator();

        // Имитация ответа ИИ (в реальном приложении здесь был бы API-запрос)
        setTimeout(() => {
            removeTypingIndicator();
            const botResponse = getBotResponse(message);
            addMessage(botResponse, 'bot');
        }, 1000 + Math.random() * 2000); // Случайная задержка
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Простые ответы бота (имитация)
    function getBotResponse(userMessage) {
        const responses = [
            "Интересный вопрос! Я DeepSeek Chat, и я могу помочь вам с различными темами.",
            "Понял ваш запрос. Что именно вы хотели бы узнать подробнее?",
            "Спасибо за сообщение! Как я могу вам помочь?",
            "Это важная тема. Вот что я нашел: [имитация ответа ИИ]",
            "Я проанализировал ваш запрос. Рекомендую рассмотреть следующие варианты...",
            "Хороший вопрос! Давайте разберем его по пунктам..."
        ];
        
        // Простая логика ответа
        if (userMessage.toLowerCase().includes('привет')) {
            return "Привет! Как я могу вам помочь сегодня?";
        } else if (userMessage.toLowerCase().includes('спасибо')) {
            return "Всегда рад помочь! Есть что-то еще, что вас интересует?";
        } else {
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }
});
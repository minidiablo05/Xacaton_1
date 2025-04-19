document.addEventListener('DOMContentLoaded', function() {

    // обьявление переменных

    // Переменные для отправки текстового сообщения
    const chatMessages = document.getElementById('chatMessages');
    const sendButton = document.getElementById('sendButton');

    // Переменные для записи аудио
    const speechBtn = document.getElementById('Record');
    let mediaRecorder;
    let audioChunks = [];
    let audioStream; // Для хранения потока микрофона
    let isRecognizing = false;

    const userInput = document.getElementById('userInput');

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

    
    // Запуск обработок кнопки

    // Обработчик кнопки отправки сообщения.
    sendButton.addEventListener('click', sendMessage);

    // Обработчик кнопки микрофона.
    speechBtn.addEventListener('click', () => {
        if (!isRecognizing) {
            startSpeech();
        } else {
            stopSpeech();
        }
    });


    function sendMessage() {
        // Проверка на наличие сообщения.
        const message = userInput.value.trim();
        if (message === '') return;

        // Добавляем сообщение пользователя
        addMessage(message, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';

        const csrfToken = getCookie('csrftoken'); // Получаем CSRF-токен

        const textData = {
          text: message
        };

        fetch('', {  // Убедитесь, что URL правильный
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,  // Если Django требует CSRF-токен
          },
          body: JSON.stringify(textData)
        })
        .then(response => response.json())  // Если Django возвращает JSON
        .then(data => {
          // Вывод ответа сервера.
          addMessage(data.response, 'bot'); // Предположим, Django вернул {"response": "..."}
          removeTypingIndicator()
        })
        .catch(error => console.error('Ошибка:', error));
    }

    // html заполнение ответа от сервера.
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Создание эффекта обработки сообщения.
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

    // Удаление эффекта обработки сообщения.
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Cоздание scfr токена
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Функция обработки записи микрофона.
    async function startSpeech() {
        try {
            // Запрос разрешения на микрофон и начало записи
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(audioStream);

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            
            speechBtn.textContent = 'идёт запись';

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.wav');

                const csrfToken = getCookie('csrftoken'); // Получаем CSRF-токен

                addMessage('Отправка файла для расшифровки', 'bot');
                showTypingIndicator();

                fetch('', {  // Убедитесь, что URL правильный
                    method: 'POST',
                    headers: {
                      'X-CSRFToken': csrfToken,  // Если Django требует CSRF-токен
                    },
                    body: formData,
                    credentials: 'include',
                  })
                  .then(response => response.json())  // Если Django возвращает JSON
                  .then(data => {
                    // Вывод ответа сервера.
                    userInput.value = data.response; // Предположим, Django вернул {"response": "..."}
                    removeTypingIndicator()
                    addMessage('Расшифровка проведена успешно.', 'bot');
                  })
                  .catch(error => console.error('Ошибка:', error));

                // Освобождаем поток микрофона
                audioStream.getTracks().forEach(track => track.stop());

            };

            mediaRecorder.start();
            isRecognizing = true;
            audioChunks = [];
        } catch (error) {
            console.error('Ошибка доступа к микрофону:', error);
            alert('Не удалось получить доступ к микрофону');
        }
    }

    // Функция остановка записи.
    async function stopSpeech(){
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            isRecognizing = false;
            speechBtn.innerHTML = '<i class="fa-solid fa-microphone-lines"></i>';
        }
    }

});
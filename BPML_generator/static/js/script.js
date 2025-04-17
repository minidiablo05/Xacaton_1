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
          console.log("Ответ от Django:", data);
          const receivedText = data.response;  // Предположим, Django вернул {"response": "..."}
          console.log("Текст из Django:", receivedText);
        })
        .catch(error => console.error('Ошибка:', error));

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
});


const statusDiv = document.getElementById('statusDiv'); // Добавьте этот элемент в id="Record"HTML
const speechBtn = document.getElementById('Record');

let mediaRecorder;
let audioChunks = [];
let audioStream; // Для хранения потока микрофона

let isRecognizing = false;

// Функция для кодирования WAV в MP3
function encodeToMp3(audioBuffer) {
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0);


    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
    const sampleBlockSize = 1152;
    const mp3Data = [];

    for (let i = 0; i < samples.length; i += sampleBlockSize) {
        const sampleChunk = samples.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
}

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

speechBtn.addEventListener('click', () => {
            if (!isRecognizing) {
                startSpeech();
            } else {
                stopSpeech();
            }
        });

// Запрос разрешения на микрофон и начало записи
async function startSpeech() {
    try {
        speechBtn.textContent = "Идёт запись";
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(audioStream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            speechBtn.textContent = "Идёт отправка";
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            // const mp3Blob = encodeToMp3(audioBlob);

            const formData = new FormData();
            // formData.append('audio', mp3Blob, 'recording.mp3');
            formData.append('audio', audioBlob, 'recording.wav');

            try {
                const csrfToken = getCookie('csrftoken'); // Получаем CSRF-токен

                // Добавлен async/await для правильной обработки Promise
                const response = await fetch('', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': csrfToken, // Добавляем CSRF-токен в заголовок
                    },
                    credentials: 'include', // Важно для передачи куки
                });

                const result = await response.json();
                userInput.value = result.response;
                if (statusDiv) {
                    statusDiv.textContent = "Файл успешно отправлен!";
                }
                console.log("Ответ сервера:", result);
            } catch (error) {
                if (statusDiv) {
                    statusDiv.textContent = "Ошибка отправки: " + error.message;
                }
                console.error("Ошибка:", error);
            }

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

// Остановка записи
async function stopSpeech(){
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        isRecognizing = false;
        speechBtn.textContent = "Запись отправленна";
    }
}
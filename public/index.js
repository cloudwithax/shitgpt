// Replace this with your actual API endpoint
const apiUrl = `${window.location.href}/api/generate`;

const chatArea = document.querySelector('.chat-area');
const inputArea = document.querySelector('.input-area');
const promptInput = document.getElementById('prompt');
const submitButton = document.getElementById('submit');
const clearButton = document.getElementById('clear');

submitButton.addEventListener('click', executeApiRequest);
let newestMessage = '';
let chatIsClear = true;
let aiChatMessage;
let conversationContext;

let isAiThinking = false;


clearButton.addEventListener('click', async () => {
    if (!chatIsClear) {
        const confirmation = confirm('Are you sure you want to clear the chat?');
        if (confirmation) {
            chatArea.innerHTML = '';
            chatIsClear = true;
            await sleep(1);
            inputArea.style.position = 'absolute';
            newestMessage = '';
            aiChatMessage = null;
            conversationContext = null;
        }
    } else {
        let toast = document.querySelector('.toast');
        if (toast) {
            toast.remove();
        }
        toast = document.createElement('div');
        toast.classList.add('toast');
        toast.innerHTML = 'Chat is already empty!';
        document.body.appendChild(toast);
        setTimeout(async () => {
            toast.classList.add('hide');
            toast.addEventListener('animationend', () => {
                toast.remove();
            }, { once: true });
        }, 1500);
    }
});



promptInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && promptInput.value != '') {
        executeApiRequest();
    }

    
});

// on scroll
document.addEventListener('scroll', () => {
    const inputAreaRect = inputArea.getBoundingClientRect();
    const chatAreaRect = chatArea.getBoundingClientRect();
    const chatAreaBottom = chatAreaRect.top + chatAreaRect.height;
    const inputAreaTop = inputAreaRect.top;
    if (chatAreaBottom >= inputAreaTop) {
        inputArea.style.position = 'sticky';
    }
    
});

promptInput.addEventListener('input', () => {
    if (promptInput.value == '') {
        const submitButton = document.getElementById('submit');
        submitButton.style.backgroundColor = 'transparent';
        submitButton.style.cursor = 'default';

        const sendIcon = document.getElementById('send-icon');
        sendIcon.style.color = '#7c7c7c';

    } else {
        const submitButton = document.getElementById('submit');
        submitButton.style.backgroundColor = '#19C37D';
        submitButton.style.cursor = 'pointer';

        const sendIcon = document.getElementById('send-icon');
        sendIcon.style.color = 'white';
    }
});


function enableInput() {
    newestMessage = '';
    aiChatMessage = null;
    promptInput.disabled = false;
    promptInput.focus();
    chatArea.scrollTop = chatArea.scrollHeight;
}

async function displayUserMessage(text) {
    const userResponse = document.createElement('div');
    userResponse.classList.add('user-response');
    userResponse.innerHTML = `<img src="user-icon.png" alt="user icon" class="avatar"><div class="text-data"><p>${text}</p></div>`;
    chatArea.appendChild(userResponse);

    window.scrollTo(0, document.body.scrollHeight);
    
}

async function sleep(ms) { 
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function displayAiMessage(text) {
    isAiThinking = false;
    newestMessage += text;

    const idName = 'typewriter' + Math.floor(Math.random() * 1000000);
    
    if (!aiChatMessage) {
        const aiResponse = document.createElement('div');
        aiResponse.classList.add('ai-response');
        aiResponse.innerHTML = `<img src="ai-icon.png" alt="ai icon" class="avatar"><div class="text-data"><p id="${idName}"></p></div>`;
        chatArea.appendChild(aiResponse);
        aiChatMessage = aiResponse;
    } else {
        aiChatMessage.innerHTML = `<img src="ai-icon.png" alt="ai icon" class="avatar"><div class="text-data"><p id="${idName}"></p></div>`;
    }

    new TypeIt(`#${idName}`, {
        afterStep: async () => {
            window.scrollTo(0, document.body.scrollHeight);
        },
        afterComplete: async () => {
            enableInput();
        },
        strings: newestMessage,
        speed: 5,
        loop: false,
        cursorSpeed: 9007199254740991,
        cursor: {
            autoPause: true,
            options: {
                hideWhenDone: true
            }
        }   
      }).go();


    
}

async function displayAiThinking() {
    const aiResponse = document.createElement('div');
    aiResponse.classList.add('ai-response');
    chatArea.appendChild(aiResponse);
    aiChatMessage = aiResponse;
    aiChatMessage.innerHTML = `<img src="ai-icon.png" alt="ai icon" class="avatar"><div class="text-data"><img src="loading.gif" style="max-width: 1rem;" alt="loading"></div>`;
    window.scrollTo(0, document.body.scrollHeight);
    isAiThinking = true;

    setTimeout(() => {
        if (isAiThinking) {
            // edit the message
            aiChatMessage.innerHTML = `<img src="ai-icon.png" alt="ai icon" class="avatar"><div class="text-data"><img src="loading.gif" style="max-width: 1rem;" alt="loading"><div class="dono-msg">Don't like waiting? <a href="https://www.buymeacoffee.com/cloudwithax" target="_blank">Buy me a coffee</a> to help me get better hardware :)</div></div>`;
        }
    }, 5000);
}


async function executeApiRequest() {
    if (promptInput.value == '') {
        return;
    }

    if (chatIsClear) {
        chatIsClear = false;
    }

    promptInput.disabled = true;

    const prompt = promptInput.value;
    promptInput.value = '';
    const submitButton = document.getElementById('submit');
    submitButton.style.backgroundColor = 'transparent';
    submitButton.style.cursor = 'default';

    const sendIcon = document.getElementById('send-icon');
    sendIcon.style.color = '#7c7c7c';

    await displayUserMessage(prompt);
    await displayAiThinking();

    let requestBody;

    if (conversationContext) {
        requestBody = JSON.stringify({
            model: "zephyr",
            prompt: prompt,
            context: conversationContext,
            stream: "false"
        });
    } else {
        requestBody = JSON.stringify({
            model: "zephyr",
            prompt: prompt,
            stream: "false"
        });
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: requestBody,
        });

        if (!response.body) {
            throw new Error('Response body not available');
        }

        const reader = response.body.getReader();
        let responseText = '';

        let textResponse = '';

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            responseText += new TextDecoder().decode(value);

            while (responseText.includes('\n')) {
                const messageEnd = responseText.indexOf('\n') + 1;
                const message = responseText.slice(0, messageEnd).trim();
                responseText = responseText.slice(messageEnd);

                try {
                    const messageData = JSON.parse(message);
                    if (messageData.response) {
                        textResponse += messageData.response;
                    }
                    if (messageData.context) {
                        conversationContext = messageData.context;
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            }
        }

        await displayAiMessage(textResponse);
    } catch (error) {
        console.error('API request failed:', error);
    }
}
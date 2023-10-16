// Replace this with your actual API endpoint
const apiUrl = 'https://karaoke-rides-singh-charges.trycloudflare.com/api/generate';

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

// Add an event listener to the chat area to check if the user can scroll
chatArea.addEventListener('DOMNodeInserted', () => {
    // Check if the user can scroll
    const canScroll = chatArea.scrollHeight - chatArea.scrollTop === chatArea.clientHeight;

    // If the user can't scroll, add a temporary margin
    if (!canScroll) {
        chatArea.style.marginTop = '2rem';
    } else {
        // If the user can scroll, remove the margin
        chatArea.style.marginBottom = '0';
    }
});

clearButton.addEventListener('click', async () => {
    if (!chatIsClear) {
        const confirmation = confirm('Are you sure you want to clear the chat?');
        if (confirmation) {
            chatArea.innerHTML = '';
            chatIsClear = true;
            await sleep(1);
            inputArea.style.position = 'absolute';
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
    inputArea.style.position = 'sticky';
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
    newestMessage += text;
    
    if (!aiChatMessage) {
        const aiResponse = document.createElement('div');
        aiResponse.classList.add('ai-response');
        aiResponse.innerHTML = `<img src="ai-icon.png" alt="ai icon" class="avatar"><div class="text-data">${marked.parse(newestMessage)}</div>`;
        chatArea.appendChild(aiResponse);
        aiChatMessage = aiResponse;
    } else {
        aiChatMessage.innerHTML = `<img src="ai-icon.png" alt="ai icon" class="avatar"><div class="text-data">${marked.parse(newestMessage)}</div>`;
    }

    window.scrollTo(0, document.body.scrollHeight);
}

async function displayAiThinking() {
    const aiResponse = document.createElement('div');
    aiResponse.classList.add('ai-response');
    chatArea.appendChild(aiResponse);
    aiChatMessage = aiResponse;
    aiChatMessage.innerHTML = `<img src="ai-icon.png" alt="ai icon" class="avatar"><div class="text-data"><img src="loading.gif" style="max-width: 1rem;" alt="loading"></div>`;
    window.scrollTo(0, document.body.scrollHeight);
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
            model: "mistral",
            prompt: prompt,
            context: conversationContext,
        });
    } else {
        requestBody = JSON.stringify({
            model: "mistral",
            prompt: prompt,
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
                    if (messageData.context) {
                        conversationContext = messageData.context;
                    }
                    if (messageData.response) {
                        await displayAiMessage(messageData.response);
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            }
        }

        
        newestMessage = '';
        aiChatMessage = null;
        promptInput.disabled = false;
        promptInput.focus();
        chatArea.scrollTop = chatArea.scrollHeight;
    } catch (error) {
        console.error('API request failed:', error);
    }
}
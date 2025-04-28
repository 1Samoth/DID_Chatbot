'use strict';

let OPENAI_API_KEY;

fetch('../keys/gpt.json')
    .then(response => response.json())
    .then(config => {
        OPENAI_API_KEY = config.OPENAI_API_KEY;
    })
    .catch(error => console.error('Error loading gpt.json:', error));

export async function fetchOpenAIResponse(userMessage) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{role: "user", content: userMessage}],
        temperature: 0.7,
        max_tokens: 4096
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API request failed with status ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0].message.content.trim();
}
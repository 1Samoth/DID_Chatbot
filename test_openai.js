import API_KEY_IMPORT from './src/keys/gpt.json' with { type: 'json' };
const config = API_KEY_IMPORT;

const OPENAI_API_KEY = config.OPENAI_API_KEY;
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

async function main() {
    const fetch = await import('node-fetch').then(module => module.default);

    async function fetchOpenAIResponse(prompt) {
        const response = await fetch(OPENAI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{"role": "user", "content": prompt}],
                temperature: 0.7
            }),
        });

        const data = await response.json();
        return data.choices[0].message.content.trim();  
    }

    const userInput = "Who is the president of Tesla?";
    const openAIResponse = await fetchOpenAIResponse(userInput);

    console.log("User Input:", userInput);
    console.log("OpenAI Response:", openAIResponse);
}

main().catch(error => console.error(error));

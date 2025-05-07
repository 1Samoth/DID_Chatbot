// This is derived from ./test_openai.js
//
// GenerIA notes:
//   - FM-001: GenerIA API key is empty for now.
//   - FM-002: GenerIA-specific input payload.
//   - FM-003: GenerIA-specific output payload.
// -----------------------------------------------------------------------------


/* FM-001
import API_KEY_IMPORT from './src/keys/gpt.json' with { type: 'json' };
const config = API_KEY_IMPORT;
const GENERIA_API_KEY = config.OPENAI_API_KEY; */


const GENERIA_ENDPOINT = "https://03.generia.ai/bg/cathia";
import { formatTextWithUrls } from "./formatter.js";


   
    /* Affichage des réponses dans le chat */
function appendMessage(role, text) {
  const messagesContainer = document.getElementById('messages');
  const messageEl = document.createElement('div');
  messageEl.className = role; // "user" ou "assistant" pour le style
  messageEl.innerHTML = text;
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll en bas
}

export async function fetchAPIResponse(prompt) {
  /* FM-002.
  const payload = {
    model: "nexus_10b",
    messages: [{"role": "user", "content": prompt}],
    temperature: 0.7
  }; */
  const payload = {
    intent: "generia.intents.GENERATE",
    locale: "fr-CA",
    text: prompt,
    usecase: "cathia",
    user: "cathia@generia.ai"
  };

  // Envoi de la requête à l'API GénérIA
  const response = await fetch(GENERIA_ENDPOINT, {
    method: 'POST',
    headers: {
      /* FM-001.
      'Authorization': `Bearer ${GENERIA_API_KEY}`, */
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  //console.log("Data received:", data);

  /* FM-003
  return data.choices[0].message.content.trim(); */
  const generiaResponse = data.results.answer.trim();
  const formattedResponse = await formatTextWithUrls(generiaResponse);
  // Ajouter la réponse dans le chat (après avoir obtenu la réponse de GénérIA)
  appendMessage('assistant', 'Charlie : ' + formattedResponse);
  //console.log("GenerIA response:", generiaResponse);

  return formattedResponse;
}

    /*const userInput = "De quel couleur est le ciel ?";
    const generiaResponse = await fetchAPIResponse(userInput);

    console.log("\n");
    console.log("User input:", userInput);
    console.log("GenerIA response:", generiaResponse);
    console.log("\n");*/



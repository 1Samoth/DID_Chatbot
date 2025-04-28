import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { encode, decode } from 'js-base64';

async function getDidCredits(apiKey) {
  const url = "https://api.d-id.com/credits";
  const authString = apiKey + ":";
  const base64AuthString = encode(authString);

  const headers = {
    "accept": "application/json",
    "Authorization": `Basic ${base64AuthString}`
  };

  const response = await fetch(url, { headers });
  const data = await response.json();
  return data;
}

async function main() {
  try {
    // Read the API key from api.json file
    const apiKeyJson = JSON.parse(readFileSync('./src/keys/did.json', 'utf8'));
    const apiKey = apiKeyJson.key;

    const didCredits = await getDidCredits(apiKey);
    console.log("Response:", didCredits);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();

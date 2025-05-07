'use strict';
import DID_API from './keys/did.json' with { type: 'json' };
import { setVideoElement, playIdleVideo, stopAllStreams } from './components/streamManager.js';
import { fetchAPIResponse } from './components/test_generia.js';
import { removeUrls } from './components/formatter.js';


let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;

let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;

const talkButton = document.getElementById('talk-button');
const destroyButton = document.getElementById('destroy-button');
const userInput = document.getElementById('user-input-field');

// const peerStatusLabel = document.getElementById('peer-status-label');
// const iceStatusLabel = document.getElementById('ice-status-label');
// const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
// const signalingStatusLabel = document.getElementById('signaling-status-label');
// const streamingStatusLabel = document.getElementById('streaming-status-label');
let connected = false;

  
const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

if(!connected){
  if (peerConnection && peerConnection.connectionState === 'connected') {
    
  }
  else {
    stopAllStreams();
    closePC();
    
    const sessionResponse = await fetch(`${DID_API.url}/talks/streams`, {
      method: 'POST',
      headers: {'Authorization': `Basic ${DID_API.key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        source_url: "https://raw.githubusercontent.com/1Samoth/DID_Chatbot/refs/heads/main/charlie.png",
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json()
    streamId = newStreamId;
    sessionId = newSessionId;
    
    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
      connected = true;
    } catch (e) {
      console.log('error during streaming setup', e);
      stopAllStreams();
      closePC();
      //return;
    }

    const sdpResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}/sdp`,
      {
        method: 'POST',
        headers: {Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({answer: sessionClientAnswer, session_id: sessionId})
    });
  }
  playIdleVideo();
}

//playIdleVideo();


talkButton.onclick = async () => {
 if ((peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') && userInput.value.length > 0) {  
    sendUserMessage();
    const responseFromGenerIA = await fetchAPIResponse(userInput.value);
    //console.log('input : ' + userInput.value);
   
    if(responseFromGenerIA) {
      //console.log('RESPONSE FROM GENERIA: ' + responseFromGenerIA);
      //console.log('GENERIA Response Length:', responseFromGenerIA.length);
      //console.log("GENERIA Response:", responseFromGenerIA);
    
    }
    else {
      //console.log('ERREUR GENERIA', responseFromGenerIA);
    }

    userInput.value = '';
    //console.log("talkButton")

    const _data = await removeUrls(responseFromGenerIA);

    console.log(`_DATA WAIT : ${_data}`);

    const talkResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
      method: 'POST',
      headers: { 
        Authorization: `Basic ${DID_API.key}`, 
        'Content-Type': 'application/json'
     },
      body: JSON.stringify({
        script: {
          type: 'text',
          subtitles: false,
          provider: { type: 'microsoft', voice_id: 'fr-CA-SylvieNeural' },
          ssml: false,
          input: _data
        },
        config: {
          fluent: true,
          pad_audio: 0,
          driver_expressions: {
            expressions: [{ expression: 'neutral', start_frame: 0, intensity: 0 }],
            transition_frames: 0
          },
          align_driver: true,
          align_expand_factor: 0,
          auto_match: true,
          motion_factor: 0,
          normalization_factor: 0,
          sharpen: true,
          stitch: true,
          result_format: 'mp4'
        },
        'driver_url': 'bank://lively/',
        'config': {
          'stitch': true,
        },
        'session_id': sessionId
      })
    });
  }
}
//};

/*document.addEventListener('keydown', async (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    talkButton.click();
  }
});*/

destroyButton.onclick = async () => {
  await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  stopAllStreams();
  closePC();
};

function onIceGatheringStateChange() {
  //iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  //iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}

function onIceCandidate(event) {
  if (event.candidate) {
    console.log('ice candidate ok');
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    fetch(`${DID_API.url}/talks/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    });
  }
}

function onIceConnectionStateChange() {
  //iceStatusLabel.innerText = peerConnection.iceConnectionState;
  //iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
  }
}

function onConnectionStateChange() {
  //peerStatusLabel.innerText = peerConnection.connectionState;
  //peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
}

function onSignalingStateChange() {
  //signalingStatusLabel.innerText = peerConnection.signalingState;
  //signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
}

function onVideoStatusChange(videoIsPlaying, stream) {
  let status;
  if (videoIsPlaying) {
    status = 'streaming';
    const remoteStream = stream;
    setVideoElement(remoteStream);
  } else {
    status = 'empty';
    playIdleVideo();
  }
  //streamingStatusLabel.innerText = status;
  //streamingStatusLabel.className = 'streamingState-' + status;
}

function onTrack(event) {
  /*
   * The following code is designed to provide information about wether currently there is data
   * that's being streamed - It does so by periodically looking for changes in total stream data size
   *
   * This information in our case is used in order to show idle video while no talk is streaming.
   * To create this idle video use the POST https://api.d-id.com/talks endpoint with a silent audio file or a text script with only ssml breaks 
   * https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#break-tag
   * for seamless results use `config.fluent: true` and provide the same configuration as the streaming video
   */

  if (!event.track) return;

  statsIntervalId = setInterval(async () => {
    const stats = await peerConnection.getStats(event.track);
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;

        if (videoStatusChanged) {
          videoIsPlaying = report.bytesReceived > lastBytesReceived;
          onVideoStatusChange(videoIsPlaying, event.streams[0]);
        }
        lastBytesReceived = report.bytesReceived;
      }
    });
  }, 500);
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('set remote sdp OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('create local sdp OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('set local sdp OK');

  return sessionClientAnswer;
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('stopping peer connection');
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  //iceGatheringStatusLabel.innerText = '';
  //signalingStatusLabel.innerText = '';
  //iceStatusLabel.innerText = '';
  //peerStatusLabel.innerText = '';
  console.log('stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

const maxRetryCount = 3;
const maxDelaySec = 4;
async function fetchWithRetries(url, options, retries = 3) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;

      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}


/*Affichage des questions dans le chat */
const input = document.getElementById('user-input-field');
const chatDiv = document.getElementById('messages');

// Fonction réutilisable pour afficher la question
function sendUserMessage() {
  const questionText = input.value.trim();
  if (questionText === '') return;

  const questionEl = document.createElement('div');
  questionEl.className = 'question';
  questionEl.textContent = ('Utilisateur : ' + questionText);
  chatDiv.appendChild(questionEl);
 
}

// Gestion de la touche "Enter"
input.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    talkButton.click();
  }
});



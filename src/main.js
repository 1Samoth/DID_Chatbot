'use strict';
import DID_API from './keys/did.json' with { type: 'json' };
import { setVideoElement, playIdleVideo, stopAllStreams } from './components/streamManager.js';
import { fetchOpenAIResponse } from './components/api.js';

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

//uncomment this to use do the actual D-iD connection
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

// comment this when using the actual D-iD connection
// playIdleVideo();

talkButton.onclick = async () => {
  console.log(userInput.value);
  if ((peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') && userInput.value.length > 0) {
    const responseFromOpenAI = await fetchOpenAIResponse(userInput.value);
    if(responseFromOpenAI) {
      console.log('OpenAI Response Length:', responseFromOpenAI.length);
      console.log("OpenAI Response:", responseFromOpenAI);
    }
    else {
      console.log('ERREUR OPENAI', responseFromOpenAI);
    }

    userInput.value = '';

    // const talkResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
    //   method: 'POST',
    //   headers: { 
    //     Authorization: `Basic ${DID_API.key}`, 
    //     'Content-Type': 'application/json'
    //  },
    //   body: JSON.stringify({
    //     script: {
    //       type: 'text',
    //       subtitles: 'false',
    //       provider: { type: 'microsoft', voice_id: 'fr-CA-SylvieNeural' },
    //       ssml: false,
    //       input: responseFromOpenAI
    //     },
    //     config: {
    //       fluent: true,
    //       pad_audio: 0,
    //       driver_expressions: {
    //         expressions: [{ expression: 'neutral', start_frame: 0, intensity: 0 }],
    //         transition_frames: 0
    //       },
    //       align_driver: true,
    //       align_expand_factor: 0,
    //       auto_match: true,
    //       motion_factor: 0,
    //       normalization_factor: 0,
    //       sharpen: true,
    //       stitch: true,
    //       result_format: 'mp4'
    //     },
    //     'driver_url': 'bank://lively/',
    //     'config': {
    //       'stitch': true,
    //     },
    //     'session_id': sessionId
    //   })
    // });
  }
};

document.addEventListener('keydown', async (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    talkButton.click();
  }
});

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
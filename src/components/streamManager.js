'use strict';
const talkVideo = document.getElementById('talk-video');

export function setVideoElement(stream) {
    if (!stream) return;
    talkVideo.muted = false;
    talkVideo.srcObject = stream;
    talkVideo.loop = false;
  
    if (talkVideo.paused) {
      talkVideo
        .play()
        .then((_) => {})
        .catch((e) => {});
    }
  }
  
export function playIdleVideo() {
    talkVideo.srcObject = undefined;
    talkVideo.setAttribute('playsinline', '');
    talkVideo.setAttribute('muted', '');
    talkVideo.src = 'img/idle.mp4';
    talkVideo.loop = true;
}

export function stopAllStreams() {
    if (talkVideo.srcObject) {
      console.log('stopping video streams');
      talkVideo.srcObject.getTracks().forEach((track) => track.stop());
      talkVideo.srcObject = null;
    }
}
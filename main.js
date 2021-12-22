import TRTC from "trtc-js-sdk";
import { genTestUserSig } from "./lib/GenerateTestUserSig";

TRTC.Logger.setLogLevel(TRTC.Logger.LogLevel.NONE);

const userIdInput = document.getElementById("userId");
const roomIdInput = document.getElementById("roomId");
const joinButton = document.getElementById("joinButton");
const leaveButton = document.getElementById("leaveButton");

joinButton.addEventListener("click", start);
leaveButton.addEventListener("click", leave);
const streams = [];
let client;
let localStream;

async function start() {
  const userId = userIdInput.value;
  const result = genTestUserSig(userId);
  client = TRTC.createClient({
    mode: "rtc",
    sdkAppId: result.sdkAppId,
    userId,
    userSig: result.userSig,
  });

  client.on("stream-added", async (event) => {
    const remoteStream = event.stream;
    console.log("remote stream added: " + remoteStream.getId());

    await client.subscribe(remoteStream);
  });
  client.on("stream-subscribed", async (event) => {
    const remoteStream = event.stream;
    const streamId = remoteStream.getId();
    streams.push(streamId);
    console.log("remote stream subscribed" + remoteStream.getId());

    const videoBlock = $("<div>", {
      id: streamId,
      class: "video-block",
    }).appendTo("#remoteVideo");

    const controlPanel = $("<div>", {
      id: streamId + "panel",
      class: "control-panel",
    }).appendTo(videoBlock);

    const volumeControl = $("<input>", {
      id: remoteStream.getId() + "-volume-control",
      class: "volume-control",
      type: "range",
      max: "1",
      min: "0",
      step: "0.1",
    }).appendTo(controlPanel);

    const muteRemoteButton = $("<button>camera</button>", {
      id: remoteStream.getId() + "-mute-button",
      class: "mute-button",
    }).appendTo(controlPanel);

    volumeControl.on("change", (event) => {
      remoteStream.setAudioVolume(event.target.value);
    });

    let isCamOn = true;

    muteRemoteButton.on("click", (event) => {
      if (isCamOn) {
        isCamOn = !remoteStream.muteVideo();
      } else {
        isCamOn = remoteStream.unmuteVideo();
      }
    });

    await remoteStream.play(remoteStream.getId());
  });
  client.on("stream-removed", async (event) => {
    const remoteStream = event.stream;

    remoteStream.stop();

    console.log("remote stream removed" + remoteStream.getId());

    var index = streams.indexOf(remoteStream.getId());
    if (index !== -1) {
      streams.splice(index, 1);
    }
    $(`#${remoteStream.getId()}`).remove();
  });

  await client.join({ roomId: Number(roomIdInput.value) });

  localStream = TRTC.createStream({
    userId,
    audio: true,
    video: true,
    mirror: true,
  });

  await localStream.initialize();

  const localStreamId = localStream.getId();
  const videoBlock = $("<div>", {
    id: localStreamId,
    class: "video-block",
  }).appendTo("#remoteVideo");

  const controlPanel = $("<div>", {
    id: localStreamId + "panel",
    class: "control-panel",
  }).appendTo(videoBlock);

  const muteRemoteButton = $("<button>camera</button>", {
    id: localStreamId + "-mute-button",
    class: "mute-button",
  }).appendTo(controlPanel);

  let isLocalCamOn = true;

  muteRemoteButton.on("click", (event) => {
    if (isLocalCamOn) {
      isLocalCamOn = !localStream.muteVideo();
    } else {
      isLocalCamOn = localStream.unmuteVideo();
    }
  });

  await localStream.play(localStream.getId());

  await client.publish(localStream);
  joinButton.disabled = true;
  leaveButton.disabled = false;
}

async function leave() {
  if (client) {
    await client.leave();
    await localStream.close();
    $(`#${localStream.getId()}`).remove();
    client = undefined;
    localStream = undefined;
    joinButton.disabled = false;
    leaveButton.disabled = true;
  }
}

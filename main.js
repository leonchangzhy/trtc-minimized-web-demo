import TRTC from "trtc-js-sdk";
import { genTestUserSig } from "./lib/GenerateTestUserSig";

TRTC.Logger.setLogLevel(TRTC.Logger.LogLevel.NONE);

const userIdInput = $("#userId");
const roomIdInput = $("#roomId");
const joinButton = $("#joinButton");
const leaveButton = $("#leaveButton");

joinButton.on("click", start);
leaveButton.on("click", leave);
userIdInput.on("input", form);
roomIdInput.on("input", form);

const streams = [];
let client;
let isJoined = false;
let localStream;
let userId;
let roomId;

async function start() {
  userId = userIdInput.val();
  roomId = roomIdInput.val();

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

    const remoteCamSwitch = $("<button>camera</button>", {
      id: remoteStream.getId() + "-cam-switch",
      class: "cam-switch",
    }).appendTo(controlPanel);

    volumeControl.on("input", (event) => {
      remoteStream.setAudioVolume(event.target.value);
    });

    let isCamOn = true;

    remoteCamSwitch.on("click", (event) => {
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

  await client.join({ roomId: Number(roomId) });

  const cameras = await TRTC.getCameras();
  const mics = await TRTC.getMicrophones();

  localStream = TRTC.createStream({
    userId,
    audio: mics.length ? true : false,
    video: cameras.length ? true : false,
    mirror: true,
  });

  await localStream.initialize();

  const localStreamId = localStream.getId();
  const videoBlock = $("<div>", {
    id: localStreamId,
    class: "video-block",
  }).appendTo("#localVideo");

  const controlPanel = $("<div>", {
    id: localStreamId + "panel",
    class: "control-panel",
  }).appendTo(videoBlock);

  const localCamSwitch = $("<button>camera</button>", {
    id: localStreamId + "-cam-switch",
    class: "cam-switch",
  }).appendTo(controlPanel);

  const localMicSwitch = $("<button>mute</button>", {
    id: localStreamId + "-mic-switch",
    class: "mic-switch",
  }).appendTo(controlPanel);
  let isLocalCamOn = true;
  let isLocalMicOn = true;

  localCamSwitch.on("click", (event) => {
    if (isLocalCamOn) {
      isLocalCamOn = !localStream.muteVideo();
    } else {
      isLocalCamOn = localStream.unmuteVideo();
    }
  });

  localMicSwitch.on("click", (event) => {
    if (isLocalMicOn) {
      isLocalMicOn = !localStream.muteAudio();
    } else {
      isLocalMicOn = localStream.unmuteAudio();
    }

    localMicSwitch.text(isLocalMicOn ? "mute" : "unmute");
  });

  await localStream.play(localStream.getId());

  await client.publish(localStream);

  isJoined = true;
  joinButton.attr("disabled", true);
  leaveButton.attr("disabled", false);
}

async function leave() {
  if (client) {
    await client.leave();
    await localStream.close();
    $(`#${localStream.getId()}`).remove();
    client = undefined;
    localStream = undefined;
    userId = undefined;
    roomId = undefined;
    userIdInput.val("");
    roomIdInput.val("");
    joinButton.attr("disabled", true);
    leaveButton.attr("disabled", true);
    isJoined = false;
  }
}

function form() {
  if (!isJoined && userIdInput.val() && roomIdInput.val()) {
    joinButton.attr("disabled", false);
  } else {
    joinButton.attr("disabled", true);
  }
}

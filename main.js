import TRTC from "trtc-js-sdk";
import { genTestUserSig } from "./lib/GenerateTestUserSig";
TRTC.Logger.setLogLevel(TRTC.Logger.LogLevel.NONE);

const userIdInput = document.getElementById("userId");
const roomIdInput = document.getElementById("roomId");
const joinButton = document.getElementById("joinButton");
joinButton.addEventListener("click", start);
var streams = [];

async function start() {
  const userId = userIdInput.value;
  const result = genTestUserSig(userId);
  const client = TRTC.createClient({
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
    streams.push(remoteStream.getId());
    console.log("remote stream subscribed" + remoteStream.getId());
    $("#remoteVideo").append();

    jQuery("<div>", {
      id: remoteStream.getId(),
      class: "video-block",
    }).appendTo("#remoteVideo");

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

  const localStream = TRTC.createStream({
    userId,
    audio: true,
    video: true,
    mirror: true,
  });

  await localStream.initialize();
  jQuery("<div>", {
    id: localStream.getId(),
    class: "video-block",
  }).appendTo("#remoteVideo");
  await localStream.play(localStream.getId());

  await client.publish(localStream);
}

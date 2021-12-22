export function genTestUserSig(userID) {
  //Replace with your own SDKAPPID
  const SDKAPPID = 0;
  const EXPIRETIME = 604800;
  //Replace with your own SECRETKEY
  const SECRETKEY = "";

  if (SDKAPPID === "" || SECRETKEY === "") {
    alert(
      "Please set SDKAPPID and SECRETKEY " +
        "\r\n\r\nPlease configure your SDKAPPID/SECRETKEY in lib/GenerateTestUserSig.js"
    );
  }
  const generator = new LibGenerateTestUserSig(SDKAPPID, SECRETKEY, EXPIRETIME);
  const userSig = generator.genTestUserSig(userID);

  return {
    sdkAppId: SDKAPPID,
    userSig: userSig,
  };
}

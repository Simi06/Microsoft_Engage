var firebaseConfig = {
  apiKey: "AIzaSyDkTudmftGqbdJxtegF1JY7WGao0k7-fLY",
  authDomain: "engage-micro.firebaseapp.com",
  databaseURL: "https://engage-micro-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "engage-micro",
  storageBucket: "engage-micro.appspot.com",
  messagingSenderId: "539257421836",
  appId: "1:539257421836:web:51464c3b78114c5666ee29",
  measurementId: "G-YB1TJ998TS"
};
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);

let myVideoStream;
const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
})
//variables for screen sharing
const videoElem = document.getElementById("screen_share");
const startElem = document.getElementById("start");
const stopElem = document.getElementById("stop");
let myUserId = "";
const myVideo = document.createElement('video')
myVideo.muted = true;
const peers = {}

firebase.auth().onAuthStateChanged(firebaseUser => {
if(firebaseUser){
  console.log(firebaseUser)
  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  }).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream)
    myPeer.on('call', call => {
      call.answer(stream)
      const video = document.createElement('video')
      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
      })
    })

    socket.on('user-connected', userId => {
      myUserId = userId;
      connectToNewUser(userId, stream)
    })
    // input value
    // when press enter send message
    $('html').keydown(function (e) {
      if (e.which == 13 && document.getElementById("chat_message").value.length !== 0) {
        var messager = document.getElementById("chat_message").value + "{()}" + (firebaseUser.displayName == '' ? firebaseUser.email : firebaseUser.displayName)
        
        socket.emit('message', messager);
        document.getElementById("chat_message").value = ''
      }
    });
    socket.on("createMessage", message => {
      var sender = message.substring(message.lastIndexOf("{()}")+ 4, message.length)
      var msg = message.substring(0, message.lastIndexOf("{()}"))
      $("ul").append(`<li class="message"><b>${sender}</b><br/>${msg}</li>`);
      scrollToBottom()
    })
  })

  socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
  })

  myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
  })

  function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
      video.remove()
    })

    peers[userId] = call
  }

  function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    videoGrid.append(video)
  }
}
else{
  window.location.href = "/"
}
})
function leaveRoom(){
  firebase.auth().signOut();
}

const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}


const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

var displayMediaOptions = {
  video: {
    cursor: "never"
  },
  audio: false
};

function startScreenShare(){
  document.getElementById('start').style.display = "none";
  document.getElementById('stop').style.display = "initial";
  startCapture();
}

function stopScreenShare(){
  document.getElementById('stop').style.display = "none";
  document.getElementById('start').style.display = "initial";
  stopCapture();
}

async function startCapture() {
  try {
    videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
    navigator.mediaDevices;
    
    dumpOptionsInfo();

  } catch(err) {
    console.error("Error: " + err);
  }
  const call = myPeer.call(myUserId, videoElem.srcObject);
}

function dumpOptionsInfo() {

  document.getElementById('screen_share').style.height = "500px";
  document.getElementById('screen_share').style.width = "700px";
  document.getElementById('screen_share').style.padding = "8px";
  document.getElementById('screen_share').style.objectFit = "cover";
  const videoTrack = videoElem.srcObject.getVideoTracks()[0];
  
}

function stopCapture(evt) {
  let tracks = videoElem.srcObject.getTracks();

  tracks.forEach(track => track.stop());
  videoElem.srcObject = null;
  document.getElementById('screen_share').style.height = "0px";
  document.getElementById('screen_share').style.width = "0px";

}
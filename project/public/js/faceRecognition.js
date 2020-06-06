// Init variables
var video = document.querySelector('video');
var storeFace;
var webcamStream;
var constraints = { audio: false, video: { width: 800, height: 600 } };
// Grab the id from the URL
console.log(window.location.href.split("=")[1]);
// Convert descriptor to float32 format required for face-api
function descriptor32formatter(descriptor) {
  // Convert to Float32 array and put in brackets
  return [new Float32Array(descriptor)]
}
// Start capturing with the video cam
function startCapture() {
    // Use the navigator to grab user media: webcam
    navigator.mediaDevices.getUserMedia(constraints)

    .then(function(mediaStream) {
    var video = document.querySelector('video');
    video.srcObject = mediaStream;
    video.onloadedmetadata = function(e) {
    video.play();
  };
})
.catch(function(err) { console.log(err.name + ": " + err.message); }); // always check for errors at the end.
}
// When the video starts playing
$('#video').on('play', function () {
  // Create canvas from the video
  var canvas = faceapi.createCanvasFromMedia(video);
  // append canvas to the document body
  $('#capture').append(canvas);
  // Create a display size variable with the current video's image and height
  var displaySize = {
    width: video.width,
    height: video.height
  };
  // match the canvas size to the display size of the video
  faceapi.matchDimensions(canvas, displaySize);
  // Set the found face variable to false
  var setFoundFace = false
  // Set an interval for detecting faces
  setInterval(async function () {
    // Detect all faces: using landmarks, expressions and descriptors
    var detections = await faceapi.detectAllFaces(video,
      new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withFaceDescriptors();
    // If there was a detection found and the set found face hasn't been set to true
    if (detections.length = 1 && !setFoundFace) {
      // Store the first set of features in the detections array
      storeFace = detections[0];
      // if storeface is not undefined
      if (storeFace) {
        // Set found face to true
        setFoundFace = true;
        // Tell user that their model has been taken and they are able to retry (set foundFace back to false) or to proceed
        console.log("A model has been generated, Press Send Model when ready to send or capture again");
        console.log(detections)
        // Show button to send model
        $('#sendModelButton').show();
        $(".message-notice").html("<h3>A model has been generated, Press Send Model when ready to send or capture again</h3>");
      }
    }
    // Make boxes properly sized for video
    var resizedDetections = await faceapi.resizeResults(detections, displaySize);
    // Sync up canvas with context and clear detection rectangles
    
    // Get video position and match canvas
    var videoPosition = video.getBoundingClientRect();
    canvas.style.top = videoPosition.y + "px";
    canvas.style.left = videoPosition.x + "px";
    // draw boxes around faces
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    // Draw landmarks on face
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    // Every 1 second
  }, 1000);
});
// When the send model button is pressed
$('#sendModelButton').on('click', function () {
  // Grab stored face and store in separate variable for sending
  var faceToStore = storeFace;
  // Assign below variable from URL parameter to user ID for API post call
  var idOfUser = window.location.href.split("=")[1];
  console.log(idOfUser);
  // Use labeledFaceDescriptors to create 
  var faceObject = new faceapi.LabeledFaceDescriptors(idOfUser, descriptor32formatter(faceToStore.descriptor));
  
  // Make a post request to the server with all the new face descriptors
  $.ajax({
    method: 'POST',
    url: '/api/addNewFace/' + idOfUser,
    data: JSON.stringify(faceObject),
    headers: {
      'Content-Type': 'application/json',
    },
    // Then
  }).then(data => {
    console.log("received:", data);
    setTimeout(function () {
        // TODO Clock user into the system as check in or check out depending on current status
        window.location.replace("/employees/dashboard");
      },
      2000);
  })
});
// Arguments
// 
// Load all faceapinets required for face recognition
Promise.all([
  // tinyfacedetector module
  faceapi.nets.tinyFaceDetector.loadFromUri("/js/faceapi-models"),
  // landmarks module
  faceapi.nets.faceLandmark68Net.loadFromUri("/js/faceapi-models"),
  // Recognition and expression
  faceapi.nets.faceRecognitionNet.loadFromUri("/js/faceapi-models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/js/faceapi-models"),
  // Then start capturing with webcam
]).then(function () {
  // Hide send model button to start with
  $('#sendModelButton').hide();
  // Start webcam capture
  startCapture();
});
// Init variables
var video = document.querySelector('video');
var storeFace;
var webcamStream;
var userFace;
var idOfUser = window.location.href.split("=")[1];
var constraints = { audio: false, video: { width: 800, height: 600 } };


// var popup = require('popups');

// Build facematch library from api data and init using FaceMatcher
function buildFaceMatchLibrary() {
    // Return new promise
    return new Promise(function (resolve, reject) {
        try {
            // Place call to grab face model data
            $.get('/api/getFaceData/' + idOfUser, function (data) {
                console.log('Received Data: ' + data);

                // Build labeled Descriptors and store
                var labeledDescriptors = buildLabeledDescriptors(data);
                // Init facematcher with descriptors
                var faceMatcher = new faceapi.FaceMatcher([labeledDescriptors], 0.6);

                // Resolve promise with facematched data
                resolve(faceMatcher);
            });

            // Catch error 
        } catch (err) {
            // Reject promise with error
            reject(err);
        }
    })
}

// Convert array within stringified database back to array
function revertStringifiedArray(arrayDict) {
    // Init array for append
    var newArray = [];
    // Iterate from 0 till 127 to grab all items
    for (let i = 0; i < 128; i++) {
        // Append item to array
        newArray.push(arrayDict[i])
    }
    // Convert to float 32 array and return
    return new Float32Array(newArray);
}

// Parses JSON data and builds Labeled Descriptors
function buildLabeledDescriptors(data) {
    // Parse data as JSON
    console.log(data);
    userFace = JSON.parse(data);

    // // Build user descriptor as float 32 array
    var userDescriptors = revertStringifiedArray(userFace._descriptors[0])

    // Build labeled descriptors from user descriptors
    var labeledDescriptors =
        new faceapi.LabeledFaceDescriptors(
            userFace._label,
            [userDescriptors]
        )
    // return labeled descriptors
    return labeledDescriptors;
}
// Start capturing with the web cam
function startCapture() {
    // Use the navigator to grab user media: webcam
    navigator.mediaDevices.getUserMedia(constraints)

        .then(function (mediaStream) {
            var video = document.querySelector('video');
            video.srcObject = mediaStream;
            video.onloadedmetadata = function (e) {
                video.play();
            };
        })
        .catch(function (err) { console.log(err.name + ": " + err.message); }); // always check for errors at the end.
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

    // Match dimensions of canvas and display size
    faceapi.matchDimensions(canvas, displaySize);

    var checkCount = 0;

    // Build the face match library then
    buildFaceMatchLibrary().then(function (faceMatcher) {
        // Set an interval for detecting faces
        var intervalID = setInterval(async function () {
            // Start detecting faces with face-api
            var detections = await faceapi.detectAllFaces(video,
                // Use the Tiny Face Detectorto initialize using face landmarks and face expressions
                new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withFaceDescriptors();

            // Make boxes properly sized for video
            var resizedDetections = await faceapi.resizeResults(detections, displaySize);
            // Sync up canvas with context and clear detection rectangles
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            // Get video position and match canvas
            var videoPosition = video.getBoundingClientRect();
            canvas.style.top = videoPosition.y + "px";
            canvas.style.left = videoPosition.x + "px";


            // draw boxes around faces
            faceapi.draw.drawDetections(canvas, resizedDetections);
            // Draw landmarks on face
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            console.log("resizedDetections", resizedDetections);

            // Store in results the matched detections
            var results = resizedDetections.map(function (detects) {
                // Use facematcher to test current detection
                return faceMatcher.matchDescriptor(detects.descriptor);
            });

            // If Results found
            if (results && checkCount < 1) {
                checkCount++
                // Store label and euclidean threshold strings from results
                var labelFound = results.toString().split(" ")[0];
                // Grab Euclidean threshold to check
                var eucThresh = results[0]._distance;
                console.log(eucThresh);

                // If found to match original data to match, grant match
                if (eucThresh < 0.4) {
                    console.log("match found!: " + labelFound);
                    $.ajax({
                        method: 'GET',
                        url: '/api/timesheet',
                        //Then
                    }).then(data => {
                        console.log(data);
                        let send_data = {};

                        function twoDigits(d) {
                            if (0 <= d && d < 10) return "0" + d.toString();
                            if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
                            return d.toString();
                        }
                        let current_date = new Date().getFullYear() + "-" + twoDigits(1 + new Date().getMonth()) + "-" + twoDigits(new Date().getDate());

                        console.log(current_date);
                        let checked = data.filter(function (employee) {
                            return employee.EmployeeId === parseInt(labelFound) && employee.check_in.split('T')[0] === current_date && employee.employeeStatus === 2
                        });

                        if (checked.length > 0) {
                            // alert('Saying already checked in and out for today sorry.')
                            Swal.fire({
                                html: `<p>already checked in and out for today sorry.</p>`,
                                confirmButtonColor: '#3085d6',
                                confirmButtonText: 'OK'
                            }).then((result) => {
                                if (result.value) {
                                    window.location.replace("/employees/dashboard");
                                }
                            })
                        }
                        else {
                            let checked1 = data.filter(function (employee) {
                                return employee.EmployeeId === parseInt(labelFound) && employee.check_in.split('T')[0] === current_date
                            });
                            console.log(checked1);
                            if (checked1.length > 0) send_data = {
                                id: checked1[0].id,
                                employeeID: parseInt(labelFound),
                                employeeStatus: 2,
                                check_in: new Date(),
                                check_out: new Date(),
                                check_create: 0
                            }
                            else send_data = {
                                employeeID: parseInt(labelFound),
                                employeeStatus: 1,
                                check_in: new Date(),
                                check_out: new Date(),
                                check_create: 1
                            }

                            $.ajax({
                                method: 'POST',
                                url: '/api/timesheet',
                                data: send_data,
                                //Then
                            }).then(data => {
                                console.log("received:", data);
                                $('.inner h1').text('Match Found');
                                // Stop facial scanning (stop interval)
                                clearInterval(intervalID);

                                // TODO Modal displaying "You have been checked in. Redirecting..."
                                let days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                                $.ajax({
                                    method: 'GET',
                                    url: '/api/employees/' + labelFound,
                                    //Then
                                }).then(data => {
                                    console.log(data);
                                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                                    Swal.fire({
                                        html: `<p>Bonjour, <b>${data[0].employeeName} !<br></b> Vous avez été scanné avec success! <br>  ${days[new Date().getDay() - 1]} ${new Date().getDate()} ${months[new Date().getMonth()]} ${new Date().getFullYear()}. <br>Merci.</p>`,
                                        confirmButtonColor: '#3085d6',
                                        confirmButtonText: 'OK'
                                    }).then((result) => {
                                        if (result.value) {
                                            window.location.replace("/employees/dashboard");
                                        }
                                    })
                                })
                            })
                        }


                    })

                }
            }

            // Every 1 second
        }, 1000);

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
    startCapture();

});
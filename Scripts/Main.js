var filein = document.getElementById("upload");
var c = document.getElementById("uqr").getContext("2d");
var unicode = document.getElementById("unicode");
var i = document.getElementById("qr");
var cropBox = document.getElementById("crop");
var sel = document.getElementById("sel");
var num = document.getElementById("num");
var ccode = document.getElementById("ccode");
var ol = document.getElementById("overlay");
var usemsg = document.getElementById("usemsg");
var errmsg = document.getElementById("errmsg");

var data = [];
var sdata = "";

filein.value = "";
unicode.textContent = "";
i.src = "";
ccode.textContent = "";
usemsg.style.display = "none";
errmsg.style.display = "none";


function getModuleSize(location, version) {
	var topLeft = location.topLeft;
	var topRight = location.topRight;
	var a = Math.abs(topRight.x - topLeft.x);
	var b = Math.abs(topRight.y - topLeft.y);
	var c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));

	return c / (version * 4 + 17);
}

function markFinderPattern(x, y, moduleSize) {
	c.fillStyle = '#00ff00';

	c.beginPath();
	c.arc(x, y, moduleSize * 1, 0, 2 * Math.PI);
	c.fill();
}

function markQRCodeArea(location, version) {
	c.lineWidth = 3;
	c.strokeStyle = '#00ff00';

	c.beginPath();
	c.moveTo(location.topLeft.x, location.topLeft.y);
	c.lineTo(location.topRight.x, location.topRight.y);
	c.lineTo(location.bottomRight.x, location.bottomRight.y);
	c.lineTo(location.bottomLeft.x, location.bottomLeft.y);
	c.lineTo(location.topLeft.x, location.topLeft.y);
	c.stroke();

	var moduleSize = getModuleSize(location, version);

	markFinderPattern(location.topLeftFinder.x, location.topLeftFinder.y, moduleSize);
	markFinderPattern(location.topRightFinder.x, location.topRightFinder.y, moduleSize);
	markFinderPattern(location.bottomLeftFinder.x, location.bottomLeftFinder.y, moduleSize);
	//markFinderPattern(location.bottomRightAlignment.x, location.bottomRightAlignment.y, moduleSize * 0.5);
}



function regenerateQR() {
	try {
		var b = Array.from(new Uint8Array(data), {
			level: 9
		});
		//console.log(b);

	} catch {
		var b = data;
	}

	var qrcode = new QRCode.Encoder();

	qrcode.setEncodingHint(true);
	qrcode.setErrorCorrectionLevel(QRCode.ErrorCorrectionLevel.H);

	qrcode.write(new QRCode.QRByte("", function (d) {
		return {
			encoding: 26,
			bytes: b
		}
	}));

	qrcode.make();

	i.src = qrcode.toDataURL(4, (4 * 7) / 2);

}

var scanning = false;

var cam = document.getElementById("cam");

function startLiveScan(device) {
	scanning = true;
	errmsg.textContent = "";
	errmsg.style.display = "none";
	if (device == "webcam") {
		document.getElementById("screenbutton").disabled = true;
		document.getElementById("cambutton").onclick = stopLiveScan;
		document.getElementById("cambutton").textContent = "Cancel";
		ol.classList.add("scanning");
		navigator.mediaDevices.getUserMedia({
			video: {
				width: {
					ideal: 960
				},
				height: {
					ideal: 960 //540
				},
				facingMode: "environment"
			},
			audio: false
		}).then(function (stream) {
			cam.srcObject = stream;
			cam.play();
			cam.onloadedmetadata = function () {
				c.canvas.classList.add("flip");
				cam.classList.add("flip");
				cam.width = cam.videoWidth;
				cam.height = cam.videoHeight;
				requestAnimationFrame(cameraLoop);
			};
		}).catch(function (e) {});
	} else if (device == "screen") {
		//c.canvas.style.display = "none";
		document.getElementById("cambutton").disabled = true;
		document.getElementById("screenbutton").onclick = stopLiveScan;
		document.getElementById("screenbutton").textContent = "Cancel";
		ol.classList.add("scanning");
		navigator.mediaDevices.getDisplayMedia({
			video: {
				width: {
					ideal: 960
				},
				height: {
					ideal: 540
				}
			},
			audio: false
		}).then(function (stream) {
			cam.srcObject = stream;
			cam.play();
			cam.onloadedmetadata = function () {
				cam.width = cam.videoWidth;
				cam.height = cam.videoHeight;
				requestAnimationFrame(cameraLoop);
			};
		}).catch(function (e) {});
	}
}

function cameraLoop() {
	try {
		scanQR(cam, cropBox.checked);
	} catch (e) {}

	if (scanning) {
		requestAnimationFrame(cameraLoop);
	}
}

function stopLiveScan() {
	ol.classList.remove("scanning");
	try {
		cam.pause();
		scanning = false;
		document.getElementById("cambutton").disabled = false;
		document.getElementById("cambutton").onclick = function () {
			startLiveScan("webcam");
		};
		document.getElementById("screenbutton").disabled = false;
		document.getElementById("screenbutton").onclick = function () {
			startLiveScan("screen");
		};
		document.getElementById("cambutton").textContent = "Scan webcam";
		document.getElementById("screenbutton").textContent = "Scan screen";
		c.canvas.classList.remove("flip");
		cam.classList.remove("flip");
		cam.srcObject.getTracks().forEach(function (track) {
			track.stop();
		});
		cam.srcObject = null;
	} catch (e) {}
}

stopLiveScan();

function scanQR(img, crop, e) {
	if (crop) {
		c.canvas.width = Math.min(960, img.width);
		c.canvas.height = img.height * (c.canvas.width / img.width);
		c.drawImage(img, (c.canvas.width / 2) - (img.width / 2), (c.canvas.height / 2) - (img.height / 2), img.width, img.height);
		var imageData = c.getImageData(0, 0, c.canvas.width, c.canvas.height);
	} else {
		c.canvas.width = Math.min(960, img.width);
		c.canvas.height = img.height * (c.canvas.width / img.width);
		c.drawImage(img, 0, 0, img.width, img.height, 0, 0, c.canvas.width, c.canvas.height);
		var imageData = c.getImageData(0, 0, c.canvas.width, c.canvas.height);
	}

	var result = new QRCode.Decoder({
		canOverwriteImage: true
	}).decode(imageData.data, imageData.width, imageData.height);

	unicode.textContent = "";
	i.src = "";

	if (result && result.bytes.length > 0) {

		stopLiveScan();

		//console.log(result);

		try {
			markQRCodeArea(result.location, result.version);
		} catch (e) {}

		requestAnimationFrame(function () {

			data = result.bytes;
			sdata = result.data;

			uc();

			requestAnimationFrame(regenerateQR);

			cam.style.backgroundImage = "url(" + c.canvas.toDataURL() + ")";

		});

	}
}











var range = function (min, x, max) {
    return Math.max(Math.min(x | 0, max), min) | 0;
};



var uc = function () {
	unicode.innerHTML = getCode(sdata);
};


var current = TOTP.getCurrentCounter(30);
function getCode(dta) {
	try {
	//var odta = dta;
	dta = dta.split("/");
	dta = dta[dta.length - 1];

	dta = dta.split("?");
	var accountOrg = dta[0].split(":");
	dta = dta[1];
	var accountUN = accountOrg[1];
	accountOrg = accountOrg[0];

	var secret = dta.split("&");
	var issuer = secret[1].split("=")[1];
	secret = secret[0].split("=")[1];
	//var osecret = secret;

	/*console.log(accountOrg);
	console.log(accountUN);
	console.log(secret);
	console.log(issuer);*/


	var length = range(6, +num.value, 8);
	if (sel.value === "1") {
		try {
			secret = Convert.base32toHex(secret);
		} catch (e) {
			alert("Invalid Base32 characters");
			return;
		}
	}

	TOTP.otp(secret, current, length, function (c) {
		if (ccode.textContent != c) ccode.textContent = c;
		usemsg.style.display = "inherit";
		if (ouct == null) codeChange();
	});

	} catch (e) {
		ccode.textContent = "";
		usemsg.style.display = "none";
		errmsg.textContent = "Error parsing authentication data.";
		errmsg.style.display = "block";
		console.error(e);
	}


	//return odta + "\n\nAccount Organization: " + accountOrg + "\nUsername: " + accountUN + "\nSecret: " + osecret + "\nIssuer: " + issuer;
	return issuer + " wants to authorize <br />" + accountUN + " from " + accountOrg
}


var ouc = TOTP.getCurrentCounter(30);
var ouct = null;
function codeChange() {
	current = TOTP.getCurrentCounter(30);
	if (current == ouc && ouct != null) {
		console.log("APPROACHING");
		requestAnimationFrame(codeChange);
	} else {
		uc();
		var dt = Math.floor(((current + 1) * 30) - (Date.now() / 1000))
		ouc = current;
		console.log("Delaying " + dt + "s");
		window.clearTimeout(ouct);
		ouct = setTimeout(codeChange, dt * 1000);
	}
}

/*setInterval(function () {
	console.log(30 - ((Date.now() / 1000) - (TOTP.getCurrentCounter(30) * 30)));
}, 250);*/




filein.addEventListener("change", function (f) {
	var file = f.target.files[0];

	if (file) {
		var reader = new FileReader();

		reader.onload = function (e) {
			var img = new Image();

			img.crossOrigin = 'anonymous';

			img.onload = function () {
				scanQR(img, false, e);
			};


			img.src = e.target.result;
		};

		reader.readAsDataURL(file);

	}
});

sel.addEventListener("change", uc);
num.addEventListener("input", uc);

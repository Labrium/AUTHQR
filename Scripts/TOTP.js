"use strict";

//TOTP implementation
var TOTP = {
	//Calculates the TOTP counter for a given point in time
	//time(number):      Time value (in seconds) to use. Usually the current time (Date.now()/1000)
	//interval(number):  Interval in seconds at which the key changes (usually 30).
	getOtpCounter: function (time, interval) {
		return (time / interval) | 0;
	},

	//Calculates the current counter for TOTP
	//interval(number): Interval in seconds at which the key changes (usually 30).
	getCurrentCounter: function (interval) {
		return TOTP.getOtpCounter(Date.now() / 1000 | 0, interval);
	},

	//Calculates a HOTP value
	//keyHex(string):      Secret key as hex string
	//counterInt(number):  Counter for the OTP. Use TOTP.getOtpCounter() to use this as TOTP instead of HOTP
	//size(number):        Number of digits (usually 6)
	//cb(function):        Callback(string)
	otp: function (keyHex, counterInt, size, cb) {
		var isInt = function (x) {
			return x === x | 0;
		};
		if (typeof(keyHex) !== typeof("")) {
			throw new Error("Invalid hex key");
		}
		if (typeof(counterInt) !== typeof(0) || !isInt(counterInt)) {
			throw new Error("Invalid counter value");
		}
		if (typeof(size) !== typeof(0) || (size < 6 || size > 10 || !isInt(size))) {
			throw new Error("Invalid size value (default is 6)");
		}

		//Calculate hmac from key and counter
		TOTP.hmac(keyHex, "00000000" + Convert.int32toHex(counterInt), function (mac) {
			//The last 4 bits determine the offset of the counter
			var offset = parseInt(mac.substr(-1), 16);
			//Extract counter as a 32 bit number anddiscard possible sign bit
			var code = parseInt(mac.substr(offset * 2, 8), 16) & 0x7FFFFFFF;
			//Trim and pad as needed
			(cb || console.log)(("0000000000" + (code % Math.pow(10, size))).substr(-size));
		});
	},
	//Calculates a SHA-1 hmac
	//keyHex(string):   Key for hmac as hex string
	//valueHex(string): Value to hash as hex string
	//cb(function):     Callback(string)
	hmac: function (keyHex, valueHex, cb) {
		var algo = {
			name: "HMAC",
			//SHA-1 is the standard for TOTP and HOTP
			hash: "SHA-1"
		};
		var modes = ["sign", "verify"];
		var key = Uint8Array.from(Convert.hexToArray(keyHex));
		var value = Uint8Array.from(Convert.hexToArray(valueHex));
		crypto.subtle.importKey("raw", key, algo, false, modes).then(function (cryptoKey) {
			//console.debug("Key imported", keyHex);
			crypto.subtle.sign(algo, cryptoKey, value).then(function (v) {
				//console.debug("HMAC calculated", value, Convert.arrayToHex(v));
				(cb || console.log)(Convert.arrayToHex(v));
			});
		});
	},
	//Checks if this browser is compatible with the TOTP implementation
	isCompatible: function () {
		var f = function (x) {
			return typeof(x) === typeof(f);
		};
		if (typeof(crypto) === typeof(TOTP) && typeof(Uint8Array) === typeof(f)) {
			return !!(crypto.subtle && f(crypto.subtle.importKey) && f(crypto.subtle.sign) && f(crypto.subtle.digest));
		}
		return false;
	}
}
//Make sure the conversion script is loaded first
if (typeof(Convert) !== typeof(TOTP)) {
	TOTP = null;
	alert("Data conversion module not loaded");
	throw new Error("Data conversion module not loaded");
}

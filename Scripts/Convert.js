"use strict";

var Convert = Convert || {};

//Converts a base32 string into a hex string. The padding is optional
Convert.base32toHex = function (data) {
	//Basic argument validation
	if (typeof(data) !== typeof("")) {
		throw new Error("Argument to base32toHex() is not a string");
	}
	if (data.length === 0) {
		throw new Error("Argument to base32toHex() is empty");
	}
	if (!data.match(/^[A-Z2-7]+=*$/i)) {
		throw new Error("Argument to base32toHex() contains invalid characters");
	}

	//Return value
	var ret = "";
	//Maps base 32 characters to their value (the value is the array index)
	var map = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".split('');
	//Split data into groups of 8
	var segments = (data.toUpperCase() + "========").match(/.{1,8}/g);
	//Adding the "=" in the line above creates an unnecessary entry
	segments.pop();
	//Calculate padding length
	var strip = segments[segments.length - 1].match(/=*$/)[0].length;
	//Too many '=' at the end. Usually a padding error due to an incomplete base32 string
	if (strip > 6) {
		throw new Error("Invalid base32 data (too much padding)");
	}
	//Process base32 in sections of 8 characters
	for (var i = 0; i < segments.length; i++) {
		//Start with empty buffer each time
		var buffer = 0;
		var chars = segments[i].split("");
		//Process characters individually
		for (var j = 0; j < chars.length; j++) {
			//This is the same as a left shift by 32 characters but without the 32 bit JS int limitation
			buffer *= map.length;
			//Map character to real value
			var index = map.indexOf(chars[j]);
			//Fix padding by ignoring it for now
			if (chars[j] === '=') {
				index = 0;
			}
			//Add real value
			buffer += index;
		}
		//Pad hex string to 10 characters (5 bytes)
		var hex = ("0000000000" + buffer.toString(16)).substr(-10);
		ret += hex;
	}
	//Remove bytes according to the padding
	switch (strip) {
	case 6:
		return ret.substr(0, ret.length - 8);
	case 4:
		return ret.substr(0, ret.length - 6);
	case 3:
		return ret.substr(0, ret.length - 4);
	case 1:
		return ret.substr(0, ret.length - 2);
	default:
		return ret;
	}
};
//Converts a hex string into an array with numerical values
Convert.hexToArray = function (hex) {
	return hex.match(/[\dA-Fa-f]{2}/g).map(function (v) {
		return parseInt(v, 16);
	});
};

//Converts an array with bytes into a hex string
Convert.arrayToHex = function (array) {
	var hex = "";

	if (array instanceof ArrayBuffer) {
		return Convert.arrayToHex(new Uint8Array(array));
	}
	for (var i = 0; i < array.length; i++) {
		hex += ("0" + array[i].toString(16)).substr(-2);
	}
	return hex;
};

//Converts an unsigned 32 bit integer into a hexadecimal string. Padding is added as needed
Convert.int32toHex = function (i) {
	return ("00000000" + Math.floor(Math.abs(i)).toString(16)).substr(-8);
};
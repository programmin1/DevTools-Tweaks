
console = Components.utils.import("resource://gre/modules/devtools/Console.jsm").console;

window.onload = function() {
	var htm = document.getElementById('htm');
	if (window.arguments[0]) {
		htm.value = ''+window.arguments[0].src;
		window.arguments[0].src = undefined // don't overwrite on cancel close.
		document.title = window.arguments[0].title;
	}
}
function save() {
	var htm = document.getElementById('htm');
	window.arguments[0].src = htm.value;
	window.close();
}

function wwchange(e) {
	console.log(e.target);
	document.getElementById('htm').wrap = e.target.checked ? 'on' : 'off'
}

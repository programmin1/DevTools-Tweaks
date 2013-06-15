/**
 * Firefox DevTools Tweak addon - extends Firefox DevTool.
 * by Luke Bryan
 * Released under MPL
 */
 /*
var debug_tweak = debug_tweak || {};
debug_tweak.setup = function() {
	var code = window.getElementById('editor');
	//Todo: add mouseover functionality? highlight selection capability?
	if (code) {
		code = code.children[0];//iframe
		code.addEventListener('load',function() {
			//alert('load!');
		},true);
	}
}

debug_tweak.setup();*/
var dt = dt || {};

dt.click = function(el) {
	var evt = document.createEvent("MouseEvents");
	evt.initMouseEvent("click", true, true, window,
	  0, 0, 0, 0, 0, false, false, false, false, 0, null);
	el.dispatchEvent(evt);
}

dt.getCheck = function(el) {
	return (el.children[0].nodeName=='checkbox') ? el.children[0] : el.children[0].children[0];
}

dt.breakpointToggle = function() {
	var breakpoints = document.getElementsByClassName('dbg-breakpoint');
	var hasBreak = false;
	for (let i=0; i<breakpoints.length; i++) {
		var check = dt.getCheck(breakpoints[i]);
		if (check.getAttribute('checked')=='true') {
			hasBreak = true; break;
		}
	}
	if (hasBreak) {
		for (let i=0; i<breakpoints.length; i++) {
			var check = dt.getCheck(breakpoints[i]);
			if (check.getAttribute('checked')=='true') {
				dt.click(check);
				check.setAttribute('data-waschecked','true');
			}
		}
	} else {
		for (let i=0; i<breakpoints.length; i++) {
			var check = dt.getCheck(breakpoints[i]);
			if (check.getAttribute('data-waschecked')=='true') {
				dt.click(check);
				check.removeAttribute('data-waschecked');
			}
			//check.setAttribute('checked','true');
		}
	}
	
	//TODO use functionality from https://hg.mozilla.org/mozilla-central/file/34a9d08a82c4/browser/devtools/debugger/debugger-panes.js
	//to do something with window.DebuggerView.WatchExpressions.getItemForElement
	// and add ability to highlight the watched elements from the watch panel.
};
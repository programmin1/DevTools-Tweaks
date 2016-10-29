/**
 * Firefox DevTools Tweak addon - extends Firefox DevTool.
 * by Luke Bryan
 * Portions based on Firefox DevTools code.
 * Released under MPL
 */

//There is no right click menu to extend in Firefox 22+ (well, in 27 there is only select-all, copy), these are workarounds:
var dt = dt || {};

//Context menu events:
dt.setA = function() {
	if (!inspector.selection.isNode()) return;
	
	window.top._InspectedA = inspector.selection.node;
}
dt.setB = function() {
	if (!inspector.selection.isNode()) return;
	if (!window.top._InspectedA) {
		alert("Please choose element A first.");
		return;
	}
	
	dt.cmpB = inspector.selection.node;
	window.openDialog("chrome://devtooltweaks/content/compareNodes.xul",
		"devtoolTweakCmp", "chrome,centerscreen,resizable", /*args:*/
			{A:window.top._InspectedA, B:dt.cmpB});
}

dt.copySelection = function(e) {
	var doc = document.popupNode.ownerDocument.defaultView;
	var sel = doc.getSelection(); 
	const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                                   .getService(Components.interfaces.nsIClipboardHelper);
	gClipboardHelper.copyString(""+sel);
}
dt.getStylesheetOrUrl = function() {
	var clicked = document.popupNode;
	if (clicked.className && clicked.nodeName ==='a' && clicked.parentNode.classList.contains('ruleview-propertyvalue'))
		clicked = clicked.parentNode;
	if (clicked.className && clicked.classList.contains('ruleview-propertyvalue')) {
		//See if this has a css url():
		var prop = clicked.textContent;
		if (prop.contains('url(')) {
			var relUrl = prop.substr(prop.indexOf('url(')+4);
			let qstart = relUrl.substr(0,1);
			if (qstart=='"' || qstart=="'") {
				relUrl = relUrl.substr(1);
				relUrl = relUrl.substr(0,relUrl.indexOf(qstart));
			} else {
				relUrl = relUrl.substr(0,relUrl.indexOf(')'));
			}
			console.log('clicked url('+relUrl+')\n');
		}
	}
	var container = clicked;
	for (let i=0; i<20; i++) {
		container = container.parentNode;
		if (container.className) {
			if (/*container.className.contains('ruleview-rule') && */container.parentNode.parentNode==container.ownerDocument.documentElement) {
				break;//This is what we want.
			} else if (container.classList.contains('ruleview-rule-inheritance')) {
				return;//Just a header, exit.
			}
		}
	}
	var refs = container.ownerDocument.getElementsByClassName('ruleview-rule-source');
	//look for RuleViewTool.view._elementStyle
	var frame = document.getElementsByClassName('iframe-ruleview')[0].contentWindow;
	var rules = frame.ruleview.view._elementStyle.rules;
	var ruleDivs = container.parentNode;//our ruleview-rule's container may have non ruleview-rule siblings.
	var nthRule = 0;
	for (let i=0; i<ruleDivs.children.length; i++) {
		if (ruleDivs.children[i] == container) {
			//This is the one.
			if (rules[nthRule].sheet) {
				var SSurl = rules[nthRule].sheet.href;
			} else {//no stylesheet, just current (selection's) page.
				var SSurl = frame.ruleview.inspector.selection.window.location.href;
			}
			console.log(SSurl);
			//Seems SSurl can be null Fx29, when clicking http://someimage image link.
			//console.log('stylesheet url:'+SSurl);
			if (relUrl && SSurl) {
				//see https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIURI
				var ioService = Components.classes["@mozilla.org/network/io-service;1"]
					.getService(Components.interfaces.nsIIOService);
				var baseURI = ioService.newURI(SSurl, null, null);
				var cssValueURI = ioService.newURI(relUrl, null, baseURI);
				//frame.ruleview.inspector.selection.window.open(cssValueURI.spec);
				return cssValueURI.spec;
			} else if (SSurl) {
				return SSurl;
			} else if (relUrl) { //Should be http://url already?
				return relUrl;
			}
		} else if (ruleDivs.children[i].classList.contains('ruleview-rule')) {
			//only want 0-based nth rule, not headings.
			nthRule++;
		}
	}
};

dt.urlCopy = function(e) {
	var url = dt.getStylesheetOrUrl();
	const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                                   .getService(Components.interfaces.nsIClipboardHelper);
	gClipboardHelper.copyString(url);
}
dt.urlOpen = function(e) {
	var frame = document.getElementsByClassName('iframe-ruleview')[0].contentWindow;
	var url = dt.getStylesheetOrUrl();
	frame.ruleview.inspector.selection.window.open(url);
};
dt.newRule = function(e) {/*
	var selector = prompt('What selector do you want?\n For example: "#someIDelement .classinside"');
	if (selector) {
		var frame = document.getElementsByClassName('iframe-ruleview')[0].contentWindow;
		var doc = frame.ruleview.inspector.selection.window.document;
		var rule = doc.createElement('style');
		rule.appendChild(doc.createTextNode(selector+'{}'));
		doc.body.appendChild(rule);
		// Refresh:
		//window.ruleview.inspector.markDirty();//leave page warning
		frame.ruleview.view.nodeChanged(); // update right panel
		var ruleDivs = frame.document.getElementsByClassName('ruleview')[0];
		for (let i=0; i<ruleDivs.children.length; i++) {
			let item = ruleDivs.children[i];
			if (item.childNodes[0].textContent.contains('inline')) {
				let sel = item.childNodes[1].childNodes[0].textContent;
				if (sel.startsWith(selector.trim()+' {')) {
					item.style.background = '#BBF';
					//TODO: scroll to
					return;//Done, new one should be first one.
				}
			}
		}
	}*/
}
// window.inspector is documented in inspector-panel.js
// .doc and window is inspector.xul window.
if (typeof WebConsoleFrame === 'undefined') {
	//console = Components.utils.import("resource://gre/modules/devtools/Console.jsm").console;
	
	//For global nodeA, nodeB variables shared with all windows:
	Components.utils.import("chrome://devtooltweaks/content/modules/commonNodes.jsm");
	
	var {devtools} = Components.utils.import("resource://gre/modules/devtools/Loader.jsm", {});
	
	const Menu = devtools.require("devtools/client/framework/menu");
	const MenuItem = devtools.require("devtools/client/framework/menu-item");
	var {InspectorPanel} = devtools.require("devtools/client/inspector/inspector-panel");//.js
	
	if (!InspectorPanel.prototype.devToolsTweaksChanged) {
		//Run this once for each inspector object, otherwise opening F12 again would double these menus etc.
		InspectorPanel.prototype.devToolsTweaksChanged = true;
	
		//This is attaching to, "duck punching" devtools/client/inspector/inspector-panel.js.
		origOpen = InspectorPanel.prototype._openMenu;
		InspectorPanel.prototype._openMenu = function( obj ) {
			var inspector = this;
			let menu = origOpen.apply(this, arguments);
			menu.append(new MenuItem({
			  type: "separator",
			}));
			menu.append(new MenuItem({
				label: "Set Node A",
				accesskey: "A",
				click: function() {
					if (!inspector.selection.isNode()) return;
					nodeA = inspector.selection.node;
				}
			}));
			menu.append(new MenuItem({
				label: "Set Node B and Compare",
				accesskey: "B",
				click: function() {
					if (!inspector.selection.isNode()) return;
					if (!nodeA) {
						alert("Please choose element A first.");
						return;
					}

					nodeB = inspector.selection.node;
					window.openDialog("chrome://devtooltweaks/content/compareNodes.xul",
						"devtoolTweakCmp", "chrome,centerscreen,resizable", /*args:*/
							{A:nodeA, B:nodeB});
				}
			}));
			menu.popup( obj.screenX, obj.screenY, this._toolbox );
			return menu;
		};
	}
	
}

window.addEventListener('pageshow',function(evt) {
	// Uncomment to see a lot of html documents loading:
	// Unfortunately you can't simply use evt.target.parentNode to get the document target's
	// XUL wrapper.
	/*
	console.log(evt.target);
	
	if (evt.target.baseURI.endsWith('markup.xhtml')) { //css right panel has loaded:
		let doc = evt.target
		,   win = doc.defaultView;
		doc.addEventListener( 'load', function() {
			
		});
	}*/
	if (evt.target.baseURI.endsWith('cssruleview.xhtml')) { //css right panel has loaded:
		/*var frame = document.getElementsByClassName('iframe-ruleview')[0];
		//console.log('Ruleview found');
		//console.log(evt);
		//Not the old xul, it's a html we have to extend from here (Firefox 22+)
		frame.setAttribute('context',"dtCSSContext");//For right click overlay
		frame.addEventListener('contextmenu',function(e) {//Hide n/a elements:
			let disp = e.target.tagName==='input' ? 'none' : ''; //Show if not text input:
			//document.getElementById('dtCSSCOPYURL').style.display = disp;
			//document.getElementById('dtCSSOPENURL').style.display = disp;
			//console.log(e.target);
			if (disp) { //Just let normal menu show for text input:
				e.preventDefault();
			}
		}, true);*/
	}
	function styleit() {//Optional style for inspector - not really needed in newr Fx29.
		/*let frame = document.getElementById('markup-box').children[0]
		,	doc = frame.contentDocument
		,	style= doc.createElement('style');
		
		style.appendChild(doc.createTextNode(
		'html.theme-light .theme-selected { border:1px solid blue; padding:1px; margin-left:-2px; border-radius:3px;}'+
		'html.theme-light .highlighter.theme-selected {padding:0;margin-top:-1px;} li.child{margin-top:2px; margin-bottom:2px;}'+
		'html.theme-light .theme-twisty:not([open]) {top:5px; left:5px;}'
		));
		//  ^ .highlighter.theme-selected is for Fx26, adjusting full-line spacing and selection border.
		doc.body.appendChild(style);//what's the equivalent for old xul file?
		*/
	}
	/*setTimeout(function(){//Why is setTimeout required? see https://bugzilla.mozilla.org/show_bug.cgi?id=994468
		if (window.document === evt.target) {//Main (toplevel) frame loaded.
			//window.inspector.on("markuploaded", styleit); Don't style this
			//console.log('markuploaded set');
		}
	},10);*/
	/*if (frame) {
		frame.addEventListener('load',styleit);
	}*/
	//frame.contentWindow.addEventListener('load',styleit);
});

(function(){
	var addonprefs = Components.classes["@mozilla.org/preferences-service;1"]
         .getService(Components.interfaces.nsIPrefService)
         .getBranch("extensions.devtoolstweaks.");
    /*
	Components.utils.import("resource://gre/modules/devtools/LayoutHelpers.jsm");
	if (typeof LayoutHelpers.prototype.reallyscrollIntoViewIfNeeded === 'function') {
		//console.log('already set our own function');
	} else {
		LayoutHelpers.prototype.reallyscrollIntoViewIfNeeded =
		LayoutHelpers.prototype.scrollIntoViewIfNeeded;
		
		LayoutHelpers.prototype.scrollIntoViewIfNeeded = function() {
			if (addonprefs.getBoolPref("allowScrollInspect")) {
				LayoutHelpers.prototype.reallyscrollIntoViewIfNeeded.apply(this, arguments);
			}
		}
	}
	*/
}) ()

/**
 * Firefox DevTools Tweak addon - extends Firefox DevTool.
 * by Luke Bryan
 * Portions based on Firefox DevTools code.
 * Released under MPL
 */

//There is no right click menu to extend in Firefox 22+, these are workarounds:
var dt = dt || {};
dt.editHtml = function() {
	inspector.tweak_editHtml = function() {
		// Running in the same context as the inspector.* elements in InspectorPanel.jsm,
		// similar to copyInner.
		if (!this.selection.isNode()) {
			return;
		}
		if (this.selection.node) {
			var atts = this.selection.node.attributes;
			var title = "Edit: <"+this.selection.node.nodeName.toLowerCase();
			for (let i=0; i<atts.length; i++) {
				title += ' '+atts[i].name+'="'+atts[i].value+'"';
			}
			title += '>';
			
			var toCopy = {src:''+this.selection.node.innerHTML, title:title};
			window.openDialog("chrome://devtooltweaks/content/editDialog.xul",
			"devtoolTweakEdit", "chrome,centerscreen,modal,resizable", /*args:*/
			toCopy);
			if (typeof toCopy.src=='string') {
				this.selection.node.innerHTML = toCopy.src;
				this.markDirty();
			}
		}
		//like webconsole.js,      this.webConsoleClient.evaluateJS(aExecuteString, onResult);
	};
	/*var term = new JSTerm({
		hudId:null,
		createMessageNode:function() {
			return {_outputAfterNode: null};
		},
		outputMessage:function(aCategory, node) {
			return null;
		}
	});
	term.execute('$0.style.display="none"',function() {});*/
	inspector.tweak_editHtml();
}
//Context menu events:
dt.setA = function() {
	if (!inspector.selection.isNode()) return;
	
	dt.cmpA = inspector.selection.node.cloneNode(true);
}
dt.setB = function() {
	if (!inspector.selection.isNode()) return;
	if (!dt.cmpA) {
		alert("Please choose element A first.");
		return;
	}
	
	dt.cmpB = inspector.selection.node;
	window.openDialog("chrome://devtooltweaks/content/compareNodes.xul",
		"devtoolTweakCmp", "chrome,centerscreen,resizable", /*args:*/
			{A:dt.cmpA, B:dt.cmpB});
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
			dump('clicked url('+relUrl+')\n');
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
			dump('stylesheet url:'+SSurl);
			if (relUrl) {
				//see https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIURI
				var ioService = Components.classes["@mozilla.org/network/io-service;1"]
					.getService(Components.interfaces.nsIIOService);
				var baseURI = ioService.newURI(SSurl, null, null);
				var cssValueURI = ioService.newURI(relUrl, null, baseURI);
				//frame.ruleview.inspector.selection.window.open(cssValueURI.spec);
				return cssValueURI.spec;
			} else {
				return SSurl;
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
dt.newRule = function(e) {
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
	}
}
// window.inspector is documented in inspector-panel.js
// .doc and window is inspector.xul window.
window.addEventListener('load',function() {
	var frame = document.getElementsByClassName('iframe-ruleview')[0];
	if (!frame.contentWindow.location.href.contains('cssruleview.xul')) {
		//Not the xul, it's a html we have to extend from here (Firefox 22+)
		frame.setAttribute('context',"dtCSSContext");
	}
	function styleit() {
		var frame = document.getElementById('markup-box').children[0];
		var doc = frame.contentDocument;
		var style= doc.createElement('style');
		style.appendChild(doc.createTextNode(
		'.theme-selected { border:1px solid blue; padding:1px; margin-left:-2px; border-radius:3px;}'+
		'.theme-twisty:not([open]) {top:5px; left:5px;}'
		));
		doc.body.appendChild(style);//what's the equivalent for old xul file?
	}
	styleit();
	window.inspector.on("markuploaded", styleit);
	frame.addEventListener('load',styleit);
	//frame.contentWindow.addEventListener('load',styleit);
});

dt.changeInlineEdit = function(e) {
	dump(e.target.getAttribute('class'));
	if (e.target.classList.contains('ruleview-propertyvalue')) {
		window.setTimeout(function() {
			//Should be converted to inplaceEditor now.
			dump('click');
			var ed = e.target.inplaceEditor;
		},1);
	}
	
	//if (e.target.nodeName=='input' && e.target.inplaceEditor) {
	//	var ed = e.target.inplaceEditor;
	//}
}
//Catch click or enter on the rule edit span:
window.addEventListener('keypress',dt.changeInlineEdit);
window.addEventListener('mouseup', dt.changeInlineEdit);
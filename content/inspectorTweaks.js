/**
 * Firefox DevTools Tweak addon - extends Firefox DevTool.
 * by Luke Bryan
 * Portions based on Firefox DevTools code.
 * Released under MPL
 */

//There is no right click menu to extend in Firefox 22+ (well, in 27 there is only select-all, copy), these are workarounds:
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
	
	dt.cmpA = inspector.selection.node;
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
window.addEventListener('pageshow',function(evt) {
	// Uncomment to see a lot of html documents loading:
	// Unfortunately you can't simply use evt.target.parentNode to get the document target's
	// XUL wrapper.
	
	//console.log(evt.target);
	
	if (evt.target.baseURI.endsWith('cssruleview.xhtml')) { //css right panel has loaded:
		var frame = document.getElementsByClassName('iframe-ruleview')[0];
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
		}, true);
	}
	function styleit() {
		let frame = document.getElementById('markup-box').children[0]
		,	doc = frame.contentDocument
		,	style= doc.createElement('style');
		
		style.appendChild(doc.createTextNode(
		'.theme-selected { border:1px solid blue; padding:1px; margin-left:-2px; border-radius:3px;}'+
		'.highlighter.theme-selected {padding:0;margin-top:-1px;} li.child{margin-top:2px; margin-bottom:2px;}'+
		'.theme-twisty:not([open]) {top:5px; left:5px;}'
		));
		//  ^ .highlighter.theme-selected is for Fx26, adjusting full-line spacing and selection border.
		doc.body.appendChild(style);//what's the equivalent for old xul file?
		
		/*where is ruleview InplaceEditor?
		InplaceEditor.prototype._orig_createInput = InplaceEditor.prototype._createInput;
		InplaceEditor.prototype._createInput = function() {
			InplaceEditor.prototype._orig_createInput.call(this);//original in this context.
			//After creating:
			this.input.addEventListener('click',function() {
				console.log('inplace');
				console.log(this.input);
			})
		}*/
	}
	//styleit();
	if (window.document === evt.target) {//Main (toplevel) frame loaded.
		window.inspector.on("markuploaded", styleit);
		//console.log('markuploaded set');
	}
	/*if (frame) {
		frame.addEventListener('load',styleit);
	}*/
	//frame.contentWindow.addEventListener('load',styleit);
});

dt.lastclick = 0;//for dbl click detection
dt.changeInlineEdit = function(e) {
	if (+new Date() - dt.lastclick > 1000) { //Click, not dbl-click:
		dt.lastclick = +new Date();
		return;
	}
	
	function insertAfter(referenceNode, newNode) {
		referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
	}
	//console.log(sel);
	if (e.target.nodeName=='input' && e.target.classList.contains('styleinspector-propertyeditor')) {
		var sel = e.target.value.substring(e.target.selectionStart, e.target.selectionEnd);
		var b4  = e.target.value.substring(e.target.selectionStart-1,e.target.selectionStart);
		if ((sel.match(/^[0-9a-f]{3,6}$/i) && b4=='#') || sel=='rgb' || sel=='rgba') {//Selected a color
			var doc = e.target.ownerDocument
			  , ed = e.target.inplaceEditor
			  , overlay = doc.createElement('div')
			  , container = doc.createElement('div')
			  , slider = doc.createElement('div')
			  , picker = doc.createElement('div')
			overlay.setAttribute('class','over');
			container.setAttribute('class','cp-default');//matching colorpicker.css
			slider.setAttribute('class','slide');
			picker.setAttribute('class','picker');
			insertAfter(e.target, container);
			container.appendChild(slider)
			container.appendChild(picker)
			var doc=picker.ownerDocument;
			var style= doc.createElement('link');
			style.setAttribute('href','chrome://devtooltweaks/content/lib/colorpicker.css');
			style.setAttribute('rel','stylesheet');
			doc.documentElement.appendChild(style);
			doc.documentElement.appendChild(overlay);
			
			ed._fx_clear = ed._clear;
			ed._clear = function() {//Don't clear yet...
			}
			ColorPicker( slider, picker, function(hex, hsv, rgb) {
				e.target.value = hex; //TODO don't replace everything.
				let evt = document.createEvent ("Event");
				evt.initEvent ("input", true, false);
				e.target.dispatchEvent(evt);//trigger inplaceeditor update
			})
			overlay.addEventListener('click',function() {
				ed._clear = ed._fx_clear;//make clearable, cleanup:
				overlay.parentNode.removeChild(overlay);
				container.parentNode.removeChild(container);
				e.target.focus();
			})
			
			return false;
			/*window.setTimeout(function() {
				//Should be converted to inplaceEditor now.
				//See https://hg.mozilla.org/integration/fx-team/file/672608b227c3/browser/devtools/shared/InplaceEditor.jsm
				console.log('inlineedit');
				var ed = e.target.inplaceEditor;
				var fxCreate = ed._createInput;
				console.log(ed)
				ed._createInput = function() {
					
					fxCreate.call(this);
					//After creating:
					this.input.addEventListener('click',function() {
						console.log('inplace');
					})
				}
			},10);*/
		}
	}
	
	//if (e.target.nodeName=='input' && e.target.inplaceEditor) {
	//	var ed = e.target.inplaceEditor;
	//}
}
//Catch click or enter on the rule edit span:
//window.addEventListener('keypress',dt.changeInlineEdit);
//dblclick not caught anymore, maybe something catches it before us? Mosueup works:
window.addEventListener('mouseup', dt.changeInlineEdit);

(function(){
	var addonprefs = Components.classes["@mozilla.org/preferences-service;1"]
         .getService(Components.interfaces.nsIPrefService)
         .getBranch("extensions.devtoolstweaks.");
         
	Components.utils.import("resource://gre/modules/devtools/LayoutHelpers.jsm");
	if (typeof LayoutHelpers.prototype.reallyscrollIntoViewIfNeeded === 'function') {
		//console.log('already set our own function');
	} else {
		LayoutHelpers.prototype.reallyscrollIntoViewIfNeeded =
		LayoutHelpers.prototype.scrollIntoViewIfNeeded
		
		//console.log("setting function");
		LayoutHelpers.prototype.scrollIntoViewIfNeeded = function() {
			if (addonprefs.getBoolPref("allowScrollInspect")) {
				LayoutHelpers.prototype.reallyscrollIntoViewIfNeeded.apply(this, arguments);
			}
		}
	}
	
}) ()

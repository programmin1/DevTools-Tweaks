/**
 * Firefox DevTools Tweak addon - extends Firefox DevTool.
 * by Luke Bryan
 * Portions based on Firefox DevTools code.
 */

window.addEventListener('load',function(evt) {
	//borrowed from CSSRuleView.jsm
	const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
	function createMenuItem(aMenu,aAttributes) {
		let item = aMenu.ownerDocument.createElementNS(XUL_NS, "menuitem");
		item.setAttribute("label", aAttributes.label);
		item.setAttribute("accesskey", aAttributes.accesskey);
		item.addEventListener("command", aAttributes.command);

		aMenu.appendChild(item);
		return item;
	}
	
	var contextmenu = document.getElementById('rule-view-context-menu');
	createMenuItem ( contextmenu,
	{label:'Open URL in New Tab',accesskey:'O',command:function(evt) {
		var clicked = document.popupNode;
		if (clicked.className && clicked.className.contains('ruleview-propertyvalue')) {
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
				if (container.className.contains('ruleview-rule')) {
					break;//This is what we want.
				} else if (container.className.contains('ruleview-rule-inheritance')) {
					return;//Just a header, exit.
				}
			}
		}
		var refs = document.getElementsByClassName('ruleview-rule-source');
		//look for RuleViewTool.view._elementStyle
		var rules = window.ruleview.view._elementStyle.rules;
		var ruleDivs = container.parentNode;
		for (let i=0; i<ruleDivs.children.length; i++) {
			if (ruleDivs.children[i] == container) {
				//This is the one.
				if (rules[i].sheet) {
					var SSurl = rules[i].sheet.href;
					dump('stylesheet url:'+SSurl);
					if (relUrl) {
						//see https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIURI
						var ioService = Components.classes["@mozilla.org/network/io-service;1"]
							.getService(Components.interfaces.nsIIOService);
						var baseURI = ioService.newURI(SSurl, null, null);
						var cssValueURI = ioService.newURI(relUrl, null, baseURI);
						window.ruleview.inspector.selection.window.open(cssValueURI.spec);
						//window.parent.parent.parent.gBrowser.addTab(cssValueURI.spec);
					} else {
						window.ruleview.inspector.selection.window.open(SSurl);
						//window.parent.parent.parent.gBrowser.addTab(SSurl);
					}
				}
			}
		}
	} } );
	createMenuItem ( contextmenu, 
	{label:'New Rule...',accesskey:'N',command:function() {
		//window.ruleview.inspector.target.tab.linkedBrowser.contentDocument.body.style.backgroundColor='blue';
		//window.ruleview.inspector.selection.window.document.body.style.backgroundColor='blue';
		var selector = prompt('What selector do you want?\n For example: "#someIDelement .classinside"');
		if (selector) {
			var doc = window.ruleview.inspector.selection.window.document;
			var rule = doc.createElement('style');
			rule.appendChild(doc.createTextNode(selector+'{}'));
			doc.body.appendChild(rule);
			// Refresh:
			//window.ruleview.inspector.markDirty();//leave page warning
			window.ruleview.view.nodeChanged(); // update right panel
			var ruleDivs = document.getElementsByClassName('ruleview')[0];
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
	} } );
	
},true);

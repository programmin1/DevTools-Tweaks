/**
 * Firefox DevTools Tweak addon - extends Firefox DevTool.
 * by Luke Bryan
 * Portions based on Firefox DevTools code.
 * Released under MPL
 * 
 * Web Console module - improves network panel.
 * 
 */
(function(){

 
if (typeof WebConsoleFrame === 'undefined') {
	console = Components.utils.import("resource://gre/modules/devtools/Console.jsm").console;
	
	var {devtools} = Components.utils.import("resource://gre/modules/devtools/Loader.jsm", {});
	var {WebConsoleFrame} = devtools.require("devtools/webconsole/webconsole");
	// ^ accesses fx/modules/devtools/devtools/webconsole/webconsole.js.
}

if (typeof WebConsoleFrame.prototype.origOpenNP == 'undefined') {
	WebConsoleFrame.prototype.origOpenNP = WebConsoleFrame.prototype.openNetworkPanel;
	WebConsoleFrame.prototype.openNetworkPanel = function WCF_openNetworkPanel(aNode, aHttpActivity) {
		//Run the original, in its natural ('this') environment:
		var netPanel = WebConsoleFrame.prototype.origOpenNP.call(
					   this, aNode, aHttpActivity);
		netPanel.iframe.addEventListener('load',function(event) {
			//for(a in netPanel.iframe) {dump(a+"\n");}
			var doc = event.originalTarget;
			if (doc.location.protocol != "data:") {
				//Not the generated frames, the outer frame. Color:
				doc.body.style.backgroundColor='rgb(85,87,128)';
			}
			var respDiv = doc.getElementById('responseBody');
			if (!respDiv) {
				respDiv = doc.getElementById('responseBodyCached');
			}
			if (respDiv) {
				var a = doc.createElement('button');
				a.appendChild(doc.createTextNode('JSON'));
				respDiv.childNodes[1].appendChild(a);
				a.addEventListener('click',function() {
					var fetch = doc.getElementById('responseBodyFetchLink');
					if (fetch) {
						var evt = doc.createEvent("MouseEvents");
						evt.initMouseEvent("mousedown", true, true, doc.parentWindow,
						  0, 0, 0, 0, 0, false, false, false, false, 0, null);
						fetch.dispatchEvent(evt);
					}
					for (let i=0; i<respDiv.children.length; i++) {
						if (respDiv.children[i].nodeName == 'table') {
							var resp = respDiv.children[i].textContent;
							let obj = JSON.parse(resp);
							let str = JSON.stringify(obj, undefined, 4);
							respDiv.children[i].innerHTML = '';
							var iframe = document.createElement('iframe');
							//https://developer.mozilla.org/en-US/docs/Displaying_web_content_in_an_extension_without_security_issues
							iframe.setAttribute('type','content');
							iframe.setAttribute('style','height:300px;width:100%;border:none');
							iframe.setAttribute('src','data:text/html,' + 
								encodeURIComponent('<html><body><style> * {font-size:12px;}</style>'+window.netWinTweak.syntaxHighlight(str)+'</body></html>'));
							respDiv.children[i].appendChild(iframe);
							break;
						}
					}
				});
			}
			
			//pretty-print-able post requests:
			var reqEl = doc.getElementById('requestBodyContent');
			if (reqEl) {
				//http://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
				function escapeHtml(unsafe) {
					return unsafe
						 .replace(/&/g, "&amp;")
						 .replace(/</g, "&lt;")
						 .replace(/>/g, "&gt;")
						 .replace(/"/g, "&quot;")
						 .replace(/'/g, "&#039;");
				}
				var makelist = doc.createElement('button');
				makelist.appendChild(doc.createTextNode('Make List'));
				reqEl.previousElementSibling.appendChild(makelist);
				makelist.addEventListener('click',function() {
					if (!reqEl.hasAttribute('data-done')) {
						var items = reqEl.textContent.split('&'),
							output = '';
						for (var i=0; i<items.length; i++) {
							var spl = items[i].indexOf('=');
							output += '<b>'+
							escapeHtml(unescape(items[i].substr(0,spl)))+'</b>'
							+escapeHtml(unescape(items[i].substr(spl)))+'<br/>';
						}
						let iframe = document.createElement('iframe');
						//Add safely as described here:https://developer.mozilla.org/en-US/docs/Displaying_web_content_in_an_extension_without_security_issues
						iframe.setAttribute('type','content');
						iframe.setAttribute('style','height:300px;width:100%;border:none;');
						iframe.setAttribute('src','data:text/html,' + 
							encodeURIComponent('<html><body><style> * {font-size:12px;}</style>'+output+'</body></html>'));
						reqEl.innerHTML='';
						reqEl.appendChild(iframe);
					}
					reqEl.setAttribute('data-done','yes');
				});
			}
		},true);
		
		return netPanel;
	}

	//window.hud.owner.getDebuggerFrames();

	var netWinTweak = netWinTweak || {};
	// From http://stackoverflow.com/questions/4810841/json-pretty-print-using-javascript
	netWinTweak.syntaxHighlight = function(json) {
		json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return '<style>pre {outline: 1px solid #ccc; padding: 5px; margin: 5px; }'+
	'.string { color: green; }'+
	'.number { color: darkorange; }'+
	'.boolean { color: blue; }'+
	'.null { color: magenta; }'+
	'.key { color: red; } </style>'+
	'<pre>'+json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
			var cls = 'number';
			if (/^"/.test(match)) {
				if (/:$/.test(match)) {
					cls = 'key';
				} else {
					cls = 'string';
				}
			} else if (/true|false/.test(match)) {
				cls = 'boolean';
			} else if (/null/.test(match)) {
				cls = 'null';
			}
			return '<span class="' + cls + '">' + match + '</span>';
		})+'</pre>';
	}

	//Modify the result of createMessageNode:
  /** (from Firefox source:)
   * Given a category and message body, creates a DOM node to represent an
   * incoming message. The timestamp is automatically added.
   *
   * @param number aCategory
   *        The category of the message: one of the CATEGORY_* constants.
   * @param number aSeverity
   *        The severity of the message: one of the SEVERITY_* constants;
   * @param string|nsIDOMNode aBody
   *        The body of the message, either a simple string or a DOM node.
   * @param string aSourceURL [optional]
   *        The URL of the source file that emitted the error.
   * @param number aSourceLine [optional]
   *        The line number on which the error occurred. If zero or omitted,
   *        there is no line number associated with this message.
   * @param string aClipboardText [optional]
   *        The text that should be copied to the clipboard when this node is
   *        copied. If omitted, defaults to the body text. If `aBody` is not
   *        a string, then the clipboard text must be supplied.
   * @param number aLevel [optional]
   *        The level of the console API message.
   * @param number aTimeStamp [optional]
   *        The timestamp to use for this message node. If omitted, the current
   *        date and time is used.
   * @return nsIDOMNode
   *         The message node: a DIV ready to be inserted into the Web Console
   *         output node.
   */
	WebConsoleFrame.prototype.origCreateMsg = WebConsoleFrame.prototype.createMessageNode;
	WebConsoleFrame.prototype.createMessageNode = 
	function(aCategory, aSeverity, aBody, aSourceURL, aSourceLine, aClipboardText, aLevel, aTimeStamp) {
		let res = WebConsoleFrame.prototype.origCreateMsg.call(this,
		aCategory, aSeverity, aBody, aSourceURL, aSourceLine, aClipboardText, aLevel, aTimeStamp)
		// ^ original was called with expected params.
		
		var doc = res.ownerDocument
		,	newspan = doc.createElement('span');
		newspan.textContent = ':'+aCategory+','+aClipboardText;
		if (aCategory==5) {
			var thing = res._variablesView;
			/*for (i in res._variablesView) {
				console.log(res._variablesView[i]);
			}*/
			//console.log(res._variablesView.controller)//.controller.getObjectClient())
		}
		res.children[2].appendChild(newspan);
		
		//if (res.children[2].textContent != '"logged."')
		//	console.log(res.children[2]);//the body devtools-monospace, main text
		/**  ^
		 *   |
		 * 
		 * As of Fx 27, as seen in Browser console, result will be div containing:
		 * <span class="timestamp devtools-monospace"> with time, </span>
		 * <span class="icon"></span>
		 * <span class="body devtools-monospace"><a>(link</a></span>
		 * <span class="repeats"></span>
		 * <span class="location devtools-monospace"></span>
		 */
		return res;
	}

	/*window.addEventListener('load',function() {
		dump('hello');
		//breakpoint here to look for objects to use
	})*/
}

}) ();//Run immediately in its own scope

/**
 * Firefox DevTools Tweak addon - extends Firefox DevTool.
 * by Luke Bryan
 * Portions based on Firefox DevTools code.
 * Released under MPL
 */
WebConsoleFrame.prototype.origOpenNP = WebConsoleFrame.prototype.openNetworkPanel;
WebConsoleFrame.prototype.openNetworkPanel = function WCF_openNetworkPanel(aNode, aHttpActivity) {
	//Run the original, in its natural ('this') environment:
	var netPanel = WebConsoleFrame.prototype.origOpenNP.call(
	               this, aNode, aHttpActivity);
	netPanel.iframe.addEventListener('load',function(event) {
		//for(a in netPanel.iframe) {dump(a+"\n");}
		var doc = event.originalTarget;
		doc.body.style.backgroundColor='rgb(85,87,128)';
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
						respDiv.children[i].innerHTML = window.netWinTweak.syntaxHighlight(str);
						break;
					}
				}
			});
		}
	},true);
	
	return netPanel;
}

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
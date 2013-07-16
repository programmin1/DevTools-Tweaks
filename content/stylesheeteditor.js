document.addEventListener('mousedown',function(e) {
	// Make the link an actual link:
	if (e.target.parentNode.nodeName == 'a' &&
	  e.target.parentNode.classList.contains('stylesheet-name')) {
		var cssurl = e.target.value;
		if (!(cssurl.startsWith('<inline style'))) {
			if (!(cssurl.startsWith('http:')) && !(cssurl.startsWith('ftp:')) && !(cssurl.startsWith('https:'))) {
				// Calculate url from relative url:
				//see https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIURI
				var ioService = Components.classes["@mozilla.org/network/io-service;1"]
					.getService(Components.interfaces.nsIIOService);
				// Devtools main window has reference to its window.
				// TODO: window.parent.content not helpful, when not docked in window.
				var baseURI = ioService.newURI(window.parent.content.location.href, null, null);
				cssurl = ioService.newURI(cssurl, null, baseURI).spec;
			}
			window.parent.content.open(cssurl);
		}
	}
});
/**
 * Firefox DevTools Tweak addon - extends Firefox DevTool.
 * by Luke Bryan
 * Portions based on Firefox DevTools code.
 * Released under MPL
 */

//Todo: there is no right click menu to extend in Firefox 22 beta
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
			"devtoolTweakEdit", "chrome,centerscreen,modal", /*args:*/
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
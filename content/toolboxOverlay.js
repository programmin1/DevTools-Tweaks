/**
 * Firefox DevTools Tweak addon - extends Firefox DevTool.
 * by Luke Bryan
 * Released under MPL
 * 
 * Toolbox overlay - This would add split-panel with web console visible everywhere,
 *  unfortunately it causes the web console iframe to destruct when it moves it, breaking it.
 */
 
var dt = dt || {};

dt.isSplit = false;

dt.makeSplit = function() {
	if (dt.splitCheck.checked && !dt.isSplit) {
		document.getElementById('dtSplitter').style.display='';
		document.getElementById('dtPlacer').style.display = '';
		/*var old = document.getElementById('dtPlacer').parentNode.replaceChild(
			document.getElementById('toolbox-panel-iframe-webconsole'),
			document.getElementById('dtPlacer')
		);calls destructor, breaks. */
		
		document.getElementById('dtPlacer').parentNode.appendChild(
			document.getElementById('toolbox-panel-iframe-webconsole')
		);
		dt.isSplit = true;
	}
}

window.addEventListener('load',function() {
	var toolbar = document.getElementsByClassName('devtools-tabbar')[0];
	dt.splitCheck = check = document.createElement('checkbox');
	check.id = 'dt-split';
	check.title="Split screen, show Web Console";
	toolbar.insertBefore(check,document.getElementById('toolbox-tabs'));
	
	var panels = document.getElementsByClassName('devtools-tab');
	
	//Set up events:
	check.addEventListener('change',function() {
		dt.makeSplit();
	});
	check.addEventListener('click',function() {
		dt.makeSplit();
	});
	
	for (let i=0; i<panels.length; i++) {
		/*panels[i].addEventListener('click',function() {
			makeSplit();
		});
		for (i in toolbox) {
			dumps(i+'\n');
		}*/
	}
 });
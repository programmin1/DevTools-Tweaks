/*
 * Extra Toolbox-options setup by Luke Bryan
 * Immediately updates the Firefox loglimit prefs.
 * 
 */

window.addEventListener('load',function(){
	//Corresponding to dt[val]-id element and devtools.hud.loglimit.[val] built in firefox pref:
	// (Those values are looked up in logLimitForCategory in devtools/webconsole/webconsole.js)
	let opts = ['console','cssparser','exception','network'];
	
	// Get the loglimit branch of prefs:
	let prefs = Components.classes["@mozilla.org/preferences-service;1"]
						.getService(Components.interfaces.nsIPrefService);
	prefs = prefs.getBranch("devtools.hud.loglimit.");
	
	
	opts.forEach(function(id) {
		let text = document.getElementById('dt'+id);
		//console.log(id);
		text.value = prefs.getIntPref(id);
		
		text.addEventListener('input',function(e) {
			let val = parseInt(e.target.value);
			if (val) {//Change to user input number:
				prefs.setIntPref(id,val);
			}
		});
	})
});

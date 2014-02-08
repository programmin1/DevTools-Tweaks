
console = Components.utils.import("resource://gre/modules/devtools/Console.jsm").console;

function addlog(output) {
	document.getElementById('out').value += output+"\n";
}

first = true;

/**
 * Compare 2 dom nodes
 * Given A node, identifier, B node, identifier, depth.
 */
function compare(A,Aid,B,Bid,godeep) {
	if (first) {
		document.getElementById('htmA').value = A.outerHTML;
		document.getElementById('htmB').value = B.outerHTML;
		first = false;
	}
	
	if (A.nodeName != B.nodeName) {
		addlog(Aid+' is <'+A.nodeName+'>, '+Bid+' is <'+B.nodeName+'>.');
	}
	for (let a=0; a<A.attributes.length; a++) {
		let key = A.attributes[a].name,
		    other = B.attributes[key];
		if (other !== undefined) {//both have attr.
			if (A.attributes[a].value != other.value) {
				addlog(Aid+' has attr '+key+'='+A.attributes[key].value);
				addlog(Bid+' has attr '+key+'='+B.attributes[key].value);
			}
		} else {
			addlog(Aid+' has attr '+key+'='+A.attributes[key].value+', not in other el.')
		}
	}
	//Also check for the other's unique attr:
	for (let b=0; b<B.attributes.length; b++) {
		let key = B.attributes[b].name,
		    other = A.attributes[key];
		if (other === undefined) {
			addlog(Bid+' has attr '+key+'='+A.attributes[key].value+', not in other el.')
		}
	}
	//This doesn't work with clones
	var cssA = A.ownerDocument.defaultView.getComputedStyle(A,null),
	    cssB = B.ownerDocument.defaultView.getComputedStyle(B,null);
	
	for (let i=0; i<cssA.length; i++) {
		if (cssA.getPropertyValue(cssA[i]) != cssB.getPropertyValue(cssB[i])) {
			addlog(Aid+' css '+cssA[i]+'='+cssA.getPropertyValue(cssA[i]));
			addlog(Bid+' css '+cssB[i]+'='+cssB.getPropertyValue(cssB[i]));
		}
	}
	if (A.children.length !== B.children.length) {
		addlog(Aid+' has '+A.children.length+' children, '+Bid+' has '+B.children.length);
	}
	if (A.textContent !== B.textContent) {
		addlog(Aid+' textContent differs from '+Bid);
	}
	if (godeep > 0) {
		for (let i=0; i<A.children.length; i++) {
			if (i< B.children.length) { //compare it
				compare(A.children[i], Aid+'.children['+i+']',
						B.children[i], Bid+'.children['+i+']')
			}
		}
	}
}

window.onload = function() {
	if (window.arguments[0]) {
		var a=window.arguments[0].A,
			b=window.arguments[0].B;
		document.title = "compare";
		compare(a,'A', b,'B',0);
	}
}

function comparePressed() {
	let depth = document.getElementById('depth').value;
	console.log(depth);
	document.getElementById('out').value="";
	compare(window.arguments[0].A,'A',
	        window.arguments[0].B,'B',
	        depth)
}

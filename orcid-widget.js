(function() {
	// Localize jQuery variable
	var jQuery;
	/******** Load jQuery if not present *********/
	if (window.jQuery === undefined || window.jQuery.fn.jquery !== '2.2.4') {
	    var script_tag = document.createElement('script');
	    script_tag.setAttribute("type","text/javascript");
	    script_tag.setAttribute("src",
	        "https://code.jquery.com/jquery-2.2.4.js");
	    if (script_tag.readyState) {
	      script_tag.onreadystatechange = function () { // For old versions of IE
	          if (this.readyState == 'complete' || this.readyState == 'loaded') {
	              scriptLoadHandler();
	          }
	      };
	    } else {
	      script_tag.onload = scriptLoadHandler;
	    }
	    // Try to find the head, otherwise default to the documentElement
	    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
	} else {
	    // The jQuery version on the window is the one we want to use
	    jQuery = window.jQuery;
	    init();
	}

	/******** Called once jQuery has loaded ******/
	function scriptLoadHandler() {
	    // Restore $ and window.jQuery to their previous values and store the
	    // new jQuery in our local jQuery variable
	    jQuery = window.jQuery.noConflict(true);
	    // Call our main function
		init(); 
	}

	const sandboxIssuer = "https://sandbox.orcid.org";
	const sandboxUrl = "https://sandbox.orcid.org/oauth/authorize";
	const sandboxKey = {"kty":"RSA","e":"AQAB","use":"sig","kid":"sandbox-orcid-org-3hpgosl3b6lapenh1ewsgdob3fawepoj","n":"pl-jp-kTAGf6BZUrWIYUJTvqqMVd4iAnoLS6vve-KNV0q8TxKvMre7oi9IulDcqTuJ1alHrZAIVlgrgFn88MKirZuTqHG6LCtEsr7qGD9XyVcz64oXrb9vx4FO9tLNQxvdnIWCIwyPAYWtPMHMSSD5oEVUtVL_5IaxfCJvU-FchdHiwfxvXMWmA-i3mcEEe9zggag2vUPPIqUwbPVUFNj2hE7UsZbasuIToEMFRZqSB6juc9zv6PEUueQ5hAJCEylTkzMwyBMibrt04TmtZk2w9DfKJR91555s2ZMstX4G_su1_FqQ6p9vgcuLQ6tCtrW77tta-Rw7McF_tyPmvnhQ"};
	const prodIssuer = "https://orcid.org";
	const prodUrl = "https://orcid.org/oauth/authorize";
	const prodKey = {"kty":"RSA","e":"AQAB","use":"sig","kid":"production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs","n":"jxTIntA7YvdfnYkLSN4wk__E2zf_wbb0SV_HLHFvh6a9ENVRD1_rHK0EijlBzikb-1rgDQihJETcgBLsMoZVQqGj8fDUUuxnVHsuGav_bf41PA7E_58HXKPrB2C0cON41f7K3o9TStKpVJOSXBrRWURmNQ64qnSSryn1nCxMzXpaw7VUo409ohybbvN6ngxVy4QR2NCC7Fr0QVdtapxD7zdlwx6lEwGemuqs_oG5oDtrRuRgeOHmRps2R6gG5oc-JqVMrVRv6F9h4ja3UgxCDBQjOVT1BFPWmMHnHCsVYLqbbXkZUfvP2sO1dJiYd_zrQhi-FtNth9qrLLv3gkgtwQ"};
	
	var issuer;
	var authUrl;
	var key;
	var clientId;
	var env;
	var redirectUri;
	var pubKey;

	var signedInOrcid;
	var signedInIdToken;

	function init(){
		var elementId = '#orcidWidget';
		jQuery(document).ready(function($) {

			clientId = $(elementId).data("clientid"); 
			env = $(elementId).data("env");
			redirectUri = $(elementId).data("redirect");
			
			if (env === 'production'){
				issuer = prodIssuer;
				authUrl = prodUrl;
				key = prodKey;
			} else {
				issuer = sandboxIssuer;
				authUrl = sandboxUrl;
				key = sandboxKey;
			}

			/******* Load CSS *******/
	        var css_link = $("<link>", { 
	            rel: "stylesheet", 
	            type: "text/css", 
	            href: "orcid-widget.css" 
	        });
	        css_link.appendTo('head');  
			//check for response - if exists process it
			if (getFragmentParameterByName("id_token")){
				var id_token = getFragmentParameterByName("id_token");
				if(id_token){
					$.getScript( "https://kjur.github.io/jsrsasign/jsrsasign-latest-all-min.js", function( data, textStatus, jqxhr ) {
						if (checkSig(id_token)){
							signedInIdToken = JSON.parse(KJUR.jws.JWS.parse(id_token).payloadPP);
							signedInOrcid = signedInIdToken.sub;
							$('<p id="orcidAuthSuccess"><b>Thanks, ' +signedInIdToken.given_name+ " " +signedInIdToken.family_name+ '!</b><br><img src="https://orcid.org/sites/default/files/images/orcid_24x24.png" width="16" height="16"/><a target="_orcidRecord" href="' + issuer + '/' + signedInIdToken.sub + '">' +  issuer + '/' + signedInIdToken.sub + '</a></p>').appendTo('#orcidWidget');
							$('<input>').attr({
							    type: 'hidden',
							    id: 'orcidId',
							    name: 'orcidId',
							    value: signedInIdToken.sub
							}).appendTo(elementId);
							$('<input>').attr({
							    type: 'hidden',
							    id: 'orcidGivenName',
							    name: 'orcidGivenName',
							    value: signedInIdToken.given_name
							}).appendTo(elementId);
							$('<input>').attr({
							    type: 'hidden',
							    id: 'orcidFamilyName',
							    name: 'orcidFamilyName',
							    value: signedInIdToken.family_name
							}).appendTo(elementId);
							$('<input>').attr({
							    type: 'hidden',
							    id: 'orcidIdToken',
							    name: 'orcidIdToken',
							    value: id_token
							}).appendTo(elementId);
						} else {
							signedInIdToken = null;
							signedInOrcid = null;
							var errorMsg = $('<p id="orcidAuthFail">Oops, something went terribly wrong<br> and we couldn\'t fetch your ORCID iD</p>').appendTo('#orcidWidget');
						}
					});
				}
			}
			//if we don't have a signed in user, show sign in button
			else {
				$('<a id="orcidAuthButton" href=' + buildReturnUrl() + '><img src="https://orcid.org/sites/default/files/images/orcid_24x24.png" width="16" height="16"/>Connect your ORCID iD</a>').appendTo('#orcidWidget');
			}
	    });
	}

	function getFragmentParameterByName(name) {
	    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	    var regex = new RegExp("[\\#&]" + name + "=([^&#]*)"),
	        results = regex.exec(window.location.hash);
	    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	function checkSig(id_token){
		pubKey = KEYUTIL.getKey(key);
	    return KJUR.jws.JWS.verifyJWT(id_token, pubKey, {
	    	alg: ['RS256'], iss: [issuer] , aud:clientId,gracePeriod: 15*60 //15 mins skew allowed
	  	});
	}

	function buildReturnUrl(nonce){
		var url = authUrl+"?response_type=token&redirect_uri="+redirectUri+"&client_id="+clientId+"&scope=openid";
		if (nonce)
			url += "&nonce="+nonce;
		return url;
	}
})();

// Shorthand to make my life easier
var plugin = sifterPlugin;

// ==================================================
// init
// ==================================================
sifterPlugin.init = function() {
	// Call onChange when textarea changed
	$("textarea").bind("keyup", window.sifterPlugin.onChange);
	
	// Initialize keywords to an empty array
	var keywords = [];
	// Add all the actions to the list of keywords
	for(action in plugin.settings.hashActions) keywords.push(action);
	// Make the hash out of the keywords
	plugin.hashRegex = new RegExp(".*?#(" + keywords.join("|") + ")\\b", "gi");
};

// ==================================================
// assignTo
// ==================================================
sifterPlugin.assignTo = function(leader, $input) {
	var match = $input.val().match(new RegExp(leader + "(\\S+)", "i"));
	// If no match, then quit
	if(!match) return false;
	var name = match[1];
	
	// Load the members
	plugin.getTeamMembers(function(members) {
		// Get the long version of the name
		var longhand = plugin.teamMembers[name];

		// If we found the long version, then remove it from the textbox
		if(longhand) {
			// Find the option that pertains to this person
			var $option = $("select[name*=assignee] option:contains("+longhand+")");
			// If option not found, then report that we failed
			if(!$option.length) return false;
			// Select the person from the assign list
			$option.closest("select").val( $option.val() ); 
			
			// Need to call this after the textbox is updated by the browser
			window.setTimeout(function() {
				var value = $input.val();
				
				// Remove the name from the front of the string
				value = value.replace(new RegExp("(^(?:\s|#\w+)*)\\s*#" + match[0] + "\\s*"), "");
				// Remove the name from the middle of the string
				value = value.replace(new RegExp("#" + match[0] + "\\s*"), longhand);

				// Remove the text from the box
				$input.val(value);
			}, 10);
		}
	});

	// Throw an exception to prevent the caller from thinking we successfuly
	// acted upon the information
	return false;
};

// ==================================================
// getTeamMembers
// ==================================================
sifterPlugin.getTeamMembers = function(callback) {
	// If we already have the members, don't re-ask
	if(plugin.teamMembers) return callback(plugin.teamMembers);

	// Load the team members
	$.get("https://voidray.sifterapp.com/projects/24419/team_members", function(json) {
		// Remove excess from the labels
		for(var i=0; i<json.length; ++i) {
			// Shorthand the item
			var item = json[i];
			// Remove (foo) (this would create problems if the user has () in 
			// their name
			item.label = item.label.replace(/\s*\(.*/, "");
			// Remove the numbered item
			delete(json[i]);
			// Remap the items by alias
			json[item.value] = item.label;
		}

		// Save the result
		plugin.teamMembers = json;
		// Call the callback
		callback(plugin.teamMembers);
	});
};

// ==================================================
// markClosed
// ==================================================
sifterPlugin.markClosed = function() {
	var $radio = 
		$( 
			// Try to find the radio button that pertains to the 'closed' label
			$("label:contains(Closed):has(:radio):first")[0]
			// Failing that, try to find by status
			|| $(":radio[name*=status][value=4]:first")[0]
		 );

	// If we didn't find the radio button, then report that we failed
	if(!$radio.length) return false;
	// Click the radio button
	$radio.click();
};

// ==================================================
// markOpened
// ==================================================
sifterPlugin.markOpened = function() {
	var $radio = 
		// Try to find the radio button that pertains to the 'open' label
		$( 
		   $("label:contains(Open):has(:radio):first")[0]
		|| $("label:contains(Reopened):has(:radio):first")[0]
		|| $(":radio[name*=status][value=1]:first")[0]
		);

	// If we didn't find the radio button, then report that we failed
	if(!$radio.length) return false;
	// Click the radio button
	$radio.click();
}

// ==================================================
// markResolved
// ==================================================
sifterPlugin.markResolved = function() {
	var $radio = 
		$( 
			// Try to find the radio button that pertains to the 'resolved' label
			$("label:contains(Resolved):has(:radio):first")[0]
			// Failing that, try to find the button by status
			|| $(":radio[name*=status][value=3]:first")[0]
		 );
	
	// TODO: Consider throwing an error to prevernt the text from getting removed from the textarea
	
	// If we didn't find the radio button, then report that we failed
	if(!$radio.length) return false;
	// Click the radio button
	$radio.click();
};

// ==================================================
// markUnassigned
// ==================================================
sifterPlugin.markUnassigned = function() {
	var $select = 
		$( 
			// Try to find the select box that pertains to the 'Assignee' label
			$("label:contains(Assignee) select")[0]
			// Failing that, try to find the dropdown by name
			|| $("select[name*=assignee]")[0]
		 );
	
	// If we didn't find the select box, then report that we failed
	if(!$select.length) return false;
	// Set the value to nothing
	$select.val("");
};

// ==================================================
// onChange
// ==================================================
sifterPlugin.onChange = function() {
	// Cache jQuery wrapped item for speed
	var $this = $(this);
	// Get the current text
	var text = $this.val();
	// Don't run if text not changed
	if(text == $this.get(0).oldText) return;
	// Remember the previous text
	$this.get(0).oldText = text;
	
	// See if the textbox has any of the hash actions we're looking for
	var matches = text.match(plugin.hashRegex) || [];

	// Go through all the matches, process them, and remove from textarea
	for(var i=0; i<matches.length; ++i) {
		// Get the match we're iterating and strip whitespace and #
		var match = matches[i].replace(/\s*#?/g, "");
		// Find out what function we call for this match
		var action = plugin.settings.hashActions[ match ];
		
		// Look up the function from start of text
		if(callback = plugin[action]) {
			// Call the method with the match in question
			if( callback(match, $this) !== false ) {
				// Remove the match from the text
				text = text.replace(new RegExp("\\s*#" + match + "\\s*"), "");
			}
		}

		// Look up the function from anywhere in the text
		else {
			// Get the hash from the long string
			var match = ( matches[i].match("#([\\w@:]+)") || [0, false] )[1];
			// Re-lookup the action
			var action = plugin.settings.hashActions[ match ];
			
			// Look up the function from start of text
			if(callback = plugin[action]) {
				// Call the method with the match in question
				if( callback(match, $this) !== false ) {
					// Remove the match from the text
					text = text.replace(new RegExp("#" + match), match);
				}
			}
		}
	}

	// Update the value of the textarea
	$this.val(text);
};

// Run init when page is done loading
$(sifterPlugin.init);

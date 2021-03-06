
// Initialize plugin in global scope
sifterPlugin = {
	settings: {
		hashActions: {
			"@"       : "assignTo"      ,
            "a:@"     : "assignTo"      , 
            "a:"      : "assignTo"      , 
            "close"   : "markClosed"    ,
            "closed"  : "markClosed"    ,
            "closes"  : "markClosed"    ,
            "open"    : "markOpened"    ,
            "opened"  : "markOpened"    ,
            "opens"   : "markOpened"    ,
            "reopen"  : "markOpened"    ,
            "reopened": "markOpened"    ,
            "reopens" : "markOpened"    ,
            "resolve" : "markResolved"  ,
            "resolved": "markResolved"  ,
            "resolves": "markResolved"  ,
            "unassign": "markUnassigned",
		}
	}
};


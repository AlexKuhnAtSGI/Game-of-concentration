//An asynchronous server that serves static files
// load necessary modules
var http = require('http');
var fs = require('fs');
var mime = require('mime-types');
var url = require('url');
var boardBuilder = require('./makeBoard.js');

const ROOT = "./public_html";

// create http server
var server = http.createServer(handleRequest);
server.listen(2406);
console.log('Server listening on port 2406');

var users = {};

function handleRequest(req, res) {

    //I had too many get requests for this console log to be useful
	//If you want to see everytime a request is made, uncomment it
    
	//console.log(req.method + " request for: " + req.url);

    //parse the url
    var urlObj = url.parse(req.url, true);
    var filename = ROOT + urlObj.pathname;
	var currUser = "";

    if (req.method == 'POST' && urlObj.pathname == ("/memory/intro")) {
        //this kind of request is only given on inital page load: this establishes the user in the users dictionary
		//difficulty starts at a 4*4 grid and goes up on each win until reaching the maximum of 10*10
        req.setEncoding('utf8');
        var body = "";
        var data = "";
        req.on('data', function(data) {
            body += data;
        });
		
        req.on('end', function(req, res) {
            var POST = JSON.parse(body);
			var newUser = {};
			newUser.name = POST.username;
			
			if (users[POST.username] != null) {
				newUser.difficulty = users[POST.username].difficulty;
				console.log("WELCOME BACK " + newUser.name.toUpperCase() + ", PLAYER AT DIFFICULTY " + newUser.difficulty);	
				if (newUser.difficulty < 10){
					newUser.difficulty += 2;
					console.log("DIFFICULTY INCREASED TO " + newUser.difficulty)
				}
				else {
					console.log("MAXIMUM DIFFICULTY REACHED");
				}
			}
			else {
				newUser.difficulty = 4;
				console.log("NEW USER DETECTED, SETTING DIFFICULTY " + newUser.difficulty);
			}
			newUser.board = boardBuilder.makeBoard(newUser.difficulty);
			users[newUser.name] = newUser;
			respond(200, "");
        })
    }
	
	else if (req.method == 'GET' && urlObj.pathname == ("/memory/size")) {
		//just a quick route for when the client requests grid size
		currUser = urlObj.query.username;
		respond(200, users[currUser].difficulty.toString());
	}
	
	else if (req.method == 'GET' && urlObj.pathname == ("/memory/card")) {
		//this provides the user with the data for the card they have clicked on
		currUser = urlObj.query.username;
		currRow = parseInt(urlObj.query.row) - 1;
		currColumn = parseInt(urlObj.query.column) - 1;
		if (users[currUser].board[currRow][currColumn] == undefined){
			respond(400, "Bad request");
		}
		else {
			respond(200, users[currUser].board[currRow][currColumn].toString());
		}
	}

    //the callback sequence for static serving...
    else {
	fs.stat(filename, function(err, stats) {
        if (err) { //try and open the file and handle the error, handle the error
            respondErr(err);
        } else {
            if (stats.isDirectory()) filename += "/index.html";

            fs.readFile(filename, "utf8", function(err, data) {
                if (err) respondErr(err);
                else respond(200, data);
            });
        }
    });
	}


    //locally defined helper function
    //serves 404 files 
    function serve404() {
        fs.readFile(ROOT + "/404.html", "utf8", function(err, data) { //async
            if (err) respond(500, err.message);
            else respond(404, data);
        });
    }

    //locally defined helper function
    //responds in error, and outputs to the console
    function respondErr(err) {
        console.log("Handling error: ", err);
        if (err.code === "ENOENT") {
            serve404();
        } else {
            respond(500, err.message);
        }
    }

    //locally defined helper function
    //sends off the response message
    function respond(code, data) {
        // content header
        res.writeHead(code, {
            'content-type': mime.lookup(filename) || 'text/html'
        });
        // write message and signal communication is complete
        res.end(data);
    }

}; //end handle request
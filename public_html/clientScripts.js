var cardsRemaining = 0;
var activeCard = "";
var priorCard = "";
var cardsShown = 0;
var guessesMade = 0;
//the global variables required to keep a game of memory going

function userEntry(){
	//function used on load, asks a user for their name and sets them up with a default if they don't have one
	//it will keep prompting until they click OK
	while (person == null) {
		var person = prompt("Please enter your name");
	}
	if (person == ""){
		person = "Default User";
	}
	$.ajax({
		type: "POST",
		url: '/memory/intro',
		dataType:'json',
		async:false,
		data:JSON.stringify({"username":person})
	});
	localStorage.setItem("user", person)
	play(person, 0);
}

function play(user, whoCalled){
	//whoCalled tells the play method when it's being called
	//if whoCalled is 0, it's being called by the userEntry method, and the post request has already been sent
	//if not, it needs to tell the server that the user is playing again, so the server will up the difficulty
	if (whoCalled != 0) {
		$.ajax({
			type: "POST",
			url: '/memory/intro',
			dataType:'json',
			async:false,
			data:JSON.stringify({"username":user})
		});
	}
	
	$.ajax({
			type: "GET",
			url: '/memory/size',
			dataType:'text',
			success:function(data){
				sizeGetter(data);
			},
			data:"username="+user
		});
		
}

function sizeGetter(size) {
	//gets the size as an argument and uses it to build the grid by creating size^2 divs (and size^2 spans within those divs)
	cardsRemaining = size*size;
	for (var i = 0; i < size; i++) {
		var currRow = document.getElementById("gameboard").insertRow();
		for (var j = 0; j < size; j++) {
			var div = document.createElement("div");
			var divSpan = document.createElement("divSpan");
			
			div.id = "d" + (i+1) + (j+1);
			div.className = "tile";
			div.onclick = flipTile;
			div.dataset.row = (i+1).toString();
			div.dataset.column = (j+1).toString();
			
			divSpan.id = div.id + "s";
			
			currRow.appendChild(div);
			var currDiv = document.getElementById(div.id);
			currDiv.appendChild(divSpan);
		}
	}
}

function flipTile(){
	//flips a card over IF it is a valid move for the user to do so
	//sends a GET request for the data then calls displayCard to add the data to the div in question
	if (this.className == "flippedTile" || cardsShown == 2) {
		return;
	}
	
	this.className = "flippedTile";
	activeCard = this.id;
	
	$.ajax({
		type: "GET",
		url: '/memory/card',
		dataType:'text',
		success:function(data){
			displayCard(data);
		},
		data:"username=" + localStorage.getItem("user") + "&row=" + this.dataset.row + "&column=" + this.dataset.column
	});
}

function displayCard(data){
	//handles the logic for showing the contents of the cards
	//this is essentially the gameplay function - all the logic for r2.6 is in here
	var currSpan = document.getElementById(activeCard + "s");
	currSpan.innerHTML = data;
	cardsShown += 1;
	
	if (cardsShown > 1) {
		var prevSpan = document.getElementById(priorCard + "s")
		if (currSpan.innerHTML == prevSpan.innerHTML) {
			guessesMade += 1;
			cardsRemaining -= 2;
			cardsShown = 0;
			activeCard = "";
			priorCard = "";
			
			if (cardsRemaining == 0) {
				var winText = document.getElementById("victory");
				victory.innerHTML = "YOU WON! It took you " + guessesMade + " guesses!";
				setTimeout(newGamePlus, 7000);
			}
		}
		else {
			guessesMade += 1;
			setTimeout(cardHider, 2500);
		}
	}
	else if (cardsShown == 1) {
		priorCard = activeCard;
	}
}

function cardHider(){
	//just flips the cards back over if they don't match (and 2.5 seconds have elapsed)
	var card1 = document.getElementById(activeCard);
	var card2 = document.getElementById(priorCard);
	card1.className = "tile";
	card2.className = "tile";
	cardsShown = 0;
}

function newGamePlus(){
	//after giving the user 7 seconds to bask in their victory, this function gets called to start the game over
	var cardsRemaining = 0;
	var activeCard = "";
	var priorCard = "";
	var cardsShown = 0;
	var guessesMade = 0;
	var winText = document.getElementById("victory");
	victory.innerHTML = "";
	$("div").remove();
	play(localStorage.getItem("user"), 1);
}
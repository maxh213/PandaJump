// Initialize Phaser, and creates a 400x490px game
var game = new Phaser.Game(400, 490, Phaser.AUTO, 'game_div');
/* 
firstbox is set to false when the first box has passed. This is done because the
score is incremented every time a new box is added and we want to avoid incrementing
the score before the first box and been jumped over. 
*/
var firstbox = true;
/*
secondJump is set to false if a jump hasn't just happened to keep track of
double jumps.
*/
var secondJump = false;

// Creates a new 'main' state that will contain the game
var main_state = {
	
    preload: function() { 
		// Function called first to load all the assets
		
		// Change the background colour of the game
		this.game.stage.backgroundColor = '#71c5cf';
		// Loads the sprite sheet for the panda character
		this.game.load.spritesheet('panda', 'assets/Panda.png', 20, 20.97, 34);
		
		// Loads images to be used in the game
		this.game.load.image('box', 'assets/dirt_06.png');	
		this.game.load.image('ground', 'assets/rock_06.png');
		this.game.load.image('grass', 'assets/top_grass_01.png');
		this.game.load.image('cloud', 'assets/cloud_02.png');
		
    },

    create: function() { 
		
		// Declares the panda character sprite and adds it to the game at 100,245
		this.panda = game.add.sprite(100, 245, 'panda');
		//	Scales the panda sprite by 1.25
		this.panda.scale.x = 1.25; 
		this.panda.scale.y = 1.25;
		
		// Adds an animation called 'run' to the panda sprite and specifies the frames in the sprite sheet to use.
		this.panda.animations.add('run',[17,18,19,20,21,22],6,true);
		
		// Calls the jump function when it detects mouse or finger input
		this.game.input.onDown.add(this.jump, this);
		
		//  This starts the run animation at 15 frames per second.
		// 	true because we want the animation to loop
		this.panda.animations.play('run', 15, true);
		
		this.panda.body.collideWorldBounds=true;
		this.panda.body.gravity.y = 1000;
		this.panda.body.bounce.y = 0.1;
		
		//creates a group of 20 boxes
		this.boxes = game.add.group();  
		this.boxes.createMultiple(20, 'box');
		
		//adds a timer to call the add_row_of_boxes function every 1500
		this.boxTimer = this.game.time.events.loop(1500, this.add_row_of_boxes, this); 
		
		// Creates a group of ground tiles and calls floor_loop to add them to the game
		// These ground times wont move and are there to stop the panda falling through the floor animation
		this.groundtiles = game.add.group();
		this.groundtiles.createMultiple(20, 'ground');
		this.floor_loop();
		// Creates a group of ground tiles and calls floor_loop_moving to add them
		// These ground tiles will not collide with anything and will be displayed over the
		// original ground tiles to give the illusion that the floor's moving
		this.groundtilesAnimation = game.add.group();
		this.groundtilesAnimation.createMultiple(20, 'ground');
		this.floor_loop_moving();
		// Creates a group of grass tiles and calls grass_loop_moving to add them
		// Is for aesthetic purpose and acts near identically to groundtilesAnimation
		this.grassAnimation = game.add.group();
		this.grassAnimation.createMultiple(20, 'grass');
		this.grass_loop_moving();
		// Creates a group of clouds and calls first_cloud_add to add the first one
		this.cloudAnimation = game.add.group();
		this.cloudAnimation.createMultiple(20, 'cloud');
		this.first_cloud_add();
		// Calls a method which calls add_one_moving_groundtile and add_one_grass every 300
		this.animationTimer = this.game.time.events.loop(300, this.add_one_animation, this); 
		// Calls a method to create a cloud after a random amount of time generated by cloudVolumeDecider
		var cloudVolumeDecider = Math.floor(Math.random()*42000)+50000;
		this.cloudTimer = this.game.time.events.loop(cloudVolumeDecider, this.add_one_moving_cloud, this);
		// Initialises the score for the current game and the score labels
		this.score = 0;  
		var style = { font: "30px Arial", fill: "#ffffff" };  
		this.label_score = this.game.add.text(20, 20, "0", style); 
		this.highScore = "High Score: " + this.get_score();
		this.label_high_score = this.game.add.text(20, 450, this.highScore, style);
		
    },
    update: function() {
		// The update function is called 60 times per second
		
		//checks if the panda collides with a box and if so restarts the game
		this.game.physics.overlap(this.panda, this.boxes, this.restart_game, null, this);
		//makes it so the panda collides with the groundtiles
		this.game.physics.collide(this.panda, this.groundtiles, null, null, this);
		//moves the cloud in an up or down direction randomly, making it imitate wind by bobbing up and down
		if (Math.random() > 0.5) {
			if (Math.random() > 0.9) {
				var cloud = this.cloudAnimation.getFirstAlive();
				if (Math.random() > 0.5) {
					cloud.body.velocity.y = +3; 
				} else {
					cloud.body.velocity.y = -3; 
				}
			}
		}
		
	},
	jump: function() {  
		// Add a vertical velocity to the animal
		// if the panda is between 390,470 y co-ordinates it's ok for the panda to jump because it's on the groundtile
		if (this.panda.position.y > 390 && this.panda.position.y < 470) {
			this.panda.body.velocity.y = -580;
			secondJump = true;
			//can only double jump after the first jump
		} else if (secondJump === true) {
			this.panda.body.velocity.y = -250;
			secondJump = false;
		}
	},
	restart_game: function() {  
		// Start the 'main' state, which restarts the game
		// saves the high score and re initialises some variables and timers
		this.set_score(this.score);
		this.game.state.start('main');
		this.game.time.events.remove(this.boxTimer);  
		this.game.time.events.remove(this.animationTimer);  
		this.game.time.events.remove(this.cloudTimer);
		firstbox = true;
		
	},	
	add_one_box: function(x, y) {  
		// Get the first dead box of our group
		var box = this.boxes.getFirstDead();

		// Set the new position of the box
		box.reset(x, y);

		// Add velocity to the box to make it move left
		box.body.velocity.x = -200; 

		// Kill the box when it's no longer visible 
		box.outOfBoundsKill = true;
	},
	add_row_of_boxes: function() {
		// generates the the amount of boxes randomly with a decreasing likelihood based off the difficulty of the jump
		var boxHeight = Math.floor(Math.random()*2)+1;
		var cheapboxDecider = Math.floor(Math.random()*3)+1;
		// doesn't increase the score when the first box has been added because it hasn't yet been jumped over
		if (!firstbox) {
			this.score += 1;
		} else {
			firstbox = false;
		}
		// updates the current score label
		this.label_score.content = this.score; 
		for (var i = 0; i < boxHeight; i++) {
			// 1st value in the second brackets is 490 - the sprite height and the ground tile, the 2nd is i*the sprite height!
			this.add_one_box(400, (362 - i*64));
		}
		if (cheapboxDecider == 2 && this.score > 10) {
			for (var i = 0; i < boxHeight; i++) {
				// 1st value in the second brackets is 490 - the sprite height and the ground tile, the 2nd is i*the sprite height!
				this.add_one_box(464, (362 - i*64));
			}
		}
	},
	add_one_groundtile: function(x, y) {  
		// This is for the immovable layer of ground tiles hidden bellow the animation of moving ground tiles
		// Get the first dead box of our group
		var groundtile = this.groundtiles.getFirstDead();
		groundtile.body.immovable = true;
		groundtile.body.allowGravity = false;

		// Set the new position of the box
		groundtile.reset(x, y);
	},
	floor_loop: function() {
		for (var i = 0; i < 1000; i += 64) {
			this.add_one_groundtile(i,426);
		}
	},
	add_one_animation: function() {
		this.add_one_moving_groundtile();
		this.add_one_moving_grass();
	},
	add_one_moving_groundtile: function() {  
		/*
			This places a groundtile after the right edge of the screen to move across
			the screen to the left to give the illusion the panda's moving
		*/
		// Get the first dead groundtile of our group
		var groundtileMover = this.groundtilesAnimation.getFirstDead();
		// Set the new position of the groundtile
		//390 should be 400 but -10 pixel otherwise there's a gap if the animation lags
		groundtileMover.reset(390, 426);
		// set the velocity of the groundtile
		groundtileMover.body.velocity.x = -200; 
		// Kill the box when it's no longer visible 
		groundtileMover.outOfBoundsKill = true;
	},
	add_one_moving_groundtile2: function(x, y) {  
		/*
			Sets a groundtile at (x,y) co-ordinates. This is used by the floor_loop_moving
			function to add moving ground tiles at the start of the program because otherwise
			there will be none there before add_one_moving_groundtile is called
		*/
		// Get the first dead box of our group
		var groundtileMover = this.groundtilesAnimation.getFirstDead();
		// Set the new position of the box	
		groundtileMover.reset(x, y);
		// Add velocity to the box to make it move left
		groundtileMover.body.velocity.x = -200; 
		// Kill the box when it's no longer visible 
		groundtileMover.outOfBoundsKill = true;
	},
	floor_loop_moving: function() {
		for (var i = 0; i < 1000; i += 64) {
			this.add_one_moving_groundtile2(i,426);
		}
	},
	add_one_moving_grass: function() {  
		/*
			This places grass after the right edge of the screen to move across
			the screen to the left to give the illusion the panda's moving
		*/
		// Get the first dead grass of our group
		var grassMover = this.grassAnimation.getFirstDead();
		// Set the new position of the grass
		grassMover.reset(390, 392);
		// Add velocity to the grass to make it move left
		grassMover.body.velocity.x = -200; 
		// Kill the grass when it's no longer visible 
		grassMover.outOfBoundsKill = true;
	},
	add_one_moving_grass2: function(x, y) {  
		/*
			Sets some grass at (x,y) co-ordinates. This is used by the grass_loop_moving
			function to add moving grass at the start of the program because otherwise
			there will be none there before add_one_moving_grass is called
		*/
		// Get the first dead grass of our group
		var grassMover = this.grassAnimation.getFirstDead();
		// Set the new position of the grass
		grassMover.reset(x, y);
		// Add velocity to the grass to make it move left
		grassMover.body.velocity.x = -200; 
		// Kill the grass when it's no longer visible 
		grassMover.outOfBoundsKill = true;
	},
	grass_loop_moving: function() {
		for (var i = 0; i < 1000; i += 64) {
			this.add_one_moving_grass2(i,392);
		}
	},
	add_one_moving_cloud2: function(x, y) {  
		// Sets a cloud at the (x,y) co-ordinates.
		// Get the first dead cloud of our group
		var cloudMover = this.cloudAnimation.getFirstDead();
		// Set the new position of the cloud
		cloudMover.reset(x, y);
		// Add velocity to the cloud to make it move left
		cloudMover.body.velocity.x = -5; 
		// Kill the cloud when it's no longer visible 
		cloudMover.outOfBoundsKill = true;
	},
	first_cloud_add: function() {
			// Adds the first cloud at between 30 and 60y, and between 200 and 350x
			var firstCloudLocationDecider = Math.floor((Math.random()*150)+200);
			var firstCloudLocationDecider2 = Math.floor((Math.random()* 30)+ 30);
			this.add_one_moving_cloud2(firstCloudLocationDecider,firstCloudLocationDecider2);
	},
	get_score: function() {
		// returns the saved high score
		var score = 0;
		var scoreCheck = localStorage.getItem("highScore");
		//if there is no saved score then the score = 0
		if (scoreCheck === null || scoreCheck == "null"){
			score = 0;
		} else {
			score = parseInt(scoreCheck);
		}
		return score;
	},
	set_score: function(score) {
		//sets the score as the new high score if it's higher than the previous high score
		var highScore = localStorage.getItem("highScore");
		if (score > highScore) {
			localStorage.setItem("highScore", score);
		}
	},
};

// Add and start the 'main' state to start the game
game.state.add('main', main_state);  
game.state.start('main'); 
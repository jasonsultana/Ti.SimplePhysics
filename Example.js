function Example() {
	var World = require("ui/common/World");
	
	//Note: all units must be numeric. No percentages or other string unit types are supported.
	var self = Ti.UI.createView({ 
		height: Ti.Platform.displayCaps.platformHeight,
		width: Ti.Platform.displayCaps.platformWidth,
		
		gravity: 1,		//!<- Required. The force of gravity to apply. Must be a whole number.
		frameRate: 33   //!<- Required. The frame rate - how often objects should be updated. Must be a whole number.
	});
	
	//First, create a world and pass the parent view to it. This view will contain all other Things in the World.
	var world = new World(self);
	
	//Call addThing for each object you want to add to the World. This will include players, NPCs, enemies, objects and basically anything you want to apply physics to.
	//The argument is a Titanium view with some extra attributes.
	world.addThing(Ti.UI.createView({
		name: "player",		//!<- required. A unique name to identify this Thing with. It'll be handy later when checking for collisions.
		
		//!<- Note: All units must be positive and whole numbers. To have offscreen Things, make the World view larger than the screen size and move it. Things can
		//not go outside the bounds of the World without throwing an exception.
		
		left: 10,
		top: 0,
		height: 50,
		width: 50,
		borderRadius: 5,
		
		//!<- Not required, but if left out, velocity attributes will all default to zero. 
		velocity: {
			left: 0,
			top: 0,
			maxLeft: 0,
			maxTop: -6
		},
		type: "animate",	//!<- Required. "animate" for moving objects and "inaminate" for non moving. animate collision detection is posteriori whereas inanimate
							// is priori. 
		
		//!<- required if you want to 'handle' a collision. 
		/*
		 * @obj The object that this Thing collided with. 
		 */
		onCollide: function(obj) {
			
			if(obj.name == "wall1")
				this.velocity.left = 2;
			else if(obj.name == "leftWall")
				this.velocity.left = 2;
			else if(obj.name == "rightWall")
				this.velocity.left = -2;
				
			else if(obj.name == "powerup") {				
				obj.die();					//!< Thing.die will set the Thing as inactive (for optimisation), but it will still exist in the world
				obj.removeFromWorld();		//!< Thing.removeFromWorld will remove the Thing from the World entirely. Only do this if you will never use the Thing again.
			
				this.view.width *= 1.5;
			}
		},
		
		backgroundColor: "red"
	}));
	
	world.addThing(Ti.UI.createView({
		name: "wall1",
		
		left: 0,
		top: 200,
		height: 60,
		width: 200,

		type: "non-animate",
				
		backgroundColor: "blue"
	}));
	
	world.addThing(Ti.UI.createView({
		name: "leftWall",
		
		left: 0,
		top: 0,
		height: self.height,
		width: 5,
		
		type: "non-animate",
		backgroundColor: "blue"
	}));
	
	world.addThing(Ti.UI.createView({
		name: "rightWall",
		
		left: self.width - 5,
		top: 0,
		height: self.height,
		width: 5,
		
		type: "non-animate",
		backgroundColor: "blue"
	}));
	
	world.addThing(Ti.UI.createView({
		name: "powerup",
		
		left: 50,
		top: 300,
		height: 25,
		width: 25,
		
		velocity: {
			left: 1,
			top: 0,
			maxLeft: 0,
			maxTop: 0
		},
		
		type: "animate",
		backgroundColor: "yellow"
	}));
	
	world.addThing(Ti.UI.createView({
		name: "floor",
		
		left: 0,
		top: self.height - 5,
		height: 5,
		width: self.width,
		
		type: "non-animate",
		backgroundColor: "blue"
	}));
	
	world.start();
	
	self.addEventListener("click", function() {
		world.things[0].jump(-10.0);	//!<- jump, with a specified velocity. If not given, a default velocity is used.
	});
	
	return self;
}

module.exports = Example;

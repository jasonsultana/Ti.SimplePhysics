/**
 * @obj A Titanium View that will be the graphic for this Thing
 * @world A reference to the World that contains this Thing
 */
function Thing(obj, world) {
	var self = {};
	Init();
	
	function Init() {
		self.view = obj;
		self.gravity = obj.gravity;
		self.index = obj.index;
		
		self.velocity = {
			left: obj.velocity.left,
			top: obj.velocity.top,
			maxLeft: obj.velocity.maxLeft,
			maxTop: obj.velocity.maxTop
		};
		
		if(obj.active == undefined)
			self.active = true;
		else
			self.active = obj.active;
		
		self.onCollide = obj.onCollide;
		self.type = obj.type; //animate or non-animate
		self.name = obj.name;
		
		self.onGround = false; //assume the selfect is not on the ground yet. Fall until it hits a solid selfect	
	}
	
	//Return the name of the occupying Thing if any pixel the player will occupy in the next frame is occupied by a non-animate object. "0" if there are no collisions
	function checkMap(nextPos, map) {
		for(var x = nextPos.left; x < nextPos.right; x++) {
			for(var y = nextPos.top; y < nextPos.bottom; y++) {
				
				if(map[x][y] != "0")
					return map[x][y];
			}
		}
		
		return "0";
	}
	
	//Find the distance between the sourcePos and the nearest solid pixel on the map that the player will collide with
	function findDistanceToCollision(sourcePos, sourceVelocity, map) {
		var distance = {
			left: 0,
			top: 0
		};
		
		var mapHeight = world.getMapHeight();
		var mapWidth = world.getMapWidth();
		
		//check for a collision on the y axis
		if(sourceVelocity.top > 0) {
			//we are moving down (falling)
			for(var y = sourcePos.bottom; y < mapHeight; y++) {
				if(map[sourcePos.left][y] != "0")
					break;
				else
					distance.top++;
			}
		}
		else if(sourceVelocity.top < 0) {
			//we are moving up (jumping)
			for(var y = sourcePos.top; y >= 0; y--) {
				if(map[sourcePos.left][y] != "0")
					break;
				else
					distance.top--; //we need this to be negative to go backwards
			} 
		}
		
		//now a collision on the x axis
		if(sourceVelocity.left > 0) {
			//we are moving right
			for(var x = sourcePos.right; x < mapWidth; x++) {
				if(map[x][sourcePos.top] != "0")
					break;
				else
					distance.left++;
			}
			
		}
		else if(sourceVelocity.left < 0) {
			//we are moving left
			for(var x = sourcePos.left; x >= 0; x--) {
				if(map[x][sourcePos.top] != "0")
					break;
				else
					distance.left--; //negative to move backwards
			}
		}
		
		return distance;
	}
	
	//Sometimes you don't want to have jumpStart and jumpEnd. Just jump
	self.jump = function(velocity) {
		self.jumpStart(velocity);
	};
	
	//Call self on touch start
	self.jumpStart = function(velocity) {
	    if(self.onGround) {
	        if(velocity != null)
				self.velocity.top = velocity;
			else
				self.velocity.top = -12.0; //default velocity value
			
	        self.onGround = false;
	    }
	};
	
	//Call self on touch end
	self.jumpEnd = function() {
	    if(self.velocity.top < self.velocity.maxTop)
	        self.velocity.top = self.velocity.maxTop;
	};
	
	self.getNextVelocity = function() {
		return {
			left: self.velocity.left,
			top: self.velocity.top + self.gravity,
			maxLeft: self.velocity.maxLeft,
			maxTop: self.velocity.maxTop
		};
	};
	
	self.getNextPosition = function() {
		//var tmpVel = self.getNextVelocity();
		
		return {
			left: self.view.left + self.velocity.left,
			top: self.view.top + self.velocity.top,
			right: self.view.left + self.velocity.left + self.view.width,
			bottom: self.view.top + self.velocity.top + self.view.height
		};
	}; 
	
	//Move the Thing given its updated position. Also handles collision detection with inanimate things.
	self.move = function(currentPos, updatePosX, updatePosY) {
		var map = world.getMap();
		
		//Now do some checks against the map
		var checkMapX = checkMap(updatePosX, map);
		var checkMapY = checkMap(updatePosY, map);
		
		var distance = findDistanceToCollision(currentPos, self.velocity, map); //distance to the next collision
		
		//Test the x axis
		if(checkMapX == "0") {
			self.view.left = updatePosX.left;
		}
		else {
			self.view.left += distance.left; //collide flush with the object
			self.velocity.left = 0;
			
	    	if(self.onCollide != undefined) {
	    		var thing = world.getThingByName(checkMapX); 
	    		
	    		if(thing != -1)
	    			self.onCollide(thing);
	    	}
		}
			
		//Test the y axis
		if(checkMapY == "0") {
			//If we are falling (positive velocity) and there is empty space, we haven't hit the floor yet.
			if(self.velocity.top > 0)
				self.onGround = false;
								
	    	self.view.top = updatePosY.top;
	   	}
	    else {
	    	/*
	    	Ti.API.info("Will land. Pos: " + self.view.left + "," + self.view.top);
	    	Ti.API.info("Distance to landing: " + distance.top);
	    	Ti.API.trace("Updating. Gravity: " + self.gravity + ", Velocity Y: " + self.velocity.top + ", Y: " + self.view.top);
	    	*/
	    	
	    	//Move the sprite flush with the object it will collide with
	    	self.view.top += distance.top;
	    		
	    	//Ti.API.info("Y pos after adjustment: " + self.view.top);
	    	
	    	//we have hit an object and can't fall any more. We're grounded.
	    	if(self.velocity.top > 0)
	    		self.onGround = true; 
	    		
	    	self.velocity.top = 0;
	    	
	    	//If there is a collide event handler, call it
	    	if(self.onCollide != undefined) {
	    		var thing = world.getThingByName(checkMapY); 
	    		
	    		if(thing != -1)
	    			self.onCollide(thing);
	    	}
	    }
	};
	
	self.checkAnimate = function(currentPos) {
		//If there is no onCollide event handler, skip checking.
		if(self.onCollide == undefined)
			return;
		
		for(var i = 0; i < world.things.length; i++) {
			var thingPos = {
				left: world.things[i].view.left,
				right: world.things[i].view.left + world.things[i].view.width,
				top: world.things[i].view.top,
				bottom: world.things[i].view.top + world.things[i].view.height
			};
			
			//https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
		    if (currentPos.left < thingPos.right &&
		        currentPos.right > thingPos.left &&
		        currentPos.top < thingPos.bottom &&
		        currentPos.bottom > thingPos.top) {
		        // collision detected!
				
				self.onCollide(world.things[i]);
		    } 	
		}	
	};
	
	self.update = function() {
		//Don't update non-animate objects
		if(self.type == "non-animate" || !self.active)
			return;
		
		self.velocity = self.getNextVelocity();
		
		//Positional information, including predicted next positions along X and Y
		var currentPos = {
			left: self.view.left,
			right: self.view.left + self.view.width,
			top: self.view.top,
			bottom: self.view.top + self.view.height
		};
		
		var updatePos = self.getNextPosition();
		
		var updatePosX = {
			left: updatePos.left,
			right: updatePos.right,
			top: self.view.top,
			bottom: self.view.top + self.view.height
		};
		
		var updatePosY = {
			left: self.view.left,
			right: self.view.left + self.view.width,
			top: updatePos.top,
			bottom: updatePos.bottom
		};
		
		//Move and check for collisions with inanimate things
		self.move(currentPos, updatePosX, updatePosY);
		
		//And now check for animate collisions
		self.checkAnimate(updatePosX, updatePosY);
	};

	self.die = function() {
		self.active = false;
	};
	
	self.live = function() {
		self.active = true;
	};
	
	self.removeFromWorld = function() {
		world.removeThingFromWorld(self.index);
	};
	
	return self;
}

module.exports = Thing;
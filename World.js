function World(view) {
	var Thing = require("ui/common/Thing");	
	var self = {};
	Init();
	
	function Init() {
		if(view.height == undefined || view.width == undefined) {
			Ti.API.error("Error: View height or width is undefined. These must be defined as numerical values");
			return;
		}
		
		if(view.gravity == undefined) {
			Ti.API.warn("Warning: No gravity defined in the view");
			self.gravity = 0;
		}
			
		if(view.frameRate == undefined) {
			Ti.API.error("Error: No frameRate defined in the view");
			self.frameRate = 0;
			return;	
		}
		
		self.things = [];
		self.gravity = view.gravity;
		self.frameRate = view.frameRate;
		self.map = matrix(view.width, view.height, "0");
		self.isAlive = false;
	}
	
	/**
	 * Create a 2D array given the following arguments.
 * @param {Object} rows The number of rows to create.
 * @param {Object} cols The number of columns to create.
 * @param {Object} defaultValue The default value to apply to each cell.
	 */
	function matrix(rows, cols, defaultValue) {
		var arr = new Array(rows);
		for (var x = 0; x < rows; x++) {
			arr[x] = new Array(cols);
			
			for(var y = 0; y < cols; y++)
				arr[x][y] = defaultValue;
		}	
		
		return arr;
	};
	
	function Loop() {
		if(self.isAlive) {
		    Update();
		    setTimeout(Loop, self.frameRate);    
		}
	}
	
	function Update() {
		//Update each of the objects in the world
		for(var i = 0; i < self.things.length; i++) {
			self.things[i].update(self.map);
		}
	}
	
	self.getThingByName = function(name) {
		for(var i = 0; i < self.things.length; i++) {
			if(self.things[i].name == name) {
				return self.things[i];
			}
		}
		
		return -1;	
	};
	
	self.getThingBy = function(attribute, value) {
		for(var i = 0; i < self.things.length; i++) {
			if(self.things[i][attribute] == value)
				return self.things[i];
		}
		
		return -1;
	};
	
	self.getThingsBy = function(attribute, value) {
		var rtn = [];
		
		for(var i = 0; i < self.things.length; i++) {
			if(self.things[i][attribute] == value)
				rtn.push(self.things[i]);
		}		
		
		return rtn;
	};
	
	self.addThing = function(obj) {
		//An object needs a name
		if(obj.name == undefined) {
			Ti.API.error("Error: Thing is missing a 'name' attribute. Skipping");
			return;
		}
		
		//Dimensions can not be fractional, can't be negative and can't be outside the bounds of the world view
		var dims = ['left', 'top', 'width', 'height'];
		for(var i = 0; i < dims.length; i++) {
			if(obj[dims[i]] % 1 != 0) {
				Ti.API.error("Error: " + obj.name + "." + dims[i] + " can not be fractional. Skipping");
				return;
			}
			
			if(obj[dims[i]] < 0) {
				Ti.API.error("Error: " + obj.name + "." + dims[i] + " can not be negative. To support offscreen Things, create a world view with dimensions greater than the device screen. Skipping");
				return;				
			}
		}
		
		if(obj.left + obj.width > view.width) {
			Ti.API.error("Error: " + obj.name + " total width can not exceed the bounds of the world view. Skipping");
			return;
		}
		
		if(obj.top + obj.height > view.height) {
			Ti.API.error("Error: " + obj.name + " total height can not exceed the bounds of the world view. Skipping");
			return;		
		}
		
		//If the object has no velocity, set it to defaults here.
		if(obj.velocity == undefined) {
			obj.velocity = {
				left: 0,
				top: 0,
				maxLeft: 0,
				maxTop: 0
			};
		}
		
		//Velocity also can not be fractional
		var dims = ['left', 'top', 'maxLeft', 'maxTop'];
		for(var i = 0; i < dims.length; i++) {
			if(obj.velocity[dims[i]] % 1 != 0) {
				Ti.API.error("Error: " + obj.name + ".velocity." + dims[i] + " can not be fractional. Skipping");
				return;				
			}
		}
		
		//Things seem okay. Now, add the object.
		obj.gravity = self.gravity;
		obj.index = self.things.length;
				
		self.things.push(new Thing(obj, self));
		view.add(self.things[self.things.length-1].view);

		//Set the object's position in the map
		if(obj.type == "non-animate") {
			for(var x = obj.left; x < obj.left + obj.width; x++) {
				for(var y = obj.top; y < obj.top + obj.height; y++) {
					self.map[x][y] = obj.name;
				}
			}
		}
	};
	
	self.start = function() {
		self.isAlive = true;
		Loop();
	};
	
	self.stop = function() {
		self.isAlive = false;
	};
	
	self.traceMap = function() {
		var output = "";
		
		for(var y = 0; y < view.height; y++) {
			output += y + ": ";
			
			for(var x = 0; x < view.width; x++) {
				if(self.map[x][y] != "0")
					output += "X";
				else
					output += "O";
			}
			
			output += "\r\n";
		}	
		
		Ti.API.trace(output);
	};
	
	self.getMapHeight = function() {
		return view.height;
	};
	
	self.getMapWidth = function() {
		return view.width;
	};
	
	self.getMap = function() {
		return self.map;
	};
	
	self.removeThingFromWorld = function(index) {
		view.remove(self.things[index].view);
		self.things.splice(index, 1);
	};
	
	return self;
}

module.exports = World;
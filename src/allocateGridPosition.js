value: function(x, y, station, lastStation, line, progression, direction){
  //function to allocate the grid position for the current station
  //when allocating a grid position for a station we need to accommodate for how much space we need for the label as well
  var lastDirection = direction || 6;
  direction = progression==1 ? 6 : 4; //if we don't have a direction (like on a new line with no share stations) we'll start by trying to go right or left
  var suitableAllocationFound = false;
  var tries = 0;
  var requiredAllocation = station.label.hCount + 1;
  var potentialAllocation;
  // var potentialAllocationDistance = line.longestStation || 10;
  var xAllocation;
  var yAllocation;
  var potentialAllocationDistance = this.longestLabelAllocation || 10;
  var restart = false;
  var startCell = this.grid[x][y];
  var labelTry = 0;
  var iteration = 1;
  var iterationTries = 0;
  var directionsTried = [];
  while(!suitableAllocationFound && tries < 1000){  //hopefully we don't reach 1000 tries but just in case
    tries++;
    iterationTries++;
    restart = false;
    var hIndex = 0, vIndex = 0;
    switch (direction) {
      case 2: //up
        vIndex = -1;
        break;
      case 4: //left
        hIndex = -1;
        break;
      case 6: //right
        hIndex = 1;
        break;
      case 8: //down
        vIndex = 1;
        break;
      default:
    }
    var startX = x+((iterationTries*iteration)*hIndex), startY = y+((iterationTries*iteration)*vIndex);
    var reservedCells = [];
    //start by finding a free cell for the station. we don't want to go further than 8 cells away
    // for (var i=0;i<potentialAllocationDistance;i++){
      // var potX = startX+(hIndex*i)+((potentialAllocationDistance-1)*hIndex), potY = startY+(vIndex*i)+((potentialAllocationDistance-1)*vIndex)
      var potX, potY;
      potX = x + (hIndex*1);
      potY = y + (vIndex*1);
      if(lastStation){
        potX += (hIndex*lastStation.xSpace);
        if(direction==2){
          potY += (vIndex*Math.max(lastStation.ySpace, lastStation.xSpace));
        }
      }
      if(direction==8){
        if(lastStation){
          potY+=Math.round(this.longestLabelAllocation * (lastStation.distanceToNext / this.shortestDistance));
        }
        else{
          potY += Math.round(this.longestLabelAllocation * (station.distanceToNext / this.shortestDistance));
        }
      }
      if(!this.grid[potX]){
        this.grid[potX] = {};
      }
      if(!this.grid[potX][potY]){
        this.createNewGridCell(potX, potY);
      }
      if(this.grid[potX][potY] && !this.grid[potX][potY].occupied){
        potentialAllocation = this.grid[potX][potY];
        // break;
      }
      else if(this.grid[potX][potY] && this.grid[potX][potY].occupied){
        if(this.grid[potX][potY].item!="blocked"){
          potentialAllocation = null;
          // break;
        }
      }
    // }
    // if(potentialAllocation && iterationTries < potentialAllocationDistance){
    if(potentialAllocation){
      labelTry++;
      var needToChangeDirection = false, keepgoing = true;
      xAllocation = this.longestLabelAllocation;
      yAllocation = this.longestLabelAllocation;

      if(direction==2 || direction==8){
        yAllocation = Math.round(this.longestLabelAllocation * (station.distanceToNext / this.shortestDistance));
      }
      else if (direction==4 || direction==6) {
        xAllocation = Math.round(this.longestLabelAllocation * (station.distanceToNext / this.shortestDistance));
      }
      //we have a potentialAllocation, we need to make sure there's clearance to the side in case we go in that direction next
      if(direction==4||direction==6){
        for(var i=1;i<xAllocation+1;i++){
          if(!this.grid[potentialAllocation.h+(i*hIndex)]){
            this.grid[potentialAllocation.h+(i*hIndex)] = {};
          }
          if(!this.grid[potentialAllocation.h+(i*hIndex)][potentialAllocation.v]){
            this.createNewGridCell(potentialAllocation.h+(i*hIndex), potentialAllocation.v);
          }
          if(this.grid[potentialAllocation.h+(i*hIndex)][potentialAllocation.v] && this.grid[potentialAllocation.h+(i*hIndex)][potentialAllocation.v].occupied){
            potentialAllocation = null;
            keepgoing = false;
            restart = true;
            break;
          }
        }
      }
      else{
        for(var i=1;i<yAllocation+1;i++){
          if(!this.grid[potentialAllocation.h]){
            this.grid[potentialAllocation.h] = {};
          }
          if(!this.grid[potentialAllocation.h][potentialAllocation.v+(i*vIndex)]){
            this.createNewGridCell(potentialAllocation.h, potentialAllocation.v+(i*vIndex));
          }
          if(this.grid[potentialAllocation.h][potentialAllocation.v+(i*vIndex)] && this.grid[potentialAllocation.h][potentialAllocation.v+(i*vIndex)].occupied){
            potentialAllocation = null;
            keepgoing = false;
            restart = true;
            break;
          }
        }
      }
      if(keepgoing){
        //now we need to see if the label will fit as well
        var labelY = potentialAllocation.v-1, labelX = potentialAllocation.h+1;
        for(var v=0;v<this.longestLabelAllocation;v++){
          for(var h=0;h<this.longestLabelAllocation;h++){
            if(!this.grid[labelX+h]){
              this.createNewGridCell(labelX+h, labelY-v);
            }

            if(this.grid[labelX+h][labelY-v] && this.grid[labelX+h][labelY-v].occupied){
              //then the potential allocation won't work so we move on
              potentialAllocation = null;
              restart = true;
              break;
            }
            else{
              if(!this.grid[labelX+h][labelY-v]){
                this.createNewGridCell(labelX+h,labelY-v);
              }
              reservedCells.push(this.grid[labelX+h][labelY-v]);
              if(v==this.longestLabelAllocation-1 && h==this.longestLabelAllocation-1){
                //we have space for the label and the station
                if(this.debug){
                  console.log("Using cells for "+station.name);
                }
                if(lastStation){
                  //connect the dots back to the last station if we're going up
                  if(direction==2){
                    var dotCount = lastStation.vSpace;
                    for(var i=0;i<dotCount+1;i++){
                      this.useCell(potentialAllocation.h,potentialAllocation.v+i, "blocked");
                    }
                  }
                }
                for(var i=1;i<this.longestLabelAllocation+1;i++){
                  if(this.debug){
                    console.log("Blocking cells for "+station.name);
                  }
                  this.useCell(potentialAllocation.h+i,potentialAllocation.v, "blocked");
                }
                for(var i=1;i<this.longestLabelAllocation+1;i++){
                  if(this.debug){
                    console.log("Blocking cells for "+station.name);
                  }
                  this.useCell(potentialAllocation.h,potentialAllocation.v-i, "blocked");
                }
                this.useCell(potentialAllocation.h, potentialAllocation.v, "station");
                for(var r=0;r<reservedCells.length;r++){
                  this.useCell(reservedCells[r].h, reservedCells[r].v, "label");
                }
                station.gridLoc = potentialAllocation;
                station.xSpace = xAllocation;
                station.ySpace = yAllocation;
                station.labelLoc = reservedCells[0];
                suitableAllocationFound = true;
                return direction;
              }
            }
          }
          if(restart){
            restart = false;
            changeDirection.call(this);
            break;
          }
        }
      }
      else{
        if(restart){
          restart = false;
        }
        changeDirection.call(this);
      }
    }
    else{
      changeDirection.call(this);
    }
  }

  function changeDirection(){
      directionsTried.push(direction);
      switch (direction) {
        case 2: //up
        case 8: //down
          direction = progression==-1?4:6;
            break;
        case 4: //left
        case 6: //right
          //at this point we probably want to see where we have more space
          direction = this.lastVerticalDirection==2?8:2;
          this.lastVerticalDirection = direction;
          break;
        default:

      }
      if(directionsTried.length==3){  //we've tried left/right and up/down
        iteration++;
        iterationTries = 0;
        directionsTried = [];
      }
  }
}

$(function () {
  // initialize canvas and context when able to
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  window.addEventListener("load", loadJson);

  function setup() {
    if (firstTimeSetup) {
      halleImage = document.getElementById("player");
      projectileImage = document.getElementById("projectile");
      cannonImage = document.getElementById("cannon");
      $(document).on("keydown", handleKeyDown);
      $(document).on("keyup", handleKeyUp);
      firstTimeSetup = false;
      //start game
      setInterval(main, 1000 / frameRate);
    }

    // Create walls - do not delete or modify this code
    createPlatform(-50, -50, canvas.width + 100, 50); // top wall
    createPlatform(-50, canvas.height - 10, canvas.width + 100, 200, "navy"); // bottom wall
    createPlatform(-50, -50, 50, canvas.height + 500); // left wall
    createPlatform(canvas.width, -50, 50, canvas.height + 100); // right wall

    //////////////////////////////////
    // ONLY CHANGE BELOW THIS POINT //
    //////////////////////////////////

    // TODO 1 - Enable the Grid
    toggleGrid(true);


    // TODO 2 - Create Platforms
    createPlatform(400, 620, 400, 10, "red");
    createPlatform(100, 500, 200, 10, "red")
    createPlatform(600, 180, 10, 700, "red")
    createPlatform(100, 0, 10, 500, "red")
    createPlatform(400, 390, 400, 10, "red")
    createPlatform(400, 180, 400, 10, "red")
    createPlatform(100, 290, 200, 10, "red")
    createPlatform(1100, 0, 10, 620, 'red')
    createPlatform(900, 290, 200, 10, "red")
    createPlatform(900, 490, 200, 10, "red")
    createPlatform(1100, 620, 100, 10, "red")
    createPlatform(1300, 490, 100, 10, "red")
    createPlatform(1100, 390, 100, 10, "red")
    createPlatform(1300, 290, 100, 10, "red")
    createPlatform(1100, 190, 100, 10, "red")



    // TODO 3 - Create Collectables
    createCollectable("diamond", 530, 680)
    createCollectable("diamond", 130, 70)
    createCollectable("diamond", 1030, 430)
    createCollectable("diamond", 1130, 120)


    
    // TODO 4 - Create Cannons
    createCannon("top", 400, 1000, 80, 80)
    createCannon("left", 50, 900, 60, 60)
    createCannon("bottom", 800, 900, 80, 80)
    createCannon("top", 1300, 900, 80, 80)
    createCannon("right", 780, 2000, 60, 60)

    
    
    //////////////////////////////////
    // ONLY CHANGE ABOVE THIS POINT //
    //////////////////////////////////
  }

  registerSetup(setup);
});

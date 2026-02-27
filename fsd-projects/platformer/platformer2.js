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
    createPlatform(-50, canvas.height - 10, canvas.width + 100, 200, "rgb(43, 107, 190)"); // bottom wall
    createPlatform(-50, -50, 50, canvas.height + 500); // left wall
    createPlatform(canvas.width, -50, 50, canvas.height + 100); // right wall

    //////////////////////////////////
    // ONLY CHANGE BELOW THIS POINT //
    //////////////////////////////////

    // TODO 1 - Enable the Grid
    toggleGrid()

    // TODO 2 - Create Platforms
    createPlatform(300, 200, 10, 530, "rgb(70, 43, 190)")
    createPlatform(200, 620, 10, 10, "rgb(70, 43, 190)")
    createPlatform(90, 490, 10, 10, "rgb(70, 43, 190)")
    createPlatform(200, 360, 10, 10, "rgb(70, 43, 190)")
    createPlatform(0, 230, 20, 10, "rgb(70, 43, 190)")
    createPlatform(310, 590, 120, 10, "rgb(70, 43, 190)")
    createPlatform(430, 200, 10, 400, "rgb(70, 43, 190)")
    createBadPlatform(310, 580, 120, 10, "rgb(43, 107, 190)")
    createPlatform(400, 500, 30, 10, "rgb(70, 43, 190)")
    createPlatform(310, 390, 10, 10, "rgb(70, 43, 190)")
    createPlatform(420, 260, 10, 10, "rgb(70, 43, 190)")
    createPlatform(100, 720, 100, 10,  "rgb(70, 43, 190)")
    createBadPlatform(0, 730, 1400, 10, "rgb(43, 107, 190)")
    createBadPlatform(440, 440, 750, 20, "rgb(43, 107, 190)")
    createFakePlatform(0, 490, 90, 10, "rgb(75, 46, 205)")
    createFakePlatform(210, 620, 90, 10, "rgb(75, 46, 205)")
    createFakePlatform(210, 360, 90, 10, "rgb(75, 46, 205)")
    createPlatform(90, 230, 10, 10, "rgb(70, 43, 190)")
    createFakePlatform(20, 230, 70, 10, "rgb(75, 46, 205)")
    createPlatform(550, 320, 23, 10, "rgb(70, 43, 190)")
    createPlatform(700, 400, 23, 10, "rgb(70, 43, 190)")
    createPlatform(850, 400, 23, 10, "rgb(70, 43, 190)")
    createPlatform(1000, 400, 23, 10, "rgb(70, 43, 190)")
    createPlatform(1150, 400, 23, 10, "rgb(70, 43, 190)")
    createPlatform(1280, 290, 23, 10, "rgb(70, 43, 190)")
    createPlatform(1100, 170, 23, 10, "rgb(70, 43, 190)")
    createPlatform(970, 170, 23, 10, "rgb(70, 43, 190)")
    createPlatform(840, 170, 23, 10, "rgb(70, 43, 190)")
    createPlatform(440, 460, 750, 10, "rgba(0, 0, 0, 0)")
    createBadPlatform(1300, 440, 100, 20, "rgb(43, 107, 190)")

    // TODO 3 - Create Collectables
    createCollectable("blueGem", 20, 20)
    createCollectable("blueGem", 390, 460)
    createCollectable("blueGem", 760, 250, 0.3, 1)
    createCollectable("blueGem", 830, 120)


    
    // TODO 4 - Create Cannons
    createCannon("bottom", 500, 700, 50, 50, 580, 1300, 140)
    
    
    
    //////////////////////////////////
    // ONLY CHANGE ABOVE THIS POINT //
    //////////////////////////////////
  }

  registerSetup(setup);
});
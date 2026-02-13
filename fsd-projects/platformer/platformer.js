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
    createPlatform(-50, canvas.height - 10, canvas.width + 100, 200, "purple"); // bottom wall
    createPlatform(-50, -50, 50, canvas.height + 500); // left wall
    createPlatform(canvas.width, -50, 50, canvas.height + 100); // right wall

    //////////////////////////////////
    // ONLY CHANGE BELOW THIS POINT //
    //////////////////////////////////

    // TODO 1 - Enable the Grid

    // TODO 2 - Create Platforms
    createPlatform(400, 620, 400, 10, "rgb(161, 32, 82)");
    createPlatform(0, 500, 400, 10, "rgb(161, 32, 82)");
    createPlatform(600, 180, 10, 450, "rgb(161, 32, 82)");
    createPlatform(200, 390, 600, 10, "rgb(161, 32, 82)");
    createPlatform(200, 180, 300, 10, "rgb(161, 32, 82)");
    createPlatform(100, 290, 300, 10, "rgb(161, 32, 82)");
    createPlatform(1100, 0, 10, 620, "rgb(161, 32, 82)");
    createPlatform(900, 290, 200, 10, "rgb(161, 32, 82)");
    createPlatform(900, 490, 200, 10, "rgb(161, 32, 82)");
    createPlatform(1100, 620, 100, 10, "rgb(161, 32, 82)");
    createPlatform(1300, 490, 100, 10, "rgb(161, 32, 82)");
    createPlatform(1100, 390, 100, 10, "rgb(161, 32, 82)");
    createPlatform(1300, 290, 100, 10, "rgb(161, 32, 82)");
    createPlatform(1100, 190, 100, 10, "rgb(161, 32, 82)");
    createPlatform(800, 620, 10, 150, "rgb(161, 32, 82)");
    createBadPlatform(430, 739, 10, 20, "rgb(163, 60, 163)");
    createBadPlatform(500, 500, 100, 10, "rgb(163, 60, 163)");
    createBadPlatform(0, 400, 100, 10, "rgb(163, 60, 163)")
    createBadPlatform(500, 290, 100, 10, "rgb(163, 60, 163)")
    createFakePlatform(500, 180, 100, 10, "rgb(186, 35, 93)")
    createPlatform(610, 180, 190, 10, "rgb(161, 32, 82)")
    createBadPlatform(190, 180, 10, 10, "rgb(163, 60, 163)")
    createFakePlatform(0, 290, 100, 10, "rgb(186, 35, 93)")
    createBadPlatform(800, 180, 10, 10, "rgb(163, 60, 163)")


    // TODO 3 - Create Collectables
    createCollectable("purpleDiamond", 730, 680)
    createCollectable("purpleDiamond", 130, 70)
    createCollectable("purpleDiamond", 1030, 430)
    createCollectable("purpleDiamond", 1130, 120)


    
    // TODO 4 - Create Cannons
    createCannon("top", 500, 1600, 60, 60);
    createCannon("left", 50, 1500, 60, 60);
    createCannon("bottom", 800, 1300, 60, 60);
    createCannon("top", 1300, 1100, 60, 60);
    createCannon("right", 780, 2000, 60, 60);

    
    
    //////////////////////////////////
    // ONLY CHANGE ABOVE THIS POINT //
    //////////////////////////////////
  }

  registerSetup(setup);
});

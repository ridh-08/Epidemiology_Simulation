let population = [];
let infectionRateSlider, recoveryRateSlider, populationSizeSlider, initialInfectionSlider, reinfectionDelaySlider, speedSlider;
let infectionRate, recoveryRate, populationSize, initialInfection, reinfectionDelay, speed;
let pauseButton, resetButton, downloadButton;
let simulationPaused = false;

let infectedCount = 0;
let recoveredCount = 0;
let susceptibleCount = 0;
let history = [];
let loggedData = []; // Array to store logged data for download
let statsLogInterval = 60; // Log statistics every 60 frames (1 second at 60 FPS)

let recoveryDelay = 500; // Time in frames for infected to recover

function setup() {
  createCanvas(windowWidth, windowHeight); // Adjust canvas size dynamically

  // Create sliders for infection rate, recovery rate, population size, initial infection, and movement speed
  infectionRateSlider = createSlider(0, 1, 0.1, 0.01);
  infectionRateSlider.position(10, 10);

  recoveryRateSlider = createSlider(0, 1, 0.1, 0.01);
  recoveryRateSlider.position(10, 40);

  populationSizeSlider = createSlider(10, 200, 100, 1);
  populationSizeSlider.position(10, 70);

  initialInfectionSlider = createSlider(1, 50, 5, 1);
  initialInfectionSlider.position(10, 100);

  reinfectionDelaySlider = createSlider(500, 5000, 2000, 100);
  reinfectionDelaySlider.position(10, 130);

  speedSlider = createSlider(0.5, 5, 1, 0.1);
  speedSlider.position(10, 160);

  // Create pause, reset, and download buttons
  pauseButton = createButton('Pause');
  pauseButton.position(10, 190);
  pauseButton.mousePressed(togglePause);

  resetButton = createButton('Reset');
  resetButton.position(80, 190);
  resetButton.mousePressed(resetSimulation);

  downloadButton = createButton('Download Data');
  downloadButton.position(150, 190);
  downloadButton.mousePressed(downloadData);

  // Initialize population based on slider values
  initializePopulation();
}

function initializePopulation() {
  population = [];
  populationSize = populationSizeSlider.value();
  initialInfection = initialInfectionSlider.value();

  for (let i = 0; i < populationSize; i++) {
    let person = new Person(random(width), random(height - 180)); // Reserve bottom for graph and stats
    population.push(person);
  }

  // Infect the initial number of people
  for (let i = 0; i < initialInfection; i++) {
    population[i].state = 'infected';
    population[i].infectionTime = frameCount;
  }

  history = []; // Reset history
  loggedData = []; // Reset logged data
  loggedData.push('Time (s), Susceptible, Infected, Recovered'); // CSV header
}

function togglePause() {
  simulationPaused = !simulationPaused;
  if (simulationPaused) {
    pauseButton.html('Resume');
  } else {
    pauseButton.html('Pause');
  }
}

function resetSimulation() {
  initializePopulation(); // Reinitialize the population
  simulationPaused = false;
  pauseButton.html('Pause'); // Reset the pause button label
}

function draw() {
  if (!simulationPaused) {
    background(255);

    // Update slider values
    infectionRate = infectionRateSlider.value();
    recoveryRate = recoveryRateSlider.value();
    reinfectionDelay = reinfectionDelaySlider.value();
    speed = speedSlider.value();

    // Display slider labels and values
    textSize(14);
    text("Infection Rate: " + nf(infectionRate, 1, 2), 160, 25);
    text("Recovery Rate: " + nf(recoveryRate, 1, 2), 160, 55);
    text("Population Size: " + populationSizeSlider.value(), 160, 85);
    text("Initial Infection: " + initialInfectionSlider.value(), 160, 115);
    text("Reinfection Delay: " + reinfectionDelay + " frames", 160, 145);
    text("Movement Speed: " + speedSlider.value(), 160, 175);

    // Check if population size or initial infection has changed and reinitialize if necessary
    if (population.length !== populationSizeSlider.value() || initialInfection !== initialInfectionSlider.value()) {
      initializePopulation();
    }

    // Update counts
    infectedCount = 0;
    recoveredCount = 0;
    susceptibleCount = 0;

    // Update and display the population
    for (let person of population) {
      person.update();
      person.display();

      // Count states
      if (person.state === 'infected') {
        infectedCount++;
      } else if (person.state === 'recovered') {
        recoveredCount++;
      } else {
        susceptibleCount++;
      }
    }

    // Ensure that there is always at least one infected person if infection rate > 0
    if (infectedCount === 0 && infectionRate > 0) {
      let randomPerson = random(population.filter(person => person.state === 'susceptible'));
      if (randomPerson) {
        randomPerson.state = 'infected';
        randomPerson.infectionTime = frameCount;
      }
    }

    // Update history for graph
    history.push({ susceptible: susceptibleCount, infected: infectedCount, recovered: recoveredCount });
    if (history.length > width - 160) {
      history.shift(); // Remove the oldest data point if the history array is too long
    }

    // Draw real-time graph and stats
    drawStats();
    drawGraph();

    // Log statistics every interval (e.g., 60 frames = 1 second)
    if (frameCount % statsLogInterval === 0) {
      logStatistics();
    }
  }
}

// Draw the infection statistics at the bottom of the screen, above the graph
function drawStats() {
  textSize(18);
  fill(0);
  textAlign(LEFT);
  text(`Susceptible: ${susceptibleCount}`, 20, height - 160);
  text(`Infected: ${infectedCount}`, 220, height - 160);
  text(`Recovered: ${recoveredCount}`, 400, height - 160);
}

function drawGraph() {
  noFill();

  // Set up the graph in the bottom part of the canvas
  let graphHeight = 120;
  let graphTop = height - graphHeight;

  // Susceptible (Green)
  stroke(34, 139, 34);  // Dark green
  beginShape();
  for (let i = 0; i < history.length; i++) {
    let ySusceptible = map(history[i].susceptible, 0, populationSize, graphTop + graphHeight, graphTop);
    vertex(i + 160, ySusceptible);
  }
  endShape();

  // Infected (Red)
  stroke(178, 34, 34);  // Firebrick red
  beginShape();
  for (let i = 0; i < history.length; i++) {
    let yInfected = map(history[i].infected, 0, populationSize, graphTop + graphHeight, graphTop);
    vertex(i + 160, yInfected);
  }
  endShape();

  // Recovered (Blue)
  stroke(70, 130, 180);  // Steel blue
  beginShape();
  for (let i = 0; i < history.length; i++) {
    let yRecovered = map(history[i].recovered, 0, populationSize, graphTop + graphHeight, graphTop);
    vertex(i + 160, yRecovered);
  }
  endShape();

  // Labels for the graph
  textSize(12);
  fill(0);
  text("Susceptible", 10, graphTop + graphHeight - 80);
  fill(178, 34, 34);
  text("Infected", 10, graphTop + graphHeight - 65);
  fill(70, 130, 180);
  text("Recovered", 10, graphTop + graphHeight - 50);
}

// Person class to represent individuals in the simulation
class Person {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.state = 'susceptible'; // Possible states: 'susceptible', 'infected', 'recovered'
    this.infectionTime = 0;
    this.recoveryTime = 0;  // For managing reinfection
    this.speedX = random(-2, 2);  // Randomize speed for more natural motion
    this.speedY = random(-2, 2);
  }

  update() {
    // Apply speed to movement
    this.x += this.speedX * speed;
    this.y += this.speedY * speed;

    // Reflect movement on edges (bounce off walls)
    if (this.x <= 0 || this.x >= width) {
      this.speedX *= -1;
    }
    if (this.y <= 0 || this.y >= height - 180) {
      this.speedY *= -1;
    }

    // Infection and recovery logic
    if (this.state === 'infected') {
      if (frameCount - this.infectionTime > recoveryDelay) {
        if (random() < recoveryRate) {
          this.state = 'recovered';
          this.recoveryTime = frameCount;
        }
      }

      // Spread the disease if nearby susceptible individuals
      for (let other of population) {
        if (other && other.state === 'susceptible' && this.distTo(other) < 10) {
          if (random() < infectionRate) {
            other.state = 'infected';
            other.infectionTime = frameCount;
          }
        }
      }
    } else if (this.state === 'recovered') {
      // After some time, become susceptible again
      if (frameCount - this.recoveryTime > reinfectionDelay) {
        this.state = 'susceptible';
      }
    }
  }

  display() {
    if (this.state === 'susceptible') {
      fill(34, 139, 34); // Dark green
    } else if (this.state === 'infected') {
      fill(178, 34, 34); // Firebrick red
    } else if (this.state === 'recovered') {
      fill(70, 130, 180); // Steel blue
    }
    ellipse(this.x, this.y, 10, 10);
  }

  distTo(other) {
    return dist(this.x, this.y, other.x, other.y);
  }
}

function logStatistics() {
  let currentTime = nf(frameCount / 60, 1, 2); // Current time in seconds
  loggedData.push(`${currentTime}, ${susceptibleCount}, ${infectedCount}, ${recoveredCount}`); // Store data for download

  console.log(
    `Time: ${currentTime}s | Susceptible: ${susceptibleCount} | Infected: ${infectedCount} | Recovered: ${recoveredCount}`
  );
}

function downloadData() {
  let csvContent = "data:text/csv;charset=utf-8," + loggedData.join("\n"); // Convert the array to CSV format
  let encodedUri = encodeURI(csvContent); // Encode as URI
  let link = document.createElement("a"); // Create a download link
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "infection_simulation_data.csv");
  document.body.appendChild(link); // Required for Firefox
  link.click(); // Simulate click to trigger download
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Adjust canvas on window resize
}

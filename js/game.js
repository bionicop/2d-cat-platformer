const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const gravity = 1;
const moveSpeed = 7;
const jumpForce = -15.5;

canvas.width = 1024;
canvas.height = 256;

let gateTriggered = false;

const keyPressed = { a: false, d: false, w: false };
let lastKey = '';

if (typeof CURRENT_LEVEL === 'undefined') {
  window.CURRENT_LEVEL = 1;
}

const platforms = [];
const collectibles = [];

// ---------------------
// Subtitle System Class
// ---------------------
class SubtitleSystem {
  constructor(levelData) {
    this.queue = []
    this.isShowing = false;
    this.defaultDelay = 50;
    this.messages = {};
    this.lastShownMessageId = null;
    this.lastMessageTime = 0;

    if (levelData && levelData.subtitles && levelData.subtitles.message) {
      const msgs = Array.isArray(levelData.subtitles.message)
        ? levelData.subtitles.message
        : [levelData.subtitles.message];
      msgs.forEach(msg => {
        const id = msg['@attributes'].id;
        this.messages[id] = {
          text: (msg.text['#text'] || msg.text).trim(),
          duration: parseInt(msg['@attributes'].duration) || 1500,
          delay: parseInt(msg['@attributes'].delay) || 0
        };
      });
    }

    // Gate messages (from the cat's perspective)
    this.gateMessages = [
      "Time to explore another room!",
      "I wonder what's behind this door...",
      "My adventure continues!",
      "Off to new places!"
    ];
  }

  // Internal method to display a message on the subtitle element.
  _displayMessage(text, duration) {
    const subtitle = document.getElementById('subtitle');
    if (!subtitle) return;
    subtitle.textContent = text;
    subtitle.style.opacity = '1';
    this.isShowing = true;
    this.lastMessageTime = Date.now();
    // After the duration, fade out the subtitle.
    setTimeout(() => {
      subtitle.style.opacity = '0';
      this.isShowing = false;
      // Process the next message after a short delay.
      setTimeout(() => { this._processQueue(); }, this.defaultDelay);
    }, duration);
  }

  // Check and display the next message in the queue.
  _processQueue() {
    if (this.queue.length && !this.isShowing) {
      const next = this.queue.shift();
      if (next && next.text) {
        this._displayMessage(next.text, next.duration);
      }
    }
  }

  // Show a subtitle message using its ID (from the XML file).
  show(messageId) {
    // Don't show the same message again too quickly
    if (this.lastShownMessageId === messageId && Date.now() - this.lastMessageTime < 2000) {
      return;
    }

    let messageData = this.messages[messageId];
    if (!messageData) return;

    this.lastShownMessageId = messageId;

    if (this.isShowing) {
      this.queue.push(messageData);
    } else {
      setTimeout(() => {
        this._displayMessage(messageData.text, messageData.duration);
      }, messageData.delay);
    }
  }

  showGate() {
    const text = this.gateMessages[Math.floor(Math.random() * this.gateMessages.length)];
    if (this.isShowing) {
      this.queue.push({ text, duration: 1500, delay: this.defaultDelay });
    } else {
      setTimeout(() => {
        this._displayMessage(text, 1500);
      }, this.defaultDelay);
    }
  }
}

// ---------------------
// Sprite Class
// ---------------------
class Sprite {
  constructor({ position, imageSrc, width = 50, height = 50 }) {
    this.position = position;
    this.velocity = { x: 0, y: 0 };
    this.width = width;
    this.height = height;
    this.image = new Image();
    this.imageLoaded = false;
    if (imageSrc) {
      this.image.onload = () => { this.imageLoaded = true; };
      this.image.onerror = () => {
        console.error('Failed to load image:', imageSrc);
        this.imageLoaded = false;
      };
      this.image.src = imageSrc;
    }
    this.onGround = false;
    this.canJump = true;
  }

  // Draw the sprite.
  draw() {
    if (this.imageLoaded && this.image.src) {
      ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
    } else {
      ctx.fillStyle = (this === background) ? 'lightgray' : 'red';
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
  }

  // Check collision with another object.
  checkCollision(object) {
    return (
      this.position.x < object.position.x + object.width &&
      this.position.x + this.width > object.position.x &&
      this.position.y < object.position.y + object.height &&
      this.position.y + this.height > object.position.y
    );
  }

  // Update the sprite's position and handle collisions.
  update() {
    this.draw();
    let nearestPlatform = null;
    let minDistance = Infinity;

    // ----------------------
    // Horizontal movement
    // ----------------------
    this.position.x += this.velocity.x;

    // Loop through each platform to check for collisions.
    platforms.forEach(platform => {
      // If this platform is the gate.
      if (platform.type === 'gate') {
        const distance = Math.abs(this.position.x + this.width - platform.position.x);
        if (distance < 20 && !gateTriggered) {
          // Show the gate message.
          subtitleSystem.showGate();
          gateTriggered = true;
          setTimeout(() => {
            const transition = document.querySelector('.page-transition');
            if (transition) {
              transition.classList.add('active');
              setTimeout(() => {
                window.location.href = `index.php?level=${CURRENT_LEVEL + 1}`;
              }, 1000);
            }
          }, 800);
        }
      } else if (this.checkCollision(platform)) {
        const centerX = this.position.x + this.width / 2;
        const centerY = this.position.y + this.height / 2;
        const platformCenterX = platform.position.x + platform.width / 2;
        const platformCenterY = platform.position.y + platform.height / 2;
        const distance = Math.sqrt(
          Math.pow(centerX - platformCenterX, 2) +
          Math.pow(centerY - platformCenterY, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestPlatform = platform;
        }

        // Handle collision for solid platforms.
        if (platform.solid !== false) {
          if (this.velocity.x > 0) {
            this.position.x = platform.position.x - this.width;
          } else if (this.velocity.x < 0) {
            this.position.x = platform.position.x + platform.width;
          }
        }
      }
    });

    // Show message for nearest platform if we're colliding with it
    if (nearestPlatform) {
      const nearKey = 'near' + nearestPlatform.type.charAt(0).toUpperCase() + nearestPlatform.type.slice(1);
      if (subtitleSystem.messages[nearKey]) {
        subtitleSystem.show(nearKey);
      }
    }

    // ----------------------
    // Vertical movement
    // ----------------------
    this.position.y += this.velocity.y;
    this.onGround = false;
    platforms.forEach(platform => {
      if (this.checkCollision(platform)) {
        if (platform.solid === false) {
          if (this.velocity.y > 0 && this.position.y + this.height - this.velocity.y <= platform.position.y) {
            this.onGround = true;
            this.velocity.y = 0;
            this.position.y = platform.position.y - this.height;
          }
        } else if (platform.type !== 'gate') {
          if (this.velocity.y > 0) {
            this.onGround = true;
            this.velocity.y = 0;
            this.position.y = platform.position.y - this.height;
          } else if (this.velocity.y < 0) {
            this.velocity.y = 0;
            this.position.y = platform.position.y + platform.height;
          }
        }
      }
    });

    // ----------------------
    // Check collision with collectibles (treats)
    // ----------------------
    collectibles.forEach(collectible => {
      if (this.checkCollision(collectible) && !collectible.collected) {
        collectible.collected = true;
        if (subtitleSystem.messages['collectTreat']) {
          subtitleSystem.show('collectTreat');
        }
      }
    });

    // Apply gravity if not on ground.
    if (!this.onGround) {
      this.velocity.y += gravity;
    }
    if (this.onGround) {
      this.canJump = true;
    }
  }
}

// ---------------------
// Create the player and background sprites
// ---------------------
const player = new Sprite({
  position: { x: 0, y: 0 },
  width: 124,
  height: 78,
  imageSrc: './asset/player/cat.png'
});

const background = new Sprite({
  position: { x: 0, y: 0 },
  width: canvas.width,
  height: canvas.height,
  imageSrc: ''
});

// ---------------------
// Initialize Level Data
// ---------------------
function initializeLevel() {
  if (typeof LEVEL_DATA !== 'undefined' && LEVEL_DATA) {
    // Create a new subtitle system using the XML data.
    subtitleSystem = new SubtitleSystem(LEVEL_DATA);

    // Display starting subtitles in sequence with shorter delays
    setTimeout(() => {
      subtitleSystem.show('start');
      setTimeout(() => {
        subtitleSystem.show('lookingForTreats');
      }, 800);
    }, 50);

    // Set the background image from the level data.
    const bgImage = LEVEL_DATA.background.image['@attributes'].src;
    background.imageLoaded = false;
    background.image.onload = () => { background.imageLoaded = true; };
    background.image.onerror = () => {
      console.error('Failed to load background image:', bgImage);
      background.imageLoaded = false;
    };
    background.image.src = bgImage;

    // Remove all existing platforms
    platforms.length = 0;

    // Check if we have platform data to load
    if (LEVEL_DATA.platforms && LEVEL_DATA.platforms.platform) {
      // Make sure we handle both single platform and multiple platforms
      let platformList = LEVEL_DATA.platforms.platform;
      if (!Array.isArray(platformList)) {
        platformList = [platformList];
      }

      // Go through each platform and create it
      for (let platform of platformList) {
        let newPlatform = {
          position: {
            x: Number(platform.position['@attributes'].x),
            y: Number(platform.position['@attributes'].y)
          },
          width: Number(platform.size['@attributes'].width),
          height: Number(platform.size['@attributes'].height),
          type: platform.type,
          solid: platform.passable !== 'true'
        };
        platforms.push(newPlatform);
      }
    }

    // Load collectibles (treats) from level data.
    collectibles.length = 0;
    if (LEVEL_DATA.collectibles && LEVEL_DATA.collectibles.treat) {
      const treats = Array.isArray(LEVEL_DATA.collectibles.treat)
        ? LEVEL_DATA.collectibles.treat
        : [LEVEL_DATA.collectibles.treat];
      treats.forEach(treat => {
        collectibles.push({
          position: {
            x: parseInt(treat.position['@attributes'].x),
            y: parseInt(treat.position['@attributes'].y)
          },
          width: 30,
          height: 30,
          type: treat.type,
          collected: false
        });
      });
    }

    const catStart = LEVEL_DATA.characters.cat['@attributes'];
    player.position.x = parseInt(catStart.x);
    player.position.y = parseInt(catStart.y);
    player.velocity.y = 0;
    player.onGround = false;

    // Reset gate trigger on level init
    gateTriggered = false;
  } else {
    console.error('Level data not loaded!');
  }
}

// ---------------------
// Main Game Loop
// ---------------------
function gameLoop() {
  window.requestAnimationFrame(gameLoop);

  // Clear the canvas.
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the background.
  background.draw();

  // Draw each platform.
  platforms.forEach(platform => {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(platform.position.x, platform.position.y, platform.width, platform.height);
  });

  // Draw collectibles (treats).
  collectibles.forEach(collectible => {
    if (!collectible.collected) {
      ctx.fillStyle = collectible.type === 'cat_treat' ? 'yellow' : 'brown';
      ctx.fillRect(collectible.position.x, collectible.position.y, collectible.width, collectible.height);
    }
  });

  // ---------------------
  // Update player movement based on key presses.
  // ---------------------
  player.velocity.x = 0;
  if (keyPressed.a && lastKey === 'a') player.velocity.x = -moveSpeed;
  if (keyPressed.d && lastKey === 'd') player.velocity.x = moveSpeed;
  if (keyPressed.w && player.onGround && player.canJump) {
    player.velocity.y = jumpForce;
    player.onGround = false;
    player.canJump = false;
  }

  player.update();
}

// ---------------------
// Keyboard Input Event Listeners
// ---------------------
window.addEventListener('keydown', (event) => {
  if (event.key === 'd') { keyPressed.d = true; lastKey = 'd'; }
  if (event.key === 'a') { keyPressed.a = true; lastKey = 'a'; }
  if (event.key === 'w') { keyPressed.w = true; }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'd') { keyPressed.d = false; }
  if (event.key === 'a') { keyPressed.a = false; }
  if (event.key === 'w') { keyPressed.w = false; }
});

initializeLevel();
gameLoop();

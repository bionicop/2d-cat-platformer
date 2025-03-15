const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const gravity = 0.5;
const moveSpeed = 2.75;
const jumpForce = -11.5;
const collisionBoxOpacity = 0.35;

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
  constructor({ position, width = 50, height = 50 }) {
    // Basic properties
    this.position = position;
    this.velocity = { x: 0, y: 0 };
    this.width = width;
    this.height = height;

    // Player state tracking
    this.isOnGround = false;
    this.canPlayerJump = true;
    this.isPlayerJumping = false;
    this.isFacingLeft = false;

    this.IDLE = 'idle';
    this.WALK = 'walk';
    this.JUMP = 'jump';

    // Current animation that's playing
    this.currentAnimation = this.IDLE;
    this.animationFrame = 0;
    this.lastFrameUpdateTime = 0;
    this.frameUpdateInterval = 100;

    // Loading all the character animations
    this.animations = {
      idle: {
        img: new Image(),
        frames: 4,
        src: './asset/player/cat_idle.png',
        loaded: false
      },
      walk: {
        img: new Image(),
        frames: 4,
        src: './asset/player/cat_walk.png',
        loaded: false
      },
      jump: {
        img: new Image(),
        frames: 4,
        src: './asset/player/cat_jump.png',
        loaded: false
      }
    };

    this.loadAllAnimations();
  }

  // Load all the animation images
  loadAllAnimations() {
    // For each animation (idle, walk, jump)
    Object.keys(this.animations).forEach(animName => {
      const anim = this.animations[animName];

      // When the image loads successfully
      anim.img.onload = () => {
        anim.loaded = true;
      };

      anim.img.onerror = () => {
        console.error(`Couldn't load ${animName} animation: ${anim.src}`);
      };

      // loading the image
      anim.img.src = anim.src;
    });
  }

  // Draw the character on screen
  draw() {
    // Current animation data
    const animation = this.animations[this.currentAnimation];

    // Only draw if the animation image is loaded
    if (animation && animation.loaded) {
      // frame size
      const frameWidth = animation.img.width / animation.frames;
      const frameHeight = animation.img.height;

      ctx.save();

      if (this.isFacingLeft) {
        // Flipping image horizontally if left
        ctx.scale(-1, 1);
        ctx.translate(-this.position.x - this.width, this.position.y);
      } else {
        // Default if facing right
        ctx.translate(this.position.x, this.position.y);
      }

      // Draw the current animation frame
      ctx.drawImage(
        animation.img,
        this.animationFrame * frameWidth,
        0,
        frameWidth,
        frameHeight,
        0,
        0,
        this.width,
        this.height
      );

      ctx.restore();
    }
  }

  checkCollision(object) {
    return (
      this.position.x < object.position.x + object.width &&
      this.position.x + this.width > object.position.x &&
      this.position.y < object.position.y + object.height &&
      this.position.y + this.height > object.position.y
    );
  }

  updateAnimation() {
    const now = Date.now();

    // Step 1: Choosing the right animation based on player's state
    let newAnimation = this.currentAnimation;

    // If the player is jumping and not touching the ground
    if (this.isPlayerJumping && !this.isOnGround) {
      newAnimation = this.JUMP;
    }
    // If the player is moving horizontally
    else if (Math.abs(this.velocity.x) > 0.1) {
      newAnimation = this.WALK;
      // Update the direction the player is facing
      this.isFacingLeft = this.velocity.x < 0;
    }
    // If the player is not moving
    else {
      newAnimation = this.IDLE;
    }

    // Step 2: Change the animation if needed
    if (newAnimation !== this.currentAnimation) {
      // Reset to the first frame when changing animations
      this.animationFrame = 0;
      this.currentAnimation = newAnimation;
    }

    // Step 3: Update the animation frame if enough time has passed
    if (now - this.lastFrameUpdateTime > this.frameUpdateInterval) {
      this.lastFrameUpdateTime = now;

      // Get the current animation
      const animation = this.animations[this.currentAnimation];

      if (animation && animation.loaded) {
        // next frame, and loop back if needed
        this.animationFrame = (this.animationFrame + 1) % animation.frames;
      }
    }
  }

  update() {
    this.updateAnimation();
    this.draw();
    const wasOnGroundBefore = this.isOnGround;
    this.isOnGround = false;

    let nearestPlatform = null;
    let nearestDistance = Infinity;

    // ----------------------
    // Handle horizontal movement
    // ----------------------
    this.position.x += this.velocity.x;

    // Check for collisions with each platform
    platforms.forEach(platform => {
      // Special case: if this is a gate (level exit)
      if (platform.type === 'gate') {
        // Check if player is close to the gate
        const distanceToGate = Math.abs(this.position.x + this.width - platform.position.x);
        if (distanceToGate < 20 && !gateTriggered) {
          // Player reached the gate - show message and go to next level
          subtitleSystem.showGate();
          gateTriggered = true;

          // Start the transition to the next level
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
      }
      // Normal platform collision
      else if (this.checkCollision(platform)) {
        // Calculate how close this platform is
        const centerX = this.position.x + this.width / 2;
        const centerY = this.position.y + this.height / 2;
        const platformCenterX = platform.position.x + platform.width / 2;
        const platformCenterY = platform.position.y + platform.height / 2;
        const distance = Math.sqrt(
          Math.pow(centerX - platformCenterX, 2) +
          Math.pow(centerY - platformCenterY, 2)
        );

        // Keep track of the closest platform
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPlatform = platform;
        }

        // For solid platforms, stop the player from moving through them
        if (platform.solid !== false) {
          // If moving right, push player left
          if (this.velocity.x > 0) {
            this.position.x = platform.position.x - this.width;
          }
          // If moving left, push player right
          else if (this.velocity.x < 0) {
            this.position.x = platform.position.x + platform.width;
          }
        }
      }
    });

    // Show message for the nearest platform
    if (nearestPlatform) {
      const nearKey = 'near' + nearestPlatform.type.charAt(0).toUpperCase() + nearestPlatform.type.slice(1);
      if (subtitleSystem.messages[nearKey]) {
        subtitleSystem.show(nearKey);
      }
    }

    // ----------------------
    // Handle vertical movement
    // ----------------------
    this.position.y += this.velocity.y;

    // Check all platforms for ground collision
    platforms.forEach(platform => {
      if (this.checkCollision(platform)) {
        // Case 1: Landing on top of a platform
        if (this.velocity.y > 0) {
          // Check if we're actually above the platform
          const playerBottom = this.position.y + this.height;
          const platformTop = platform.position.y;

          // Small tolerance to make landing smoother
          const landingTolerance = 10;

          // If we were above the platform in the previous frame
          if (playerBottom - this.velocity.y <= platformTop + landingTolerance) {
            // We landed on the platform!
            this.isOnGround = true;
            this.velocity.y = 0;
            this.position.y = platformTop - this.height;
          }
        }
        // Case 2: Hitting our head on the bottom of a platform
        else if (this.velocity.y < 0 && platform.solid !== false) {
          this.velocity.y = 0;
          this.position.y = platform.position.y + platform.height;
        }
      }
    });

    // Apply gravity if not on ground
    if (!this.isOnGround) {
      this.velocity.y += gravity;
    } else {
      // Reset jump-related flags when we're on the ground
      this.canPlayerJump = true;
      this.isPlayerJumping = false;
    }

    // ----------------------
    // Check for collectibles (treats)
    // ----------------------
    collectibles.forEach(collectible => {
      if (this.checkCollision(collectible) && !collectible.collected) {
        collectible.collected = true;
        if (subtitleSystem.messages['collectTreat']) {
          subtitleSystem.show('collectTreat');
        }
      }
    });
  }
}

// ---------------------
// Create the player and background sprites
// ---------------------
// Background sprite class that doesn't use animation
class BackgroundSprite {
  constructor({ position, width, height }) {
    this.position = position;
    this.width = width;
    this.height = height;
    this.image = new Image();
    this.imageLoaded = false;
  }

  draw() {
    if (this.imageLoaded && this.image) {
      ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
    } else {
      ctx.fillStyle = 'lightgray';
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
  }
}

const player = new Sprite({
  position: { x: 0, y: 0 },
  width: 124,
  height: 78
});

const background = new BackgroundSprite({
  position: { x: 0, y: 0 },
  width: canvas.width,
  height: canvas.height
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
    player.isOnGround = false;
    player.canPlayerJump = true;
    player.isPlayerJumping = false;
    player.currentAnimation = player.IDLE;
    player.animationFrame = 0;

    // Reset gate trigger on level init
    gateTriggered = false;
  } else {
    console.error('Level data not loaded!');
  }
}

// ---------------------
// Main Game Loop - This runs many times per second to update the game
// ---------------------
function gameLoop() {
  window.requestAnimationFrame(gameLoop);

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the background
  background.draw();

  // Draw all platforms
  platforms.forEach(platform => {
    if (collisionBoxOpacity > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${collisionBoxOpacity})`;
      ctx.fillRect(platform.position.x, platform.position.y, platform.width, platform.height);
    }
  });

  collectibles.forEach(collectible => {
    if (!collectible.collected && collisionBoxOpacity > 0) {
      const baseColor = collectible.type === 'cat_treat' ? 'yellow' : 'brown';
      const r = baseColor === 'yellow' ? 255 : 165;
      const g = baseColor === 'yellow' ? 255 : 42;
      const b = baseColor === 'yellow' ? 0 : 42;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${collisionBoxOpacity})`;
      ctx.fillRect(collectible.position.x, collectible.position.y, collectible.width, collectible.height);
    }
  });

  // ---------------------
  // Update player movement based on key presses
  // ---------------------

  // Reset horizontal velocity
  player.velocity.x = 0;

  // Move left
  if (keyPressed.a && lastKey === 'a') {
    player.velocity.x = -moveSpeed;
  }

  // Move right
  if (keyPressed.d && lastKey === 'd') {
    player.velocity.x = moveSpeed;
  }

  // Jump when the W key is pressed
  if (keyPressed.w) {
    // Only jump if we're on the ground and able to jump
    if (player.isOnGround && player.canPlayerJump) {
      player.velocity.y = jumpForce;
      player.isOnGround = false;
      player.canPlayerJump = false;
      player.isPlayerJumping = true;
    }
  }

  // Update the player
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

// Preload the images on game start to reduce lag
function preloadAnimations() {
  const imagesToPreload = [
    './asset/player/cat_idle.png',
    './asset/player/cat_walk.png',
    './asset/player/cat_jump.png'
  ];

  imagesToPreload.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

// Call preload before initializing the level
preloadAnimations();
initializeLevel();
gameLoop();

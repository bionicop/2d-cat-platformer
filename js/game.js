const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const gravity = 1
const moveSpeed = 7
const jumpForce = -15.5

// Canvas setup
canvas.width = 1024
canvas.height = 256

// 1024, 256 and 576

// Game objects
const platforms = []
const collectibles = []
let collectedTreats = 0
let totalTreats = 0
const keyPressed = {
    a: { pressed: false },
    d: { pressed: false },
    w: { pressed: false }
}
let lastKey = ''

class Sprite {
    constructor({ position, imageSrc, width = 50, height = 50 }) {
        this.position = position
        this.velocity = { x: 0, y: 0 }
        this.width = width
        this.height = height
        this.image = new Image()
        this.imageLoaded = false
        
        if (imageSrc) {
            this.image.onload = () => {
                this.imageLoaded = true
            }
            this.image.onerror = () => {
                console.error('Failed to load image:', imageSrc)
                this.imageLoaded = false
            }
            this.image.src = imageSrc
        }
        
        this.onGround = false
        this.canJump = true
    }

    draw() {
        if (this.image.src !== '' && this.imageLoaded) {
            if (this === background) {
                ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height)
            } else {
                ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)
            }
        } else {
            ctx.fillStyle = this === background ? 'lightgray' : 'red'
            ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
        }
    }

    checkCollision(object) {
        return (
            this.position.x < object.position.x + object.width &&
            this.position.x + this.width > object.position.x &&
            this.position.y < object.position.y + object.height &&
            this.position.y + this.height > object.position.y
        )
    }

    update() {
        this.draw()

        // Apply movement first
        this.position.x += this.velocity.x
        
        // Horizontal collision check
        platforms.forEach(platform => {
            if (this.checkCollision(platform) && platform.type !== 'passable') {
                if (this.velocity.x > 0) {
                    this.position.x = platform.position.x - this.width
                    // Check if gate and all treats are collected
                    if (platform.type === 'gate' && collectedTreats === totalTreats) {
                        const nextLevel = parseInt(LEVEL_DATA['@attributes'].id) + 1
                        setTimeout(() => {
                            window.location.href = `index.php?level=${nextLevel}`
                        }, 1000)
                    }
                } else if (this.velocity.x < 0) {
                    this.position.x = platform.position.x + platform.width
                }
            }
        })

        // Vertical movement and collision
        this.position.y += this.velocity.y
        this.onGround = false

        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                // For passable platforms, only check for landing
                if (platform.type === 'passable') {
                    if (this.velocity.y > 0 && 
                        this.position.y + this.height - this.velocity.y <= platform.position.y) {
                        this.onGround = true
                        this.velocity.y = 0
                        this.position.y = platform.position.y - this.height
                    }
                } else {
                    // Normal platform collision
                    if (this.velocity.y > 0) {
                        this.onGround = true
                        this.velocity.y = 0
                        this.position.y = platform.position.y - this.height
                    } else if (this.velocity.y < 0) {
                        this.velocity.y = 0
                        this.position.y = platform.position.y + platform.height
                    }
                }
            }
        })

        // Check collectible collisions
        collectibles.forEach((collectible, index) => {
            if (this.checkCollision(collectible) && !collectible.collected) {
                collectible.collected = true
                collectedTreats++
            }
        })

        // Apply gravity if not on ground
        if (!this.onGround) {
            this.velocity.y += gravity
        }

        // Update jump state when landing
        if (this.onGround) {
            this.canJump = true
        }
    }
}

// Game objects
const player = new Sprite({
    position: { x: 0, y: 0 },
    width: 124,
    height: 78,
    imageSrc: './asset/player/cat.png'
})

const background = new Sprite({
    position: { x: 0, y: 0 },
    width: canvas.width,
    height: canvas.height,
    imageSrc: ''
})

// Use level data from PHP
function initializeLevel() {
    if (typeof LEVEL_DATA !== 'undefined' && LEVEL_DATA) {
        // Set background image from level data
        const bgImage = LEVEL_DATA.background.image['@attributes'].src
        background.imageLoaded = false
        background.image.onload = () => {
            background.imageLoaded = true
        }
        background.image.onerror = () => {
            console.error('Failed to load background image:', bgImage)
            background.imageLoaded = false
        }
        background.image.src = bgImage

        // Clear old platforms
        platforms.length = 0

        // Load platforms from level data with type information
        LEVEL_DATA.platforms.platform.forEach(platform => {
            platforms.push({
                position: {
                    x: parseInt(platform.position['@attributes'].x),
                    y: parseInt(platform.position['@attributes'].y)
                },
                width: parseInt(platform.size['@attributes'].width),
                height: parseInt(platform.size['@attributes'].height),
                type: platform.type
            })
        })

        // Clear and load collectibles
        collectibles.length = 0
        collectedTreats = 0
        
        if (LEVEL_DATA.collectibles && LEVEL_DATA.collectibles.treat) {
            const treats = Array.isArray(LEVEL_DATA.collectibles.treat) ? 
                          LEVEL_DATA.collectibles.treat : 
                          [LEVEL_DATA.collectibles.treat];
            
            totalTreats = treats.length
            
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
                })
            })
        }

        // Set player starting position
        const catStart = LEVEL_DATA.characters.cat['@attributes']
        player.position.x = parseInt(catStart.x)
        player.position.y = parseInt(catStart.y)
        player.velocity.y = 0
        player.onGround = false
    } else {
        console.error('Level data not loaded!')
    }
}

// Game loop
function gameLoop() {
    window.requestAnimationFrame(gameLoop)

    // Clear screen
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw background
    background.draw()

    // Draw platforms
    platforms.forEach(platform => {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
        ctx.fillRect(platform.position.x, platform.position.y, platform.width, platform.height)
    })

    // Draw collectibles
    collectibles.forEach(collectible => {
        if (!collectible.collected) {
            ctx.fillStyle = collectible.type === 'cat_treat' ? 'yellow' : 'brown'
            ctx.fillRect(collectible.position.x, collectible.position.y, 
                        collectible.width, collectible.height)
        }
    })

    // Update player movement
    player.velocity.x = 0
    if (keyPressed.a.pressed && lastKey === 'a') player.velocity.x = -moveSpeed
    if (keyPressed.d.pressed && lastKey === 'd') player.velocity.x = moveSpeed
    
    // Handle jump in game loop for better responsiveness
    if (keyPressed.w.pressed && player.onGround && player.canJump) {
        player.velocity.y = jumpForce
        player.onGround = false
        player.canJump = false  // Prevents double jumping
    }

    // Update and draw player
    player.update()
}

// Controls
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'd':
            keyPressed.d.pressed = true
            lastKey = 'd'
            break
        case 'a':
            keyPressed.a.pressed = true
            lastKey = 'a'
            break
        case 'w':
            keyPressed.w.pressed = true
            break
    }
})

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd':
            keyPressed.d.pressed = false
            break
        case 'a':
            keyPressed.a.pressed = false
            break
        case 'w':
            keyPressed.w.pressed = false
            break
    }
})

initializeLevel()
gameLoop()
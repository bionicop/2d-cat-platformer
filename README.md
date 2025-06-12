# 🐾 Cat House Adventure

A browser-based 2D platformer game where players control a hungry cat navigating rooms to find treats and just moves around the house of the human.

[![PHP](https://img.shields.io/badge/PHP-777BB4?style=flat-square&logo=php&logoColor=white)](https://www.php.net/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Canvas API](https://img.shields.io/badge/Canvas_API-FF6B6B?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

> [!NOTE]
> **🎓 Academic Project**
> *This "game" (and I use that term very loosely - it's more like a cat that can jump around) was developed as an assignment project and submitted to:*
> **Mr. Shashank Gaikwad**
>
> **For the course**: *Foundation Web Technology (T3406)*

## 🎮 [**Play the Game Live!**](http://2d-cat-platformer.infinityfreeapp.com/)


## 🕹️ Controls

| Control | Action |
|---------|--------|
| `A` | Move Left |
| `D` | Move Right |
| `W` or `Space` | Jump |
| `Space` or `Click` | Continue Story (Intro) |

## 🛠️ Technical Architecture

### 📁 Project Structure
```
2d-cat-platformer/
│
├── index.php              # Main game entry point
├── intro.php              # Story introduction sequence
├── README.md
├── .gitignore
│
├── asset/                # Game assets
│   ├── background/       # Background images
│   │   ├── bg-1.png      # Bedroom background
│   │   ├── bg-2.png      # Kitchen background
│   │   └── bg-3.png      # Living room background
│   └── player/           # Cat sprites
│       ├── cat_idle.png  # Idle sprite sheet
│       ├── cat_jump.png  # Jump sprite sheet
│       └── cat_walk.png  # Walk sprite sheet
│
├── css/
│   └── style.css         # Game styling and animations
│
├── js/
│   └── game.js           # Core game engine
│
└── levels/               # Level configuration files
    ├── level1.xml        # Bedroom level data
    ├── level2.xml        # Kitchen level data
    └── level3.xml        # Living room level data
```

### 🏗️ Technology Stack

#### Backend
- **PHP 7.4+**: Server-side routing and level data processing
- **XML**: Level configuration and game data storage
- **SimpleXML**: PHP XML parsing for level loading

#### Frontend
- **HTML5 Canvas**: Game rendering and graphics
- **Vanilla JavaScript**: Custom game engine implementation
- **CSS3**: Styling, animations, and visual effects
- **JSON**: Runtime data processing and communication

## 🚀 Installation & Setup

### Prerequisites
- Web server with PHP support (Apache/Nginx + PHP 7.4+)
- A web browser

### Local Development
1. **Clone the repository**
   ```bash
   git clone https://github.com/bionicop/2d-cat-platformer
   cd 2d-cat-platformer
   ```

2. **Start local PHP server**
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000/intro.php
   ```

## 🔧 Development Details

### Game Engine Architecture

#### Core Components
```javascript
// Game Constants
const gravity = 0.5;
const moveSpeed = 2.75;
const jumpForce = -11.5;
```

#### Collision Detection System
- **Platform Types**: Floor, walls, furniture, interactive objects
- **Collision Boxes**: Precise rectangular collision detection
- **Passable Objects**: Some platforms allow pass-through interaction

#### Subtitle System Class
```javascript
class SubtitleSystem {
  constructor(levelData) {
    this.queue = [];
    this.isShowing = false;
    this.messages = {};
    // Process XML subtitle data
  }

  show(messageId) {
    // Display contextual messages
  }
}
```

### Level Data Structure
Each level is defined in XML format with:
- **Character positioning**: Initial cat spawn point
- **Platform definitions**: Interactive and collision objects
- **Background settings**: Visual theming
- **Collectibles**: Items to find and collect
- **Subtitle messages**: Contextual cat thoughts

#### Example Level Structure
```xml
<level id="1">
    <characters>
        <cat x="100" y="100" />
    </characters>
    <background>
        <image src="asset/background/bg-1.png" />
    </background>
    <platforms>
        <platform>
            <position x="0" y="254" />
            <size width="1024" height="20" />
            <type>floor</type>
        </platform>
    </platforms>
    <subtitles>
        <message id="start" duration="3200">
            <text>*stretches paws* Mrrrowww...</text>
        </message>
    </subtitles>
</level>
```

### Asset Information

#### Sprite Specifications
- **Cat Sprites**: 32x32 pixel animations
  - `cat_idle.png`: Stationary animation
  - `cat_walk.png`: Movement animation
  - `cat_jump.png`: Jumping animation
- **Backgrounds**: 1024x576 pixel room scenes
- **Format**: PNG with transparency support

## 📝 Development Logs

### 🎯 Project Inception
**Concept**: Create a simple 2d platformer from a cat's perspective (*a gist of a bigger picture that I have in mind*)

### 🏗️ Technical Implementation

#### Phase 1: Core Engine Development
- [x] HTML5 Canvas setup and rendering pipeline
- [x] Physics system with gravity and collision detection
- [x] Character movement and animation system
- [x] Input handling for keyboard controls

#### Phase 2: Level System Architecture
- [x] XML-based level configuration system
- [x] Dynamic level loading via PHP backend
- [x] Platform variety (floors, walls, furniture, interactive objects)
- [x] Level progression and routing system

#### Phase 3: Storytelling Integration
- [x] Cinematic intro sequence with animated transitions
- [x] Dynamic subtitle system with contextual messaging
- [x] Character personality development through dialogue
- [x] Environmental storytelling through object interactions

---

## 🐱 About the Cat

*"Every great adventure begins with a curious cat and an empty food bowl."*

---

**Made with 💝 for all cat lovers and platformer enthusiasts!**

🎮 **[Play Now!](http://2d-cat-platformer.infinityfreeapp.com/)** (*Technically there isn't much to it yet - I intend to make it in a game engine*)

🐾 **Meow responsibly!**

// JSNES Controller Button Mappings
const BUTTON_A = 0;
const BUTTON_B = 1;
const BUTTON_SELECT = 2;
const BUTTON_START = 3;
const BUTTON_UP = 4;
const BUTTON_DOWN = 5;
const BUTTON_LEFT = 6;
const BUTTON_RIGHT = 7;

// Initialize AudioContext
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var scriptProcessor = null;

// Initialize NES
var SCREEN_WIDTH = 256;
var SCREEN_HEIGHT = 240;
var FRAMEBUFFER_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT;

var canvas = document.getElementById('screen');
var ctx = canvas.getContext('2d');
var imageData = ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

var buf = new ArrayBuffer(imageData.data.length);
var buf8 = new Uint8ClampedArray(buf);
var buf32 = new Uint32Array(buf);

// Frame buffer for JSNES
var framebuffer_u8 = new Uint8Array(FRAMEBUFFER_SIZE);
var framebuffer_u32 = new Uint32Array(FRAMEBUFFER_SIZE);

var nes = new jsnes.NES({
  onFrame: function(frameBuffer) {
    var i = 0;
    for (var y = 0; y < SCREEN_HEIGHT; ++y) {
      for (var x = 0; x < SCREEN_WIDTH; ++x) {
        i = y * 256 + x;
        // Convert pixel data
        buf32[i] = 0xFF000000 | frameBuffer[i];
      }
    }
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);
  },
  onAudioSample: function(left, right) {
    // Audio handling handled by ScriptProcessor usually, 
    // but here we just need to queue samples if we want audio.
    // For simplicity in this demo, we might skip complex audio buffering 
    // or implement a simple ring buffer.
    // Given the constraints, we will leave audio as basic or silent if too complex.
    // But let's try a simple approach.
    if (audioHandler) {
        audioHandler.writeSample(left, right);
    }
  }
});

// Audio Handler
var audioHandler = {
    bufferSize: 8192,
    buffer: null,
    pos: 0,
    init: function() {
        this.buffer = new Float32Array(this.bufferSize);
        // Create ScriptProcessor
        scriptProcessor = audioCtx.createScriptProcessor(1024, 0, 1);
        scriptProcessor.onaudioprocess = this.onAudioProcess.bind(this);
        scriptProcessor.connect(audioCtx.destination);
    },
    writeSample: function(left, right) {
        if (this.pos < this.bufferSize) {
            this.buffer[this.pos++] = left; // Mono for now
        }
    },
    onAudioProcess: function(e) {
        var output = e.outputBuffer.getChannelData(0);
        // If buffer is running low, play silence to avoid glitching
        if (this.pos < output.length) {
             // Not enough data, just fill what we have and silence the rest
             for (var i = 0; i < this.pos; i++) {
                 output[i] = this.buffer[i];
             }
             for (var i = this.pos; i < output.length; i++) {
                 output[i] = 0;
             }
             this.pos = 0;
        } else {
             // Enough data
             for (var i = 0; i < output.length; i++) {
                 output[i] = this.buffer[i];
             }
             // Shift buffer
             this.buffer.copyWithin(0, output.length, this.pos);
             this.pos -= output.length;
        }
    }
};

// Input handling
var player = 1;

function nesButtonDown(key) {
    nes.buttonDown(player, key);
}

function nesButtonUp(key) {
    nes.buttonUp(player, key);
}

// Joystick
var joystickManager = nipplejs.create({
    zone: document.getElementById('joystick-zone'),
    mode: 'static',
    position: { left: '50%', top: '50%' },
    color: 'white',
    size: 100
});

// State to track joystick buttons to release them when direction changes
var joystickState = {
    up: false,
    down: false,
    left: false,
    right: false
};

joystickManager.on('move', function(evt, data) {
    if (!data.direction) return;

    var angle = data.angle.degree;
    // Simple 8-way logic
    // Up: 45-135
    // Right: 0-45, 315-360
    // Down: 225-315
    // Left: 135-225
    
    // More precise diagonal checking
    // We can use data.vector or data.direction
    
    var newState = {
        up: false,
        down: false,
        left: false,
        right: false
    };

    // Thresholds for diagonals
    // If we use cosine/sine:
    // x > 0.4 -> Right
    // x < -0.4 -> Left
    // y > 0.4 -> Up (Nipple y is +up)
    // y < -0.4 -> Down
    
    var x = Math.cos(data.angle.radian);
    var y = Math.sin(data.angle.radian);

    if (x > 0.3) newState.right = true;
    if (x < -0.3) newState.left = true;
    if (y > 0.3) newState.up = true;
    if (y < -0.3) newState.down = true;

    updateJoystickButtons(newState);
});

joystickManager.on('end', function(evt, data) {
    updateJoystickButtons({
        up: false,
        down: false,
        left: false,
        right: false
    });
});

function updateJoystickButtons(newState) {
    // UP
    if (newState.up !== joystickState.up) {
        newState.up ? nesButtonDown(BUTTON_UP) : nesButtonUp(BUTTON_UP);
        joystickState.up = newState.up;
    }
    // DOWN
    if (newState.down !== joystickState.down) {
        newState.down ? nesButtonDown(BUTTON_DOWN) : nesButtonUp(BUTTON_DOWN);
        joystickState.down = newState.down;
    }
    // LEFT
    if (newState.left !== joystickState.left) {
        newState.left ? nesButtonDown(BUTTON_LEFT) : nesButtonUp(BUTTON_LEFT);
        joystickState.left = newState.left;
    }
    // RIGHT
    if (newState.right !== joystickState.right) {
        newState.right ? nesButtonDown(BUTTON_RIGHT) : nesButtonUp(BUTTON_RIGHT);
        joystickState.right = newState.right;
    }
}

// Touch Buttons
var btnMap = {
    'btn-a': BUTTON_A,
    'btn-b': BUTTON_B,
    'btn-select': BUTTON_SELECT,
    'btn-start': BUTTON_START
};

Object.keys(btnMap).forEach(function(id) {
    var btn = document.getElementById(id);
    var key = btnMap[id];
    
    // Touch events
    btn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        nesButtonDown(key);
        btn.classList.add('active');
    });
    btn.addEventListener('touchend', function(e) {
        e.preventDefault();
        nesButtonUp(key);
        btn.classList.remove('active');
    });
    
    // Mouse events for desktop testing
    btn.addEventListener('mousedown', function(e) {
        nesButtonDown(key);
    });
    btn.addEventListener('mouseup', function(e) {
        nesButtonUp(key);
    });
});

// Main Loop
function onAnimationFrame() {
    window.requestAnimationFrame(onAnimationFrame);
    if (isRunning) {
        nes.frame();
        // Audio handling triggers via callback
    }
}

var isRunning = false;

// 禁止右键和长按菜单
document.addEventListener('contextmenu', function(event) {
    event.preventDefault();
}, false);

// Start Game
function startGame() {
    // Resume AudioContext (might be blocked by browser until user interaction, handled below)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    audioHandler.init();
    
    // Load ROM
    // Note: 'sevenkingdom.nes' (Qi Guo Da Zhan) uses Mapper 163 (Nanjing) which is not supported.
    // Recommended alternatives (Search for these):
    // 1. "San Guo Zhi (C) (Mapper 4 Hack).nes"
    // 2. "Destiny of an Emperor (U).nes" (English) or "Tun Shi Tian Di (C).nes" (Chinese)
    // 3. "Romance of the Three Kingdoms (U).nes"
    fetch('roms/Ninja Kid\'s Demon Castle Adventure (Japan) [T-Eng by Pacnsacdave v1.0] [n].nes')
        .then(response => {
            if (!response.ok) throw new Error("ROM not found");
            return response.arrayBuffer();
        })
        .then(buffer => {
            var romData = new Uint8Array(buffer);
            // JSNES loadROM expects a binary string
            var binaryString = "";
            for (var i = 0; i < romData.length; i++) {
                binaryString += String.fromCharCode(romData[i]);
            }
            nes.loadROM(binaryString);
            isRunning = true;
            onAnimationFrame();
        })
        .catch(err => {
            console.error("Failed to load ROM: " + err.message);
            alert("Failed to load ROM: " + err.message);
        });
}

// Start Button Logic
document.getElementById('start-button').addEventListener('click', function() {
    document.getElementById('overlay').style.display = 'none';
    startGame();
});

// Add global click listener to unlock audio context if it was blocked
document.addEventListener('click', function() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}, { once: true });


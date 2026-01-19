# Elegant Clock H5 Project

An elegant clock application built using HTML5 Canvas and CSS3.

## Features

- ✅ 60 minute marks (small marks)
- ✅ 12 hour marks (large marks, red)
- ✅ Smooth pointer animation effects
- ✅ Digital time and date display
- ✅ Responsive design, mobile-friendly
- ✅ Beautiful gradient background and glassmorphism effect

## Project Structure

```
workspace/
├── dist/
│   ├── index.html      # Main page
│   ├── css/
│   │   └── style.css   # Stylesheet
│   └── js/
│       └── clock.js    # Clock logic
└── README.md           # Documentation
```

## Usage

1. Open `dist/index.html` directly in your browser
2. Or run with a local server:
   ```bash
   cd dist
   python3 -m http.server 8080
   ```
   Then visit `http://localhost:8080` in your browser

## Technical Implementation

- **HTML5 Canvas**: Used for drawing the clock interface
- **CSS3**: Implements beautiful styles and animation effects
- **JavaScript ES6**: Implements clock logic and animations

### Mark System

- Total of 60 mark positions (every 6 degrees)
- Minute marks: 10px length, 1px width, blue
- Hour marks: 25px length, 3px width, red, appear every 5 minute marks
- Hour numbers: 12, 1, 2, ..., 11, in standard clock layout

### Pointer System

- Second hand: longest, thinnest, white, with animation effects
- Minute hand: medium length, blue
- Hour hand: shortest, thickest, red

## Customization

You can modify the following configuration in `js/clock.js`:

```javascript
this.colors = {
    background: '#1a1a2e',      // Clock background
    clockFace: '#16213e',       // Clock face
    minuteMarks: '#0f3460',     // Minute marks
    hourMarks: '#e94560',       // Hour marks
    hourNumbers: '#ffffff',     // Hour numbers
    hourHand: '#e94560',        // Hour hand
    minuteHand: '#0f3460',      // Minute hand
    secondHand: '#ffffff',      // Second hand
    centerDot: '#ffffff'        // Center dot
};
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Supports mobile touch devices.
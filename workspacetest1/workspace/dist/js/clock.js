class ElegantClock {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 20;

        // Color configuration
        this.colors = {
            background: '#1a1a2e',
            clockFace: '#16213e',
            minuteMarks: '#0f3460',
            hourMarks: '#e94560',
            hourNumbers: '#ffffff',
            hourHand: '#e94560',
            minuteHand: '#0f3460',
            secondHand: '#ffffff',
            centerDot: '#ffffff'
        };

        this.init();
        this.animate();
    }

    init() {
        // Set canvas styles
        this.ctx.strokeStyle = this.colors.minuteMarks;
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = 'bold 18px Arial';
    }

    drawClockFace() {
        // Draw clock face background
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.radius
        );
        gradient.addColorStop(0, this.colors.clockFace);
        gradient.addColorStop(1, '#0f3460');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        this.ctx.fill();

        // Draw outer border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        this.ctx.stroke();

        // Draw loopit watermark
        this.drawWatermark();
    }

    drawMarks() {
        const minuteMarkLength = 10;
        const hourMarkLength = 25;
        const minuteMarkWidth = 1;
        const hourMarkWidth = 3;

        for (let i = 0; i < 60; i++) {
            const angle = (i * Math.PI) / 30; // 6-degree intervals
            const isHour = i % 5 === 0; // Every 5 minute marks corresponds to an hour mark

            const markLength = isHour ? hourMarkLength : minuteMarkLength;
            const markWidth = isHour ? hourMarkWidth : minuteMarkWidth;
            const markColor = isHour ? this.colors.hourMarks : this.colors.minuteMarks;

            // Calculate mark start and end points
            const startX = this.centerX + (this.radius - markLength) * Math.sin(angle);
            const startY = this.centerY - (this.radius - markLength) * Math.cos(angle);
            const endX = this.centerX + this.radius * Math.sin(angle);
            const endY = this.centerY - this.radius * Math.cos(angle);

            // Draw marks
            this.ctx.strokeStyle = markColor;
            this.ctx.lineWidth = markWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();

            // Draw hour numbers
            if (isHour) {
                const hour = i === 0 ? 12 : i / 5;
                const textRadius = this.radius - 40;
                const textX = this.centerX + textRadius * Math.sin(angle);
                const textY = this.centerY - textRadius * Math.cos(angle);

                this.ctx.fillStyle = this.colors.hourNumbers;
                this.ctx.font = 'bold 20px Arial';
                this.ctx.fillText(hour.toString(), textX, textY);
            }
        }
    }

    drawWatermark() {
        // Set watermark style
        this.ctx.save();
        this.ctx.globalAlpha = 0.2; // More subtle transparency
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'italic 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw "loopit" watermark at the bottom center of the clock face
        const watermarkY = this.centerY + this.radius * 0.6;
        this.ctx.fillText('loopit', this.centerX, watermarkY);

        this.ctx.restore();
    }

    drawHands() {
        const now = new Date();
        const hours = now.getHours() % 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();

        // Hour hand
        const hourAngle = ((hours + minutes / 60) * Math.PI) / 6;
        this.drawHand(hourAngle, this.radius * 0.5, 6, this.colors.hourHand);

        // Minute hand
        const minuteAngle = ((minutes + seconds / 60) * Math.PI) / 30;
        this.drawHand(minuteAngle, this.radius * 0.7, 4, this.colors.minuteHand);

        // Second hand
        const secondAngle = ((seconds + milliseconds / 1000) * Math.PI) / 30;
        this.drawHand(secondAngle, this.radius * 0.8, 2, this.colors.secondHand);

        // Center dot
        this.ctx.fillStyle = this.colors.centerDot;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 8, 0, 2 * Math.PI);
        this.ctx.fill();

        // Center dot border
        this.ctx.strokeStyle = this.colors.hourMarks;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 8, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    drawHand(angle, length, width, color) {
        const endX = this.centerX + length * Math.sin(angle);
        const endY = this.centerY - length * Math.cos(angle);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
    }

    updateDigitalTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const dateString = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        document.getElementById('digital-time').textContent = timeString;
        document.getElementById('date-display').textContent = dateString;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw each part
        this.drawClockFace();
        this.drawMarks();
        this.drawHands();
        this.updateDigitalTime();
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize clock
document.addEventListener('DOMContentLoaded', () => {
    new ElegantClock('clock-canvas');
});
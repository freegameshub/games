// Universal Mobile Controls Helper
// Add this to make canvas responsive on mobile

function makeCanvasResponsive(canvas) {
    function resize() {
        if (window.innerWidth <= 768) {
            const maxWidth = Math.min(window.innerWidth - 40, 600);
            canvas.style.width = maxWidth + 'px';
            canvas.style.height = (canvas.height / canvas.width * maxWidth) + 'px';
        } else {
            canvas.style.width = '';
            canvas.style.height = '';
        }
    }
    
    window.addEventListener('resize', resize);
    resize();
}

// Add swipe controls for mobile
function addSwipeControls(canvas, callbacks) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    canvas.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, {passive: true});
    
    canvas.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, {passive: true});
    
    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const minSwipeDistance = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0 && callbacks.right) callbacks.right();
                else if (deltaX < 0 && callbacks.left) callbacks.left();
            }
        } else {
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0 && callbacks.down) callbacks.down();
                else if (deltaY < 0 && callbacks.up) callbacks.up();
            }
        }
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { makeCanvasResponsive, addSwipeControls };
}

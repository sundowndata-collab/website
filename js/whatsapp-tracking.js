(function() {
    function attach() {
        document.querySelectorAll('a[href*="wa.me"]').forEach(function(btn) {
            if (btn.dataset.wtBound) return;
            btn.dataset.wtBound = '1';
            btn.addEventListener('click', function() {
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'whatsapp_click', {
                        event_category: 'enquiry',
                        event_label: 'whatsapp_cta'
                    });
                }
                if (typeof fbq !== 'undefined') { fbq('track', 'Contact'); }
            });
        });
    }
    (window.requestIdleCallback || function(cb){setTimeout(cb,1)})(attach);
})();
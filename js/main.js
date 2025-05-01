console.log('main.js loaded');  // 파일이 로드되는지 확인

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animate elements when they come into view
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.animate-on-scroll');
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        
        if (elementTop < window.innerHeight && elementBottom > 0) {
            element.classList.add('visible');
        }
    });
};

// Initialize animations
window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', animateOnScroll);

// Mobile menu toggle
const mobileMenuBtn = document.querySelector('.navbar-toggler');
const navbarCollapse = document.querySelector('.navbar-collapse');

if (mobileMenuBtn && navbarCollapse) {
    mobileMenuBtn.addEventListener('click', () => {
        navbarCollapse.classList.toggle('show');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navbarCollapse.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            navbarCollapse.classList.remove('show');
        }
    });
}

// Form validation
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Constants
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzv_fC4qwICHoJJLHMPEGjT8xRslCTAHyL5gFldQ6-l7RGYMCdXHGEOzqtrLhTouPdi/exec';

// Utility functions
function getTimeStamp() {
    const date = new Date();
    const padValue = value => (value < 10 ? "0" + value : value);
    
    return `${date.getFullYear()}-${padValue(date.getMonth() + 1)}-${padValue(date.getDate())} ${padValue(date.getHours())}:${padValue(date.getMinutes())}:${padValue(date.getSeconds())}`;
}

function getCookieValue(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
}

function setCookieValue(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value || ""}${expires}; path=/`;
}

function getUVfromCookie() {
    const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existingHash = getCookieValue("user");
    if (!existingHash) {
        setCookieValue("user", hash, 180);
        return hash;
    }
    return existingHash;
}

function getDeviceType() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        ? 'mobile' 
        : 'desktop';
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Document ready');
    
    // Form handling
    console.log('Setting up form handler');
    const form = document.querySelector('#newsletterForm');
    const emailInput = document.querySelector('#submit-email');
    const adviceInput = document.querySelector('#submit-advice');
    const submitBtn = form?.querySelector('[type="submit"]');

    console.log('Form elements:', { form, emailInput, adviceInput, submitBtn });

    if (!form) return console.error('Form not found!');
    if (!emailInput || !adviceInput) {
        return console.error('Input fields not found:', { emailInput, adviceInput });
    }

    // Track visitor
    let ip = "unknown";
    $.getScript("https://jsonip.com?callback=getIP");
    window.getIP = function(json) {
        console.log('IP data received:', json);
        ip = json.ip;
        trackVisitor();
    };

    function trackVisitor() {
        const queryString = location.search;
        const urlParams = new URLSearchParams(queryString);
        const utm = urlParams.get("utm");

        const visitorData = {
            id: getUVfromCookie(),
            landingUrl: window.location.href,
            ip: ip,
            referer: document.referrer,
            time_stamp: getTimeStamp(),
            utm: utm,
            device: getDeviceType()
        };

        const data = JSON.stringify(visitorData);
        console.log('Tracking visitor:', visitorData);
        
        axios.get(`${APPS_SCRIPT_URL}?action=insert&table=visitors&data=${encodeURIComponent(data)}`)
            .then(response => {
                console.log('Visitor tracking response:', response.data);
            })
            .catch(error => {
                console.error('Visitor tracking error:', error);
            });
    }

    // Form submission handler
    form.addEventListener('submit', e => {
        e.preventDefault();
        console.log('Form submitted');

        const email = emailInput.value.trim();
        const advice = adviceInput.value.trim();
        
        console.log('Form data:', { email, advice });

        function validateEmail(email) {
            const re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            return re.test(email);
        }

        if (!email || !validateEmail(email)) {
            alert("이메일이 유효하지 않아 알림을 드릴 수가 없습니다.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 처리중...';

        const payload = {
            id: getUVfromCookie(),
            email,
            advice
        };

        const url = `${APPS_SCRIPT_URL}?action=insert&table=tab_final&data=${encodeURIComponent(JSON.stringify(payload))}`;
        console.log('Sending request to:', url);

        axios.get(url)
            .then(res => {
                console.log('Form submission response:', res);
                // Parse the response data properly
                let responseData;
                try {
                    // Remove 'undefined(' and ')' from the response
                    const cleanData = res.data.replace(/^undefined\(|\)$/g, '');
                    responseData = JSON.parse(cleanData);
                } catch (e) {
                    console.error('Error parsing response:', e);
                    throw new Error('Invalid response format');
                }

                if (responseData?.success) {
                    form.reset();
                    $.fn.simplePopup({ type: "html", htmlSelector: "#popup" });
                } else {
                    console.error('Unexpected response:', responseData);
                    alert('제출 실패');
                }
            })
            .catch(err => {
                console.error('Form submission error:', err);
                alert('제출 중 오류가 발생했습니다');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '지금 제출!';
            });
    });
});

// Download button functionality
const downloadBtn = document.getElementById('downloadBtn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Show installation instructions modal
        const modalHtml = `
            <div class="modal fade" id="installModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">확장프로그램 설치 방법</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <ol>
                                <li>Chrome 브라우저에서 <code>chrome://extensions</code>를 주소창에 입력하세요.</li>
                                <li>우측 상단의 "개발자 모드"를 켜세요.</li>
                                <li><a href="extension.zip" class="btn btn-primary btn-sm" download="language-learning-extension.zip">확장프로그램 다운로드</a></li>
                                <li>다운로드 받은 zip 파일을 압축 해제하세요.</li>
                                <li>Chrome의 확장프로그램 페이지에서 "압축해제된 확장프로그램을 로드합니다" 버튼을 클릭하세요.</li>
                                <li>압축 해제한 폴더를 선택하세요.</li>
                            </ol>
                            <div class="alert alert-info">
                                설치가 완료되면 Chrome 우측 상단에 확장프로그램 아이콘이 표시됩니다.
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        
        // Add modal to body if not exists
        if (!document.getElementById('installModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('installModal'));
        modal.show();
    });
    
    downloadBtn.addEventListener('mouseenter', () => {
        downloadBtn.classList.add('btn-hover');
    });
    
    downloadBtn.addEventListener('mouseleave', () => {
        downloadBtn.classList.remove('btn-hover');
    });
}

// Feature cards hover effect
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.classList.add('feature-card-hover');
    });
    
    card.addEventListener('mouseleave', () => {
        card.classList.remove('feature-card-hover');
    });
});

// Initialize tooltips
const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
}); 
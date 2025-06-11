console.log('main.js loaded');

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    const href = anchor.getAttribute('href');
    // href가 '#'이거나 빈 문자열이 아닌 경우에만 처리
    if (href && href !== '#' && href.length > 1) {
        const targetId = href.substring(1); // '#' 제거
        if (targetId && document.getElementById(targetId)) {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById(targetId).scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        }
    }
});

// Animate elements when they come into view
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
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

// Form validation helper
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Constants
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzv_fC4qwICHoJJLHMPEGjT8xRslCTAHyL5gFldQ6-l7RGYMCdXHGEOzqtrLhTouPdi/exec';

// Utility functions
function getTimeStamp() {
    const date = new Date();
    const pad = v => (v < 10 ? '0' + v : v);
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getCookieValue(name) {
    const value = '; ' + document.cookie;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function setCookieValue(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days*24*60*60*1000);
    document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/`;
}

function getUVfromCookie() {
    const existing = getCookieValue('user');
    if (existing) return existing;
    const hash = Math.random().toString(36).substr(2,6).toUpperCase();
    setCookieValue('user', hash, 180);
    return hash;
}

function getDeviceType() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
        .test(navigator.userAgent) ? 'mobile' : 'desktop';
}

// DOM-ready initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Document ready');

    // --- Visitor tracking ---
    let ip = 'unknown';
    $.getScript('https://jsonip.com?callback=getIP');
    window.getIP = function(json) {
        ip = json.ip;
        const visitorData = {
            id: getUVfromCookie(),
            landingUrl: window.location.href,
            ip,
            referer: document.referrer,
            time_stamp: getTimeStamp(),
            utm: new URLSearchParams(location.search).get('utm'),
            device: getDeviceType()
        };
        console.log('Tracking visitor:', visitorData);
        axios.get(`${APPS_SCRIPT_URL}?action=insert&table=visitors&data=${encodeURIComponent(JSON.stringify(visitorData))}`)
            .then(res => console.log('Visitor tracking response:', res.data))
            .catch(err => console.error('Visitor tracking error:', err));
    };

    // --- Newsletter form handling ---
    const form = document.querySelector('#newsletterForm');
    const emailInput = document.querySelector('#submit-email');
    const adviceInput = document.querySelector('#submit-advice');
    const submitBtn = form?.querySelector('[type="submit"]');

    if (form && emailInput && adviceInput && submitBtn) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const email = emailInput.value.trim();
            const advice = adviceInput.value.trim();
            if (!email || !validateEmail(email)) {
                alert('유효한 이메일을 입력해주세요.');
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
                    let clean = res.data.replace(/^undefined\(|\)$/g, '');
                    const data = JSON.parse(clean);
                    if (data.success) {
                        form.reset();
                        $.fn.simplePopup({ type: 'html', htmlSelector: '#popup' });
                    } else {
                        alert('제출 실패');
                        console.error('Unexpected response:', data);
                    }
                })
                .catch(err => {
                    alert('제출 중 오류가 발생했습니다');
                    console.error('Form submission error:', err);
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '지금 제출!';
                });
        });
    }

    // --- Download button handling ---
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', e => {
            e.preventDefault();
            const downloadData = {
                id: getUVfromCookie(),
                time_stamp: getTimeStamp()
            };
            axios.get(`${APPS_SCRIPT_URL}?action=insert&table=downloadButton&data=${encodeURIComponent(JSON.stringify(downloadData))}`)
                .then(res => console.log('Download tracking response:', res.data))
                .catch(err => console.error('Download tracking error:', err));

            // Show installation modal
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
                          <li>chrome://extensions 에 접속</li>
                          <li>개발자 모드 켜기</li>
                          <li><a href="extension.zip" class="btn btn-primary btn-sm" download="language-learning-extension.zip">확장프로그램 다운로드</a></li>
                          <li>압축 해제 후 '압축해제된 확장프로그램 로드' 클릭</li>
                          <li>폴더 선택</li>
                        </ol>
                        <div class="alert alert-info">
                          설치 완료 후 우측 상단 아이콘 확인
                        </div>
                      </div>
                    </div>
                  </div>
                </div>`;
            if (!document.getElementById('installModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            }
            const modal = new bootstrap.Modal(document.getElementById('installModal'));
            modal.show();

            modal._element.addEventListener('shown.bs.modal', function() {
                const link = this.querySelector('a[href="extension.zip"]');
                if (link) {
                    link.addEventListener('click', () => {
                        const clickData = {
                            id: getUVfromCookie(),
                            time_stamp: getTimeStamp()
                        };
                        axios.get(`${APPS_SCRIPT_URL}?action=insert&table=downloadButton&data=${encodeURIComponent(JSON.stringify(clickData))}`)
                            .then(res => console.log('Download tracking response:', res.data))
                            .catch(err => console.error('Download tracking error:', err));
                    });
                }
            });
        });

        downloadBtn.addEventListener('mouseenter', () => downloadBtn.classList.add('btn-hover'));
        downloadBtn.addEventListener('mouseleave', () => downloadBtn.classList.remove('btn-hover'));
    }
});

// Feature cards hover effect
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => card.classList.add('feature-card-hover'));
    card.addEventListener('mouseleave', () => card.classList.remove('feature-card-hover'));
});

// Initialize tooltips
const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

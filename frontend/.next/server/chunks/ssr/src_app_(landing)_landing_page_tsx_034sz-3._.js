module.exports=[6588,a=>{"use strict";var b=a.i(87924),c=a.i(72131);a.s(["default",0,function(){let[a,d]=(0,c.useState)(!1),e=()=>{d(!0),document.body.style.overflow="hidden"},f=()=>{d(!1),document.body.style.overflow="auto"};return(0,b.jsxs)("div",{children:[(0,b.jsx)("style",{children:`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #2c3e50;
          background: #f8f9fa;
        }

        .container {
          max-width: 100%;
          padding: 0;
        }

        nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: white;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .logo {
          font-size: 1.5em;
          font-weight: 700;
          color: #ff6b35;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-icons {
          display: flex;
          gap: 20px;
          font-size: 1.2em;
        }

        nav a {
          cursor: pointer;
          color: #2c3e50;
        }

        .hero {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%),
                      url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><rect fill="%23f5f7fa" width="1200" height="600"/><path fill="%23667eea" opacity="0.05" d="M0 0l300 200v200l-300 200V0z"/><path fill="%23764ba2" opacity="0.05" d="M900 0l300 200v200l-300 200V0z"/></svg>');
          background-size: cover;
          background-position: center;
          color: white;
          padding: 60px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 50%, rgba(255,107,53,0.1) 0%, transparent 50%);
          z-index: 1;
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .hero-badge {
          display: inline-block;
          background: rgba(255,107,53,0.9);
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 0.85em;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .hero h1 {
          font-size: 2.6em;
          font-weight: 700;
          margin-bottom: 16px;
          line-height: 1.3;
          letter-spacing: -0.8px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .hero-subtitle {
          font-size: 1.05em;
          margin-bottom: 40px;
          opacity: 0.98;
          line-height: 1.9;
          max-width: 95%;
          margin-left: auto;
          margin-right: auto;
          font-weight: 500;
        }

        .hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ff6b35;
          color: white;
          padding: 14px 28px;
          border: none;
          border-radius: 8px;
          font-size: 1em;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 40px;
        }

        .hero-cta:hover {
          background: #e55a24;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
        }

        .hero-stats {
          display: flex;
          justify-content: space-around;
          margin-top: 40px;
          padding: 20px;
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          font-size: 1.8em;
          font-weight: 700;
          display: block;
        }

        .stat-label {
          font-size: 0.85em;
          opacity: 0.9;
          margin-top: 4px;
        }

        section {
          padding: 40px 24px;
        }

        section h2 {
          font-size: 1.8em;
          font-weight: 700;
          margin-bottom: 28px;
          color: #1a1a1a;
        }

        .step-indicator {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding: 0 20px;
        }

        .step {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #f0f4ff;
          color: #667eea;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2em;
          border: 2px solid #e0e7ff;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .step.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
        }

        .step-line {
          flex: 1;
          height: 2px;
          background: #e0e7ff;
          margin: 0 16px;
          transition: all 0.3s;
        }

        .services-section {
          background: white;
        }

        .services-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .service-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.12);
          display: flex;
          gap: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(102, 126, 234, 0.08);
        }

        .service-card:active {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(102, 126, 234, 0.18);
        }

        .service-image {
          width: 140px;
          height: 140px;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          border-radius: 12px;
        }

        .service-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .service-image::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.15);
          z-index: 1;
        }

        .service-content {
          flex: 1;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .service-name {
          font-size: 1.15em;
          font-weight: 600;
          color: #1a1a1a;
        }

        .service-price {
          font-size: 1.3em;
          font-weight: 700;
          color: #ff6b35;
        }

        .service-meta {
          display: flex;
          gap: 12px;
          font-size: 0.85em;
          color: #666;
          margin-bottom: 8px;
        }

        .service-rating {
          color: #ffc107;
          font-size: 0.9em;
        }

        .service-description {
          font-size: 0.85em;
          color: #666;
          line-height: 1.5;
        }

        .featured-service {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 20px;
          padding: 0;
          overflow: hidden;
          margin-bottom: 20px;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .featured-image {
          width: 100%;
          height: 240px;
          position: relative;
          overflow: hidden;
          border-radius: 16px;
        }

        .featured-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .featured-image::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          z-index: 1;
        }

        .featured-image span {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
          font-size: 3em;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .featured-content {
          padding: 24px;
        }

        .featured-badge {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 0.75em;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .featured-name {
          font-size: 1.4em;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .featured-duration {
          font-size: 0.95em;
          opacity: 0.9;
          margin-bottom: 12px;
        }

        .featured-price {
          font-size: 1.6em;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .featured-description {
          font-size: 0.9em;
          line-height: 1.6;
          opacity: 0.95;
        }

        .why-us {
          background: white;
        }

        .why-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .why-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%);
          padding: 28px 24px;
          border-radius: 16px;
          text-align: center;
          border: 1px solid rgba(102, 126, 234, 0.12);
          box-shadow: 0 2px 12px rgba(102, 126, 234, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .why-card:active {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
        }

        .why-icon {
          font-size: 2.5em;
          margin-bottom: 12px;
        }

        .why-title {
          font-size: 1.05em;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1a1a1a;
        }

        .why-text {
          color: #666;
          line-height: 1.6;
          font-size: 0.9em;
        }

        .therapists-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .therapist-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.12);
          display: flex;
          gap: 0;
          border: 1px solid rgba(102, 126, 234, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .therapist-card:active {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(102, 126, 234, 0.18);
        }

        .therapist-image {
          width: 110px;
          height: 110px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5em;
          flex-shrink: 0;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
        }

        .therapist-image::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        }

        .therapist-image span {
          position: relative;
          z-index: 2;
        }

        .therapist-info {
          flex: 1;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .therapist-name {
          font-size: 1.1em;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .therapist-specialty {
          color: #ff6b35;
          font-size: 0.85em;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .therapist-meta {
          color: #666;
          font-size: 0.85em;
        }

        .therapist-rating {
          color: #ffc107;
          font-size: 0.85em;
        }

        .reviews {
          background: #f8f9fa;
        }

        .review-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 12px rgba(102, 126, 234, 0.08);
          border: 1px solid rgba(102, 126, 234, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          gap: 16px;
        }

        .review-card:active {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.12);
        }

        .review-avatar {
          width: 56px;
          height: 56px;
          min-width: 56px;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }

        .review-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .review-content {
          flex: 1;
        }

        .review-stars {
          color: #ffc107;
          font-size: 0.95em;
          margin-bottom: 8px;
          letter-spacing: 2px;
        }

        .review-text {
          color: #555;
          font-size: 0.9em;
          line-height: 1.7;
          margin-bottom: 12px;
          font-style: italic;
          font-weight: 500;
        }

        .review-author {
          font-weight: 600;
          color: #1a1a1a;
          font-size: 0.85em;
        }

        .newsletter {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 48px 24px;
          border-radius: 20px;
          margin-bottom: 0;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .newsletter h2 {
          color: white;
          margin-bottom: 12px;
        }

        .newsletter p {
          font-size: 0.95em;
          margin-bottom: 24px;
          opacity: 0.95;
        }

        .newsletter-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .newsletter-form input {
          padding: 14px 18px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          font-size: 0.95em;
          background: rgba(255, 255, 255, 0.95);
          transition: all 0.3s;
        }

        .newsletter-form input:focus {
          outline: none;
          border-color: white;
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .newsletter-form input::placeholder {
          color: #999;
        }

        .newsletter-btn {
          padding: 14px 32px;
          background: #ff6b35;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95em;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
        }

        .newsletter-btn:active {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 107, 53, 0.35);
        }

        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-around;
          padding: 12px 0;
          z-index: 99;
        }

        .nav-item {
          flex: 1;
          text-align: center;
          padding: 8px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: #999;
          text-decoration: none;
          font-size: 0.75em;
          transition: color 0.3s;
        }

        .nav-item.active {
          color: #ff6b35;
        }

        .nav-item-icon {
          font-size: 1.5em;
        }

        .nav-spacer {
          height: 80px;
        }

        footer {
          background: #1a1a1a;
          color: #ccc;
          padding: 24px;
          text-align: center;
          font-size: 0.9em;
        }

        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.6);
          z-index: 2000;
          justify-content: center;
          align-items: flex-end;
        }

        .modal.active {
          display: flex;
        }

        .modal-content {
          background: white;
          width: 100%;
          max-height: 90vh;
          border-radius: 20px 20px 0 0;
          padding: 28px 24px;
          overflow-y: auto;
          animation: slideUp 0.3s ease-out;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
        }

        .modal-content h2 {
          color: #1a1a1a;
          font-size: 1.8em;
          margin-bottom: 24px;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(102, 126, 234, 0.1);
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 1.6em;
          cursor: pointer;
          color: #667eea;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .modal-close:active {
          background: rgba(102, 126, 234, 0.2);
          transform: scale(0.95);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #1a1a1a;
          font-size: 0.95em;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e0e7ff;
          border-radius: 10px;
          font-size: 1em;
          font-family: inherit;
          transition: all 0.3s;
          background: white;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #ff6b35;
          box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.12);
          background: white;
        }

        .form-group input::placeholder {
          color: #999;
        }

        .booking-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #ff6b35 0%, #e55a24 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 1.05em;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
        }

        .booking-btn:active {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 107, 53, 0.35);
        }

        @media (max-width: 480px) {
          .hero h1 {
            font-size: 2.2em;
          }

          section h2 {
            font-size: 1.6em;
          }

          .why-grid {
            grid-template-columns: 1fr;
          }
        }
      `}),(0,b.jsxs)("nav",{children:[(0,b.jsx)("div",{className:"logo",children:"🧖‍♀️ ELSPA"}),(0,b.jsxs)("div",{className:"nav-icons",children:[(0,b.jsx)("a",{href:"#",children:"🔍"}),(0,b.jsx)("a",{href:"#",children:"👤"})]})]}),(0,b.jsx)("section",{className:"hero",children:(0,b.jsxs)("div",{className:"hero-content",children:[(0,b.jsx)("div",{className:"hero-badge",children:"✨ BOOK NOW"}),(0,b.jsxs)("h1",{children:["Your Journey to",(0,b.jsx)("br",{}),"Serenity"]}),(0,b.jsxs)("p",{className:"hero-subtitle",children:["프리미엄 테라피스트와 함께하는",(0,b.jsx)("br",{}),"최고의 웰니스 경험"]}),(0,b.jsx)("button",{className:"hero-cta",onClick:e,children:"📅 Book Now →"}),(0,b.jsxs)("div",{className:"hero-stats",children:[(0,b.jsxs)("div",{className:"stat",children:[(0,b.jsx)("span",{className:"stat-number",children:"⭐ 4.9"}),(0,b.jsx)("span",{className:"stat-label",children:"Rating"})]}),(0,b.jsxs)("div",{className:"stat",children:[(0,b.jsx)("span",{className:"stat-number",children:"1.2K+"}),(0,b.jsx)("span",{className:"stat-label",children:"Reviews"})]}),(0,b.jsxs)("div",{className:"stat",children:[(0,b.jsx)("span",{className:"stat-number",children:"10+"}),(0,b.jsx)("span",{className:"stat-label",children:"Experts"})]})]})]})}),(0,b.jsxs)("section",{style:{background:"white",padding:"20px 0"},children:[(0,b.jsxs)("div",{className:"step-indicator",children:[(0,b.jsx)("div",{className:"step active",children:"1"}),(0,b.jsx)("div",{className:"step-line"}),(0,b.jsx)("div",{className:"step",children:"2"}),(0,b.jsx)("div",{className:"step-line"}),(0,b.jsx)("div",{className:"step",children:"3"})]}),(0,b.jsx)("div",{style:{textAlign:"center",padding:"0 24px"},children:(0,b.jsxs)("p",{style:{color:"#666",fontSize:"0.9em"},children:[(0,b.jsx)("strong",{children:"예약 선택"})," • ",(0,b.jsx)("strong",{children:"테라피스트 선택"})," • ",(0,b.jsx)("strong",{children:"예약 완료"})]})})]}),(0,b.jsxs)("section",{className:"services-section",children:[(0,b.jsx)("h2",{children:"추천 코스"}),(0,b.jsxs)("div",{className:"featured-service",children:[(0,b.jsxs)("div",{className:"featured-image",children:[(0,b.jsxs)("picture",{children:[(0,b.jsx)("source",{srcSet:"/images/facilities/facilities_1.webp",type:"image/webp"}),(0,b.jsx)("img",{src:"/images/facilities/facilities_1.jpg",alt:"Swedish Massage Service"})]}),(0,b.jsx)("span",{children:"💆‍♀️"})]}),(0,b.jsxs)("div",{className:"featured-content",children:[(0,b.jsx)("span",{className:"featured-badge",children:"✨ BEST SELLER"}),(0,b.jsx)("div",{className:"featured-name",children:"Swedish Relaxation"}),(0,b.jsx)("div",{className:"featured-duration",children:"⏱️ 60분"}),(0,b.jsx)("div",{className:"featured-price",children:"₱180,000"}),(0,b.jsx)("div",{className:"featured-description",children:"깊고 강한 압력으로 근육의 긴장을 풀어주는 최고의 이완 마사지. 스트레스 해소와 혈액 순환 개선에 최적화된 프리미엄 코스입니다."})]})]}),(0,b.jsxs)("div",{className:"service-card",children:[(0,b.jsx)("div",{className:"service-image",children:(0,b.jsxs)("picture",{children:[(0,b.jsx)("source",{srcSet:"/images/services/services_1.webp",type:"image/webp"}),(0,b.jsx)("img",{src:"/images/services/services_1.jpg",alt:"Traditional Thai Massage"})]})}),(0,b.jsxs)("div",{className:"service-content",children:[(0,b.jsxs)("div",{className:"service-header",children:[(0,b.jsx)("div",{className:"service-name",children:"Traditional Thai"}),(0,b.jsx)("div",{className:"service-price",children:"₱220K"})]}),(0,b.jsxs)("div",{className:"service-meta",children:[(0,b.jsx)("span",{children:"⏱️ 90분"}),(0,b.jsx)("span",{className:"service-rating",children:"⭐ 4.8"})]}),(0,b.jsx)("div",{className:"service-description",children:"전통 타이 마사지로 몸과 마음을 동시에 이완하는 경험"})]})]}),(0,b.jsxs)("div",{className:"service-card",children:[(0,b.jsx)("div",{className:"service-image",children:(0,b.jsxs)("picture",{children:[(0,b.jsx)("source",{srcSet:"/images/services/services_2.webp",type:"image/webp"}),(0,b.jsx)("img",{src:"/images/services/services_2.jpg",alt:"Hot Stone Therapy"})]})}),(0,b.jsxs)("div",{className:"service-content",children:[(0,b.jsxs)("div",{className:"service-header",children:[(0,b.jsx)("div",{className:"service-name",children:"Hot Stone Therapy"}),(0,b.jsx)("div",{className:"service-price",children:"₱200K"})]}),(0,b.jsxs)("div",{className:"service-meta",children:[(0,b.jsx)("span",{children:"⏱️ 60분"}),(0,b.jsx)("span",{className:"service-rating",children:"⭐ 4.7"})]}),(0,b.jsx)("div",{className:"service-description",children:"따뜻한 돌로 혈액 순환을 촉진하는 프리미엄 테라피"})]})]}),(0,b.jsxs)("div",{className:"service-card",children:[(0,b.jsx)("div",{className:"service-image",children:(0,b.jsxs)("picture",{children:[(0,b.jsx)("source",{srcSet:"/images/services/services_3.webp",type:"image/webp"}),(0,b.jsx)("img",{src:"/images/services/services_3.jpg",alt:"Foot Reflexology"})]})}),(0,b.jsxs)("div",{className:"service-content",children:[(0,b.jsxs)("div",{className:"service-header",children:[(0,b.jsx)("div",{className:"service-name",children:"Foot Reflexology"}),(0,b.jsx)("div",{className:"service-price",children:"₱80K"})]}),(0,b.jsxs)("div",{className:"service-meta",children:[(0,b.jsx)("span",{children:"⏱️ 30분"}),(0,b.jsx)("span",{className:"service-rating",children:"⭐ 4.9"})]}),(0,b.jsx)("div",{className:"service-description",children:"발의 피로를 풀어주는 리프레싱 반사 요법 마사지"})]})]})]}),(0,b.jsxs)("section",{className:"why-us",children:[(0,b.jsx)("h2",{children:"왜 ELSPA인가?"}),(0,b.jsxs)("div",{className:"why-grid",children:[(0,b.jsxs)("div",{className:"why-card",children:[(0,b.jsx)("div",{className:"why-icon",children:"🏆"}),(0,b.jsx)("div",{className:"why-title",children:"전문가 팀"}),(0,b.jsx)("div",{className:"why-text",children:"10년+ 경력의 검증된 전문가"})]}),(0,b.jsxs)("div",{className:"why-card",children:[(0,b.jsx)("div",{className:"why-icon",children:"🚗"}),(0,b.jsx)("div",{className:"why-title",children:"픽업 서비스"}),(0,b.jsx)("div",{className:"why-text",children:"24시간 안전한 픽업/드롭"})]}),(0,b.jsxs)("div",{className:"why-card",children:[(0,b.jsx)("div",{className:"why-icon",children:"💯"}),(0,b.jsx)("div",{className:"why-title",children:"만족도 보장"}),(0,b.jsx)("div",{className:"why-text",children:"아니면 100% 환불"})]}),(0,b.jsxs)("div",{className:"why-card",children:[(0,b.jsx)("div",{className:"why-icon",children:"🛡️"}),(0,b.jsx)("div",{className:"why-title",children:"완벽한 안전"}),(0,b.jsx)("div",{className:"why-text",children:"프라이버시 & 보안"})]})]})]}),(0,b.jsxs)("section",{children:[(0,b.jsx)("h2",{children:"프리미엄 테라피스트"}),(0,b.jsxs)("div",{className:"therapists-grid",children:[(0,b.jsxs)("div",{className:"therapist-card",children:[(0,b.jsx)("div",{className:"therapist-image",children:(0,b.jsx)("span",{children:"👩‍💼"})}),(0,b.jsxs)("div",{className:"therapist-info",children:[(0,b.jsx)("div",{className:"therapist-name",children:"Sarah Johnson"}),(0,b.jsx)("div",{className:"therapist-specialty",children:"🏅 Swedish Specialist"}),(0,b.jsxs)("div",{className:"therapist-meta",children:[(0,b.jsx)("div",{className:"therapist-rating",children:"⭐ 4.9 (156 예약)"}),(0,b.jsx)("div",{style:{color:"#999",fontSize:"0.8em"},children:"7년 경력 • 신뢰도 99%"})]})]})]}),(0,b.jsxs)("div",{className:"therapist-card",children:[(0,b.jsx)("div",{className:"therapist-image",children:(0,b.jsx)("span",{children:"👩‍💼"})}),(0,b.jsxs)("div",{className:"therapist-info",children:[(0,b.jsx)("div",{className:"therapist-name",children:"Emma Chen"}),(0,b.jsx)("div",{className:"therapist-specialty",children:"🌴 Thai Massage Expert"}),(0,b.jsxs)("div",{className:"therapist-meta",children:[(0,b.jsx)("div",{className:"therapist-rating",children:"⭐ 4.8 (128 예약)"}),(0,b.jsx)("div",{style:{color:"#999",fontSize:"0.8em"},children:"5년 경력 • 신뢰도 98%"})]})]})]}),(0,b.jsxs)("div",{className:"therapist-card",children:[(0,b.jsx)("div",{className:"therapist-image",children:(0,b.jsx)("span",{children:"👩‍💼"})}),(0,b.jsxs)("div",{className:"therapist-info",children:[(0,b.jsx)("div",{className:"therapist-name",children:"Jessica Lee"}),(0,b.jsx)("div",{className:"therapist-specialty",children:"🌿 Holistic Therapist"}),(0,b.jsxs)("div",{className:"therapist-meta",children:[(0,b.jsx)("div",{className:"therapist-rating",children:"⭐ 4.7 (167 예약)"}),(0,b.jsx)("div",{style:{color:"#999",fontSize:"0.8em"},children:"8년 경력 • 신뢰도 100%"})]})]})]})]})]}),(0,b.jsxs)("section",{className:"reviews",children:[(0,b.jsx)("h2",{children:"고객 후기"}),(0,b.jsxs)("div",{className:"review-card",children:[(0,b.jsx)("div",{className:"review-avatar",children:(0,b.jsxs)("picture",{children:[(0,b.jsx)("source",{srcSet:"/images/reviews/reviews_1.webp",type:"image/webp"}),(0,b.jsx)("img",{src:"/images/reviews/reviews_1.jpg",alt:"Min-ji Kim"})]})}),(0,b.jsxs)("div",{className:"review-content",children:[(0,b.jsx)("div",{className:"review-stars",children:"⭐⭐⭐⭐⭐"}),(0,b.jsx)("p",{className:"review-text",children:'"정말 최고의 경험이었어요! 모든 것이 완벽했습니다."'}),(0,b.jsx)("div",{className:"review-author",children:"Min-ji Kim"})]})]}),(0,b.jsxs)("div",{className:"review-card",children:[(0,b.jsx)("div",{className:"review-avatar",children:(0,b.jsxs)("picture",{children:[(0,b.jsx)("source",{srcSet:"/images/reviews/reviews_2.webp",type:"image/webp"}),(0,b.jsx)("img",{src:"/images/reviews/reviews_2.jpg",alt:"Jun-ho Lee"})]})}),(0,b.jsxs)("div",{className:"review-content",children:[(0,b.jsx)("div",{className:"review-stars",children:"⭐⭐⭐⭐⭐"}),(0,b.jsx)("p",{className:"review-text",children:'"전문성과 친절함이 최고예요. 다시 꼭 방문하겠습니다!"'}),(0,b.jsx)("div",{className:"review-author",children:"Jun-ho Lee"})]})]}),(0,b.jsxs)("div",{className:"review-card",children:[(0,b.jsx)("div",{className:"review-avatar",children:(0,b.jsxs)("picture",{children:[(0,b.jsx)("source",{srcSet:"/images/reviews/reviews_3.webp",type:"image/webp"}),(0,b.jsx)("img",{src:"/images/reviews/reviews_3.jpg",alt:"Su-jin Park"})]})}),(0,b.jsxs)("div",{className:"review-content",children:[(0,b.jsx)("div",{className:"review-stars",children:"⭐⭐⭐⭐⭐"}),(0,b.jsx)("p",{className:"review-text",children:'"가성비도 좋고 픽업 서비스도 최고네요. 추천합니다!"'}),(0,b.jsx)("div",{className:"review-author",children:"Su-jin Park"})]})]})]}),(0,b.jsx)("section",{style:{padding:"40px 24px 100px"},children:(0,b.jsxs)("div",{className:"newsletter",children:[(0,b.jsx)("h2",{style:{marginBottom:"8px"},children:"특가 소식을 먼저 받으세요!"}),(0,b.jsxs)("p",{style:{marginBottom:"20px"},children:["지금 가입하면 ",(0,b.jsx)("strong",{children:"첫 예약 10% 할인"})," 쿠폰"]}),(0,b.jsxs)("div",{className:"newsletter-form",children:[(0,b.jsx)("input",{type:"email",placeholder:"이메일을 입력하세요",required:!0}),(0,b.jsx)("button",{className:"newsletter-btn",children:"✉️ Subscribe"})]})]})}),(0,b.jsxs)("div",{className:"bottom-nav",children:[(0,b.jsxs)("a",{className:"nav-item active",href:"#",children:[(0,b.jsx)("div",{className:"nav-item-icon",children:"🏠"}),(0,b.jsx)("div",{children:"홈"})]}),(0,b.jsxs)("a",{className:"nav-item",href:"#",children:[(0,b.jsx)("div",{className:"nav-item-icon",children:"🔍"}),(0,b.jsx)("div",{children:"검색"})]}),(0,b.jsxs)("a",{className:"nav-item",href:"#",onClick:a=>{a.preventDefault(),e()},children:[(0,b.jsx)("div",{className:"nav-item-icon",children:"📅"}),(0,b.jsx)("div",{children:"예약"})]}),(0,b.jsxs)("a",{className:"nav-item",href:"#",children:[(0,b.jsx)("div",{className:"nav-item-icon",children:"👤"}),(0,b.jsx)("div",{children:"마이"})]})]}),(0,b.jsx)("div",{className:`modal ${a?"active":""}`,onClick:a=>a.target===a.currentTarget&&f(),children:(0,b.jsxs)("div",{className:"modal-content",children:[(0,b.jsx)("button",{className:"modal-close",onClick:f,children:"✕"}),(0,b.jsx)("h2",{style:{marginTop:"20px",marginBottom:"24px"},children:"예약하기"}),(0,b.jsxs)("div",{className:"form-group",children:[(0,b.jsx)("label",{children:"1️⃣ 서비스 선택"}),(0,b.jsxs)("select",{required:!0,children:[(0,b.jsx)("option",{value:"",children:"-- 원하는 서비스를 선택하세요 --"}),(0,b.jsx)("option",{value:"",children:"Swedish Massage (60분) - ₱180,000"}),(0,b.jsx)("option",{value:"",children:"Traditional Thai (90분) - ₱220,000"}),(0,b.jsx)("option",{value:"",children:"Hot Stone Therapy (60분) - ₱200,000"}),(0,b.jsx)("option",{value:"",children:"Foot Massage (30분) - ₱80,000"})]})]}),(0,b.jsxs)("div",{className:"form-group",children:[(0,b.jsx)("label",{children:"2️⃣ 테라피스트 선택"}),(0,b.jsxs)("select",{required:!0,children:[(0,b.jsx)("option",{value:"",children:"-- 자동 배정 또는 선택 --"}),(0,b.jsx)("option",{value:"",children:"Sarah Johnson (⭐ 4.9)"}),(0,b.jsx)("option",{value:"",children:"Emma Chen (⭐ 4.8)"}),(0,b.jsx)("option",{value:"",children:"Jessica Lee (⭐ 4.7)"})]})]}),(0,b.jsxs)("div",{className:"form-group",children:[(0,b.jsx)("label",{children:"3️⃣ 날짜 선택"}),(0,b.jsx)("input",{type:"date",required:!0})]}),(0,b.jsxs)("div",{className:"form-group",children:[(0,b.jsx)("label",{children:"⏰ 시간 선택"}),(0,b.jsxs)("select",{required:!0,children:[(0,b.jsx)("option",{value:"",children:"-- 시간을 선택하세요 --"}),(0,b.jsx)("option",{value:"",children:"14:00"}),(0,b.jsx)("option",{value:"",children:"15:30"}),(0,b.jsx)("option",{value:"",children:"17:00"}),(0,b.jsx)("option",{value:"",children:"18:30"}),(0,b.jsx)("option",{value:"",children:"20:00"})]})]}),(0,b.jsxs)("div",{className:"form-group",children:[(0,b.jsx)("label",{children:"📍 주소"}),(0,b.jsx)("input",{type:"text",placeholder:"예: 강남구 도곡동",required:!0})]}),(0,b.jsx)("button",{className:"booking-btn",onClick:()=>{alert("🎉 예약이 완료되었습니다!\n\n예약번호: #KR1025\n드라이버 추적은 마이페이지에서 확인하세요."),f()},children:"예약 완료"})]})}),(0,b.jsx)("div",{className:"nav-spacer"})]})}])}];

//# sourceMappingURL=src_app_%28landing%29_landing_page_tsx_034sz-3._.js.map
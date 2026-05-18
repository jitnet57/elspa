(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,89136,e=>{"use strict";var t=e.i(43476),s=e.i(61577);e.s(["PriceDisplay",0,({amountUSD:e,rates:a,showPHP:n=!0,className:r="",compact:o=!1})=>{let i=Math.round(e*a.PHP),l=(0,s.formatPrice)(e,"USD"),d=(0,s.formatPrice)(i,"PHP");return o?(0,t.jsxs)("span",{className:`inline-flex items-center gap-1 ${r}`,children:[(0,t.jsx)("span",{className:"font-semibold",children:l}),n&&(0,t.jsxs)("span",{className:"text-sm text-gray-600",children:["(",d,")"]})]}):(0,t.jsxs)("div",{className:`text-center ${r}`,children:[(0,t.jsx)("div",{className:"text-lg font-bold text-blue-600",children:l}),n&&(0,t.jsx)("div",{className:"text-sm text-gray-600",children:d})]})}])},2999,e=>{"use strict";var t=e.i(43476),s=e.i(71645),a=e.i(81489),n=e.i(86627),r=e.i(89136);class o{static async generateInvoicePDF(e,t){let s=this.renderInvoiceHTML(e,t);return this.htmlToPdf(s)}static async generateReceiptPDF(e,t){let s=this.renderReceiptHTML(e,t);return this.htmlToPdf(s)}static renderInvoiceHTML(e,t){let s=new Date(e.issued_at).toLocaleDateString("ko-KR"),a=new Date(e.due_date).toLocaleDateString("ko-KR");return`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Noto Sans KR', sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; }
          .info-section { margin-bottom: 20px; display: flex; justify-content: space-between; }
          .company-info { flex: 1; }
          .bill-info { flex: 1; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">인보이스</div>
        </div>

        <div class="info-section">
          <div class="company-info">
            <strong>${t.name}</strong><br>
            사업자등록번호: ${t.businessNumber}<br>
            주소: ${t.address}<br>
            전화: ${t.phone}
          </div>
          <div class="bill-info">
            <strong>인보이스 번호:</strong> ${e.invoice_number}<br>
            <strong>발급일:</strong> ${s}<br>
            <strong>지급기한:</strong> ${a}
          </div>
        </div>

        <table>
          <tr>
            <th>항목</th>
            <th>수량</th>
            <th>단가</th>
            <th>금액</th>
          </tr>
          <tr>
            <td>정산 수수료</td>
            <td>1</td>
            <td>${e.total_amount.toLocaleString()}</td>
            <td>${e.total_amount.toLocaleString()}원</td>
          </tr>
          <tr class="total-row">
            <td colspan="3">소계</td>
            <td>${e.total_amount.toLocaleString()}원</td>
          </tr>
          <tr>
            <td colspan="3">수수료율 (${e.commission_rate}%)</td>
            <td>${e.commission_amount.toLocaleString()}원</td>
          </tr>
          <tr>
            <td colspan="3">부가세 (10%)</td>
            <td>${e.tax_amount.toLocaleString()}원</td>
          </tr>
          <tr class="total-row">
            <td colspan="3">합계</td>
            <td>${e.net_amount.toLocaleString()}원</td>
          </tr>
        </table>

        <div class="footer">
          <p>이 인보이스는 전자세금계산서입니다.</p>
          <p>질문이 있으신 경우 위의 연락처로 문의해주시기 바랍니다.</p>
        </div>
      </body>
      </html>
    `}static renderReceiptHTML(e,t){let s=new Date(e.paid_at).toLocaleDateString("ko-KR");return`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Noto Sans KR', sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; }
          .details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .amount { font-size: 18px; font-weight: bold; color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">영수증</div>
        </div>

        <div class="details">
          <div class="detail-row">
            <span>영수증 번호:</span>
            <span>${e.receipt_number}</span>
          </div>
          <div class="detail-row">
            <span>인보이스 번호:</span>
            <span>${t.invoice_number}</span>
          </div>
          <div class="detail-row">
            <span>지급일:</span>
            <span>${s}</span>
          </div>
          <div class="detail-row">
            <span>지급방법:</span>
            <span>${"card"===e.payment_method?"카드":"bank_transfer"===e.payment_method?"계좌이체":"현금"}</span>
          </div>
          <div class="detail-row" style="border-top: 2px solid #333; margin-top: 20px; padding-top: 20px;">
            <span>지급 금액:</span>
            <span class="amount">${e.amount.toLocaleString()}원</span>
          </div>
        </div>
      </body>
      </html>
    `}static async htmlToPdf(e){return new Blob([e],{type:"application/pdf"})}static async generateBulkInvoices(e,t){let s=new Map;for(let a of e){let e=await this.generateInvoicePDF(a,t);s.set(a.id,e)}return s}}var i=e.i(47167);class l{static config={kakao_api_key:i.default.env.NEXT_PUBLIC_KAKAO_API_KEY,sms_api_key:i.default.env.NEXT_PUBLIC_SMS_API_KEY,email_smtp_server:i.default.env.EMAIL_SMTP_SERVER,email_username:i.default.env.EMAIL_USERNAME};static async sendKakaoTalk(e,t,s){try{let a=await fetch("/api/messaging/kakao",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:e,content:t,templateId:s})});if(!a.ok)return{success:!1,error:"카카오톡 발송 실패"};let n=await a.json();return{success:!0,messageId:n.messageId}}catch(e){return{success:!1,error:String(e)}}}static async sendSMS(e,t){try{let s=this.isKorean(t)?90:160;t.length>s&&(t=t.substring(0,s-3)+"...");let a=await fetch("/api/messaging/sms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:e,content:t})});if(!a.ok)return{success:!1,error:"SMS 발송 실패"};let n=await a.json();return{success:!0,messageId:n.messageId}}catch(e){return{success:!1,error:String(e)}}}static async sendEmail(e,t,s,a){try{let n=await fetch("/api/messaging/email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:e,subject:t,html:s,attachmentPath:a})});if(!n.ok)return{success:!1,error:"이메일 발송 실패"};let r=await n.json();return{success:!0,messageId:r.messageId}}catch(e){return{success:!1,error:String(e)}}}static async sendInvoiceNotification(e,t,s){let a={kakao:`안녕하세요!

인보이스 ${s.invoiceNumber}가 발급되었습니다.

📄 금액: ${s.amount.toLocaleString()}원
📅 지급기한: ${s.dueDate}

✅ 아래 링크에서 영수증을 확인하세요:
${s.downloadUrl}`,sms:`[ElSpa] 인보이스 ${s.invoiceNumber} 발급 완료. 금액: ${s.amount.toLocaleString()}원, 지급기한: ${s.dueDate}. 상세보기: ${s.downloadUrl}`,email:`<h2>인보이스 발급 안내</h2><p>안녕하세요!</p><p>귀사의 인보이스 <strong>${s.invoiceNumber}</strong>이 발급되었습니다.</p><ul><li><strong>금액:</strong> ${s.amount.toLocaleString()}원</li><li><strong>지급기한:</strong> ${s.dueDate}</li></ul><p><a href="${s.downloadUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">영수증 다운로드</a></p>`};return"kakao"===e&&t.phone?this.sendKakaoTalk(t.phone,a.kakao):"sms"===e&&t.phone?this.sendSMS(t.phone,a.sms):"email"===e&&t.email?this.sendEmail(t.email,`[ElSpa] 인보이스 ${s.invoiceNumber} 발급 안내`,a.email):{success:!1,error:"유효하지 않은 채널 또는 수신자 정보"}}static async sendReceiptNotification(e,t,s){let a={kakao:`안녕하세요!

영수증 ${s.receiptNumber}가 발급되었습니다.

💰 금액: ${s.amount.toLocaleString()}원
💳 결제방법: ${s.paymentMethod}

✅ 아래 링크에서 영수증을 확인하세요:
${s.downloadUrl}`,sms:`[ElSpa] 영수증 ${s.receiptNumber} 발급 완료. 금액: ${s.amount.toLocaleString()}원. 상세보기: ${s.downloadUrl}`,email:`<h2>영수증 발급 완료</h2><p>안녕하세요!</p><p>지급이 완료되었습니다.</p><ul><li><strong>영수증 번호:</strong> ${s.receiptNumber}</li><li><strong>금액:</strong> ${s.amount.toLocaleString()}원</li><li><strong>결제 방법:</strong> ${s.paymentMethod}</li></ul><p><a href="${s.downloadUrl}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">영수증 다운로드</a></p>`};return"kakao"===e&&t.phone?this.sendKakaoTalk(t.phone,a.kakao):"sms"===e&&t.phone?this.sendSMS(t.phone,a.sms):"email"===e&&t.email?this.sendEmail(t.email,`[ElSpa] 영수증 ${s.receiptNumber} 발급 안내`,a.email):{success:!1,error:"유효하지 않은 채널 또는 수신자 정보"}}static async retryMessage(e,t=3){if(e.retry_count>=t)return!1;try{let t;return"kakao"===e.channel?t=await this.sendKakaoTalk(e.recipient_phone,e.content):"sms"===e.channel?t=await this.sendSMS(e.recipient_phone,e.content):"email"===e.channel&&(t=await this.sendEmail(e.recipient_email||"","인보이스 안내",e.content)),t?.success||!1}catch{return!1}}static isKorean(e){return/[㄀-ㅎ|ㅏ-ㅣ|가-힣]/.test(e)}}e.s(["default",0,function(){let{invoices:e,receipts:i,messages:d,rates:c,addMessage:m,updateMessageStatus:p,addNotification:u}=(0,a.useStore)();(0,n.useExchangeRate)();let[h,x]=(0,s.useState)("all"),[g,b]=(0,s.useState)(new Date().toISOString().slice(0,7)),[y,f]=(0,s.useState)(null),v=(0,s.useMemo)(()=>e.filter(e=>{let t="all"===h||e.status===h,s=e.settlement_month===g;return t&&s}),[e,h,g]),S=async t=>{try{let s=e.find(e=>e.id===t);if(!s)return;let a=await o.generateInvoicePDF(s,{name:"ElSpa",businessNumber:"123-45-67890",address:"Seoul, Gangnam-gu",phone:"02-0000-0000"}),n=URL.createObjectURL(a),r=document.createElement("a");r.href=n,r.download=`${s.invoice_number}.pdf`,r.click(),u({type:"success",message:"Invoice download completed",severity:"success",isRead:!1})}catch(e){u({type:"error",message:"Error downloading invoice",severity:"error",isRead:!1})}},w=async(t,s)=>{try{let a=e.find(e=>e.id===t);if(!a)return;let n=await l.sendInvoiceNotification(s,{phone:"010-0000-0000",email:"guide@example.com"},{invoiceNumber:a.invoice_number,amount:a.net_amount,dueDate:new Date(a.due_date).toLocaleDateString("ko-KR"),downloadUrl:`${window.location.origin}/invoices/${t}`});n.success?(await m({invoice_id:t,recipient_phone:"010-0000-0000",recipient_email:"guide@example.com",channel:s,content:`Invoice ${a.invoice_number} sent`,status:"sent",sent_at:new Date().toISOString(),retry_count:0}),u({type:"success",message:`Sent via ${"kakao"===s?"KakaoTalk":"sms"===s?"SMS":"Email"}`,severity:"success",isRead:!1})):u({type:"error",message:`${s} send failed: ${n.error}`,severity:"error",isRead:!1})}catch(e){u({type:"error",message:"Error during sending",severity:"error",isRead:!1})}},j={draft:"Draft",issued:"Issued",sent:"Sent",paid:"Paid",overdue:"Overdue",cancelled:"Cancelled"},N={draft:"bg-gray-100 text-gray-700",issued:"bg-blue-100 text-blue-700",sent:"bg-purple-100 text-purple-700",paid:"bg-green-100 text-green-700",overdue:"bg-red-100 text-red-700",cancelled:"bg-gray-100 text-gray-500"};return(0,t.jsxs)("div",{className:"max-w-7xl mx-auto space-y-6",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("h1",{className:"text-4xl font-bold text-gray-900 mb-2",children:"💳 Settlement & Receipts"}),(0,t.jsx)("p",{className:"text-lg text-gray-600 font-light",children:"Invoice issuance, receipt management and auto-sending"})]}),(0,t.jsxs)("div",{className:"bg-white rounded-xl p-6 shadow-sm border border-stone-100 flex gap-4 items-end",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-sm font-bold text-gray-900 mb-2",children:"Month"}),(0,t.jsx)("input",{type:"month",value:g,onChange:e=>b(e.target.value),className:"px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500"})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("label",{className:"block text-sm font-bold text-gray-900 mb-2",children:"Status"}),(0,t.jsxs)("select",{value:h,onChange:e=>x(e.target.value),className:"px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500",children:[(0,t.jsx)("option",{value:"all",children:"All"}),(0,t.jsx)("option",{value:"draft",children:"Draft"}),(0,t.jsx)("option",{value:"issued",children:"Issued"}),(0,t.jsx)("option",{value:"sent",children:"Sent"}),(0,t.jsx)("option",{value:"paid",children:"Paid"}),(0,t.jsx)("option",{value:"overdue",children:"Overdue"})]})]})]}),(0,t.jsxs)("div",{className:"bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden",children:[(0,t.jsxs)("table",{className:"w-full",children:[(0,t.jsx)("thead",{children:(0,t.jsxs)("tr",{className:"bg-gray-50 border-b border-stone-200",children:[(0,t.jsx)("th",{className:"px-6 py-4 text-left text-sm font-bold text-gray-900",children:"Invoice"}),(0,t.jsx)("th",{className:"px-6 py-4 text-left text-sm font-bold text-gray-900",children:"Amount"}),(0,t.jsx)("th",{className:"px-6 py-4 text-left text-sm font-bold text-gray-900",children:"Due Date"}),(0,t.jsx)("th",{className:"px-6 py-4 text-left text-sm font-bold text-gray-900",children:"Status"}),(0,t.jsx)("th",{className:"px-6 py-4 text-left text-sm font-bold text-gray-900",children:"Actions"})]})}),(0,t.jsx)("tbody",{children:v.map(e=>(0,t.jsxs)("tr",{className:"border-b border-stone-100 hover:bg-gray-50",children:[(0,t.jsxs)("td",{className:"px-6 py-4",children:[(0,t.jsx)("div",{className:"font-semibold text-gray-900",children:e.invoice_number}),(0,t.jsx)("div",{className:"text-sm text-gray-600 font-light",children:e.settlement_month})]}),(0,t.jsx)("td",{className:"px-6 py-4 font-semibold text-gray-900",children:(0,t.jsx)(r.PriceDisplay,{amountUSD:e.net_amount/c.PHP,rates:c,compact:!0,className:"text-sm"})}),(0,t.jsx)("td",{className:"px-6 py-4 text-gray-700",children:new Date(e.due_date).toLocaleDateString("ko-KR")}),(0,t.jsx)("td",{className:"px-6 py-4",children:(0,t.jsx)("span",{className:`px-3 py-1 rounded-full text-xs font-semibold ${N[e.status]}`,children:j[e.status]})}),(0,t.jsx)("td",{className:"px-6 py-4",children:(0,t.jsxs)("div",{className:"flex gap-2",children:[(0,t.jsx)("button",{onClick:()=>S(e.id),className:"px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition",title:"Download PDF",children:"📥"}),(0,t.jsx)("button",{onClick:()=>w(e.id,"kakao"),className:"px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition",title:"Send via KakaoTalk",children:"💬"}),(0,t.jsx)("button",{onClick:()=>w(e.id,"sms"),className:"px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition",title:"Send via SMS",children:"📱"}),(0,t.jsx)("button",{onClick:()=>w(e.id,"email"),className:"px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition",title:"Send via Email",children:"✉️"})]})})]},e.id))})]}),0===v.length&&(0,t.jsx)("div",{className:"px-6 py-12 text-center text-gray-600 font-light",children:"No invoices found."})]}),d.length>0&&(0,t.jsxs)("div",{className:"bg-white rounded-xl shadow-sm border border-stone-100 p-6",children:[(0,t.jsx)("h2",{className:"text-lg font-bold text-gray-900 mb-4",children:"📬 Send History"}),(0,t.jsx)("div",{className:"space-y-2 max-h-60 overflow-y-auto",children:d.slice(-10).reverse().map(e=>(0,t.jsxs)("div",{className:"flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm",children:[(0,t.jsxs)("div",{children:[(0,t.jsxs)("span",{className:"font-semibold text-gray-900",children:["kakao"===e.channel?"💬":"sms"===e.channel?"📱":"✉️"," ",e.recipient_phone||e.recipient_email]}),(0,t.jsx)("span",{className:`ml-2 px-2 py-0.5 rounded text-xs ${"sent"===e.status?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`,children:"sent"===e.status?"Sent":"Failed"})]}),(0,t.jsx)("span",{className:"text-gray-600 font-light",children:new Date(e.sent_at||Date.now()).toLocaleTimeString("ko-KR")})]},e.id))})]})]})}],2999)}]);
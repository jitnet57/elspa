module.exports=[2269,a=>{"use strict";var b=a.i(87924),c=a.i(29677);a.s(["PriceDisplay",0,({amountUSD:a,rates:d,showPHP:e=!0,className:f="",compact:g=!1})=>{let h=Math.round(a*d.PHP),i=(0,c.formatPrice)(a,"USD"),j=(0,c.formatPrice)(h,"PHP");return g?(0,b.jsxs)("span",{className:`inline-flex items-center gap-1 ${f}`,children:[(0,b.jsx)("span",{className:"font-semibold",children:i}),e&&(0,b.jsxs)("span",{className:"text-sm text-gray-600",children:["(",j,")"]})]}):(0,b.jsxs)("div",{className:`text-center ${f}`,children:[(0,b.jsx)("div",{className:"text-lg font-bold text-blue-600",children:i}),e&&(0,b.jsx)("div",{className:"text-sm text-gray-600",children:j})]})}])},48193,a=>{"use strict";var b=a.i(87924),c=a.i(72131),d=a.i(40006),e=a.i(90978),f=a.i(2269);class g{static async generateInvoicePDF(a,b){let c=this.renderInvoiceHTML(a,b);return this.htmlToPdf(c)}static async generateReceiptPDF(a,b){let c=this.renderReceiptHTML(a,b);return this.htmlToPdf(c)}static renderInvoiceHTML(a,b){let c=new Date(a.issued_at).toLocaleDateString("ko-KR"),d=new Date(a.due_date).toLocaleDateString("ko-KR");return`
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
            <strong>${b.name}</strong><br>
            사업자등록번호: ${b.businessNumber}<br>
            주소: ${b.address}<br>
            전화: ${b.phone}
          </div>
          <div class="bill-info">
            <strong>인보이스 번호:</strong> ${a.invoice_number}<br>
            <strong>발급일:</strong> ${c}<br>
            <strong>지급기한:</strong> ${d}
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
            <td>${a.total_amount.toLocaleString()}</td>
            <td>${a.total_amount.toLocaleString()}원</td>
          </tr>
          <tr class="total-row">
            <td colspan="3">소계</td>
            <td>${a.total_amount.toLocaleString()}원</td>
          </tr>
          <tr>
            <td colspan="3">수수료율 (${a.commission_rate}%)</td>
            <td>${a.commission_amount.toLocaleString()}원</td>
          </tr>
          <tr>
            <td colspan="3">부가세 (10%)</td>
            <td>${a.tax_amount.toLocaleString()}원</td>
          </tr>
          <tr class="total-row">
            <td colspan="3">합계</td>
            <td>${a.net_amount.toLocaleString()}원</td>
          </tr>
        </table>

        <div class="footer">
          <p>이 인보이스는 전자세금계산서입니다.</p>
          <p>질문이 있으신 경우 위의 연락처로 문의해주시기 바랍니다.</p>
        </div>
      </body>
      </html>
    `}static renderReceiptHTML(a,b){let c=new Date(a.paid_at).toLocaleDateString("ko-KR");return`
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
            <span>${a.receipt_number}</span>
          </div>
          <div class="detail-row">
            <span>인보이스 번호:</span>
            <span>${b.invoice_number}</span>
          </div>
          <div class="detail-row">
            <span>지급일:</span>
            <span>${c}</span>
          </div>
          <div class="detail-row">
            <span>지급방법:</span>
            <span>${"card"===a.payment_method?"카드":"bank_transfer"===a.payment_method?"계좌이체":"현금"}</span>
          </div>
          <div class="detail-row" style="border-top: 2px solid #333; margin-top: 20px; padding-top: 20px;">
            <span>지급 금액:</span>
            <span class="amount">${a.amount.toLocaleString()}원</span>
          </div>
        </div>
      </body>
      </html>
    `}static async htmlToPdf(a){return new Blob([a],{type:"application/pdf"})}static async generateBulkInvoices(a,b){let c=new Map;for(let d of a){let a=await this.generateInvoicePDF(d,b);c.set(d.id,a)}return c}}class h{static config={kakao_api_key:process.env.NEXT_PUBLIC_KAKAO_API_KEY,sms_api_key:process.env.NEXT_PUBLIC_SMS_API_KEY,email_smtp_server:process.env.EMAIL_SMTP_SERVER,email_username:process.env.EMAIL_USERNAME};static async sendKakaoTalk(a,b,c){try{let d=await fetch("/api/messaging/kakao",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:a,content:b,templateId:c})});if(!d.ok)return{success:!1,error:"카카오톡 발송 실패"};let e=await d.json();return{success:!0,messageId:e.messageId}}catch(a){return{success:!1,error:String(a)}}}static async sendSMS(a,b){try{let c=this.isKorean(b)?90:160;b.length>c&&(b=b.substring(0,c-3)+"...");let d=await fetch("/api/messaging/sms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:a,content:b})});if(!d.ok)return{success:!1,error:"SMS 발송 실패"};let e=await d.json();return{success:!0,messageId:e.messageId}}catch(a){return{success:!1,error:String(a)}}}static async sendEmail(a,b,c,d){try{let e=await fetch("/api/messaging/email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:a,subject:b,html:c,attachmentPath:d})});if(!e.ok)return{success:!1,error:"이메일 발송 실패"};let f=await e.json();return{success:!0,messageId:f.messageId}}catch(a){return{success:!1,error:String(a)}}}static async sendInvoiceNotification(a,b,c){let d={kakao:`안녕하세요!

인보이스 ${c.invoiceNumber}가 발급되었습니다.

📄 금액: ${c.amount.toLocaleString()}원
📅 지급기한: ${c.dueDate}

✅ 아래 링크에서 영수증을 확인하세요:
${c.downloadUrl}`,sms:`[ElSpa] 인보이스 ${c.invoiceNumber} 발급 완료. 금액: ${c.amount.toLocaleString()}원, 지급기한: ${c.dueDate}. 상세보기: ${c.downloadUrl}`,email:`<h2>인보이스 발급 안내</h2><p>안녕하세요!</p><p>귀사의 인보이스 <strong>${c.invoiceNumber}</strong>이 발급되었습니다.</p><ul><li><strong>금액:</strong> ${c.amount.toLocaleString()}원</li><li><strong>지급기한:</strong> ${c.dueDate}</li></ul><p><a href="${c.downloadUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">영수증 다운로드</a></p>`};return"kakao"===a&&b.phone?this.sendKakaoTalk(b.phone,d.kakao):"sms"===a&&b.phone?this.sendSMS(b.phone,d.sms):"email"===a&&b.email?this.sendEmail(b.email,`[ElSpa] 인보이스 ${c.invoiceNumber} 발급 안내`,d.email):{success:!1,error:"유효하지 않은 채널 또는 수신자 정보"}}static async sendReceiptNotification(a,b,c){let d={kakao:`안녕하세요!

영수증 ${c.receiptNumber}가 발급되었습니다.

💰 금액: ${c.amount.toLocaleString()}원
💳 결제방법: ${c.paymentMethod}

✅ 아래 링크에서 영수증을 확인하세요:
${c.downloadUrl}`,sms:`[ElSpa] 영수증 ${c.receiptNumber} 발급 완료. 금액: ${c.amount.toLocaleString()}원. 상세보기: ${c.downloadUrl}`,email:`<h2>영수증 발급 완료</h2><p>안녕하세요!</p><p>지급이 완료되었습니다.</p><ul><li><strong>영수증 번호:</strong> ${c.receiptNumber}</li><li><strong>금액:</strong> ${c.amount.toLocaleString()}원</li><li><strong>결제 방법:</strong> ${c.paymentMethod}</li></ul><p><a href="${c.downloadUrl}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">영수증 다운로드</a></p>`};return"kakao"===a&&b.phone?this.sendKakaoTalk(b.phone,d.kakao):"sms"===a&&b.phone?this.sendSMS(b.phone,d.sms):"email"===a&&b.email?this.sendEmail(b.email,`[ElSpa] 영수증 ${c.receiptNumber} 발급 안내`,d.email):{success:!1,error:"유효하지 않은 채널 또는 수신자 정보"}}static async retryMessage(a,b=3){if(a.retry_count>=b)return!1;try{let b;return"kakao"===a.channel?b=await this.sendKakaoTalk(a.recipient_phone,a.content):"sms"===a.channel?b=await this.sendSMS(a.recipient_phone,a.content):"email"===a.channel&&(b=await this.sendEmail(a.recipient_email||"","인보이스 안내",a.content)),b?.success||!1}catch{return!1}}static isKorean(a){return/[㄀-ㅎ|ㅏ-ㅣ|가-힣]/.test(a)}}a.s(["default",0,function(){let{invoices:a,receipts:i,messages:j,rates:k,addMessage:l,updateMessageStatus:m,addNotification:n}=(0,d.useStore)();(0,e.useExchangeRate)();let[o,p]=(0,c.useState)("all"),[q,r]=(0,c.useState)(new Date().toISOString().slice(0,7)),[s,t]=(0,c.useState)(null),u=(0,c.useMemo)(()=>a.filter(a=>{let b="all"===o||a.status===o,c=a.settlement_month===q;return b&&c}),[a,o,q]),v=async b=>{try{let c=a.find(a=>a.id===b);if(!c)return;let d=await g.generateInvoicePDF(c,{name:"ElSpa",businessNumber:"123-45-67890",address:"Seoul, Gangnam-gu",phone:"02-0000-0000"}),e=URL.createObjectURL(d),f=document.createElement("a");f.href=e,f.download=`${c.invoice_number}.pdf`,f.click(),n({type:"success",message:"Invoice download completed",severity:"success",isRead:!1})}catch(a){n({type:"error",message:"Error downloading invoice",severity:"error",isRead:!1})}},w=async(b,c)=>{try{let d=a.find(a=>a.id===b);if(!d)return;let e=await h.sendInvoiceNotification(c,{phone:"010-0000-0000",email:"guide@example.com"},{invoiceNumber:d.invoice_number,amount:d.net_amount,dueDate:new Date(d.due_date).toLocaleDateString("ko-KR"),downloadUrl:`${window.location.origin}/invoices/${b}`});e.success?(await l({invoice_id:b,recipient_phone:"010-0000-0000",recipient_email:"guide@example.com",channel:c,content:`Invoice ${d.invoice_number} sent`,status:"sent",sent_at:new Date().toISOString(),retry_count:0}),n({type:"success",message:`Sent via ${"kakao"===c?"KakaoTalk":"sms"===c?"SMS":"Email"}`,severity:"success",isRead:!1})):n({type:"error",message:`${c} send failed: ${e.error}`,severity:"error",isRead:!1})}catch(a){n({type:"error",message:"Error during sending",severity:"error",isRead:!1})}},x={draft:"Draft",issued:"Issued",sent:"Sent",paid:"Paid",overdue:"Overdue",cancelled:"Cancelled"},y={draft:"bg-gray-100 text-gray-700",issued:"bg-blue-100 text-blue-700",sent:"bg-purple-100 text-purple-700",paid:"bg-green-100 text-green-700",overdue:"bg-red-100 text-red-700",cancelled:"bg-gray-100 text-gray-500"};return(0,b.jsxs)("div",{className:"max-w-7xl mx-auto space-y-6",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("h1",{className:"text-4xl font-bold text-gray-900 mb-2",children:"💳 Settlement & Receipts"}),(0,b.jsx)("p",{className:"text-lg text-gray-600 font-light",children:"Invoice issuance, receipt management and auto-sending"})]}),(0,b.jsxs)("div",{className:"bg-white rounded-xl p-6 shadow-sm border border-stone-100 flex gap-4 items-end",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"block text-sm font-bold text-gray-900 mb-2",children:"Month"}),(0,b.jsx)("input",{type:"month",value:q,onChange:a=>r(a.target.value),className:"px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500"})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("label",{className:"block text-sm font-bold text-gray-900 mb-2",children:"Status"}),(0,b.jsxs)("select",{value:o,onChange:a=>p(a.target.value),className:"px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-orange-500",children:[(0,b.jsx)("option",{value:"all",children:"All"}),(0,b.jsx)("option",{value:"draft",children:"Draft"}),(0,b.jsx)("option",{value:"issued",children:"Issued"}),(0,b.jsx)("option",{value:"sent",children:"Sent"}),(0,b.jsx)("option",{value:"paid",children:"Paid"}),(0,b.jsx)("option",{value:"overdue",children:"Overdue"})]})]})]}),(0,b.jsxs)("div",{className:"bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden",children:[(0,b.jsxs)("table",{className:"w-full",children:[(0,b.jsx)("thead",{children:(0,b.jsxs)("tr",{className:"bg-gray-50 border-b border-stone-200",children:[(0,b.jsx)("th",{className:"px-6 py-4 text-left text-sm font-bold text-gray-900",children:"Invoice"}),(0,b.jsx)("th",{className:"px-6 py-4 text-left text-sm font-bold text-gray-900",children:"Amount"}),(0,b.jsx)("th",{className:"px-6 py-4 text-left text-sm font-bold text-gray-900",children:"Due Date"}),(0,b.jsx)("th",{className:"px-6 py-4 text-left text-sm font-bold text-gray-900",children:"Status"}),(0,b.jsx)("th",{className:"px-6 py-4 text-left text-sm font-bold text-gray-900",children:"Actions"})]})}),(0,b.jsx)("tbody",{children:u.map(a=>(0,b.jsxs)("tr",{className:"border-b border-stone-100 hover:bg-gray-50",children:[(0,b.jsxs)("td",{className:"px-6 py-4",children:[(0,b.jsx)("div",{className:"font-semibold text-gray-900",children:a.invoice_number}),(0,b.jsx)("div",{className:"text-sm text-gray-600 font-light",children:a.settlement_month})]}),(0,b.jsx)("td",{className:"px-6 py-4 font-semibold text-gray-900",children:(0,b.jsx)(f.PriceDisplay,{amountUSD:a.net_amount/k.PHP,rates:k,compact:!0,className:"text-sm"})}),(0,b.jsx)("td",{className:"px-6 py-4 text-gray-700",children:new Date(a.due_date).toLocaleDateString("ko-KR")}),(0,b.jsx)("td",{className:"px-6 py-4",children:(0,b.jsx)("span",{className:`px-3 py-1 rounded-full text-xs font-semibold ${y[a.status]}`,children:x[a.status]})}),(0,b.jsx)("td",{className:"px-6 py-4",children:(0,b.jsxs)("div",{className:"flex gap-2",children:[(0,b.jsx)("button",{onClick:()=>v(a.id),className:"px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition",title:"Download PDF",children:"📥"}),(0,b.jsx)("button",{onClick:()=>w(a.id,"kakao"),className:"px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition",title:"Send via KakaoTalk",children:"💬"}),(0,b.jsx)("button",{onClick:()=>w(a.id,"sms"),className:"px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition",title:"Send via SMS",children:"📱"}),(0,b.jsx)("button",{onClick:()=>w(a.id,"email"),className:"px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition",title:"Send via Email",children:"✉️"})]})})]},a.id))})]}),0===u.length&&(0,b.jsx)("div",{className:"px-6 py-12 text-center text-gray-600 font-light",children:"No invoices found."})]}),j.length>0&&(0,b.jsxs)("div",{className:"bg-white rounded-xl shadow-sm border border-stone-100 p-6",children:[(0,b.jsx)("h2",{className:"text-lg font-bold text-gray-900 mb-4",children:"📬 Send History"}),(0,b.jsx)("div",{className:"space-y-2 max-h-60 overflow-y-auto",children:j.slice(-10).reverse().map(a=>(0,b.jsxs)("div",{className:"flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm",children:[(0,b.jsxs)("div",{children:[(0,b.jsxs)("span",{className:"font-semibold text-gray-900",children:["kakao"===a.channel?"💬":"sms"===a.channel?"📱":"✉️"," ",a.recipient_phone||a.recipient_email]}),(0,b.jsx)("span",{className:`ml-2 px-2 py-0.5 rounded text-xs ${"sent"===a.status?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`,children:"sent"===a.status?"Sent":"Failed"})]}),(0,b.jsx)("span",{className:"text-gray-600 font-light",children:new Date(a.sent_at||Date.now()).toLocaleTimeString("ko-KR")})]},a.id))})]})]})}],48193)}];

//# sourceMappingURL=src_0fhugb~._.js.map
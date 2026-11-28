/**
 * The Kingdom Leaders (TKL) - ARÉTE'26 Digital JPG Ticket Generator
 * Generates high-resolution (1080x1520) .jpg summit passes with embedded QR codes
 * completely in-browser with zero CORS issues, ready for download and WhatsApp sharing.
 */
(function (window) {
    'use strict';

    /**
     * Helper to draw a rounded rectangle on CanvasRenderingContext2D
     */
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    /**
     * Wrap text cleanly inside maxWidth
     */
    function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
        const words = String(text || '').split(' ');
        let line = '';
        let currentY = y;
        let lineCount = 0;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                lineCount++;
                if (maxLines && lineCount >= maxLines) {
                    ctx.fillText(line.trim() + '...', x, currentY);
                    return currentY + lineHeight;
                }
                ctx.fillText(line.trim(), x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), x, currentY);
        return currentY + lineHeight;
    }

    /**
     * Create an in-memory QR Code canvas synchronously using qrcodejs
     */
    function createQrCanvas(qrText, size) {
        return new Promise((resolve) => {
            if (typeof window.QRCode === 'undefined') {
                resolve(null);
                return;
            }
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '-9999px';
            document.body.appendChild(container);

            try {
                new window.QRCode(container, {
                    text: qrText,
                    width: size,
                    height: size,
                    colorDark: '#020617',
                    colorLight: '#ffffff',
                    correctLevel: window.QRCode.CorrectLevel.M
                });

                setTimeout(() => {
                    const qrCanvas = container.querySelector('canvas');
                    const qrImg = container.querySelector('img');
                    let result = null;
                    if (qrCanvas) {
                        result = qrCanvas;
                    } else if (qrImg) {
                        const c = document.createElement('canvas');
                        c.width = size;
                        c.height = size;
                        c.getContext('2d').drawImage(qrImg, 0, 0, size, size);
                        result = c;
                    }
                    document.body.removeChild(container);
                    resolve(result);
                }, 60);
            } catch (e) {
                if (container.parentNode) document.body.removeChild(container);
                resolve(null);
            }
        });
    }

    /**
     * Extract normalized ticket data from a registration record or raw payload
     */
    function normalizeTicketData(input) {
        const notes = String(input.notes || '');
        let refId = input.refId || input.ref || '';
        if (!refId) {
            const m = notes.match(/ARETE26-[A-Z0-9]{4,10}/i);
            if (m) refId = m[0].toUpperCase();
        }
        if (!refId && input.id) {
            refId = 'ARETE26-' + String(input.id).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
        }
        if (!refId && input.phone) {
            refId = 'ARETE26-' + String(input.phone).replace(/\D/g, '').slice(-6);
        }
        if (!refId) refId = 'ARETE26-000000';

        const fullName = input.fullName || input.full_name || input.name || 'Summit Delegate';
        const company = input.company || input.org || '';
        const role = input.role || '';
        const phone = String(input.phone || '').replace(/\D/g, '').slice(-10);
        const totalGuests = parseInt(input.additionalGuests !== undefined ? input.additionalGuests : (input.additional_guests || 0), 10) || 0;
        const totalParticipants = parseInt(input.totalParticipants || (1 + totalGuests), 10) || 1;
        const totalCost = parseFloat(input.totalCost !== undefined ? input.totalCost : (input.total_cost || 500));
        const paymentStatus = input.paymentStatus || input.payment_status || 'Confirmed';

        let foodSummary = input.foodSummary || '';
        if (!foodSummary) {
            const fm = notes.match(/Food Preference:[^|]*\(Total:\s*([^)]+)\)/i);
            if (fm) foodSummary = fm[1].trim();
        }
        if (!foodSummary) foodSummary = input.foodPreference || 'Standard Dinner';

        let chapter = input.chapter || '';
        if (!chapter) {
            const cm = notes.match(/TKL Chapter:\s*([^|]+)/i) || notes.match(/Chapter:\s*([^|]+)/i);
            if (cm) chapter = cm[1].trim();
        }
        if (!chapter) chapter = input.referred_by || input.referredBy || 'TKL Network';

        const category = (input.isExistingMember === 'Yes' || input.is_existing_member === 'Yes' || (input.entry_type || '').toLowerCase().includes('member'))
            ? 'TKL MEMBER PASS'
            : 'DELEGATE PASS';

        const baseUrl = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file'))
            ? window.location.origin
            : 'https://thekingdomleaders.in';
        const scanUrl = `${baseUrl}/checkin.html?scan=${encodeURIComponent(refId)}`;
        const ticketUrl = `${baseUrl}/ticket.html?ref=${encodeURIComponent(refId)}${phone ? '&p=' + encodeURIComponent(phone) : ''}`;

        return {
            refId,
            fullName,
            company,
            role,
            phone,
            totalParticipants,
            totalGuests,
            totalCost,
            paymentStatus,
            foodSummary,
            chapter,
            category,
            scanUrl,
            ticketUrl
        };
    }

    /**
     * Generate High-Resolution 1080x1520 JPG Ticket Data URL
     */
    async function generateTicketJpgDataUrl(rawData) {
        const data = normalizeTicketData(rawData);
        const W = 1080;
        const H = 1520;

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // 1. Deep Obsidian Background
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, W, H);

        // Subtle radial golden ambient glow
        const radGrad = ctx.createRadialGradient(W / 2, 260, 40, W / 2, 260, 650);
        radGrad.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
        radGrad.addColorStop(0.6, 'rgba(180, 83, 9, 0.06)');
        radGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, W, H);

        // 2. Outer Golden Border Frame
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
        ctx.lineWidth = 6;
        roundRect(ctx, 36, 36, W - 72, H - 72, 42);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
        ctx.lineWidth = 2;
        roundRect(ctx, 52, 52, W - 104, H - 104, 32);
        ctx.stroke();

        // 3. Top Header Banner
        const headerGrad = ctx.createLinearGradient(80, 76, W - 80, 210);
        headerGrad.addColorStop(0, '#d97706');
        headerGrad.addColorStop(0.5, '#fbbf24');
        headerGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = headerGrad;
        roundRect(ctx, 76, 76, W - 152, 138, 24);
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.textAlign = 'center';
        ctx.font = '800 22px system-ui, -apple-system, sans-serif';
        ctx.fillText('THE KINGDOM LEADERS PRESENTS', W / 2, 124);

        ctx.font = '900 54px Georgia, serif';
        ctx.fillText("ARÉTE '26 SUMMIT", W / 2, 185);

        // 4. Category Badge & Ref ID
        ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
        roundRect(ctx, 180, 242, W - 360, 56, 28);
        ctx.fill();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fcd34d';
        ctx.font = '800 24px system-ui, -apple-system, sans-serif';
        ctx.fillText(`★  ${data.category}  •  OFFICIAL E-TICKET  ★`, W / 2, 279);

        // 5. Delegate Name & Company
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 22px system-ui, -apple-system, sans-serif';
        ctx.fillText('DELEGATE NAME', W / 2, 354);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 52px system-ui, -apple-system, sans-serif';
        let nextY = drawWrappedText(ctx, data.fullName.toUpperCase(), W / 2, 415, W - 180, 62, 2);

        if (data.company || data.role) {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '600 26px system-ui, -apple-system, sans-serif';
            const orgLine = [data.role, data.company].filter(Boolean).join(' • ');
            nextY = drawWrappedText(ctx, orgLine, W / 2, nextY + 6, W - 200, 34, 1);
        }

        // 6. Info Grid (2x2 Cards)
        const cardY = Math.max(nextY + 26, 495);
        const boxW = 436;
        const boxH = 112;
        const leftX = 88;
        const rightX = 556;

        const cards = [
            { x: leftX, y: cardY, label: 'TICKET REFERENCE', val: data.refId, color: '#fbbf24', mono: true },
            { x: rightX, y: cardY, label: 'TOTAL PASSES', val: `${data.totalParticipants} Delegate${data.totalParticipants > 1 ? 's' : ''}`, color: '#34d399', mono: false },
            { x: leftX, y: cardY + 132, label: 'DINNER PREFERENCE', val: data.foodSummary, color: '#f8fafc', mono: false },
            { x: rightX, y: cardY + 132, label: 'CHAPTER / NETWORK', val: data.chapter.slice(0, 26), color: '#f8fafc', mono: false }
        ];

        cards.forEach(c => {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            roundRect(ctx, c.x, c.y, boxW, boxH, 20);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.textAlign = 'left';
            ctx.fillStyle = '#94a3b8';
            ctx.font = '700 18px system-ui, -apple-system, sans-serif';
            ctx.fillText(c.label, c.x + 26, c.y + 38);

            ctx.fillStyle = c.color;
            ctx.font = c.mono ? '800 30px monospace' : '800 28px system-ui, -apple-system, sans-serif';
            ctx.fillText(c.val, c.x + 26, c.y + 82);
        });

        // 7. Perforated Ticket Divider
        const divY = cardY + 282;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.lineWidth = 3;
        ctx.setLineDash([14, 14]);
        ctx.beginPath();
        ctx.moveTo(76, divY);
        ctx.lineTo(W - 76, divY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Side cutouts
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(36, divY, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(W - 36, divY, 26, 0, Math.PI * 2);
        ctx.fill();

        // 8. QR Code Container
        const qrBoxSize = 370;
        const qrBoxX = (W - qrBoxSize) / 2;
        const qrBoxY = divY + 34;

        ctx.fillStyle = '#ffffff';
        roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 28);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 6;
        ctx.stroke();

        const qrCanvas = await createQrCanvas(data.scanUrl, 320);
        if (qrCanvas) {
            ctx.drawImage(qrCanvas, qrBoxX + 25, qrBoxY + 25, 320, 320);
        } else {
            ctx.fillStyle = '#020617';
            ctx.textAlign = 'center';
            ctx.font = '800 28px monospace';
            ctx.fillText(data.refId, W / 2, qrBoxY + 190);
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#fbbf24';
        ctx.font = '800 22px system-ui, -apple-system, sans-serif';
        ctx.fillText('SCAN THIS QR AT VENUE ENTRANCE DESK', W / 2, qrBoxY + qrBoxSize + 44);

        // 9. Venue & Date Footer Strip
        const footY = H - 210;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        roundRect(ctx, 88, footY, W - 176, 130, 22);
        ctx.fill();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = '800 24px system-ui, -apple-system, sans-serif';
        ctx.fillText('FRIDAY, 5 DECEMBER 2026  •  5:00 PM – 9:00 PM', W / 2, footY + 48);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '600 22px system-ui, -apple-system, sans-serif';
        ctx.fillText('CSI Synod Centre, 5 Whites Rd, Royapettah, Chennai', W / 2, footY + 90);

        return canvas.toDataURL('image/jpeg', 0.95);
    }

    /**
     * Download the generated JPG ticket image
     */
    async function downloadTicketJpg(rawData) {
        const data = normalizeTicketData(rawData);
        const dataUrl = await generateTicketJpgDataUrl(data);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${data.refId}-Ticket.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return dataUrl;
    }

    /**
     * Convert Data URL to File object for Web Share API
     */
    function dataUrlToFile(dataUrl, filename) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    /**
     * Build official WhatsApp message text
     */
    function buildWhatsAppMessage(rawData) {
        const data = normalizeTicketData(rawData);
        return (
            `🏛️ *THE KINGDOM LEADERS — ARÉTE'26 SUMMIT*\n` +
            `*OFFICIAL DELEGATE TICKET & ENTRY PASS*\n\n` +
            `Dear *${data.fullName}*,\n` +
            `Your registration for *ARÉTE'26 Leadership Summit* is confirmed!\n\n` +
            `🎟️ *Ticket Ref:* \`${data.refId}\`\n` +
            `👤 *Delegate:* ${data.fullName}\n` +
            `👥 *Total Passes:* ${data.totalParticipants} Delegate${data.totalParticipants > 1 ? 's' : ''}\n` +
            `🍽️ *Dinner:* ${data.foodSummary}\n` +
            `📅 *Date:* Friday, 5 December 2026 (5:00 PM – 9:00 PM)\n` +
            `📍 *Venue:* CSI Synod Centre, Royapettah, Chennai\n\n` +
            `📲 *VIEW & DOWNLOAD YOUR DIGITAL PASS:*\n` +
            `👉 ${data.ticketUrl}\n\n` +
            `*(Please present your Ticket QR Code or Phone Number at the entrance desk for instant check-in).*`
        );
    }

    /**
     * Send JPG Ticket via WhatsApp:
     * - Mobile: Shares the .jpg File directly via navigator.share()
     * - Desktop: Downloads the .jpg file and opens WhatsApp Web/App pre-filled to attendee's phone
     */
    async function shareTicketViaWhatsApp(rawData, options = {}) {
        const data = normalizeTicketData(rawData);
        const dataUrl = await generateTicketJpgDataUrl(data);
        const fileName = `${data.refId}-Ticket.jpg`;
        const messageText = buildWhatsAppMessage(data);

        // Try native Web Share API with JPG file attachment (Mobile Android/iOS)
        if (!options.forceDesktopWhatsApp && navigator.share && navigator.canShare) {
            try {
                const file = dataUrlToFile(dataUrl, fileName);
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `ARÉTE'26 Ticket - ${data.fullName}`,
                        text: messageText
                    });
                    return { method: 'web-share-jpg', dataUrl };
                }
            } catch (shareErr) {
                if (shareErr && shareErr.name === 'AbortError') {
                    return { method: 'cancelled', dataUrl };
                }
                console.warn('[TKL Ticket] Web Share fallback to wa.me:', shareErr);
            }
        }

        // Desktop / Fallback: Download the JPG ticket AND open WhatsApp chat
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const waBase = data.phone ? `https://wa.me/91${data.phone}` : `https://wa.me/`;
        const waUrl = `${waBase}?text=${encodeURIComponent(messageText)}`;
        window.open(waUrl, '_blank', 'noopener');

        return { method: 'download-and-wa', dataUrl, fileName };
    }

    window.TKL_TICKET = {
        normalizeTicketData,
        generateTicketJpgDataUrl,
        downloadTicketJpg,
        shareTicketViaWhatsApp,
        buildWhatsAppMessage
    };
})(window);

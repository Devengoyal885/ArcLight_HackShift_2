import * as pdfjsLib from 'pdfjs-dist';

// Use the locally-copied worker (avoids CDN/CORS failures with pdfjs-dist v6)
// The file is served from /public/pdf.worker.min.mjs
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * Extracts plain text from a PDF File object using pdf.js.
 * Works with text-based PDFs (not scanned images).
 */
export async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);

    let pdf: pdfjsLib.PDFDocumentProxy;
    try {
        pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
    } catch (err) {
        console.error('[pdfParser] getDocument failed:', err);
        throw new Error('Could not load PDF. Please ensure it is a valid, non-encrypted PDF file.');
    }

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Join items preserving natural line breaks via the transform y-position
            const items = textContent.items as Array<{ str: string; transform: number[] }>;
            let prevY: number | null = null;
            for (const item of items) {
                const y = item.transform[5];
                if (prevY !== null && Math.abs(y - prevY) > 5) {
                    fullText += '\n';
                }
                fullText += item.str + ' ';
                prevY = y;
            }
            fullText += '\n';
        } catch (pageErr) {
            console.warn(`[pdfParser] Could not extract text from page ${i}:`, pageErr);
        }
    }

    const trimmed = fullText.trim();
    if (!trimmed) {
        throw new Error('PDF TEXT EXTRACTION FAILED: Your PDF contains no readable text characters (it might be a scanned image, a photo, or flattened). Our system needs to read the actual text before sending it to the AI. Please either upload a text-based PDF (like one saved from Word/Google Docs) or just PASTE your text directly into the box.');
    }

    return trimmed;
}

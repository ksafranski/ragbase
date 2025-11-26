// Client-side file parsing utilities

export interface ParsedDocument {
  text: string;
  metadata?: Record<string, any>;
}

/**
 * Parse CSV file and extract documents
 * If 'text' column exists, use it. Otherwise, combine all columns.
 */
export async function parseCSV(file: File): Promise<ParsedDocument[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV file is empty or invalid'));
          return;
        }
        
        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const hasTextColumn = headers.includes('text');
        
        const documents: ParsedDocument[] = [];
        
        // Parse rows
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          
          if (values.length !== headers.length) continue;
          
          const row: Record<string, string> = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx];
          });
          
          // If 'text' column exists, use it as the main text
          if (hasTextColumn && row.text) {
            const { text, ...metadata } = row;
            documents.push({
              text: text,
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined
            });
          } else {
            // Otherwise, create text from all columns
            const text = headers
              .map((header, idx) => `${header}: ${values[idx]}`)
              .join(' | ');
            documents.push({ text });
          }
        }
        
        resolve(documents);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file);
  });
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

/**
 * Parse JSON file and extract documents
 */
export async function parseJSON(file: File): Promise<ParsedDocument[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        
        const documents: ParsedDocument[] = [];
        
        if (Array.isArray(data)) {
          // Array of items - each item becomes a document
          data.forEach(item => {
            if (typeof item === 'string') {
              documents.push({ text: item });
            } else if (typeof item === 'object' && item !== null) {
              const text = item.text || JSON.stringify(item);
              const { text: _, ...metadata } = item;
              documents.push({
                text,
                metadata: Object.keys(metadata).length > 0 ? metadata : undefined
              });
            }
          });
        } else if (typeof data === 'object' && data !== null) {
          // Single object - chunk by top-level keys
          Object.entries(data).forEach(([key, value]) => {
            documents.push({
              text: `${key}: ${JSON.stringify(value)}`,
              metadata: { key }
            });
          });
        } else {
          // Single value
          documents.push({ text: JSON.stringify(data) });
        }
        
        resolve(documents);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read JSON file'));
    reader.readAsText(file);
  });
}

/**
 * Parse XLSX file using SheetJS (xlsx)
 * Note: This requires the 'xlsx' npm package
 */
export async function parseXLSX(file: File): Promise<ParsedDocument[]> {
  // Import xlsx at the top level to ensure proper bundling
  const XLSX = await import('xlsx');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          reject(new Error('XLSX file is empty or invalid'));
          return;
        }
        
        const headers = jsonData[0] as string[];
        const hasTextColumn = headers.includes('text');
        const documents: ParsedDocument[] = [];
        
        // Parse rows
        for (let i = 1; i < jsonData.length; i++) {
          const values = jsonData[i];
          if (!values || values.length === 0) continue;
          
          const row: Record<string, any> = {};
          headers.forEach((header, idx) => {
            if (values[idx] !== undefined && values[idx] !== null) {
              row[header] = values[idx];
            }
          });
          
          if (hasTextColumn && row.text) {
            const { text, ...metadata } = row;
            documents.push({
              text: String(text),
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined
            });
          } else {
            const text = headers
              .map((header, idx) => values[idx] ? `${header}: ${values[idx]}` : '')
              .filter(Boolean)
              .join(' | ');
            if (text) {
              documents.push({ text });
            }
          }
        }
        
        resolve(documents);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read XLSX file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse PDF file using PDF.js
 * Note: This requires the 'pdfjs-dist' npm package
 */
export async function parsePDF(file: File): Promise<ParsedDocument[]> {
  // Import pdfjs-dist
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        
        const textChunks: string[] = [];
        
        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          if (pageText.trim()) {
            textChunks.push(pageText);
          }
        }
        
        // Combine all text and chunk it
        const fullText = textChunks.join('\n\n');
        const documents = chunkText(fullText);
        
        resolve(documents.map(text => ({ text })));
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Chunk text into smaller pieces with overlap
 */
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.substring(start, end));
    start = end - overlap;
  }
  
  return chunks;
}

/**
 * Deduplicate documents based on text content
 */
function deduplicateDocuments(documents: ParsedDocument[]): ParsedDocument[] {
  const seen = new Set<string>();
  const unique: ParsedDocument[] = [];
  
  for (const doc of documents) {
    const normalized = doc.text.trim().toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(doc);
    }
  }
  
  return unique;
}

/**
 * Main function to parse any supported file type
 */
export async function parseFile(file: File): Promise<ParsedDocument[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  let documents: ParsedDocument[];
  
  switch (extension) {
    case 'csv':
      documents = await parseCSV(file);
      break;
    case 'json':
      documents = await parseJSON(file);
      break;
    case 'xlsx':
    case 'xls':
      documents = await parseXLSX(file);
      break;
    case 'pdf':
      documents = await parsePDF(file);
      break;
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
  
  // Deduplicate documents
  return deduplicateDocuments(documents);
}


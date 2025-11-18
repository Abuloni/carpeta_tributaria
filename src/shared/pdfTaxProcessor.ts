/**
 * TypeScript conversion of T-SQL script for processing tax document PDF text
 * Processes "Carpeta Tributaria" tax form data from Chilean SII (Tax Service)
 */

// Interfaces matching the original SQL table structures
export interface FileTxtRow {
  fila: number;
  campo: string;
}

export interface FilaTopRow {
  fila: number;
  filatop: number | null;
  periodo: string;
  lineaPeriodo: string;
  lineaCredito: string;
  lineaTotalCredito: string;
  lineaDebito: string;
  lineaFacturas: string;
  credito: number;
  totalCredito: number;
  debito: number;
  facturas: number;
}

export interface PeriRow {
  fila: number;
  campo: string;
  maxfila: number;
  nombre: string;
}

export interface TabTextoRow {
  ind: number;
  texto: string;
}

export interface DatosCarpetaTribRow {
  tipo: number;
  orden: number;
  stytr: number;
  numero_scr: number;
  mes: number;
  anio: number;
  periodo: string;
  lineaPeriodo: string;
  lineaCredito: string;
  lineaTotalCredito: string;
  lineaDebito: string;
  lineaFacturas: string;
  credito: number;
  creditoxFactor: number;
  debito: number;
  debitoxFactor: number;
  flujoIngreso: number;
  facturas: number;
  fecha_Ingreso: Date;
  nombre_Mes: string;
}

export interface ProcessingResult {
  data: DatosCarpetaTribRow[];
  totalRows: DatosCarpetaTribRow;
  averageRows: DatosCarpetaTribRow;
}

/**
 * Main function to process PDF text and extract tax data
 * @param pdfText - The complete PDF text as a string
 * @param numeroScr - Screen number identifier (default: 1)
 * @returns ProcessingResult with processed tax data
 */
export function processTaxPdfText(pdfText: string, numeroScr: number = 1): ProcessingResult {
  // Split PDF text into lines and create FileTxt array
  const lines = pdfText.split('\n').filter(line => line.trim() !== '');
  const filetxt: FileTxtRow[] = lines.map((line, index) => ({
    fila: index + 1,
    campo: line.trim()
  }));

  // Process the data following the original SQL logic
  const filatopData = extractPeriodData(filetxt);
  const processedData = extractTaxData(filatopData, filetxt);
  
  return calculateResults(processedData, numeroScr);
}

/**
 * Extract period information from the text lines
 */
function extractPeriodData(filetxt: FileTxtRow[]): FilaTopRow[] {
  const peri: PeriRow[] = [];
  const filatop: FilaTopRow[] = [];

  // First attempt: Look for PERIODO with % format
  filetxt.forEach(row => {
    if (row.campo.includes('PERIODO') && 
        row.campo.includes('15') && 
        row.campo.includes(' / ') && 
        !row.campo.includes('PERIODO SIN')) {
      peri.push({
        fila: row.fila,
        campo: row.campo,
        maxfila: 0,
        nombre: ''
      });
    }
  });

  // If no periods found, try alternative pattern
  if (peri.length === 0) {
    filetxt.forEach(row => {
      if (row.campo.includes('PERIODO') && 
          row.campo.includes('[15]') && 
          !row.campo.includes('PERIODO SIN')) {
        peri.push({
          fila: row.fila,
          campo: row.campo,
          maxfila: 0,
          nombre: ''
        });
      }
    });
  }

  // Create FilaTop entries
  peri.forEach(periRow => {
    const nextPeriodFila = peri.find(p => p.fila > periRow.fila)?.fila || null;
    
    // Find max file line for FORM 22 if no next period
    let maxFile: number | null = null;
    if (!nextPeriodFila) {
      const formLines = filetxt.filter(f => 
        f.campo.includes('FORM.') && f.campo.includes('22')
      );
      if (formLines.length > 0) {
        maxFile = formLines[0].fila;
      }
    }

    filatop.push({
      fila: periRow.fila,
      filatop: nextPeriodFila || maxFile,
      periodo: '',
      lineaPeriodo: '',
      lineaCredito: '',
      lineaTotalCredito: '',
      lineaDebito: '',
      lineaFacturas: '',
      credito: 0,
      totalCredito: 0,
      debito: 0,
      facturas: 0
    });
  });

  return filatop;
}

/**
 * Extract tax data from the identified periods
 */
function extractTaxData(filatop: FilaTopRow[], filetxt: FileTxtRow[]): FilaTopRow[] {
  // Extract period information
  filatop.forEach(row => {
    const periodLine = filetxt.find(f => f.fila === row.fila);
    if (periodLine) {
      row.lineaPeriodo = periodLine.campo.trim();
      row.periodo = extractPeriod(periodLine.campo);
    }
  });

  // Extract facturas (invoices)
  extractFacturas(filatop, filetxt);

  // Extract debito (debits)
  extractDebito(filatop, filetxt);

  // Extract credito (credits)
  extractCredito(filatop, filetxt);

  // Extract total credito
  extractTotalCredito(filatop, filetxt);

  return filatop;
}

/**
 * Extract period from line text
 */
function extractPeriod(lineaPeriodo: string): string {
  let periodo = lineaPeriodo.replace('PERIODO', '').trim();
  
  // Find position of '15' and extract after it
  const pos15 = periodo.indexOf('15');
  if (pos15 !== -1) {
    periodo = periodo.substring(pos15 + 2).replace(/\s/g, '');
  }

  // Format as MM/YYYY if not already formatted
  if (!periodo.includes('/') && periodo.length === 6) {
    const year = periodo.substring(0, 4);
    const month = periodo.substring(4, 6);
    periodo = `${month}/${year}`;
  }

  return periodo;
}

/**
 * Extract invoice count from text
 */
function extractFacturas(filatop: FilaTopRow[], filetxt: FileTxtRow[]): void {
  filatop.forEach(row => {
    // Find line with '503' (invoice quantity code)
    for (let i = row.fila; i < (row.filatop || filetxt.length); i++) {
      const line = filetxt.find(f => f.fila === i);
      if (line && ((line.campo.includes(' 503 ')) || (line.campo.startsWith('503 ')) )) {
        row.lineaFacturas = line.campo;
        
        // Extract number after 'EMITIDAS'
        const text = line.campo;
        const emitidAsPos = text.indexOf('AS EMITIDAS');
        if (emitidAsPos !== -1) {
          let afterEmitidas = text.substring(emitidAsPos + 12);
          
          // Remove 'TOTAL' if present
          if (afterEmitidas.includes('TOTAL')) {
            continue;
          }

          // Extract number before 'DÉBITOS'
          const debitosPos = afterEmitidas.indexOf('DÉBITOS');
          if (debitosPos !== -1) {
            afterEmitidas = afterEmitidas.substring(0, debitosPos);
          }

          // Clean and extract first number
          const numbers = afterEmitidas.replace(/\./g, '').match(/\d+/);
          if (numbers) {
            row.facturas = parseInt(numbers[0]) || 0;
          }
        }
        break;
      }
    }
  });
}

/**
 * Extract debit amount from text
 */
function extractDebito(filatop: FilaTopRow[], filetxt: FileTxtRow[]): void {
  filatop.forEach(row => {
    // Find line with '538' and 'TOTAL' and 'DÉBITOS'
    for (let i = row.fila; i < (row.filatop || filetxt.length); i++) {
      const line = filetxt.find(f => f.fila === i);
      if (line && ((line.campo.includes(' 538 ')) || (line.campo.startsWith('538 ')) ) && 
          line.campo.includes('TOTAL') && 
          line.campo.includes('DÉBITOS')) {
        
        row.lineaDebito = line.campo.trim();
        
        // Extract amount after 'DÉBITOS'
        const debitosPos = line.campo.indexOf('DÉBITOS');
        if (debitosPos !== -1) {
          let amount = line.campo.substring(debitosPos + 7).trim();
          amount = amount.replace(/\./g, '');
          
          const numbers = amount.match(/\d+/);
          if (numbers) {
            row.debito = parseInt(numbers[0]) || 0;
          }
        }
        break;
      }
    }
  });
}

/**
 * Extract credit amount from text
 */
function extractCredito(filatop: FilaTopRow[], filetxt: FileTxtRow[]): void {
  filatop.forEach(row => {
    // Find line with '520' and 'GIRO' and 'FACT'
    for (let i = row.fila; i < (row.filatop || filetxt.length); i++) {
      const line = filetxt.find(f => f.fila === i);
      if (line && ((line.campo.includes(' 520 ')) || (line.campo.startsWith('520 ')) ) && 
          line.campo.includes('GIRO') && 
          line.campo.includes('FACT')) {
        
        row.lineaCredito = line.campo.trim();
        
        // Extract amount after 'FACT. DEL GIRO' or 'GIRO'
        let text = line.campo;
        const factGiroPos = text.indexOf('FACT. DEL GIRO');
        if (factGiroPos !== -1) {
          text = text.substring(factGiroPos + 14);
        } else {
          const giroPos = text.indexOf('GIRO');
          if (giroPos !== -1) {
            text = text.substring(giroPos + 4);
          }
        }
        
        text = text.replace(/\./g, '').trim();
        const numbers = text.match(/\d+/);
        if (numbers) {
          row.credito = parseInt(numbers[0]) || 0;
        }
        break;
      }
    }
  });
}

/**
 * Extract total credit amount from text
 */
function extractTotalCredito(filatop: FilaTopRow[], filetxt: FileTxtRow[]): void {
  filatop.forEach(row => {
    // Find line with '537' and 'CRÉDITOS' and 'TOTAL'
    for (let i = row.fila; i < (row.filatop || filetxt.length); i++) {
      const line = filetxt.find(f => f.fila === i);
      if (line && ((line.campo.includes(' 537 ')) || (line.campo.startsWith('537 ')) ) && 
          line.campo.includes('CRÉDITOS') && 
          line.campo.includes('TOTAL')) {
        
        row.lineaTotalCredito = line.campo.trim();
        
        // Extract amount after 'TOS'
        const tosPos = line.campo.indexOf('TOS');
        if (tosPos !== -1) {
          let amount = line.campo.substring(tosPos + 3).trim();
          amount = amount.replace(/\./g, '');
          
          const numbers = amount.match(/\d+/);
          if (numbers && !isNaN(parseInt(numbers[0]))) {
            row.totalCredito = parseInt(numbers[0]) || 0;
          }
        }
        break;
      }
    }
  });

  // If credito is 0, use totalCredito
  filatop.forEach(row => {
    if (row.credito === 0) {
      row.credito = row.totalCredito;
    }
  });
}

/**
 * Calculate final results with totals and averages
 */
function calculateResults(filatop: FilaTopRow[], numeroScr: number): ProcessingResult {
  const factor = 52631199999 / 10000000000 / 1000; // 0.0052631199999
  
  const data: DatosCarpetaTribRow[] = filatop.map((row, index) => {
    const [month, year] = row.periodo.split('/');
    const mes = parseInt(month);
    const anio = parseInt(year);
    
    return {
      tipo: 1,
      orden: index + 1,
      stytr: (index + 1) % 2,
      numero_scr: numeroScr,
      mes,
      anio,
      periodo: row.periodo,
      lineaPeriodo: row.lineaPeriodo,
      lineaCredito: row.lineaCredito,
      lineaTotalCredito: row.lineaTotalCredito,
      lineaDebito: row.lineaDebito,
      lineaFacturas: row.lineaFacturas,
      credito: row.credito || 0,
      creditoxFactor: Math.round((row.credito || 0) * factor),
      debito: row.debito || 0,
      debitoxFactor: Math.round((row.debito || 0) * factor),
      flujoIngreso: Math.round(((row.debito || 0) - (row.credito || 0)) * factor),
      facturas: row.facturas || 0,
      fecha_Ingreso: new Date(),
      nombre_Mes: getMonthName(mes)
    };
  }).sort((a, b) => {
    if (a.anio !== b.anio) return a.anio - b.anio;
    return a.mes - b.mes;
  });

  // Calculate totals
  const totalRows: DatosCarpetaTribRow = {
    tipo: 2,
    orden: 8888,
    stytr: 0,
    numero_scr: numeroScr,
    mes: 0,
    anio: 0,
    periodo: '',
    lineaPeriodo: '',
    lineaCredito: '',
    lineaTotalCredito: '',
    lineaDebito: '',
    lineaFacturas: '',
    credito: data.reduce((sum, row) => sum + row.credito, 0),
    creditoxFactor: data.reduce((sum, row) => sum + row.creditoxFactor, 0),
    debito: data.reduce((sum, row) => sum + row.debito, 0),
    debitoxFactor: data.reduce((sum, row) => sum + row.debitoxFactor, 0),
    flujoIngreso: data.reduce((sum, row) => sum + row.flujoIngreso, 0),
    facturas: data.reduce((sum, row) => sum + row.facturas, 0),
    fecha_Ingreso: new Date(),
    nombre_Mes: ''
  };

  // Calculate averages
  const monthsReported = data.length;
  const averageRows: DatosCarpetaTribRow = {
    tipo: 3,
    orden: 9999,
    stytr: 0,
    numero_scr: numeroScr,
    mes: 0,
    anio: 0,
    periodo: '',
    lineaPeriodo: '',
    lineaCredito: '',
    lineaTotalCredito: '',
    lineaDebito: '',
    lineaFacturas: '',
    credito: monthsReported > 0 ? Math.round(totalRows.credito / monthsReported) : 0,
    creditoxFactor: monthsReported > 0 ? Math.round(totalRows.creditoxFactor / monthsReported) : 0,
    debito: monthsReported > 0 ? Math.round(totalRows.debito / monthsReported) : 0,
    debitoxFactor: monthsReported > 0 ? Math.round(totalRows.debitoxFactor / monthsReported) : 0,
    flujoIngreso: monthsReported > 0 ? Math.round(totalRows.flujoIngreso / monthsReported) : 0,
    facturas: monthsReported > 0 ? Math.round(totalRows.facturas / monthsReported) : 0,
    fecha_Ingreso: new Date(),
    nombre_Mes: ''
  };

  return {
    data,
    totalRows,
    averageRows
  };
}

/**
 * Get month name in Spanish (first 3 characters)
 */
function getMonthName(mes: number): string {
  const months = [
    '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[mes] || '';
}

/**
 * Format number with thousand separators (like SQL FORMAT function)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('es-CL');
}

/**
 * Get formatted results similar to original SQL output
 */
export function getFormattedResults(result: ProcessingResult): any[] {
  const formatRow = (row: DatosCarpetaTribRow) => ({
    ...row,
    credito: formatNumber(row.credito),
    creditoxFactor: formatNumber(row.creditoxFactor),
    debito: formatNumber(row.debito),
    debitoxFactor: formatNumber(row.debitoxFactor),
    flujoIngreso: formatNumber(row.flujoIngreso),
    facturas: formatNumber(row.facturas)
  });

  return [
    ...result.data.map(formatRow),
    formatRow(result.totalRows),
    formatRow(result.averageRows)
  ].sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo - b.tipo;
    return a.orden - b.orden;
  });
}
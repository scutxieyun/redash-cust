import XLSX from 'xlsx';
import FileSaver from 'file-saver';

function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i !== s.length; i += 1) view[i] = s.charCodeAt(i) & 0xFF;
  return buf;
}

function filter(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/<\/?[^>]*>/g, '');
  }
  return obj;
}

function downloadXlsxInternal(queryResult, fileName) {
  if (queryResult && queryResult.getData() !== null) {
    const rows = queryResult.getData();
    const columns = queryResult.getColumns();
    const data = [];
    rows.forEach((row) => {
      const jsonObj = [];
      columns.forEach((col) => {
        jsonObj[col.title] = filter(row[col.name]);
      });
      data.push(jsonObj);
    });
    const wb = { SheetNames: ['Sheet1'], Sheets: {}, Props: {} };
    wb.Sheets.Sheet1 = XLSX.utils.json_to_sheet(data);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'binary' });
    FileSaver.saveAs(new Blob([s2ab(wbout)], { type: 'application/octet-stream' }), fileName);
  }
}

export default class XlsxGenerator {
  constructor(queryResult) {
    this.queryResult = queryResult;
  }

  downloadXlsx(fileName) {
    downloadXlsxInternal(this.queryResult, fileName);
  }
}


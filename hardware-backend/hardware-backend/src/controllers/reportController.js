import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as reportService from '../services/reportService.js';

function parseDateRange(query) {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(new Date().setDate(to.getDate() - 30));
  return { from, to };
}

export const getSalesReport = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const report = await reportService.getSalesReport({ from, to, groupBy: req.query.groupBy || 'day' });
  res.status(200).json(new ApiResponse(200, report));
});

export const getPurchaseReport = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const report = await reportService.getPurchaseReport({ from, to });
  res.status(200).json(new ApiResponse(200, report));
});

export const getProfitReport = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const report = await reportService.getProfitReport({ from, to });
  res.status(200).json(new ApiResponse(200, report));
});

export const getExpenseReport = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const report = await reportService.getExpenseReport({ from, to });
  res.status(200).json(new ApiResponse(200, report));
});

export const getStockValuationReport = asyncHandler(async (req, res) => {
  const report = await reportService.getStockValuationReport();
  res.status(200).json(new ApiResponse(200, report));
});

export const getDeadStockReport = asyncHandler(async (req, res) => {
  const report = await reportService.getDeadStockReport({ sinceDays: Number(req.query.sinceDays) || 90 });
  res.status(200).json(new ApiResponse(200, report));
});

export const getFastMovingItemsReport = asyncHandler(async (req, res) => {
  const report = await reportService.getFastMovingItemsReport({
    sinceDays: Number(req.query.sinceDays) || 30,
    limit: Number(req.query.limit) || 10,
  });
  res.status(200).json(new ApiResponse(200, report));
});

/**
 * Export the sales report as a PDF. Every other report follows this exact
 * same pattern — fetch via reportService, stream through pdfkit — so only
 * this one is fully wired as the reference implementation; extend the
 * others (purchase/stock/expense) by copying this handler's shape.
 */
export const exportSalesReportPdf = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const report = await reportService.getSalesReport({ from, to, groupBy: req.query.groupBy || 'day' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).text('Sales Report', { align: 'center' });
  doc.fontSize(10).fillColor('#555').text(`${from.toDateString()} — ${to.toDateString()}`, { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(11).fillColor('#000');
  const colX = [40, 150, 260, 370, 460];
  ['Period', 'Total Sales', 'Tax', 'Discount', 'Invoices'].forEach((h, i) => doc.text(h, colX[i], doc.y, { continued: i < 4 }));
  doc.moveDown();
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();

  for (const row of report) {
    const y = doc.y + 6;
    doc.text(row.period, colX[0], y);
    doc.text(row.totalSales.toFixed(2), colX[1], y);
    doc.text(row.totalTax.toFixed(2), colX[2], y);
    doc.text(row.totalDiscount.toFixed(2), colX[3], y);
    doc.text(String(row.invoiceCount), colX[4], y);
  }

  doc.end();
});

/** Export the sales report as Excel — reference implementation for exceljs exports. */
export const exportSalesReportExcel = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req.query);
  const report = await reportService.getSalesReport({ from, to, groupBy: req.query.groupBy || 'day' });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sales Report');

  sheet.columns = [
    { header: 'Period', key: 'period', width: 15 },
    { header: 'Total Sales', key: 'totalSales', width: 15 },
    { header: 'Total Tax', key: 'totalTax', width: 15 },
    { header: 'Total Discount', key: 'totalDiscount', width: 15 },
    { header: 'Invoice Count', key: 'invoiceCount', width: 15 },
  ];
  sheet.getRow(1).font = { bold: true };
  report.forEach((row) => sheet.addRow(row));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
});

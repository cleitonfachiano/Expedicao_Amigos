import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { ChecklistItem, Transaction, Profile, Expedition } from '../store/useStore';

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

/** Remove emojis e caracteres fora do Latin-1 para evitar corrupção no jsPDF helvetica */
const pdfSafe = (s?: string) => (s ?? '').replace(/[^\u0000-\u00FF]/g, '').replace(/\s+/g, ' ').trim();

const fmtBRL = (v?: number) =>
    v != null
        ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '-';

const fmtQtd = (q?: number | string, u?: string) =>
    q != null
        ? `${Number(q).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ${u || ''}`.trim()
        : '-';

const today = () => new Date().toLocaleDateString('pt-BR');

const makeFilename = (base: string, ext: string) =>
    `${pdfSafe(base).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${ext}`;

const PRIMARY   = [41,  98, 255] as [number, number, number];
const GREEN     = [22, 163,  74] as [number, number, number];
const GRAY_HEAD = [55,  65,  81] as [number, number, number];
const GRAY_ROW  = [248, 250, 252] as [number, number, number];
const GRAY_FOOT = [229, 231, 235] as [number, number, number];

const addPageNumbers = (doc: jsPDF) => {
    const total = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        const w = doc.internal.pageSize.getWidth();
        const h = doc.internal.pageSize.getHeight();
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text(`Pagina ${i} de ${total}`, w - 12, h - 6, { align: 'right' });
    }
};

// ─────────────────────────────────────────
// 1. LISTA DE ITENS → PDF
// ─────────────────────────────────────────

export function exportListToPdf(
    items: ChecklistItem[],
    expedition: Expedition,
    tab: 'Mercado' | 'Acampamento'
) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const filtered = items.filter(i => i.category === tab);
    const grandTotal = filtered.reduce((s, i) => s + (i.totalPrice || 0), 0);
    const checkedCount = filtered.filter(i => i.isChecked).length;
    const tabLabel = tab === 'Mercado' ? 'Lista de Mercado' : 'Itens de Acampamento';

    // ── Cabeçalho ──
    doc.setFillColor(41, 98, 255);
    doc.rect(0, 0, 297, 22, 'F');
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(pdfSafe(`Expedicao ${expedition.name} - ${tabLabel}`), 14, 13);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 220, 255);
    doc.text(
        pdfSafe(`${expedition.location} - ${expedition.year} - Gerado em: ${today()} - ${checkedCount}/${filtered.length} itens marcados`),
        14, 19
    );

    // ── Tabela ──
    autoTable(doc, {
        startY: 26,
        head: [['Produto', 'Grupo Bebida', 'Quantidade', 'P. Unitário', 'Total', 'Status', 'Lançado?']],
        body: filtered.map(item => [
            pdfSafe(item.name),
            pdfSafe(item.drinkGroup || '-'),
            fmtQtd(item.quantity, item.unit),
            fmtBRL(item.unitPrice),
            fmtBRL(item.totalPrice),
            item.isChecked ? 'Comprado' : 'Pendente',
            item.transactionId ? 'Sim' : '-',
        ]),
        foot: [['TOTAL GERAL', '', '', '', fmtBRL(grandTotal), '', '']],
        styles: { fontSize: 9, cellPadding: 2.5, font: 'helvetica' },
        headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: GRAY_FOOT, textColor: 30, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: GRAY_ROW },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 28, halign: 'center' },
            2: { cellWidth: 28, halign: 'center' },
            3: { cellWidth: 28, halign: 'right' },
            4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
            5: { cellWidth: 26, halign: 'center' },
            6: { cellWidth: 22, halign: 'center' },
        },
    });

    // ── Rodapé ──
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 283, 205, { align: 'right' });
    }

    doc.save(makeFilename(`${expedition.name}_${tab}`, 'pdf'));
}

// ─────────────────────────────────────────
// 2. LISTA DE ITENS → XLSX
// ─────────────────────────────────────────

export function exportListToXlsx(
    items: ChecklistItem[],
    expedition: Expedition,
    tab: 'Mercado' | 'Acampamento'
) {
    const filtered = items.filter(i => i.category === tab);
    const tabLabel = tab === 'Mercado' ? 'Lista de Mercado' : 'Lista de Acampamento';
    const grandTotal = filtered.reduce((s, i) => s + (i.totalPrice || 0), 0);

    const data: any[][] = [
        [`Expedição: ${expedition.name}`, '', '', '', '', '', ''],
        [`Lista: ${tabLabel}`, '', '', '', '', '', ''],
        [`Local: ${expedition.location} | Ano: ${expedition.year}`, '', '', '', '', '', ''],
        [`Gerado em: ${today()}`, '', '', '', '', '', ''],
        [],
        ['Produto', 'Grupo Bebida', 'Quantidade', 'Unidade', 'P. Unitário (R$)', 'Total (R$)', 'Status', 'Lançado?'],
        ...filtered.map(item => [
            item.name,
            item.drinkGroup || '',
            item.quantity != null ? Number(item.quantity) : '',
            item.unit || '',
            item.unitPrice ?? '',
            item.totalPrice ?? '',
            item.isChecked ? 'Comprado' : 'Pendente',
            item.transactionId ? 'Sim' : 'Não',
        ]),
        [],
        ['TOTAL GERAL', '', '', '', '', grandTotal, '', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
        { wch: 38 }, { wch: 16 }, { wch: 12 }, { wch: 10 },
        { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tabLabel.slice(0, 31));
    XLSX.writeFile(wb, makeFilename(`${expedition.name}_${tab}`, 'xlsx'));
}

// ─────────────────────────────────────────
// 3. RESUMO FINANCEIRO → PDF
// ─────────────────────────────────────────

export function exportFinancialToPdf(
    items: ChecklistItem[],
    transactions: Transaction[],
    profiles: Profile[],
    expedition: Expedition
) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const expTx = transactions.filter(t => t.expeditionId === expedition.id && t.isExpense);

    const totalLancado = expTx.reduce((s, t) => s + t.totalPrice, 0);
    const itemsLancados = items.filter(i => i.transactionId);
    const itemsPendentes = items.filter(i => !i.transactionId && (i.totalPrice ?? 0) > 0);
    const totalPendente = itemsPendentes.reduce((s, i) => s + (i.totalPrice || 0), 0);

    // ── Cabeçalho ──
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(pdfSafe(`Relatorio Financeiro - Expedicao ${expedition.name}`), 14, 13);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 240, 210);
    doc.text(pdfSafe(`${expedition.location} - ${expedition.year} - Gerado em: ${today()}`), 14, 20);

    // ── Resumo Geral ──
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Geral', 14, 33);

    autoTable(doc, {
        startY: 37,
        body: [
            ['Itens lançados no rateio', `${itemsLancados.length}`, fmtBRL(totalLancado)],
            ['Itens com valor não lançados', `${itemsPendentes.length}`, fmtBRL(totalPendente)],
            ['Grand Total', '', fmtBRL(totalLancado + totalPendente)],
        ],
        styles: { fontSize: 9.5 },
        bodyStyles: { textColor: 30 },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
        },
        theme: 'grid',
    });

    // ── Por Categoria ──
    const categories = [...new Set(expTx.map(t => t.category))];
    const catRows = categories.map(cat => {
        const total = expTx.filter(t => t.category === cat).reduce((s, t) => s + t.totalPrice, 0);
        const count = expTx.filter(t => t.category === cat).length;
        return [pdfSafe(cat), String(count), fmtBRL(total)];
    });

    const y1 = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Por Categoria', 14, y1);

    autoTable(doc, {
        startY: y1 + 4,
        head: [['Categoria', 'Qtd. Lançamentos', 'Total (R$)']],
        body: catRows,
        styles: { fontSize: 9.5 },
        headStyles: { fillColor: GREEN, textColor: 255 },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
        },
        theme: 'striped',
    });

    // ── Por Participante ──
    const participantRows: any[][] = profiles
        .map(p => {
            const paidTx = expTx.filter(t => t.purchasedBy === p.id);
            const total = paidTx.reduce((s, t) => s + t.totalPrice, 0);
            return total > 0 ? [pdfSafe(p.name), String(paidTx.length), fmtBRL(total)] : null;
        })
        .filter(Boolean) as any[][];

    const caixaTx = expTx.filter(t => t.purchasedBy === 'caixa');
    if (caixaTx.length > 0) {
        participantRows.push([
            '💰 Caixa da Expedição',
            String(caixaTx.length),
            fmtBRL(caixaTx.reduce((s, t) => s + t.totalPrice, 0)),
        ]);
    }

    const y2 = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Gastos por Participante', 14, y2);

    autoTable(doc, {
        startY: y2 + 4,
        head: [['Participante', 'Qtd. Itens Pagos', 'Total Pago (R$)']],
        body: participantRows.length > 0 ? participantRows : [['Nenhum lançamento registrado', '', '']],
        styles: { fontSize: 9.5 },
        headStyles: { fillColor: GREEN, textColor: 255 },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 38, halign: 'center' },
            2: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
        },
        theme: 'striped',
    });

    // ── Página 2: Detalhes ──
    doc.addPage();

    doc.setFillColor(41, 98, 255);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Detalhes dos Lançamentos', 14, 12);
    doc.setTextColor(0);

    const detailRows = expTx.map(t => {
        const payer = t.purchasedBy === 'caixa'
            ? 'Caixa'
            : profiles.find(p => p.id === t.purchasedBy)?.name || t.purchasedBy;
        return [
            t.description.replace(/^\[.*?\]\s*/, ''),
            t.category,
            fmtBRL(t.unitPrice),
            fmtBRL(t.totalPrice),
            new Date(t.purchaseDate + 'T12:00:00').toLocaleDateString('pt-BR'),
            payer,
            t.drinkGroup || 'Geral',
        ];
    });

    autoTable(doc, {
        startY: 22,
        head: [['Item', 'Categoria', 'P. Unit.', 'Total', 'Data', 'Quem Pagou', 'Rateio']],
        body: detailRows.length > 0 ? detailRows : [['Nenhum lançamento ainda', '', '', '', '', '', '']],
        styles: { fontSize: 8.5, cellPadding: 2 },
        headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: GRAY_ROW },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 26 },
            2: { cellWidth: 22, halign: 'right' },
            3: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 28 },
            6: { cellWidth: 22 },
        },
    });

    // Paginação
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: 'right' });
    }

    doc.save(makeFilename(`${expedition.name}_Financeiro`, 'pdf'));
}

// ─────────────────────────────────────────
// 4. RESUMO FINANCEIRO → XLSX
// ─────────────────────────────────────────

export function exportFinancialToXlsx(
    items: ChecklistItem[],
    transactions: Transaction[],
    profiles: Profile[],
    expedition: Expedition
) {
    const expTx = transactions.filter(t => t.expeditionId === expedition.id && t.isExpense);
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Resumo ──
    const totalLancado = expTx.reduce((s, t) => s + t.totalPrice, 0);
    const itemsPendentes = items.filter(i => !i.transactionId && (i.totalPrice ?? 0) > 0);
    const totalPendente = itemsPendentes.reduce((s, i) => s + (i.totalPrice || 0), 0);

    const categories = [...new Set(expTx.map(t => t.category))];
    const catRows = categories.map(cat => {
        const total = expTx.filter(t => t.category === cat).reduce((s, t) => s + t.totalPrice, 0);
        const count = expTx.filter(t => t.category === cat).length;
        return [cat, count, total];
    });

    const participantRows = profiles
        .map(p => {
            const paidTx = expTx.filter(t => t.purchasedBy === p.id);
            const total = paidTx.reduce((s, t) => s + t.totalPrice, 0);
            return total > 0 ? [p.name, paidTx.length, total] : null;
        })
        .filter(Boolean) as any[][];

    const caixaTx = expTx.filter(t => t.purchasedBy === 'caixa');
    if (caixaTx.length > 0) {
        participantRows.push(['Caixa da Expedição', caixaTx.length, caixaTx.reduce((s, t) => s + t.totalPrice, 0)]);
    }

    const resumoData: any[][] = [
        [`Relatório Financeiro — Expedição ${expedition.name}`],
        [`Local: ${expedition.location} | Ano: ${expedition.year}`],
        [`Gerado em: ${today()}`],
        [],
        ['RESUMO GERAL', '', ''],
        ['Itens lançados no rateio', items.filter(i => i.transactionId).length, totalLancado],
        ['Itens com valor não lançados', itemsPendentes.length, totalPendente],
        ['Grand Total (R$)', '', totalLancado + totalPendente],
        [],
        ['POR CATEGORIA', 'Qtd. Lançamentos', 'Total (R$)'],
        ...catRows,
        [],
        ['POR PARTICIPANTE', 'Itd. Itens Pagos', 'Total Pago (R$)'],
        ...participantRows,
    ];

    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    wsResumo['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Financeiro');

    // ── Sheet 2: Detalhes Lançamentos ──
    const detailData: any[][] = [
        ['Item', 'Categoria', 'P. Unitário (R$)', 'Total (R$)', 'Data', 'Quem Pagou', 'Grupo de Rateio'],
        ...expTx.map(t => {
            const payer = t.purchasedBy === 'caixa'
                ? 'Caixa da Expedição'
                : profiles.find(p => p.id === t.purchasedBy)?.name || t.purchasedBy;
            return [
                t.description.replace(/^\[.*?\]\s*/, ''),
                t.category,
                t.unitPrice ?? '',
                t.totalPrice,
                new Date(t.purchaseDate + 'T12:00:00').toLocaleDateString('pt-BR'),
                payer,
                t.drinkGroup || 'Geral',
            ];
        }),
        [],
        ['TOTAL', '', '', expTx.reduce((s, t) => s + t.totalPrice, 0), '', '', ''],
    ];

    const wsDetalhe = XLSX.utils.aoa_to_sheet(detailData);
    wsDetalhe['!cols'] = [
        { wch: 42 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
        { wch: 14 }, { wch: 24 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetalhe, 'Detalhes Lançamentos');

    // ── Sheet 3: Lista Mercado ──
    const mercadoItems = items.filter(i => i.category === 'Mercado');
    const mercadoData: any[][] = [
        [`Expedição: ${expedition.name} — Lista de Mercado`],
        [`Gerado em: ${today()}`],
        [],
        ['Produto', 'Grupo Bebida', 'Quantidade', 'Unidade', 'P. Unitário (R$)', 'Total (R$)', 'Comprado?', 'Lançado?'],
        ...mercadoItems.map(i => [
            i.name,
            i.drinkGroup || '',
            i.quantity != null ? Number(i.quantity) : '',
            i.unit || '',
            i.unitPrice ?? '',
            i.totalPrice ?? '',
            i.isChecked ? 'Sim' : 'Não',
            i.transactionId ? 'Sim' : 'Não',
        ]),
        [],
        ['TOTAL', '', '', '', '', mercadoItems.reduce((s, i) => s + (i.totalPrice || 0), 0), '', ''],
    ];

    const wsMercado = XLSX.utils.aoa_to_sheet(mercadoData);
    wsMercado['!cols'] = [
        { wch: 38 }, { wch: 16 }, { wch: 12 }, { wch: 10 },
        { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, wsMercado, 'Lista Mercado');

    // ── Sheet 4: Lista Acampamento ──
    const acampItems = items.filter(i => i.category === 'Acampamento');
    const acampData: any[][] = [
        [`Expedição: ${expedition.name} — Lista de Acampamento`],
        [`Gerado em: ${today()}`],
        [],
        ['Item', 'Grupo Bebida', 'Quantidade', 'Unidade', 'P. Unitário (R$)', 'Total (R$)', 'Verificado?', 'Lançado?'],
        ...acampItems.map(i => [
            i.name,
            i.drinkGroup || '',
            i.quantity != null ? Number(i.quantity) : '',
            i.unit || '',
            i.unitPrice ?? '',
            i.totalPrice ?? '',
            i.isChecked ? 'Sim' : 'Não',
            i.transactionId ? 'Sim' : 'Não',
        ]),
        [],
        ['TOTAL', '', '', '', '', acampItems.reduce((s, i) => s + (i.totalPrice || 0), 0), '', ''],
    ];

    const wsAcamp = XLSX.utils.aoa_to_sheet(acampData);
    wsAcamp['!cols'] = [
        { wch: 38 }, { wch: 16 }, { wch: 12 }, { wch: 10 },
        { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, wsAcamp, 'Lista Acampamento');

    XLSX.writeFile(wb, makeFilename(`${expedition.name}_Financeiro`, 'xlsx'));
}

// ─────────────────────────────────────────────────────────────────
// Tipos auxiliares para o Painel Financeiro
// ─────────────────────────────────────────────────────────────────

export type ParticipantBalance = {
    profile: Profile;
    debt: number;
    totalPaid: number;
    paidInFinances: number;
    paidAsBuyer: number;
    balance: number;
};

export type SplitCalc = {
    valPerPersonGeneral: number;
    valPerAllDrinkers: number;
    totalTodosBebedores: number;
    groupTotals: Record<string, number>;
    groupPerPerson: Record<string, number>;
    totalGeral: number;
};

// ─────────────────────────────────────────────────────────────────
// 5. PAINEL FINANCEIRO → PDF
// ─────────────────────────────────────────────────────────────────

export function exportPainelFinanceiroPdf(
    transactions: Transaction[],
    profiles: Profile[],
    expedition: Expedition,
    splitCalc: SplitCalc,
    participantBalances: ParticipantBalance[]
) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const expTx = transactions.filter(t => t.expeditionId === expedition.id && t.isExpense);
    const totalGasto = expTx.reduce((s, t) => s + t.totalPrice, 0);

    // ═══ PAGINA 1 (Portrait): Rateio + Categorias ═══
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text(pdfSafe(`Painel Financeiro - Expedicao ${expedition.name}`), 14, 13);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 240, 210);
    doc.text(pdfSafe(`${expedition.location} - ${expedition.year} - Gerado em: ${today()}`), 14, 20);
    doc.setTextColor(0);

    // Cards de resumo
    const drawCard = (x: number, y: number, label: string, value: string, bgR=248, bgG=250, bgB=252) => {
        doc.setFillColor(bgR, bgG, bgB); doc.setDrawColor(220, 220, 220);
        doc.roundedRect(x, y, 57, 20, 2, 2, 'FD');
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
        doc.text(label, x + 28.5, y + 7, { align: 'center' });
        doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30);
        doc.text(value, x + 28.5, y + 15, { align: 'center' });
    };
    drawCard(14, 28, 'Total de Gastos', fmtBRL(totalGasto), 240, 253, 244);
    drawCard(76, 28, 'Participantes', String(profiles.length));
    drawCard(138, 28, 'Custo Geral/Pessoa', fmtBRL(splitCalc.valPerPersonGeneral));

    // Tabela de Rateio
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
    doc.text('Resumo do Rateio', 14, 56);
    const rateioRows: any[][] = [
        ['Gastos Gerais (todos os participantes)', fmtBRL(splitCalc.totalGeral), fmtBRL(splitCalc.valPerPersonGeneral)],
    ];
    if (splitCalc.totalTodosBebedores > 0)
        rateioRows.push(['Bebida - Todos os Bebedores', fmtBRL(splitCalc.totalTodosBebedores), fmtBRL(splitCalc.valPerAllDrinkers)]);
    for (const [group, total] of Object.entries(splitCalc.groupTotals))
        rateioRows.push([`Bebida - Grupo ${pdfSafe(group)}`, fmtBRL(total), fmtBRL(splitCalc.groupPerPerson[group] || 0)]);
    rateioRows.push(['TOTAL GERAL', fmtBRL(totalGasto), '']);

    autoTable(doc, {
        startY: 60,
        head: [['Tipo de Gasto', 'Total do Grupo', 'Custo / Pessoa']],
        body: rateioRows,
        styles: { fontSize: 9.5, cellPadding: 3 },
        headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: GRAY_ROW },
        columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 40, halign: 'right' },
            2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (d) => { if (d.section === 'body' && d.row.index === rateioRows.length - 1) d.cell.styles.fontStyle = 'bold'; },
    });

    // Gastos por Categoria
    const categories = [...new Set(expTx.map(t => t.category))];
    const catRows = categories.map(cat => {
        const tot = expTx.filter(t => t.category === cat).reduce((s, t) => s + t.totalPrice, 0);
        return [pdfSafe(cat), String(expTx.filter(t => t.category === cat).length), fmtBRL(tot)];
    });
    const y1 = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Gastos por Categoria', 14, y1);
    autoTable(doc, {
        startY: y1 + 4,
        head: [['Categoria', 'Qtd.', 'Total (R$)']],
        body: catRows.length > 0 ? catRows : [['Nenhum lancamento', '-', '-']],
        styles: { fontSize: 9.5, cellPadding: 3 },
        headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: GRAY_ROW },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 30, halign: 'center' }, 2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' } },
    });

    // ═══ PAGINA 2 (Landscape): Acerto de Contas ═══
    doc.addPage('a4', 'landscape');
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 297, 22, 'F');
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text('Acerto de Contas - Participantes', 14, 13);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 240, 210);
    doc.text(pdfSafe(`Expedicao ${expedition.name} - ${today()}`), 283, 13, { align: 'right' });
    doc.setTextColor(0);

    const balanceRows = participantBalances.map(pb => {
        const grupo = pb.profile.drinkGroup ? pdfSafe(pb.profile.drinkGroup) : '-';
        const situacao = pb.balance === 0 ? 'Quitado' : pb.balance > 0 ? 'A Receber' : 'Devendo';
        return [
            pdfSafe(pb.profile.name),
            grupo,
            fmtBRL(pb.debt),
            fmtBRL(pb.paidInFinances),
            fmtBRL(pb.paidAsBuyer),
            fmtBRL(pb.totalPaid),
            fmtBRL(Math.abs(pb.balance)),
            situacao,
        ];
    });

    autoTable(doc, {
        startY: 26,
        head: [['Participante', 'Grupo', 'Cota Devida', 'Pago (Cx)', 'Pago (Pessoal)', 'Total Pago', 'Saldo', 'Situacao']],
        body: balanceRows.length > 0 ? balanceRows : [['Nenhum participante', '', '', '', '', '', '', '']],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: GRAY_ROW },
        didParseCell: (d) => {
            if (d.section === 'body') {
                const pb = participantBalances[d.row.index];
                if (!pb) return;
                if (d.column.index === 7) {
                    d.cell.styles.fontStyle = 'bold';
                    d.cell.styles.textColor = pb.balance === 0 ? [80, 80, 80] : pb.balance > 0 ? [22, 101, 52] : [185, 28, 28];
                }
                if (d.column.index === 6) {
                    d.cell.styles.fontStyle = 'bold';
                    d.cell.styles.textColor = pb.balance === 0 ? [80, 80, 80] : pb.balance > 0 ? [22, 101, 52] : [185, 28, 28];
                }
            }
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 28, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 28, halign: 'right' },
            4: { cellWidth: 32, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' },
            6: { cellWidth: 30, halign: 'right' },
            7: { cellWidth: 27, halign: 'center' },
        },
    });

    // ═══ PAGINA 3 (Landscape): Extrato de Gastos ═══
    doc.addPage('a4', 'landscape');
    doc.setFillColor(41, 98, 255);
    doc.rect(0, 0, 297, 22, 'F');
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text('Extrato de Gastos da Expedicao', 14, 13);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 210, 255);
    doc.text(pdfSafe(`${expedition.name} - ${today()}`), 283, 13, { align: 'right' });
    doc.setTextColor(0);

    const extratoRows = expTx.map(t => {
        const payer = t.purchasedBy === 'caixa'
            ? 'Caixa'
            : pdfSafe(profiles.find(p => p.id === t.purchasedBy)?.name || 'Nao inf.');
        const rateio = !t.drinkGroup ? 'Geral'
            : t.drinkGroup === 'todos' ? 'Bebedores'
                : pdfSafe(t.drinkGroup);
        return [
            new Date(t.purchaseDate + 'T12:00:00').toLocaleDateString('pt-BR'),
            pdfSafe(t.description),
            pdfSafe(t.category),
            payer,
            rateio,
            fmtBRL(t.unitPrice),
            String(t.amount),
            fmtBRL(t.totalPrice),
            t.isPaid ? 'Sim' : 'Nao',
        ];
    });

    autoTable(doc, {
        startY: 26,
        head: [['Data', 'Descricao', 'Categoria', 'Comprado Por', 'Rateio', 'P.Unit.', 'Qtd', 'Total', 'Res.']],
        body: extratoRows.length > 0 ? extratoRows : [['Nenhum gasto', '', '', '', '', '', '', '', '']],
        foot: [['', '', '', '', '', '', 'TOTAL', fmtBRL(totalGasto), '']],
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: GRAY_FOOT, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: GRAY_ROW },
        columnStyles: {
            0: { cellWidth: 22, halign: 'center' },
            1: { cellWidth: 80 },
            2: { cellWidth: 24 },
            3: { cellWidth: 30 },
            4: { cellWidth: 22, halign: 'center' },
            5: { cellWidth: 24, halign: 'right' },
            6: { cellWidth: 14, halign: 'center' },
            7: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
            8: { cellWidth: 14, halign: 'center' },
        },
    });

    addPageNumbers(doc);
    doc.save(makeFilename(`${expedition.name}_PainelFinanceiro`, 'pdf'));
}

// ─────────────────────────────────────────────────────────────────
// 6. PAINEL FINANCEIRO → XLSX
// ─────────────────────────────────────────────────────────────────

export function exportPainelFinanceiroXlsx(
    transactions: Transaction[],
    profiles: Profile[],
    expedition: Expedition,
    splitCalc: SplitCalc,
    participantBalances: ParticipantBalance[]
) {
    const expTx = transactions.filter(t => t.expeditionId === expedition.id && t.isExpense);
    const totalGasto = expTx.reduce((s, t) => s + t.totalPrice, 0);
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Rateio ──
    const rateioData: any[][] = [
        [`Painel Financeiro — Expedição ${expedition.name}`],
        [`Local: ${expedition.location} | Ano: ${expedition.year}`],
        [`Gerado em: ${today()}`],
        [],
        ['RESUMO DO RATEIO', '', ''],
        ['Total Geral de Gastos (R$)', '', totalGasto],
        ['Participantes', profiles.length, ''],
        ['Custo Geral / Pessoa (R$)', '', splitCalc.valPerPersonGeneral],
        ['Total Gastos Comuns (R$)', splitCalc.totalGeral, ''],
    ];

    if (splitCalc.totalTodosBebedores > 0) {
        rateioData.push(['Extra p/ Todos Bebedores / Pessoa (R$)', '', splitCalc.valPerAllDrinkers]);
        rateioData.push(['Total Bebida Geral (R$)', splitCalc.totalTodosBebedores, '']);
    }

    for (const [group, total] of Object.entries(splitCalc.groupTotals)) {
        rateioData.push([`Grupo ${group} — Total (R$)`, total, splitCalc.groupPerPerson[group] || 0]);
    }

    rateioData.push([], ['POR CATEGORIA', 'Qtd.', 'Total (R$)']);
    const categories = [...new Set(expTx.map(t => t.category))];
    categories.forEach(cat => {
        const total = expTx.filter(t => t.category === cat).reduce((s, t) => s + t.totalPrice, 0);
        const count = expTx.filter(t => t.category === cat).length;
        rateioData.push([cat, count, total]);
    });

    const wsRateio = XLSX.utils.aoa_to_sheet(rateioData);
    wsRateio['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsRateio, 'Rateio');

    // ── Sheet 2: Acerto de Contas ──
    const balanceData: any[][] = [
        ['Participante', 'Grupo Bebida', 'Cota Devida (R$)', 'Pago Cx (R$)', 'Pago Pessoal (R$)', 'Total Pago (R$)', 'Saldo (R$)', 'Situação'],
        ...participantBalances.map(pb => [
            pb.profile.name,
            pb.profile.drinkGroup || '',
            pb.debt,
            pb.paidInFinances,
            pb.paidAsBuyer,
            pb.totalPaid,
            pb.balance,
            pb.balance === 0 ? 'Quitado' : pb.balance > 0 ? 'A Receber' : 'Devendo',
        ]),
    ];

    const wsBalance = XLSX.utils.aoa_to_sheet(balanceData);
    wsBalance['!cols'] = [
        { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
        { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsBalance, 'Acerto de Contas');

    // ── Sheet 3: Extrato de Gastos ──
    const extratoData: any[][] = [
        ['Data', 'Descrição', 'Categoria', 'Comprado Por', 'Rateio', 'P. Unitário (R$)', 'Qtd.', 'Total (R$)', 'Resolvido?'],
        ...expTx.map(t => {
            const payer = t.purchasedBy === 'caixa'
                ? 'Caixa da Expedição'
                : profiles.find(p => p.id === t.purchasedBy)?.name || 'Não inf.';
            const rateio = !t.drinkGroup ? 'Geral'
                : t.drinkGroup === 'todos' ? 'Todos Bebedores'
                    : t.drinkGroup;
            return [
                new Date(t.purchaseDate + 'T12:00:00').toLocaleDateString('pt-BR'),
                t.description,
                t.category,
                payer,
                rateio,
                t.unitPrice ?? '',
                t.amount,
                t.totalPrice,
                t.isPaid ? 'Sim' : 'Não',
            ];
        }),
        [],
        ['', '', '', '', '', '', 'TOTAL (R$)', totalGasto, ''],
    ];

    const wsExtrato = XLSX.utils.aoa_to_sheet(extratoData);
    wsExtrato['!cols'] = [
        { wch: 12 }, { wch: 40 }, { wch: 16 }, { wch: 24 },
        { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsExtrato, 'Extrato de Gastos');

    XLSX.writeFile(wb, makeFilename(`${expedition.name}_PainelFinanceiro`, 'xlsx'));
}


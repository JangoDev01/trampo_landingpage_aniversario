const form = document.querySelector('#rsvp-form');
const statusMessage = document.querySelector('#form-status');
const pdfActions = document.querySelector('#pdf-actions');
const openPdfLink = document.querySelector('#open-pdf-link');
const downloadPdfLink = document.querySelector('#download-pdf-link');
let currentPdfUrl;

const pdfColors = [
  [0.95, 0.39, 0.44],
  [0.96, 0.76, 0.25],
  [0.35, 0.68, 0.72],
  [0.42, 0.72, 0.48],
  [0.69, 0.48, 0.76]
];

const cp1252SpecialCharacters = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86,
  '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c,
  'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95,
  '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b,
  'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f
};

function pdfText(value) {
  return [...String(value)].map((character) => {
    const code = cp1252SpecialCharacters[character] ?? character.codePointAt(0);
    const byte = code >= 0x20 && code <= 0xff ? code : 0x3f;
    return byte.toString(16).padStart(2, '0');
  }).join('').toUpperCase();
}

function wrapText(value, maxLength = 76) {
  const lines = [];
  String(value || '—').split(/\r?\n/).forEach((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push('');
      return;
    }

    let line = '';
    words.forEach((word) => {
      while (word.length > maxLength) {
        if (line) {
          lines.push(line);
          line = '';
        }
        lines.push(word.slice(0, maxLength));
        word = word.slice(maxLength);
      }

      if (line && `${line} ${word}`.length > maxLength) {
        lines.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    });
    if (line) lines.push(line);
  });
  return lines.length ? lines : ['—'];
}

function createRsvpPdf(data) {
  const pageWidth = 595;
  const pageHeight = 842;
  const pages = [];
  let commands;
  let cursorY;

  function addText(text, x, y, size, color = '19352F') {
    const rgb = color.match(/.{2}/g).map((channel) => (parseInt(channel, 16) / 255).toFixed(3)).join(' ');
    commands.push(
      `BT /F1 ${size} Tf ${rgb} rg 1 0 0 1 ${x} ${y} Tm <${pdfText(text)}> Tj ET`
    );
  }

  function addConfetti() {
    for (let index = 0; index < 38; index += 1) {
      const color = pdfColors[index % pdfColors.length].join(' ');
      const x = 26 + Math.random() * (pageWidth - 52);
      const y = 680 + Math.random() * 145;
      const size = 3 + Math.random() * 5;
      if (index % 3 === 0) {
        commands.push(`${color} rg ${x.toFixed(1)} ${y.toFixed(1)} ${size.toFixed(1)} ${(size * 1.8).toFixed(1)} re f`);
      } else {
        const radius = size / 2;
        const curve = radius * 0.5523;
        commands.push(
          `${color} rg ${x.toFixed(1)} ${(y + radius).toFixed(1)} m ` +
          `${x.toFixed(1)} ${(y + radius + curve).toFixed(1)} ${(x + radius - curve).toFixed(1)} ${(y + size).toFixed(1)} ${(x + radius).toFixed(1)} ${(y + size).toFixed(1)} c ` +
          `${(x + radius + curve).toFixed(1)} ${(y + size).toFixed(1)} ${(x + size).toFixed(1)} ${(y + radius + curve).toFixed(1)} ${(x + size).toFixed(1)} ${(y + radius).toFixed(1)} c ` +
          `${(x + size).toFixed(1)} ${(y + radius - curve).toFixed(1)} ${(x + radius + curve).toFixed(1)} ${y.toFixed(1)} ${(x + radius).toFixed(1)} ${y.toFixed(1)} c ` +
          `${(x + radius - curve).toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${(y + radius - curve).toFixed(1)} ${x.toFixed(1)} ${(y + radius).toFixed(1)} c f`
        );
      }
    }
  }

  function addPage(pageNumber) {
    commands = [
      '0.99 0.97 0.93 rg 0 0 595 842 re f',
      '0.96 0.76 0.25 rg 0 700 595 142 re f'
    ];
    addConfetti();
    addText('PRESENCA CONFIRMADA!', 52, 784, 23);
    addText('Que alegria celebrar com voce!', 53, 758, 13);

    commands.push('0.95 0.39 0.44 rg 474 714 66 40 re f');
    commands.push('0.75 0.29 0.33 rg 482 714 50 24 re f');
    commands.push('0.35 0.68 0.72 rg 496 754 5 19 re f');
    commands.push('0.95 0.39 0.44 rg 494 773 9 10 re f');
    commands.push('0.35 0.68 0.72 rg 512 754 5 19 re f');
    commands.push('0.35 0.68 0.72 rg 510 773 9 10 re f');

    addText('ANIVERSARIO DA CLARA  |  7 ANOS', 52, 674, 10, '3F7467');
    cursorY = 632;
    pages.push({ commands, pageNumber });
  }

  function addSection(title, value) {
    const lines = wrapText(value);
    let lineIndex = 0;
    let firstSectionPage = true;

    while (lineIndex < lines.length) {
      const maxLines = Math.floor((cursorY - 85 - 43) / 14) + 1;
      if (maxLines < 1) {
        addPage(pages.length + 1);
        continue;
      }

      const sectionLines = lines.slice(lineIndex, lineIndex + maxLines);
      const height = 43 + Math.max(0, sectionLines.length - 1) * 14;
      if (cursorY - height < 72) {
        addPage(pages.length + 1);
        continue;
      }

      const bottom = cursorY - height;
      commands.push(`1 1 1 rg 48 ${bottom} 499 ${height - 5} re f`);
      addText(firstSectionPage ? title.toUpperCase() : `${title.toUpperCase()} (CONTINUA)`, 62, cursorY - 19, 9, '3F7467');
      sectionLines.forEach((line, index) => {
        addText(line, 62, cursorY - 36 - index * 14, 12);
      });
      cursorY = bottom - 13;
      lineIndex += sectionLines.length;
      firstSectionPage = false;
    }
  }

  addPage(1);
  addSection('Nome', data.name);
  addSection('Telefone', data.phone);
  addSection('E-mail', data.email || 'Não informado');
  addSection('Pessoas confirmadas', Number(data.guests) === 1 ? '1 pessoa' : `${data.guests} pessoas`);
  addSection('Recado para a Clara', data.message || 'Nenhum recado informado');
  addSection('Código do convite', data.inviteToken);
  addSection('Detalhes da festa', '12 de dezembro de 2026, às 15h30 | Casa do Parque, Av. das Flores, 250 | Traje alegre. Temos piscina!');

  pages.forEach((page) => {
    commands = page.commands;
    addText(`12.12.2026  |  CASA DO PARQUE  |  PAGINA ${page.pageNumber}`, 52, 35, 9, '3F7467');
  });

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${4 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  ];

  pages.forEach((page, index) => {
    const pageObjectId = 4 + index * 2;
    const contentObjectId = pageObjectId + 1;
    const content = page.commands.join('\n');
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

function downloadRsvpPdf(data) {
  if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);

  const pdf = createRsvpPdf(data);
  currentPdfUrl = URL.createObjectURL(pdf);
  const safeName = data.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-]+/g, '-');
  openPdfLink.href = currentPdfUrl;
  downloadPdfLink.href = currentPdfUrl;
  downloadPdfLink.download = `${safeName || 'convidado'}-confirmacao-clara.pdf`;
  pdfActions.hidden = false;
  openPdfLink.click();
}

function celebrateConfirmation() {
  const colors = ['#f3c54a', '#f3a7a9', '#75b9c3', '#3f7467', '#b07ac1'];
  const burst = document.createElement('div');
  burst.className = 'celebration-confetti';
  burst.setAttribute('aria-hidden', 'true');

  for (let index = 0; index < 42; index += 1) {
    const piece = document.createElement('span');
    piece.style.setProperty('--x', `${Math.random() * 100}vw`);
    piece.style.setProperty('--delay', `${Math.random() * 0.45}s`);
    piece.style.setProperty('--duration', `${1.8 + Math.random() * 1.2}s`);
    piece.style.setProperty('--rotation', `${Math.random() * 720 - 360}deg`);
    piece.style.setProperty('--color', colors[index % colors.length]);
    burst.append(piece);
  }

  document.body.append(burst);
  window.setTimeout(() => burst.remove(), 3500);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);

  button.disabled = true;
  statusMessage.textContent = 'Preparando sua confirmação...';

  try {
    const guestData = {
      name: String(formData.get('name')),
      phone: String(formData.get('phone')),
      email: String(formData.get('email') || ''),
      guests: String(formData.get('guests')),
      message: String(formData.get('message') || ''),
      inviteToken: `CLARA-${Date.now().toString(36).toUpperCase()}`
    };
    const guests = Number(guestData.guests);
    const guestText = guests === 1 ? '1 pessoa' : `${guests} pessoas`;

    try {
      downloadRsvpPdf(guestData);
      celebrateConfirmation();
      statusMessage.textContent = `Oba, ${guestData.name}! Sua presença foi confirmada para ${guestText}. Código: ${guestData.inviteToken}. O PDF foi gerado; se não abriu em outra aba, use os botões abaixo. Os dados não foram enviados ao anfitrião.`;
      form.reset();
    } catch (error) {
      statusMessage.textContent = `Não foi possível gerar o PDF: ${error.message}`;
    }
  } catch (error) {
    statusMessage.textContent = `Não foi possível preparar a confirmação: ${error.message}`;
  } finally {
    button.disabled = false;
  }
});

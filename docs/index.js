class NotesWidget {
  constructor(area, dataJson) {
    this.container = area;
    this.dataJson = dataJson;
    this.notes;
  }

  async fetchNotes(src) {
    return await fetch(src).then(responce => responce.json()).then(data => data);
  }

  renderCanvas(container) {
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return canvas;
  }

  renderWidget(contr) {
    const widget = document.createDocumentFragment();
    const container = document.querySelector(contr);
    const canvasLines = this.renderCanvas(container);
    const canvasNotes = this.renderCanvas(container);
    canvasLines.id = 'lines';
    canvasNotes.id = 'notes';
    canvasLines.style = 'position: absolute; left: 0; top: 0; z-index: 1';
    canvasNotes.style = 'position: absolute; left: 0; top: 0; z-index: 2';
    widget.append(canvasNotes);
    widget.append(canvasLines);
    container.insertBefore(widget, container.lastElementChild);
  }

  parseNotesTime(notes) {
    notes.forEach(element => {
      element.time1 = Number(element.time.match(/^[0-9]*/)[0]);
      element.time2 = Number(element.time.match(/[0-9]*$/)[0]);
    });
  }

  computeLineStartPoints(canvas, noteDiameter, topOffset, bottomOffset) {
    const lineStartPoints = [];
    const steps = Math.floor((canvas.height - (topOffset + bottomOffset)) / (noteDiameter * 7)); // 7 notes diameters
    const startX = Math.floor(canvas.width * 0.05);
    for (let i = 0; i < steps; i++) {
      const startY = topOffset + noteDiameter * 9 * i; // 9 notes diameters
      lineStartPoints.push([startX, startY]);
    }
    return lineStartPoints;
  }

  drawLine(ctx, startX, startY, endX, endY) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  drawLinesSet(ctx, lineWidth, startPoint, noteDiameter) {
    for (let i = 0; i < 5; i++) {
      this.drawLine(ctx, startPoint[0], startPoint[1] + noteDiameter * i, startPoint[0] + lineWidth, startPoint[1] + noteDiameter * i);
    }
  }

  renderLines(canv, lineStartPoints, noteDiameter, lineWidth) {
    const ctx = canv.getContext('2d');
    lineStartPoints.forEach(startPoint => this.drawLinesSet(ctx, lineWidth, startPoint, noteDiameter));
  }

  throwAlertIfScreenSmall(lineStartPoint) {
    if (!lineStartPoint) {
      alert('Warning! Too little space for such amount of notes! 1) Reduce amount of notes or enlarge the screen. 2) Reload the page.')
    }
  }

  computeNotesCoords(notes, lineStartPoints, lineWidth, noteDiameter) {
    const positionMatch = ['c','d','e','f','g','a','b'];
    let point = 0;
    let gapX = noteDiameter * 2;
    this.throwAlertIfScreenSmall(lineStartPoints[point]);
    let lowerY = lineStartPoints[point][1] + noteDiameter * 8.5; // note C1
    notes.forEach(el => {
      el.order = positionMatch.indexOf(el.note.match(/^[a-zA-Z]/)[0]) + 7 * (el.note.match(/[0-9]*$/)[0] - 1);
      if ((lineWidth - gapX) < noteDiameter * 2) {
        point++;
        gapX = noteDiameter * 2;
        this.throwAlertIfScreenSmall(lineStartPoints[point]);
        lowerY = lineStartPoints[point][1] + noteDiameter * 8.5;
      }
      el.x = lineStartPoints[point][0] + gapX;
      gapX = gapX + noteDiameter + noteDiameter * 16 / (el.time2 * el.time1);
      el.y = lowerY - el.order * noteDiameter / 2;
    });
  }

  drawNotesTaleRight(ctx, element, noteDiameter, yShift, angleShift) {
    ctx.beginPath();
    ctx.arc(element.x - noteDiameter / 3.1, element.y - noteDiameter * 1.7 + yShift, noteDiameter * 1.5, -1, 0.005 * Math.PI - angleShift);
    ctx.stroke();
  }

  drawNotesTaleLeft(ctx, element, noteDiameter, yShift, angleShift) {
    ctx.beginPath();
    ctx.arc(element.x + noteDiameter / 4, element.y + noteDiameter * 1.7 - yShift, noteDiameter * 1.5, -4.2, -1 * Math.PI + angleShift);
    ctx.stroke();
  }

  drawNote(ctx, element, noteDiameter) {
    ctx.beginPath();
    ctx.arc(element.x, element.y, noteDiameter / 2, 0, 2 * Math.PI);
    if (element.time2 > 2) {
      ctx.fill();
    }
    ctx.stroke();
    if (element.order < 8) {
      for (let i = 7 - element.order; i >= 0; i--) {
        if (i%2 === 0) {
          this.drawLine(ctx, element.x - noteDiameter, element.y - noteDiameter * i / 2, element.x + noteDiameter, element.y - noteDiameter * i / 2);
        }
      }
    }
    if (element.order > 18) {
      for (let i = element.order - 19; i >= 0; i--) {
        if (i%2 === 0) {
          this.drawLine(ctx, element.x - noteDiameter, element.y + noteDiameter * i / 2, element.x + noteDiameter, element.y + noteDiameter * i / 2);
        }
      }
    }
    if (element.time2 > 1) {
      if (element.order < 13) {
        this.drawLine(ctx, element.x + noteDiameter / 2, element.y, element.x + noteDiameter / 2, element.y - noteDiameter * 3);
      }
      if (element.order >= 13) {
        this.drawLine(ctx, element.x - noteDiameter / 2, element.y, element.x - noteDiameter / 2, element.y + noteDiameter * 3);
      }
    }
    if (element.time2 >= 4) {
      let times = element.time2 / 4;
      let yShift = 0;
      let angleShift = 0;
      if (element.order < 13) {
        for (let i = 0; i < times; i++) {
          yShift = 11 * i;
          angleShift = 0.2 * i;
          this.drawNotesTaleRight(ctx, element, noteDiameter, yShift, angleShift);
        }
      }
      if (element.order >= 13) {
        for (let i = 0; i < times; i++) {
          yShift = 11 * i;
          angleShift = 0.2 * i;
          this.drawNotesTaleLeft(ctx, element, noteDiameter, yShift, angleShift);
        }
      }
    }
  }

  drawNotes(canvasNotes, notes, noteDiameter) {
    const ctx = canvasNotes.getContext('2d');
    notes.forEach(element => this.drawNote(ctx, element, noteDiameter))
  }

  renderNotes(notes) {
    const canvas = document.getElementById('lines');
    const canvasNotes = document.getElementById('notes');
    const noteDiameter = 20;
    const topOffset = 100;
    const bottomOffset = 100;
    const sideOffset = Math.floor(canvas.width * 0.1);
    const lineWidth = canvas.width - sideOffset;
    const lineStartPoints = this.computeLineStartPoints(canvas, noteDiameter, topOffset, bottomOffset);
    this.parseNotesTime(notes);
    this.computeNotesCoords(notes, lineStartPoints, lineWidth, noteDiameter);
    this.renderLines(canvas, lineStartPoints, noteDiameter, lineWidth);
    this.drawNotes(canvasNotes, notes, noteDiameter);
  }

  cleanCanvas(canvas, startX, startY, endX, endY) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(startX, startY, endX, endY);
  }

  deleteNote(event) {
    const notes = this.notes;
    const clickShift = 10;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.x < event.clientX + clickShift && n.x > event.clientX - clickShift && n.y < event.clientY + clickShift && n.y > event.clientY - clickShift) {
        notes.splice(i, 1);
        const canvas = document.querySelector('#notes');
        this.cleanCanvas(canvas, 0, 0 , canvas.width, canvas.height);
        this.renderNotes(notes);
        break;
      };
    }
  }

  async init() {
    const notes = await this.fetchNotes(this.dataJson);
    this.renderWidget(this.container);
    this.renderNotes(notes);
    this.notes = notes;
    document.querySelector('#notes').addEventListener('pointerup', this.deleteNote.bind(this));
  }
}

const widget = new NotesWidget('body', './data.json');
widget.init();
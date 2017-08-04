const config = require('./config'),
      GridPaint = require('gridpaint'),
      moose = require('./moose');

let painter = new GridPaint({
    width: config.moose.width,
    height: config.moose.height,
    palette: config.moose.palette,
    cellWidth: 16,
    cellHeight: 24
});

let buttons = [
    { action: 'pencil', tool: true },
    { action: 'bucket', tool: true },
    { action: 'undo' },
    { action: 'redo' },
    { action: 'save', save: true },
    { action: 'saveAs' },
    { action: 'clear' }
];

let elements = {};
let palette = [];

function initElements() {
    elements.container = document.getElementById('moose-container');
    elements.palette = document.getElementById('moose-palette');

    elements.modal = {};
    elements.modal.view = document.getElementById('moose-save-modal');
    elements.modal.name = document.getElementById('moose-name');
    elements.modal.nameState = document.getElementById('moose-name-helper');
    elements.modal.openButton = document.getElementById('moose-modal');
    elements.modal.saveButton = document.getElementById('moose-save');
    elements.modal.closeButtons = document.getElementsByClassName('moose-save-modal-close');
}

function textFromError(error) {
    switch (error) {
        case 'invalid name': return 'Invalid moose name';
        case 'invalid image': return 'Invalid moose image';
        case 'name taken': return 'That moose already exists';
        case 'internal error': return 'Internal server error';
        default: return 'Unknown error';
    }
}

function handleSave(result) {
    elements.modal.saveButton.classList.remove('is-loading');

    ['is-success', 'is-danger'].forEach(c => {
        elements.modal.name.classList.remove(c);
        elements.modal.nameState.classList.remove(c);
    });

    if (result.error) {
        elements.modal.name.classList.add('is-danger');
        elements.modal.nameState.classList.add('is-danger');
        elements.modal.nameState.innerText = textFromError(result.error);
    } else {
        elements.modal.name.classList.add('is-success');
        elements.modal.nameState.classList.add('is-success');
        elements.modal.nameState.innerText = 'Yay! Your moose was saved!';
    }
}

function handleSaveError(result) {
    elements.modal.saveButton.classList.remove('is-loading');
    
    ['is-success', 'is-danger'].forEach(c => {
        elements.modal.name.classList.remove(c);
        elements.modal.nameState.classList.remove(c);
    });

    elements.modal.name.classList.add('is-danger');
    elements.modal.nameState.classList.add('is-danger');
    elements.modal.nameState.innerText = 'Error reaching server';
}

function start() {
    initElements();

    [].forEach.call(elements.modal.closeButtons, button => {
        button.onclick = () => {
            ['is-success', 'is-danger'].forEach(c => {
                elements.modal.name.classList.remove(c);
                elements.modal.nameState.classList.remove(c);
            });
            elements.modal.name.value = elements.modal.nameState.innerText = '';
            elements.modal.view.classList.remove('is-active');
        };
    });

    elements.container.appendChild(painter.dom);

    buttons.forEach(button => {
        button.element = document.getElementById('moose-' + button.action);

        if (!button.element) {
            return alert('unable to detect buttons');
        }

        button.element.onclick = () => {
            if (button.tool) {
                buttons.forEach(b => {
                    if (b.element && b.tool) {
                        b.element.classList.remove('is-active')
                    }
                });
                button.element.classList.add('is-active');
                painter.tool = button.action;
            } else if (button.save) {
                elements.modal.saveButton.classList.add('is-loading');
                moose.save(elements.modal.name.value, painter.painting)
                     .then(result => handleSave(result))
                     .catch(error => handleSaveError(error));
            } else {
                painter[button.action]();
            }
        };
    });

    elements.modal.openButton.onclick = () => {
        elements.modal.view.classList.add('is-active');
    };

    painter.palette.forEach((color, i) => {
        let element = document.createElement('button');
        element.classList.add('moose-palette-color');
        element.style.backgroundColor = color;
        if (color === 'transparent') {
            element.classList.add('moose-palette-color-selected');
            element.style.background = 'url(/images/transparent.png)';
        }
        element.innerText = '\xa0';
        element.title = 'Switch to ' + color;
        element.onclick = () => {
            painter.colour = i;
            palette.forEach(e => e.classList.remove('moose-palette-color-selected'));
            element.classList.add('moose-palette-color-selected');
            elements.modal.name.focus();
        }
        palette.push(element);
        elements.palette.appendChild(element);
    });

    painter.grid = true;

    painter.init();

    let edit = window.location.href.match(/edit\/(.+)\/?$/);

    if (edit) {
        moose.get(decodeURIComponent(edit[1]))
             .then(m => {
                 if (m.error) {
                     if (m.error === 'unathorized access') {
                        window.location = '/verify';
                        return;
                     }
                     return alert('Error loading moose: ' + m.error);
                 }
                 painter.painting = m.image;
             })
             .catch(e => alert('Error loading moose: ' + e));
    }
}

if (window.attachEvent) {
    window.attachEvent('onload', start);
} else {
    if (window.onload) {
        let curronload = window.onload;

        window.onload = (event) => {
            curronload(event);
            start();
        };
    } else {
        window.onload = start;
    }
}

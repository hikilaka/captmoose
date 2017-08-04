const config = require('./config'),
      GridPaint = require('gridpaint'),
      xhr = require('xhr'),
      moment = require('moment');

let gridpaintOptions = {
    width: config.moose.width,
    height: config.moose.height,
    palette: config.moose.palette,
    cellWidth: 16,
    cellHeight: 24
};

let elements = {};

let page = 0;

let loadHandler = (children, results) => {
    if (results.error && results.error === 'unauthorized access') {
        window.location = '/verify';
        return;        
    }

    let min = Math.min(children.length, results.length);
    let max = Math.max(children.length, results.length);

    for (let i = 0; i < min; i += 1) {
        try {
            let painter = new GridPaint(gridpaintOptions);

            painter.painting = JSON.parse(results[i].image);
            painter.init();
            painter.drawing = false;

            children[i].link.href = '/edit/' + encodeURIComponent(results[i].name);
            children[i].image.src = painter.dom.toDataURL(); 
            children[i].image.alt = children[i].image.title = results[i].name;
            children[i].card.title.innerHTML = results[i].name;
            children[i].card.created.innerHTML = moment(new Date(results[i].created)).fromNow();
            children[i].card.views.innerHTML = results[i].views + ' view' + (results[i].views !== 1 ? 's' : '');
        } catch (error) {
            console.log(error);
            console.log('result: ' + JSON.stringify(results[i]));
        }
    }
    for (let i = min; i < max; i += 1) {
        removeChildren(children[i].link);
    }
};

function isElementInViewport(element) {
    var rect = element.getBoundingClientRect();

    return rect.top >= 0 && rect.left >= 0 &&
           rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
           rect.right <= (window.innerWidth || document.documentElement.clientWidth);
}

function initElements() {
    elements.container = document.getElementById('gallery-container');
    elements.scrollUpdate = document.getElementById('gallery-scroll-update');
    elements.search = document.getElementById('gallery-search');
    elements.sort = document.getElementById('gallery-sort');

    elements.search.onkeyup = () => {
        clearRows();
        initRows();
    };
    elements.sort.onchange = () => {
        clearRows();
        initRows();
    };
}

function addRow() {
    let columns = document.createElement('div');
    let children = [];

    columns.classList.add('columns');

    for (let i = 0; i < 6; i += 1) {
        let column = document.createElement('div');
        
        column.classList.add('column');
        column.classList.add('is-2');

        let link = document.createElement('a');

        let image = new Image()
        image.src = '/images/loading.gif';
        image.alt = image.title = 'Loading moose...';

        let card = createMooseCard('Loading...', image, '...');

        children.push({ link: link, image: image, card: card });

        link.appendChild(card.card);
        column.appendChild(link);
        columns.appendChild(column);
    }

    elements.container.appendChild(columns);
    return children;
}

function loadRow(success) {
    let options = {
        json: true
    };

    let source = '/gallery/view/' + (page++) + '/';

    source += elements.sort.selectedIndex + '/'

    if (elements.search.value.trim().length > 0) {
        source += elements.search.value.trim();
    }

    xhr.get(source, options, (error, response, body) => {
        if (error) {
            return alert('Error loading gallery page: ' + source);
        }
        success(body);
    });
}

function initRows() {
    while (isElementInViewport(elements.scrollUpdate)) {
        let children = addRow();
        loadRow(results => loadHandler(children, results));
    }
}

function clearRows() {
    removeChildren(elements.container);
    page = 0;
}

function removeChildren(element) {
    let range = new Range();
    range.selectNodeContents(element);
    range.deleteContents();
}

function createMooseCard(name, image, created) {
    let card = document.createElement('div'),
        header = document.createElement('header'),
        headerTitle = document.createElement('p'),
        content = document.createElement('div'),
        contentContainer = document.createElement('div'),
        footer = document.createElement('footer'),
        createdSpan = document.createElement('span'),
        viewsSpan = document.createElement('span');
    
    card.classList.add('card');
    header.classList.add('card-header');
    headerTitle.classList.add('card-header-title');
    content.classList.add('card-content');
    footer.classList.add('card-footer');
    createdSpan.classList.add('card-footer-item');
    viewsSpan.classList.add('card-footer-item');

    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(footer);

    header.appendChild(headerTitle);
    headerTitle.innerHTML = name;

    content.appendChild(contentContainer);
    contentContainer.appendChild(image);

    footer.appendChild(createdSpan);
    footer.appendChild(viewsSpan);
    createdSpan.innerHTML = '';

    return {
        card: card,
        title: headerTitle,
        body: contentContainer,
        created: createdSpan,
        views: viewsSpan
    };
}

function start() {
    initElements();

    let scrollHandler = () => {
        if (isElementInViewport(elements.scrollUpdate)) {
            let children = addRow();
            loadRow(results => loadHandler(children, results));
        }
    };

    if (window.attachEvent) {
        window.attachEvent('scroll', scrollHandler);
    } else {
        if (window.onscroll) {
            let onscroll = window.onscroll;

            window.onscroll = (event) => {
                onscroll(event);
                scrollHandler();
            };
        } else {
            window.onscroll = scrollHandler;
        }
    }

    initRows();
}

if (window.attachEvent) {
    window.attachEvent('onload', start);
} else {
    if (window.onload) {
        let onload = window.onload;

        window.onload = (event) => {
            onload(event);
            start();
        };
    } else {
        window.onload = start;
    }
}

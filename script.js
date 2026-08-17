const pages = document.querySelectorAll('.page');
const wrap = document.getElementById('pagesWrap');
const dotsContainer = document.getElementById('dots');
const pageLabel = document.getElementById('pageLabel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let current = 0;
let animating = false;

const FLIP_MS = 620;


/* =========================================================
   PAGE CONTENT FITTING
   Automatically scales .page-inner so all content fits
   inside the available page area.
   ========================================================= */

function fitPageContent(page) {
  if (!page) return;

  const inner = page.querySelector('.page-inner');
  if (!inner) return;

  // Reset old transform before measuring
  inner.style.transform = 'none';

  // Force browser to calculate the natural content size
  void inner.offsetHeight;

  const pageStyles = getComputedStyle(page);

  const availableWidth =
    page.clientWidth -
    parseFloat(pageStyles.paddingLeft || 0) -
    parseFloat(pageStyles.paddingRight || 0);

  const availableHeight =
    page.clientHeight -
    parseFloat(pageStyles.paddingTop || 0) -
    parseFloat(pageStyles.paddingBottom || 0);

  const contentWidth = inner.scrollWidth;
  const contentHeight = inner.scrollHeight;

  if (
    !contentWidth ||
    !contentHeight ||
    availableWidth <= 0 ||
    availableHeight <= 0
  ) {
    return;
  }

  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;

  // Only shrink content.
  // Never enlarge a page that already fits.
  const scale = Math.min(1, scaleX, scaleY);

  inner.style.transformOrigin = 'top left';
  inner.style.transform = `scale(${scale})`;
}


/* =========================================================
   FIT ALL PAGES
   Used when the website first loads and when the viewport
   changes size.
   ========================================================= */

function fitAllPages() {
  pages.forEach(page => {
    const wasDisplayed = getComputedStyle(page).display !== 'none';

    if (!wasDisplayed) {
      // Temporarily display hidden pages so their content
      // can be measured.
      page.style.display = 'block';
      page.style.visibility = 'hidden';
    }

    fitPageContent(page);

    if (!wasDisplayed) {
      page.style.display = '';
      page.style.visibility = '';
    }
  });
}


/* =========================================================
   PAGE NAVIGATION UI
   ========================================================= */

pages.forEach((p, i) => {
  const dot = document.createElement('div');

  dot.className = 'dot' + (i === 0 ? ' active' : '');

  dot.addEventListener('click', () => {
    goTo(i);
  });

  dotsContainer.appendChild(dot);
});


function updateChrome() {
  [...dotsContainer.children].forEach((dot, i) => {
    dot.classList.toggle('active', i === current);
  });

  const title = pages[current].dataset.title;

  pageLabel.textContent =
    `PAGE ${String(current + 1).padStart(2, '0')} / ${pages.length} · ${title}`;

  prevBtn.classList.toggle(
    'disabled',
    current === 0 || animating
  );

  nextBtn.classList.toggle(
    'disabled',
    current === pages.length - 1 || animating
  );
}


/* =========================================================
   PAGE FLIP
   ========================================================= */

function goTo(i) {
  if (animating) return;

  const target = Math.max(
    0,
    Math.min(pages.length - 1, i)
  );

  if (target === current) return;

  const direction = target > current ? 'next' : 'prev';

  const oldPage = pages[current];
  const newPage = pages[target];

  animating = true;

  prevBtn.classList.add('disabled');
  nextBtn.classList.add('disabled');

  /*
    Lock the wrapper height during the flip animation.
    This prevents the page from jumping when two pages
    temporarily exist.
  */
  wrap.style.minHeight = `${wrap.offsetHeight}px`;


  /* -------------------------------------------------------
     Prepare incoming page
     ------------------------------------------------------- */

  newPage.classList.add('active', 'flip-under');

  // Fit the new page before displaying it
  fitPageContent(newPage);


  /* -------------------------------------------------------
     Prepare outgoing page
     ------------------------------------------------------- */

  oldPage.classList.remove('active');

  oldPage.classList.add(
    'flip-top',
    direction === 'next'
      ? 'flip-next'
      : 'flip-prev'
  );


  /* -------------------------------------------------------
     Update current page
     ------------------------------------------------------- */

  current = target;

  updateChrome();


  /* -------------------------------------------------------
     Finish animation
     ------------------------------------------------------- */

  setTimeout(() => {
    oldPage.classList.remove(
      'flip-top',
      'flip-next',
      'flip-prev'
    );

    newPage.classList.remove('flip-under');

    wrap.style.minHeight = '';

    animating = false;

    // Fit again after the animation/layout has settled
    fitPageContent(newPage);

    updateChrome();

  }, FLIP_MS + 20);
}


/* =========================================================
   PREVIOUS / NEXT BUTTONS
   ========================================================= */

prevBtn.addEventListener('click', () => {
  goTo(current - 1);
});

nextBtn.addEventListener('click', () => {
  goTo(current + 1);
});


/* =========================================================
   KEYBOARD NAVIGATION
   ========================================================= */

document.addEventListener('keydown', (e) => {

  if (e.key === 'ArrowRight') {
    goTo(current + 1);
  }

  if (e.key === 'ArrowLeft') {
    goTo(current - 1);
  }

});


/* =========================================================
   TOUCH / SWIPE SUPPORT
   ========================================================= */

let touchStartX = null;

const stage = document.querySelector('.stage');

stage.addEventListener(
  'touchstart',
  (e) => {
    touchStartX = e.touches[0].clientX;
  },
  { passive: true }
);


stage.addEventListener(
  'touchend',
  (e) => {

    if (touchStartX === null) return;

    const touchEndX = e.changedTouches[0].clientX;

    const dx = touchEndX - touchStartX;

    if (dx > 50) {
      goTo(current - 1);
    }

    if (dx < -50) {
      goTo(current + 1);
    }

    touchStartX = null;

  },
  { passive: true }
);


/* =========================================================
   WINDOW RESIZE
   Recalculate page scaling whenever the browser size
   changes.
   ========================================================= */

let resizeTimer = null;

window.addEventListener('resize', () => {

  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {

    fitAllPages();

    fitPageContent(pages[current]);

  }, 100);

});


/* =========================================================
   INITIAL LOAD
   ========================================================= */

function initializePages() {

  // Make sure only page 1 is active initially
  pages.forEach((page, index) => {

    if (index === 0) {
      page.classList.add('active');
    } else {
      page.classList.remove('active');
    }

    // Remove any leftover animation classes
    page.classList.remove(
      'flip-top',
      'flip-next',
      'flip-prev',
      'flip-under'
    );

  });

  current = 0;

  updateChrome();

  // Wait for images/fonts/layout to settle
  requestAnimationFrame(() => {

    requestAnimationFrame(() => {

      fitAllPages();

      fitPageContent(pages[current]);

    });

  });

}


/* =========================================================
   WAIT FOR PAGE LOAD
   ========================================================= */

if (document.readyState === 'loading') {

  document.addEventListener(
    'DOMContentLoaded',
    initializePages
  );

} else {

  initializePages();

}
// Vanilla-JS roadmap tracker
// Wired up to a signed-in student's Firestore document
// so progress follows them across devices.

/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;

let completed = {};
// Example:
// {
//   "Two Sum": true,
//   "Reverse a Linked List": true
// }

let openSections = {
  Basics: true,
  'Beginners Basic Math Problems': true
};

let saveTimer = null;

const root = document.getElementById('root');


/* =========================================================
   INITIALIZATION
   ========================================================= */

init();

async function init() {
  try {
    console.log("1. Roadmap init started");

    currentUser = await requireLogin();
    console.log("2. User authenticated:", currentUser);

    await loadProgress();
    console.log("3. Progress loaded");

    applyStoredTheme();
    console.log("4. Theme applied");

    render();
    console.log("5. Roadmap rendered");

  } catch (error) {
    console.error("ROADMAP INITIALIZATION FAILED:", error);

    root.innerHTML = `
      <div class="loading-screen">
        <h2>Failed to load roadmap</h2>
        <p>${esc(error.message || error)}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}


/* =========================================================
   FIRESTORE PROGRESS
   ========================================================= */

async function loadProgress() {
  const docRef = db.collection('students').doc(currentUser.uid);

  const snap = await docRef.get();

  if (snap.exists) {

    const data = snap.data();

    completed = data.completed || {};

  } else {

    // Safety net:
    // Account exists in Firebase Auth but not Firestore yet.

    completed = {};

    await docRef.set(
      {
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        completed: {},
      },
      { merge: true }
    );
  }
}


function saveProgress() {

  clearTimeout(saveTimer);

  saveTimer = setTimeout(async () => {

    try {

      await db
        .collection('students')
        .doc(currentUser.uid)
        .set(
          {
            completed
          },
          {
            merge: true
          }
        );

    } catch (err) {

      console.error(
        'Could not save progress:',
        err
      );

    }

  }, 300);
}


/* =========================================================
   DERIVED STATISTICS
   ========================================================= */

function getTotals() {

  let total = 0;
  let solved = 0;

  roadmapData.forEach((topic) => {

    topic.groups.forEach((group) => {

      group.problems.forEach((problem) => {

        total += 1;

        if (completed[problem.title]) {
          solved += 1;
        }

      });

    });

  });

  return {
    total,
    solved
  };
}


function getTopicProgress(topic) {

  let total = 0;
  let solved = 0;

  topic.groups.forEach((group) => {

    group.problems.forEach((problem) => {

      total += 1;

      if (completed[problem.title]) {
        solved += 1;
      }

    });

  });

  return {
    total,
    solved
  };
}


function getCurrentTopicIndex() {

  return roadmapData.findIndex((topic) =>

    topic.groups.some((group) =>

      group.problems.some(
        (problem) => !completed[problem.title]
      )

    )

  );
}


/* =========================================================
   THEME
   ========================================================= */

function applyStoredTheme() {

  const stored =
    localStorage.getItem('dsa-roadmap-theme') || 'dark';

  document.documentElement.setAttribute(
    'data-theme',
    stored
  );
}


function toggleTheme() {

  const current =
    document.documentElement.getAttribute('data-theme');

  const next =
    current === 'dark'
      ? 'light'
      : 'dark';

  document.documentElement.setAttribute(
    'data-theme',
    next
  );

  localStorage.setItem(
    'dsa-roadmap-theme',
    next
  );

  render();
}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function esc(str) {

  const div = document.createElement('div');

  div.textContent = str;

  return div.innerHTML;
}


/* =========================================================
   MAIN RENDER
   ========================================================= */

function render() {

  const {
    total,
    solved
  } = getTotals();


  const currentTopicIndex =
    getCurrentTopicIndex();


  const currentTopicName =
    currentTopicIndex >= 0
      ? roadmapData[currentTopicIndex].title
      : 'DSA Mastery Complete';


  const isDark =
    document.documentElement.getAttribute(
      'data-theme'
    ) !== 'light';


  const pct =
    total === 0
      ? 0
      : Math.round((solved / total) * 100);


  const firstName =
    (
      currentUser.displayName ||
      currentUser.email ||
      'student'
    ).split(' ')[0];


  root.innerHTML = `

    <!-- =====================================================
         TOP BAR
         ===================================================== -->

    <div class="topbar">

      <div class="topbar-left">

        <span class="brand">
          <span class="accent">&gt;_</span>
          dsa-roadmap
        </span>

      </div>


      <div class="topbar-right">

        <span class="student-chip">
          <span class="accent">$</span>
          ${esc(firstName)}
        </span>


        <button
          class="icon-btn"
          id="themeBtn"
          title="Toggle theme"
        >
          ${isDark ? '☀️' : '🌙'}
        </button>


        <button
          class="btn-ghost"
          id="logoutBtn"
        >
          Log out
        </button>

      </div>

    </div>


    <!-- =====================================================
         APP SHELL
         ===================================================== -->

    <div class="app-shell">


      <!-- ===================================================
           HERO
           =================================================== -->

      <section class="hero">

        <div class="hero-eyebrow">
          // DSA Mastery Roadmap
        </div>


        <h1>
          Master Data Structures &amp; Algorithms
        </h1>


        <p>
          Work through topics in order — arrays, linked lists,
          trees, graphs, dynamic programming and more.
          Mark a problem solved only once you can explain the
          approach without help. Your progress here is saved
          to your account, so it follows you to any device.
        </p>


        <!-- CURRENT PROGRESS -->

        <div class="you-are-here">

          <div>

            <div class="label">
              // you are currently here
            </div>

            <div class="topic">
              ${esc(currentTopicName)}
            </div>

          </div>


          <div class="count">
            ${solved} / ${total} problems solved
          </div>

        </div>


        <!-- PROGRESS BAR -->

        <div class="progress-track">

          <div
            class="progress-fill"
            style="width:${pct}%"
          ></div>

        </div>


        

      <!-- ===================================================
           MAIN LAYOUT
           =================================================== -->

      <div class="layout">


        <!-- =================================================
             SIDEBAR
             ================================================= -->

        <aside class="sidebar">

          <div class="sidebar-title">
            // topics
          </div>


          ${roadmapData
            .map((topic, i) => {

              const p =
                getTopicProgress(topic);


              const isCurrent =
                i === currentTopicIndex;


              const isDone =
                p.total > 0 &&
                p.solved === p.total;


              return `

                <button
                  class="sidebar-item
                    ${isCurrent ? 'current' : ''}
                    ${isDone ? 'done' : ''}"
                  data-scroll-topic="${esc(topic.title)}"
                >

                  <span>
                    ${esc(topic.title)}
                  </span>

                  <span class="frac">
                    ${p.solved}/${p.total}
                  </span>

                </button>

              `;

            })
            .join('')}

        </aside>


        <!-- =================================================
             ROADMAP CONTENT
             ================================================= -->

        <main>

          ${roadmapData
            .map((topic) =>
              renderTopic(topic)
            )
            .join('')}


          <div class="sync-note">
            // progress syncs automatically to your account
          </div>

        </main>


      </div>

    </div>
  `;


  bindEvents();
}


/* =========================================================
   RENDER TOPIC
   ========================================================= */

function renderTopic(topic) {

  const p =
    getTopicProgress(topic);


  const isOpen =
    !!openSections[topic.title];


  return `

    <section
      class="topic"
      id="topic-${esc(topic.title)}"
    >


      <button
        class="topic-header"
        data-toggle-section="${esc(topic.title)}"
      >

        <div>

          <div class="topic-title">

            ${esc(topic.title)}

            <span class="frac">
              ${p.solved}/${p.total}
            </span>

          </div>


          <div class="topic-desc">
            ${esc(topic.difficulty)}
          </div>

        </div>


        <span
          class="chevron ${isOpen ? 'open' : ''}"
        >
          ▾
        </span>

      </button>


      <div
        class="topic-body ${isOpen ? 'open' : ''}"
      >

        ${topic.groups
          .map((group) =>
            renderGroup(topic, group)
          )
          .join('')}

      </div>


    </section>

  `;
}


/* =========================================================
   RENDER GROUP
   ========================================================= */

function renderGroup(topic, group) {

  const solved =
    group.problems.filter(
      (p) => completed[p.title]
    ).length;


  const xp =
    solved * 5;


  const totalXp =
    group.problems.length * 5;


  const groupKey =
    `${topic.title}::${group.title}`;


  const isOpen =
    !!openSections[groupKey];


  return `

    <div class="group">


      <button
        class="group-header"
        data-toggle-section="${esc(groupKey)}"
      >

        <div>

          <div class="group-title">
            ${esc(group.title)}
          </div>


          <div class="group-desc">
            ${esc(group.difficulty)}
          </div>

        </div>


        <span class="xp-chip">
          ${xp}/${totalXp} XP
        </span>

      </button>


      <div
        class="problem-list ${isOpen ? 'open' : ''}"
      >

        ${group.problems
          .map((problem, i) =>
            renderProblem(problem, i + 1)
          )
          .join('')}

      </div>


    </div>

  `;
}


/* =========================================================
   RENDER PROBLEM
   ========================================================= */

function renderProblem(problem, lineNumber) {
  const isSolved = !!completed[problem.title];
  const diff = (problem.difficulty || 'medium').toLowerCase();

  const encodedTitle = encodeURIComponent(problem.title);

  const leetcodeUrl =
    `https://leetcode.com/problemset/?search=${encodedTitle}`;

  const gfgUrl =
    `https://www.geeksforgeeks.org/search/?q=${encodedTitle}`;

  return `
    <div class="problem-row">

      <span class="line-num">
        ${lineNumber}
      </span>

      <button
        class="checkbox ${isSolved ? 'checked' : ''}"
        data-toggle-problem="${esc(problem.title)}"
        aria-label="Mark ${esc(problem.title)} ${isSolved ? 'incomplete' : 'solved'}"
      >
        ${isSolved ? '✓' : ''}
      </button>

      <span class="problem-name ${isSolved ? 'solved' : ''}">
        ${esc(problem.title)}
      </span>

      <span class="diff-tag ${diff}">
        ${esc(diff)}
      </span>

      <div class="problem-platforms">

        <a
          href="${leetcodeUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="problem-platform lc"
          title="Search this problem on LeetCode"
        >
          LC
        </a>

        <a
          href="${gfgUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="problem-platform gfg"
          title="Search this problem on GeeksforGeeks"
        >
          GfG
        </a>

      </div>

    </div>
  `;
}

/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {


  /* -------------------------------------------------------
     THEME
     ------------------------------------------------------- */

  const themeBtn =
    document.getElementById('themeBtn');

  if (themeBtn) {

    themeBtn.addEventListener(
      'click',
      toggleTheme
    );

  }


  /* -------------------------------------------------------
     LOGOUT
     ------------------------------------------------------- */

  const logoutBtn =
    document.getElementById('logoutBtn');

  if (logoutBtn) {

    logoutBtn.addEventListener(
      'click',
      logOutStudent
    );

  }


  /* -------------------------------------------------------
     OPEN / CLOSE TOPICS AND GROUPS
     ------------------------------------------------------- */

  root
    .querySelectorAll('[data-toggle-section]')
    .forEach((el) => {

      el.addEventListener(
        'click',
        () => {

          const key =
            el.getAttribute(
              'data-toggle-section'
            );


          openSections[key] =
            !openSections[key];


          render();

        }
      );

    });


  /* -------------------------------------------------------
     PROBLEM CHECKBOXES
     ------------------------------------------------------- */

  root
    .querySelectorAll('[data-toggle-problem]')
    .forEach((el) => {

      el.addEventListener(
        'click',
        () => {

          const title =
            el.getAttribute(
              'data-toggle-problem'
            );


          completed[title] =
            !completed[title];


          if (!completed[title]) {
            delete completed[title];
          }


          saveProgress();

          render();

        }
      );

    });


  /* -------------------------------------------------------
     SIDEBAR TOPIC NAVIGATION
     ------------------------------------------------------- */

  root
    .querySelectorAll('[data-scroll-topic]')
    .forEach((el) => {

      el.addEventListener(
        'click',
        () => {

          const title =
            el.getAttribute(
              'data-scroll-topic'
            );


          openSections[title] = true;

          render();


          requestAnimationFrame(() => {

            document
              .getElementById(
                `topic-${title}`
              )
              ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });

          });

        }
      );

    });

}
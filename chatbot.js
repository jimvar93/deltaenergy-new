/* ══════════════════════════════════════════════════════════
   DELTA ENERGY — Chatbot
   State-machine based pre-sales assistant following the
   DeltaEnergy chatbot system prompt flow.
   ══════════════════════════════════════════════════════════ */

/* ── UI helpers ── */
function toggleChat() {
  const win   = document.getElementById('chat-window');
  const open  = document.getElementById('chat-icon-open');
  const close = document.getElementById('chat-icon-close');
  const badge = document.getElementById('chatBadge');
  const isOpen = win.classList.toggle('open');
  open.style.display  = isOpen ? 'none'  : 'block';
  close.style.display = isOpen ? 'block' : 'none';
  if (isOpen) {
    badge.style.display = 'none';
    if (!bot.started) { bot.start(); bot.started = true; }
    setTimeout(scrollChat, 80);
  }
}
document.getElementById('chat-toggle').addEventListener('click', toggleChat);

function scrollChat() {
  const msgs = document.getElementById('chatMessages');
  msgs.scrollTop = msgs.scrollHeight;
}

function addMsg(text, type) {
  const msgs = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-msg ${type}`;
  div.innerHTML = text.replace(/\n/g, '<br>');
  msgs.appendChild(div);
  scrollChat();
  return div;
}

function showTyping() {
  const msgs = document.getElementById('chatMessages');
  const t = document.createElement('div');
  t.className = 'chat-typing';
  t.id = 'chatTyping';
  t.innerHTML = '<span></span><span></span><span></span>';
  msgs.appendChild(t);
  scrollChat();
}
function hideTyping() {
  document.getElementById('chatTyping')?.remove();
}

function setOptions(options) {
  const el = document.getElementById('chatOptions');
  const inputRow = document.getElementById('chatInputRow');
  el.innerHTML = '';
  inputRow.style.display = 'none';

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'chat-opt-btn';
    btn.textContent = opt.label || opt;
    btn.addEventListener('click', () => {
      bot.handleUserInput(opt.value || opt, opt.label || opt);
    });
    el.appendChild(btn);
  });
}

function setFreeText(placeholder) {
  const el = document.getElementById('chatOptions');
  const inputRow = document.getElementById('chatInputRow');
  el.innerHTML = '';
  inputRow.style.display = 'flex';
  const input = document.getElementById('chatInput');
  input.placeholder = placeholder || 'Γράψτε εδώ…';
  input.value = '';
  setTimeout(() => input.focus(), 100);
}

function clearControls() {
  document.getElementById('chatOptions').innerHTML = '';
  document.getElementById('chatInputRow').style.display = 'none';
}

/* Enter key on input */
document.getElementById('chatInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('chatSend').click();
});
document.getElementById('chatSend').addEventListener('click', () => {
  const val = document.getElementById('chatInput').value.trim();
  if (val) bot.handleUserInput(val, val);
});

/* ════════════════════════════════════════════
   BOT ENGINE
   ════════════════════════════════════════════ */
const bot = {
  started: false,
  state: 'welcome',
  data: {},
  queue: [],         // pending bot messages

  start() {
    this.goto('welcome');
  },

  /* Dispatch to state handler */
  goto(state) {
    this.state = state;
    const handler = this.states[state];
    if (!handler) return;
    clearControls();
    handler.enter.call(this);
  },

  /* User sent something */
  handleUserInput(value, label) {
    addMsg(label, 'user');
    clearControls();
    const handler = this.states[this.state];
    if (handler && handler.handle) {
      handler.handle.call(this, value, label);
    }
  },

  /* Bot speaks with typing delay */
  say(text, delay = 700) {
    return new Promise(resolve => {
      showTyping();
      setTimeout(() => {
        hideTyping();
        addMsg(text, 'bot');
        resolve();
      }, delay);
    });
  },

  /* ── STATE MACHINE ── */
  states: {

    /* ─────────── WELCOME ─────────── */
    welcome: {
      enter() {
        this.say('Καλωσήρθατε στη <strong>DELTAENERGY</strong>! 👋\n\nΜπορώ να σας κάνω μερικές σύντομες ερωτήσεις ώστε να καταγράψω σωστά το αίτημά σας και να σας καλέσει ο κατάλληλος σύμβουλος;', 900)
          .then(() => setOptions([
            { label: 'Ναι, φυσικά', value: 'yes' },
            { label: 'Έχω μια γρήγορη ερώτηση', value: 'quick' },
          ]));
      },
      handle(v) {
        if (v === 'quick') {
          this.say('Φυσικά! Γράψτε την ερώτησή σας και θα την καταγράψω για τον σύμβουλό μας.', 500)
            .then(() => {
              this.state = 'quick_question';
              setFreeText('Η ερώτησή σας…');
            });
        } else {
          this.goto('service');
        }
      }
    },

    /* ─────────── QUICK QUESTION ─────────── */
    quick_question: {
      enter() {
        setFreeText('Η ερώτησή σας…');
      },
      handle(v) {
        this.data.special_notes = v;
        this.goto('collect_name');
      }
    },

    /* ─────────── SERVICE SELECTION ─────────── */
    service: {
      enter() {
        this.say('Για ποιο θέμα ενδιαφέρεστε περισσότερο;', 600)
          .then(() => setOptions([
            { label: '💡 Μείωση κόστους ρεύματος', value: 'cost' },
            { label: '📊 Διαχείριση ενέργειας / παρακολούθηση κατανάλωσης', value: 'management' },
            { label: '☀️ Φωτοβολταϊκά', value: 'pv' },
            { label: '🔌 Ηλεκτροκίνηση / φορτιστές', value: 'ev' },
            { label: '❓ Δεν είμαι σίγουρος, θέλω καθοδήγηση', value: 'unsure' },
          ]));
      },
      handle(v, label) {
        this.data.service_interest = label;
        this.goto('customer_type');
      }
    },

    /* ─────────── CUSTOMER TYPE ─────────── */
    customer_type: {
      enter() {
        this.say('Το ενδιαφέρον αφορά οικία ή επιχείρηση;', 600)
          .then(() => setOptions([
            { label: '🏠 Οικία', value: 'residential' },
            { label: '🏢 Επιχείρηση', value: 'business' },
          ]));
      },
      handle(v) {
        this.data.customer_type = v === 'business' ? 'Επιχείρηση' : 'Οικία';
        if (v === 'business') {
          this.goto('business_activity');
        } else {
          this._routeService();
        }
      }
    },

    /* ─────────── BUSINESS ACTIVITY ─────────── */
    business_activity: {
      enter() {
        this.say('Ποια είναι η δραστηριότητα της επιχείρησής σας;', 500)
          .then(() => setFreeText('π.χ. Ξενοδοχείο, βιομηχανία, εμπόριο…'));
      },
      handle(v) {
        this.data.business_activity = v;
        this._routeService();
      }
    },

    /* ─────────── COST REDUCTION Q1 ─────────── */
    cost_q1: {
      enter() {
        this.say('Θέλετε έλεγχο / βελτιστοποίηση του τιμολογίου ρεύματος ή γενικότερα μείωση της συνολικής ενεργειακής δαπάνης;', 600)
          .then(() => setOptions([
            { label: 'Βελτιστοποίηση τιμολογίου', value: 'tariff' },
            { label: 'Μείωση συνολικής ενεργειακής δαπάνης', value: 'total' },
            { label: 'Και τα δύο', value: 'both' },
          ]));
      },
      handle(v, label) {
        this.data.need_summary = label;
        this.goto('cost_q2');
      }
    },
    cost_q2: {
      enter() {
        this.say('Περίπου πόσο είναι ο μηνιαίος λογαριασμός ρεύματος;', 500)
          .then(() => setFreeText('π.χ. 200€ / μήνα'));
      },
      handle(v) {
        this.data.bill_level = v;
        this.goto('cost_q3');
      }
    },
    cost_q3: {
      enter() {
        this.say('Έχετε μία παροχή ή περισσότερες;', 500)
          .then(() => setOptions([
            { label: 'Μία παροχή', value: '1' },
            { label: 'Περισσότερες', value: 'multiple' },
          ]));
      },
      handle(v, label) {
        this.data.number_of_supplies_or_chargers = label;
        this.goto('collect_area');
      }
    },

    /* ─────────── ENERGY MANAGEMENT Q1 ─────────── */
    mgmt_q1: {
      enter() {
        this.say('Ποιο είναι το βασικό πρόβλημα που θέλετε να λύσετε;', 600)
          .then(() => setOptions([
            { label: 'Υψηλή κατανάλωση χωρίς έλεγχο', value: 'high_consumption' },
            { label: 'Παρακολούθηση πολλών παροχών', value: 'multi_supply' },
            { label: 'Ανάλυση ενεργειακών εξόδων', value: 'analysis' },
            { label: 'Απομακρυσμένη παρακολούθηση', value: 'remote' },
          ]));
      },
      handle(v, label) {
        this.data.need_summary = label;
        this.goto('mgmt_q2');
      }
    },
    mgmt_q2: {
      enter() {
        this.say('Πόσες παροχές ή σημεία κατανάλωσης θέλετε να παρακολουθείτε;', 500)
          .then(() => setFreeText('π.χ. 1, 3, πολλαπλά…'));
      },
      handle(v) {
        this.data.number_of_supplies_or_chargers = v;
        this.goto('collect_area');
      }
    },

    /* ─────────── PHOTOVOLTAICS TYPE ─────────── */
    pv_type: {
      enter() {
        this.say('Σας ενδιαφέρει φωτοβολταϊκό για αυτοπαραγωγή ή για επένδυση / φωτοβολταϊκό πάρκο;', 600)
          .then(() => setOptions([
            { label: '⚡ Αυτοπαραγωγή (net metering)', value: 'auto' },
            { label: '🌄 Φωτοβολταϊκό πάρκο / επένδυση', value: 'park' },
          ]));
      },
      handle(v) {
        this.data.pv_type = v;
        if (v === 'park') {
          this.goto('pv_park_q1');
        } else {
          this.goto('pv_auto_q1');
        }
      }
    },
    /* Auto-production */
    pv_auto_q1: {
      enter() {
        this.say('Το ακίνητο είναι ιδιόκτητο ή μισθωμένο;', 500)
          .then(() => setOptions([
            { label: 'Ιδιόκτητο', value: 'owned' },
            { label: 'Μισθωμένο', value: 'rented' },
          ]));
      },
      handle(v, label) {
        this.data.property_type = label;
        this.goto('pv_auto_q2');
      }
    },
    pv_auto_q2: {
      enter() {
        this.say('Υπάρχει διαθέσιμος χώρος σε στέγη, ταράτσα ή οικόπεδο;', 500)
          .then(() => setOptions([
            { label: '✅ Ναι', value: 'yes' },
            { label: '❌ Όχι / Δεν γνωρίζω', value: 'no' },
          ]));
      },
      handle(v, label) {
        this.data.available_space = label;
        this.goto('pv_auto_q3');
      }
    },
    pv_auto_q3: {
      enter() {
        this.say('Περίπου ποια είναι η μηνιαία κατανάλωση ρεύματος;', 500)
          .then(() => setFreeText('π.χ. 300 kWh ή 80€/μήνα'));
      },
      handle(v) {
        this.data.bill_level = v;
        this.goto('collect_area');
      }
    },
    /* PV Park */
    pv_park_q1: {
      enter() {
        this.say('Υπάρχει ήδη διαθέσιμο οικόπεδο ή αναζητάτε και χώρο;', 600)
          .then(() => setOptions([
            { label: 'Έχω ήδη οικόπεδο', value: 'have' },
            { label: 'Αναζητώ χώρο', value: 'looking' },
          ]));
      },
      handle(v, label) {
        this.data.available_space = label;
        this.goto('pv_park_q2');
      }
    },
    pv_park_q2: {
      enter() {
        this.say('Γνωρίζετε περίπου την έκταση του χώρου;', 500)
          .then(() => setFreeText('π.χ. 5 στρέμματα, 1 εκτάριο…'));
      },
      handle(v) {
        this.data.property_type = 'Πάρκο — Έκταση: ' + v;
        this.goto('collect_area');
      }
    },

    /* ─────────── EV / CHARGING Q1 ─────────── */
    ev_q1: {
      enter() {
        this.say('Σας ενδιαφέρει φορτιστής για οικιακή χρήση ή για επιχείρηση;', 600)
          .then(() => setOptions([
            { label: '🏠 Οικιακή χρήση', value: 'home' },
            { label: '🏢 Επιχείρηση / δημόσιος χώρος', value: 'business' },
          ]));
      },
      handle(v, label) {
        this.data.ev_use = label;
        this.goto('ev_q2');
      }
    },
    ev_q2: {
      enter() {
        this.say('Θέλετε έναν φορτιστή ή περισσότερα σημεία φόρτισης;', 500)
          .then(() => setOptions([
            { label: 'Έναν φορτιστή', value: '1' },
            { label: '2-5 σημεία', value: '2-5' },
            { label: 'Περισσότερα (στόλος / parking)', value: 'many' },
          ]));
      },
      handle(v, label) {
        this.data.number_of_supplies_or_chargers = label;
        this.goto('ev_q3');
      }
    },
    ev_q3: {
      enter() {
        this.say('Θέλετε απλή φόρτιση ή και δυνατότητα διαχείρισης / χρέωσης χρηστών;', 500)
          .then(() => setOptions([
            { label: 'Απλή φόρτιση', value: 'simple' },
            { label: 'Smart — με διαχείριση / χρέωση', value: 'smart' },
            { label: 'Δεν είμαι σίγουρος', value: 'unsure' },
          ]));
      },
      handle(v, label) {
        this.data.need_summary = 'Φόρτιση: ' + label;
        this.goto('collect_area');
      }
    },

    /* ─────────── NOT SURE ─────────── */
    unsure_q1: {
      enter() {
        this.say('Ποιο είναι το βασικό πρόβλημα που αντιμετωπίζετε σήμερα;', 600)
          .then(() => setOptions([
            { label: 'Πολύ υψηλοί λογαριασμοί ρεύματος', value: 'high_bills' },
            { label: 'Θέλω να εγκαταστήσω φωτοβολταϊκά', value: 'pv' },
            { label: 'Θέλω φορτιστή για ηλεκτρικό αυτοκίνητο', value: 'ev' },
            { label: 'Θέλω να ελέγχω καλύτερα την κατανάλωση', value: 'monitoring' },
          ]));
      },
      handle(v, label) {
        this.data.need_summary = label;
        const map = { high_bills: 'cost', pv: 'pv', ev: 'ev', monitoring: 'management' };
        const svc = map[v] || 'cost';
        const svcLabels = { cost: '💡 Μείωση κόστους ρεύματος', pv: '☀️ Φωτοβολταϊκά', ev: '🔌 Ηλεκτροκίνηση / φορτιστές', management: '📊 Διαχείριση ενέργειας' };
        this.data.service_interest = svcLabels[svc];
        // Route to appropriate branch
        this.say(`Ωραία! Φαίνεται ότι η κατάλληλη υπηρεσία είναι: <strong>${svcLabels[svc]}</strong>. Ας συνεχίσουμε με μερικές ερωτήσεις.`, 700)
          .then(() => {
            const next = { cost: 'cost_q1', pv: 'pv_type', ev: 'ev_q1', management: 'mgmt_q1' };
            this.goto(next[svc]);
          });
      }
    },

    /* ─────────── COLLECT AREA ─────────── */
    collect_area: {
      enter() {
        this.say('Σε ποια πόλη / περιοχή βρίσκεται το ακίνητο ή η εγκατάσταση;', 600)
          .then(() => setFreeText('π.χ. Αθήνα, Θεσσαλονίκη…'));
      },
      handle(v) {
        this.data.project_area = v;
        this.goto('collect_timeline');
      }
    },

    /* ─────────── TIMELINE ─────────── */
    collect_timeline: {
      enter() {
        this.say('Πότε θα θέλατε να ξεκινήσει η διερεύνηση / το έργο;', 500)
          .then(() => setOptions([
            { label: 'Άμεσα', value: 'Άμεσα' },
            { label: 'Εντός 1–3 μηνών', value: 'Εντός 1-3 μηνών' },
            { label: 'Χωρίς συγκεκριμένο χρόνο', value: 'Χωρίς συγκεκριμένο χρόνο' },
          ]));
      },
      handle(v) {
        this.data.timeline = v;
        this.goto('collect_name');
      }
    },

    /* ─────────── COLLECT NAME ─────────── */
    collect_name: {
      enter() {
        this.say('Τέλεια! Ας καταγράψω τα στοιχεία σας.\n\nΤο ονοματεπώνυμό σας;', 700)
          .then(() => setFreeText('Ονοματεπώνυμο'));
      },
      handle(v) {
        this.data.customer_name = v;
        if (this.data.customer_type === 'Επιχείρηση') {
          this.goto('collect_company');
        } else {
          this.goto('collect_contact');
        }
      }
    },

    /* ─────────── COMPANY NAME (business only) ─────────── */
    collect_company: {
      enter() {
        this.say('Ποια είναι η επωνυμία της επιχείρησης;', 400)
          .then(() => setFreeText('Επωνυμία επιχείρησης'));
      },
      handle(v) {
        this.data.company_name = v;
        this.goto('collect_contact');
      }
    },

    /* ─────────── CONTACT INFO ─────────── */
    collect_contact: {
      enter() {
        this.say('Ποιο τηλέφωνο ή email επικοινωνίας προτιμάτε να δώσετε;', 500)
          .then(() => setFreeText('Τηλέφωνο ή email'));
      },
      handle(v) {
        // Detect if phone or email
        if (v.includes('@')) { this.data.email = v; }
        else { this.data.phone = v; }
        this.goto('collect_contact_time');
      }
    },

    /* ─────────── PREFERRED CONTACT TIME ─────────── */
    collect_contact_time: {
      enter() {
        this.say('Ποια ώρα σας εξυπηρετεί καλύτερα για επικοινωνία;', 400)
          .then(() => setOptions([
            { label: 'Πρωί (09:00–13:00)', value: 'Πρωί 09:00-13:00' },
            { label: 'Απόγευμα (13:00–17:00)', value: 'Απόγευμα 13:00-17:00' },
            { label: 'Οποιαδήποτε ώρα', value: 'Οποιαδήποτε ώρα' },
          ]));
      },
      handle(v) {
        this.data.preferred_contact_time = v;
        this.goto('collect_extra');
      }
    },

    /* ─────────── EXTRA NOTES ─────────── */
    collect_extra: {
      enter() {
        this.say('Θέλετε να προσθέσετε κάτι ακόμη που θεωρείτε σημαντικό;', 500)
          .then(() => {
            setFreeText('Προαιρετικές σημειώσεις…');
            // Add skip button
            const el = document.getElementById('chatOptions');
            const btn = document.createElement('button');
            btn.className = 'chat-opt-btn';
            btn.textContent = 'Όχι, ευχαριστώ';
            btn.addEventListener('click', () => {
              bot.handleUserInput('—', 'Καμία σημείωση');
            });
            el.appendChild(btn);
          });
      },
      handle(v) {
        if (v !== '—') this.data.special_notes = v;
        this.goto('confirm');
      }
    },

    /* ─────────── SUMMARY & CONFIRM ─────────── */
    confirm: {
      enter() {
        const d = this.data;
        let summary = '<div class="chat-summary">';
        summary += '<strong>📋 Σύνοψη αιτήματος</strong><br>';
        if (d.customer_name)    summary += `👤 <strong>Όνομα:</strong> ${esc(d.customer_name)}<br>`;
        if (d.company_name)     summary += `🏢 <strong>Επιχείρηση:</strong> ${esc(d.company_name)}<br>`;
        if (d.business_activity) summary += `🔧 <strong>Δραστηριότητα:</strong> ${esc(d.business_activity)}<br>`;
        if (d.customer_type)    summary += `👥 <strong>Τύπος:</strong> ${esc(d.customer_type)}<br>`;
        if (d.service_interest) summary += `⚡ <strong>Υπηρεσία:</strong> ${esc(d.service_interest)}<br>`;
        if (d.need_summary)     summary += `📝 <strong>Ανάγκη:</strong> ${esc(d.need_summary)}<br>`;
        if (d.bill_level)       summary += `💶 <strong>Λογαριασμός:</strong> ${esc(d.bill_level)}<br>`;
        if (d.project_area)     summary += `📍 <strong>Περιοχή:</strong> ${esc(d.project_area)}<br>`;
        if (d.timeline)         summary += `🗓️ <strong>Χρόνος:</strong> ${esc(d.timeline)}<br>`;
        if (d.phone)            summary += `📞 <strong>Τηλέφωνο:</strong> ${esc(d.phone)}<br>`;
        if (d.email)            summary += `📧 <strong>Email:</strong> ${esc(d.email)}<br>`;
        if (d.preferred_contact_time) summary += `🕐 <strong>Επικοινωνία:</strong> ${esc(d.preferred_contact_time)}<br>`;
        if (d.special_notes && d.special_notes !== '—') summary += `💬 <strong>Σημειώσεις:</strong> ${esc(d.special_notes)}<br>`;
        summary += '</div>';

        const msgs = document.getElementById('chatMessages');
        msgs.insertAdjacentHTML('beforeend', summary);
        scrollChat();

        setTimeout(() => {
          this.say('Τα παραπάνω είναι σωστά;', 400)
            .then(() => setOptions([
              { label: '✅ Ναι, σωστά', value: 'yes' },
              { label: '✏️ Θέλω να διορθώσω κάτι', value: 'edit' },
            ]));
        }, 300);
      },
      handle(v) {
        if (v === 'edit') {
          this.say('Χωρίς πρόβλημα! Γράψτε τι θέλετε να αλλάξετε και θα το σημειώσω.', 500)
            .then(() => {
              this.state = 'edit_note';
              setFreeText('Τι θέλετε να αλλάξετε;');
            });
        } else {
          this.goto('handoff');
        }
      }
    },

    edit_note: {
      enter() { setFreeText('Τι θέλετε να αλλάξετε;'); },
      handle(v) {
        this.data.special_notes = (this.data.special_notes ? this.data.special_notes + ' | ' : '') + 'Διόρθωση: ' + v;
        this.goto('handoff');
      }
    },

    /* ─────────── HANDOFF ─────────── */
    handoff: {
      enter() {
        const d = this.data;
        this.say(
          'Ευχαριστώ πολύ, <strong>' + esc(d.customer_name || 'φίλε/η') + '</strong>! 🌿\n\nΤο αίτημά σας έχει καταγραφεί. Ένας σύμβουλος της <strong>DELTAENERGY</strong> θα επικοινωνήσει μαζί σας το συντομότερο δυνατό.',
          800
        ).then(() => {
          // Build mailto
          const body = buildMailtoBody(d);
          const mailBtn = document.createElement('a');
          mailBtn.href = `mailto:info@deltaenergy.gr?subject=${encodeURIComponent('Νέο Αίτημα από Chatbot — ' + (d.customer_name || 'Επισκέπτης'))}&body=${encodeURIComponent(body)}`;
          mailBtn.target = '_blank';
          mailBtn.className = 'chat-opt-btn';
          mailBtn.textContent = '📧 Αποστολή με email';
          mailBtn.style.textAlign = 'center';
          document.getElementById('chatOptions').appendChild(mailBtn);

          // Phone call option
          const tel = document.createElement('a');
          tel.href = 'tel:+302109210702';
          tel.className = 'chat-opt-btn';
          tel.textContent = '📞 Καλέστε μας: 210 921 0702';
          tel.style.textAlign = 'center';
          document.getElementById('chatOptions').appendChild(tel);
        });
      }
    }
  },

  /* ── Route to service-specific questions ── */
  _routeService() {
    const svc = this.data.service_interest || '';
    if (svc.includes('κόστους') || svc.includes('ρεύματος')) return this.goto('cost_q1');
    if (svc.includes('Διαχείριση') || svc.includes('παρακολούθηση'))  return this.goto('mgmt_q1');
    if (svc.includes('Φωτοβολταϊκά') || svc.includes('φωτοβολταϊκ'))  return this.goto('pv_type');
    if (svc.includes('Ηλεκτροκίνηση') || svc.includes('φορτιστές'))    return this.goto('ev_q1');
    return this.goto('unsure_q1');
  }
};

/* ── Helpers ── */
function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function buildMailtoBody(d) {
  let body = 'ΝΕΑΟ ΑΙΤΗΜΑ ΑΠΟ CHATBOT — DELTAENERGY WEBSITE\n';
  body += '='.repeat(50) + '\n\n';
  body += `Ονοματεπώνυμο: ${d.customer_name || '—'}\n`;
  body += `Επωνυμία: ${d.company_name || '—'}\n`;
  body += `Δραστηριότητα: ${d.business_activity || '—'}\n`;
  body += `Τύπος Πελάτη: ${d.customer_type || '—'}\n`;
  body += `Υπηρεσία Ενδιαφέροντος: ${d.service_interest || '—'}\n`;
  body += `Σύνοψη Ανάγκης: ${d.need_summary || '—'}\n`;
  body += `Λογαριασμός Ρεύματος: ${d.bill_level || '—'}\n`;
  body += `Τύπος Ακινήτου: ${d.property_type || '—'}\n`;
  body += `Διαθέσιμος Χώρος: ${d.available_space || '—'}\n`;
  body += `Αριθμός Παροχών/Φορτιστών: ${d.number_of_supplies_or_chargers || '—'}\n`;
  body += `Περιοχή Έργου: ${d.project_area || '—'}\n`;
  body += `Επιθυμητός Χρόνος Έναρξης: ${d.timeline || '—'}\n`;
  body += `Τηλέφωνο: ${d.phone || '—'}\n`;
  body += `Email: ${d.email || '—'}\n`;
  body += `Ώρα Επικοινωνίας: ${d.preferred_contact_time || '—'}\n`;
  body += `Σημειώσεις: ${d.special_notes || '—'}\n`;
  body += '\n' + '='.repeat(50) + '\n';
  body += 'Αποστολή: Chatbot deltaenergy.gr\n';
  body += `Ημερομηνία: ${new Date().toLocaleString('el-GR')}\n`;
  return body;
}

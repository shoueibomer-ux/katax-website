// KATAX — loads editable site content (set via /admin.html) and applies it
// to whichever of these elements exist on the current page. Safe to include
// on every page; it simply does nothing for elements that aren't present.

document.addEventListener('DOMContentLoaded', function () {
  fetch('/api/content')
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (content) {
      if (!content) return;
      applyHero(content.hero);
      applyContact(content.contact);
      applyHomeServicesList(content.services);
      applyServiceDetails(content.services);
    })
    .catch(function () {
      // Content API not reachable (e.g. static preview with no backend) —
      // the page's hardcoded copy is shown as-is, which is a fine fallback.
    });

  function applyHero(hero) {
    if (!hero) return;
    var eyebrow = document.getElementById('hero-eyebrow');
    var headline = document.getElementById('hero-headline');
    var subtext = document.getElementById('hero-subtext');
    if (eyebrow && hero.eyebrow) eyebrow.textContent = hero.eyebrow;
    if (headline && hero.headline) headline.textContent = hero.headline;
    if (subtext && hero.subtext) subtext.textContent = hero.subtext;
  }

  function applyContact(contact) {
    if (!contact) return;

    if (contact.phone) {
      var digits = contact.phone.replace(/\D/g, '');
      var telHref = digits.length === 10 ? 'tel:+1' + digits : 'tel:+' + digits;
      document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
        a.href = telHref;
        a.textContent = a.textContent.replace(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/, contact.phone);
      });
    }

    if (contact.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
        a.href = 'mailto:' + contact.email;
        a.textContent = a.textContent.replace(/[\w.+-]+@[\w.-]+\.\w+/, contact.email);
      });
    }

    if (contact.addressLine) {
      document.querySelectorAll('.js-address').forEach(function (el) {
        el.textContent = contact.addressLine;
      });
    }
  }

  var ICON_BY_CODE = {
    T1: 'icon-person',
    T2125: 'icon-briefcase',
    T2: 'icon-building',
    GL: 'icon-book',
    GST34: 'icon-percent'
  };

  function applyHomeServicesList(services) {
    var container = document.getElementById('home-services-list');
    if (!container || !services || !services.length) return;
    container.innerHTML = services.map(function (s) {
      var icon = ICON_BY_CODE[s.code] || 'icon-book';
      return (
        '<div class="line-item">' +
          '<span class="line-item__icon"><svg><use href="#' + icon + '"/></svg></span>' +
          '<span class="line-item__code">' + escapeHtml(s.code) + '</span>' +
          '<div class="line-item__body">' +
            '<h3>' + escapeHtml(s.title) + '</h3>' +
            '<p>' + escapeHtml(s.description) + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function applyServiceDetails(services) {
    if (!services || !services.length) return;
    var byCode = {};
    services.forEach(function (s) { byCode[s.code] = s; });

    document.querySelectorAll('.service-detail').forEach(function (block) {
      var codeEl = block.querySelector('.service-detail__code');
      if (!codeEl) return;
      var match = byCode[codeEl.textContent.trim()];
      if (!match) return;
      var h3 = block.querySelector('h3');
      var p = block.querySelector('p');
      if (h3) h3.textContent = match.title;
      if (p) p.textContent = match.description;
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }
});

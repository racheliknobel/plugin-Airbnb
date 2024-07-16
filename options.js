const { log } = console

document.getElementById('addSearch').addEventListener('click', addSearchFields);
document.getElementById('search').addEventListener('click', () => performSearch(ParseSearchesFromHtmlContent()));
const resultsDiv = document.getElementById("results");
const nextBtn = document.getElementById('next')
nextBtn.addEventListener('click', async () => {
  if (nextUrls.length) {
    await performSearch(nextUrls)
    nextUrls = []
  }
})

const closeTabsBtn = document.getElementById('closeTabs')


// let tabs = []
let nextUrls = []

function addSearchFields() {
  const searchFields = document.getElementById('searchFields');
  const lastGroup = searchFields.lastElementChild;
  const newGroup = lastGroup.cloneNode(true);
  newGroup.querySelector('#flexible_date_search').value = lastGroup.querySelector('#flexible_date_search').value;
  // newGroup.querySelectorAll('input').forEach(input => input.value = '');
  searchFields.appendChild(newGroup);
}

function ParseSearchesFromHtmlContent() {
  return [...document.querySelectorAll('.searchGroup')].map(group => {

    const location = group.querySelector('.location').value
    const checkIn = group.querySelector('.checkIn').value
    const checkOut = group.querySelector('.checkOut').value
    const flexible_date_search = group.querySelector('#flexible_date_search').value

    return `https://www.airbnb.com/s/${location}/homes?checkin=${checkIn}&checkout=${checkOut}${flexible_date_search === 'false' ? '' : `&flexible_date_search_filter_type=${flexible_date_search}`}`;

  })
}

// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//   chrome.tabs.sendMessage(tabs[0].id, {action: "performSearch", searches: searches});
// });
// }
async function performSearch(searches) {
  resultsDiv.innerHTML = "";
  const listingsMap = new Map(); // שימוש במפה כדי למנוע חזרות של אותו ID

  function renderListing(id) {
    const { listing: { title, url, price, html }, div, searchIndexes } = listingsMap.get(id);
    const indexes = searchIndexes.sort().map(a => a + 1).join(', ')
    div.innerHTML = `${indexes} - <a href="${url}" target="_blank">${title}</a> - ${price}`;
    resultsDiv.appendChild(div);
  }


  return Promise.all(
    searches.map(
      (url, searchIndex) =>
        chrome.tabs.create({ url, active: false })
          .then(
            tab =>
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: worker,
                args: [closeTabsBtn.checked]
              }))
          .then(
            ([{ result: { listings, nextBtn } }]) => {
              console.log({ listings, nextBtn })
              if (nextBtn) {
                nextUrls.push(nextBtn)
              }

              for (const listing of listings) {
                const { id, title, url, price, html } = listing
                if (!listingsMap.has(id)) {
                  // listingsMap.set(id, true);
                  // const div = document.createElement("div");
                  // div.innerHTML = `${searchIndex + 1} - <a href="${url}" target="_blank">${title}</a> - ${price}`;
                  // resultsDiv.appendChild(div);
                  
                  listingsMap.set(id, { listing, div: document.createElement("div") , searchIndexes: [searchIndex] });
                  // const div = document.createElement("div");
                  // div.innerHTML = listing.html;
                  // resultsDiv.appendChild(div);
                }
                else {
                  listingsMap.get(id).searchIndexes.push(searchIndex)
                }
                renderListing(id)
              }
            })
    )
  ).then(
    () => {
      // const count = listingsMap.size
      const count = resultsDiv.childElementCount
      resultsDiv.insertAdjacentHTML('beforebegin', `<h2>${count} results</h2>`)
    }
  )

  for (const url of searches) {

    const newTab = await chrome.tabs.create({ url: url, active: false })
    console.log({ newTab })

    chrome.scripting.executeScript({
      target: { tabId: newTab.id },
      // function: scrapeResults,
      function: worker,
      args: [closeTabsBtn.checked]
    },
      ([{ result: { listings, nextBtn } }]) => {
        console.log({ listings, nextBtn })
        if (nextBtn) {
          nextUrls.push(nextBtn)
        }

        for (const { id, title, url, price, html } of listings) {
          if (!listingsMap.has(id)) {
            // listingsMap.set(id, { id, title, url, price, html });
            listingsMap.set(id, true);
            const div = document.createElement("div");
            div.innerHTML = `<a href="${url}" target="_blank">${title}</a> - ${price}`;
            resultsDiv.appendChild(div);

            // const div = document.createElement("div");
            // div.innerHTML = listing.html;
            // resultsDiv.appendChild(div);
          }
        }
      })

  }
}


function worker(closeTab) {


  function scrapeResults() {
    const listings = [];
    // const { log } = console

    // log('run1', document.querySelectorAll('div[itemprop="itemListElement"]').length)
    document.querySelectorAll('div[itemprop="itemListElement"]').forEach((item) => {

      const id = item.querySelector('meta[itemprop="url"]').getAttribute('content').split('/').pop().split('?').at(0)
      const title = item.querySelector('meta[itemprop="name"]').getAttribute('content');
      const url = 'https://' + item.querySelector('meta[itemprop="url"]').getAttribute('content');
      const priceElement = item.querySelector('[data-testid="price-availability-row"]');
      const priceText = priceElement?.innerText.split('\n')
      const price = priceElement ? priceElement.innerText.split('\n')[0].trim() : 'N/A';
      listings.push({ id, title, url, price, html: item.outerHTML, priceText });
    });
    return {
      listings,
      nextBtn: document.querySelector('a[aria-label="Next"]')?.href

    };
  }




  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const elements = document.querySelectorAll('div[itemprop="itemListElement"]');
      const nextBtn = document.querySelector('a[aria-label="Next"]');
      if (elements.length && nextBtn) {
        setTimeout(() => {
          observer.disconnect();
          resolve(scrapeResults());
        }, 1000 * .5)
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // אם האלמנטים כבר קיימים בזמן התחלת ההאזנה
    const elements = document.querySelectorAll('div[itemprop="itemListElement"]');
    if (elements && elements.length > 0) {
      observer.disconnect();
      resolve(scrapeResults());
    }
  })

    .finally(() => closeTab && window.close())





  /* document.addEventListener('DOMContentLoaded', () => console.log('test', document.readyState))
  return new Promise((resolve) => {
    console.log(document.readyState)
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      resolve(scrapeResults());
    } else {
      document.addEventListener('DOMContentLoaded', () => resolve(scrapeResults()), { once: true });
    }
  }); */
}
// document.getElementById("openOptions").addEventListener("click", function() {
  chrome.runtime.openOptionsPage();
// })

/*
document.getElementById("searchForm").addEventListener("submit", function(event) {
  event.preventDefault();
  const location = document.getElementById("location").value;
  const dates = document.getElementById("dates").value.split(",");
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const tab = tabs[0];
    dates.forEach((date) => {
      const [checkin, checkout] = date.trim().split("-");
      const url = `https://www.airbnb.com/s/${location}/homes?checkin=${checkin}&checkout=${checkout}`;
      chrome.tabs.create({ url: url, active: false }, function(newTab) {
        chrome.scripting.executeScript({
          target: { tabId: newTab.id },
          func: scrapeResults,
        }, (injectionResults) => {
          injectionResults.forEach((result) => {
            const listings = result.result;
            listings.forEach((listing) => {
              const div = document.createElement("div");
              div.innerHTML = `<a href="${listing.url}" target="_blank">${listing.title}</a> - ${listing.price}`;
              resultsDiv.appendChild(div);
            });
          });
        });
      });
    });
  });
});

function scrapeResults() {
  console.log('scrapeResults called')
  // document.body.innerHTML = ''
  const listings = [];
  document.querySelectorAll("._8ssblpx").forEach((item) => {
    const title = item.querySelector("._bzh5lkq").innerText;
    const url = item.querySelector("a").href;
    const price = item.querySelector("._olc9rf0").innerText;
    listings.push({ title, url, price });
  });
  return listings;
}



*/
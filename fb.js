let filter = null;
let default_comment = "";
let remove_unwanted = "0";
let iconURL = chrome.runtime.getURL("icons/dark_download.svg");

function createFAB() {
  const fab = document.createElement("div");
  fab.classList.add("fb-scrapper-fab");

  const fabIcon = document.createElement("div");
  fabIcon.classList.add("fb-scrapper-fab-icon");

  fabIcon.style.backgroundImage = "url(" + iconURL + ")";

  fab.appendChild(fabIcon);

  fab.title = "Click to download data";

  fab.classList.add("hidden");

  const toggleVisibility = (visible) => {
    if (visible) {
      fab.classList.remove("hidden");
    } else {
      fab.classList.add("hidden");
    }
  };
  return { fab, toggleVisibility };
}

let loader = null;

function createLoader() {
  let loading = document.querySelector(".fb-scrapper-loader");
  console.log(loading);
  if (!loading) {
    loading = document.createElement("div");
    loading.classList.add("fb-scrapper-loading");
    document.body.append(loading);
  }

  loading.innerHTML = "";

  loading.classList.add("hide");

  const content = document.createElement("div");
  content.classList.add("fb-scrapper-loading-content");

  const opacity = document.createElement("div");
  opacity.classList.add("fb-scrapper-loading-opacity");

  content.innerText = "Scraping...";

  loading.appendChild(content);
  loading.appendChild(opacity);

  loader = loading;
}

function showLoading() {
  if (loader === null) {
    createLoader();
  }

  loader.classList.remove("hide");
}

function hideLoading() {
  if (loader === null) {
    createLoader();
  }

  loader.classList.add("hide");
}

let final = [];

let all_data = {};

function download() {
  let final_data = "name,content,phone,link\n";
  let temp;
  for (let link in all_data) {
    temp = all_data[link];
    final_data +=
      temp.name +
      ',"' +
      temp.data +
      '",' +
      (temp.phone_numbers || "") +
      "," +
      link +
      "\n";
  }

  const link = document.createElement("a");
  const data = new Blob([final_data], { type: "text/plain" });
  link.href = URL.createObjectURL(data);
  link.style.display = "none";
  link.target = "_blank";
  link.download = "fb-data.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

let logged_in = true;

const update_elems = (fab_visibility) => () => {
  if (!logged_in) {
    fab_visibility(false);
    return;
  }
  let elems = document.querySelectorAll(
    "div.du4w35lb.k4urcfbm.l9j0dhe7.sjgh65i0"
  );
  final = [];
  elems.forEach((e, i) => {
    let data = e.innerText;
    const see_more = e.querySelector(
      ".rq0escxv.l9j0dhe7.du4w35lb.sbcfpzgs > div > div:nth-child(2) > div > div:nth-child(3) div.lrazzd5p[role=button]"
    );
    if (see_more) {
      if (see_more.innerText.toLowerCase().replace(/\s/g, "") === "seemore") {
        see_more.click();
      }
    }
    let comment = e.querySelector("div.oo9gr5id[contenteditable]");
    const comment_btn = e.querySelector(
      ".rq0escxv.l9j0dhe7.du4w35lb.sbcfpzgs > div > div:nth-child(2) > div > div:nth-child(4) > div > div > div > div > div:nth-child(2) > div > div:nth-child(2)"
    );
    if (comment_btn) {
      comment_btn.onclick = () => {
        let k = setInterval(() => {
          comment = e.querySelector("div.oo9gr5id[contenteditable]");
          if (comment) {
            clearInterval(k);
            navigator.clipboard.writeText(default_comment).then(() => {
              comment.parentElement.querySelector(".m9osqain").innerText =
                "Press Ctrl + V to paste default comment";
            });
          }
        }, 100);
      };
    }
    if (comment) {
      comment.onfocus = () => {
        navigator.clipboard.writeText(default_comment).then(() => {
          comment.parentElement.querySelector(".m9osqain").innerText =
            "Press Ctrl + V to paste default comment";
        });
      };
    }

    if (data.toLowerCase().match(filter)) {
      e.classList.add("highlight");
      try {
        let link = e.querySelectorAll("a")[3].href.split("?")[0];
        data = e.querySelector(
          ".rq0escxv.l9j0dhe7.du4w35lb.sbcfpzgs > div > div:nth-child(2) > div > div:nth-child(3)"
        ).innerText;
        let name = e.querySelector(
          ".rq0escxv.l9j0dhe7.du4w35lb.sbcfpzgs > div > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(1) > span > h2"
        ).innerText;
        name = name.split("with")[0];
        name = name.split("from")[0];
        name = name.split("on")[0];
        name = name.split("at")[0];
        name = name.split("shared")[0];
        name = name.split("is")[0];
        name = name.split(/\s$/)[0];

        let phone_numbers = data.replace(/(\s|\n)/g);
        phone_numbers = phone_numbers.match(/\d{10}/g);

        if (phone_numbers) {
          phone_numbers = phone_numbers.join(" ");
        }

        all_data[link] = { data, name, phone_numbers };
      } catch (err) {
        alert(
          "Looks like you are not logged in to facebook, please login to continue."
        );
        fab_visibility(false);
        logged_in = false;
        return;
      }

      final.push(e);
    } else if (remove_unwanted === "1") {
      e.remove();
    }
  });
  const k = Object.keys(all_data);
  if (k.length > 0) {
    fab_visibility(true);
  } else {
    fab_visibility(false);
  }
};

function onload(callback, data) {
  callback(data);
}

function init(data) {
  if (data) {
    let final_filter = data.filter;
    if (final_filter) {
      final_filter = final_filter.split(",");
      final_filter = final_filter.map((e) => e.replace(/\s$/, "", e));
      final_filter = final_filter.map((e) => "(" + e + ")");
      final_filter = final_filter.join("|");
      filter = new RegExp(final_filter, "gi");
    } else {
      storage.set({
        settings: {
          filter: "load,container,required",
        },
      });
      filter = /(load)|(container)|(required)/;
    }
    default_comment = data.fdc || "";
    remove_unwanted = data.ru || "0";
  } else {
    storage.set(
      {
        settings: {
          filter: "load,container,required",
        },
      },
      () => {
        filter = /(load)|(container)|(required)/;
      }
    );
  }

  const body = document.querySelector("body");
  const { fab, toggleVisibility } = createFAB();
  body.appendChild(fab);

  window.onscroll = update_elems(toggleVisibility);

  fab.onclick = download;
}

storage.get("settings", (data) => {
  onload(init, data.settings);
});

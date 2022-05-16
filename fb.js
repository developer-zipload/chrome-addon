let filter = null;
let default_comment = "";
let remove_unwanted = "0";
let iconURL = chrome.runtime.getURL("icons/dark_download.svg");
let pdIiconURL = chrome.runtime.getURL("icons/pd_dark_download.svg");

function createDownloadFAB() {
  const downloadFab = document.createElement("div");
  downloadFab.classList.add("fb-scrapper-fab");

  const fabIcon = document.createElement("div");
  fabIcon.classList.add("fb-scrapper-fab-icon");

  fabIcon.style.backgroundImage = "url(" + iconURL + ")";

  downloadFab.appendChild(fabIcon);

  downloadFab.title = "Click to download data";

  downloadFab.classList.add("hidden");

  const toggleVisibility = (visible) => {
    if (visible) {
      downloadFab.classList.remove("hidden");
    } else {
      downloadFab.classList.add("hidden");
    }
  };
  return { downloadFab, toggleVisibility };
}

function createPhoneDownloadFab() {
  const phoneDownloadFab = document.createElement("div");
  phoneDownloadFab.classList.add("fb-scrapper-fab-pd");

  const fabIcon = document.createElement("div");
  fabIcon.classList.add("fb-scrapper-fab-icon");

  fabIcon.style.backgroundImage = "url(" + pdIiconURL + ")";

  phoneDownloadFab.appendChild(fabIcon);

  phoneDownloadFab.title = "Click to download all phone numbers";

  phoneDownloadFab.classList.add("hidden");

  const togglePDVisibility = (visible) => {
    if (visible) {
      phoneDownloadFab.classList.remove("hidden");
    } else {
      phoneDownloadFab.classList.add("hidden");
    }
  };
  return { phoneDownloadFab, togglePDVisibility };
}

let loader = null;

function createLoader(msg) {
  let loading = document.querySelector(".fb-scrapper-loader");
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

  content.innerText = msg || "Scraping...";

  loading.appendChild(content);
  loading.appendChild(opacity);

  loader = loading;
}

function showLoading(msg = null) {
  if (loader === null) {
    createLoader(msg);
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
    if (temp.comment.length > 0) {
      temp.comment.forEach((e) => {
        let phone_numbers = e.comment.replace(/(\s|\n)/g);
        phone_numbers = phone_numbers.match(/\d{10}/g);
        final_data +=
          e.by +
          ',"' +
          e.comment +
          '",' +
          ((phone_numbers && phone_numbers.join(" ")) || "") +
          "," +
          link +
          "\n";
      });
    }
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

function highlightPhone(container) {
  container.innerHTML = container.innerHTML
    .replace(/([\s\>\<])+(\d{1,10})+\s+(\d{1,10})+([\s\>\<])/g, "$1$2$3$4")
    .replace(
      /([\s\n\>\<])+(\d{10})+([\>\<\s\n])/g,
      '$1<span class="highlight_phone">$2</span>$3'
    );
}

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
    let see_more = e.querySelector(
      ".rq0escxv.l9j0dhe7.du4w35lb.sbcfpzgs > div > div:nth-child(2) > div > div:nth-child(3) div.lrazzd5p[role=button]"
    );
    const have_see_more = see_more !== null;
    if (see_more) {
      if (see_more.innerText.toLowerCase().replace(/\s/g, "") === "seemore") {
        see_more.click();
      }
    }
    let comment = e.querySelector("div.oo9gr5id[contenteditable]");
    const comments = e.querySelectorAll(
      ".rq0escxv.l9j0dhe7.du4w35lb.sbcfpzgs > div > div:nth-child(2) > div > div:nth-child(4) > div > div > div:nth-child(2) > ul > li"
    );
    let comments_data = [];

    if (comments) {
      comments.forEach((c) => {
        let cmnt = c.querySelector(
          "div > div:nth-child(1) > div:nth-child(2) > div > div > div > div > div >div > div"
        );
        let cmnt_by = c.querySelector(
          "div > div:nth-child(1) > div:nth-child(2) > div > div > div > div > div >div > span"
        )?.innerText;

        let cmnt_see_more = cmnt?.querySelector(
          "div > div:nth-child(1) > div:nth-child(2) > span div[role=button]"
        );

        if (cmnt_see_more) {
          cmnt_see_more.click();
        }

        cmnt = cmnt?.innerText;

        if (cmnt?.match(filter)) {
          c.classList.add("highlight_comment");
          comments_data.push({
            comment: cmnt,
            by: cmnt_by,
          });
        }
      });
    }

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
        );
        let name = e.querySelector(".knvmm38d")?.innerText;

        if (name) {
          name = name.split("with")[0];
          name = name.split("from")[0];
          name = name.split("on")[0];
          name = name.split("shared")[0];
          name = name.split("is")[0];
          name = name.split(/\s$/)[0];
        } else {
          name = "";
        }

        let phone_numbers = data.innerText.replace(/(\s|\n)/g);
        phone_numbers = phone_numbers.match(/\d{10}/g);

        if (!data.querySelector(".highlight_phone") && !have_see_more) {
          highlightPhone(data);
        } else if (have_see_more) {
          let k = setInterval(() => {
            if (!see_more) {
              highlightPhone(
                e.querySelector(
                  ".rq0escxv.l9j0dhe7.du4w35lb.sbcfpzgs > div > div:nth-child(2) > div > div:nth-child(3)"
                )
              );
              clearInterval(k);
            }
            see_more = e.querySelector(
              ".rq0escxv.l9j0dhe7.du4w35lb.sbcfpzgs > div > div:nth-child(2) > div > div:nth-child(3) div.lrazzd5p[role=button]"
            );
          }, 100);
        }

        data = data.innerText;

        if (phone_numbers) {
          phone_numbers = phone_numbers.join(" ");
        }

        all_data[link] = { data, name, phone_numbers, comment: comments_data };
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

function downloadPhoneNumbers() {
  let data = document.querySelector("div[role=feed]");

  if (!data) return;

  data = data.innerText
    .replace(/(\d{1,10})+\s+(\d{1,10})/g, "$1$2")
    .match(/\d{10}/g);

  if (data?.length === 0) return;

  showLoading("Extracting phone numbers...");

  let final_data = "Phone\n";

  data.forEach((e) => {
    final_data += e + "\n";
  });

  const link = document.createElement("a");
  data = new Blob([final_data], { type: "text/plain" });
  link.href = URL.createObjectURL(data);
  link.style.display = "none";
  link.target = "_blank";
  link.download = "fb-phone-data.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  hideLoading();
}

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
  const { downloadFab, toggleVisibility } = createDownloadFAB();
  const { phoneDownloadFab, togglePDVisibility } = createPhoneDownloadFab();
  body.appendChild(downloadFab);
  body.appendChild(phoneDownloadFab);

  window.onscroll = update_elems(toggleVisibility);

  downloadFab.onclick = download;

  phoneDownloadFab.onclick = downloadPhoneNumbers;
}

storage.get("settings", (data) => {
  onload(init, data.settings);
});

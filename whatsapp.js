let filter = null;
let remove_unwanted = "0";
let default_comment = "";
let iconURL =
  chrome?.runtime?.getURL && chrome?.runtime?.getURL("icons/dark_download.svg");

if (document.body.classList.contains("dark")) {
  iconURL = chrome.runtime.getURL("icons/light_download.svg");
}

let all_data = {};

function create_fab() {
  let fab = document.querySelector(".whatsapp_fab");
  if (!fab) {
    fab = document.createElement("div");
    fab.classList.add("whatsapp_fab");
    document.body.append(fab);
  }

  fab.innerHTML = "";
  fab.classList.add("hidden");

  const fab_icon = document.createElement("div");
  fab_icon.classList.add("whatsapp_fab_icon");

  if (iconURL) {
    fab_icon.style.backgroundImage = "url(" + iconURL + ")";
  } else {
    fab_icon.innerText = "🔻";
  }

  fab_icon.title = "Click to download data";

  fab.append(fab_icon);

  const toggleVisibility = (visible) => {
    if (visible) {
      fab.classList.remove("hidden");
    } else {
      fab.classList.add("hidden");
    }
  };

  return { fab, toggleVisibility };
}

function download() {
  let final_data = "name,phone,content\n";
  for (let key in all_data) {
    let temp = all_data[key];
    const phone_numbers = temp.phone_numbers || "";
    final_data += temp.by + "," + phone_numbers + ',"' + temp.data + '"\n';
  }

  const link = document.createElement("a");
  const data = new Blob([final_data], { type: "text/plain" });
  link.href = URL.createObjectURL(data);
  link.style.display = "none";
  link.target = "_blank";
  link.download = "whatsapp-data.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

let last_by = null;

const update_elems = (fab_visibility) => () => {
  const messages = document.querySelectorAll("#main > div div.message-in");

  messages.forEach((e, i) => {
    let by = e.querySelector(
      "div:nth-child(1) div:nth-child(2) div:nth-child(1) div[role]"
    );
    let content = e.querySelectorAll(
      "div:nth-child(1) div:nth-child(1) .copyable-text"
    );

    if (!by) {
      by = e.querySelector("div:nth-child(1) > div:nth-child(1)");
    }

    by = by.innerText;

    content = content[content.length - 1];

    if (
      by.split(/\n+(\d{1,2})+:+(\d{1,2})+\s+(am|pm)/g)[0] === content?.innerText
    ) {
      by = last_by;
    } else {
      last_by = by.replace(/\n/g, " ");
    }

    by = by.replace(/\n/g, " ");

    if (content) {
      content = content.innerText;

      if (content.match(filter)) {
        e.classList.add("highlight");
        let phone_numbers = content.replace(/(\s|\n)/g);
        phone_numbers = phone_numbers.match(/\d{10}/g);
        all_data[i] = { data: content, phone_numbers, by: by };
      } else {
        if (remove_unwanted === "1") {
          e.remove();
        }
      }
    }
  });

  if (Object.keys(all_data).length > 0) {
    fab_visibility(true);
  }
};
function init() {
  all_data = {};
  const { fab, toggleVisibility } = create_fab();

  const msg_box = document.querySelector("#main ._1UWac div:nth-child(2)");
  const msg_box_placeholder = document.querySelector(
    "#main ._1UWac div:nth-child(1)"
  );

  msg_box.onfocus = () => {
    navigator.clipboard.writeText(default_comment).then(() => {
      msg_box_placeholder.innerText = "Press Ctrl + V to paste default message";
    });
  };

  document.querySelector("#main > div div:nth-child(3)").onscroll =
    update_elems(toggleVisibility);

  fab.onclick = download;

  let y = setInterval(() => {
    if (!document.querySelector("#main > div div:nth-child(3)").onscroll) {
      clearInterval(y);
      onload(init);
    }
  });
}

function onload(callback) {
  let main;

  let k = setInterval(() => {
    main = document.querySelector("#main");
    if (main) {
      clearInterval(k);
      callback();
    }
  });
}

onload(init);

storage.get("settings", (data) => {
  data = data.settings;
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
    default_comment = data.wdc || "";
    remove_unwanted = data.ru || "0";
  } else {
    console.log("Test");
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

  onload(init);
});

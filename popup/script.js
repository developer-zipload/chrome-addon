const storage = {};

storage.set = (obj, callback) => {
  chrome.storage.sync.set(obj, callback);
};

storage.get = (key, callback) => {
  chrome.storage.sync.get(key, callback);
};

function save(data) {
  storage.set({ settings: data }, () => {
    const success = document.querySelector(".success");
    success.classList.remove("hidden");
    setTimeout(() => {
      success.classList.add("hidden");
    }, 2500);
  });
}

function removeError(input) {
  let error = input.querySelector("p.error");
  if (error) {
    input.classList.remove("error");
  }
}

function showError(input, msg) {
  let error = input.querySelector("p.error");
  if (!error) {
    error = document.createElement("p");
    error.classList.add("error");
    input.appendChild(error);
  }
  error.innerText = msg;
  input.classList.add("error");

  function removeError() {
    input.classList.remove("error");
  }

  return removeError;
}

function init(data) {
  const inputs = document.querySelectorAll(".input");
  const checkboxes = document.querySelectorAll(".checkbox");
  const saveBtn = document.querySelector("button.save");

  inputs.forEach((e) => {
    let input = e.querySelector("input");
    let label = e.querySelector("label");
    let val = undefined;
    if (data) {
      val = data[label.getAttribute("for")];
    }

    if (!input) {
      input = e.querySelector("textarea");
      if (!input) {
        input = e.querySelector("div");
        if (val) {
          input.innerText = val;
        }
      }
    }

    if (
      (!val || val?.replace(/\s/g, "") === "") &&
      label.getAttribute("for") === "filter"
    ) {
      input.value = "load,container,required";
      input.innerText = "load,container,required";
      label.classList.add("float");
    }

    if (val) {
      input.value = val;
      label.classList.add("float");
    }

    input.onfocus = () => {
      label.classList.add("float");
    };

    input.onblur = () => {
      if (input.value === "" || input.innerText === "") {
        label.classList.remove("float");
      }
    };
  });

  checkboxes.forEach((e) => {
    const checkbox = e.querySelector("input");
    const label = e.querySelector("label");
    let val = "0";
    if (data) {
      val = data[label.getAttribute("for")];
    }

    if (val === "1") {
      checkbox.checked = true;
    } else {
      checkbox.checked = false;
    }
  });

  saveBtn.onclick = () => {
    let finalData = {};

    inputs.forEach((e) => {
      let input = e.querySelector("input");
      let val = null;

      if (input) {
        val = input.value;
      } else {
        input = e.querySelector("textarea");
        if (input) {
          val = input.value;
        } else {
          input = e.querySelector("div");
          if (input) {
            val = input.innerText;
          }
        }
      }
      let label = e.querySelector("label");
      const key = label.getAttribute("for");
      finalData[key] = val;
    });

    checkboxes.forEach((e) => {
      const checkbox = e.querySelector("input");
      const label = e.querySelector("label");
      const key = label.getAttribute("for");
      const val = checkbox.checked ? "1" : "0";
      finalData[key] = val;
    });

    if (finalData.filter.match(/,$/)) {
      showError(
        document.querySelector("#filter").parentElement,
        "Filter cannot end with a comma"
      );
    } else if (finalData.filter.replace(/\s\n$/, "") === "") {
      showError(
        document.querySelector("#filter").parentElement,
        "Filter cannot be empty"
      );
    } else {
      removeError(document.querySelector("#filter").parentElement);
      finalData.filter = finalData.filter.replace(/\n/g, " ");
      save(finalData);
    }
  };
}

storage.get("settings", (data) => {
  init(data.settings);
});

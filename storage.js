const storage = {};

storage.set = (obj, callback) => {
  chrome.storage.sync.set(obj, callback);
};

storage.get = (key, callback) => {
  chrome.storage.sync.get(key, callback);
};

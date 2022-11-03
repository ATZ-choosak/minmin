const yt = require("yt-search");

const get = async (text) => {
  let data = await yt(text);
  let title = data.all[0].title;
  let url = data.all[0].url;
  return { title, url };
};

module.exports = get;

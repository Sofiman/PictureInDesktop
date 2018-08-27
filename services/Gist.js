module.exports = {
  category: 'Experimental',
  getStreamURL: function getStreamURL(inputURL) {
      const regex = /^((?:https?:)?\/\/)?((www\.)?gist\.)((?:github\.com))\/.*\/[a-f0-9]*(?:[#?]*.*)$/;
      let result = undefined;

      if(regex.test(inputURL)){
        let url = regex.exec(inputURL)[0].replace(/#.*$/, '').replace(/\?.*$/, '');
        if(url.indexOf('.js') < 0) url += '.js';
        result = `data:text/html,<script src="${url}"></script>`;
      }
      return result
  },
  darkMode: true
};
